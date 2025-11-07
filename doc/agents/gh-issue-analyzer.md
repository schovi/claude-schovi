# `gh-issue-analyzer` Agent

## Description

Context-isolated subagent that fetches and summarizes GitHub issues. Operates in isolated context to prevent token pollution in main workflow.

## Purpose

Fetch complete GitHub issue data and condense to ~600-800 token summary with:
- Core issue information (number, title, status, author)
- Description condensed to 500 chars
- Labels, assignees, milestones
- Max 5 key comments
- Analysis notes

## Input

- GitHub issue URL (https://github.com/owner/repo/issues/123)
- Short format (owner/repo#123)

## Output

~600-800 token summary (max 1000 tokens) including:
- Issue number, title, status, author, created/updated dates
- Description (condensed to 500 chars)
- Labels, assignees, milestone
- Key comments (max 5, prioritized)
- Analysis notes and context

## Token Budget

**Max 1000 tokens** (strictly enforced)

## Tools Used

- `gh` CLI via Bash tool

## Dependencies

### Called By
- `gh-pr-auto-detector` skill (can detect issues too)
- `/schovi:brainstorm` command
- `/schovi:research` command
- `/schovi:debug` command
- `/schovi:review` command

### Calls
- GitHub CLI tools only (no subagents)

## Token Savings

- Typical issue payload: 10-20k tokens
- Summary size: ~600-800 tokens
- **Savings: ~75-90%**

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:gh-pr-auto-detector:gh-issue-analyzer"
  prompt: "Fetch and summarize GitHub issue owner/repo#123"
  description: "Fetching GitHub issue summary"
```

## Quality Requirements

- Always condense description to max 500 chars
- Return max 5 key comments (prioritize recent and actionable)
- Include labels, assignees, and milestone
- Never return full issue payload to main context
- Respect 1000 token budget strictly

## Location

`schovi/agents/gh-issue-analyzer/AGENT.md`
