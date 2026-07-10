---
name: status
description: >
  Show a combined work-status view across every repo that has workflow/ status
  folders. Use when the user says "/workflow:status", "board status", "what's
  in progress across my projects", or asks for a cross-repo overview of
  tracked work. Read-only; never edits or commits.
---

# Status

One combined view over all boards. Read-only.

1. **Find boards**: use the paths given as arguments; otherwise scan `~/work/*/workflow/` plus the current repo for the status-folder layout.
2. **Read each board**: run the repo's own `./workflow/status` when present (it prints all sections); otherwise list the status folders directly (first line of each file is `# NNN — Title`; `priority:`/`gate:`/`done:` lines carry the rest).
3. **Print one table**:

```markdown
| Repo | In progress | Next ready | Blocked | Done (7d) |
|------|-------------|------------|---------|-----------|
| rift-drifter | 051 — Title | 052 — Title (+4) | 1 (gate: …) | 3 |
```

Next ready = lowest `priority:` in `ready/`, ties by id. Done (7d) = files in `done/` with a `done:` date in the last 7 days.

Follow the table with anything that needs attention: stale in-progress tasks (uncommitted move or older than the newest done), empty Ready queues, blocked gates that look satisfiable.

Keep it to the table + a few bullets. No edits, no commits, no fixing — point to `/workflow:framework-check` for inconsistencies.
