# Optional working guides

Rules older plugin versions enforced inside the skills. The plugin now ships the board lifecycle only; a repo adopts any of these by writing them into its own instructions (root `AGENTS.md`, `## Work tracking`). `/workflow:framework-doctor` offers them one by one. Adapt commands and paths to the repo when pasting.

## Validation before done

Run the repo's targeted checks while implementing and the full gate (typecheck, build, tests) once on the complete change before the completion commit. Run each check as its own step and chain the commit on its exit status; never gate a commit on a piped test run. Fix and continue only when the root cause is proven and the repair is local and in scope; otherwise stop and report.

## Acceptance check in fresh context

Before the completion commit, verify each acceptance criterion against the final tree with evidence (a command and its output, a `file:line`, a grep that came up empty). Prefer a fresh-context subagent that tries to falsify the criteria over the implementing context confirming them. A criterion that cannot be observed is not a pass. Anything not delivered is named in the report with the reason.

## Readiness gate for Ready

A task leaves `draft/` only when its acceptance criteria are observable and grounded in code that was actually read, the surfaces it touches are named, no open decision remains that would change the spec, and it is one cohesive outcome sized for one work loop. Anything else stays in `draft/` with an `## Open questions` section.

## Commit conventions

Groom commits once per session (`groom: 054, 055`). Implementation commits carry a `task NNN:` prefix. The `ready/` to `in-progress/` move stays uncommitted and rides in one atomic completion commit that adds `done:`, drops `priority:`, moves the file to `done/`, and includes the doc sync. No git tags, no phase artifacts.

## Doc routing and sync

Read the routed doc before editing the paths it covers; behavior and invariants live in docs, not only in code. When a change alters behavior, update the routed doc in the same change. Shipped behavior must not live only in a task file.

## Dependency gate

A task with a `depends:` line does not start until every listed task sits in `done/`. Report the unmet dependency and where it is instead of reordering to it or implementing it inline.

## Scope divergence hands back

When implementation reveals a separate independently deliverable outcome, an unknown load-bearing contract, or an unresolved product decision, stop, leave the task in `ready/`, and return it to grooming with the discovered surface and candidate slices. Never widen or quietly narrow a task mid-loop.

## Task files are specs, not logs

A task file holds what and why, spec, acceptance criteria, and brief notes. Progress, phases, and history belong to git. Status is the folder, never a line in the file.

## Tag vocabulary

Tags are 1–3 lowercase slugs naming an area or surface. Reuse a tag already in use (`./workflow/status --tags`) before coining one; a tag on one task groups nothing. Tags are not status, priority, or dependencies.

## Orchestrated runs

Orchestrated runs (several tasks in isolated workers) start only on a clean tree, run one worker at a time on the shared worktree, commit the report after every unit, and stop on the first failure without resetting or cleaning the tree. Workers never pause for confirmation; they return `failed` or `needs_regroom` instead of asking.

## Read discipline

Read files with `Read`, search with `Grep`/`Glob`; a shell read (`cat`, `sed -n`) puts the body into the transcript and is re-read on every later turn. Use Bash for state changes and process control. In an orchestrator, keep task bodies, diffs, and source inside workers.
