---
name: debug
description: "Debugging and Datadog observability. Two modes: (1) Explicit /schovi:debug for deep root cause analysis with fix proposals from Jira IDs, GitHub issues, Datadog URLs, or error descriptions. (2) Auto-detection: when user mentions Datadog resources (URLs, 'error rate of service X', 'check logs for Y', observability queries) and needs data, automatically fetches condensed summary via datadog-analyzer subagent. Skips auto-fetch for past tense mentions, already-fetched data, or informational discussions."
disable-model-invocation: false
user-invocable: true
---

# Debug Skill

Unified skill for deep debugging workflows and Datadog observability context fetching.

## Codex Compatibility

If a Claude-style custom subagent is unavailable, execute the referenced analyzer or executor workflow directly with available Codex tools. Use `schovi/agents/debug-executor/AGENT.md`, `schovi/agents/datadog-analyzer/AGENT.md`, and `schovi/agents/jira-analyzer/AGENT.md` as reference instructions. For codebase exploration, use Codex's available exploration tools or built-in subagents.

## Two Modes

### Mode 1: Explicit Debug (`/debug <arg>`)

Full structured debugging with root cause analysis and fix proposal via debug-executor subagent.

### Mode 2: Auto-Detection (Datadog mentions in conversation)

When user mentions Datadog resources or asks observability questions, fetch data via datadog-analyzer and integrate into response. No formal debug output, just natural context integration.

---

## Mode Selection

**Explicit debug** when:
- User invokes `/schovi:debug <arg>`
- User says "debug this issue", "find the root cause", "investigate this bug"

**Auto-detection** when:
- User provides Datadog URL: `https://app.datadoghq.com/...`
- User asks observability questions: "What's the error rate?", "Show me logs for service X"
- User checks status: "Is pb-backend-web healthy?", "Check monitors"
- User investigates: "Users report 500 errors, can you check Datadog?"

**Skip auto-detection** when:
- Past tense: "I checked the error rate yesterday", "Datadog showed high latency"
- Already fetched: Same resource fetched in recent conversation
- Informational: "Datadog is our monitoring tool", "We use Datadog for observability"
- Too vague: "Something in Datadog" (ask for clarification instead)

---

## Datadog Pattern Recognition

Detect these patterns in user messages:

### URL Patterns
- **Logs**: `https://app.datadoghq.com/.../logs?query=...`
- **APM/Traces**: `https://app.datadoghq.com/.../apm/traces?...`, `.../apm/trace/[trace-id]`
- **Metrics**: `https://app.datadoghq.com/.../metric/explorer?...`
- **Dashboards**: `https://app.datadoghq.com/.../dashboard/[id]`
- **Monitors**: `https://app.datadoghq.com/.../monitors/[id]`
- **Incidents**: `https://app.datadoghq.com/.../incidents/[id]`
- **Services**: `https://app.datadoghq.com/.../services/[name]`
- **RUM**: `https://app.datadoghq.com/.../rum/...`

### Natural Language Patterns
- **Metrics**: "error rate of [service]", "latency of [service]", "CPU usage", "throughput"
- **Logs**: "logs for [service]", "error logs", "check [service] logs"
- **Traces**: "traces for [service]", "slow requests in [service]", "APM data"
- **Incidents**: "active incidents", "SEV-1 incidents", "current incidents"
- **Monitors**: "alerting monitors", "triggered monitors", "check monitors for [service]"
- **Service health**: "status of [service]", "health of [service]", "is [service] healthy?"

---

## Mode 2: Auto-Detection Workflow

### Step 1: Detect & Evaluate

Scan message for Datadog URLs and observability keywords. Evaluate whether fetching is genuinely needed (see selection rules above).

### Step 2: Classify Intent

- **Full Context**: User wants comprehensive analysis ("Analyze error rate of pb-backend-web")
- **Specific Query**: User wants specific metric/log/trace ("Show error logs in last hour")
- **Quick Status**: User wants high-level status ("Is pb-backend-web healthy?")
- **Investigation**: User is debugging ("Users report 500 errors, investigate")
- **Comparison**: User wants to compare ("Compare error rates of service A and B")

### Step 3: Fetch Datadog Context

Spawn datadog-analyzer subagent:

```
Tool: Agent
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

Use the summary to answer the user's question. Extract the relevant parts, don't regurgitate the full summary.

**Session memory:** Don't re-fetch resources already fetched in this conversation. Re-fetch only if user explicitly requests fresh data.

---

## Mode 1: Explicit Debug Workflow

### Phase 1: Argument Parsing

Parse single positional argument (or none). Detect input type in this order:

1. **Jira pattern**: Matches `[A-Z]{2,10}-\d{1,6}` (e.g., EC-1234, PROJ-567)
2. **Datadog URL**: Contains `datadoghq.com` (logs, traces, metrics, etc.)
3. **GitHub PR**: URL, `owner/repo#123`, or `#123` containing "pull"
4. **GitHub Issue**: URL or `owner/repo#123` containing "issues"
5. **File path**: Path exists and is a file (error log, stack trace)
6. **Plain text**: Everything else (error description)

Store: `INPUT_TYPE` and `INPUT_VALUE`

**At least one input source required.**

### Phase 2: Execute Debug (Isolated Context)

Spawn debug-executor subagent to perform ALL debugging work in isolated context.

```
Task tool configuration:
  subagent_type: "schovi:debug-executor:debug-executor"
  description: "Execute debug workflow"
  prompt: |
    PROBLEM REFERENCE: [INPUT_VALUE]

    CONFIGURATION:
    - identifier: [auto-detect from INPUT_VALUE or generate slug]
    - severity: [auto-detect or "Medium"]
    - input_type: [INPUT_TYPE]

    Execute complete debugging workflow:
    1. Fetch external context (Jira/GitHub/Datadog if applicable)
    2. Deep debugging & root cause analysis (Explore subagent, very thorough mode)
    3. Generate fix proposal (location, code changes, testing, rollout)

    Return structured fix proposal (~1500-2500 tokens).
```

**Expected output**: Complete structured fix proposal markdown (~1500-2500 tokens) with problem summary, root cause with execution flow, fix proposal with code changes, testing strategy, rollout plan. All file references in file:line format.

### Phase 3: Terminal Output

Display the fix proposal directly in terminal:

```markdown
# Debug Complete: [identifier]

Root cause analysis and fix proposal ready.

## Root Cause

[Extract root cause summary - 2-3 sentences]

## Fix Location

[Extract fix location - file:line]

## Fix Proposal

[Full fix proposal from executor output]

## Next Steps

Ready to implement the fix:
  /schovi:implement   # implement from this debug output
```

---

## Error Handling

- **No input provided**: Ask user for Jira ID, GitHub URL, Datadog URL, or error description
- **Invalid format**: Report error, show format examples
- **File not found**: Report error, ask for correct path
- **Executor failed**: Report error with details from subagent
- **Datadog fetch failed**: Report error, suggest checking MCP server config
- **Ambiguous service name**: Ask user to clarify which service

## Quality Gates

Before completing, verify:

- [ ] Input processed successfully with clear problem reference
- [ ] Correct mode selected (explicit debug vs auto-detection)
- [ ] Appropriate subagent invoked (debug-executor or datadog-analyzer)
- [ ] Output received within token budget
- [ ] All file references use file:line format (explicit mode)
- [ ] Terminal output displayed

## Example Usage

```bash
# Explicit debug from Jira issue
/schovi:debug EC-1234

# Explicit debug from Datadog trace URL
/schovi:debug https://app.datadoghq.com/apm/trace/abc123

# Explicit debug from GitHub issue
/schovi:debug https://github.com/owner/repo/issues/456

# Explicit debug from error description
/schovi:debug "NullPointerException in UserService.authenticate at line 123"

# Explicit debug from stack trace file
/schovi:debug ./error.log

# Auto-detection (no /debug needed)
"What's the error rate of pb-backend-web?"     → fetches Datadog metrics
"Show me logs for authentication errors"        → fetches Datadog logs
"Check this trace: https://app.datadoghq.com/..." → fetches trace data
"Is pb-backend-web healthy?"                    → fetches service status
"I checked the error rate yesterday"            → skips (past tense)
```
