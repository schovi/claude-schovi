---
name: framework-doctor
description: >
  Check a repo's workflow/ board and run the guides wizard: offer the plugin's
  optional working guides (validation before done, acceptance check, commit
  conventions, and more) for adoption into the repo's own instructions. Use
  when the user says "/workflow:framework-doctor", "check the board", "migrate
  the workflow guides", or after upgrading the plugin. Reports first, applies
  on approval; adopting nothing is a valid outcome. For a repo with no board
  use /workflow:framework-init.
---

# Framework Doctor

Two parts: a light health check, then a wizard that offers the guides the plugin used to enforce for adoption into the repo's own instructions. Read-only until the user approves. Re-runnable.

No `workflow/` here: point at `/workflow:framework-init` and stop.

## 1. Health check

Report; fix only on approval.

- Status folders present (`draft ready in-progress blocked done reports`), `TEMPLATE.md` present, `status` present and executable. Diff `workflow/status` and `workflow/TEMPLATE.md` against `${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/` (Codex: resolve relative to this skill). Show the diff and offer a refresh.
- Task files: `# NNN — Title` first line, unique ids, `depends:` ids that exist, `priority:` only in `ready/`, `gate:` only in `blocked/`. Mention oddities; they are the user's call.
- Root `AGENTS.md` (or the repo's equivalent) has a `## Work tracking` section that points at the board. Missing: propose the pointer from `../framework-init/SKILL.md`.

## 2. Guides wizard

The plugin ships the lifecycle only. The rules it used to enforce live in `references/guides.md`, one paragraph each. Migration means the repo decides which of them belong in its own instructions.

1. Read `references/guides.md` and the repo's instructions: root `AGENTS.md`/`CLAUDE.md`, and `workflow/AGENTS.md` if the repo still has that contract from an older plugin version.
2. For each guide, classify: **covered** (the repo already states it), **conflict** (the repo states something different; quote both), or **absent**.
3. Ask once (AskUserQuestion with multiSelect on Claude; a numbered list on Codex): which absent or conflicting guides to adopt. If `workflow/AGENTS.md` exists, also ask whether to fold its repo facts (validation commands, doc routing, decision log) into the root `## Work tracking` section and delete it, or keep it as is. Selecting nothing is a valid answer.
4. Apply: append the chosen guides under `## Work tracking` in the root instructions, wording adapted to the repo (its real commands, no placeholders); fold or keep the contract as chosen; refresh the files approved in the health check.
5. Commit `workflow: framework-doctor` if anything changed. Nothing chosen and nothing drifted: report a clean bill and change nothing.

Codex: `use $framework-doctor`.
