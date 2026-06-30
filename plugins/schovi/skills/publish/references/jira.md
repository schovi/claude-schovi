# Jira Context Branch (publish)

Read this file only when `INPUT_TYPE=jira`. It isolates the Jira integration so the main publish flow stays generic: repos without Jira never execute any of this.

## Fetch

Spawn the jira-analyzer subagent:

```
Tool: Agent
Parameters:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  prompt: "Fetch and summarize Jira issue [INPUT_VALUE]"
  description: "Fetching Jira issue"
```

Expected output: condensed summary (~800-1000 tokens) with core info (type, status, priority), description, acceptance criteria, key comments, technical context.

## Use the Summary

- **Title** (Step 3.3): `[JIRA_ID]: [description derived from issue summary]`
- **Context section** (Step 3.1.5): link the Jira issue URL. Take it from the user's input or the analyzer summary; if only the bare key is known and the instance URL is uncertain, ask the user for the link instead of guessing
- **Description header** (Step 3.2): link to the issue rather than restating it

## Graceful Degradation (never block publish)

- **Subagent type unavailable** (plugin agents not loaded in this session): call Jira MCP tools directly (`mcp__jira__*` or Atlassian MCP) and condense the result yourself. Never paste raw Jira payloads into the description flow
- **No Jira access at all**: continue without enrichment. Keep the `[JIRA_ID]: ` title prefix, generate the description from commit history (Step 3.1 `None` flow), and ask the user for the issue link for the Context section
- **Fetch error**: report it in one line and continue with the commit-history flow

## Codex

No `Agent` tool: use Jira MCP tools directly and condense per `plugins/schovi/agents/jira-analyzer/AGENT.md`.
