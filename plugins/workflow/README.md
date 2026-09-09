# Workflow

A minimal task-board framework for solo/hobby repos, shared as a plugin so every repo runs the same lifecycle. The plugin ships the board model and the lifecycle; each repo's own instructions (`AGENTS.md`/`CLAUDE.md`) own how work is validated, documented, and committed. Dual-runtime: Claude Code and Codex use the same skill files.

## The model

**A task is one file. Its status is the folder it sits in.** Moving work through the board is a `git mv`, never an edit:

```
workflow/
├── TEMPLATE.md        # task file template
├── status             # board view: ./workflow/status
├── draft/             # groom before pickup
├── ready/             # ordered queue: priority: line, lowest = next
├── in-progress/
├── blocked/           # each file names its gate:
├── done/              # done: date; this is the archive
└── reports/           # orchestrated run reports
```

Task file: first line is the identity, metadata lines under it, only what the current folder needs:

```markdown
# 054 — Seeded RNG

priority: 20            # ready/ only; sparse, lowest = next
depends: 041, 043       # optional; tasks that should ship first
tags: rng, engine       # optional; lowercase slugs for grouping
model: sonnet           # optional; cheaper tier for run's isolated worker
gate: upstream API v2   # blocked/ only; an observable fact
done: 2026-07-10        # added on completion

## What & why
## Spec
## Acceptance criteria
## Notes
```

No frontmatter, no status inside the file, no board file to sync. `./workflow/status` prints the board (`--done N|all`, `--tag NAME`, `--tags`, `--next-id`). Task ids are derived from files, sibling worktrees, and git history, so there is no counter to conflict on.

## Lifecycle

```
idea ──/groom──> draft/ ──spec + priority──> ready/ ──/run──> in-progress/ ──> done/
                                └─gate:──> blocked/
```

| Skill | What it does |
|-------|--------------|
| `/workflow:groom [id]` | Mint an id, ask until intent is clear, write the spec, move to `ready/` (with `priority:`), `blocked/` (with `gate:`), or keep in `draft/` with open questions. Capture mode turns exploration findings into tasks |
| `/workflow:run [ids\|count\|auto\|"ask"]` | One entry point for doing work. One task runs in this context: move to `in-progress/`, implement the way the repo's instructions say, check acceptance criteria, one completion commit into `done/`. Several tasks run one isolated worker each, deps before dependents, stop on failure, report in `workflow/reports/`. A free-text ask is matched against the board, new work is groomed into tasks, overlapping tasks merge, then it runs. `--auto` skips the plan preview |
| `/workflow:status [all]` | Decision-oriented overview of this repo's board, or one row per repo |
| `/workflow:decision` | Append a `D<N>` record to the repo's decision log |
| `/workflow:framework-init` | Scaffold `workflow/` and point the root `AGENTS.md` at the board. Explicit only |
| `/workflow:framework-doctor` | Health check plus a guides wizard: offers the plugin's optional working guides for adoption into the repo's instructions. Adopting nothing is fine |

Codex: `use $groom`, `use $run`, etc.

Skill discovery is conservative. Invoke workflow skills explicitly by default. `run`, `groom`, and `status` may be selected implicitly only when the current repo has a `workflow/` board and the request unmistakably refers to it. `framework-init` never runs as a missing-framework fallback.

## Repo instructions, not plugin rules

The skills read the repo's own instructions and follow them. What to validate before done, which docs to read, commit style, when to stop and ask: all of that is the repo's call. The plugin only asks for a `## Work tracking` section in the root `AGENTS.md` that points at the board.

The rules earlier versions enforced (validation gate, fresh-context acceptance check, readiness gate, commit conventions, doc routing, dependency gate, and more) live in `skills/framework-doctor/references/guides.md`. Run `/workflow:framework-doctor` to adopt any of them into a repo, or none.

## Dashboard (cross-repo board)

A single-file Bun/TypeScript web server that renders every repo's board as one Kanban. It reads the `workflow/` folders directly and overlays live git-worktree state; no database, no config.

```bash
bunx github:schovi/claude-schovi                 # run straight from GitHub
bunx github:schovi/claude-schovi --port 9000     # custom port
bun run plugins/workflow/tools/board.ts          # local checkout
```

Then open http://127.0.0.1:8787. Defaults to scanning `~/work/*`; pass `--root DIR` (repeatable) to scan elsewhere. Requires [Bun](https://bun.sh).

- **Columns** `draft / ready / in-progress / blocked / done`; done collapsed to a count with a **show all** toggle.
- **Filter** by repo chip, tag chips (AND), and a text box over titles and ids.
- **Card detail** as rendered markdown; draft/ready cards have an **Edit** button.
- **Sort** by id or by `priority:`.
- **State is the URL**: `?repo=&tags=&q=&sort=priority&done=1&task=repo/59`.
- **Badges**: `priority:`, `waits: NNN`, `gate:`, `#tag`, worktree flag.
- **Write** is narrow: add a draft, edit a draft/ready card, edit `priority:`, move draft↔ready. Each write auto-commits (`task NNN: … (dashboard)`).
- **Live updates** over SSE, with toasts and optional desktop notifications.

Self-check: `bun run plugins/workflow/tools/board.ts --selftest`.

## Install

```bash
# Claude Code
/plugin marketplace add ~/work/claude-schovi
/plugin install workflow@schovi-workflows

# Codex
codex plugin marketplace add ~/work/claude-schovi
```

Then per repo: `/workflow:framework-init` (fresh), and `/workflow:framework-doctor` after a plugin upgrade or whenever you want to revisit which guides the repo adopts.
