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

## PHASE 1.5: LOAD FRAGMENT CONTEXT (if fragments exist)

**Objective**: Load existing fragment registry and assumption/unknown details to pass to research-executor for validation.

**Use lib/fragment-loader.md**:

### Step 1.5.1: Check if fragments exist (Operation 1)

```
work_folder: [from Phase 1, derived from input or work-folder library]
```

**If fragments don't exist**:
- Skip this phase, proceed to Phase 2
- Research will work without fragment context

**If fragments exist**:
- Continue to next step

### Step 1.5.2: Load fragment registry (Operation 2)

```
work_folder: [work_folder path]
```

**Parse registry for**:
- Count of assumptions (A-#)
- Count of unknowns (U-#)
- Current status of each

**Store**:
- `fragments_exist`: true
- `assumption_count`: N
- `unknown_count`: N

### Step 1.5.3: Load all assumptions (Operation 4)

```
work_folder: [work_folder]
fragment_type: "A"
```

**For each assumption**:
- Extract ID (A-1, A-2, ...)
- Extract statement
- Extract current status (pending, validated, failed)

**Store**:
- `assumptions_list`: [
    {id: "A-1", statement: "...", status: "pending"},
    {id: "A-2", statement: "...", status: "pending"}
  ]

### Step 1.5.4: Load all unknowns (Operation 4)

```
work_folder: [work_folder]
fragment_type: "U"
```

**For each unknown**:
- Extract ID (U-1, U-2, ...)
- Extract question
- Extract current status (pending, answered)

**Store**:
- `unknowns_list`: [
    {id: "U-1", question: "...", status: "pending"},
    {id: "U-2", question: "...", status: "pending"}
  ]

**After Phase 1.5**:
- Fragment context loaded (if exists)
- Ready to pass to research-executor for validation

---

## PHASE 2: EXECUTE RESEARCH (Isolated Context)

**Objective**: Spawn research-executor subagent to perform ALL research work in isolated context, including assumption validation if fragments exist.

**Use Task tool with research-executor**:

```
Task tool configuration:
  subagent_type: "schovi:research-executor:research-executor"
  model: "sonnet"
  description: "Execute research workflow"
  prompt: |
    RESEARCH INPUT: [input_value]

    CONFIGURATION:
    - option_number: [option_number or null]
    - identifier: [auto-detect or generate]
    - exploration_mode: thorough

    FRAGMENT CONTEXT (if fragments_exist == true):
    ASSUMPTIONS TO VALIDATE:
    [For each in assumptions_list:]
    - [id]: [statement] (current status: [status])

    UNKNOWNS TO INVESTIGATE:
    [For each in unknowns_list:]
    - [id]: [question] (current status: [status])

    [If fragments_exist == false:]
    No existing fragment context. Research will identify new assumptions/risks/metrics.

    Execute complete research workflow:
    1. Extract research target (from brainstorm option, Jira, GitHub, etc.)
    2. Fetch external context if needed (Jira/GitHub via nested subagents)
    3. Deep codebase exploration (Plan subagent, thorough mode)
    4. If fragments exist: Validate each assumption and answer each unknown
    5. Identify risks (R-1, R-2, ...) and metrics (M-1, M-2, ...)
    6. Generate detailed technical analysis following template

    Return structured research output (~4000-6000 tokens) with file:line references.
    Include assumption validation results and unknown answers if fragments provided.
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

### Step 4.1: Update Fragments (if fragments exist)

**If `fragments_exist == true` from Phase 1.5**:

**Use lib/fragment-loader.md**:

Parse research output for:
1. **Assumption Validation Results**
2. **Unknown Answers**
3. **New Risks**
4. **New Metrics**

#### 4.1.1: Update Assumption Fragments (Operation 8)

For each assumption in `assumptions_list`:

**Parse research output** for validation section matching assumption ID:
- Look for "Assumption Validation Matrix" table
- Extract: validation method, result (✅/❌/⏳), evidence

**Update fragment** (Operation 8):
```
work_folder: [work_folder]
fragment_id: [assumption.id - e.g., "A-1"]
updates: {
  status: "validated" | "failed" | "pending",
  validation_method: [extracted method],
  validation_result: "pass" | "fail",
  evidence: [extracted evidence items],
  tested_by: "Research phase ([current_timestamp])"
}
```

**Get current timestamp**:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Result**: Fragment file updated with validation results

#### 4.1.2: Update Unknown Fragments (Operation 8)

For each unknown in `unknowns_list`:

**Parse research output** for answer matching unknown ID:
- Look for answers in research output
- Extract: finding, evidence, decision

**Update fragment** (Operation 8):
```
work_folder: [work_folder]
fragment_id: [unknown.id - e.g., "U-1"]
updates: {
  status: "answered" | "pending",
  answer: [extracted finding],
  evidence: [extracted evidence items],
  decision: [extracted decision],
  answered_by: "Research phase ([current_timestamp])"
}
```

**Result**: Fragment file updated with answer

#### 4.1.3: Create Risk Fragments (Operation 7)

**Parse research output** for risks section:
- Look for "Risks & Mitigation" or similar section
- Extract risks identified

**For each risk**:

**Get next risk number** (Operation 11):
```
work_folder: [work_folder]
fragment_type: "R"
```
Returns next_number (e.g., 1, 2, 3, ...)

**Create risk fragment** (Operation 7):
```
work_folder: [work_folder]
fragment_type: "R"
fragment_number: [next_number]
fragment_data: {
  description: [risk description from research],
  category: [Technical | Business | Operational],
  impact: [High | Medium | Low],
  probability: [High | Medium | Low],
  impact_description: [what happens if risk occurs],
  probability_rationale: [why this probability],
  validates: [A-IDs this risk relates to],
  mitigation_steps: [mitigation strategy],
  contingency_steps: [contingency plan],
  stage: "research",
  timestamp: [current_timestamp]
}
```

**Result**: New fragment file created (e.g., `fragments/R-1.md`)

#### 4.1.4: Create Metric Fragments (Operation 7)

**Parse research output** for metrics section:
- Look for "What We Will Measure Later" section
- Extract metrics defined

**For each metric**:

**Get next metric number** (Operation 11):
```
work_folder: [work_folder]
fragment_type: "M"
```

**Create metric fragment** (Operation 7):
```
work_folder: [work_folder]
fragment_type: "M"
fragment_number: [next_number]
fragment_data: {
  description: [metric description],
  purpose_validates: [A-IDs],
  purpose_monitors: [R-IDs],
  target_value: [target value],
  acceptable_range: [min-max],
  critical_threshold: [threshold],
  baseline_commands: [how to establish baseline],
  owner: [team or person],
  timeline: [when to measure],
  stage: "research",
  timestamp: [current_timestamp]
}
```

**Result**: New fragment file created (e.g., `fragments/M-1.md`)

#### 4.1.5: Update Fragment Registry (Operation 9)

**Update registry** with all changes:
- Updated assumption statuses
- Updated unknown statuses
- New risks added
- New metrics added

**Update summary counts**:
```
work_folder: [work_folder]
identifier: [identifier]
updates: [all fragment updates from above steps]
```

**Result**: `fragments.md` registry updated with current state

**If fragment updates fail**:
- Log warning but don't block command
- Continue to file writing

### Step 4.2: Work Folder Resolution

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"

  identifier: [identifier extracted from research_output or input]
  description: [extract problem title from research_output]

  workflow_type: "research"
  current_step: "research"

  custom_work_dir: [work_dir from argument parsing, or null]

Output (store for use below):
  work_folder: [path from library, e.g., ".WIP/EC-1234-feature"]
  metadata_file: [path from library, e.g., ".WIP/EC-1234-feature/.metadata.json"]
  output_file: [path from library, e.g., ".WIP/EC-1234-feature/research-EC-1234.md"]
  identifier: [identifier from library]
  is_new: [true/false from library]
```

**Note**: If `option_number` was provided (from brainstorm), adjust output_file:
- Change from: `research-[identifier].md`
- To: `research-[identifier]-option[N].md`

**Store the returned values for steps below.**

### Step 4.3: Write Research Output

**If `file_output == true` (default unless --no-file):**

Use Write tool:
```
file_path: [output_file from Step 4.1, adjusted for option if needed]
content: [research_output from Phase 3]
```

**If write succeeds:**
```
📄 Research saved to: [output_file]
```

**If write fails or --no-file:**
Skip file creation, continue to terminal output.

### Step 4.4: Update Metadata

**If work_folder exists and file was written:**

Read current metadata:
```bash
cat [metadata_file from Step 4.1]
```

Update fields:
```json
{
  ...existing fields,
  "workflow": {
    ...existing.workflow,
    "completed": [...existing.completed, "research"],
    "current": "research"
  },
  "files": {
    ...existing.files,
    "research": "research-[identifier].md"
  },
  "timestamps": {
    ...existing.timestamps,
    "lastModified": "[current timestamp]"
  }
}
```

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Write updated metadata:
```
Write tool:
  file_path: [metadata_file]
  content: [updated JSON]
```

### Step 4.5: Terminal Output

**If `terminal_output == true` (default unless --quiet):**

Display:
```markdown
# 🔬 Research Complete: [identifier]

Deep technical analysis completed.

## 📊 Analysis Summary

[Extract key findings from research_output - 3-5 bullet points]

## 📁 Output

Research saved to: `[output_file]`
Work folder: `[work_folder]`

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
- [ ] Fragment context loaded (if fragments exist)
- [ ] Assumptions and unknowns passed to executor (if fragments exist)
- [ ] Executor invoked and completed successfully
- [ ] Research output received (~4000-6000 tokens)
- [ ] Output contains all required sections
- [ ] Architecture mapped with file:line references
- [ ] Dependencies identified (direct and indirect)
- [ ] Data flow traced with file:line references
- [ ] Code quality assessed with examples
- [ ] Implementation considerations provided
- [ ] All file references use file:line format
- [ ] Assumption fragments updated with validation results (if fragments exist)
- [ ] Unknown fragments updated with answers (if fragments exist)
- [ ] Risk fragments created for identified risks (if fragments exist)
- [ ] Metric fragments created for defined metrics (if fragments exist)
- [ ] Fragment registry updated with all changes (if fragments exist)
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

**Command Version**: 3.0 (Executor Pattern + Fragment System)
**Last Updated**: 2025-11-08
**Dependencies**:
- `lib/argument-parser.md`
- `lib/work-folder.md`
- `lib/fragment-loader.md` (NEW: Fragment loading and updating)
- `schovi/agents/research-executor/AGENT.md`
- `schovi/templates/research/full.md`
**Changelog**: v3.0 - Added fragment system integration: loads assumptions/unknowns, validates during research, updates fragment files with results, creates risk/metric fragments
