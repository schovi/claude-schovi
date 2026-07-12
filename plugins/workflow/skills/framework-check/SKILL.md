---
name: framework-check
description: >
  Validate a repo's workflow framework and migrate legacy layouts. Use when the
  user says "/workflow:framework-check", "check the board", "validate work
  tracking", "migrate to the workflow plugin", or when another workflow skill
  hits an inconsistent or legacy structure. Reports findings and a migration
  plan first; applies fixes only after the user approves.
---

# Framework Check

Two jobs: deterministic validation of a migrated repo, and guided migration of a legacy one. Always report → get approval → apply. Re-runnable at any point of a partial migration.

Target model: tasks are `NNN-slug.md` files in `workflow/{draft,ready,in-progress,blocked,done}/` — the folder IS the status. `priority:` line orders ready, `gate:` explains blocked, `done:` dates done. Board view: `./workflow/status`.

## 1. Deterministic pass

Run the bundled validator from the repo root:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/framework-check/scripts/validate_workflow.py"
```

(Codex: resolve the script relative to this skill file.) Exit codes: `0` valid, `1` structural issues (listed one per line), `2` no/legacy framework. The validator does not require a clean git tree — an uncommitted in-progress move is normal mid-work state.

## 2. Audit (model pass)

Beyond the script, check and collect findings:

- **Legacy layouts**: markdown-board era (`docs/board.md`, `docs/tasks/`, `docs/.next-task-id`, `docs/milestones/`, `docs/archive/tasks/`, milestone/M-ID vocabulary, git-tag-per-task habits, reports outside `workflow/reports/`) or the interim plugin layout (`workflow/board.md` + `workflow/tasks/` + `workflow/archive/`).
- **Drifted shipped files**: the repo's copies of the generic templates go stale when the plugin evolves them. Diff each against the current template and flag any that differ:

  ```bash
  diff -q workflow/status    "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/status"
  diff -q workflow/TEMPLATE.md "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/TEMPLATE.md"
  ```

  (Codex: resolve the template paths relative to this skill file.) These files carry no repo-specific content, so a difference means the repo is behind — record it for refresh. Show the actual diff in the report so a deliberate local edit is visible before it's overwritten.
- **Superseded repo skills**: `.claude/skills/{groom,work,batch-run,batch-work}/` — now owned by the plugin. Repo-specific skills (verify*, design, analyze-*, playwright-*) stay.
- **Scout agents**: `.claude/agents/scout.md` and `.codex/agents/scout.toml` — retired entirely; the plugin skills use generic bounded subagents. Other agents (test-writer, chrome-reviewer, …) stay.
- **Codex runtime parity**: every kept `.claude/agents/<name>.md` needs a `.codex/agents/<name>.toml` twin, and the repo's Codex skills symlink (`.codex/skills` or `.agents/skills` → `.claude/skills`) must exist and resolve. Pairing rules: `references/codex-agents.md`.
- **Stale routing**: references to old paths/commands in `AGENTS.md`, `CLAUDE.md`, `docs/**`, and **remaining repo skills** (`grep -rl 'docs/board\|docs/tasks\|board.md\|/groom\|/work\|/batch-run' AGENTS.md CLAUDE.md docs .claude`).
- **Contract**: `workflow/AGENTS.md` exists, and its validation commands / verify mapping / doc routing still match reality (package.json scripts, existing skills, existing doc leaves).

## 3. Report and approve

Print findings grouped as: validator issues, legacy artifacts, drifted shipped files, superseded skills/agents, stale references, contract gaps — each with the exact fix. Then the migration plan as an ordered list. Ask for approval before touching anything (one confirmation for the whole plan; call out destructive steps — skill/agent deletion, renumbering — explicitly).

## 4. Apply (after approval)

Use `git mv` for every move so history follows. Order:

1. **Create or refresh the structure**: status folders + `reports/` (each with `.gitkeep`), `workflow/TEMPLATE.md`, `workflow/status` script (`chmod +x`), `workflow/next-task-id` — from the framework-init templates. When the repo already has these, overwrite any shipped file the audit flagged as drifted (`workflow/status`, `workflow/TEMPLATE.md`) with the current template (re-`chmod +x` the status script). This is the "make sure it's up to date" path on an already-migrated repo.
2. **Migrate every card to a task file**, one per card, into the folder matching its old status:
   - Card already has a task/spec file → `git mv` it into the right status folder (renaming to `NNN-slug.md` if needed) and fold the board line's extra facts into it.
   - Inline-only card (spec lived on the board line) → create the file: `# NNN — Title` plus the line's sub-bullets as Spec/Acceptance criteria.
   - Ready order → sparse `priority:` lines (10, 20, 30, … top to bottom). Blocked `gate:` → a `gate:` line. Done dates → `done: YYYY-MM-DD` lines. Done/archived files (`docs/archive/tasks/*`, `docs/milestones/archive/*`, `workflow/archive/*`) → `workflow/done/` keeping their names (add `done:` from the board when known; the git log otherwise).
   - `docs/tasks/backlog.md` (free-form candidates) → `workflow/backlog.md`. `docs/.next-task-id` → `workflow/next-task-id` (the counter loses its dot). Old reports → `workflow/reports/`.
   - Delete the now-empty board file(s) and old task dirs.
3. **Task-ID unification** (repos with M-numbers): renumber **active (non-done) tasks only** — assign sequential numeric IDs, rename files to `NNN-<slug>.md`. Done files, git tags, and `D<N>` references stay untouched. Seed `next-task-id` above every ID visible anywhere.
4. **Vocabulary**: in live framework docs the unit of work is a **task** (not card/milestone). Don't rewrite `done/` contents or history docs.
5. **Delete superseded pieces**: repo `groom`/`work`/`batch-run` skill dirs and the scout agent files (both runtimes). Check for `.codex/skills` / `.agents/skills` symlinks pointing at deleted dirs.
6. **Codex agent parity**: generate a `.codex/agents/<name>.toml` twin for every kept `.claude/agents/<name>.md` that lacks one, per `references/codex-agents.md` (prompt copied verbatim, read-only tools → `sandbox_mode = "read-only"`, writers → `"workspace-write"`, no model aliases). Validate all TOMLs parse (`python3 -c 'import pathlib, tomllib; [tomllib.loads(p.read_text()) for p in pathlib.Path(".codex/agents").glob("*.toml")]'`).
7. **Reroute instructions**: replace the work-tracking sections of `AGENTS.md`/`CLAUDE.md` with the plugin pointer block (see framework-init step 5). Write/refresh the contract `workflow/AGENTS.md`, extracting repo specifics (validation commands, verify mapping, doc routing table, local notes) from the old CLAUDE.md and deleted skills so nothing load-bearing is lost. Update every stale reference found in step 2, including remaining repo skills.
8. **Verify**: re-run the validator (must exit 0), run `./workflow/status` and sanity-check the board against the old one (same tasks, same statuses, Ready order preserved), and run the contract's full validation gate. Spot-check that no remaining file references the old paths.
9. **Commit** the whole migration as one commit: `workflow: migrate to workflow framework`.

On an already-migrated repo this skill validates and keeps the shipped files current: report drift and structural issues, and fix only what the user approves.

Codex: invoke as `use $framework-check`; identical flow.
