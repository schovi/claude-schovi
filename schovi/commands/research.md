---
description: Deep technical analysis of ONE specific approach with detailed file:line references
argument-hint: --input PATH [--option N] [--output PATH] [--no-file] [--quiet] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Research Workflow

You are performing **deep technical research** of ONE specific approach. Follow this structured workflow to generate detailed analysis with comprehensive file:line references and implementation considerations.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-3 (extraction, exploration, and analysis). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

**Why Plan Mode**:
- Phases 1-3 require deep codebase exploration and understanding WITHOUT making changes
- Plan mode ensures safe, read-only codebase investigation
- Research work (deep analysis, dependency mapping) should happen in plan mode
- Only file output operations (Phase 4-5) require execution mode

**Workflow**:
```
┌──────────────────────────────────┐
│  PLAN MODE (Read-only)           │
│  Phases 1-3: Deep Research       │
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
  command_name: "research"
  command_label: "Research-Approach"

  positional: []  # No positional arguments

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

---

## PHASE 1: INPUT CLASSIFICATION & RESEARCH TARGET EXTRACTION

**Objective**: Determine what type of input was provided and extract the specific research target.

### Step 1.1: Classify Input

Read the input value and classify:

```
Classification Rules:
1. If input_value is a file path that exists:
   a. If filename starts with "brainstorm-" → Type: "brainstorm_file"
   b. If filename starts with "spec-" → Type: "spec_file"
   c. If filename starts with "analysis-" → Type: "analysis_file" (legacy)
   d. Otherwise → Type: "generic_file"

2. If input_value matches Jira pattern (^[A-Z]{2,10}-\d{1,6}$):
   → Type: "jira"

3. If input_value contains "github.com/.+/pull/":
   → Type: "github_pr"

4. If input_value contains "github.com/.+/issues/":
   → Type: "github_issue"

5. If input_value matches "owner/repo#\d+":
   → Type: "github_pr_or_issue"

6. If input_value matches "#\d+":
   → Type: "github_pr_or_issue"

7. Otherwise:
   → Type: "text"
```

**Store:**
- `input_type`: Classification result
- `is_brainstorm`: true if input_type is "brainstorm_file"

### Step 1.2: Extract Research Target

Based on input_type:

#### Case A: Brainstorm File

1. **Read brainstorm file**: Use Read tool
2. **Check for --option flag**:
   - If `option_number` is provided:
     - Extract Option N section from brainstorm
     - Parse: Overview, Benefits, Challenges, Feasibility, Effort, Risk
   - If `option_number` is NOT provided:
     - Use AskUserQuestion tool: "Which option would you like to research? (1, 2, or 3)"
     - Store user response as `option_number`
     - Extract that option's section

3. **Parse brainstorm metadata**:
   - Extract `identifier` from header (e.g., "EC-1234", "PR-123")
   - Extract problem summary section
   - Extract constraints section

4. **Set research variables**:
   - `research_target`: Option overview + approach description
   - `identifier`: From brainstorm or generate new one with "-option[N]" suffix
   - `context_summary`: Problem summary from brainstorm
   - `source_description`: "Brainstorm Option [N]"

#### Case B: Jira/GitHub/File/Text

1. **Use lib/input-processing.md** to fetch context:

```
Configuration:
  command_context: "research"
  command_label: "Research-Approach"

  input_sources:
    - jira: true        # Fetch issue details from Jira via jira-analyzer
    - github_pr: true   # Fetch PR details via gh-pr-analyzer (compact mode)
    - github_issue: true # Fetch issue details via gh-issue-analyzer
    - file: true        # Read from file
    - text: true        # Use direct text input

  [Same subagent_config as brainstorm command]

  output_format:
    - input_type: "jira|github_pr|github_issue|file|text"
    - context_summary: "[Title, description, key details]"
    - identifier: "EC-1234 or PR-123 or custom-slug"
```

2. **Set research variables**:
   - `research_target`: Full context_summary (no specific option, analyze the whole thing)
   - `identifier`: From input processing
   - `context_summary`: Same as research_target
   - `source_description`: "Jira EC-1234" or "GitHub PR #123" or "File: [name]" or "Custom"

### Step 1.3: Validate Research Target

Verify:
- [ ] `research_target` is clear and specific
- [ ] `identifier` is set for file naming
- [ ] `context_summary` provides problem context
- [ ] `source_description` documents where research came from

**If option_number was provided but input is NOT brainstorm file**:
- Report error: "--option flag can only be used with brainstorm files"
- Ask user to remove flag or provide brainstorm file

---

## PHASE 2: DEEP CODEBASE EXPLORATION

**Objective**: Perform DEEP exploration to understand architecture, dependencies, data flow, and implementation details for the specific research target.

**Approach**: Use Task tool with Plan subagent in **thorough** mode.

### Step 2.1: Define Exploration Scope

Based on the research target, identify:
- Specific components/modules that will be affected
- Architecture patterns to understand in detail
- Dependencies to map (direct and indirect)
- Data flow to trace end-to-end
- Integration points to analyze
- Test coverage to assess

### Step 2.2: Execute Deep Exploration

Use Task tool:
```
Task tool configuration:
  subagent_type: "Plan"
  model: "sonnet"
  description: "Deep codebase exploration for research"
  prompt: |
    Perform THOROUGH exploration (4-6 minutes) to gather comprehensive technical details for deep research.

    Research Target:
    [Insert research_target from Phase 1]

    Problem Context:
    [Insert context_summary from Phase 1]

    Source:
    [Insert source_description from Phase 1]

    Exploration Goals:
    1. Map architecture with specific file:line references
    2. Identify ALL affected components with exact locations
    3. Trace data flow through functions and classes
    4. Map dependencies (direct and indirect) with file:line references
    5. Analyze code quality, complexity, and test coverage
    6. Identify design patterns in use
    7. Discover integration points (APIs, database, external services)
    8. Find similar implementations or related features
    9. Assess performance and security implications

    Focus on DEPTH. We need:
    - Specific file:line references for ALL key components
    - Complete dependency chains
    - Detailed data flow tracing
    - Concrete code examples and patterns
    - Actual test coverage metrics

    Provide findings in structured format with file:line references:

    ## Architecture Overview
    - Component 1: path/to/file.ts:line-range - [Purpose and responsibilities]
    - Component 2: path/to/file.ts:line-range - [Purpose and responsibilities]

    ## Data Flow
    1. Entry point: file.ts:line - [What happens]
    2. Processing: file.ts:line - [What happens]
    3. Data access: file.ts:line - [What happens]
    4. Response: file.ts:line - [What happens]

    ## Dependencies
    Direct:
    - file.ts:line - [Function/class name, why affected]

    Indirect:
    - file.ts:line - [Function/class name, potential impact]

    ## Design Patterns
    - Pattern 1: [Where used, file:line examples]

    ## Code Quality
    - Complexity: [High/medium/low areas with file:line]
    - Test coverage: [Percentage, file:line references]
    - Tech debt: [Issues found, file:line]

    ## Integration Points
    - External APIs: [Where called, file:line]
    - Database: [Tables, file:line]
    - Other services: [How integrated, file:line]
```

### Step 2.3: Collect Exploration Results

Extract comprehensive findings:
- **Architecture**: Components with file:line references
- **Data Flow**: Complete request/response flow with file:line
- **Dependencies**: Direct and indirect with file:line
- **Design Patterns**: Patterns in use with examples
- **Code Quality**: Complexity, test coverage, tech debt
- **Integration Points**: APIs, database, services
- **Performance Notes**: Current performance characteristics
- **Security Notes**: Auth, authorization, data handling

**Expected exploration time**: 4-6 minutes (thorough mode)

---

## PHASE 3: GENERATE DEEP RESEARCH

**Objective**: Transform research target + deep exploration results into comprehensive technical analysis using the research-generator subagent.

### Step 3.1: Prepare Research Context

Compile all information for the subagent:
```
RESEARCH TARGET:
[research_target from Phase 1]
Approach: [Specific approach being researched]

SOURCE CONTEXT:
[source_description from Phase 1]
[If from brainstorm: Include option name, benefits, challenges]

PROBLEM CONTEXT:
[context_summary from Phase 1]

CODEBASE EXPLORATION RESULTS:
[Comprehensive findings from Phase 2 including:]

Architecture Overview:
[Components with file:line references]

Data Flow:
[Step-by-step flow with file:line]

Dependencies:
Direct: [List with file:line]
Indirect: [List with file:line]

Design Patterns:
[Patterns found with examples]

Code Quality:
[Complexity, test coverage, tech debt with file:line]

Integration Points:
[APIs, database, services with file:line]

Performance Notes:
[Current performance characteristics]

Security Notes:
[Auth, authorization, data handling]

CONFIGURATION:
- Identifier: [identifier]
- Source: [source_description]
- Exploration time: [time spent]
- Thoroughness: Thorough (deep exploration completed)
```

### Step 3.2: Invoke Research Generator

Use Task tool with research-generator subagent:
```
Task tool configuration:
  subagent_type: "schovi:research-generator"
  model: "sonnet"
  description: "Generate deep research analysis"
  prompt: |
    [Insert compiled context from Step 3.1]

    Generate deep technical research following the research template.

    Requirements:
    - Read template: schovi/templates/research/full.md
    - Use ACTUAL file:line references from exploration results
    - Provide detailed architecture and data flow analysis
    - Map complete dependency chains
    - Assess complexity, risks, and implementation considerations
    - Include performance and security implications
    - Document research methodology
    - Maximum output: 6500 tokens

    Return structured markdown following the template exactly.
```

### Step 3.3: Validate Output

Verify the research output includes:
- [ ] Problem/topic summary with research focus
- [ ] Current state analysis with file:line references
- [ ] Architecture overview showing component interactions
- [ ] Technical deep dive with data flow, dependencies, code quality
- [ ] Implementation considerations (approach, complexity, testing, risks)
- [ ] Performance and security implications
- [ ] Next steps with concrete actions
- [ ] Research methodology
- [ ] All file references use `file:line` format
- [ ] Follows markdown structure from template
- [ ] No placeholder text

**If validation fails**: Report error and ask subagent to regenerate with corrections.

---

## PHASE 4: EXIT PLAN MODE

**CRITICAL**: Before proceeding to output handling, use ExitPlanMode tool to transition from plan mode to execution mode.

```
ExitPlanMode tool:
  plan: |
    # Deep Research Completed

    Research analysis for [identifier]:

    **Research Target**: [Brief description]
    **Source**: [source_description]

    ## Key Findings

    - **Architecture**: [N] components mapped with file:line references
    - **Dependencies**: [N] direct, [N] indirect dependencies identified
    - **Complexity**: [High/Medium/Low] overall complexity
    - **Estimated Effort**: [Time estimate]
    - **Risk Level**: [Low/Medium/High]

    ## Critical Areas

    1. [Area 1 with file:line]
    2. [Area 2 with file:line]
    3. [Area 3 with file:line]

    ## Next Steps

    1. Save research output to work folder
    2. Display summary to user
    3. Guide user to plan command for implementation spec
```

**Wait for user approval before proceeding to Phase 5.**

---

## PHASE 5: OUTPUT HANDLING & WORK FOLDER

Use lib/work-folder.md:

```
Configuration:
  command_name: "research"
  identifier: [identifier from Phase 1]
  work_dir: [work_dir from argument parsing or null]

  file_handling:
    create_file: [file_output]
    file_content: [research output from Phase 3]
    default_filename: "research-[identifier].md"
    custom_path: [output_path or null]

  metadata:
    command: "research"
    identifier: [identifier]
    timestamp: [current timestamp]
    input_type: [input_type from Phase 1]
    source: [source_description from Phase 1]
    exploration_time: [time spent in Phase 2]
    is_from_brainstorm: [true if input was brainstorm file]
    option_number: [option_number if applicable]

  terminal_output: [terminal_output]
  terminal_message: |
    # 🔬 Research Complete: [identifier]

    Deep technical analysis of: [research_target brief description]

    ## 📊 Analysis Summary

    **Architecture**: [N] components mapped
    **Dependencies**: [N] direct, [N] indirect
    **Complexity**: [High/Medium/Low]
    **Estimated Effort**: [Time estimate]
    **Risk Level**: [Low/Medium/High]

    ## 🎯 Critical Areas

    1. [Area 1 with file:line]
    2. [Area 2 with file:line]
    3. [Area 3 with file:line]

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

**After this phase:**
- Research file created in work folder
- Metadata file updated
- Terminal output displayed (unless --quiet)
- User guided to next step (plan command)

---

## PHASE 6: COMPLETION

**Final Message**:
```
✅ Research completed successfully!

🔬 Deep analysis for [identifier] complete
📊 [N] components analyzed with file:line references
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
- **Invalid option number**: Report error, show valid options from brainstorm

### Exploration Errors
- **Plan subagent timeout**: Retry or report error
- **Exploration incomplete**: Attempt again or work with available data

### Generation Errors
- **Research generator failed**: Report error with details
- **Validation failed**: Ask subagent to regenerate
- **Token budget exceeded**: Ask subagent to compress while keeping file:line refs

### Output Errors
- **File write failed**: Report error, offer terminal-only output
- **Work folder error**: Use fallback location or report error

---

## QUALITY GATES

Before completing, verify:

- [ ] Input processed successfully with research target extracted
- [ ] Deep exploration completed (4-6 minutes, thorough mode)
- [ ] Research output generated with comprehensive analysis
- [ ] Architecture mapped with file:line references
- [ ] Dependencies identified (direct and indirect)
- [ ] Data flow traced with file:line references
- [ ] Code quality assessed with examples
- [ ] Implementation considerations provided
- [ ] Risks identified with mitigation strategies
- [ ] Performance and security implications analyzed
- [ ] Output follows template structure exactly
- [ ] File saved to work folder (unless --no-file)
- [ ] Metadata updated
- [ ] Terminal output displayed (unless --quiet)
- [ ] User guided to plan command for next step

---

## NOTES

**Design Philosophy**:
- **Depth over breadth**: Thorough exploration of ONE specific approach
- **File:line precision**: All claims backed by specific code references
- **Actionable guidance**: Implementation considerations are concrete
- **Risk awareness**: Identify and mitigate specific risks

**Token Efficiency**:
- Use thorough exploration (4-6 minutes) for comprehensive findings
- Research generator output capped at 6500 tokens
- Keep terminal output concise (summary only)

**Integration**:
- Input from: Brainstorm files (with option), Jira, GitHub, files, or text
- Output to: Work folder with metadata
- Next command: Plan for implementation spec

**Interactive Mode**:
- If brainstorm file without --option, ask user interactively
- Clear error messages guide user to correct usage

---

**Command Version**: 1.0
**Last Updated**: 2025-11-07
**Dependencies**:
- `lib/argument-parser.md`
- `lib/input-processing.md`
- `lib/work-folder.md`
- `schovi/agents/research-generator/AGENT.md`
- `schovi/templates/research/full.md`
