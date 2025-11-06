---
name: exit-plan-mode
description: Standard transition from plan mode to execution mode
allowed-tools: ["ExitPlanMode"]
---

# Exit Plan Mode Library

## Purpose

Provides consistent ExitPlanMode invocation with standardized summaries across commands.

**When to use**: After completing analysis/debugging/planning work in plan mode, before proceeding to output handling that requires Write/Bash/mcp tools.

## Usage Pattern

**Commands invoke this library when transitioning from plan to execution mode:**

```markdown
Use lib/exit-plan-mode.md with:

Configuration:
  command_type: "analyze" | "debug"
  command_label: "Analyze-Problem" | "Debug-Problem"

Summary content (for analyze):
  problem: "One-line problem summary"
  analysis_type: "Full" | "Quick"
  key_findings: ["Finding 1", "Finding 2", "Finding 3"]
  solution_options_count: 3
  recommended_option: "Option 2 - Backend service approach"

Summary content (for debug):
  problem: "One-line problem summary"
  root_cause: "Null pointer dereference in authentication flow"
  fix_location: "src/auth/validate.ts:142"
  fix_type: "Add null check before access"
  severity: "High - Production outage risk"

Next steps (both):
  - "Save [content_type] to file (if not --no-file)"
  - "Display to terminal (if not --quiet)"
  - "Post to Jira (if --post-to-jira)"
  - "Present completion summary"
```

---

## IMPLEMENTATION

### Step 1: Acknowledge Transition

Display transition message:
```
⚙️ **[Command-Label]** [Activity] complete. Transitioning from plan mode to execution mode...
```

**Activity by command type**:
- "analyze" → "Analysis"
- "debug" → "Debugging"

---

### Step 2: Invoke ExitPlanMode Tool

**For command_type = "analyze"**:

```markdown
Use ExitPlanMode tool with plan parameter:

## Analysis Summary

**Problem**: [problem from configuration]

**Analysis Type**: [analysis_type from configuration]

**Key Findings**:
- [key_findings[0]]
- [key_findings[1]]
- [key_findings[2]]
[...additional findings if present]

**Solution Options**: [solution_options_count]

**Recommended**: [recommended_option]

**Next Steps**:
1. Save analysis to file (if not --no-file)
2. Display to terminal (if not --quiet)
3. Post to Jira (if --post-to-jira)
4. Present completion summary
```

**For command_type = "debug"**:

```markdown
Use ExitPlanMode tool with plan parameter:

## Debug Summary

**Problem**: [problem from configuration]

**Root Cause**: [root_cause from configuration]

**Fix Location**: [fix_location from configuration]

**Fix Type**: [fix_type from configuration]

**Severity**: [severity from configuration]

**Next Steps**:
1. Save fix proposal to file (if not --no-file)
2. Display to terminal (if not --quiet)
3. Post to Jira (if --post-to-jira)
4. Present completion summary
```

---

### Step 3: Confirm Execution Mode

After ExitPlanMode tool completes, display confirmation:
```
✅ **[Command-Label]** Entered execution mode. Proceeding with output handling...
```

**Important**: After this point, commands can now use Write, Bash, and mcp__jira__* tools for file operations and external integrations.

---

## Notes

- This library is ONLY used by analyze and debug commands (plan and review don't use plan mode)
- The ExitPlanMode tool is critical - commands MUST call it before using Write/Bash/mcp tools
- The summary format should be concise (3-8 lines) to avoid polluting user's view
- Next steps list is standardized to match output-handler library's capabilities
