---
name: debug
description: "Deep root cause analysis with fix proposal. Use when the user says \"/schovi:debug\", \"debug this issue\", \"find the root cause\", or \"investigate this bug\", with a ticket key, GitHub issue/PR, observability or any other source URL, error description, or stack trace file. Returns problem summary, root cause, fix proposal, testing strategy, and rollout plan."
disable-model-invocation: false
user-invocable: true
---

# Debug Skill

Structured debugging: parse a problem reference, run root cause analysis in isolated context via the debug-executor subagent, present the fix proposal.

Conversational observability questions ("what's the error rate of X?", a pasted Datadog URL with no debug request) belong to the `datadog-auto-detector` skill, not this one.

## Codex Compatibility

If a Claude-style custom subagent is unavailable, execute the workflow directly with available Codex tools. Use `plugins/schovi/agents/debug-executor/AGENT.md` plus `plugins/schovi/references/sources.md` and the matching analyzer AGENT.md as reference instructions. For codebase exploration, use Codex's available exploration tools or built-in subagents.

## Trigger

- User invokes `/schovi:debug <arg>`
- User says "debug this issue", "find the root cause", "investigate this bug"

---

## Workflow

### Phase 1: Argument Parsing

Parse single positional argument (or none). Detect input type in this order:

1. **GitHub PR**: URL, `owner/repo#123`, or `#123` containing "pull"
2. **GitHub Issue**: URL or `owner/repo#123` containing "issues"
3. **File path**: Path exists and is a file (error log, stack trace)
4. **Ticket key**: Matches `[A-Z][A-Z0-9]{1,9}-\d{1,6}` (e.g. PROJ-123, ABC-456)
5. **URL**: Anything else starting with `http` (observability vendor, doc, dashboard, incident page)
6. **Plain text**: Everything else (error description)

Store: `INPUT_TYPE` and `INPUT_VALUE`. The executor resolves the reference through the plugin's `../../references/sources.md`, so any host works, not a fixed list of vendors.

**At least one input source required.** If none provided, ask for a ticket key, a link to the failure (issue, dashboard, incident), or an error description.

### Phase 2: Execute Debug (Isolated Context)

Spawn debug-executor subagent to perform ALL debugging work in isolated context.

```
Agent tool configuration:
  subagent_type: "schovi:debug-executor:debug-executor"
  description: "Execute debug workflow"
  prompt: |
    PROBLEM REFERENCE: [INPUT_VALUE]

    CONFIGURATION:
    - identifier: [auto-detect from INPUT_VALUE or generate slug]
    - severity: [auto-detect or "Medium"]
    - input_type: [INPUT_TYPE]

    Execute complete debugging workflow:
    1. Fetch external context for the reference if applicable (per plugins/schovi/references/sources.md)
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

- **No input provided**: Ask user for a ticket key, a source URL, or an error description
- **Invalid format**: Report error, show format examples
- **File not found**: Report error, ask for correct path
- **Executor failed**: Report error with details from subagent
- **External fetch failed** (any source inside executor): Report error, suggest checking auth or MCP server config

## Example Usage

```bash
/schovi:debug PROJ-123                                   # from a tracker ticket
/schovi:debug https://app.datadoghq.com/apm/trace/abc123 # from an APM trace
/schovi:debug https://any/incident/or/doc/url            # from any other source
/schovi:debug https://github.com/owner/repo/issues/456   # from GitHub issue
/schovi:debug "NullPointerException in UserService.authenticate at line 123"
/schovi:debug ./error.log                                # from stack trace file
```
