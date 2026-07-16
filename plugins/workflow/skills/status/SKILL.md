---
name: status
description: >
  Show a decision-oriented overview of tracked workflow-board work in the
  current repo, or a one-line-per-repo table with "all". Use when the user
  explicitly invokes "/workflow:status" or "use $status". When
  workflow/AGENTS.md exists, also use for an unmistakable question about that
  board's queue, progress, dependencies, or gates. Do not use for generic
  project-status or work-prioritization questions. Read-only; never edits,
  moves, commits, or initializes the framework.
---

# Status

Two modes. Read-only — never edit, move, or commit. Point at `/workflow:framework-doctor` for inconsistencies.

## Default (no arg): current-repo overview

Turn this repo's board into a decision, not a dump. If there's no `workflow/` here, report that this repo has no workflow board and stop. The user can explicitly invoke `/workflow:framework-init` (`use $framework-init` in Codex) if they want one; never invoke it automatically.

1. **Read the board**: run `./workflow/status` (done is hidden by default — you don't need it here). Fall back to listing `workflow/<section>/*.md` if the script is missing. The output already carries what you need: `priority:` order, `depends:` edges (met = `depends: N ✓`, unmet = `(waits: N)`), blocked `gate:` lines, and a `Worktrees` section (only when other git worktrees exist) flagging tasks that sit in a different section or have uncommitted edits in a sibling worktree — that is live work this checkout's folders don't yet show.
2. **Build the dependency picture** from the `depends:` annotations: which ready tasks are runnable now (no `waits:`), which wait on what, and where each awaited id sits (done/blocked/draft/in-progress).
3. **Write the overview** in these sections, tight — ids + titles, no raw section-by-section echo:
   - **In progress** — active tasks. Fold in anything from the `Worktrees` section: a task is in flight if it's `in-progress` or has uncommitted edits in a sibling worktree, even when this checkout still files it under Ready. Flag any that look stale (uncommitted move, or older than the newest done). When recommending the next action, don't send someone to a task already being worked in a worktree.
   - **Next up** — the top few runnable Ready tasks in priority order (skip ones with unmet `waits:`). This is what `/workflow:work` would pick.
   - **Batchable now** — the set `/workflow:batch-work auto` would run: runnable Ready tasks, deps-before-dependents. Note which are mutually independent (could parallelize) vs a forced chain.
   - **Blocked & waiting** — `blocked/` tasks with their `gate:`, plus Ready tasks stuck on an unmet `depends:`. For each, name what it waits on and where that sits.
   - **Highest-value unblocks** — rank each blocker (a blocked `gate:`, or an undone dependency) by how many downstream tasks clearing it would free (direct + transitive over the `depends:` edges). Recommend the one or two worth clearing first, with the count. A blocker that frees nothing downstream is low value even if it looks urgent.
4. **Close** with a one-line recommendation: the single next action (run task N, groom the empty queue, clear gate X to free M tasks).

Keep the whole thing scannable. If the board is tiny, collapse empty sections to a word.

## `all`: cross-repo summary

Discover repos under the configured roots (default `~/work/*`, plus the current repo; or the paths given after `all`) that have a `workflow/` status layout. **Read each repo's `workflow/<section>/*.md` files directly — don't execute other repos' `./workflow/status` scripts; only the current repo's shipped script is trusted.** One row per repo:

```markdown
| Repo | In progress | Next ready | Blocked | Done (7d) |
|------|-------------|------------|---------|-----------|
| rift-drifter | 051 — Title | 052 — Title (+4) | 1 (gate: …) | 3 |
```

Next ready = lowest `priority:` runnable task in `ready/`. Done (7d) = `workflow/done/*.md` files whose `done:` date is within the last 7 days. Follow the table with a few bullets on anything that needs attention: stale in-progress, empty Ready queues, gates that look satisfiable, cross-repo pileups.

Keep it to the table + a few bullets. No edits, no commits.
