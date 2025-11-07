# `datadog-auto-detector` Skill

## Description

Automatic detection skill that identifies Datadog observability mentions across ALL conversations and intelligently fetches context when needed. Supports both URL detection and natural language queries.

## Purpose

Provide seamless Datadog observability integration by:
- Detecting Datadog URLs (traces, logs, metrics, incidents)
- Detecting natural language queries ("error rate last 24h", "slow DB queries")
- Classifying data type (metrics, logs, traces, incidents)
- Fetching relevant observability data
- Reusing already-fetched context within conversation

## Detection Patterns

### URL Detection
- Traces: `https://app.datadoghq.com/apm/traces/...`
- Logs: `https://app.datadoghq.com/logs/...`
- Metrics: `https://app.datadoghq.com/metric/...`
- Incidents: `https://app.datadoghq.com/incidents/...`
- Dashboards: `https://app.datadoghq.com/dashboard/...`

### Natural Language Detection
Keywords: "error rate", "latency", "logs", "traces", "slow queries", "performance", "monitoring", "observability", "metrics", "APM"

Examples:
- "What's the error rate in last 24 hours?"
- "Show me slow database queries"
- "Check logs for authentication errors"
- "Analyze trace for request ID abc123"

## Intelligence Features

✅ **Fetch When**:
- User provides Datadog URL
- User asks observability questions with keywords
- Present/future tense

❌ **Skip When**:
- Past tense mentions ("I checked the error rate yesterday")
- Already fetched in current conversation
- False positives
- User explicitly asks not to fetch

## Data Type Classification

- **Metrics**: Time series data, aggregations, thresholds
- **Logs**: Filtered logs, patterns, error messages
- **Traces**: APM traces, spans, dependencies
- **Incidents**: Status, severity, timeline, affected services

## Dependencies

### Calls
- `datadog-analyzer` agent (for fetching observability data)

### Called By
- Automatic activation (not user-invoked)
- Works in any conversation context

## Token Savings

By using context isolation via `datadog-analyzer`:
- Without isolation: 10-50k tokens in main context
- With isolation: ~800-1200 tokens returned
- **Savings: ~75-95%**

## Usage Pattern

Automatic - no user invocation needed. Examples:

```
User: "What's the error rate in production?"
→ Skill detects "error rate" keyword
→ Classifies intent: needs metrics data
→ Spawns datadog-analyzer subagent
→ Returns ~1000 token summary with metrics

User: "Check this trace: https://app.datadoghq.com/apm/traces/123"
→ Skill detects Datadog trace URL
→ Classifies data type: trace
→ Spawns datadog-analyzer subagent
→ Returns trace summary

User: "I already checked the slow queries yesterday"
→ Skill detects "slow queries" keyword
→ Classifies intent: past tense, skip fetch
→ Skips fetching

User: "Show me logs for authentication failures in last hour"
→ Skill detects "logs" and "authentication" keywords
→ Classifies data type: logs
→ Spawns datadog-analyzer subagent with query
→ Returns filtered logs summary
```

## MCP Server Requirement

Requires Datadog MCP server to be configured in Claude Code settings.

## Quality Requirements

- Accurately classify observability queries
- Detect both URLs and natural language
- Determine appropriate data type (metrics/logs/traces/incidents)
- Reuse context when already fetched
- Avoid false positives
- Always use `datadog-analyzer` for fetching (never fetch directly)

## Location

`schovi/skills/datadog-auto-detector/SKILL.md`
