---
name: decision
description: >
  Append a decision record with a stable D<N> handle to the repo's decision
  log. Use when the user says "/workflow:decision", "log this decision",
  "record why we chose X", or when /workflow:work surfaces an A/B/X choice a
  future agent might plausibly flip. Skip for choices that die with the task.
---

# Decision

Append-only decision log with stable `D<N>` handles, referenced from code comments, task files, and docs.

1. **Locate the log**: the contract (`workflow/AGENTS.md` → Doc routing) names it; default `docs/decisions.md` (index) + `docs/decisions/d<N>-<slug>.md` (entries). Contract says "none"? Ask whether to create the default layout.
2. **Gate**: log only choices that outlive the task and that a future agent might plausibly flip. Task-local choices belong in the task file's Notes.
3. **Next handle**: highest existing `D<N>` + 1 (check the index and the entries directory).
4. **Write the entry** `docs/decisions/d<N>-<slug>.md`:

```markdown
# D<N> — Title

- **Context**: the situation forcing a choice, 2–4 lines
- **Options**: the real alternatives, one line each
- **Choice**: what was picked
- **Rationale**: why, including tradeoffs accepted
- **Revisit when**: the observable condition that reopens this
```

5. **Index**: add one row (handle, title, date, link) to the index table in the log file.
6. **Commit**: ride along with the current task's work when invoked mid-task; standalone invocations commit as `decision: D<N> <title>`.

Reference the handle where the decision bites: `// D12: …` in code, `D12` in task Notes.
