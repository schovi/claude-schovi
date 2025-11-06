---
description: Generate implementation specification from problem analysis with flexible input sources
argument-hint: [jira-id|github-issue-url|--input path|--from-scratch description] [--work-dir PATH]
allowed-tools: ["Read", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion", "Write"]
---

# Create Specification Workflow

You are **creating an implementation specification** that bridges problem analysis and implementation. This spec transforms exploratory analysis into actionable, clear implementation guidance.

---

## ARGUMENT PARSING

Parse command arguments using lib/argument-parser.md:

```
Configuration:
  command_name: "plan"
  command_label: "Create-Spec"

  positional:
    - name: "input"
      description: "Jira ID, GitHub URL, analysis file path, or description"
      required: false

  flags:
    - name: "--input"
      type: "path"
      description: "Analysis file path"
    - name: "--output"
      type: "path"
      description: "Custom output file path"
    - name: "--from-scratch"
      type: "string"
      description: "Create spec without analysis"
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
      description: "Post spec as Jira comment"

  validation:
    - Check for conflicting flags (--input with --from-scratch)
    - Ensure at least one input source provided
```

**Store parsed values:**
- `input_value`: Positional argument or --input value or --from-scratch value
- `output_path`: --output value or null
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)
- `jira_posting`: true if --post-to-jira, else false
- `from_scratch_mode`: true if --from-scratch flag present

---

## PHASE 1: INPUT VALIDATION & ANALYSIS EXTRACTION

### Step 1.1: Classify and Validate Input Type

**Input classification:**

1. **Analysis File** (✅ VALID - --input flag)
   - Pattern: `--input ./analysis.md`
   - Has technical analysis with file:line references
   - Action: Read and extract analysis

2. **From Scratch** (✅ VALID - --from-scratch flag)
   - Pattern: `--from-scratch "description"`
   - Bypass analysis requirement
   - Action: Interactive minimal spec creation

3. **Conversation Analysis** (✅ VALID - no args, analysis in conversation)
   - Pattern: No arguments
   - Recent `/schovi:analyze` output in conversation
   - Action: Extract from conversation history

4. **Raw Input** (❌ INVALID - Jira ID, GitHub URL, text description)
   - Patterns: `EC-1234`, `#123`, `owner/repo#123`, free text without --from-scratch
   - Requires analysis first
   - Action: STOP with guidance message

**If input type is INVALID (Raw inputs without analysis):**

Display error message:
```markdown
╭─────────────────────────────────────────────────────────────────╮
│ ❌ ANALYSIS REQUIRED BEFORE SPECIFICATION GENERATION            │
╰─────────────────────────────────────────────────────────────────╯

**Problem**: Cannot generate actionable specification without technical analysis.

**Input Detected**: [Describe what was provided - Jira ID, GitHub URL, description, or empty]

**Why Analysis is Required**:
Specifications need specific file locations, affected components, and technical context
to generate actionable implementation tasks. Without analysis:

  ❌ Tasks will be vague: "Fix the bug" instead of "Update validation in Validator.ts:67"
  ❌ No clear entry points: Which files to change?
  ❌ Missing context: How do components interact?
  ❌ Unclear scope: What else might be affected?

**Required Actions** - Choose ONE:

  1️⃣ **Run analysis first, then create spec**:

     # Analyze the problem (explores codebase, identifies components)
     /schovi:analyze [your-input]

     # Then create spec from analysis
     /schovi:plan --input ./analysis-[id].md

     OR just:
     /schovi:plan    (auto-detects analysis in conversation)

  2️⃣ **Provide existing analysis file**:

     /schovi:plan --input ./path/to/analysis-file.md

  3️⃣ **Create simple spec without analysis** (for straightforward tasks):

     /schovi:plan --from-scratch "Task description"
     # You'll be prompted for requirements interactively

**Examples**:

  # Wrong: Raw Jira ID
  /schovi:plan EC-1234  ❌

  # Right: Analyze first, then plan
  /schovi:analyze EC-1234
  /schovi:plan --input ./analysis-EC-1234.md  ✅

  # Or use conversation output
  /schovi:analyze EC-1234
  /schovi:plan  ✅ (auto-detects from conversation)

  # Or from scratch for simple tasks
  /schovi:plan --from-scratch "Add loading spinner"  ✅

**Workflow**:
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Problem   │  →   │   Analyze    │  →   │    Plan     │
│ (Jira, GH)  │      │  (Explores)  │      │  (Spec Gen) │
└─────────────┘      └──────────────┘      └─────────────┘

╭─────────────────────────────────────────────────────────────────╮
│ 💡 TIP: Run /schovi:analyze [input] first to explore codebase  │
╰─────────────────────────────────────────────────────────────────╯
```

**HALT EXECUTION** - Do not proceed.

---

### Step 1.2: Extract Analysis Content

**Based on validated input type:**

#### Option A: Analysis File (--input flag provided)

```
1. Acknowledge file read:
   📄 **[Create-Spec]** Reading analysis from file: [PATH]

2. Use Read tool to load file contents:
   file_path: [PATH from --input flag]

3. If file doesn't exist or read fails:
   ❌ **[Create-Spec]** File not found: [PATH]

   Ask user for correct path or alternative input source.
   HALT EXECUTION

4. If file loads successfully:
   ✅ **[Create-Spec]** File loaded ([X] lines)

5. Extract key analysis content:
   - Problem summary (core issue, impact, severity)
   - Affected components with file:line references
   - User flow and data flow (if present)
   - Solution proposals with pros/cons
   - Technical details and dependencies

6. Verify analysis quality:
   - Check: Has file:line references? (Critical for actionable spec)
   - Check: Has affected components identified?
   - Check: Has problem description?

   If missing critical elements → Flag for enrichment in Step 1.3
```

#### Option B: Conversation Analysis (no arguments, search conversation)

```
1. Acknowledge search:
   🔍 **[Create-Spec]** Searching conversation for analysis output...

2. Search conversation history (last 100 messages) for:
   - Messages containing "/schovi:analyze" command
   - Messages with analysis sections ("## 🎯 1. PROBLEM SUMMARY", etc.)
   - File:line references in recent messages

3. If analysis found:
   ✅ **[Create-Spec]** Found analysis from [N messages ago]

   Extract same content as Option A

4. If NOT found:
   ⚠️ **[Create-Spec]** No analysis found in recent conversation

   Ask user to:
   1. Run: /schovi:analyze [input] first
   2. Provide analysis file: /schovi:plan --input ./analysis.md
   3. Create simple spec: /schovi:plan --from-scratch "description"

   HALT EXECUTION

5. Verify analysis quality (same checks as Option A)
```

#### Option C: From Scratch (--from-scratch flag provided)

```
1. Acknowledge mode:
   ✨ **[Create-Spec]** Creating spec from scratch...

2. Parse provided description from --from-scratch argument

3. Use AskUserQuestion tool for interactive requirements gathering:

   Q1: "What is the primary goal of this task?"
   Options: "Bug fix", "New feature", "Refactoring", "Technical debt", "Other"

   Q2: "Which components or areas will be affected?"
   Free text input

   Q3: "What are the key requirements or acceptance criteria?"
   Free text input (bullet points encouraged)

   Q4: "Any known constraints or risks?" (Optional)
   Free text input

4. Acknowledge collected info:
   ✅ **[Create-Spec]** Requirements collected

5. Prepare minimal spec data:
   - Title: From description
   - Goal: From Q1
   - Affected areas: From Q2 (high-level, no file:line refs)
   - Acceptance criteria: From Q3
   - Constraints/risks: From Q4

6. Template type: "minimal" (no flows, no solution comparisons)

7. Skip enrichment step (from-scratch intentionally lacks technical detail)
```

---

### Step 1.3: Optional Context Enrichment (If Analysis Lacks File:Line References)

**Skip this step if:**
- From-scratch mode is active
- Analysis already has sufficient file:line references

**If analysis is vague (missing specific file locations):**

```
1. Detect gaps:
   - Count file:line references in analysis
   - If < 3 references found → Analysis may be too vague

2. Ask user for permission:
   ⚠️ **[Create-Spec]** The analysis appears to lack specific file locations.

   Options:
   1. Enrich via quick codebase search (20-40 seconds, finds exact files)
   2. Skip enrichment (spec will have high-level tasks)
   3. Manually provide file locations

   Which would you prefer? [1/2/3]

3. If user chooses option 1 (Enrich):
   ⏳ **[Create-Spec]** Enriching analysis with file locations...

   Use Task tool with Explore subagent (quick mode):
   - Search for components mentioned in analysis
   - Find file locations for affected areas
   - Add file:line references to analysis

   ✅ **[Create-Spec]** Enrichment complete ([N] file references added)

4. If user chooses option 2 (Skip):
   ⚠️ **[Create-Spec]** Proceeding without enrichment (spec will be high-level)

5. If user chooses option 3 (Manual):
   Ask user to provide file locations, then merge with analysis
```

---

### Step 1.4: Detect User's Chosen Approach (If Multiple Solutions in Analysis)

**If analysis contains multiple solution options:**

```
1. Search for user preference in:
   - User messages after analysis
   - Jira comments (if from Jira)
   - File content (if from file)

2. Look for patterns:
   - "Let's go with Option [N]"
   - "I prefer Option [N]"
   - "Option [N] makes most sense"

3. If preference found:
   ✅ **[Create-Spec]** Detected preference: Option [N] - [Solution Name]

4. If preference NOT found:
   ⚠️ **[Create-Spec]** Multiple options available, no clear preference

   Use AskUserQuestion tool:
   "Which approach should I use for the spec?"

   Options (from analysis):
   - Option 1: [Name] - [Brief description]
   - Option 2: [Name] - [Brief description]
   - Option 3: [Name] - [Brief description]

   Wait for user selection

5. Confirm selection:
   🎯 **[Create-Spec]** Selected approach: Option [N] - [Solution Name]
```

**If single approach or from-scratch mode:**
- Skip selection step
- Use the single approach or minimal template

---

### Step 1.5: Work Folder Resolution

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"  # Find existing or create new

  identifier: [Jira ID from analysis, or null]
  description: [Problem title from analysis]

  workflow_type: "full"  # For plan command: analyze → plan → implement

  workflow_steps:
    - "analyze"  # May already be completed
    - "plan"     # Current step
    - "implement"

  custom_work_dir: [work_dir from arguments, or null]

  file_numbering:
    "analyze": "02-analysis.md"
    "plan": "03-plan.md"
    "implement": "04-implementation-notes.md"

Output (store for later phases):
  work_folder: ".WIP/EC-1234-feature" or null
  metadata: {JSON object with workflow state} or null
```

---

**Phase 1 Validation Checkpoint:**
```
- [ ] Input type validated (analysis file / conversation / from-scratch)
- [ ] If raw input: STOPPED with guidance (not proceeded)
- [ ] If valid: Analysis content extracted
- [ ] Analysis quality checked (file:line refs present or enriched)
- [ ] Enrichment decision made (yes/no/manual/skipped)
- [ ] Chosen approach identified (if multiple options)
- [ ] Work folder resolved (if applicable)
```

---

## PHASE 2: SPEC GENERATION

Use lib/subagent-invoker.md:

```
Configuration:
  subagent: "spec-generator"
  command_context: "plan"
  command_label: "Create-Spec"

  input_context:
    problem_summary: [from analysis extraction]
    chosen_approach: [from Step 1.4 or single approach]
    technical_details: [from analysis - files, flows, dependencies]
    user_notes: [from user preferences or comments]

    template_type: "full" | "minimal"
      - "full": When detailed analysis exists (file:line refs, flows, options)
      - "minimal": When from-scratch or simple tasks

    metadata:
      jira_id: [ID or null]
      created_date: [today's date]
      created_by: "Claude Code"

  validation_rules:
    - Must have title and metadata
    - Must have decision rationale (full) or goal statement (minimal)
    - Must have implementation tasks (checkboxes, actionable)
    - Must have acceptance criteria (testable)
    - Must have testing strategy
    - Must document risks (if applicable for full template)
    - File references must use file:line format (where applicable)

  error_handling:
    - If validation fails: Regenerate with more specific prompt
    - If subagent fails: Report error, don't attempt fallback
```

**Store generated spec for Phase 3 output handling.**

---

## PHASE 3: OUTPUT HANDLING

Use lib/output-handler.md:

```
Configuration:
  content: [Generated spec from Phase 2]
  content_type: "plan"
  command_label: "Create-Spec"

  flags:
    terminal_output: [terminal_output from argument parsing]
    file_output: [file_output from argument parsing]
    jira_posting: [jira_posting from argument parsing]

  file_config:
    output_path: [output_path from arguments, or null for auto]
    default_basename: "spec"
    work_folder: [work_folder from Step 1.5, or null]
    jira_id: [from analysis, or null]
    workflow_step: "plan"

  jira_config:
    jira_id: [from analysis, or null]
    cloud_id: "productboard.atlassian.net"
    jira_title: "Implementation Specification"
    jira_author: "Claude Code"

Output (store result for Phase 4):
  output_result: {
    terminal_displayed: [true/false],
    file_created: [true/false],
    file_path: [path or null],
    jira_posted: [true/false],
    metadata_updated: [true/false]
  }
```

---

## PHASE 4: COMPLETION & NEXT STEPS

Use lib/completion-handler.md:

```
Configuration:
  command_type: "plan"
  command_label: "Create-Spec"

  summary_data:
    problem: [One-line problem summary from analysis or from-scratch input]
    output_files: [file_path from output_result if file_created]
    jira_posted: [jira_posted from output_result]
    jira_id: [from analysis or null]
    work_folder: [work_folder from Step 1.5 or null]
    terminal_only: [true if file_output was false]

  command_specific_data:
    spec_title: [Title from generated spec]
    template: "Full" | "Minimal" [from Phase 2]
    task_count: [Count of implementation tasks in spec]
    criteria_count: [Count of acceptance criteria in spec]
    test_count: [Count of test scenarios in spec]

This will:
  - Display completion summary box
  - Suggest next steps (review spec, start implementation, share with team)
  - Wait for user direction
```

---

## QUALITY GATES CHECKLIST

Before presenting the spec, verify ALL of these are complete:

### Input Validation (Phase 1)
- [ ] Input type classified correctly (analysis file, conversation, from-scratch, or raw)
- [ ] If raw input: STOPPED with clear guidance message (not proceeded to spec generation)
- [ ] If valid input: Analysis content successfully extracted
- [ ] User's chosen approach identified (or prompted if multiple options)
- [ ] Enrichment decision made (if applicable): yes/no/manual/skipped

### Spec Generation (Phase 2)
- [ ] Spec generated via spec-generator subagent (context isolated)
- [ ] Spec contains title and metadata
- [ ] Decision rationale or goal statement present
- [ ] Implementation tasks are specific and actionable (checkboxes)
- [ ] Acceptance criteria are testable and clear
- [ ] Testing strategy included (unit/integration/manual)
- [ ] Risks documented (if applicable for full template)
- [ ] File references use `file:line` format where applicable

### Output Handling (Phase 3)
- [ ] Terminal output displayed (unless --quiet)
- [ ] File written to correct path (unless --no-file)
- [ ] Jira posted successfully (if --post-to-jira flag)
- [ ] All output operations confirmed with success messages
- [ ] Error handling executed for any failed operations

### Quality
- [ ] Spec is actionable (can be implemented from it)
- [ ] Spec is complete (all required sections present)
- [ ] Spec is clear (no ambiguous requirements)
- [ ] Spec matches chosen approach from analysis

---

## INTERACTION GUIDELINES

**Communication Style**:
- Be clear and concise - spec generation is straightforward
- Use visual formatting (boxes, emojis) for status updates
- Provide helpful next steps after completion
- Always confirm file paths and operations

**Handling Errors**:
- If input source fails, offer alternatives
- If file write fails, try alternate path or terminal-only
- If Jira post fails, confirm file was still saved locally
- Never fail completely - always provide partial output

**Flexibility**:
- Support multiple input sources (conversation, Jira, file, scratch)
- Support multiple output destinations (terminal, file, Jira)
- Handle both full and minimal spec templates
- Work with or without Jira integration

**Proactive Guidance**:
After creating spec, suggest:
- "Need me to start the implementation workspace?"
- "Want me to break down any section further?"
- "Should I create implementation tasks in Jira?"

---

## 🚀 BEGIN WORKFLOW

Start with Argument Parsing, then proceed to Phase 1: Input Validation & Analysis Extraction.
