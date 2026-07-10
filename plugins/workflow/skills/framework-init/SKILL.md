---
name: framework-init
description: >
  Initialize the workflow framework in a repo that doesn't have one: create the
  workflow/ status folders, install the board-view script, write the repo
  contract, scaffold the docs skeleton, and route AGENTS.md to the plugin. Use
  when the user says "/workflow:framework-init", "init the workflow", "set up
  the board here", or when another workflow skill finds no workflow/AGENTS.md.
  For repos with an existing legacy board (docs/board.md or a workflow/board.md
  file), use /workflow:framework-check instead — it migrates.
---

# Framework Init

Scaffold the workflow framework in a fresh repo. Templates live next to this skill in `templates/`. The folder a task sits in IS its status — there is no board file.

1. **Detect**: `workflow/AGENTS.md` exists → already initialized, route to `/workflow:framework-check`. A legacy layout exists (`docs/board.md`, `docs/tasks/`, milestone files, or a `workflow/board.md`) → route to `/workflow:framework-check` for migration; don't scaffold a second system.
2. **Create `workflow/`**:
   - status folders `draft/`, `ready/`, `in-progress/`, `blocked/`, `done/`, plus `reports/` — each with a `.gitkeep` (git doesn't track empty dirs; the folders must exist for `mv` and the validator)
   - `TEMPLATE.md` from `templates/TEMPLATE.md`
   - `status` from `templates/status`, then `chmod +x workflow/status` — the board view is `./workflow/status`
   - `next-task-id` containing `001`
3. **Write the contract** `workflow/AGENTS.md` from `templates/AGENTS.md`, pre-filled by inspecting the repo — project one-liner from the README, validation commands from `package.json` scripts / Makefile / existing CI, verify skills and doc leaves from what exists under `.claude/skills/` and `docs/`. Confirm the guesses with one AskUserQuestion round (validation commands, verify mapping, decision log yes/no) — defaults from the inspection.
4. **Docs skeleton** (only what's missing, only if the user opted in during the question round): `docs/style.md` stub (one job per file, cross-link don't duplicate, no execution logs), empty `docs/areas/` and `docs/spec/` with a one-line README each. Content stays the repo's job.
5. **Route the repo instructions**: add a `## Work tracking` section to the root `AGENTS.md` (create it, plus a `CLAUDE.md` containing `@AGENTS.md`, if missing — but follow the repo's existing pattern, e.g. `AGENTS.md` as a symlink to `CLAUDE.md`):

   ```markdown
   ## Work tracking

   Managed by the `workflow` plugin. Tasks are files in `workflow/<status>/`
   (draft, ready, in-progress, blocked, done) — the folder IS the status;
   moving a task is `git mv`. Board view: `./workflow/status`. Repo contract:
   `workflow/AGENTS.md`. Commands: `/workflow:groom`, `/workflow:work`,
   `/workflow:batch-work`, `/workflow:status`, `/workflow:framework-check`.
   ```

6. **Validate**: run `python3 <plugin>/skills/framework-check/scripts/validate_workflow.py` (resolve via `${CLAUDE_PLUGIN_ROOT}` or relative to this skill file). Must pass — an empty board is valid.
7. **Commit** everything as one commit: `workflow: initialize framework`.

Codex: invoke as `use $framework-init`; identical flow.
