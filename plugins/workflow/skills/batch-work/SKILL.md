---
name: batch-work
description: >
  Run multiple Ready tasks from the repo's workflow/ status folders
  sequentially in isolated subagents, with a consolidated report. Use when the
  user asks to batch-run tasks, run work overnight, run the first N Ready
  tasks, or invokes /workflow:batch-work, /batch-work, or /batch.
---

# Batch Work

Run Ready tasks through `/workflow:work`, one isolated subagent at a time, in priority order. For unattended execution of already-groomed work, not for making product or design decisions.

## Usage

```text
/workflow:batch-work            # all Ready tasks, priority order
/workflow:batch-work 3          # first three Ready tasks
/workflow:batch-work 184,185    # named Ready tasks, in the given order
```

Only tasks in `workflow/ready/` are eligible. A Ready task with an unresolved question in its file is also ineligible — report it and stop before execution instead of guessing.

## Preconditions

1. `git status --porcelain` — if it prints anything, stop and report the dirty paths. Do not stash, reset, clean, or commit the existing worktree.
2. Run the bundled validator: `python3 <plugin>/skills/framework-check/scripts/validate_workflow.py` (resolve `<plugin>` via `${CLAUDE_PLUGIN_ROOT}`, or relative to this skill file). Stop if the framework is inconsistent.
3. Read `workflow/AGENTS.md` (contract) and the Ready queue (`./workflow/status`). Implicit selection follows priority order (lowest `priority:` first, ties by id); explicit IDs run in the given order but must all be in `ready/`.
4. Print the plan before starting: task id, title, report path. Reports go to `workflow/reports/batch-<YYYY-MM-DD>.md`; append `-2`, `-3`, … when the path exists.

## Execution

For each task, sequentially:

1. Spawn one isolated subagent with full context:

```text
Agent(
  prompt: "Run /workflow:work <id> in <repo path>. Read the workflow plugin's
  work skill, workflow/AGENTS.md (contract), the task file
  workflow/ready/<id>-*.md, and every doc leaf the contract routes for the
  touched paths — before code. Complete the full loop: validation, verify
  gates, the acceptance-verifier gate (a task is done only on a 'ready'
  verdict), doc sync, the move to workflow/done/ with a done: date, atomic
  completion commit prefixed 'task <id>:'. Return: final_status (done |
  failed | partial), acceptance_verdict, key_decisions, files_changed
  excluding task bookkeeping, validation, issues.",
  mode: "bypassPermissions",
  description: "Work task <id>"
)
```

2. Record the returned summary.
3. On success, require `git status --porcelain` to be empty before the next task. A dirty tree means the task is partial.
4. On failure or partial completion, stop the queue immediately. Preserve the worktree exactly as the subagent left it — never `git checkout`, `git reset`, `git clean`, or automatic rollback.
5. Mark every remaining task as not run in the report.

Sequential execution is required: later tasks may depend on earlier commits and all agents share one working directory.

## Report

Write the report even when the queue stops early, commit it (`batch-work: <date> report`), print its content, and end with its path:

```markdown
# Batch Run: YYYY-MM-DD

Tasks: 184, 185, 186

## Per task

### 184 — Title
- **Status**: done | failed | partial | not run
- **Acceptance verdict** / **Key decisions** / **Files changed** / **Validation** / **Issues**

## Overall

| Metric | Value |
|--------|-------|
| Completed | N/total |
| Failed or partial | N |
| Not run | N |

### Files touched by multiple tasks
### Needs manual review
Write `None` only when every task completed cleanly.
```

Codex: no isolated subagents — run the tasks sequentially inline in this session with the same stop-on-failure and clean-tree rules.
