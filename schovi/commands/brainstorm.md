---
description: Explore 2-3 distinct solution options with broad feasibility analysis
argument-hint: [jira-id|pr-url|#pr-number|issue-url|description] [--input PATH] [--output PATH] [--options N] [--no-file] [--quiet] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Brainstorm Workflow

You are performing **broad solution exploration** for a problem/feature/change. Follow this structured workflow to generate 2-3 distinct solution options with high-level feasibility analysis.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-3 (exploration and option generation). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

**Why Plan Mode**:
- Phases 1-3 require codebase exploration and understanding WITHOUT making changes
- Plan mode ensures safe, read-only codebase investigation
- Exploration work (light analysis, pattern discovery) should happen in plan mode
- Only file output operations (Phase 4-5) require execution mode

**Workflow**:
```
┌──────────────────────────────────┐
│  PLAN MODE (Read-only)           │
│  Phases 1-3: Exploration         │
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

## PHASE 1: INPUT PROCESSING & CONTEXT GATHERING

Use lib/input-processing.md:

```
Configuration:
  command_context: "brainstorm"
  command_label: "Brainstorm-Solutions"

  input_sources:
    - jira: true        # Fetch issue details from Jira via jira-analyzer
    - github_pr: true   # Fetch PR details via gh-pr-analyzer (compact mode)
    - github_issue: true # Fetch issue details via gh-issue-analyzer
    - file: true        # Read from file if --input provided
    - text: true        # Use direct text input

  classification_rules:
    - pattern: "^[A-Z]{2,10}-\\d{1,6}$"
      type: "jira"
      example: "EC-1234, IS-8046"
    - pattern: "github\\.com/.+/pull/"
      type: "github_pr"
    - pattern: "github\\.com/.+/issues/"
      type: "github_issue"
    - pattern: "owner/repo#\\d+"
      type: "github_pr_or_issue"
    - pattern: "#\\d+"
      type: "github_pr_or_issue"
    - file_exists: true
      type: "file"
    - default: "text"

  subagent_config:
    jira:
      subagent: "schovi:jira-auto-detector:jira-analyzer"
      max_tokens: 1000
    github_pr:
      subagent: "schovi:gh-pr-auto-detector:gh-pr-analyzer"
      max_tokens: 1200
      mode: "compact"
    github_issue:
      subagent: "schovi:gh-pr-auto-detector:gh-issue-analyzer"
      max_tokens: 1000

  output_format:
    - input_type: "jira|github_pr|github_issue|file|text"
    - context_summary: "[Title, description, key details]"
    - identifier: "EC-1234 or PR-123 or custom-slug"
```

**After this phase, you should have:**
- `input_type`: Classification of the input
- `context_summary`: Problem/feature description
- `identifier`: Unique identifier for file naming (e.g., "EC-1234", "PR-123", "custom-slug")
- `context_details`: Full details from external sources if applicable

---

## PHASE 2: LIGHT CODEBASE EXPLORATION

**Objective**: Perform BROAD exploration to understand constraints, patterns, and feasibility factors for generating multiple solution options.

**Approach**: Use Task tool with Plan subagent in **medium** thoroughness mode.

### Step 2.1: Define Exploration Scope

Based on the problem context, identify:
- Key codebase areas that might be affected
- Existing patterns to understand
- Technical constraints to discover
- Architecture boundaries to respect

### Step 2.2: Execute Exploration

Use Task tool:
```
Task tool configuration:
  subagent_type: "Plan"
  model: "sonnet" (default)
  description: "Light codebase exploration for brainstorm"
  prompt: |
    Perform MEDIUM thoroughness exploration (2-3 minutes) to gather context for brainstorming solution options.

    Problem Context:
    [Insert context_summary from Phase 1]

    Exploration Goals:
    1. Identify key components/modules that might be involved
    2. Discover existing architecture patterns and design approaches
    3. Understand technical constraints (APIs, database, integrations)
    4. Assess current code quality and test coverage in relevant areas
    5. Note any similar implementations or related features

    Focus on BREADTH, not depth. We need high-level understanding to generate 2-3 distinct solution options.

    Provide findings in structured format:
    - Key Components: [List with folder/file references]
    - Existing Patterns: [Architecture patterns observed]
    - Technical Constraints: [Limitations discovered]
    - Related Features: [Similar implementations found]
    - Code Quality Notes: [Test coverage, tech debt, complexity]
```

### Step 2.3: Collect Exploration Results

Extract from Plan subagent output:
- **Key components**: High-level file/folder references
- **Existing patterns**: Architecture and design patterns
- **Technical constraints**: APIs, database, integrations, compatibility
- **Code quality**: Test coverage, technical debt
- **Assumptions**: What seems to be true but needs validation

**Expected exploration time**: 2-4 minutes (medium thoroughness)

---

## PHASE 3: GENERATE SOLUTION OPTIONS

**Objective**: Transform problem context + exploration results into 2-3 distinct solution options using the brainstorm-generator subagent.

### Step 3.1: Prepare Brainstorm Context

Compile all information for the subagent:
```
PROBLEM CONTEXT:
[Full context_summary from Phase 1 including:]
- Problem/feature description
- Business requirements
- Timeline constraints
- Key stakeholders

CODEBASE EXPLORATION RESULTS:
[Structured findings from Phase 2 including:]
- Key Components: [List with paths]
- Existing Patterns: [Patterns found]
- Technical Constraints: [Constraints discovered]
- Code Quality: [Test coverage, complexity notes]
- Related Features: [Similar implementations]

CONFIGURATION:
- Number of options: [options_count or 2-3]
- Identifier: [identifier for work folder reference]
- Thoroughness: Medium (light exploration completed)
```

### Step 3.2: Invoke Brainstorm Generator

Use Task tool with brainstorm-generator subagent:
```
Task tool configuration:
  subagent_type: "schovi:brainstorm-generator"
  model: "sonnet"
  description: "Generate solution options"
  prompt: |
    [Insert compiled context from Step 3.1]

    Generate [options_count or 2-3] distinct solution options following the brainstorm template.

    Requirements:
    - Read template: schovi/templates/brainstorm/full.md
    - Generate DISTINCT approaches (not variations)
    - Provide objective pros/cons for each option
    - Include comparison matrix
    - Recommend one option with reasoning
    - Document exploration methodology
    - Maximum output: 3500 tokens

    Return structured markdown following the template exactly.
```

### Step 3.3: Validate Output

Verify the brainstorm output includes:
- [ ] Problem summary (2-4 paragraphs)
- [ ] Constraints & requirements (specific, not generic)
- [ ] 2-3 distinct solution options with all subsections
- [ ] Comparison matrix with consistent criteria
- [ ] Recommendation with reasoning
- [ ] Exploration notes
- [ ] Follows markdown structure from template
- [ ] No placeholder text

**If validation fails**: Report error and ask subagent to regenerate with corrections.

---

## PHASE 4: EXIT PLAN MODE

**CRITICAL**: Before proceeding to output handling, use ExitPlanMode tool to transition from plan mode to execution mode.

```
ExitPlanMode tool:
  plan: |
    # Brainstorm Solutions Completed

    Generated [N] solution options for [identifier]:

    1. Option 1: [Name] (Feasibility: [level], Effort: [estimate])
    2. Option 2: [Name] (Feasibility: [level], Effort: [estimate])
    [3. Option 3: [Name] if applicable]

    Recommended: Option [N] - [Name]
    Reasoning: [Brief summary]

    Next steps:
    1. Save brainstorm output to work folder
    2. Display summary to user
    3. Guide user to research command for deep dive
```

**Wait for user approval before proceeding to Phase 5.**

---

## PHASE 5: OUTPUT HANDLING & WORK FOLDER

Use lib/work-folder.md:

```
Configuration:
  command_name: "brainstorm"
  identifier: [identifier from Phase 1]
  work_dir: [work_dir from argument parsing or null]

  file_handling:
    create_file: [file_output]
    file_content: [brainstorm output from Phase 3]
    default_filename: "brainstorm-[identifier].md"
    custom_path: [output_path or null]

  metadata:
    command: "brainstorm"
    identifier: [identifier]
    timestamp: [current timestamp]
    input_type: [input_type from Phase 1]
    options_generated: [options_count or number of options]
    exploration_time: [time spent in Phase 2]
    recommended_option: [option number and name]

  terminal_output: [terminal_output]
  terminal_message: |
    # 🧠 Brainstorm Complete: [identifier]

    Generated [N] solution options with broad feasibility analysis.

    ## Options Summary

    1. **Option 1**: [Name]
       - Feasibility: [level] | Effort: [estimate] | Risk: [level]

    2. **Option 2**: [Name]
       - Feasibility: [level] | Effort: [estimate] | Risk: [level]

    [3. **Option 3**: [Name] if applicable]

    ## 🎯 Recommendation

    **Option [N]**: [Name]
    [1-2 sentences why recommended]

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

## PHASE 6: COMPLETION

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
- **Invalid Jira ID**: Report error, show format example
- **Invalid GitHub URL**: Report error, show format example
- **File not found**: Report error, ask for correct path

### Exploration Errors
- **Plan subagent timeout**: Reduce thoroughness or retry
- **Exploration failed**: Attempt with quick mode or report error

### Generation Errors
- **Brainstorm generator failed**: Report error with details
- **Validation failed**: Ask subagent to regenerate
- **Token budget exceeded**: Ask subagent to compress

### Output Errors
- **File write failed**: Report error, offer terminal-only output
- **Work folder error**: Use fallback location or report error

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with clear identifier
- [ ] Light exploration completed (2-4 minutes, medium mode)
- [ ] Brainstorm output generated with 2-3 distinct options
- [ ] Each option has benefits, challenges, feasibility, effort, risk
- [ ] Comparison matrix completed
- [ ] One option recommended with reasoning
- [ ] Output follows template structure exactly
- [ ] File saved to work folder (unless --no-file)
- [ ] Metadata updated
- [ ] Terminal output displayed (unless --quiet)
- [ ] User guided to research command for next step

---

## NOTES

**Design Philosophy**:
- **Breadth over depth**: Light exploration to understand feasibility
- **Multiple options**: 2-3 distinct approaches, not variations
- **Objective analysis**: Present pros/cons without bias
- **Next step clarity**: Guide user to research for deep dive

**Token Efficiency**:
- Use medium thoroughness exploration (not thorough)
- Brainstorm generator output capped at 3500 tokens
- Keep terminal output concise (summary only)

**Integration**:
- Input from: Jira, GitHub issues/PRs, files, or text
- Output to: Work folder with metadata
- Next command: Research with --option flag

---

**Command Version**: 1.0
**Last Updated**: 2025-11-07
**Dependencies**:
- `lib/argument-parser.md`
- `lib/input-processing.md`
- `lib/work-folder.md`
- `schovi/agents/brainstorm-generator/AGENT.md`
- `schovi/templates/brainstorm/full.md`
