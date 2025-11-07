# `jira-analyzer` Agent

## Description

Context-isolated subagent that fetches and summarizes Jira issues. Operates in isolated context to prevent token pollution in main workflow.

## Purpose

Fetch complete Jira issue data and condense to ~800 token summary with:
- Core issue information (key, title, status, priority)
- Description condensed to 500 chars
- Top 5 acceptance criteria
- Top 3 key comments
- Analysis notes

## Input

- Jira URL or issue key (e.g., EC-1234, IS-8046)

## Output

~800 token summary (max 1000 tokens) including:
- Issue key, title, status, priority, assignee
- Description (condensed to 500 chars)
- Acceptance criteria (max 5)
- Key comments (max 3)
- Labels, components, version info
- Analysis notes and context

## Token Budget

**Max 1000 tokens** (strictly enforced)

## Tools Used

- `mcp__jira__*` tools (Jira MCP server integration)

## Dependencies

### Called By
- `jira-auto-detector` skill
- `/schovi:brainstorm` command
- `/schovi:research` command
- `/schovi:debug` command
- `/schovi:commit` command (optional)
- `/schovi:publish` command (optional)

### Calls
- Jira MCP tools only (no subagents)

## Token Savings

- Typical Jira payload: 10-15k tokens
- Summary size: ~800 tokens
- **Savings: ~75%**

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:jira-auto-detector:jira-analyzer"
  prompt: "Fetch and summarize Jira issue EC-1234"
  description: "Fetching Jira issue summary"
```

## Quality Requirements

- Always condense description to max 500 chars
- Return max 5 acceptance criteria (prioritize most important)
- Return max 3 key comments (prioritize recent and actionable)
- Never return full Jira payload to main context
- Respect 1000 token budget strictly

## Location

`schovi/agents/jira-analyzer/AGENT.md`
