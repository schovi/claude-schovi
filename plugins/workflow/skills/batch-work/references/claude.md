# Claude Code dispatch adapter

Use this adapter only when the `Agent` tool is callable. The shared `batch-work` skill owns selection, ordering, worker requests, completion gates, and reporting.

For each unit:

1. Call `Agent` in the foreground with `subagent_type: general-purpose`, a short description, and the complete self-contained worker request from the shared skill as its prompt.
2. Do not pass a permission mode. The worker inherits the host's current permissions.
3. Wait for the final result and return only its structured summary to the orchestrator.
4. Create a new Agent for the next unit. All units use the current repository worktree; do not request worktree isolation or run units in parallel.

If `Agent` is unavailable or cannot start an isolated worker, stop before executing the unit and report the missing capability. Never run the unit inline.
