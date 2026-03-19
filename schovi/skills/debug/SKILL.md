---
name: debug
description: Deep debugging with root cause analysis and fix proposal. Use when the user says "/schovi:debug", asks to "debug this issue", "find the root cause", "investigate this bug", or provides a Jira ID, GitHub issue, or error description for debugging.
disable-model-invocation: false
---

# Problem Debugger Workflow

Perform **deep debugging and root cause analysis** for a bug or production issue using the **executor pattern**. Follow this structured workflow to identify the problematic flow and propose a single, targeted fix.

**Key Innovation**: The debug-executor subagent performs ALL work (context fetching, debugging, fix generation) in isolated context, keeping main context clean.

---

## PHASE 1: ARGUMENT PARSING

Parse single positional argument (or none). Detect input type in this order:

1. **Jira pattern**: Matches `[A-Z]{2,10}-\d{1,6}` (e.g., EC-1234, PROJ-567)
2. **GitHub PR**: URL, `owner/repo#123`, or `#123` containing "pull"
3. **GitHub Issue**: URL or `owner/repo#123` containing "issues"
4. **File path**: Path exists and is a file (error log, stack trace)
5. **Plain text**: Everything else (error description)

Store: `INPUT_TYPE` and `INPUT_VALUE`

**At least one input source required.**

---

## PHASE 2: EXECUTE DEBUG (Isolated Context)

**Objective**: Spawn debug-executor subagent to perform ALL debugging work in isolated context.

**Use Task tool with debug-executor**:

```
Task tool configuration:
  subagent_type: "schovi:debug-executor:debug-executor"
  description: "Execute debug workflow"
  prompt: |
    PROBLEM REFERENCE: [INPUT_VALUE]

    CONFIGURATION:
    - identifier: [auto-detect from INPUT_VALUE or generate slug]
    - severity: [auto-detect or "Medium"]

    Execute complete debugging workflow:
    1. Fetch external context (Jira/GitHub if applicable)
    2. Deep debugging & root cause analysis (Explore subagent, very thorough mode)
    3. Generate fix proposal (location, code changes, testing, rollout)

    Return structured fix proposal (~1500-2500 tokens).
```

**Expected output from executor**:
- Complete structured fix proposal markdown (~1500-2500 tokens)
- Includes: problem summary, root cause with execution flow, fix proposal with code changes, testing strategy, rollout plan
- All file references in file:line format
- Already formatted

**Store executor output as `fix_proposal_output`**.

---

## PHASE 3: TERMINAL OUTPUT

Display the fix proposal directly in terminal:

```markdown
# Debug Complete: [identifier]

Root cause analysis and fix proposal ready.

## Root Cause

[Extract root cause summary from fix_proposal_output - 2-3 sentences]

## Fix Location

[Extract fix location from output - file:line]

## Fix Proposal

[Full fix proposal from executor output]

## Next Steps

Ready to implement the fix:
  /schovi:implement   # implement from this debug output
```

**Command complete.**

---

## ERROR HANDLING

### Input Processing Errors
- **No input provided**: Ask user for Jira ID, GitHub URL, or error description
- **Invalid format**: Report error, show format examples
- **File not found**: Report error, ask for correct path

### Executor Errors
- **Executor failed**: Report error with details from subagent
- **Validation failed**: Check fix_proposal_output has required sections

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with clear problem reference
- [ ] Executor invoked and completed successfully
- [ ] Fix proposal output received (~1500-2500 tokens)
- [ ] Root cause identified with execution flow
- [ ] Fix location specified with file:line
- [ ] Code changes provided (before/after)
- [ ] Testing strategy included
- [ ] All file references use file:line format
- [ ] Terminal output displayed

---

## NOTES

**Design Philosophy**:
- **Executor pattern**: ALL work (fetch + debug + generate) happens in isolated context
- **Main context stays clean**: Only sees final formatted output (~1.5-2.5k tokens)
- **Token efficiency**: 96% reduction in main context (from ~63k to ~2.5k tokens)

**Integration**:
- Input from: Jira, GitHub issues/PRs, error descriptions, stack traces
- Next command: `/schovi:implement` for applying the fix

**Executor Capabilities**:
- Spawns jira-analyzer, gh-issue-analyzer for external context
- Spawns Explore subagent for very thorough debugging
- Generates fix proposal with code changes
- All in isolated context, returns clean result

## Example Usage

```bash
# Debug from Jira issue
/schovi:debug EC-1234

# Debug from GitHub issue
/schovi:debug https://github.com/owner/repo/issues/456

# Debug from error description
/schovi:debug "NullPointerException in UserService.authenticate at line 123"

# Debug from stack trace file
/schovi:debug ./error.log
```