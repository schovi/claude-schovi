# Workflow

A task-board work framework for solo/hobby repos, shared as a plugin so every repo runs the same loop instead of maintaining its own copy of groom/work skills. Dual-runtime: Claude Code and Codex use the same skill files.

## The model

**A task is one file. Its status is the folder it sits in.** Moving work through the board is a `git mv`, never an edit:

```
workflow/
├── AGENTS.md          # repo contract (see below)
├── TEMPLATE.md        # task file template
├── status             # executable board view: ./workflow/status
├── next-task-id       # monotonic ID counter
├── draft/             # groom before pickup
├── ready/             # ordered queue — priority: line, lowest = next
├── in-progress/
├── blocked/           # each file names its gate:
├── done/              # completed tasks, done: date — this IS the archive
└── reports/           # batch-work reports
```

Task file format — first line is the identity, metadata lines sit under it, only what the current folder needs:

```markdown
# 054 — Seeded RNG

priority: 20            # ready/ only; sparse (10, 20, 30), lowest = next
depends: 041, 043       # optional; task IDs that must reach done/ first
gate: upstream API v2   # blocked/ only; an observable fact
done: 2026-07-10        # added on completion

## What & why
## Spec
## Acceptance criteria   # required to leave draft/
## Notes                 # never an execution log — git history is
```

No YAML frontmatter, no status written inside the file, no board file to keep in sync. Board view: `./workflow/status` (`--done N|all` for history depth).

## Lifecycle

```
idea ──/groom──> draft/ ──spec + priority──> ready/ ──/work──> in-progress/ ──done gate──> done/
                                └─gate:──> blocked/
```

- **`/workflow:groom [id]`** — mint an ID, interview the user until intent is clear, write the spec into the file, `git mv` to `ready/` (with a sparse `priority:`) or `blocked/` (with a `gate:`). Prefers slicing work into independently-deliverable tasks; when a real cross-task dependency remains, flags it with a `depends:` line. One commit per groom session.
- **`/workflow:work [id]`** — take the arg or the top Ready task (lowest priority, ties by ID). Refuses to start if the task's `depends:` aren't all in `done/`. Read the contract-routed docs, plan in chat, implement in `task NNN:` commits, validate per the contract, run the **acceptance-verifier gate**, then one atomic completion commit: `done:` date + move to `done/` + doc sync. The in-progress move stays uncommitted until then — fewer tracker commits by design.
- **`/workflow:batch-work [ids|count|auto]`** — Ready tasks sequentially in isolated subagents, clean-tree gate between tasks, stop-on-failure, report in `workflow/reports/`. `auto` selects the batch from the `depends:` graph (runnable tasks only, ordered deps-before-dependents, unsatisfiable tasks dropped and reported) so you don't hand-pick or hand-order.
- **`/workflow:status`** — combined read-only view across every repo with a `workflow/`.
- **`/workflow:decision`** — append a `D<N>` record to the repo's decision log.
- **`/workflow:framework-init`** — scaffold all of the above in a fresh repo (folders + `.gitkeep`s, status script, contract pre-filled by repo inspection, AGENTS.md routing).
- **`/workflow:framework-check`** — deterministic validation (bundled zero-dependency `validate_workflow.py`; exit 0 valid / 1 issues / 2 legacy-or-missing) plus guided migration of legacy layouts: markdown boards (`docs/board.md`), M-number IDs (active tasks renumbered, archives/tags untouched), superseded repo-local groom/work skills, Codex agent parity. Reports first, applies on approval, re-runnable.

Codex invocation: `use $groom`, `use $work`, etc.

## The contract

Skills carry the invariant process; each repo declares only its variable facts in `workflow/AGENTS.md`:

- project one-liner (used to brief subagents)
- validation commands (targeted + full gate)
- verify mapping (touched paths → repo-local verify skills)
- doc routing (path → doc leaf to read before editing)
- decision log location, local notes

Swapping where status lives (say, to GitHub Issues someday) would touch the skills' bookkeeping steps only — the loop, contract, and doc routing survive.

## Subagent

| Agent | Purpose |
|-------|---------|
| `workflow:acceptance-verifier:acceptance-verifier` | Fresh-context adversarial check before the completion commit: tries to falsify each acceptance criterion against the diff, evidence per verdict, PASS/FAIL/UNVERIFIABLE per criterion, `ready`/`not ready` overall. Report-only, max 800 tokens. `/work` requires `ready` to finish; `/batch-work` records the verdict per task |

## Install

```bash
# Claude Code
/plugin marketplace add ~/work/claude-schovi
/plugin install workflow@schovi-workflows

# Codex
codex plugin marketplace add ~/work/claude-schovi
```

Then per repo: `/workflow:framework-init` (fresh) or `/workflow:framework-check` (existing tracker to migrate).

## Rules the framework enforces

- Status lives in exactly one place — the folder. The validator rejects `status:` lines and frontmatter in task files.
- Fewer tracker commits: groom = one commit per session; the in-progress move rides in the completion commit; completion is atomic (`task NNN:` prefix, done move + docs + tests in one commit). No git tags, no phase artifacts.
- Never gate a commit on a piped test run.
- Task files are specs, not execution logs — git history is the execution log.
- A task is done only when its acceptance criteria survive the adversarial gate.
- Tasks are sliced to deliver independently where possible; a real cross-task dependency is declared with `depends:` and `/work` refuses to start until it's in `done/`.
