# AGENTS.md

Instructions for AI agents (Claude Code, Codex, and compatible runtimes) working in this repository. This is the single source of truth; `CLAUDE.md` imports it via `@AGENTS.md`.

## Project Overview

This repository hosts **dual plugins for Claude Code and Codex**. Both runtimes share the same skill files; each runtime has its own plugin manifest and marketplace.

| Plugin | Path | Purpose |
|--------|------|---------|
| `schovi` | `plugins/schovi/` | Main workflow plugin: PR publishing, code review, debugging, Jira/GitHub/Datadog context detection |
| `homebrew` | `plugins/homebrew/` | Standalone release workflow for Homebrew-distributed repos. Single skill `release`, explicit invocation only. Installable separately so it can be added only where it applies |

Core design: **context isolation**. External data (Jira issues ~10-15k tokens, GitHub PRs 20-50k tokens, Datadog 10-50k tokens) is fetched by subagents in isolated context windows and condensed before returning, keeping the main context clean. Savings: 75-80% on plain fetches, 93-96% on full executor workflows.

## Repository Layout

| Artifact | Claude Code | Codex |
|----------|-------------|-------|
| Plugin manifest | `plugins/<name>/.claude-plugin/plugin.json` | `plugins/<name>/.codex-plugin/plugin.json` |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |
| Skills | `plugins/<name>/skills/*/SKILL.md` | same files, invoked as `use $<skill>` |
| Subagents | `plugins/schovi/agents/*/AGENT.md` | reference material only, not registered agents |
| Templates | `plugins/schovi/templates/` | shared |
| Detailed docs | `doc/` (architecture, commands, agents, libraries) | shared |

## Dual-Runtime Sync Rules

Every change must keep both runtimes in sync. Never update one side and leave the other stale.

1. **Manifests stay in sync**: version bumps, skill additions/removals, and description changes apply to BOTH `plugin.json` files of the affected plugin
2. **Skills serve both runtimes**: `/<plugin>:<skill>` syntax and `Task` tool / `subagent_type` references are Claude-native. When adding or changing a skill, make sure it degrades gracefully in Codex (trigger text works, subagent steps have a Codex-compatible path or are clearly Claude-only)
3. **Validate JSON after manifest changes**: see [Validation](#validation)
4. **Docs stay in sync**: this file is the single instructions source for both runtimes. When plugin logic changes affect the architecture or patterns documented here, update this file in the same change

### Codex Notes

- Skills are invoked as `use $<skill>`: `use $publish`, `use $review`, `use $debug`, `use $release`
- Documented `/<plugin>:<skill>` commands are Claude-native syntax. In Codex they work as trigger text for the skills, not as shell or TUI slash commands
- When a workflow references Claude's `Task` tool or a custom `subagent_type`, adapt it to Codex's available tools and built-in subagents
- `plugins/schovi/agents/*/AGENT.md` files are not Codex custom agent registrations; treat them as reference material

## Skills

| Skill | Plugin | Invocation | Purpose |
|-------|--------|------------|---------|
| publish | schovi | `/schovi:publish` + auto-detect | Create/update GitHub PRs with auto-commit |
| review | schovi | `/schovi:review` + auto-detect | Code review + fetch context when PRs are mentioned |
| debug | schovi | `/schovi:debug` + auto-detect | Debugging + fetch Datadog context when observability is mentioned |
| jira-auto-detector | schovi | auto-detect only | Fetch Jira context when issues are mentioned |
| release | homebrew | `/homebrew:release` only | CI-gated GitHub release for Homebrew-distributed projects (`disable-model-invocation: true`) |

## Subagents

Two kinds:

| Type | Purpose | Input | Output |
|------|---------|-------|--------|
| **Analyzer** | Fetch and condense external data | URL/ID | condensed summary |
| **Executor** | Run a complete workflow (fetch + explore + generate) in isolation | problem reference | formatted result |

Commands are thin wrappers: parse arguments → spawn subagent → handle output. Executors spawn analyzers and Explore/Plan subagents inside their own isolated context, so the main context only sees the final formatted output, never the intermediate exploration.

### Registry and Token Budgets (strict)

| Agent (full subagent_type) | Purpose | Max output tokens |
|----------------------------|---------|-------------------|
| `schovi:jira-analyzer:jira-analyzer` | Fetch & summarize Jira issues | 1000 |
| `schovi:gh-pr-reviewer:gh-pr-reviewer` | Fetch & summarize GitHub PRs | 15000 (2000-15000 by PR size) |
| `schovi:datadog-analyzer:datadog-analyzer` | Fetch & summarize Datadog data | 1200 |
| `schovi:debug-executor:debug-executor` | Execute debug workflow | 2500 |

Always condense; never return raw payloads to the main context.

### Naming Convention

Subagent types use **three-part format** `plugin:parent:agent`:

- Skill-based agents (under `skills/`): `plugin:skill:agent`, e.g. `schovi:jira-auto-detector:jira-analyzer`
- Standalone agents (under `agents/`): `plugin:agent:agent` (name repeated), e.g. `schovi:debug-executor:debug-executor`

`schovi:debug-executor` (two-part) is wrong. Always spawn with the full three-part identifier.

## Conventions

- Code references use `file:line` format: `src/api/controller.ts:123`, not just the path
- New workflows go in `plugins/<name>/skills/<skill>/SKILL.md`; new data fetchers in `plugins/schovi/agents/<agent>/AGENT.md`
- Naming: `-analyzer` suffix for data fetchers, `-executor` suffix for workflow executors

## Development

Changes take effect immediately; no build step.

```bash
# Install (Claude Code)
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows
/plugin install homebrew@schovi-workflows   # only in Homebrew-distributed repos

# Install (Codex)
codex plugin marketplace add ~/work/claude-schovi
```

Test by invoking: `/schovi:publish`, `/schovi:review`, `/homebrew:release` (Claude) or `use $publish`, `use $release` (Codex).

### Validation

After changing plugin metadata:

```bash
python3 -m json.tool plugins/schovi/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/schovi/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/homebrew/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/homebrew/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
```

After changing skills, refresh the local marketplace and start a new Codex session to verify discovery:

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
codex
```

`codex plugin marketplace upgrade` is for Git-backed marketplaces; local marketplaces read directly from the configured path.

## External Dependencies

- **Jira MCP server** (`mcp__jira__*` tools) for Jira integration
- **GitHub CLI** (`gh`), authenticated via `gh auth login`
- **JetBrains MCP server** (optional) for enhanced IDE integration
