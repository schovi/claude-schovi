---
name: groom
description: >
  Refine a task on the repo's workflow/ board into a spec /workflow:run can
  pick up, or capture work items found during exploration onto that board. Use
  when the user explicitly invokes "/workflow:groom", "/groom", "groom 052", or
  "use $groom". In an initialized repo (a workflow/ board exists), also use
  without being asked when an exploration, investigation, audit, or review — by
  you or by an agent reporting back — has produced concrete work items the user
  wants tracked, and for an unmistakable request to put an ask onto that board.
  Do not use for generic planning or task-refinement requests, and do not use in
  a repo that has no workflow/ board. If explicitly invoked in an uninitialized
  repo, stop and suggest /workflow:framework-init; never invoke it
  automatically.
---

# Groom

Turn an idea or a draft into a task `/workflow:run` can implement without guessing. A task is one `NNN-slug.md` file under `workflow/<status>/`; the folder is the status. Board: `./workflow/status`.

The repo's own instructions (root `AGENTS.md`/`CLAUDE.md`, plus `workflow/AGENTS.md` if the repo keeps one) own its conventions: what to validate, which docs to read, how to commit. Follow them. This skill describes the board lifecycle only.

1. **Resolve the task.** Arg is an id or title fragment: `ls workflow/*/<id>-*.md`. New ask: mint an id with `./workflow/status --next-id` (derived from files, sibling worktrees, and git history; no counter file) and create `workflow/draft/<id>-<slug>.md` with a `# NNN — Title` first line. Capture mode (no arg, findings already in context): one file per independently deliverable outcome, ids counted up from the minted one, one interview round for the whole batch. Reopening a `done/` task needs the user's confirmation; then `git mv` it back to `draft/` and drop its `done:` line.
2. **Understand the ask.** Read the task and enough code and docs to name the surfaces it touches. Skip what this conversation already read. Ask the user the questions code and docs cannot answer (AskUserQuestion on Claude, plain questions on Codex), batched with a default each. Stop asking when intent is clear; skip the interview when code and docs already settle it.
3. **Write the spec** per `workflow/TEMPLATE.md`: what and why, spec, acceptance criteria as observable outcomes. As short as honesty allows. Status never goes in the file.
4. **Shape.** One task is one cohesive outcome that ships on its own. Split separate outcomes into separate tasks; breadth inside one outcome is fine. A real code dependency gets `depends: NNN`; an external wait gets a `gate:` line and `blocked/`. Optional `tags:` (reuse what `./workflow/status --tags` lists) and `model:` (cheaper tier for a mechanical task run in an isolated worker by `/workflow:run`).
5. **Move.** Ready: add `priority: N` (sparse, lowest = next) and `git mv` to `ready/`. Still undecided: stay in `draft/` with an `## Open questions` section naming what blocks it. Blocked: `gate:` line, `git mv` to `blocked/`.
6. **Hand off** in a few bullets: decided, defaulted, open. Commit once for the session (`groom: 054, 055`) unless the repo's instructions say otherwise.

Codex: `use $groom`; run reads and searches inline.
