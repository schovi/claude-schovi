---
description: Deep debugging workflow with root cause analysis, problematic flow identification, and single fix proposal
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|description] [--input PATH] [--output PATH] [--no-file] [--quiet] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Task", "ExitPlanMode"]
---

# Problem Debugger Workflow

You are performing **deep debugging and root cause analysis** for a bug or production issue using the **executor pattern**. Follow this structured workflow to identify the problematic flow and propose a single, targeted fix.

**Key Innovation**: The debug-executor subagent performs ALL work (context fetching, debugging, fix generation) in isolated context, keeping main context clean.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-2 (argument parsing and executor invocation). You MUST use the **ExitPlanMode tool** before Phase 3 (output handling) to transition from analysis to execution.

**Workflow**:
```
┌──────────────────────────────────┐
│  PLAN MODE (Read-only)           │
│  Phases 1-2: Setup & Execute     │
└──────────────────────────────────┘
              ↓
      [ExitPlanMode Tool]
              ↓
┌──────────────────────────────────┐
│  EXECUTION MODE (Write)          │
│  Phases 3-4: Output & Completion │
└──────────────────────────────────┘
```

---

## PHASE 1: ARGUMENT PARSING

Use lib/argument-parser.md:

```
Configuration:
  command_name: "debug"
  command_label: "Debug-Problem"

  positional:
    - name: "problem_input"
      description: "Jira ID, GitHub URL, error description"
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

  validation:
    - --output and --no-file are mutually exclusive
    - At least one input source required (positional or --input)
```

**Store parsed values:**
- `problem_input`: Positional argument or --input file content
- `output_path`: --output value or null
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)

---

## PHASE 2: EXECUTE DEBUG (Isolated Context)

**Objective**: Spawn debug-executor subagent to perform ALL debugging work in isolated context.

**Use Task tool with debug-executor**:

```
Task tool configuration:
  subagent_type: "schovi:debug-executor"
  model: "sonnet"
  description: "Execute debug workflow"
  prompt: |
    PROBLEM REFERENCE: [problem_input]

    CONFIGURATION:
    - identifier: [auto-detect from problem_input or generate slug]
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

**Store executor output**:
- `fix_proposal_output`: Complete markdown from executor
- `identifier`: Extract from fix proposal header or use fallback

---

## PHASE 3: EXIT PLAN MODE

**CRITICAL**: Before proceeding to output handling, use ExitPlanMode tool.

```
ExitPlanMode tool:
  plan: |
    # Debugging Complete

    Root cause analysis and fix proposal completed via debug-executor subagent.

    **Identifier**: [identifier]
    **Problem**: [Brief description]

    ## Key Findings

    - Problem context fetched and analyzed
    - Deep debugging completed (Explore subagent, very thorough mode)
    - Root cause identified with execution flow trace
    - Fix location pinpointed with file:line
    - Code changes proposed with testing strategy

    ## Next Steps

    1. Save fix proposal to work folder
    2. Display summary to user
    3. Offer to implement fix
```

**Wait for user approval before proceeding to Phase 4.**

---

## PHASE 4: OUTPUT HANDLING & WORK FOLDER

Use lib/work-folder.md:

```
Configuration:
  command_name: "debug"
  identifier: [identifier from fix_proposal_output]
  work_dir: [work_dir from argument parsing or null]

  file_handling:
    create_file: [file_output]
    file_content: [fix_proposal_output from Phase 2]
    default_filename: "debug-[identifier].md"
    custom_path: [output_path or null]

  metadata:
    command: "debug"
    identifier: [identifier]
    timestamp: [current timestamp]
    input_type: [detected from problem_input]
    severity: [extracted from output]
    root_cause: [extracted from output]

  terminal_output: [terminal_output]
  terminal_message: |
    # 🐛 Debug Complete: [identifier]

    Root cause analysis and fix proposal ready.

    ## 🔍 Root Cause

    [Extract root cause summary from fix_proposal_output - 2-3 sentences]

    ## 💡 Fix Location

    [Extract fix location from output - file:line]

    ## 📁 Output

    Fix proposal saved to: `[file_path]`
    Work folder: `[work_folder_path]`

    ## 🚀 Next Steps

    Ready to implement the fix:

    ```bash
    # Review the fix proposal first
    cat [file_path]

    # Then implement (coming soon)
    /schovi:implement --input debug-[identifier].md
    ```
```

---

## PHASE 5: COMPLETION

**Final Message**:
```
✅ Debugging completed successfully!

🐛 Root cause identified for [identifier]
💡 Fix proposal generated with code changes
📁 Saved to: [file_path]

🚀 Ready to implement the fix? Review the proposal and run:
   /schovi:implement --input debug-[identifier].md
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
- **Token budget exceeded**: Executor handles compression, shouldn't happen

### Output Errors
- **File write failed**: Report error, offer terminal-only output
- **Work folder error**: Use fallback location or report error

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with clear problem reference
- [ ] Executor invoked and completed successfully
- [ ] Fix proposal output received (~1500-2500 tokens)
- [ ] Output contains all required sections
- [ ] Root cause identified with execution flow
- [ ] Fix location specified with file:line
- [ ] Code changes provided (before/after)
- [ ] Testing strategy included
- [ ] Rollout plan included
- [ ] All file references use file:line format
- [ ] File saved to work folder (unless --no-file)
- [ ] Metadata updated
- [ ] Terminal output displayed (unless --quiet)

---

## NOTES

**Design Philosophy**:
- **Executor pattern**: ALL work (fetch + debug + generate) happens in isolated context
- **Main context stays clean**: Only sees final formatted output (~1.5-2.5k tokens)
- **Token efficiency**: 96% reduction in main context (from ~63k to ~2.5k tokens)
- **Consistent experience**: User sees same output, just more efficient internally

**Token Benefits**:
- Before: Main context sees input + debugging (60k) + generation = ~63k tokens
- After: Main context sees only final output = ~2.5k tokens
- Savings: 60.5k tokens (96% reduction)

**Integration**:
- Input from: Jira, GitHub issues/PRs, error descriptions, stack traces
- Output to: Work folder with metadata
- Next command: Implement for applying the fix

**Executor Capabilities**:
- Spawns jira-analyzer, gh-issue-analyzer for external context
- Spawns Explore subagent for very thorough debugging
- Generates fix proposal with code changes
- All in isolated context, returns clean result

---

**Command Version**: 2.0 (Executor Pattern)
**Last Updated**: 2025-11-07
**Dependencies**:
- `lib/argument-parser.md`
- `lib/work-folder.md`
- `schovi/agents/debug-executor/AGENT.md`
