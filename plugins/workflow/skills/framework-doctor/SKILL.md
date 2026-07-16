---
name: framework-doctor
description: >
  Validate an initialized workflow repo and keep its shipped files current. Use
  when the user says "/workflow:framework-doctor", "check the board", "validate
  work tracking", or when another workflow skill hits an inconsistent structure.
  Reports findings first; refreshes drifted files only after the user approves.
  Not a migrator — for a repo with no board use /workflow:framework-init.
---

# Framework Doctor

Diagnose an initialized workflow repo and heal what's safe to heal: run the deterministic validator, refresh shipped files that fell behind the plugin, sanity-check the contract. Report → approve → apply. Read-only until the user approves a fix. Re-runnable any time.

Not a migrator. No `workflow/` framework here → point at `/workflow:framework-init`. An old markdown board (`docs/board.md`, `workflow/board.md`) is migrated by hand now — the automated migration was retired once all repos moved to the folder model.

## 1. Validate

Run the bundled validator from the repo root:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/framework-doctor/scripts/validate_workflow.py"
```

(Codex: resolve the script relative to this skill file.) Exit codes: `0` valid, `1` structural issues (one per line — task filename/heading, missing acceptance, stray `status:`/frontmatter, bad `priority:`/`gate:`/`done:`, unknown or cyclic `depends:`, missing `TEMPLATE.md`/`reports/`/`next-task-id`), `2` no framework here → `/workflow:framework-init`. The validator tolerates an uncommitted in-progress move — normal mid-work state.

## 2. Refresh shipped files

The repo's copies of the generic templates go stale when the plugin evolves them. They carry no repo-specific content, so any difference means the repo is behind. Diff each against the current template:

```bash
diff -u workflow/status      "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/status"
diff -u workflow/TEMPLATE.md "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/TEMPLATE.md"
```

(Codex: resolve the template paths relative to this skill file.) Show the diff in the report so a deliberate local edit is visible before it's overwritten. On approval, overwrite with the current template and re-`chmod +x workflow/status`.

## 3. Contract sanity

Check `workflow/AGENTS.md` exists and its facts still match reality: validation commands resolve (package.json scripts / Makefile targets exist), verify-mapping skills still exist, doc-routing leaves still exist. Flag anything stale — the fix is the user's to confirm.

## 4. Codex parity (dual-runtime repos only)

Skip entirely in a Claude-only repo. Otherwise every kept repo-local `.claude/agents/<name>.md` needs a `.codex/agents/<name>.toml` twin, and the Codex skills symlink (`.codex/skills` or `.agents/skills` → `.claude/skills`) must exist and resolve. Pairing rules: `references/codex-agents.md`. Generate a missing twin on approval, then check the TOMLs parse:

```bash
python3 -c 'import pathlib, tomllib; [tomllib.loads(p.read_text()) for p in pathlib.Path(".codex/agents").glob("*.toml")]'
```

## 5. Report and apply

Print findings grouped: validator issues, drifted shipped files (with diffs), contract gaps, Codex parity gaps — each with the exact fix. Ask once for approval before touching anything (call out any overwrite of a locally-edited shipped file explicitly). On approval: apply with `git mv`/overwrite, re-run the validator (must exit 0), and commit the fixes as `workflow: framework-doctor`. A clean bill of health changes and commits nothing.

Codex: invoke as `use $framework-doctor`; identical flow.
