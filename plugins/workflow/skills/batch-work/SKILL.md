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
/workflow:batch-work auto       # all runnable Ready tasks, auto-ordered by depends: (deps before dependents)
/workflow:batch-work 3          # first three Ready tasks
/workflow:batch-work 184,185    # named Ready tasks, in the given order
```

Only tasks in `workflow/ready/` are eligible. A Ready task with an unresolved question in its file is also ineligible — report it and stop before execution instead of guessing.

A task with a `depends:` line runs only after its dependencies reach `done/`. `/work` enforces this at pickup and stops if a dependency is unmet, which trips stop-on-failure. So a batch must run dependencies-first (a dependency runs earlier than the task that needs it). The `auto` mode does this ordering for you; the other modes don't, so order those yourself or let the gate catch a bad order.

**`auto` selection** — build the batch from the `depends:` graph instead of a hand-picked list:

1. Candidates = every task in `workflow/ready/`.
2. A candidate is *runnable* when each id in its `depends:` is already in `workflow/done/` or is another candidate in this batch. Drop a candidate whose dependency sits in `draft/`, `blocked/`, `in-progress/`, or doesn't exist — it can't be satisfied by this run.
3. Order with Kahn's algorithm: repeatedly emit the runnable candidate whose deps are all done-or-already-emitted, breaking ties by lowest `priority:` then lowest id. A `depends:` cycle among candidates leaves tasks unemittable — drop them.
4. List every dropped task in the plan with the blocking reason (unsatisfiable dep NNN in `<folder>`, or dependency cycle). `auto` with nothing runnable stops with that report instead of running an empty batch.

Everything downstream (isolated subagent per task, clean-tree gate between tasks, stop-on-failure, report) is identical to the other modes.

## Preconditions

1. `git status --porcelain` — if it prints anything, stop and report the dirty paths. Do not stash, reset, clean, or commit the existing worktree.
2. Run the bundled validator: `python3 <plugin>/skills/framework-check/scripts/validate_workflow.py` (resolve `<plugin>` via `${CLAUDE_PLUGIN_ROOT}`, or relative to this skill file). Stop if the framework is inconsistent.
3. Read `workflow/AGENTS.md` (contract) and the Ready queue (`./workflow/status`). Selection by mode: no arg → priority order (lowest `priority:` first, ties by id); `auto` → the runnable, dependency-ordered set from **`auto` selection** above; explicit IDs → the given order, all must be in `ready/`.
4. Print the plan before starting: ordered task id + title, any tasks `auto` dropped and why, report path. Reports go to `workflow/reports/batch-<YYYY-MM-DD>.md`; append `-2`, `-3`, … when the path exists.

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
Dropped (auto): 187 (dep 190 in draft/)   # omit the line when nothing was dropped

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
