---
name: groom
description: >
  Refine tasks in the repo's workflow/ status folders into implementable specs,
  and capture concrete work items found during exploration onto that board. Use
  when the user explicitly invokes "/workflow:groom", "/groom", "groom 052", or
  "use $groom". In an initialized repo (workflow/AGENTS.md exists), also use
  without being asked when an exploration, investigation, audit, or review — by
  you or by an agent reporting back — has produced concrete work items the user
  wants tracked, and for an unmistakable request to put an ask onto that board.
  Do not use for generic planning or task-refinement requests, and do not use in
  a repo that has no workflow/AGENTS.md. If explicitly invoked in an
  uninitialized repo, stop and suggest /workflow:framework-init; never invoke it
  automatically.
---

# Groom

Turn a task into something `/workflow:work` can pick up without guessing. A Ready task is one cohesive, independently deliverable outcome whose expected implementation surface is known and that can reasonably complete in one `/work` loop. Fast over exhaustive on reading and writing — one read pass, one rewrite. Spend the effort up front on the interview: the whole point of groom is that decisions get made here, so `/work` never has to stop and guess or quietly narrow scope.

The unit of work is a **task** — one `NNN-slug.md` file whose status is the folder it sits in (`workflow/draft|ready|in-progress|blocked|done/`). View the board with `./workflow/status`.

1. **Contract**: if `workflow/AGENTS.md` is missing, stop and explain that this repo is not initialized for the workflow plugin. Suggest explicit `/workflow:framework-init` (`use $framework-init` in Codex); never invoke it automatically. Otherwise read the contract (project one-liner, doc routing, decision log path).
2. **Resolve the task(s)** (arg = task number or title fragment): find its file across the status folders (`ls workflow/*/<id>-*.md`). New ask? Mint the next id with `./workflow/status --next-id` (derived from files here, in sibling worktrees, and in git history across all refs — so an id minted in another worktree or on an unmerged branch is never reused) and create `workflow/draft/<id>-<slug>.md` with a `# NNN — Title` first line. There's no counter to increment. Minting several tasks in one session? Take one id and count up from it locally — the derivation only sees a file once it exists. If the resolved task is already in `done/`, don't silently reopen it — confirm with the user first, then `git mv` it back to `draft/` and drop its `done:` line.
   - **Capture mode** — no id given and the conversation already holds exploration findings: mint one file per distinct independently deliverable outcome, ids sequential, counter incremented once at the end. Every step below then runs per task, and the whole batch shares one interview round and one commit. Don't split one outcome across tasks to look thorough, and don't capture a finding you'd decline to work on — say so instead.
3. **Read and map the implementation surface**: read the task file and the 1–2 doc leaves the contract routes for the affected paths. Skip whatever the exploration in this conversation already read — capture mode exists so this reconnaissance isn't paid for twice. Otherwise do bounded code search and read only enough to identify the primary production ownership surfaces, likely tests and routed docs, and any load-bearing contracts the change crosses. This is reconnaissance for task sizing, not an implementation plan or `done/` archaeology. Don't re-ask decisions already recorded in the repo's decision log.
4. **Interview to intent**: ask the user open-ended questions (AskUserQuestion on Claude; plain chat questions on Codex), interviewing them until you have ~95% confidence about what they *actually* want — not what they think they should want. Batch related questions (up to ~4 per round, each with a recommended default) — in capture mode one round spans the whole batch, ≤4 questions total across all tasks, never a round per task; run another round only while a genuine ambiguity remains that code + docs can't settle and that would change the spec. Stop the moment intent is unambiguous — don't manufacture questions to fill a round, and skip the interview entirely when code + docs + decision log already determine the task. Prefer questions that surface the real goal, constraints, and what "done" feels like over questions that just confirm a plan you've already written. When you write, say which decisions were answered and which you defaulted.
5. **Shape one work loop**: the task must ship one cohesive outcome on its own. Size by boundary (logical/feature), not file count — breadth within one boundary is fine, however many files it touches. Split only when the ask spans *separate* independently deliverable outcomes (one task each), never mechanically by file count. When a real code/data dependency remains (part B literally can't build until part A ships), add a `depends: NNN[, NNN]` line naming the tasks that must reach `done/` first; skip it whenever the work is independent — most tasks should have none. `depends:` is task-to-task and can sit in `ready/`; reserve `gate:` + `blocked/` for external facts (an upstream release, an approval).
6. **Tag it**: add a `tags:` line with 1–3 lowercase slugs naming the area or surface this touches (`api`, `board-ui`, `docs`), so tasks group and search across the board. Run `./workflow/status --tags` first and reuse a tag already in use rather than coining a synonym; coin a new one only when nothing existing fits. Skip the line when no tag adds signal — a tag on everything or a tag on one task groups nothing. Tags are not status, priority, or dependencies.
7. **Write the spec** into the task file per `workflow/TEMPLATE.md` — as short as honesty allows; tiny tasks are a title plus acceptance criteria. A non-empty `## Acceptance criteria` section is required to leave draft. Status never goes in the file.
   - In the Spec or Notes section, record the expected production ownership surfaces, likely tests and routed docs, known load-bearing contracts, and explicit exclusions. Keep it at ownership-area granularity; it is a sizing boundary, not a speculative file roster.
   - Don't bake speculative enumerations into the spec as hard commitments. If you can't be sure an item needs work, write it as "verify whether X needs change; skip with a one-line reason if already aligned" — not as a definite target `/work` must hit and then silently fall short of.
   - Keep acceptance criteria as observable outcomes ("primitives matching the board are reskinned in both themes"), not name-by-name rosters. A roster of N items you can't confirm all need touching becomes a false gate: `/work` delivers fewer, the acceptance check flags the delta, and it gets rationalized instead of decided.
8. **Readiness gate**: a task leaves `draft/` only when all four hold — acceptance criteria are observable and derived from code you actually read (not inferred from a grep hit), the ownership surfaces are named from files you opened, no open decision remains that would change the spec, and it is one cohesive outcome sized for one `/work` loop. Any miss keeps it in `draft/` with an `## Open questions` section naming exactly what blocks it, so the next groom resumes instead of re-interviewing. Default to draft on doubt: a wrongly promoted task makes `/work` guess or quietly narrow scope, while a wrongly held draft costs the user one line to override. The gate is binary — don't write confidence scores into the file, they only invite rationalizing.
9. **Move the task**:
   - Ready: add a `priority: N` line under the title (sparse — 10, 20, 30; lowest = next; pick a number that slots it where it belongs relative to `./workflow/status`), then `git mv` to `workflow/ready/`. A `depends:` line is fine here — `/work` enforces it at pickup.
     - Add `model: haiku|sonnet` only when you finished the recon confident the task is mechanical — the surfaces are known, the change is a doc sync, rename, config bump, or a pattern already established elsewhere in the repo, and no judgment call survives into implementation. It tells `batch-work` to dispatch that task's worker on a cheaper tier. Omit the line otherwise; the default inherits the session's model, and a downgrade that forces a second pass costs more than it saved. You are the only step that sees both the spec and the code, so nothing downstream can make this call.
   - Blocked: add a `gate:` line naming the observable fact it waits on, `git mv` to `workflow/blocked/`.
10. **Hand off** in ≤5 bullets: decided, defaulted, any `depends:` you set and why, and what `/work` should verify. In capture mode, lead with one line per task — id, slug, ready or draft, and for a draft the open question that held it — so overriding a call is one line back:

    ```
    057 board-tag-filter  → ready   (surface: workflow/status:120-180, tests: test_validate_workflow)
    058 status-perf       → draft   (open: cache in the script or precompute?)
    ```
11. **Commit once per session**, at the end, covering every task groomed: `groom: 054, 055`. Don't commit per task; don't leave groom output uncommitted (batch-work needs a clean tree).

Delegation: at most one bounded read-only subagent, only when an open question spans more files than you've read; give it the contract's project one-liner, the doc leaf paths, and one bounded question. Decisions stay here.

Codex: invoke as `use $groom`; run the read/search steps inline instead of spawning a subagent.
