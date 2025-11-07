# `gh-pr-analyzer` Agent

## Description

Context-isolated subagent that fetches and summarizes GitHub PRs in **compact mode**. Provides concise PR context for general analysis commands.

## Purpose

Fetch GitHub PR data and condense to ~800-1000 token summary with:
- PR metadata (title, author, status, branch info)
- Top 20 changed files (prioritized by importance)
- Max 3 review comments (critical feedback only)
- Failed CI checks only (skip passing checks)
- Compact diff summary (not full diff)

## Input

- PR URL (https://github.com/owner/repo/pull/123)
- Short format (owner/repo#123 or #123)

## Output

~800-1000 token summary (max 1200 tokens) including:
- PR title, number, author, status, branch names
- Top 20 files changed (prioritized)
- Max 3 key review comments
- Failed CI checks only
- Compact diff summary
- Labels, milestones, assignees

## Token Budget

**Max 1200 tokens** (strictly enforced)

## Mode

**Compact only** - For general analysis (brainstorm, research, debug, plan)

For comprehensive PR review with full diff, see `gh-pr-reviewer` agent.

## Tools Used

- `gh` CLI via Bash tool
- Git commands via Bash tool

## Dependencies

### Called By
- `gh-pr-auto-detector` skill
- `/schovi:brainstorm` command
- `/schovi:research` command
- `/schovi:debug` command
- `/schovi:plan` command (optional)
- `/schovi:commit` command (optional)

### Calls
- GitHub CLI tools only (no subagents)

## Token Savings

- Typical PR payload: 20-50k tokens
- Compact summary: ~800-1000 tokens
- **Savings: ~80-95%**

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:gh-pr-auto-detector:gh-pr-analyzer"
  prompt: "Fetch and summarize GitHub PR owner/repo#123 in compact mode"
  description: "Fetching PR summary"
```

## Quality Requirements

- Return top 20 files only (prioritize by lines changed and importance)
- Return max 3 review comments (critical feedback only)
- Include failed CI checks only (omit passing)
- Provide compact diff summary (not full diff)
- Never return full PR payload to main context
- Respect 1200 token budget strictly

## Difference from gh-pr-reviewer

| Feature | gh-pr-analyzer (compact) | gh-pr-reviewer (full) |
|---------|-------------------------|---------------------|
| Purpose | General analysis | Code review |
| Files | Top 20 | ALL files |
| Reviews | Max 3 critical | ALL reviews |
| CI Checks | Failed only | ALL checks |
| Diff | Compact summary | Complete diff |
| Token Budget | Max 1200 | Max 15000 |
| Used By | brainstorm, research, debug, plan | review command only |

## Location

`schovi/agents/gh-pr-analyzer/AGENT.md`
