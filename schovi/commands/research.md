---
description: Deep technical analysis of ONE specific approach with detailed file:line references
argument-hint: --input PATH [--option N] [--output PATH] [--no-file] [--quiet] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Task", "ExitPlanMode", "AskUserQuestion"]
---

# Research Workflow

You are performing **deep technical research** of ONE specific approach using the **executor pattern**. Follow this structured workflow to generate detailed analysis with comprehensive file:line references and implementation considerations.

**Key Innovation**: The research-executor subagent performs ALL work (target extraction, context fetching, exploration, generation) in isolated context, keeping main context clean.

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

## PHASE 1: ARGUMENT PARSING & OPTION SELECTION

Use lib/argument-parser.md:

```
Configuration:
  command_name: "research"
  command_label: "Research-Approach"

  positional: []

  flags:
    - name: "--input"
      type: "path"
      description: "REQUIRED: Brainstorm file, Jira ID, GitHub URL, file, or description"
      required: true
    - name: "--option"
      type: "number"
      description: "Option number to research (1, 2, 3) if input is brainstorm file"
    - name: "--output"
      type: "path"
      description: "Custom output file path for research"
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
    - --input is REQUIRED
    - --output and --no-file are mutually exclusive
    - --option must be 1-5 if provided
```

**Store parsed values:**
- `input_value`: --input value (file path, Jira ID, GitHub URL, or text)
- `option_number`: --option value or null
- `output_path`: --output value or null
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)

**If brainstorm file without --option flag**:
```
Use AskUserQuestion tool: "Which option would you like to research? (1, 2, or 3)"
Store user response as option_number
```

---

## PHASE 2: EXECUTE RESEARCH (Isolated Context)

**Objective**: Spawn research-executor subagent to perform ALL research work in isolated context.

**Use Task tool with research-executor**:

```
Task tool configuration:
  subagent_type: "schovi:research-executor"
  model: "sonnet"
  description: "Execute research workflow"
  prompt: |
    RESEARCH INPUT: [input_value]

    CONFIGURATION:
    - option_number: [option_number or null]
    - identifier: [auto-detect or generate]
    - exploration_mode: thorough

    Execute complete research workflow:
    1. Extract research target (from brainstorm option, Jira, GitHub, etc.)
    2. Fetch external context if needed (Jira/GitHub via nested subagents)
    3. Deep codebase exploration (Plan subagent, thorough mode)
    4. Generate detailed technical analysis following template

    Return structured research output (~4000-6000 tokens) with file:line references.
```

**Expected output from executor**:
- Complete structured research markdown (~4000-6000 tokens)
- Includes: problem summary, architecture, data flow, dependencies, implementation considerations, performance/security
- All file references in file:line format
- Already formatted following `schovi/templates/research/full.md`

**Store executor output**:
- `research_output`: Complete markdown from executor
- `identifier`: Extract from research header or use fallback

---

## PHASE 3: EXIT PLAN MODE

**CRITICAL**: Before proceeding to output handling, use ExitPlanMode tool.

```
ExitPlanMode tool:
  plan: |
    # Deep Research Completed

    Research analysis completed via research-executor subagent.

    **Identifier**: [identifier]
    **Research Target**: [Brief description]

    ## Key Findings

    - Research target extracted and analyzed
    - Deep codebase exploration completed (thorough mode)
    - Architecture mapped with file:line references
    - Dependencies identified (direct and indirect)
    - Implementation considerations provided

    ## Next Steps

    1. Save research output to work folder
    2. Display summary to user
    3. Guide user to plan command for implementation spec
```

**Wait for user approval before proceeding to Phase 4.**

---

## PHASE 4: OUTPUT HANDLING & WORK FOLDER

Use lib/work-folder.md:

```
Configuration:
  command_name: "research"
  identifier: [identifier from research_output]
  work_dir: [work_dir from argument parsing or null]

  file_handling:
    create_file: [file_output]
    file_content: [research_output from Phase 2]
    default_filename: "research-[identifier].md"
    custom_path: [output_path or null]

  metadata:
    command: "research"
    identifier: [identifier]
    timestamp: [current timestamp]
    input_type: [detected from input_value]
    source: [source description]
    exploration_time: [N/A - handled by executor]
    is_from_brainstorm: [true if brainstorm file]
    option_number: [option_number if applicable]

  terminal_output: [terminal_output]
  terminal_message: |
    # 🔬 Research Complete: [identifier]

    Deep technical analysis completed.

    ## 📊 Analysis Summary

    [Extract key findings from research_output - 3-5 bullet points]

    ## 📁 Output

    Research saved to: `[file_path]`
    Work folder: `[work_folder_path]`

    ## 📋 Next Steps

    Ready to create implementation specification:

    ```bash
    /schovi:plan --input research-[identifier].md
    ```

    This will generate detailed implementation tasks, acceptance criteria, and rollout plan.
```

---

## PHASE 5: COMPLETION

**Final Message**:
```
✅ Research completed successfully!

🔬 Deep analysis for [identifier] complete
📊 Architecture mapped with file:line references
📁 Saved to: [file_path]

📋 Ready for implementation planning? Run:
   /schovi:plan --input research-[identifier].md
```

**Command complete.**

---

## ERROR HANDLING

### Input Processing Errors
- **--input not provided**: Report error, show usage example
- **File not found**: Report error, ask for correct path
- **Brainstorm file without option**: Ask user interactively which option to research
- **--option with non-brainstorm input**: Report error, explain --option only for brainstorm files
- **Invalid option number**: Report error, show valid options

### Executor Errors
- **Executor failed**: Report error with details from subagent
- **Validation failed**: Check research_output has required sections
- **Token budget exceeded**: Executor handles compression, shouldn't happen

### Output Errors
- **File write failed**: Report error, offer terminal-only output
- **Work folder error**: Use fallback location or report error

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with research target identified
- [ ] Executor invoked and completed successfully
- [ ] Research output received (~4000-6000 tokens)
- [ ] Output contains all required sections
- [ ] Architecture mapped with file:line references
- [ ] Dependencies identified (direct and indirect)
- [ ] Data flow traced with file:line references
- [ ] Code quality assessed with examples
- [ ] Implementation considerations provided
- [ ] All file references use file:line format
- [ ] File saved to work folder (unless --no-file)
- [ ] Metadata updated
- [ ] Terminal output displayed (unless --quiet)
- [ ] User guided to plan command for next step

---

## NOTES

**Design Philosophy**:
- **Executor pattern**: ALL work (extract + fetch + explore + generate) happens in isolated context
- **Main context stays clean**: Only sees final formatted output (~4-6k tokens)
- **Token efficiency**: 93% reduction in main context (from ~86k to ~6k tokens)
- **Consistent experience**: User sees same output, just more efficient internally

**Token Benefits**:
- Before: Main context sees input + exploration (83k) + generation = ~86k tokens
- After: Main context sees only final output = ~6k tokens
- Savings: 80k tokens (93% reduction)

**Integration**:
- Input from: Brainstorm files (with option), Jira, GitHub, files, or text
- Output to: Work folder with metadata
- Next command: Plan for implementation spec

**Executor Capabilities**:
- Extracts research target from brainstorm files (with option selection)
- Spawns jira-analyzer, gh-pr-analyzer for external context
- Spawns Plan subagent for thorough-mode exploration
- Reads research template and generates formatted output with file:line refs
- All in isolated context, returns clean result

---

**Command Version**: 2.0 (Executor Pattern)
**Last Updated**: 2025-11-07
**Dependencies**:
- `lib/argument-parser.md`
- `lib/work-folder.md`
- `schovi/agents/research-executor/AGENT.md`
- `schovi/templates/research/full.md`
