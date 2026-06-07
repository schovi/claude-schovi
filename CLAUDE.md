# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **dual plugin for Claude Code and Codex** providing workflow automation for software engineering tasks. It integrates Jira and GitHub PR analysis with deep codebase exploration capabilities. Both runtimes share the same skills (`plugins/schovi/skills/`); each has its own manifest and marketplace (see [Dual Plugin: Claude Code + Codex](#dual-plugin-claude-code--codex)).

**Key Innovation**: Context isolation architecture that reduces token consumption by 75-80% when fetching external data.

## Architecture

### Three-Tier Integration Pattern

The plugin uses a three-tier architecture for external integrations:

1. **Skills** (Auto-detection + explicit, `plugins/schovi/skills/`): Automatically detect mentions and intelligently decide when to fetch context, or are invoked explicitly (`/schovi:publish`, `/schovi:review`, `/schovi:debug`)
2. **Subagents** (Execution, `plugins/schovi/agents/`): Execute in isolated context windows to fetch and summarize external data

### Context Isolation Architecture

**The Problem**: Jira issues return ~10-15k tokens, GitHub PRs return 20-50k tokens. This pollutes the main context window.

**The Solution**: Subagents execute in isolated contexts:
```
Main Context → Spawn Subagent (Task tool) → Isolated Context (fetch 10-50k payload)
→ Extract essence (~800 tokens) → Return to Main Context
```

**Result**: 75-80% token savings, keeping main context clean for codebase analysis.

### Executor Subagent Pattern

**The Problem**: Workflow commands (brainstorm, research, debug) need to perform 3 operations: (1) fetch external context, (2) explore codebase deeply, (3) generate formatted output. If operations run in main context, codebase exploration adds 40-85k tokens, polluting the context window.

**The Solution**: Use **executor subagents** that perform ALL operations in isolated context:

```
Main Context (CLEAN):
  ↓
Spawn executor subagent with problem reference only
  ↓
Isolated Context (executor subagent):
  ├─ Phase 1: Fetch external context (spawn jira-analyzer/gh-pr-reviewer)
  ├─ Phase 2: Explore codebase (spawn Plan/Explore subagent)
  ├─ Phase 3: Generate formatted output (read template, format)
  └─ Return clean result (2-6k tokens)
  ↓
Main Context receives clean output only
```

**Executor vs. Analyzer Subagents**:

| Type | Purpose | Input | Output | Examples |
|------|---------|-------|--------|----------|
| **Analyzer** | Fetch & condense external data | URL/ID | ~800-15000 tokens | jira-analyzer, gh-pr-reviewer |
| **Executor** | Complete workflow in isolation | Problem reference | ~2000-6500 tokens | brainstorm-executor, research-executor, debug-executor |

**Executor Pattern Rules**:

1. **Commands are thin wrappers**: Parse arguments → spawn executor → handle output
2. **Executors do ALL the work**: External fetching + exploration + generation
3. **Nested subagent spawning**: Executors spawn analyzers and Plan/Explore subagents within their isolated context
4. **Token isolation**: Main context only sees final formatted output, not intermediate exploration
5. **Consistent naming**: Use `-executor` suffix for workflow executors, `-analyzer` for data fetchers

**Result**: 93-96% token reduction in main context (from 40-85k to 2-6k tokens).

### Shared Libraries

Common operations are extracted into reusable libraries in `plugins/schovi/lib/`:
- **argument-parser.md**: Standardized argument parsing
- **input-processing.md**: Unified context fetching from Jira/GitHub/Datadog
- **work-folder.md**: Work folder resolution and metadata
- **subagent-invoker.md**: Subagent invocation patterns

See `plugins/schovi/lib/README.md` for detailed documentation.

## Subagents

All subagent types use **three-part format**: `plugin:parent:agent`. Always use the full identifier when spawning.

| Agent (full subagent_type) | Purpose | Max Tokens |
|---------------------------|---------|------------|
| `schovi:jira-analyzer:jira-analyzer` | Fetch & summarize Jira issues | 1000 |
| `schovi:gh-pr-reviewer:gh-pr-reviewer` | Fetch & summarize GitHub PRs | 15000 |
| `schovi:debug-executor:debug-executor` | Execute debug workflow | 2500 |

## Skills

| Skill | Purpose |
|-------|---------|
| publish | Create/update GitHub PRs with auto-commit |
| review | Code review + auto-detect PR mentions and fetch context |
| debug | Debugging + Datadog auto-detect observability mentions and fetch context |
| jira-auto-detector | Auto-fetch Jira context when mentioned |

## Critical Patterns

### Dual Plugin: Claude Code + Codex

This repo ships the same plugin for two runtimes. **Every change must keep both in sync** — never update one side and leave the other stale.

| Artifact | Claude Code | Codex |
|----------|-------------|-------|
| Plugin manifest | `plugins/schovi/.claude-plugin/plugin.json` | `plugins/schovi/.codex-plugin/plugin.json` |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |
| Skills | `plugins/schovi/skills/*/SKILL.md` (shared) | same files, invoked as `use $<skill>` |
| Subagents | `plugins/schovi/agents/*/AGENT.md` | reference material only, not registered agents |

Rules:

1. **Manifests stay in sync**: version bumps, skill additions/removals, and description changes apply to BOTH `plugin.json` files
2. **Skills serve both runtimes**: `/schovi:*` syntax and `Task` tool / `subagent_type` references are Claude-native. When adding or changing a skill, make sure it degrades gracefully in Codex (trigger text works, subagent steps have a Codex-compatible path or are clearly Claude-only)
3. **Validate JSON after manifest changes**:
   ```bash
   python3 -m json.tool plugins/schovi/.claude-plugin/plugin.json >/dev/null
   python3 -m json.tool plugins/schovi/.codex-plugin/plugin.json >/dev/null
   python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
   python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
   ```
4. **Docs cover both**: CLAUDE.md documents Claude-side behavior, AGENTS.md documents Codex-side behavior. Update whichever is affected

See [AGENTS.md](AGENTS.md) for Codex specifics (installation, invocation, validation).

### Subagent Naming Convention

All subagent types MUST use **three-part format**:

1. **Skill-based agents** (under `skills/`): `plugin:skill:agent`
   - Example: `schovi:jira-auto-detector:jira-analyzer` (jira-analyzer called from jira-auto-detector skill)

2. **Standalone agents** (under `agents/`): `plugin:agent:agent` (repeat agent name)
   - Example: `schovi:debug-executor:debug-executor`

**Wrong**: `schovi:debug-executor` (two-part)
**Correct**: `schovi:debug-executor:debug-executor` (three-part)

### Token Budgets (Strict)

- Jira summaries: **Max 1000 tokens**
- PR summaries: **Max 15000 tokens** (2000-15000 depending on PR size)
- Always condense, never return raw payloads to main context

### Code References

Always use `file:line` format for specificity:
- `src/api/controller.ts:123`
- `src/api/controller.ts` (too vague)

## Development

```bash
# Install (Claude Code)
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows

# Install (Codex)
codex plugin marketplace add ~/work/claude-schovi

# Changes take effect immediately - no build needed
# Test via command invocation: /schovi:publish or /schovi:review (Claude)
# or `use $publish` / `use $review` (Codex)
```

**After changing plugin logic**: Evaluate whether changes affect the architecture or patterns documented here. If so, update CLAUDE.md to keep it in sync. This file should reflect current behavior, not become stale documentation. Apply the same check to AGENTS.md for Codex-facing changes.

## External Dependencies

- **MCP Server: Jira** - For Jira integration (`mcp__jira__*` tools)
- **GitHub CLI (`gh`)** - Must be authenticated (`gh auth login`)
- **MCP Server: JetBrains** (optional) - Enhanced IDE integration

## Navigation

| Category | Path |
|----------|------|
| Skills | `plugins/schovi/skills/*/SKILL.md` |
| Agents | `plugins/schovi/agents/*/AGENT.md` |
| Templates | `plugins/schovi/templates/` |
| Documentation | `doc/` |

For detailed documentation, see the [doc/](doc/) directory.
