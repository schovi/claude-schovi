---
name: batch-work
description: >
  Run multiple Ready tasks from the repo's workflow/ status folders
  sequentially in isolated subagents, with a consolidated report. Use when the
  user asks to batch-run tasks, run work overnight, run the first N Ready
  tasks, or invokes /workflow:batch-work, /batch-work, or /batch.
---

# Batch Work

Run Ready tasks through `/workflow:work`, one isolated subagent at a time, in dependency-then-priority order. For unattended execution of already-groomed work, not for making product or design decisions.

## Main context is the orchestrator

The main context plans and dispatches; it never does task work itself. Keep it token-thin — a long batch must not fill the orchestrator's context with specs, diffs, and code.

- **Does**: cheap shell (`git status`, the validator, `./workflow/status`), computes the batch order and dependency plan from that output, dispatches subagents, records each subagent's *condensed* return, writes the report.
- **Never**: opens task files, doc leaves, source, or diffs; reads a spec to work out an implementation. Every token-heavy step happens *inside* a subagent and comes back as a short summary. If you catch the orchestrator reading a `.md` task body or a source file, that work belongs in a subagent.

Role decomposition already happens one level down, inside each worker's `/work` loop: it runs validation, spawns the independent `acceptance-verifier` subagent for the acceptance gate, and delegates bounded find/summarize/test-generation to the repo agents the contract names — all in the worker's isolated context, invisible to the orchestrator. Keep it there. Do **not** add orchestrator-level role agents (a separate validator, reviewer, etc.); that work belongs in the worker, and pulling it up here refills the context the isolation exists to protect.

## Runtime adapter

Batch work requires context-isolated workers that share the current repository worktree. Select exactly one dispatch adapter by callable capability:

1. If `spawn_agent` and `wait_agent` are available, read `references/codex-instructions.md`.
2. Otherwise, if the `Agent` tool is available, read `references/claude-instructions.md`.
3. Otherwise stop before execution and report that this runtime cannot provide isolated workers.

Never infer the runtime from `.claude/` or `.codex/` files because both can coexist. Load only the selected adapter. The adapter owns dispatch and waiting; this file owns every workflow decision and worker request. Dispatch one fresh worker per unit, wait for its final response, run the shared completion gates, then dispatch the next unit.

Workers inherit the host's current permissions. Never request a permission override, reuse a worker for another unit, create a separate worktree, or run a unit inline.

**Unattended by default.** batch-work never pauses for confirmation. The queue advances on each worker's structured return and stops only on `failed`/`partial` (Execution step 3) or an empty/blocked plan. Workers apply `/work`'s fix-and-continue rule — resolve a routine blocker in place when the root cause is proven and the repair is local, reversible, and in scope (a lockfile-present dependency, a stale locator/snapshot/fixture, an unused port offset) — and return `failed`/`partial`/`needs_regroom` rather than asking when the cause is uncertain or multiple outcomes are valid.

**Permissions must be pre-granted by the host.** Workers inherit the host session's permissions and the skill never requests an override. An unattended batch assumes the session already allows what the work needs — file edits, the contract's build/test/verify commands, and any Chrome-MCP driving for UI acceptance. If those aren't granted up front, workers block on prompts and the batch stalls; grant them at launch, not per unit.

## Usage

```text
/workflow:batch-work            # all Ready tasks, priority order
/workflow:batch-work auto       # all runnable Ready tasks, auto-ordered by depends: (deps before dependents)
/workflow:batch-work 3          # first three Ready tasks
/workflow:batch-work 184,185    # named Ready tasks, in the given order
```

Tasks in `workflow/ready/` are the batch. A Ready task with an unresolved question in its file is ineligible — report it and stop before execution instead of guessing.

## Dependency handling

A `depends:` edge *inside* the batch is not a blocker — it's an order. Run the dependency first and the dependent is never actually stopped; working the whole set resolves the chain. `/work` enforces `depends:` at pickup (a dependency must be in `done/`), so the batch just has to feed tasks in the right order. Handle each unsatisfied `depends: A` on a selected task B by the first rung that applies:

1. **A already in `done/`** → satisfied, nothing to do.
2. **A is a batched or Ready task** → run A fully, ordered before B, pulling A into the batch if it wasn't selected. A completes atomically through its own `/work` loop, then B runs. Default and preferred path.
3. **A is anything else** (in `draft/`/`in-progress/` and not pullable whole, or `blocked/` on an external `gate:`) → do not touch A. Drop B and report it. An unattended batch never partially implements or auto-slices an ungroomed dependency — that is how these runs corrupt state. B waits for a real `/work` or re-groom pass on A.

**`auto` selection** — build the batch from the `depends:` graph instead of a hand-picked list:

1. Candidates = every task in `workflow/ready/`.
2. Resolve each candidate's `depends:` through the ladder above: satisfied/in-batch → keep; Ready-but-unselected dep → pull it in; anything else (draft/in-progress not pullable whole, or blocked/external) → drop the candidate and report it.
3. Order with Kahn's algorithm: repeatedly emit the runnable candidate whose deps are all done or already-emitted, breaking ties by lowest `priority:` then lowest id. A `depends:` cycle leaves tasks unemittable — drop them (the validator flags cycles before you get here).
4. List in the plan: the ordered batch and every dropped task with its reason. `auto` with nothing runnable stops with that report instead of running an empty batch.

Everything downstream (isolated subagent per unit, clean-tree gate between units, stop-on-failure, report) is identical across modes; only `auto` computes the order and dependency plan for you.

## Preconditions

1. **Resume check** — glob `workflow/reports/batch-*.md` (date-agnostic: an overnight batch can span midnight, so don't scope to today). If any carries `Status: in-progress`, this is a resumed batch — take the most recent one: adopt its frozen plan verbatim, skip selection and the rest of these preconditions, and go to Execution at its `next=` unit. Do **not** recompute selection — board state may have shifted mid-batch and the frozen order is the decision of record. Otherwise continue below to start a fresh batch.
2. `git status --porcelain` — if it prints anything, stop and report the dirty paths. Do not stash, reset, clean, or commit the existing worktree.
3. Run the bundled validator: `python3 <plugin>/skills/framework-doctor/scripts/validate_workflow.py` (resolve `<plugin>` via `${CLAUDE_PLUGIN_ROOT}`, or relative to this skill file). Stop if the framework is inconsistent.
4. Read `workflow/AGENTS.md` (contract) and the Ready queue (`./workflow/status`) — the orchestrator's only reads. Selection by mode: no arg → priority order (lowest `priority:` first, ties by id); `auto` → the runnable, dependency-ordered set from **`auto` selection** above; explicit IDs → the given order, all must be in `ready/`. Apply **Dependency handling** to any selected task with an unmet `depends:`, in every mode.
5. Resolve the report path: `workflow/reports/batch-<YYYY-MM-DD>.md`, appending `-2`, `-3`, … when a *completed or stopped* report already occupies the path (never overwrite a finished run's record). Write the report file now with the full plan and `Status: in-progress | next=<first unit>` (see **Report**), **commit it** (`batch-work: <date> plan`) so the tree is clean before the first unit, then print the same plan: the ordered units (task id + title), any dropped tasks and why, report path.

## Execution

Work the plan's units in order, one isolated subagent at a time. The orchestrator only dispatches and records the condensed return — it does not read what the subagent read.

**The orchestrator holds no batch state it can't rebuild from the report file.** A long batch will be compacted; treat the on-disk report, not this context, as the source of truth. Every iteration re-derives its position instead of trusting memory:

1. Read the report file → frozen plan, completed units, and `next=`.
2. Reconcile with reality: `git log` confirms the last recorded unit's commit landed; `git status --porcelain` is empty. A mismatch (recorded done but no commit, or a dirty tree) means the previous unit did not finish cleanly — treat it as a stop, not a resume past it.
3. Dispatch `next=` through the runtime adapter. Note the wall-clock time at dispatch.
4. On return, append the unit's condensed return to the report, advance the `Status:` marker (`next=<following unit>`, or `complete` after the last), and **commit the report** (per-unit handling below). The committed checkpoint is the durable record.

A compaction between any two of these steps is harmless: step 1 reloads the truth on the next turn. The report is committed at every checkpoint, so the tree is clean whenever a worker starts.

**A worker that yields control without emitting its final structured return is not done.** It may have parked while a child subagent (validation, acceptance-verifier, a contract-named helper) was still running, then stopped once the child finished without resuming its own loop. This is a stall, not a completion or a failure. Resume the *same* worker once to finish its loop and produce the structured return; only a second yield with still no structured return is a real failure (step 3 below). Do not open a new worker for the unit — that duplicates its work on the shared tree.

Resolve the absolute path to the sibling `../work/SKILL.md`, then send this self-contained request for the unit through the selected runtime adapter:

```text
In <absolute repo path>, read and follow <absolute work SKILL.md path> for task
<id>. Read workflow/AGENTS.md, workflow/ready/<id>-*.md, and every doc leaf the
contract routes for touched paths before code. Complete the full loop:
validation, verify gates, the acceptance-verifier gate (a task is done only on
a 'ready' verdict), doc sync, the move to workflow/done/ with a done: date, and
the atomic completion commit prefixed 'task <id>:'. You run unattended in a
batch: do not pause for confirmation — apply /work's fix-and-continue rule for
routine blockers and return failed/partial/needs_regroom instead of asking.
Return only: final_status
(done | failed | partial | needs_regroom), acceptance_verdict, verification_depth
(which gates actually ran — typecheck/build/unit/e2e/Chrome-MCP — and one clause
on why any were skipped, e.g. non-UI task), key_decisions, files_changed excluding
task bookkeeping, sub_agents_spawned (count), tests_added (count), validation,
issues, needs_regroom (required when final_status is needs_regroom; else omit:
ownership_map, failed_assumption, why_not_one_loop, candidate_slices,
dependency_order).
```

Then, per unit:

1. Success means `final_status: done` with an empty `git status --porcelain` — the worker's atomic completion commit landed and left the tree clean. A dirty tree or any non-`done` status is not success → step 3.
2. Record the outcome: append only the returned summary to the report (never pull the subagent's full output into main context, never hold results only in context), plus the unit's wall-clock duration (dispatch→return, from step 3 above) and the proxies the worker returned (`verification_depth`, `sub_agents_spawned`, `tests_added`) — these are the batch's only visibility into per-unit cost and rigor. Advance the `Status:` marker to the next unit, and commit the report (`batch-work: checkpoint <id>`). This commit is the durable checkpoint and restores a clean tree for the next unit's dispatch.
3. On `failed`, `partial`, or `needs_regroom`, stop the queue immediately. Preserve the worktree exactly as the subagent left it — never `git checkout`, `git reset`, `git clean`, or automatic rollback. Set `Status: stopped | at=<id>`, record which unit stopped it and why (for `needs_regroom`, record the returned ownership map and candidate slices so the follow-up groom has them), mark every remaining unit not run, and commit the report checkpoint.

Sequential execution is required: later units may depend on earlier commits and all workers share one working directory.

## Report

The report is created at plan time and updated in place as the batch runs — it is both the live checkpoint and the final artifact. It is committed incrementally: a `batch-work: <date> plan` commit at creation, then a `batch-work: checkpoint <id>` commit after each unit. That keeps the tree clean between units (so the clean-tree gate and each worker start hold) and makes every checkpoint survive a session restart. The `Status:` line is what the resume check reads: `in-progress | next=<id>` while running, `stopped | at=<id>` on failure, `complete` when the queue finishes. When the queue ends, its final state is already committed — just print its content and end with its path.

```markdown
# Batch Run: YYYY-MM-DD

Status: in-progress | next=185

Tasks: 184, 185, 186
Dropped: 187 (dep 191 blocked/ on external gate)                     # omit if none

## Per task

### 184 — Title
- **Status**: done | failed | partial | not run
- **Duration**: NN min (dispatch→return) · **Verification depth**: gates that ran (or why skipped) · **Sub-agents**: N · **Tests added**: N
- **Acceptance verdict** / **Key decisions** / **Files changed** / **Validation** / **Issues** / **Needs re-groom** (when returned)

## Overall

| Metric | Value |
|--------|-------|
| Completed | N/total |
| Stopped (failed/partial/re-groom) | N |
| Not run | N |
| Total wall time | sum of per-unit durations |

### Files touched by multiple tasks
### Needs manual review
List every needs re-groom handoff with its ownership map, failed assumption, one-loop constraint, candidate slices, and dependency order. Write `None` only when every task completed cleanly.
```
