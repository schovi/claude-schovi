---
name: debug
description: "Deep root cause analysis with fix proposal. Use when the user says \"/schovi:debug\", \"debug this issue\", \"find the root cause\", or \"investigate this bug\", with a Jira ID, GitHub issue/PR, Datadog URL, error description, or stack trace file. Returns problem summary, root cause, fix proposal, testing strategy, and rollout plan."
disable-model-invocation: false
user-invocable: true
---

# Debug Skill

Structured debugging: parse a problem reference, run root cause analysis in isolated context via the debug-executor subagent, present the fix proposal.

Conversational observability questions ("what's the error rate of X?", a pasted Datadog URL with no debug request) belong to the `datadog-auto-detector` skill, not this one.

## Codex Compatibility

If a Claude-style custom subagent is unavailable, execute the workflow directly with available Codex tools. Use `plugins/schovi/agents/debug-executor/AGENT.md`, `plugins/schovi/agents/datadog-analyzer/AGENT.md`, and `plugins/schovi/agents/jira-analyzer/AGENT.md` as reference instructions. For codebase exploration, use Codex's available exploration tools or built-in subagents.

## Trigger

- User invokes `/schovi:debug <arg>`
- User says "debug this issue", "find the root cause", "investigate this bug"

---

## Workflow

### Phase 1: Argument Parsing

Parse single positional argument (or none). Detect input type in this order:

1. **Jira pattern**: Matches `[A-Z]{2,10}-\d{1,6}` (e.g., EC-1234, PROJ-567)
2. **Datadog URL**: Contains `datadoghq.com` (logs, traces, metrics, etc.)
3. **GitHub PR**: URL, `owner/repo#123`, or `#123` containing "pull"
4. **GitHub Issue**: URL or `owner/repo#123` containing "issues"
5. **File path**: Path exists and is a file (error log, stack trace)
6. **Plain text**: Everything else (error description)

Store: `INPUT_TYPE` and `INPUT_VALUE`

**At least one input source required.** If none provided, ask for a Jira ID, GitHub URL, Datadog URL, or error description.

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

Ready to implement the fix.
```

---

## Error Handling

- **No input provided**: Ask user for Jira ID, GitHub URL, Datadog URL, or error description
- **Invalid format**: Report error, show format examples
- **File not found**: Report error, ask for correct path
- **Executor failed**: Report error with details from subagent
- **External fetch failed** (Jira/GitHub/Datadog inside executor): Report error, suggest checking auth or MCP server config

## Quality Gates

Before completing, verify:

- [ ] Input processed successfully with clear problem reference
- [ ] debug-executor invoked with full three-part subagent type
- [ ] Output received within token budget
- [ ] All file references use file:line format
- [ ] Terminal output displayed

## Example Usage

```bash
/schovi:debug EC-1234                                    # from Jira issue
/schovi:debug https://app.datadoghq.com/apm/trace/abc123 # from Datadog trace
/schovi:debug https://github.com/owner/repo/issues/456   # from GitHub issue
/schovi:debug "NullPointerException in UserService.authenticate at line 123"
/schovi:debug ./error.log                                # from stack trace file
```
