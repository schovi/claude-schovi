#!/usr/bin/env bun
/**
 * Cross-repo Kanban dashboard for the workflow/ task-board framework.
 *
 * Reads task files directly from every repo's workflow/ folders (the folder IS
 * the status). A task can also exist in a git worktree in a different folder; the
 * authoritative state is the most recently committed occurrence, so a worktree that
 * moved a task forward wins over an unmerged main, and an uncommitted move there
 * wins over everything. Serves a single-page Kanban
 * at http://127.0.0.1:8787. Cards open as rendered markdown; draft & ready ones flip
 * to a raw editor on demand, and drafts can be added from the UI. Each write
 * auto-commits in its repo. All view state (repo, tags, text filter, card order, done
 * toggle, open card) lives in the query string, so a board view is a shareable link. Open tabs live-update via SSE fed by a
 * filesystem watch on every workflow/ dir, worktrees included, re-synced after each
 * board build; a client-side safety poll backs it up.
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
  rmSync, realpathSync, statSync, watch, type FSWatcher,
} from "node:fs";
import { join, basename } from "node:path";
import { homedir, tmpdir } from "node:os";

const SECTIONS = ["draft", "ready", "in-progress", "blocked", "done"] as const;
const EDITABLE = ["draft", "ready"];
const META = /^(priority|depends|tags|gate|done):\s*(.+?)\s*$/;
const FILENAME = /^\d+-[a-z0-9][a-z0-9-]*\.md$/;
const enc = new TextEncoder();

function git(args: string[], cwd: string, env?: Record<string, string>): string {
  const r = Bun.spawnSync(["git", ...args], {
    cwd, stdout: "pipe", stderr: "pipe", timeout: 10000,
    ...(env ? { env: { ...process.env, ...env } } : {}),
  });
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

// Newest commit time (unix seconds) that touched each task file, in one git walk.
// A `git mv` between status folders is a commit touching that id, so this dates the
// task's *last state change* in this location. Used to pick which location wins.
function taskTimestamps(loc: string): Record<number, number> {
  const ts: Record<number, number> = {};
  let cur = 0;
  for (const line of git(["log", "--format=@%ct", "--name-only", "--", "workflow/"], loc).split("\n")) {
    if (line.startsWith("@")) { cur = parseInt(line.slice(1), 10); continue; }
    const m = /workflow\/[\w-]+\/(\d+)/.exec(line);
    if (m) { const id = parseInt(m[1], 10); if (!(id in ts)) ts[id] = cur; }
  }
  return ts;
}

// Task ids with uncommitted changes under workflow/ in this checkout. A /work run
// stages the `git mv` long before it commits, so without this the move is invisible.
function dirtyTaskIds(loc: string): Set<number> {
  const ids = new Set<number>();
  for (const line of git(["status", "--porcelain", "--", "workflow/"], loc).split("\n")) {
    const m = /workflow\/[\w-]+\/(\d+)/.exec(line.slice(3));
    if (m) ids.add(parseInt(m[1], 10));
  }
  return ids;
}

function mtimeSeconds(path: string): number {
  try { return statSync(path).mtimeMs / 1000; } catch { return 0; }
}

function worktreesOf(repo: string): string[] {
  return git(["worktree", "list", "--porcelain"], repo).split("\n")
    .filter((l) => l.startsWith("worktree "))
    .map((l) => l.slice("worktree ".length))
    .filter((wt) => realpath(wt) !== realpath(repo) && existsSync(join(wt, "workflow")));
}

type TaskState = { section: string; path: string; origin: string | null; ts: number };

// A task can exist in the main checkout and in each worktree, in different status
// folders. The authoritative state is the most recently committed occurrence: a
// worktree that moved the task forward (e.g. ready -> done) has a newer commit than
// main, so it wins even though main hasn't merged yet. Commit time, not mtime:
// `git worktree add` stamps every file with the checkout time, which would make a
// stale worktree falsely win. Tie -> main, so an untouched worktree never overrides.
// An uncommitted move outranks any commit time: it is the newest state that exists.
// `seen` collects every workflow/ dir consulted, so the server can keep its
// filesystem watches in step with worktrees appearing and disappearing.
function resolveStates(repo: string, seen?: Set<string>): Record<number, TaskState> {
  const locations = [{ path: repo, origin: null as string | null }]
    .concat(worktreesOf(repo).map((wt) => ({ path: wt, origin: basename(wt) as string | null })));
  const best: Record<number, TaskState> = {};
  for (const loc of locations) {
    // realpath: git reports worktrees resolved, findRepos doesn't — key watches on one form.
    seen?.add(realpath(join(loc.path, "workflow")));
    const ts = taskTimestamps(loc.path);
    const dirty = dirtyTaskIds(loc.path);
    for (const section of SECTIONS)
      for (const f of mdFiles(join(loc.path, "workflow", section))) {
        const m = /^(\d+)/.exec(f);
        if (!m) continue;
        const id = parseInt(m[1], 10);
        const path = join(loc.path, "workflow", section, f);
        const when = dirty.has(id) ? Infinity : (ts[id] ?? mtimeSeconds(path));
        const prev = best[id];
        if (!prev || when > prev.ts || (when === prev.ts && loc.origin === null))
          best[id] = { section, path, origin: loc.origin, ts: when };
      }
  }
  return best;
}

function buildBoard(repos: string[], seen?: Set<string>) {
  return repos.map((repo) => {
    const states = resolveStates(repo, seen);
    const doneIds = new Set<number>();
    for (const [id, s] of Object.entries(states)) if (s.section === "done") doneIds.add(parseInt(id, 10));
    // ponytail: done included so the UI can reveal/search history. Reads every done
    // file each build; if a repo's history grows into the thousands, make done lazy.
    const tasks: any[] = Object.values(states).map((s) => {
      const t: any = parseTask(s.path, s.section);
      const deps = (t.meta.depends ?? "").split(",").map((x: string) => x.trim()).filter((x: string) => /^\d+$/.test(x));
      t.waits = deps.filter((d: string) => !doneIds.has(parseInt(d, 10)));
      t.tags = (t.meta.tags ?? "").split(",").map((x: string) => x.trim()).filter(Boolean);
      t.worktree = s.origin ? [`via ${s.origin}`] : [];
      t.repo = basename(repo);
      return t;
    });
    tasks.sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) || a.id - b.id);
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

// Next free task id, derived instead of stored. Three sources, because no single one
// is enough across worktrees: task files here, task files in every sibling worktree
// (uncommitted drafts included), and every id ever committed under workflow/ on any
// ref (merged elsewhere, renamed, or living only on a branch this checkout can't
// see). Mirrors `workflow/status --next-id`; a stored counter conflicts on every
// merge and still hands the same number to two worktrees minting in parallel.
function nextTaskId(repo: string): number {
  const ids = new Set<number>();
  for (const loc of [repo, ...worktreesOf(repo)])
    for (const section of SECTIONS)
      for (const f of mdFiles(join(loc, "workflow", section))) {
        const m = /^(\d+)/.exec(f);
        if (m) ids.add(parseInt(m[1], 10));
      }
  for (const line of git(["log", "--all", "--name-only", "--pretty=format:", "--", "workflow/"], repo).split("\n")) {
    const m = /^workflow\/[\w-]+\/(\d+)/.exec(line);
    if (m) ids.add(parseInt(m[1], 10));
  }
  return Math.max(0, ...ids) + 1;
}

function createDraft(repo: string, title: string, what: string): string {
  const padded = String(nextTaskId(repo)).padStart(3, "0");
  const name = `${padded}-${slugify(title)}.md`;
  const path = join(repo, "workflow", "draft", name);
  writeFileSync(path,
    `# ${padded} — ${title}\n\n## What & why\n\n${what.trim()}\n\n` +
    `## Spec\n\n## Acceptance criteria\n\n- \n\n## Notes\n`);
  git(["add", "--", path], repo);
  git(["commit", "-m", `task ${padded}: add draft (dashboard)`, "--", path], repo);
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

  // Watch every workflow/ dir the last build consulted — main checkouts and worktrees
  // alike, since a /work run moves task files inside a worktree. The set is re-synced
  // after each build, so a worktree added or removed mid-session is picked up.
  const watchers = new Map<string, FSWatcher>();
  const syncWatches = (dirs: Set<string>) => {
    for (const [dir, w] of watchers) if (!dirs.has(dir)) { w.close(); watchers.delete(dir); }
    for (const dir of dirs) {
      if (watchers.has(dir)) continue;
      try {
        const w = watch(dir, { recursive: true }, onChange);
        // A removed worktree kills its watcher; drop it instead of crashing the server.
        w.on("error", () => { w.close(); watchers.delete(dir); });
        watchers.set(dir, w);
      } catch { /* watch unsupported here; the client's safety poll still refreshes */ }
    }
  };

  const board = (): any[] => {
    const dirs = new Set<string>();
    const data = buildBoard(repos, dirs);
    syncWatches(dirs);
    return data;
  };
  board();  // seed the watches before the first request

  Bun.serve({
    port, hostname: "127.0.0.1",
    async fetch(req) {
      const url = new URL(req.url);
      if (req.method === "GET" && url.pathname === "/")
        return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      if (req.method === "GET" && url.pathname === "/api/board")
        return Response.json(board());
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
  // The card renderer lives in the page's DOM-free `<script id="md">` block; eval it
  // here so a regex regression fails the selftest instead of only looking wrong in a tab.
  const mdSrc = /<script id="md">([\s\S]*?)<\/script>/.exec(
    readFileSync(new URL("./board.html", import.meta.url), "utf-8"))?.[1];
  assert(mdSrc, "board.html has a <script id=\"md\"> block");
  const render: (s: string) => string = new Function(mdSrc + "\nreturn md")();
  assert(render("# 041 — T") === "<h1>041 — T</h1>", "md heading: " + render("# 041 — T"));
  assert(render("- [ ] a\n- [x] b") ===
    '<ul>\n<li><input type="checkbox" disabled> a</li>\n<li><input type="checkbox" disabled checked> b</li>\n</ul>',
    "md checkboxes: " + render("- [ ] a\n- [x] b"));
  assert(render("see `src/a.ts:12`") === "<p>see <code>src/a.ts:12</code></p>", "md code span: " + render("see `x`"));
  assert(render('<img src=x onerror="1">').startsWith("<p>&lt;img"), "md escapes html: " + render("<img>"));

  const tmp = mkdtempSync(join(tmpdir(), "wfboard-"));
  try {
    const repo = join(tmp, "demo");
    const wf = join(repo, "workflow");
    for (const s of SECTIONS) mkdirSync(join(wf, s), { recursive: true });
    writeFileSync(join(wf, "ready", "041-existing.md"), "# 041 — Existing\n\npriority: 10\ndepends: 099\ntags: api, ui\n");
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
    assert(JSON.stringify(ready.tags) === JSON.stringify(["api", "ui"]), "tags " + ready.tags);

    const name = createDraft(repo, "New Thing!", "because reasons");
    assert(name === "042-new-thing.md", "draft name " + name);
    assert(existsSync(join(wf, "draft", name)), "draft file");

    const body = readFileSync(join(wf, "draft", name), "utf-8").replace("## Notes", "priority: 30\n\n## Notes");
    saveTask(repo, "draft", name, body, "ready");
    assert(existsSync(join(wf, "ready", name)) && !existsSync(join(wf, "draft", name)), "move");
    assert(git(["status", "--porcelain"], repo).trim() === "", "clean after commit");

    // A worktree that moves a task forward (ready -> done) with a newer commit wins
    // over main, which still has it in ready. Forced dates keep the comparison
    // deterministic instead of relying on same-second commit ordering.
    const wt = join(tmp, "demo-wt");
    git(["branch", "feat"], repo);
    git(["worktree", "add", "-q", wt, "feat"], repo);
    git(["mv", "workflow/ready/041-existing.md", "workflow/done/041-existing.md"], wt);
    const future = { GIT_AUTHOR_DATE: "2030-01-01T00:00:00", GIT_COMMITTER_DATE: "2030-01-01T00:00:00" };
    git(["commit", "-qm", "task 041: done", "-a"], wt, future);
    const b2 = buildBoard(repos)[0];
    const t41 = b2.tasks.find((t: any) => t.id === 41);
    assert(t41.section === "done", "worktree state wins: " + t41.section);
    assert(t41.worktree[0] === "via demo-wt", "worktree origin badge: " + t41.worktree);
    assert(b2.tasks.filter((t: any) => t.id === 41).length === 1, "task 41 not duplicated across locations");

    // An uncommitted move in the worktree (staged `git mv`, the state /work leaves
    // behind mid-task) wins too — commit times are equal there, so a tie would
    // otherwise hand the task back to main.
    mkdirSync(join(wt, "workflow", "in-progress"), { recursive: true });  // empty dirs aren't in git
    git(["mv", "workflow/done/041-existing.md", "workflow/in-progress/041-existing.md"], wt);
    const b3 = buildBoard(repos)[0];
    const t41d = b3.tasks.find((t: any) => t.id === 41);
    assert(t41d.section === "in-progress", "uncommitted worktree move wins: " + t41d.section);
    assert(t41d.worktree[0] === "via demo-wt", "worktree origin badge (dirty): " + t41d.worktree);

    // An id must never be handed out twice, and neither of these is visible to a
    // counter file in this checkout: a task minted (even uncommitted) in a worktree,
    // and a task whose file no longer exists anywhere but is in some ref's history.
    mkdirSync(join(wt, "workflow", "draft"), { recursive: true });
    writeFileSync(join(wt, "workflow", "draft", "050-in-worktree.md"), "# 050 — In worktree\n");
    assert(nextTaskId(repo) === 51, "next id sees an uncommitted worktree task: " + nextTaskId(repo));
    git(["add", "-A"], wt);
    git(["commit", "-qm", "task 050: add"], wt, future);
    git(["rm", "-q", "workflow/draft/050-in-worktree.md"], wt);
    git(["commit", "-qm", "drop 050"], wt, future);
    assert(nextTaskId(repo) === 51, "next id still counts an id only history remembers: " + nextTaskId(repo));

    // The server watches exactly the dirs a build consulted, so worktrees must be in there.
    const dirs = new Set<string>();
    buildBoard(repos, dirs);
    assert(dirs.has(realpath(wf)) && dirs.has(realpath(join(wt, "workflow"))), "watch targets: " + [...dirs]);
    git(["worktree", "remove", "--force", wt], repo);
    const after = new Set<string>();
    buildBoard(repos, after);
    assert(!after.has(realpath(join(wt, "workflow"))), "removed worktree drops out of watch targets");

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
