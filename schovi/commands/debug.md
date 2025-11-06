---
description: Deep debugging workflow with root cause analysis, problematic flow identification, and single fix proposal
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|datadog-url|description] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Debugger Workflow

You are performing **deep debugging and root cause analysis** for a bug or production issue. Follow this structured workflow to identify the problematic flow and propose a single, targeted fix.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-2 (debugging and root cause analysis). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

**Why Plan Mode**:
- Phases 1-3 require deep debugging and understanding WITHOUT making changes
- Plan mode ensures safe, read-only codebase investigation
- Debugging work (tracing flows, identifying root causes) should happen in plan mode
- Only file output operations (Phase 4-5) require execution mode

**Workflow**:
```
┌──────────────────────────────────┐
│  PLAN MODE (Read-only)           │
│  Phases 1-3: Debugging           │
└──────────────────────────────────┘
              ↓
      [ExitPlanMode Tool]
              ↓
┌──────────────────────────────────┐
│  EXECUTION MODE (Write)          │
│  Phases 4-5: Output & Completion │
└──────────────────────────────────┘
```

---

## ARGUMENT PARSING

Use lib/argument-parser.md:

```
Configuration:
  command_name: "debug"
  command_label: "Debug-Problem"

  positional:
    - name: "problem_input"
      description: "Jira ID, GitHub URL, Datadog URL, error description"
      required: false

  flags:
    - name: "--input"
      type: "path"
      description: "Read problem description from file (error log, stack trace)"
    - name: "--output"
      type: "path"
      description: "Custom output file path for debug report"
    - name: "--work-dir"
      type: "path"
      description: "Custom work directory"
    - name: "--no-file"
      type: "boolean"
      description: "Skip file creation, terminal only"
    - name: "--quiet"
      type: "boolean"
      description: "Suppress terminal output"
    - name: "--post-to-jira"
      type: "boolean"
      description: "Post debug report as Jira comment"

  validation:
    - --output and --no-file are mutually exclusive
    - --post-to-jira requires Jira ID in problem_input
    - At least one input source required (positional or --input)
```

**Store parsed values:**
- `problem_input`: Positional argument or --input file content
- `output_path`: --output value or null
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)
- `jira_posting`: true if --post-to-jira

---

## PHASE 1: INPUT PROCESSING & CONTEXT GATHERING

Use lib/input-processing.md:

```
Configuration:
  command_context: "debug"
  command_label: "Debug-Problem"

  input_sources:
    - jira: true        # Fetch bug details from Jira via jira-analyzer
    - github_pr: true   # Fetch PR context via gh-pr-analyzer
    - github_issue: true # Fetch issue context via gh-issue-analyzer
    - datadog: true     # Future: Fetch trace via datadog-analyzer
    - text: true        # Parse error messages, stack traces directly
    - file: true        # Read from --input file

  parsing_hints:
    - Extract error messages and exception types
    - Identify stack traces (file:line patterns)
    - Extract reproduction steps
    - Identify affected services/components
    - Note severity and impact

  validation:
    - Ensure problem context is clear
    - Verify error details are present
    - Check if stack trace or error location available

Output (store for Phase 2):
  problem_summary: "[One-line problem description]"
  error_details: {
    error_message: "...",
    exception_type: "...",
    stack_trace: "...",
    entry_point: "file:line" or null,
    error_point: "file:line" or null
  }
  reproduction_steps: ["..."]
  severity: "Critical|High|Medium|Low"
  jira_id: "EC-1234" or null
```

---

### Step 1.3: Work Folder Resolution

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"

  identifier: [jira_id from input processing, or null]
  description: [problem_summary from input processing]

  workflow_type: "bug"  # Bug-fix workflow: debug → implement

  workflow_steps:
    - "debug"      # Current step
    - "implement"

  custom_work_dir: [work_dir from arguments, or null]

  file_numbering:
    "debug": "02-debug.md"
    "implement": "03-implementation-notes.md"

Output (store for later phases):
  work_folder: ".WIP/EC-1234-bug-fix" or null
  metadata: {JSON object with workflow state} or null
```

---

**Phase 1 Validation Checkpoint:**
```
- [ ] Problem input parsed successfully
- [ ] Context fetched (Jira/GitHub/Datadog/text)
- [ ] Error details extracted (message, type, stack trace)
- [ ] Severity and impact understood
- [ ] Work folder resolved (if applicable)
```

---

## PHASE 2: DEEP DEBUGGING & ROOT CAUSE ANALYSIS

**CRITICAL**: Use the **Task tool with Explore subagent type** for focused debugging exploration.

### Step 2.1: Prepare Comprehensive Debugging Prompt

**Construct detailed prompt for Explore subagent:**

```markdown
# Debugging Investigation Request

## Problem Context
[problem_summary from Phase 1]

**Error Details**:
- Error Message: [error_message]
- Exception Type: [exception_type]
- Severity: [severity]

[If stack trace available]:
**Stack Trace Context**:
- Exception: [exception_type]: [error_message]
- Entry Point: [entry_point] - Start investigation here
- Error Point: [error_point] - Error occurs here
- Stack trace: [formatted stack trace]

[If Datadog trace available]:
**Datadog Trace Context**:
- Trace ID: [trace_id]
- Service: [service_name]
- Operation: [operation_name]
- Error: [error_message]
- Key Spans: [span_details]

[If reproduction steps available]:
**Reproduction**:
[List steps from Phase 1]

## Required Investigation

Your task is to perform comprehensive debugging to identify the root cause and determine the fix location. Provide specific file:line references throughout.

### 1. Error Point Investigation

**Objective**: Understand exactly where and why the error occurs.

**Requirements**:
- Read the file at error_point (from stack trace or context)
- Examine the exact line and surrounding context (±10 lines)
- Identify immediate cause: null/undefined value, wrong type, missing validation, incorrect logic, etc.
- Check function signature and parameters
- Look for assumptions that might be violated
- Document what should happen vs. what actually happens

**Deliverable**: Error point analysis with file:line references and immediate cause

### 2. Execution Flow Tracing

**Objective**: Trace the execution path from entry point to error point.

**Requirements**:
- Start at entry_point (API endpoint, event handler, function call)
- Follow execution path step-by-step to error_point
- Identify all intermediate functions/methods called
- Note where data is transformed or passed between functions
- Look for conditional logic that affects flow
- Identify where things go wrong in the flow

**Flow should show**:
```
Entry Point (file:line) - What triggers execution
  ↓
Step 1 (file:line) - What happens, what data
  ↓
Step 2 (file:line) - What happens, what data
  ↓
Problem Point (file:line) - Where/why it breaks
```

**Deliverable**: Complete execution flow with file:line references showing path from entry to error

### 3. Root Cause Identification

**Objective**: Determine the underlying cause, not just the symptom.

**Ask these questions**:
- Why is the error occurring? (immediate technical reason)
- What condition causes this to happen? (triggering scenario)
- Why wasn't this caught earlier? (validation/error handling gaps)
- Is this a logic error, data issue, timing issue, or integration problem?
- What assumptions were made that turned out to be incorrect?

**Investigate**:
- Data initialization: Where should data be set? Is it always set?
- Error handling: Are there missing null checks, try/catch blocks?
- State management: Is shared state corrupted or not initialized?
- Race conditions: Could timing or async operations cause this?
- Integration issues: Could external service failures propagate here?

**Categorize root cause**:
- **Logic Error**: Incorrect conditional, wrong algorithm, bad calculation
- **Data Issue**: Missing validation, incorrect initialization, type mismatch
- **Timing Issue**: Race condition, async handling, event ordering
- **Integration Issue**: External dependency failure, API contract change
- **Configuration Issue**: Missing env var, incorrect config, feature flag

**Deliverable**: Root cause explanation with category, why it happens, and what condition triggers it

### 4. Impact Analysis

**Objective**: Understand scope and severity of the issue.

**Requirements**:
- Identify affected code paths (how many ways can this error occur?)
- Check if error is isolated or affects multiple features
- Look for similar patterns in codebase (are there other instances?)
- Assess data corruption risk (can bad data be written?)
- Check error handling (is error caught and logged or does it crash?)

**Deliverable**: Impact summary with severity, scope, and data safety assessment

### 5. Fix Location Identification

**Objective**: Pinpoint exactly where the fix should be applied.

**Requirements**:
- Identify the specific file:line where fix should be applied
- Determine fix type: add validation, fix logic, improve error handling, initialize data, etc.
- Consider fix placement: at entry point (validate early) vs. at error point (defensive coding)
- Check for side effects: will fix affect other code paths?
- Note any related locations that need similar fixes

**Deliverable**: Fix location with file:line and recommended fix type

## Output Format

Please structure your findings in these sections:

1. **Error Point Analysis**: Exact location, immediate cause, code context
2. **Execution Flow**: Step-by-step trace from entry to error with file:line refs
3. **Root Cause**: Category, technical explanation, triggering condition
4. **Impact Assessment**: Severity, scope, affected features, data risk
5. **Fix Location**: Specific file:line where fix should be applied, fix type

## Important Notes
- Use specific file:line references throughout (e.g., `src/services/UserService.ts:123`)
- Focus on finding THE root cause, not listing all possible issues
- Prioritize actionable findings that directly support fixing the bug
- If you find the code location from stack trace or context, read it immediately
```

### Step 2.2: Invoke Explore Subagent

1. **Acknowledge subagent invocation**:
   ```
   🐛 **[Debug-Problem]** Starting deep debugging analysis...
   ⏳ Spawning Explore subagent for code investigation...
   ```

2. **Use Task tool**:
   ```
   subagent_type: "Explore"
   thoroughness: "very thorough"
   description: "Deep debugging and root cause analysis"
   prompt: [The comprehensive prompt prepared in Step 2.1]
   ```

3. **Wait for subagent completion**

4. **Acknowledge completion**:
   ```
   ✅ **[Debug-Problem]** Root cause analysis complete
   ```

**Important**: Do NOT execute the debugging instructions directly. The Explore subagent will handle all code investigation.

### Step 2.3: Capture and Structure Debugging Results

**Extract key findings from subagent response**:
- error_point_analysis = [Location, immediate cause, code context]
- execution_flow = [Step-by-step trace with file:line references]
- root_cause = [Category, explanation, triggering condition]
- impact_assessment = [Severity, scope, data risk]
- fix_location = [Specific file:line and fix type]
- code_locations = [All file:line references discovered]

**Validate debugging completeness**:
```
- [ ] Error point analyzed with immediate cause
- [ ] Execution flow traced from entry to error with file:line refs
- [ ] Root cause identified with category and explanation
- [ ] Impact assessed (severity, scope)
- [ ] Fix location identified with specific file:line
- [ ] At least 3-5 file:line references in execution flow
```

**If validation fails**:
```
⚠️ **[Debug-Problem]** Debugging incomplete

The Explore subagent's investigation is missing:
- [List missing requirements]

Options:
1. Re-run investigation with more context (error logs, reproduction steps)
2. Supplement with targeted manual code reading
3. Proceed with available information (note gaps in report)
```

Ask user how to proceed. Do NOT continue to Phase 3 with incomplete data.

**If validation passes**:
```
✅ **[Debug-Problem]** Debugging findings validated and structured for fix proposal generation
```

Store the structured findings for Phase 3.

---

## PHASE 3: FIX PROPOSAL GENERATION

Use lib/subagent-invoker.md:

```
Configuration:
  subagent: "debug-fix-generator"
  command_context: "debug"
  command_label: "Debug-Problem"

  input_context:
    problem_summary: [from Phase 1]
    error_details: [from Phase 1]

    debugging_results:
      error_point_analysis: [from Phase 2]
      execution_flow: [from Phase 2]
      root_cause: [from Phase 2]
      impact_assessment: [from Phase 2]
      fix_location: [from Phase 2]
      code_locations: [from Phase 2]

  validation_rules:
    - Must have YAML frontmatter with metadata
    - Must have problem summary with error description and severity
    - Must have root cause section with category and explanation
    - Must have execution flow with file:line references
    - Must have fix proposal with specific code changes
    - Must have fix location with exact file:line
    - Must have testing strategy with test cases
    - Must have rollout plan with deployment steps
    - All file references must use file:line format
    - Token count under 2500

  error_handling:
    - If validation fails: Regenerate with more specific prompt
    - If subagent fails: Report error, don't attempt fallback
```

**Store generated fix proposal for Phase 4.**

---

## PHASE 3.5: EXIT PLAN MODE

Use lib/exit-plan-mode.md:

```
Configuration:
  command_type: "debug"
  command_label: "Debug-Problem"

  summary:
    problem: [problem_summary from Phase 1]
    root_cause: [root_cause from Phase 2]
    fix_location: [fix_location from Phase 2]
    fix_type: [fix type from Phase 3]
    severity: [severity from Phase 1]
```

---

## PHASE 4: OUTPUT HANDLING

Use lib/output-handler.md:

```
Configuration:
  content: [Generated fix proposal from Phase 3]
  content_type: "debug"
  command_label: "Debug-Problem"

  flags:
    terminal_output: [terminal_output from argument parsing]
    file_output: [file_output from argument parsing]
    jira_posting: [jira_posting from argument parsing]

  file_config:
    output_path: [output_path from arguments, or null for auto]
    default_basename: "debug"
    work_folder: [work_folder from Phase 1, or null]
    jira_id: [jira_id from Phase 1, or null]
    workflow_step: "debug"

  jira_config:
    jira_id: [jira_id from Phase 1, or null]
    cloud_id: "productboard.atlassian.net"
    jira_title: "Debug Report"
    jira_author: "Claude Code"

Output (store result for Phase 5):
  output_result: {
    terminal_displayed: [true/false],
    file_created: [true/false],
    file_path: [path or null],
    jira_posted: [true/false],
    metadata_updated: [true/false]
  }
```

---

## PHASE 5: COMPLETION & NEXT STEPS

Use lib/completion-handler.md:

```
Configuration:
  command_type: "debug"
  command_label: "Debug-Problem"

  summary_data:
    problem: [problem_summary from Phase 1]
    output_files: [file_path from output_result if file_created]
    jira_posted: [jira_posted from output_result]
    jira_id: [jira_id from Phase 1 or null]
    work_folder: [work_folder from Phase 1 or null]
    terminal_only: [true if file_output was false]

  command_specific_data:
    root_cause: [root_cause from Phase 2]
    fix_location: [fix_location from Phase 2]
    severity: [severity from Phase 1]

This will:
  - Display completion summary box with root cause and fix location
  - Offer next steps: apply fix, review details, update Jira
  - Handle user's choice (implement fix, discuss, post to Jira)
```

---

## QUALITY GATES REFERENCE

**Note**: Quality gates are enforced in Phase 2.3 and Phase 3 validation.

Fix proposal from debug-fix-generator subagent must contain:

- [ ] YAML frontmatter with all required fields
- [ ] Problem summary with error description and severity
- [ ] Root cause section with category and explanation
- [ ] Execution flow with file:line references
- [ ] Fix proposal with specific code changes
- [ ] Fix location with exact file:line
- [ ] Testing strategy with test cases
- [ ] Rollout plan with deployment steps
- [ ] Resources & references with code locations
- [ ] All file references use file:line format
- [ ] Token count under 2500 (from subagent footer)

---

## INTERACTION GUIDELINES

**Communication Style**:
- Be clear about what's happening at each phase
- Use debugging-focused language (root cause, execution flow, fix location)
- Acknowledge long-running operations (spawning subagents)
- Celebrate completion with clear summary

**Handling Errors**:
- If subagent fails: Report error clearly, don't attempt to continue
- If file write fails: Report error, fix proposal still in terminal
- If Jira posting fails: Warn but continue (non-critical)

**Context Management**:
- Phase 1-2: Accumulate debugging context (error traces, root cause)
- Phase 3: Delegate to subagent (context isolation)
- Phase 4-5: Handle output (clean main context)

**Token Efficiency**:
- Subagent processes verbose debugging results (~2-3k tokens)
- Returns clean fix proposal (~1.5-2k tokens)
- Main context stays clean for next task

---

## 🚀 BEGIN DEBUGGING

Start with Argument Parsing, then proceed to Phase 1: Input Processing & Context Gathering.
