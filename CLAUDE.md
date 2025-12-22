# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** providing workflow automation for software engineering tasks. It integrates Jira and GitHub PR analysis with deep codebase exploration capabilities.

**Key Innovation**: Context isolation architecture that reduces token consumption by 75-80% when fetching external data.

## Architecture

### Three-Tier Integration Pattern

The plugin uses a three-tier architecture for external integrations:

1. **Skills** (Auto-detection, `schovi/skills/`): Automatically detect mentions and intelligently decide when to fetch context
2. **Commands** (Explicit, `schovi/commands/`): User-invoked workflows like `/schovi:brainstorm`, `/schovi:research`, `/schovi:plan`
3. **Subagents** (Execution, `schovi/agents/`): Execute in isolated context windows to fetch and summarize external data

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
  ├─ Phase 1: Fetch external context (spawn jira-analyzer/gh-pr-analyzer)
  ├─ Phase 2: Explore codebase (spawn Plan/Explore subagent)
  ├─ Phase 3: Generate formatted output (read template, format)
  └─ Return clean result (2-6k tokens)
  ↓
Main Context receives clean output only
```

**Executor vs. Analyzer Subagents**:

| Type | Purpose | Input | Output | Examples |
|------|---------|-------|--------|----------|
| **Analyzer** | Fetch & condense external data | URL/ID | ~800-1200 tokens | jira-analyzer, gh-pr-analyzer |
| **Executor** | Complete workflow in isolation | Problem reference | ~2000-6500 tokens | brainstorm-executor, research-executor, debug-executor |

**Executor Pattern Rules**:

1. **Commands are thin wrappers**: Parse arguments → spawn executor → handle output
2. **Executors do ALL the work**: External fetching + exploration + generation
3. **Nested subagent spawning**: Executors spawn analyzers and Plan/Explore subagents within their isolated context
4. **Token isolation**: Main context only sees final formatted output, not intermediate exploration
5. **Consistent naming**: Use `-executor` suffix for workflow executors, `-analyzer` for data fetchers

**Result**: 93-96% token reduction in main context (from 40-85k to 2-6k tokens).

### Shared Libraries

Common operations are extracted into reusable libraries in `schovi/lib/`:
- **argument-parser.md**: Standardized argument parsing
- **input-processing.md**: Unified context fetching from Jira/GitHub/Datadog
- **work-folder.md**: Work folder resolution and metadata
- **subagent-invoker.md**: Subagent invocation patterns

See `schovi/lib/README.md` for detailed documentation.

## Commands

| Command | Purpose | Details |
|---------|---------|---------|
| `/schovi:brainstorm` | Explore 3-5 solution options at conceptual level | [doc/commands/brainstorm.md](doc/commands/brainstorm.md) |
| `/schovi:research` | Deep technical analysis of ONE specific approach | [doc/commands/research.md](doc/commands/research.md) |
| `/schovi:debug` | Root cause analysis with fix proposal | [doc/commands/debug.md](doc/commands/debug.md) |
| `/schovi:plan` | Generate implementation spec from research | [doc/commands/plan.md](doc/commands/plan.md) |
| `/schovi:implement` | Execute implementation from spec | [doc/commands/implement.md](doc/commands/implement.md) |
| `/schovi:commit` | Structured git commits with context | [doc/commands/commit.md](doc/commands/commit.md) |
| `/schovi:publish` | Create/update GitHub PRs | [doc/commands/publish.md](doc/commands/publish.md) |
| `/schovi:review` | Code review with issue detection | [doc/commands/review.md](doc/commands/review.md) |

## Subagents

| Agent | Purpose | Max Tokens |
|-------|---------|------------|
| jira-analyzer | Fetch & summarize Jira issues | 1000 |
| gh-pr-analyzer | Fetch PRs (compact mode for analysis) | 1200 |
| gh-pr-reviewer | Fetch PRs (full mode for review) | 15000 |
| gh-issue-analyzer | Fetch & summarize GitHub issues | 1000 |
| spec-generator | Transform research into specs | 3000 |
| brainstorm-executor | Execute brainstorm workflow | 4500 |
| research-executor | Execute research workflow | 6500 |
| debug-executor | Execute debug workflow | 2500 |

## Skills

| Skill | Pattern | Purpose |
|-------|---------|---------|
| jira-auto-detector | `[A-Z]{2,10}-\d{1,6}` (EC-1234) | Auto-fetch Jira context when mentioned |
| gh-pr-auto-detector | URLs, `owner/repo#123`, `#123` | Auto-fetch PR context when mentioned |
| datadog-auto-detector | URLs, service queries | Auto-fetch Datadog context when mentioned |

## Critical Patterns

### Subagent Naming Convention

All subagent types MUST use **three-part format**:

1. **Skill-based agents** (under `skills/`): `plugin:skill:agent`
   - Example: `schovi:jira-auto-detector:jira-analyzer`

2. **Standalone agents** (under `agents/`): `plugin:agent:agent` (repeat agent name)
   - Example: `schovi:brainstorm-executor:brainstorm-executor`

**Wrong**: `schovi:brainstorm-executor` (two-part)
**Correct**: `schovi:brainstorm-executor:brainstorm-executor` (three-part)

### Token Budgets (Strict)

- Jira summaries: **Max 1000 tokens**
- PR summaries (compact): **Max 1200 tokens**
- PR summaries (full): **Max 15000 tokens**
- Always condense, never return raw payloads to main context

### Code References

Always use `file:line` format for specificity:
- `src/api/controller.ts:123`
- `src/api/controller.ts` (too vague)

## Development

```bash
# Install
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows

# Changes take effect immediately - no build needed
# Test via command invocation: /schovi:brainstorm test-input
```

**After changing plugin logic**: Evaluate whether changes affect the architecture or patterns documented here. If so, update CLAUDE.md to keep it in sync. This file should reflect current behavior, not become stale documentation.

## External Dependencies

- **MCP Server: Jira** - For Jira integration (`mcp__jira__*` tools)
- **GitHub CLI (`gh`)** - Must be authenticated (`gh auth login`)
- **MCP Server: JetBrains** (optional) - Enhanced IDE integration

## Navigation

| Category | Path |
|----------|------|
| Commands | `schovi/commands/*.md` |
| Agents | `schovi/agents/*/AGENT.md` |
| Skills | `schovi/skills/*/SKILL.md` |
| Libraries | `schovi/lib/*.md` |
| Templates | `schovi/templates/` |
| Documentation | `doc/` |

For detailed documentation, see the [doc/](doc/) directory.
