---
name: framework-init
description: >
  Explicit invocation only. Initialize the workflow board in a repo that does
  not have one: create the workflow/ status folders, install the board-view
  script and task template, and point the repo's instructions at the board.
  Use only when the user explicitly invokes "/workflow:framework-init", says
  "init the workflow" or "set up the board here", or invokes
  "use $framework-init". Never invoke this skill because a different workflow
  skill found no workflow/ board.
---

# Framework Init

Run only after the user explicitly requests initialization. Never inherit invocation from another workflow skill.

Templates live next to this skill in `templates/`. The folder a task sits in is its status; there is no board file and no contract file.

1. **Detect.** `workflow/` already exists: run `/workflow:framework-doctor` instead.
2. **Create `workflow/`**: `draft/ ready/ in-progress/ blocked/ done/ reports/`, each with a `.gitkeep`; `TEMPLATE.md` from `templates/TEMPLATE.md`; `status` from `templates/status`, then `chmod +x workflow/status`.
3. **Point the repo's instructions at the board.** Add a `## Work tracking` section to the root `AGENTS.md` (create it, plus a `CLAUDE.md` containing `@AGENTS.md`, if missing; follow the repo's existing pattern). This section is also where the repo keeps its own board rules later, so start with the pointer only:

   ```markdown
   ## Work tracking

   Tasks are files in `workflow/<status>/` (draft, ready, in-progress, blocked,
   done); the folder is the status, moving a task is `git mv`. Board:
   `./workflow/status`. Skills: `/workflow:groom`, `/workflow:run`, `/workflow:status`,
   `/workflow:decision`, `/workflow:framework-doctor`. Decision log: <docs/decisions.md or none>.
   ```

   Ask one round (AskUserQuestion on Claude, plain question on Codex): decision log location, and whether to run the guides wizard from `/workflow:framework-doctor` now to adopt any of the plugin's optional working guides.
4. **Commit** as one commit: `workflow: initialize framework`.

Codex: `use $framework-init`; identical flow.
