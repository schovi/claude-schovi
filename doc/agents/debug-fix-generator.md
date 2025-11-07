# `debug-fix-generator` Agent

## Description

Context-isolated subagent that generates fix proposals from debugging results. Transforms debugging analysis (error point, execution flow, root cause) into actionable fix proposal with code changes.

## Purpose

Generate single targeted fix proposal with:
- Problem summary (error point, immediate cause)
- Root cause explanation (category, technical explanation)
- Impact assessment (severity, scope, data risk)
- Code changes (before/after)
- Testing strategy (test cases, validation steps)
- Rollout plan (deployment steps, rollback procedure)

## Input

Context from command including:
- Error point analysis with immediate cause
- Execution flow trace from entry to error with file:line references
- Root cause identification with category
- Impact assessment

## Output

~1500-2000 token fix proposal (max 2500 tokens) including:
- Problem Summary
- Root Cause Analysis
- Impact Assessment
- Fix Location (specific file:line)
- Code Changes (before/after)
- Testing Strategy (concrete test cases)
- Rollout Plan (deployment and rollback steps)

## Token Budget

**Max 2500 tokens** (strictly enforced)

## Tools Used

- None (pure transformation, no external API calls)

## Dependencies

### Called By
- `/schovi:debug` command

### Calls
- None (pure transformation agent)

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:debug-fix-generator"
  prompt: "Generate fix proposal from debugging: [debugging results]"
  description: "Generating fix proposal"
```

## Quality Requirements

- Fix location must include specific file:line
- Code changes must include before/after
- Testing strategy must have concrete test cases
- Rollout plan must include deployment and rollback steps
- Single targeted fix (not multiple options)
- Respect 2500 token budget strictly

## Difference from brainstorm-generator

| Feature | brainstorm-generator | debug-fix-generator |
|---------|---------------------|---------------------|
| Purpose | Explore 2-3 options | Single targeted fix |
| Input | Problem description | Debugging results |
| Output | Multiple approaches | One fix with code |
| Focus | Solution exploration | Specific fix implementation |

## Location

`schovi/agents/debug-fix-generator/AGENT.md`
