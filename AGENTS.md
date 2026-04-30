# AGENTS.md

This repository contains reusable local workflow skills for Codex and Claude Code.

## Repository Shape

- `schovi/.codex-plugin/plugin.json` is the Codex plugin manifest.
- `.agents/plugins/marketplace.json` exposes this repository as a Codex marketplace.
- `schovi/skills/*/SKILL.md` contains Codex-readable skills.
- `schovi/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` keep Claude Code compatibility.
- `schovi/agents/*/AGENT.md` contains Claude-style subagent instructions. Codex can use them as reference material, but they are not Codex custom agent registrations.

## Codex Usage Notes

- Keep the Codex plugin root at `schovi/`.
- Add new Codex-facing workflows as skills under `schovi/skills/<name>/SKILL.md`.
- Prefer natural Codex invocations such as `use $commit`, `use $review`, `use $debug`, or `use $publish`.
- The documented `/schovi:*` commands are Claude-native command syntax. In Codex they still work as trigger text for the skills, not as shell or TUI slash commands.
- When a workflow references Claude's `Task` tool or a custom `subagent_type`, adapt it to Codex's available tools and built-in subagents.

## Validation

After changing plugin metadata, run:

```bash
python3 -m json.tool schovi/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
```

After changing skills, install or refresh the marketplace locally and start a new Codex session to verify discovery:

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
codex
```

`codex plugin marketplace upgrade` is for Git-backed marketplaces. Local marketplaces read directly from the configured path.
