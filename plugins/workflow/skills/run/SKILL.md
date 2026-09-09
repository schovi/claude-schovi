---
name: run
description: >
  Do work on an initialized workflow/ board: implement the next or a named
  task, run several tasks in isolated workers, or take a free-text ask, match
  it against the board, and plan and run it. Use when the user explicitly
  invokes "/workflow:run", "/run", "/run 051", "/run auto", "/run 3",
  "/run \"do X\"", or "use $run". When a workflow/ board exists, also use for
  an unmistakable request to implement the next, numbered, or Ready
  workflow-board task, or to batch-run the queue. Do not use for generic
  implementation requests in a repo with no board. If explicitly invoked in an
  uninitialized repo, stop and suggest /workflow:framework-init; never invoke
  it automatically.
---

# Run

One entry point for doing work on the board. The folder a task sits in is its status; the file is the spec. Board: `./workflow/status`.

The repo's own instructions own how work is done: validation, docs to read before editing, test conventions, commit style, when to stop and ask. Read them (root `AGENTS.md`/`CLAUDE.md`, plus `workflow/AGENTS.md` if present) and follow them. This skill owns the board lifecycle.

## Usage

```text
/workflow:run                    # top Ready task, in this context
/workflow:run 051                # that task, in this context
/workflow:run 3 | 184,185 | auto # several tasks, one isolated worker each
/workflow:run "fix the tag filter and make the board load faster"
/workflow:run 184 "and cover the dark theme too"
/workflow:run --isolated 051     # one task, but in a worker
/workflow:run ... --auto         # skip the plan preview
```

## Intake

1. **Parse**: task ids, a count, `auto`, free text, `--isolated`, `--auto`.
2. **Read the board** (`./workflow/status`) and the repo's instructions.
3. **Match free text** against existing tasks by title, tags, and spec. Parts the board already covers attach to those tasks. Uncovered parts become new tasks through the groom lifecycle (`/workflow:groom` steps, inline): mint with `./workflow/status --next-id`, spec per `TEMPLATE.md`, `priority:`, straight to `ready/`. Ask the user only what code and docs cannot answer; with `--auto`, decide and record the default in the task's Notes.
4. **Merge overlaps** only when one task's acceptance criteria are a subset of another's. The survivor keeps the spec; the absorbed file gets `done:` plus a one-line note `Merged into NNN` and moves to `done/`. Tasks that merely touch the same area stay separate and get `depends:` if order matters.
5. **Order** by `depends:`, then `priority:`, then id. A Ready dependency is pulled in ahead of its dependent. A draft, in-progress, or blocked dependency drops the dependent; report it.

**When a task file exists.** A file is created when something needs to read it later: a worker will run it, the ask splits into more than one unit, it matches an existing task, or the user asks to track it. A free-text ask that is one unit and runs in this context needs no file: implement it as a plain ask, commit with an ordinary message, report. If it grows mid-way, mint the task then, move it to `in-progress/`, and continue.

## Plan

One unit, running in this context: no pause. Otherwise print the plan (ordered units, new tasks, merges, dropped tasks) and wait for a yes. `--auto` skips the pause. A dirty tree (`git status --porcelain`) stops an orchestrated run before it starts; never stash, reset, or clean.

## Execute

**In this context** (one unit, no `--isolated`): run the Task loop below.

**Orchestrated** (several units, or `--isolated`): this context plans, dispatches, records short returns, and writes the report. It reads no task bodies, source, or diffs; workers do.

1. Write `workflow/reports/run-<date>.md` with the plan and `Status: in-progress | next=<id>`, commit it. A report already `in-progress` means a resumed run: adopt its plan and continue at `next=`.
2. Dispatch one fresh worker per unit with a self-contained prompt: absolute repo path, absolute path of this file, the task id, "you are a worker: run only the Task loop, never dispatch, don't pause for confirmation, return `failed` or `needs_regroom` instead of asking", and the return schema (`final_status`, `key_decisions`, `files_changed`, `validation`, `issues`). Run it on the tier the task's `model:` line pins, else inherit.
   - Claude: `Agent` with `subagent_type: general-purpose`, no `name`, `run_in_background: false`. A named or backgrounded worker has no return channel.
   - Codex: `spawn_agent` with `fork_turns: "none"`, then `wait_agent` for the final structured response. `model:` tiers are Claude aliases; ignore them.
3. Success is `final_status: done` plus a clean tree. Append the return to the report, advance `next=`, commit (`run: checkpoint <id>`). Anything else stops the run: leave the tree as the worker left it, set `Status: stopped | at=<id>`, commit the report.
4. When the queue ends, set `Status: complete`, print the report, end with its path.

Sequential only: workers share one worktree.

## Task loop

1. **Select.** The given id (`workflow/*/<id>-*.md`), or resume a task in `in-progress/`, or the top of `ready/` (lowest `priority:`, ties by lowest id). Draft or blocked tasks go through `/workflow:groom` first.
2. **Check `depends:`.** Every listed id should sit in `done/`. If not, say where it is and stop, unless the user says to go ahead.
3. **Read and plan.** The task file, the docs the repo routes for the touched paths, enough code to plan. Plan in chat in a few lines. If the work is a different or much larger outcome than groomed, stop and return `needs_regroom` with what you found instead of expanding quietly.
4. **Start.** `git mv workflow/ready/<file> workflow/in-progress/` before the first edit. Leave the move uncommitted; it rides in the completion commit.
5. **Implement and validate** the way the repo's instructions say. Prefix commits with `task NNN:`. Sync routed docs when behavior changed. The task file's Notes hold surprises and follow-ups, not a log.
6. **Check acceptance criteria** against the final tree, one by one, with evidence. Name anything not delivered, with the reason.
7. **Finish.** One commit `task NNN: <title>`: add `done: YYYY-MM-DD` under the title, drop `priority:`, `git mv` to `done/`. Report outcome, files changed, checks run, gaps.

Codex: `use $run`.
