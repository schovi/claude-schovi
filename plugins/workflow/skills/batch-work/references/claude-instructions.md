# Claude Code dispatch adapter

Use this adapter only when the `Agent` tool is callable. The shared `batch-work` skill owns selection, ordering, worker requests, completion gates, and reporting.

For each unit:

1. Call `Agent` with `subagent_type: general-purpose`, a short description, and the complete self-contained worker request from the shared skill as its prompt. Pass `model` only when the unit's plan entry records a tier; otherwise omit it so the worker inherits the host's model.
2. **Pass exactly two async-shaping arguments, both negative: no `name`, and `run_in_background: false`.** These are the only settings that make the worker's final message arrive as the tool result. `name` turns the worker into an addressable teammate — a peer session, not a subagent: the call stops blocking, the tool result is a spawn acknowledgement, and the worker's structured return goes to its own session and is lost. A teammate only signals that it went idle. `run_in_background: true` fails differently but just as fatally: completion is notified, the return is not delivered inline. Neither mode has a return channel a batch can read, so neither is usable here regardless of what a recovery step elsewhere seems to suggest.
3. Do not pass a permission mode. The worker inherits the host's current permissions.
4. The call blocks; its result is the worker's structured summary. Return only that to the orchestrator. If the result is anything else — a spawn acknowledgement, an interruption, an error — the dispatch was malformed, not the worker: apply the shared skill's dispatch-failure rule.
5. Create a new Agent for the next unit. All units use the current repository worktree; do not request worktree isolation or run units in parallel.

If `Agent` is unavailable or cannot start an isolated worker, stop before executing the unit and report the missing capability. Never run the unit inline.
