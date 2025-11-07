# `input-processing` Library

## Description

Unified context fetching library for external data sources. Provides consistent input processing across all commands with context isolation.

## Purpose

Eliminate input fetching duplication by providing:
- Unified fetching from Jira, GitHub PR, GitHub issue, Datadog
- Automatic subagent selection (jira-analyzer, gh-pr-analyzer, etc.)
- Context isolation (all fetching via subagents)
- Standardized output format
- Error handling

## Size

~200 lines (saves ~150-200 lines per command)

## Features

- **Multi-Source Support**: Jira, GitHub PR, GitHub issue, Datadog, files, free-form text
- **Automatic Routing**: Selects appropriate analyzer subagent based on input type
- **Context Isolation**: Always uses subagents (never fetches directly in main context)
- **Standardized Output**: Consistent format regardless of source
- **Error Handling**: Graceful failures with clear messages

## Usage Pattern

Commands reference this library in their phase 2:

```markdown
## PHASE 2: INPUT PROCESSING

Use lib/input-processing.md with configuration:
- Input type: [from Phase 1 argument parsing]
- Supported sources: jira, github-pr, github-issue, file, text
- Mode: compact (for general analysis) or full (for review)
- Output variable: contextSummary
```

## Input Type Routing

| Input Type | Subagent | Token Limit | Usage |
|------------|---------|------------|-------|
| Jira ID | jira-analyzer | 1000 | All commands |
| GitHub PR | gh-pr-analyzer | 1200 | Brainstorm, research, debug, plan |
| GitHub PR (review) | gh-pr-reviewer | 15000 | Review command only |
| GitHub Issue | gh-issue-analyzer | 1000 | All commands |
| Datadog URL | datadog-analyzer | 1500 | Debug command |
| File | Read tool | N/A | Direct read |
| Text | None | N/A | Pass through |

## Dependencies

### Called By
- All commands that accept external input (brainstorm, research, debug, plan, commit, publish, review)

### Calls
- `jira-analyzer` agent (via Task tool)
- `gh-pr-analyzer` agent (via Task tool)
- `gh-pr-reviewer` agent (via Task tool)
- `gh-issue-analyzer` agent (via Task tool)
- `datadog-analyzer` agent (via Task tool)
- Read tool (for files)

## Code Reduction

Before library:
- Each command: ~150-200 lines of input fetching logic
- 8 commands × 175 lines = **1,400 duplicate lines**

After library:
- Library: 200 lines (shared)
- Per command: Reference only (~5 lines)
- **Reduction: 1,200 lines (85%)**

## Example Configuration

```markdown
Configuration:
  Input Type: github-pr (detected from Phase 1)
  Mode: compact
  Output Variable: prContext

Processing:
  1. Detect input type: GitHub PR (owner/repo#123)
  2. Select subagent: gh-pr-analyzer
  3. Spawn via Task tool with fully qualified name
  4. Receive ~800 token summary
  5. Store in prContext variable
  6. Continue to next phase
```

## Token Isolation Benefits

All external fetching happens in isolated subagent contexts:
- Jira: 10-15k → 800 tokens (75% savings)
- GitHub PR: 20-50k → 800-1000 tokens (80-95% savings)
- GitHub Issue: 10-20k → 800 tokens (75-90% savings)
- Datadog: 10-50k → 800-1200 tokens (75-95% savings)

Main context stays clean for codebase analysis.

## Quality Requirements

- Correctly route to appropriate subagent
- Never fetch directly in main context
- Handle errors gracefully
- Provide consistent output format
- Respect subagent token budgets

## Location

`schovi/lib/input-processing.md`
