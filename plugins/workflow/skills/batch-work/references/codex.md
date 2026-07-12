# Codex dispatch adapter

Use this adapter only when `spawn_agent` and `wait_agent` are callable. The shared `batch-work` skill owns selection, ordering, worker requests, completion gates, and reporting.

For each unit:

1. Call `spawn_agent` with a unique lower-snake-case `task_name`, `fork_turns: "none"`, and the complete self-contained worker request from the shared skill as `message`.
2. Because no conversation turns are forked, the message must include the absolute repository path, the absolute sibling `../work/SKILL.md` path for normal task units, the unit id and kind, any validated dependency note, and the exact response schema.
3. Keep only one batch worker active. Use `wait_agent` until its final-status notification arrives, then consume only the separately delivered final structured response. A timeout or unrelated mailbox update is not completion; continue waiting. Agent failure or termination fails the unit.
4. Create a new agent for the next unit. Do not reuse an agent with `followup_task`. All units use the current repository worktree; do not create a separate worktree or run units in parallel.

The worker inherits the host's current sandbox and permissions because `spawn_agent` has no permission override. If either required tool is unavailable or a worker cannot start, stop before executing the unit and report the missing capability. Never run the unit inline.
