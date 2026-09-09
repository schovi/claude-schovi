---
name: status
description: >
  Show a decision-oriented overview of the workflow/ board in the current repo,
  or a one-line-per-repo table with "all". Always use when the user explicitly
  invokes "/workflow:status" or "use $status", including with a follow-up
  question (a tag scope, what can run in parallel, what a chain waits on).
  When a workflow/ board exists in this initialized repo, also use for an
  unmistakable question about that board's queue, progress, dependencies, or
  gates. Do not use for generic project-status questions unrelated to that
  board. Read-only; never edits, moves, commits, or initializes the framework.
---

# Status

Read-only. No `workflow/` here: say so and stop; the user can run `/workflow:framework-init` explicitly.

If the invocation carries a question, read the board the same way and answer that question instead of the full overview.

## Default: current repo

1. Run `./workflow/status` (fall back to `ls workflow/*/`). It shows `priority:` order, `depends:` state (`✓` met, `waits: N` unmet), `gate:` lines, `#tags`, and a Worktrees section when a sibling worktree has a task in flight.
2. Write a short overview:
   - **In progress**, including work in flight in another worktree
   - **Next up**: the top runnable Ready tasks, what `/workflow:run` would pick
   - **Batchable now**: what `/workflow:run auto` would run, and which units are independent
   - **Blocked and waiting**: `gate:` tasks and Ready tasks with unmet `depends:`, each with what it waits on
   - **Highest-value unblocks**: the blocker that frees the most downstream tasks
3. Close with one recommended next action.

Collapse empty sections to a word.

## `all`: across repos

Discover repos with a `workflow/` layout under `~/work/*` (or the paths given after `all`), plus the current repo. Read their `workflow/<status>/*.md` files directly; run only the current repo's `status` script.

```markdown
| Repo | In progress | Next ready | Blocked | Done (7d) |
|------|-------------|------------|---------|-----------|
| rift-drifter | 051 — Title | 052 — Title (+4) | 1 (gate: …) | 3 |
```

Follow with a few bullets on what needs attention: stale in-progress, empty queues, gates that look satisfiable.
