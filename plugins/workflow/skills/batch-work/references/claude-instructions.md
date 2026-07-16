# Claude Code dispatch adapter

Use this adapter only when the `Agent` tool is callable. The shared `batch-work` skill owns selection, ordering, worker requests, completion gates, and reporting.

For each unit:

1. Call `Agent` in the foreground with `subagent_type: general-purpose`, a short description, and the complete self-contained worker request from the shared skill as its prompt. Foreground (blocking) only — never `run_in_background` for a batch worker; a backgrounded worker can notify completion after parking on a child subagent without ever emitting its structured return, which is the stall the shared skill's watchdog rule exists to catch.
2. Do not pass a permission mode. The worker inherits the host's current permissions.
3. Wait for the final result and return only its structured summary to the orchestrator. If the worker yields without a structured return, apply the shared skill's watchdog rule (resume the same worker once via `SendMessage` before treating it as a failure); do not spawn a fresh Agent for the same unit.
4. Create a new Agent for the next unit. All units use the current repository worktree; do not request worktree isolation or run units in parallel.

If `Agent` is unavailable or cannot start an isolated worker, stop before executing the unit and report the missing capability. Never run the unit inline.
