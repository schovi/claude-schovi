---
name: framework-doctor
description: >
  Validate an initialized workflow repo and keep its shipped files and task
  metadata current. Use when the user says "/workflow:framework-doctor", "check the board", "validate
  work tracking", or when another workflow skill hits an inconsistent structure.
  Reports findings first; refreshes drifted files only after the user approves.
  Not a migrator — for a repo with no board use /workflow:framework-init.
---

# Framework Doctor

Diagnose an initialized workflow repo and heal what's safe to heal: run the deterministic validator, refresh shipped files that fell behind the plugin, backfill missing task tags, sanity-check the contract. Report → approve → apply. Read-only until the user approves a fix. Re-runnable any time.

Not a migrator. No `workflow/` framework here → point at `/workflow:framework-init`. An old markdown board (`docs/board.md`, `workflow/board.md`) is migrated by hand now — the automated migration was retired once all repos moved to the folder model.

## 1. Validate

Run the bundled validator from the repo root:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/framework-doctor/scripts/validate_workflow.py"
```

(Codex: resolve the script relative to this skill file.) Exit codes: `0` valid, `1` structural issues (one per line — task filename/heading, missing acceptance, stray `status:`/frontmatter, bad `priority:`/`gate:`/`done:`/`tags:`, unknown or cyclic `depends:`, missing `TEMPLATE.md`/`reports/`, leftover `next-task-id` counter to delete), `2` no framework here → `/workflow:framework-init`. The validator tolerates an uncommitted in-progress move — normal mid-work state.

## 2. Refresh shipped files

The repo's copies of the generic templates go stale when the plugin evolves them. They carry no repo-specific content, so any difference means the repo is behind. Diff each against the current template:

```bash
diff -u workflow/status      "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/status"
diff -u workflow/TEMPLATE.md "${CLAUDE_PLUGIN_ROOT}/skills/framework-init/templates/TEMPLATE.md"
```

(Codex: resolve the template paths relative to this skill file.) Show the diff in the report so a deliberate local edit is visible before it's overwritten. On approval, overwrite with the current template and re-`chmod +x workflow/status`.

## 3. Backfill missing tags

A half-tagged board groups nothing, and tags accumulate late (the line is optional, and older tasks predate it). List the vocabulary in use and the live tasks without a `tags:` line:

```bash
./workflow/status --tags
grep -rLs "^tags:" workflow/draft workflow/ready workflow/in-progress workflow/blocked
```

Skip `done/` — it's the archive, and tagging history buys nothing. For each untagged task, read its title and `## What & why` and propose 1–3 tags, preferring the vocabulary already in use; coin a new tag only when several untagged tasks share a theme nothing existing covers. Leave a task untagged when no tag adds signal — that's a valid outcome, not a gap. Report as a `task → proposed tags` table; on approval insert the line into each task's metadata block. Also flag tags used exactly once and near-duplicates of each other (`ui` vs `ui-polish`) as consolidation candidates, with the merge left to the user.

## 4. Contract sanity

Check `workflow/AGENTS.md` exists and its facts still match reality: validation commands resolve (package.json scripts / Makefile targets exist), verify-mapping skills still exist, doc-routing leaves still exist. Flag anything stale — the fix is the user's to confirm.

Check the root `AGENTS.md` too (or the repo's equivalent entry file): it must exist and carry the `## Work tracking` pointer `framework-init` writes, or no agent finds the board without being told. Missing → propose adding that section, wording in `../framework-init/SKILL.md`.

Then check for a second copy of the process, the drift source the contract header warns about. Two shapes:

- **Contract overreach**: sections of `workflow/AGENTS.md` restating plugin-owned process (statuses, lifecycle, grooming, completion criteria, fix-vs-ask on a failed check) or rules that govern every agent session, not just carded work (autonomy limits, git and worktree safety). Propose deleting the plugin-owned text outright; for the session-wide rules, propose moving the residue to the root `AGENTS.md`, which loads once per session.
- **A rival process doc**: a repo doc covering tracked-work process next to the contract. Find candidates rather than guessing names — `grep -rlE "workflow/(draft|ready|in-progress)|/workflow:(work|groom)|workflow/status" --include='*.md' . | grep -v '^./workflow/'` — then read the ones that document process rather than merely link to it (`docs/workflow.md`, `docs/process.md`, a `CONTRIBUTING` board section). Report line-level overlap with the plugin, the contract, and the root `AGENTS.md`, plus the residue owned nowhere else in the repo. Default proposal: delete the doc, move that residue to the root `AGENTS.md`. A linked-but-separate file is not a fix — the link doesn't stop the copies diverging.

Residue is judged against the repo alone. A rule that exists only in the user's personal global config (`~/.claude/CLAUDE.md`, `~/.codex/`) is *not* covered: it isn't committed, so a teammate's session and often another runtime never see it. Those lines are the strongest candidates to land in the root `AGENTS.md`, not to be deleted as duplicates. Say which of the two each residue line is.

Show any contradiction between the copies as evidence (the same fact stated two ways is drift that already happened, not a hypothetical). Nothing is deleted without approval, and the residue call is the user's.

## 5. Codex parity (dual-runtime repos only)

Skip entirely in a Claude-only repo. Otherwise every kept repo-local `.claude/agents/<name>.md` needs a `.codex/agents/<name>.toml` twin, and the Codex skills symlink (`.codex/skills` or `.agents/skills` → `.claude/skills`) must exist and resolve. Pairing rules: `references/codex-agents.md`. Generate a missing twin on approval, then check the TOMLs parse:

```bash
python3 -c 'import pathlib, tomllib; [tomllib.loads(p.read_text()) for p in pathlib.Path(".codex/agents").glob("*.toml")]'
```

## 6. Report and apply

Print findings grouped: validator issues, drifted shipped files (with diffs), tag backfill proposals, contract gaps and duplicated process, Codex parity gaps — each with the exact fix. Ask once for approval before touching anything (call out any overwrite of a locally-edited shipped file explicitly, and quote the exact text of any section proposed for the root `AGENTS.md`). On approval: apply with `git mv`/overwrite/`git rm`, edit the root `AGENTS.md` where residue moves there, re-run the validator (must exit 0), and commit the fixes as `workflow: framework-doctor`. A clean bill of health changes and commits nothing.

Codex: invoke as `use $framework-doctor`; identical flow.
