---
name: datadog-auto-detector
description: "Auto-detection: when user mentions Datadog resources (app.datadoghq.com URLs, 'error rate of service X', 'check logs for Y', monitor/incident/service-health questions) and needs data, automatically fetches condensed summary via datadog-analyzer subagent. Skips auto-fetch for past tense mentions, already-fetched data, informational discussions, or vague references."
user-invocable: false
---

# Datadog Auto-Detector Skill

Seamlessly integrates Datadog observability context into conversations without polluting the main context window. You decide WHEN to fetch; the datadog-analyzer subagent decides HOW to fetch and what to condense.

For explicit debugging requests (`/schovi:debug`, "find the root cause"), the `debug` skill owns the whole flow, including any Datadog fetching. Don't activate on top of it.

## Codex Compatibility

If a Claude-style `Task` tool or custom `subagent_type` is unavailable, use the Datadog MCP tools directly and return the same condensed summary shape (max ~1200 tokens). Never paste raw Datadog payloads. Use `plugins/schovi/agents/datadog-analyzer/AGENT.md` as reference instructions.

## Pattern Recognition

**URLs** (`https://app.datadoghq.com/...`):
- Logs: `/logs?query=...`
- APM/Traces: `/apm/traces?...`, `/apm/trace/[trace-id]`
- Metrics: `/metric/explorer?...`
- Dashboards: `/dashboard/[id]`
- Monitors: `/monitors/[id]`
- Incidents: `/incidents/[id]`
- Services: `/services/[name]`
- RUM: `/rum/...`

**Natural language:**
- Metrics: "error rate of [service]", "latency of [service]", "CPU usage", "throughput"
- Logs: "logs for [service]", "error logs", "check [service] logs"
- Traces: "traces for [service]", "slow requests in [service]", "APM data"
- Incidents: "active incidents", "SEV-1 incidents", "current incidents"
- Monitors: "alerting monitors", "triggered monitors", "check monitors for [service]"
- Service health: "is [service] healthy?", "status of [service]"

## When to Fetch

- Datadog URL shared and the user needs its content
- Observability question: "What's the error rate?", "Show me logs for service X"
- Status check: "Is pb-backend-web healthy?", "Check monitors"
- Investigation: "Users report 500 errors, can you check Datadog?"

## When to Skip

- Past tense: "I checked the error rate yesterday", "Datadog showed high latency"
- Already fetched this conversation (re-fetch only on explicit request for fresh data)
- Informational: "Datadog is our monitoring tool", "We use Datadog for observability"
- Too vague: "something in Datadog" (ask for clarification instead)

## Workflow

### Step 1: Detect & Evaluate

Scan the message for URLs and observability keywords. Apply the fetch/skip rules above.

### Step 2: Classify Intent

Full context | specific query | quick status | investigation | comparison. The intent shapes what the analyzer should focus on.

### Step 3: Fetch

```
Tool: Task
Parameters:
  subagent_type: "schovi:datadog-analyzer:datadog-analyzer"
  prompt: |
    Fetch and summarize [resource type] for [context].
    [If URL]: Datadog URL: [url]
    [If query]: Service: [name], Query Type: [type], Time Range: [range]
    Intent: [classified intent]
    Focus on: [specific aspects user cares about]
  description: "Fetching Datadog observability data"
```

### Step 4: Integrate Naturally

Answer the user's question using the relevant parts of the summary. Don't regurgitate the full summary.

## Session Memory

Track what you've fetched this conversation (check transcript for previous datadog-analyzer calls). Reuse existing context instead of re-fetching.

## Limits & Error Handling

- Max 3 resources per response; for longer lists ask which ones matter
- Fetch failed: report in one line, suggest checking the Datadog MCP server config, continue with whatever the user can provide
- Ambiguous service name: ask which service before fetching
