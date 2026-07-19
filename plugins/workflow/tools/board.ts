#!/usr/bin/env bun
/**
 * Cross-repo Kanban dashboard for the workflow/ task-board framework.
 *
 * Reads task files directly from every repo's workflow/ folders (the folder IS
 * the status), overlays live git-worktree state, and serves a single-page Kanban
 * at http://127.0.0.1:8787. Add drafts and edit/move draft & ready cards from the
 * UI; each write auto-commits in its repo. Open tabs live-update via SSE fed by a
 * filesystem watch on each workflow/ dir.
 *
 *   bunx github:schovi/claude-schovi                 # run straight from GitHub
 *   bun run board.ts [--port N] [--root DIR ...]     # local, default root: ~/work
 *   bun run board.ts --selftest                      # built-in checks
 *
 * Not a Trello: in-progress/blocked/done are read-only (those transitions are
 * /work and the acceptance gate, not file moves). Only draft<->ready moves and
 * body/priority edits happen here.
 */
import {
  readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync,
  rmSync, realpathSync, watch,
} from "node:fs";
import { join, basename } from "node:path";
import { homedir, tmpdir } from "node:os";

const SECTIONS = ["draft", "ready", "in-progress", "blocked", "done"] as const;
const EDITABLE = ["draft", "ready"];
const META = /^(priority|depends|gate|done):\s*(.+?)\s*$/;
const FILENAME = /^\d+-[a-z0-9][a-z0-9-]*\.md$/;
const enc = new TextEncoder();

function git(args: string[], cwd: string): string {
  const r = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe", timeout: 10000 });
  return r.exitCode === 0 ? r.stdout.toString() : "";
}

function realpath(p: string): string {
  try { return realpathSync(p); } catch { return p; }
}

function mdFiles(dir: string): string[] {
  try { return readdirSync(dir).filter((f) => f.endsWith(".md")).sort(); } catch { return []; }
}

function findRepos(roots: string[]): string[] {
  const repos: string[] = [];
  for (const root of roots) {
    let entries: string[];
    try { entries = readdirSync(root).sort(); } catch { continue; }
    for (const name of entries) {
      const repo = join(root, name);
      if (existsSync(join(repo, "workflow", "draft")) && !repos.includes(repo)) repos.push(repo);
    }
  }
  return repos;
}

function parseTask(path: string, section: string) {
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n");
  const title = lines.length ? lines[0].replace(/^#+/, "").trim() : basename(path);
  const meta: Record<string, string> = {};
  for (const line of lines.slice(1, 10)) {
    const m = META.exec(line.trim());
    if (m) meta[m[1]] = m[2];
  }
  const tid = /^(\d+)/.exec(basename(path));
  return {
    id: tid ? parseInt(tid[1], 10) : 0,
    title, section, meta,
    file: basename(path),
    body: text.replace(/\n+$/, ""),
  };
}

function sectionMap(repo: string): Record<number, string> {
  const map: Record<number, string> = {};
  for (const section of SECTIONS)
    for (const f of mdFiles(join(repo, "workflow", section))) {
      const m = /^(\d+)/.exec(f);
      if (m) map[parseInt(m[1], 10)] = section;
    }
  return map;
}

function worktreeFlags(repo: string): Record<number, string[]> {
  const others = git(["worktree", "list", "--porcelain"], repo).split("\n")
    .filter((l) => l.startsWith("worktree "))
    .map((l) => l.slice("worktree ".length));
  const here = sectionMap(repo);
  const flags: Record<number, string[]> = {};
  for (const wt of others) {
    if (realpath(wt) === realpath(repo) || !existsSync(join(wt, "workflow"))) continue;
    const there = sectionMap(wt);
    const dirty = new Set<number>();
    for (const line of git(["status", "--porcelain", "--", "workflow/"], wt).split("\n")) {
      const m = /workflow\/[\w-]+\/(\d+)/.exec(line.slice(3));
      if (m) dirty.add(parseInt(m[1], 10));
    }
    const name = basename(wt);
    for (const [tidStr, sect] of Object.entries(there)) {
      const tid = parseInt(tidStr, 10);
      const note: string[] = [];
      if (here[tid] !== sect) note.push(`${sect} in ${name}`);
      if (dirty.has(tid)) note.push(`edited in ${name}`);
      if (note.length) (flags[tid] ??= []).push(...note);
    }
  }
  return flags;
}

function buildBoard(repos: string[]) {
  return repos.map((repo) => {
    const wf = join(repo, "workflow");
    const doneIds = new Set<number>();
    for (const f of mdFiles(join(wf, "done"))) {
      const m = /^(\d+)/.exec(f);
      if (m) doneIds.add(parseInt(m[1], 10));
    }
    const flags = worktreeFlags(repo);
    const tasks: any[] = [];
    // ponytail: done included so the UI can reveal/search history. Reads every done
    // file each build; if a repo's history grows into the thousands, make done lazy.
    for (const section of SECTIONS) {
      for (const f of mdFiles(join(wf, section))) {
        const t: any = parseTask(join(wf, section, f), section);
        const deps = (t.meta.depends ?? "").split(",").map((s: string) => s.trim()).filter((s: string) => /^\d+$/.test(s));
        t.waits = deps.filter((d: string) => !doneIds.has(parseInt(d, 10)));
        t.worktree = flags[t.id] ?? [];
        t.repo = basename(repo);
        tasks.push(t);
      }
    }
    return { repo: basename(repo), path: repo, done: doneIds.size, tasks };
  });
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "task";
}

function resolveRepo(repos: string[], name: string): string {
  const repo = repos.find((r) => basename(r) === name);
  if (!repo) throw new Error(`unknown repo: ${name}`);
  return repo;
}

function createDraft(repo: string, title: string, what: string): string {
  const counter = join(repo, "workflow", "next-task-id");
  const nextId = parseInt(readFileSync(counter, "utf-8").trim(), 10);
  const padded = String(nextId).padStart(3, "0");
  const name = `${padded}-${slugify(title)}.md`;
  const path = join(repo, "workflow", "draft", name);
  writeFileSync(path,
    `# ${padded} — ${title}\n\n## What & why\n\n${what.trim()}\n\n` +
    `## Spec\n\n## Acceptance criteria\n\n- \n\n## Notes\n`);
  writeFileSync(counter, `${String(nextId + 1).padStart(3, "0")}\n`);
  git(["add", "--", path, counter], repo);
  git(["commit", "-m", `task ${padded}: add draft (dashboard)`, "--", path, counter], repo);
  return name;
}

function saveTask(repo: string, section: string, filename: string, body: string, toSection: string) {
  if (!EDITABLE.includes(section) || !EDITABLE.includes(toSection))
    throw new Error("dashboard only edits/moves draft and ready");
  if (!FILENAME.test(filename)) throw new Error(`bad filename: ${filename}`);
  if (!body.trimStart().startsWith("#")) throw new Error("task body must start with '# NNN — Title'");
  const src = join(repo, "workflow", section, filename);
  if (!existsSync(src)) throw new Error(`no such task: ${section}/${filename}`);
  const dst = join(repo, "workflow", toSection, filename);
  const paths = [src];
  if (toSection !== section) { git(["mv", src, dst], repo); paths.push(dst); }
  writeFileSync(dst, body.endsWith("\n") ? body : body + "\n");
  const tid = filename.split("-")[0];
  const verb = toSection !== section ? `move to ${toSection}` : "edit";
  git(["add", "--", ...paths], repo);
  git(["commit", "-m", `task ${tid}: ${verb} (dashboard)`, "--", ...paths], repo);
}

function serve(roots: string[], port: number) {
  const repos = findRepos(roots);
  if (!repos.length) {
    console.error(`No workflow repos found under: ${roots.join(", ")}`);
    process.exit(1);
  }
  const page = readFileSync(new URL("./board.html", import.meta.url), "utf-8");
  const clients = new Set<ReadableStreamDefaultController>();

  const broadcast = () => {
    const msg = enc.encode("data: reload\n\n");
    for (const c of clients) { try { c.enqueue(msg); } catch { clients.delete(c); } }
  };
  // One debounced broadcast for a burst of file events (a git mv is several).
  let timer: ReturnType<typeof setTimeout> | null = null;
  const onChange = () => { if (timer) clearTimeout(timer); timer = setTimeout(broadcast, 250); };
  for (const repo of repos) {
    try { watch(join(repo, "workflow"), { recursive: true }, onChange); }
    catch { /* watch unsupported here; the client's safety poll still refreshes */ }
  }

  Bun.serve({
    port, hostname: "127.0.0.1",
    async fetch(req) {
      const url = new URL(req.url);
      if (req.method === "GET" && url.pathname === "/")
        return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      if (req.method === "GET" && url.pathname === "/api/board")
        return Response.json(buildBoard(repos));
      if (req.method === "GET" && url.pathname === "/api/events") {
        let self: ReadableStreamDefaultController;
        const stream = new ReadableStream({
          start(c) { self = c; clients.add(c); c.enqueue(enc.encode(": connected\n\n")); },
          cancel() { clients.delete(self); },
        });
        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      }
      if (req.method === "POST") {
        try {
          const data: any = await req.json();
          const repo = resolveRepo(repos, data.repo);
          if (url.pathname === "/api/draft")
            return Response.json({ ok: true, file: createDraft(repo, String(data.title).trim(), data.what ?? "") });
          if (url.pathname === "/api/save") {
            saveTask(repo, data.section, data.file, data.body, data.to);
            return Response.json({ ok: true });
          }
        } catch (e: any) {
          return Response.json({ ok: false, error: e.message }, { status: 400 });
        }
      }
      return new Response("{}", { status: 404 });
    },
  });

  console.log(`workflow board: http://127.0.0.1:${port}  (${repos.length} repos)`);
  for (const repo of repos) console.log(`  - ${basename(repo)}`);
}

function assert(cond: any, msg: string) { if (!cond) throw new Error("selftest FAILED: " + msg); }

function selftest() {
  const tmp = mkdtempSync(join(tmpdir(), "wfboard-"));
  try {
    const repo = join(tmp, "demo");
    const wf = join(repo, "workflow");
    for (const s of SECTIONS) mkdirSync(join(wf, s), { recursive: true });
    writeFileSync(join(wf, "next-task-id"), "042\n");
    writeFileSync(join(wf, "ready", "041-existing.md"), "# 041 — Existing\n\npriority: 10\ndepends: 099\n");
    writeFileSync(join(wf, "done", "007-old.md"), "# 007 — Old\n\ndone: 2026-01-01\n");
    git(["init", "-q"], repo);
    git(["config", "user.email", "t@t"], repo);
    git(["config", "user.name", "t"], repo);
    git(["add", "-A"], repo);
    git(["commit", "-qm", "init"], repo);

    const repos = findRepos([tmp]);
    assert(repos.length === 1 && realpath(repos[0]) === realpath(repo), "findRepos");

    const board = buildBoard(repos)[0];
    assert(board.done === 1, "done count");
    assert(board.tasks.some((t: any) => t.section === "done" && t.id === 7), "done task in board");
    const ready = board.tasks.find((t: any) => t.section === "ready");
    assert(ready.meta.priority === "10", "priority");
    assert(JSON.stringify(ready.waits) === JSON.stringify(["099"]), "waits " + ready.waits);

    const name = createDraft(repo, "New Thing!", "because reasons");
    assert(name === "042-new-thing.md", "draft name " + name);
    assert(existsSync(join(wf, "draft", name)), "draft file");
    assert(readFileSync(join(wf, "next-task-id"), "utf-8").trim() === "043", "counter bump");

    const body = readFileSync(join(wf, "draft", name), "utf-8").replace("## Notes", "priority: 30\n\n## Notes");
    saveTask(repo, "draft", name, body, "ready");
    assert(existsSync(join(wf, "ready", name)) && !existsSync(join(wf, "draft", name)), "move");
    assert(git(["status", "--porcelain"], repo).trim() === "", "clean after commit");

    let rejected = false;
    try { saveTask(repo, "ready", name, body, "done"); } catch { rejected = true; }
    assert(rejected, "reject move to done");
    rejected = false;
    try { saveTask(repo, "ready", "../evil.md", body, "ready"); } catch { rejected = true; }
    assert(rejected, "reject traversal");

    console.log("selftest ok");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--selftest")) { selftest(); return; }
  let port = 8787;
  const roots: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--port") port = parseInt(argv[++i], 10);
    else if (argv[i] === "--root") roots.push(argv[++i]);
  }
  serve(roots.length ? roots : [join(homedir(), "work")], port);
}

main();
