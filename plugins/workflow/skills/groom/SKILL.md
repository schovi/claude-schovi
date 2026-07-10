---
name: groom
description: >
  Refine a task in the repo's workflow/ status folders into an implementable
  spec. Use when the user says "/workflow:groom", "/groom", "groom 052",
  "refine this task", or hands a fuzzy ask that should enter the board.
  Requires an initialized framework (workflow/AGENTS.md exists); otherwise
  route to /workflow:framework-init first.
---

# Groom

Turn a task into something `/workflow:work` can pick up without guessing. Fast over exhaustive: one read pass, one question round, one rewrite.

The unit of work is a **task** — one `NNN-slug.md` file whose status is the folder it sits in (`workflow/draft|ready|in-progress|blocked|done/`). View the board with `./workflow/status`.

1. **Contract**: read `workflow/AGENTS.md` (project one-liner, doc routing, decision log path).
2. **Resolve the task** (arg = task number or title fragment): find its file across the status folders (`ls workflow/*/<id>-*.md`). New ask? Mint the next id from `workflow/next-task-id`, create `workflow/draft/<id>-<slug>.md` with a `# NNN — Title` first line, increment the counter.
3. **Read**: the task file and the 1–2 doc leaves the contract routes for the affected paths. Nothing else by default — no `done/` archaeology. Don't re-ask decisions already recorded in the repo's decision log.
4. **Ask once**: if something is genuinely undecidable from code + docs, one batched AskUserQuestion round (max 4 questions, each with a recommended default). One round only — default the rest and say which defaults you picked.
5. **Write the spec** into the task file per `workflow/TEMPLATE.md` — as short as honesty allows; tiny tasks are a title plus acceptance criteria. A non-empty `## Acceptance criteria` section is required to leave draft. Status never goes in the file.
6. **Move the task**:
   - Ready: add a `priority: N` line under the title (sparse — 10, 20, 30; lowest = next; pick a number that slots it where it belongs relative to `./workflow/status`), then `git mv` to `workflow/ready/`.
   - Blocked: add a `gate:` line naming the observable fact it waits on, `git mv` to `workflow/blocked/`.
7. **Hand off** in ≤5 bullets: decided, defaulted, and what `/work` should verify.
8. **Commit once per session**, at the end, covering every task groomed: `groom: 054, 055`. Don't commit per task; don't leave groom output uncommitted (batch-work needs a clean tree).

Delegation: at most one bounded read-only subagent, only when an open question spans more files than you've read; give it the contract's project one-liner, the doc leaf paths, and one bounded question. Decisions stay here.

Codex: invoke as `use $groom`; run the read/search steps inline instead of spawning a subagent.
