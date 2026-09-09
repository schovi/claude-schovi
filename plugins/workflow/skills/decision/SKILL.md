---
name: decision
description: >
  Append a decision record with a stable D<N> handle to the repo's decision
  log. Use when the user says "/workflow:decision", "log this decision",
  "record why we chose X", or when /workflow:run surfaces a choice a future
  agent might plausibly flip. Skip for choices that die with the task.
---

# Decision

Append-only decision log with stable `D<N>` handles, referenced from code comments, task files, and docs.

1. **Locate the log.** The repo's instructions name it (root `AGENTS.md` Work tracking section, or `workflow/AGENTS.md`); default `docs/decisions.md` (index) plus `docs/decisions/d<N>-<slug>.md` (entries). None configured: ask whether to create the default layout.
2. **Next handle**: highest existing `D<N>` + 1.
3. **Write the entry** in the directory named by the index path minus `.md`:

```markdown
# D<N> — Title

- **Context**: the situation forcing a choice, 2–4 lines
- **Options**: the real alternatives, one line each
- **Choice**: what was picked
- **Rationale**: why, including tradeoffs accepted
- **Revisit when**: the observable condition that reopens this
```

4. **Index**: one row (handle, title, date, link) in the index table.
5. **Commit**: ride along with the current task's work when invoked mid-task; standalone, `decision: D<N> <title>`.

Reference the handle where the decision bites: `// D12: …` in code, `D12` in task Notes.
