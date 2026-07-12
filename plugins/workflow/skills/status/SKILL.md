---
name: status
description: >
  Overview of tracked work. Default: a decision-oriented summary of the CURRENT
  repo's board (in progress, next up, batchable now, blockers ranked by unblock
  value). With "all": a one-line-per-repo table across every repo that has
  workflow/ folders. Use when the user says "/workflow:status", "board status",
  "what should I work on", "what's blocked", or "status across my projects".
  Read-only; never edits, moves, or commits.
---

# Status

Two modes. Read-only — never edit, move, or commit. Point at `/workflow:framework-check` for inconsistencies.

## Default (no arg): current-repo overview

Turn this repo's board into a decision, not a dump. If there's no `workflow/` here, route to `/workflow:framework-init` and stop.

1. **Read the board**: run `./workflow/status` (done is hidden by default — you don't need it here). Fall back to listing `workflow/<section>/*.md` if the script is missing. The output already carries what you need: `priority:` order, `depends:` edges (met = `depends: N ✓`, unmet = `(waits: N)`), blocked `gate:` lines.
2. **Build the dependency picture** from the `depends:` annotations: which ready tasks are runnable now (no `waits:`), which wait on what, and where each awaited id sits (done/blocked/draft/in-progress).
3. **Write the overview** in these sections, tight — ids + titles, no raw section-by-section echo:
   - **In progress** — active tasks. Flag any that look stale (uncommitted move, or older than the newest done).
   - **Next up** — the top few runnable Ready tasks in priority order (skip ones with unmet `waits:`). This is what `/workflow:work` would pick.
   - **Batchable now** — the set `/workflow:batch-work auto` would run: runnable Ready tasks, deps-before-dependents. Note which are mutually independent (could parallelize) vs a forced chain.
   - **Blocked & waiting** — `blocked/` tasks with their `gate:`, plus Ready tasks stuck on an unmet `depends:`. For each, name what it waits on and where that sits.
   - **Highest-value unblocks** — rank each blocker (a blocked `gate:`, or an undone dependency) by how many downstream tasks clearing it would free (direct + transitive over the `depends:` edges). Recommend the one or two worth clearing first, with the count. A blocker that frees nothing downstream is low value even if it looks urgent.
4. **Close** with a one-line recommendation: the single next action (run task N, groom the empty queue, clear gate X to free M tasks).

Keep the whole thing scannable. If the board is tiny, collapse empty sections to a word.

## `all`: cross-repo summary

Scan `~/work/*/workflow/` plus the current repo for the status-folder layout (or use paths given after `all`). One row per repo:

```markdown
| Repo | In progress | Next ready | Blocked | Done (7d) |
|------|-------------|------------|---------|-----------|
| rift-drifter | 051 — Title | 052 — Title (+4) | 1 (gate: …) | 3 |
```

Next ready = lowest `priority:` runnable task in `ready/`. Done (7d) = `done/` files with a `done:` date in the last 7 days (call `./workflow/status --done all` to get the dates). Follow the table with a few bullets on anything that needs attention: stale in-progress, empty Ready queues, gates that look satisfiable, cross-repo pileups.

Keep it to the table + a few bullets. No edits, no commits.
