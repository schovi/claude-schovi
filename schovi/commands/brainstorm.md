---
description: Explore 2-3 distinct solution options with broad feasibility analysis
argument-hint: [jira-id|pr-url|#pr-number|issue-url|description] [--input PATH] [--output PATH] [--options N] [--no-file] [--quiet] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Task", "ExitPlanMode"]
---

# Brainstorm Workflow

You are performing **broad solution exploration** for a problem/feature/change using the **executor pattern**. Follow this structured workflow to generate 2-3 distinct solution options with high-level feasibility analysis.

**Key Innovation**: The brainstorm-executor subagent performs ALL work (context fetching, exploration, generation) in isolated context, keeping main context clean.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-2 (argument parsing and executor invocation). You MUST use the **ExitPlanMode tool** before Phase 3 (output handling) to transition from analysis to execution.

**Why Plan Mode**:
- Phases 1-2 require understanding the request WITHOUT making changes
- Plan mode ensures safe operation before file writes
- Only file output operations (Phase 3-4) require execution mode

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
  command_name: "brainstorm"
  command_label: "Brainstorm-Solutions"

  positional:
    - name: "problem_input"
      description: "Jira ID, GitHub URL, or problem description"
      required: false

  flags:
    - name: "--input"
      type: "path"
      description: "Read problem description from file"
    - name: "--output"
      type: "path"
      description: "Custom output file path for brainstorm"
    - name: "--options"
      type: "number"
      description: "Number of solution options to generate (default: 2-3)"
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
    - --options must be 2-5 if provided
    - At least one input source required (positional or --input)
```

**Store parsed values:**
- `problem_input`: Positional argument or --input file content
- `output_path`: --output value or null
- `options_count`: --options value or null (default 2-3)
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)

---

## PHASE 2: EXECUTE BRAINSTORM (Isolated Context)

**Objective**: Spawn brainstorm-executor subagent to perform ALL brainstorming work in isolated context.

**Use Task tool with brainstorm-executor**:

```
Task tool configuration:
  subagent_type: "schovi:brainstorm-executor:brainstorm-executor"
  model: "sonnet"
  description: "Execute brainstorm workflow"
  prompt: |
    PROBLEM REFERENCE: [problem_input]

    CONFIGURATION:
    - number_of_options: [options_count or "2-3"]
    - identifier: [auto-detect from problem_input or generate slug]
    - exploration_mode: medium

    Execute complete brainstorm workflow:
    1. Fetch external context (Jira/GitHub if applicable)
    2. Light codebase exploration (Plan subagent, medium mode)
    3. Generate 2-3 distinct solution options following template

    Return structured brainstorm output (~2000-3000 tokens).
```

**Expected output from executor**:
- Complete structured brainstorm markdown (~2000-3000 tokens)
- Includes: problem summary, constraints, 2-3 options, comparison matrix, recommendation, exploration notes
- Already formatted following `schovi/templates/brainstorm/full.md`

**Store executor output**:
- `brainstorm_output`: Complete markdown from executor
- `identifier`: Extract from brainstorm header or use fallback

---

## PHASE 3: EXIT PLAN MODE

**CRITICAL**: Before proceeding to output handling, use ExitPlanMode tool to transition from plan mode to execution mode.

```
ExitPlanMode tool:
  plan: |
    # Brainstorm Solutions Completed

    Generated solution options via brainstorm-executor subagent.

    **Identifier**: [identifier]
    **Options Count**: [N options generated]

    ## Key Results

    - Problem context fetched and analyzed
    - Light codebase exploration completed (medium mode)
    - [N] distinct solution options generated
    - Comparison matrix with feasibility analysis
    - Recommendation provided

    ## Next Steps

    1. Save brainstorm output to work folder
    2. Display summary to user
    3. Guide user to research command for deep dive
```

**Wait for user approval before proceeding to Phase 4.**

---

## PHASE 4: OUTPUT HANDLING & WORK FOLDER

Use lib/work-folder.md:

```
Configuration:
  command_name: "brainstorm"
  identifier: [identifier extracted from brainstorm_output]
  work_dir: [work_dir from argument parsing or null]

  file_handling:
    create_file: [file_output]
    file_content: [brainstorm_output from Phase 2]
    default_filename: "brainstorm-[identifier].md"
    custom_path: [output_path or null]

  metadata:
    command: "brainstorm"
    identifier: [identifier]
    timestamp: [current timestamp]
    input_type: [detected from problem_input: jira|github_pr|github_issue|file|text]
    options_generated: [options_count or extracted from output]
    exploration_time: [N/A - handled by executor]
    recommended_option: [extract from output]

  terminal_output: [terminal_output]
  terminal_message: |
    # 🧠 Brainstorm Complete: [identifier]

    Generated [N] solution options with broad feasibility analysis.

    ## Options Summary

    [Extract option summaries from brainstorm_output - 1-2 lines each]

    ## 🎯 Recommendation

    [Extract recommendation from brainstorm_output - 2-3 sentences]

    ## 📁 Output

    Brainstorm saved to: `[file_path]`
    Work folder: `[work_folder_path]`

    ## 🔬 Next Steps

    Choose an option for deep technical research:

    ```bash
    # Research recommended option
    /schovi:research --input brainstorm-[identifier].md --option [N]

    # Or research a different option
    /schovi:research --input brainstorm-[identifier].md --option [1|2|3]
    ```

    This will perform deep codebase exploration with detailed file:line references and implementation considerations.
```

**After this phase:**
- Brainstorm file created in work folder
- Metadata file updated
- Terminal output displayed (unless --quiet)
- User guided to next step (research command)

---

## PHASE 5: COMPLETION

**Final Message**:
```
✅ Brainstorm completed successfully!

📊 Generated [N] solution options for [identifier]
🎯 Recommended: Option [N] - [Name]
📁 Saved to: [file_path]

🔬 Ready for deep research? Run:
   /schovi:research --input brainstorm-[identifier].md --option [N]
```

**Command complete.**

---

## ERROR HANDLING

### Input Processing Errors
- **No input provided**: Ask user for Jira ID, GitHub URL, or description
- **Invalid format**: Report error, show format examples
- **File not found**: Report error, ask for correct path

### Executor Errors
- **Executor failed**: Report error with details from subagent
- **Validation failed**: Check brainstorm_output has required sections
- **Token budget exceeded**: Executor handles compression, shouldn't happen

### Output Errors
- **File write failed**: Report error, offer terminal-only output
- **Work folder error**: Use fallback location or report error

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with clear problem reference
- [ ] Executor invoked and completed successfully
- [ ] Brainstorm output received (~2000-3000 tokens)
- [ ] Output contains all required sections (problem, constraints, options, matrix, recommendation)
- [ ] 2-3 distinct options present (not variations)
- [ ] File saved to work folder (unless --no-file)
- [ ] Metadata updated
- [ ] Terminal output displayed (unless --quiet)
- [ ] User guided to research command for next step

---

## NOTES

**Design Philosophy**:
- **Executor pattern**: ALL work (fetch + explore + generate) happens in isolated context
- **Main context stays clean**: Only sees final formatted output (~2-3k tokens)
- **Token efficiency**: 93% reduction in main context (from ~43k to ~3k tokens)
- **Consistent experience**: User sees same output, just more efficient internally

**Token Benefits**:
- Before: Main context sees input processing + exploration + generation = ~43k tokens
- After: Main context sees only final output = ~3k tokens
- Savings: 40k tokens (93% reduction)

**Integration**:
- Input from: Jira, GitHub issues/PRs, files, or text
- Output to: Work folder with metadata
- Next command: Research with --option flag

**Executor Capabilities**:
- Spawns jira-analyzer, gh-pr-analyzer, gh-issue-analyzer for external context
- Spawns Plan subagent for medium-thoroughness exploration
- Reads brainstorm template and generates formatted output
- All in isolated context, returns clean result

---

**Command Version**: 2.0 (Executor Pattern)
**Last Updated**: 2025-11-07
**Dependencies**:
- `lib/argument-parser.md`
- `lib/work-folder.md`
- `schovi/agents/brainstorm-executor/AGENT.md`
- `schovi/templates/brainstorm/full.md`
