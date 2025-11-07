# `datadog-analyzer` Agent

## Description

Context-isolated subagent that fetches and summarizes Datadog observability data. Operates in isolated context to prevent token pollution in main workflow.

## Purpose

Fetch Datadog observability data and condense to ~800-1200 token summary with:
- Metrics data (time series, aggregations)
- Log queries (filtered logs, patterns)
- Traces (APM traces, spans)
- Incidents (status, severity, timeline)
- Analysis notes and context

## Input

- Datadog URL (traces, logs, metrics, incidents)
- Natural language queries ("error rate last 24h", "slow DB queries")

## Output

~800-1200 token summary (max 1500 tokens) including:
- Query/URL context
- Relevant metrics/logs/traces/incidents
- Key findings and patterns
- Anomalies or issues detected
- Analysis notes

## Token Budget

**Max 1500 tokens** (strictly enforced)

## Tools Used

- `mcp__datadog-mcp__*` tools (Datadog MCP server integration)

## Dependencies

### Called By
- `datadog-auto-detector` skill
- `/schovi:debug` command (optional)

### Calls
- Datadog MCP tools only (no subagents)

## Token Savings

- Typical Datadog payload: 10-50k tokens
- Summary size: ~800-1200 tokens
- **Savings: ~75-95%**

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:datadog-auto-detector:datadog-analyzer"
  prompt: "Fetch and summarize Datadog data: [query/URL]"
  description: "Fetching Datadog observability data"
```

## Quality Requirements

- Condense to essential observability insights
- Highlight anomalies and issues
- Include relevant time ranges
- Never return raw Datadog payloads to main context
- Respect 1500 token budget strictly

## Location

`schovi/agents/datadog-analyzer/AGENT.md`
