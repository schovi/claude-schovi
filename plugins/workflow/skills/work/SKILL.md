---
name: work
description: >
  Implement one task from the repo's workflow/ status folders, or any small
  ad-hoc ask, with a minimal deliberate loop: read routed docs, brief plan,
  implement, validate, atomic completion commit. Use when the user says
  "/workflow:work", "/work", "/work 051", asks for the next task, or hands an
  implementation task. Requires an initialized framework (workflow/AGENTS.md
  exists); otherwise route to /workflow:framework-init first.
---

# Work

One loop for task-sized and ad-hoc work. Fast over ceremonial: small mistakes caught by tests beat a process that runs 10x longer. The folder a task file sits in IS its status; the file is spec, never a phase tracker. View the board with `./workflow/status`.

1. **Contract**: read `workflow/AGENTS.md` in full — validation commands, verify mapping, doc routing, local notes all come from there.
2. **Select**: arg = a task (find `workflow/*/<id>-*.md`) or a direct ask (no task needed — skip the folder steps). Without an arg, take the top Ready task: lowest `priority:` number in `workflow/ready/`, ties broken by lowest id (`./workflow/status` shows the queue). Only `ready/` tasks are eligible; draft or blocked routes through `/workflow:groom` first. Don't re-prioritize while selecting.
3. **Read** the task file, then the doc leaf(s) the contract routes for every path you'll touch — in full, before code. Use code search to locate, not to learn behavior. Don't read `done/` unless the task links a specific historical constraint.
4. **Plan in chat**: files to touch, approach, test targets — a few lines, not a document. Proceed immediately when the path is clear; pause only on genuinely multiple valid outcomes, conflict with stable docs, unexpected failures, destructive steps, or material scope expansion.
5. **Start**: `git mv workflow/ready/<id>-<slug>.md workflow/in-progress/`. **Do not commit this move** — it rides in the completion commit. An interrupted session leaves it visible as a dirty tree, which is intended.
6. **Implement** in small commits, each message prefixed `task NNN:`. Only the requested change; simple readable code over new abstractions. TDD where it fits (pure logic; bug fix = failing test first; painful test setup is design feedback). Keep surprises/follow-ups brief in the task file's Notes — never a chronological log.
7. **Validate** per the contract: targeted checks per meaningful chunk, the full gate once before the completion commit. **Never gate a commit on a piped test run** — run each check as its own step, chain the commit on its exit status. Stop on an unexpected failure: explain what failed and the options; don't weaken checks or work around missing deps without direction.
8. **Verify**: run the contract's verify-mapping skills for the touched paths, before the completion commit. If a required check can't run, say so and don't mark the task done.
9. **Acceptance gate**: spawn `workflow:acceptance-verifier:acceptance-verifier` with the repo path, task id, the task file path (its `## Acceptance criteria`), and the diff scope (commits prefixed `task NNN:` plus the working tree). It adversarially checks each criterion in fresh context and returns per-criterion verdicts. `not ready` → fix the named gaps and re-run; only `ready` proceeds to the completion commit. Skip for ad-hoc asks with no written criteria. (Codex: run this adversarial pass as its own explicit step before committing — re-read each criterion and falsify it against the diff, evidence per verdict.)
10. **Docs**: sync the routed doc leaves in the same commit when behavior or invariants changed (the verifier's Notes often name what's missing). Pure refactors need no spec diff; shipped behavior must not live only in the task file. Log a decision via `/workflow:decision` only if a future agent might plausibly flip the choice.
11. **Finish** — one atomic completion commit, message starting `task NNN: <title>`:
    - only after the acceptance gate returned `ready`,
    - add a `done: YYYY-MM-DD` line under the title and `git mv` the file to `workflow/done/` (this also commits the in-progress move from step 5),
    - include remaining implementation, tests, and doc sync.
    No git tags, no phase artifacts — git history records how the implementation evolved. Report: outcome, behavior, files changed, checks run, remaining limitations.

Delegation: subagents for bounded find/summarize, bulk mechanical edits, and batch test generation (use repo agents the contract names, e.g. a test-writer). Every dispatch carries the contract's project one-liner + the doc leaf paths + one bounded question. Decisions stay inline.

If the change balloons past ~5 files or hits a load-bearing contract you didn't expect, stop and say so instead of pushing through.

Codex: invoke as `use $work`; run delegated steps inline.
