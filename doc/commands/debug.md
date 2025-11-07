# `/schovi:debug` Command

## Description

Deep debugging workflow with root cause analysis and single fix proposal. Traces execution flows, identifies error points, and generates actionable fix proposals with code changes.

## Purpose

Provide comprehensive debugging for production issues with:
- Execution flow tracing from entry point to error
- Root cause identification with category classification
- Single targeted fix proposal with before/after code
- Testing strategy and rollout plan

## Workflow

1. **Phase 1: Input Processing & Context Gathering** - Parse Jira ID, GitHub issue, GitHub PR, Datadog trace, or error description; fetch details via appropriate subagent
2. **Phase 2: Deep Debugging & Root Cause Analysis** - Use Task tool with Explore subagent to trace execution flow, identify error point, and determine root cause
3. **Phase 3: Fix Proposal Generation** - Use debug-fix-generator subagent to create structured fix with code changes, testing, and rollout plan

## Input Sources

- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Datadog traces (via `datadog-analyzer` subagent when available)
- Error messages, stack traces, logs (parsed directly)
- Free-form problem descriptions

## Key Differences from Brainstorm/Research

- **Focus**: Debugging and root cause identification (vs. solution exploration or technical analysis)
- **Output**: Single targeted fix proposal (vs. 2-3 solution options or deep research)
- **Approach**: Execution flow tracing and error point analysis (vs. broad exploration or deep architecture analysis)
- **Result**: Actionable fix with code changes (vs. high-level solution proposals or technical implementation considerations)

## Dependencies

### Calls
- `jira-analyzer` agent (for Jira input)
- `gh-issue-analyzer` agent (for GitHub issue input)
- `gh-pr-analyzer` agent (for GitHub PR input)
- `datadog-analyzer` agent (for Datadog input)
- `debug-fix-generator` agent (for generating fix proposal)
- Explore subagent (via Task tool for debugging)
- `argument-parser` library
- `input-processing` library
- `work-folder` library

### Called By
- User invocation
- Standalone debugging workflow

## Usage Examples

```bash
# Debug from Jira issue
/schovi:debug EC-1234

# Debug from GitHub issue
/schovi:debug https://github.com/owner/repo/issues/456

# Debug from error description
/schovi:debug "NullPointerException in UserService.authenticate at line 123"

# Debug from Datadog trace
/schovi:debug "https://app.datadoghq.com/apm/traces/..."
```

## Output

~1500-2000 tokens including:
- Error point analysis with immediate cause
- Execution flow trace from entry to error with file:line references
- Root cause identification with category and explanation
- Impact assessment (severity, scope, data risk)
- Fix location with specific file:line
- Code changes (before/after)
- Testing strategy with concrete test cases
- Rollout plan with deployment and rollback steps

## Quality Gates

All must be met before output:
- Error point analyzed with immediate cause
- Execution flow traced from entry to error with file:line references
- Root cause identified with category and explanation
- Impact assessed (severity, scope, data risk)
- Fix location identified with specific file:line
- Code changes provided (before/after)
- Testing strategy with concrete test cases
- Rollout plan with deployment and rollback steps

## Location

`schovi/commands/debug.md`
