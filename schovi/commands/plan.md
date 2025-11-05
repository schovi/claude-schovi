---
description: Generate implementation specification from problem analysis with flexible input sources
argument-hint: [jira-id|github-issue-url|--input path|--from-scratch description] [--work-dir PATH]
allowed-tools: ["Read", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion", "Write"]
---

# Create Specification Workflow

You are **creating an implementation specification** that bridges problem analysis and implementation. This spec transforms exploratory analysis into actionable, clear implementation guidance.

---

## PHASE 1: INPUT VALIDATION & RESOLUTION

**Input Received**: $ARGUMENTS

### Step 1.1: Parse Arguments and Classify Input Type

Parse command arguments to determine input type and validate against requirements.

**Input Types**:

1. **Analysis File** (✅ VALID - Contains technical analysis)
   - Pattern: `--input ./analysis.md` or `--input ./path/to/file.md`
   - Command: `/schovi:plan --input ./analysis-EC-1234.md`
   - Indicators: File path provided explicitly via --input flag
   - Action: Read file and extract analysis content

2. **From Scratch** (✅ VALID - Bypass analysis requirement)
   - Pattern: `--from-scratch "description"`
   - Command: `/schovi:plan --from-scratch "Build user authentication"`
   - Indicators: --from-scratch flag present with description
   - Action: Create minimal spec interactively (no analysis needed)

3. **Conversation Analysis** (✅ VALID - Analysis in recent messages)
   - Pattern: No arguments, but recent `/schovi:analyze` output in conversation
   - Command: `/schovi:plan` (after running `/schovi:analyze`)
   - Indicators: Conversation contains analysis sections with file:line references
   - Action: Extract analysis from recent messages

4. **Jira Issue ID** (❌ INVALID - Raw input, requires analysis first)
   - Pattern: `[A-Z]+-\d+` (e.g., EC-1234, PROJ-567)
   - Command: `/schovi:plan EC-1234`
   - Action: STOP and direct user to run `/schovi:analyze EC-1234` first

5. **GitHub Issue URL** (❌ INVALID - Raw input, requires analysis first)
   - Pattern: `https://github.com/[owner]/[repo]/issues/\d+` or `[owner]/[repo]#\d+`
   - Command: `/schovi:plan https://github.com/owner/repo/issues/123`
   - Action: STOP and direct user to run `/schovi:analyze` first

6. **GitHub PR URL** (❌ INVALID - Raw input, requires analysis first)
   - Pattern: `https://github.com/[owner]/[repo]/pull/\d+` or `#\d+`
   - Command: `/schovi:plan #123`
   - Action: STOP and direct user to run `/schovi:analyze` first

7. **Text Description** (❌ INVALID - Raw input, requires analysis first)
   - Pattern: Free-form problem statement without --from-scratch flag
   - Command: `/schovi:plan "Fix the validation bug"`
   - Action: STOP and suggest --from-scratch or analysis first

8. **Empty/No Arguments** (❌ INVALID - Requires explicit input)
   - Pattern: No arguments provided
   - Command: `/schovi:plan`
   - Action: STOP and direct user to provide explicit file path or run analysis first

### Step 1.2: Validate Input and Enforce Analysis-First Workflow

**Check input classification from Step 1.1:**

**If input type is VALID (Analysis File, From Scratch, or Conversation Analysis):**
- ✅ Proceed to Step 1.3 (Parse Output Flags)

**If input type is INVALID (Raw inputs without analysis):**
- ❌ STOP execution and display guidance message:

```markdown
╭─────────────────────────────────────────────────────────────────╮
│ ❌ ANALYSIS REQUIRED BEFORE SPECIFICATION GENERATION            │
╰─────────────────────────────────────────────────────────────────╮

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

**HALT EXECUTION** - Do not proceed to subsequent steps.

### Step 1.3: Parse Output Flags

**Optional Output Flags**:
- `--output path.md` - Save to specific file path
- `--post-to-jira` - Post spec as Jira comment (requires Jira ID)
- `--no-file` - Skip file creation, terminal only
- `--quiet` - Suppress terminal output

**Default Behavior** (no flags):
- Display spec in terminal (formatted)
- Save to file: `./spec-[jira-id].md` or `./spec-[timestamp].md`
- Do NOT post to Jira (explicit opt-in only)

### Step 1.4: Extract Analysis Content (For Valid Inputs Only)

**This step executes ONLY if Step 1.2 validated input as VALID.**

Based on input type from Step 1.1, extract analysis content:

---

#### Option A: Analysis File (--input flag provided)

```
1. Acknowledge file read:
   📄 **[Create-Spec]** Reading analysis from file: [PATH]

2. Use Read tool to load file contents:
   file_path: [PATH from --input flag]

3. If file doesn't exist or read fails:
   ❌ **[Create-Spec]** File not found: [PATH]

   Use AskUserQuestion:
   "File not found at [PATH]. Please provide:
   - Correct file path with --input flag, OR
   - Run /schovi:analyze first, then use conversation output"

   HALT EXECUTION

4. If file exists and loads successfully:
   ✅ **[Create-Spec]** File loaded ([X] lines)

5. Parse file structure:
   - Look for YAML frontmatter (analysis metadata)
   - Look for section headers:
     * "## 🎯 1. PROBLEM SUMMARY" or similar
     * "## 📊 2. CURRENT STATE ANALYSIS" or similar
     * "## 💡 3. SOLUTION PROPOSALS" or similar
   - Extract file:line references (pattern: `file/path:123`)
   - Extract affected components
   - Extract solution options (if multiple)

6. Store extracted analysis:
   - Problem summary (core issue, impact, severity)
   - Affected components with file:line references
   - User flow and data flow (if present)
   - Solution proposals with pros/cons
   - Technical details and dependencies
   - User notes and preferences

7. Verify analysis quality:
   - Check: Has file:line references? (Critical for actionable spec)
   - Check: Has affected components identified?
   - Check: Has problem description?

   If missing critical elements → Flag for enrichment in Phase 1.5
```

---

#### Option B: Conversation Analysis (no arguments, analysis in conversation)

```
1. Acknowledge search:
   🔍 **[Create-Spec]** Searching conversation for analysis output...

2. Search conversation history (last 100 messages) for:
   - Messages containing "/schovi:analyze" command invocation
   - Messages with analysis output structure:
     * "## 🎯 1. PROBLEM SUMMARY"
     * "## 📊 2. CURRENT STATE ANALYSIS"
     * "## 💡 3. SOLUTION PROPOSALS"
   - Look for file:line references in recent messages

3. If analysis found in conversation:
   ✅ **[Create-Spec]** Found analysis from [N messages ago]

   Extract same content as Option A:
   - Problem summary
   - Affected components with file:line references
   - Flow analysis
   - Solution proposals
   - Technical details

4. If NOT found in conversation:
   ⚠️ **[Create-Spec]** No analysis found in recent conversation

   Use AskUserQuestion:
   "No recent analysis found. Please either:
   1. Run: /schovi:analyze [your-input] first
   2. Provide analysis file: /schovi:plan --input ./analysis.md
   3. Create simple spec: /schovi:plan --from-scratch \"description\""

   HALT EXECUTION

5. Verify analysis quality:
   - Same checks as Option A
   - Flag gaps for enrichment if needed
```

---

#### Option C: From Scratch (--from-scratch flag provided)

```
1. Acknowledge mode:
   ✨ **[Create-Spec]** Creating spec from scratch...

2. Parse provided description:
   - Extract brief description from argument after --from-scratch
   - Example: "Build user authentication" → Title: "User Authentication Feature"

3. Use AskUserQuestion tool for interactive requirements gathering:

   Question 1: "What is the primary goal of this task?"
   - Options: "Bug fix", "New feature", "Refactoring", "Technical debt", "Other"

   Question 2: "Which components or areas will be affected?"
   - Free text input for user to specify
   - Example: "Frontend login page, backend auth service"

   Question 3: "What are the key requirements or acceptance criteria?"
   - Free text input, can be bullet points
   - Example: "- Users can log in with email/password\n- Session persists for 24h\n- Logout clears session"

   Question 4: "Any known constraints or risks?" (Optional)
   - Free text input
   - Example: "Must integrate with existing LDAP system"

4. Acknowledge collected info:
   ✅ **[Create-Spec]** Requirements collected

5. Prepare minimal spec data:
   - Title: From description
   - Goal: From Question 1
   - Affected areas: From Question 2 (high-level, no file:line refs)
   - Acceptance criteria: From Question 3
   - Constraints/risks: From Question 4 (if provided)
   - Template type: "minimal" (no flows, no solution comparisons)

6. Note: From-scratch specs will NOT have:
   - Detailed file:line references
   - User/data flow diagrams
   - Dependency mapping
   - Multiple solution options
   - Focus is "what to build" not "how it works"

7. Skip Phase 1.5 enrichment (from-scratch intentionally lacks technical detail)
```

---

### Step 1.5: Detect User's Chosen Approach

**If analysis contains multiple solution options:**

```
1. Search for user preference indicators in:
   - User messages after analysis was presented
   - Jira comments (if from Jira)
   - File content (if from file)

2. Look for patterns:
   - "Let's go with Option [N]"
   - "I prefer Option [N] because..."
   - "Option [N] makes most sense"
   - "We should do [solution name]"

3. If preference found:
   ✅ **[Create-Spec]** Detected preference: Option [N] - [Solution Name]

4. If preference NOT found:
   ⚠️ **[Create-Spec]** Multiple options available, no clear preference

   Use AskUserQuestion tool:
   "I found [N] solution options in the analysis. Which approach should I use for the spec?"

   Options (from analysis):
   - Option 1: [Name] - [Brief description]
   - Option 2: [Name] - [Brief description]
   - Option 3: [Name] - [Brief description]

   Wait for user selection

5. Confirm selection:
   🎯 **[Create-Spec]** Selected approach: Option [N] - [Solution Name]
```

**If analysis has single approach or from-scratch mode:**
- Skip selection step
- Use the single approach or minimal template

### Step 1.6: Work Folder Resolution & Metadata Setup

**Objective**: Find or create work folder for storing spec and tracking workflow state.

**Integration Point**: Use work folder library (`schovi/lib/work-folder.md`)

#### 1.6.1: Auto-detect from Input File Path

If `--input` flag provided with file path:
```bash
# Extract work folder from path
# Example: .WIP/EC-1234/02-analysis.md → .WIP/EC-1234
work_folder=$(dirname "$(dirname "$input_file_path")")

# Validate it's a work folder (has .metadata.json)
if [ -f "$work_folder/.metadata.json" ]; then
  echo "📁 Detected work folder: $work_folder"
fi
```

#### 1.6.2: Auto-detect from Git Branch

If no input file or work folder not detected:
```bash
# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Extract identifier (Jira ID)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)

# Find work folder
if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)
fi
```

#### 1.6.3: Check for Explicit --work-dir

If `--work-dir` flag provided:
```bash
# Use exactly as specified
work_folder="$work_dir"
```

#### 1.6.4: Create Work Folder if Needed

If no work folder found and not from-scratch mode:
- Extract identifier from analysis source (Jira ID, description)
- Create `.WIP/[identifier]/` structure
- Initialize metadata (similar to analyze command)

**Set workflow.type**:
- If came from spec (01-spec.md): "full"
- If came from analysis (02-analysis.md): "technical"
- If from-scratch: "simple"

#### 1.6.5: Load or Update Metadata

**If metadata exists**:
```bash
cat "$work_folder/.metadata.json"
```

**If new folder, create metadata** with:
- workflow.steps based on type
- workflow.current = "plan"
- workflow.completed = [previous steps]

**Store for later phases**:
```
work_folder = [path or null]
identifier = [extracted id]
```

---

## PHASE 1.5: CONTEXT ENRICHMENT (Optional)

**Purpose**: Fill technical gaps in existing analysis when needed for actionable spec generation.

**When to Execute This Phase**:

Check if enrichment is needed by evaluating analysis quality from Step 1.4:

```
**Skip enrichment if ANY of these are true**:
- Input type is "From Scratch" (intentionally lacks technical detail)
- Analysis has comprehensive file:line references (3+ specific locations)
- Analysis has clear component identification with entry points
- All affected areas have specific file paths

**Consider enrichment if**:
- Analysis has vague component references ("the validator" without file path)
- Analysis lacks file:line references (no specific code locations)
- Analysis mentions components without file paths
- Entry points unclear (no API endpoint or UI component file specified)
```

### Step 1.5.1: Detect Enrichment Gaps

**Analyze extracted analysis content** from Step 1.4:

```
1. Check for technical detail quality:

   ✅ GOOD - Has specific locations:
      - "FieldMappingValidator (services/FieldMappingValidator.ts:67)"
      - "MappingController handles creation (api/controllers/MappingController.ts:123)"
      - "ProcessingPipeline fails on boolean (services/DataProcessor.ts:234)"

   ⚠️ NEEDS ENRICHMENT - Vague references:
      - "The mapping validator needs updating"
      - "Backend API controller"
      - "Processing service has the bug"

2. Count file:line references found:
   - 0-2 references: ⚠️ Likely needs enrichment
   - 3-5 references: ✅ Probably sufficient
   - 6+ references: ✅ Comprehensive, skip enrichment

3. Check for entry points:
   - Has API endpoint file specified? (e.g., controllers/X.ts:123)
   - Has UI component file specified? (e.g., components/Dashboard.tsx:45)
   - If missing: ⚠️ Consider enrichment

4. Store enrichment decision:
   needs_enrichment = [true | false]
   gaps_identified = [list of what's missing]
```

### Step 1.5.2: Ask User for Enrichment Permission

**If needs_enrichment == true:**

```
Use AskUserQuestion tool to ask permission:

"The analysis is missing specific file locations for some components:

**Gaps Identified**:
[List gaps from Step 1.5.1]

Examples:
- "The validator" mentioned but no file path specified
- No API controller file location found
- Processing logic location unclear

**I can enrich the analysis with specific file locations** by quickly exploring
the codebase (20-40 seconds). This will make the spec more actionable.

**Options**:
1. **Yes, enrich now** - I'll find specific file:line references
2. **No, skip enrichment** - Generate spec with current analysis
3. **I'll provide locations manually** - You tell me the file paths

Which would you like?"

Wait for user response.
```

### Step 1.5.3: Execute Enrichment (If User Approves)

**If user selected "Yes, enrich now":**

```
1. Acknowledge enrichment:
   🔍 **[Create-Spec]** Enriching analysis with specific file locations...
   ⏳ Spawning Explore subagent for targeted search...

2. Prepare context for Explore subagent:
   - List vague components from analysis
   - List missing entry points
   - Problem description for context

3. Use Task tool to spawn Explore subagent:

   subagent_type: "Explore"
   thoroughness: "quick"
   description: "Find specific file locations for spec generation"
   prompt: "Find exact file paths and line numbers for these components.

   **Problem Context**: [Brief problem from analysis]

   **Components to Locate**:
   [List from gaps_identified, e.g.:]
   - Mapping validator logic
   - API controller handling mapping creation
   - Data processing service

   **What I Need** (focus ONLY on this):
   - Exact file paths (e.g., services/FieldValidator.ts)
   - Specific line numbers where logic exists (e.g., :67)
   - Entry point locations (API endpoints: controllers/X.ts, UI: components/Y.tsx)

   **What I DON'T Need** (skip these):
   - Flow diagrams (already in analysis)
   - Dependency mapping (already in analysis)
   - Solution proposals (already in analysis)
   - Code quality assessment
   - Historical context

   **Output Format**: Return concise list:
   - ComponentName: file/path.ts:line - [1-sentence role]

   **Example**:
   - FieldValidator: services/FieldMappingValidator.ts:67 - Validates mapping requests
   - MappingAPI: api/controllers/MappingController.ts:123 - Handles POST /mappings
   - DataProcessor: services/DataProcessor.ts:234 - Processes boolean types

   **Time Limit**: Quick search only (20-40 seconds max)"

4. Wait for Explore subagent response

5. Receive enrichment results:
   ✅ **[Create-Spec]** Enrichment complete

6. Merge enrichment with analysis:
   - Add file:line references to vague component mentions
   - Fill in missing entry point locations
   - Preserve ALL existing analysis content (flows, solution proposals, etc.)
   - Store enriched analysis for Phase 2

7. Summary:
   📍 **[Create-Spec]** Added [N] specific file locations to analysis
   ✅ Ready for spec generation with actionable file references

**Time**: 20-40 seconds (targeted search)
**Tokens**: ~300-500 (file locations only, not deep exploration)
```

**If user selected "No, skip enrichment":**

```
1. Acknowledge:
   ⏭️ **[Create-Spec]** Skipping enrichment, using analysis as-is

2. Note in spec generation context:
   - Spec may have higher-level tasks without specific file:line refs
   - Tasks will be more general ("Update validator logic" vs "Update FieldValidator.ts:67")
   - Still actionable, just less specific

3. Proceed to Phase 2
```

**If user selected "I'll provide locations manually":**

```
1. Use AskUserQuestion for each gap:
   "Please provide file path for: [Component Name]
   Example: services/FieldValidator.ts:67"

2. Collect user-provided locations

3. Merge with analysis:
   - Add user-provided file:line references
   - Store enriched analysis for Phase 2

4. Confirm:
   ✅ **[Create-Spec]** Manual locations added to analysis

5. Proceed to Phase 2
```

### Step 1.5.4: Validation

**Before proceeding to Phase 2, verify:**

```
- [ ] Enrichment decision made (yes/no/manual)
- [ ] If enriched: File:line references added to analysis
- [ ] If skipped: Noted for spec generation
- [ ] Analysis content ready for spec-generator subagent
- [ ] Chosen approach identified (if multiple options existed)
```

---

## PHASE 2: SPEC GENERATION

**CRITICAL**: Use the **Task tool with spec-generator subagent** for context-isolated spec generation.

### Step 2.1: Prepare Subagent Context

```
1. Acknowledge spec generation:
   ⚙️ **[Create-Spec]** Generating implementation specification...
   ⏳ Spawning spec-generator subagent...

2. Prepare input package for subagent:
   - Analysis content (problem, flows, components, dependencies)
   - Chosen approach (solution description, changes required, pros/cons)
   - User preferences and notes
   - Template type (full vs minimal)
   - Jira ID (if available, for metadata)
   - Output requirements (which sections to include)

3. Determine template type:
   - **Full Template**: Use when detailed analysis exists
     * Includes: Decision rationale, technical overview, data flows, dependencies, risks

   - **Minimal Template**: Use for from-scratch or simple tasks
     * Includes: Goal, requirements, basic tasks, acceptance criteria
```

### Step 2.2: Spawn Spec-Generator Subagent

```
Use Task tool with fully qualified subagent name:

Task tool parameters:
  subagent_type: "schovi:spec-generator:spec-generator"
  description: "Generating implementation spec"
  prompt: "Generate implementation specification for [JIRA-ID or description]

  ## Input Context

  ### Problem Summary
  [Problem description from analysis]

  ### Chosen Approach
  Option [N]: [Solution Name]
  [Detailed approach description]

  ### Technical Details
  - Affected files: [List with file:line references]
  - User flow: [Flow description]
  - Data flow: [Flow description]
  - Dependencies: [List of dependencies]

  ### User Notes
  [Any user preferences or comments]

  ### Template Type
  [full|minimal]

  ### Metadata
  - Jira ID: [ID or N/A]
  - Created by: [User email if available]
  - Created date: [Today's date]

  ## Task

  Generate a complete implementation specification following the spec template structure.
  Include all relevant sections based on template type.
  Ensure spec is actionable, clear, and includes testable acceptance criteria.
  Return formatted markdown ready for file output."

IMPORTANT: The subagent will:
- Process analysis content in isolated context
- Extract technical details into structured sections
- Generate implementation tasks from approach description
- Create acceptance criteria from requirements
- Document risks and mitigations
- Fill template with specific, actionable content
- Return polished spec (~1.5-2.5k tokens)

This prevents large analysis content from polluting main context.
```

### Step 2.3: Receive and Validate Spec

```
1. Receive spec output from subagent

2. Validate spec completeness:
   - Has title and metadata
   - Contains decision rationale (full template) or goal statement (minimal)
   - Includes implementation tasks (checkboxes)
   - Has acceptance criteria (testable)
   - Includes testing strategy
   - Documents risks (if applicable)

3. If validation passes:
   ✅ **[Create-Spec]** Spec generated successfully

4. If validation fails:
   ⚠️ **[Create-Spec]** Spec incomplete, regenerating...
   [Identify missing sections and retry with more specific prompt]

5. Store generated spec for Phase 3 output handling
```

---

## PHASE 3: OUTPUT HANDLING

Handle multiple output destinations based on flags.

### Step 3.1: Terminal Output (Default, unless --quiet)

```
1. Format spec for terminal display:
   - Use syntax highlighting for code blocks
   - Preserve markdown structure
   - Add visual separators between sections

2. Present spec:

   ╭─────────────────────────────────────────────────────╮
   │ 📋 IMPLEMENTATION SPECIFICATION                     │
   ╰─────────────────────────────────────────────────────╯

   [Formatted spec content]

   ╭─────────────────────────────────────────────────────╮
   │ ✅ Spec generated | ~[X] lines                      │
   ╰─────────────────────────────────────────────────────╯

3. Always display in terminal unless --quiet flag
```

### Step 3.2: File Writer & Metadata Update (Default, unless --no-file)

```
1. Determine file path:

   A. If --output flag provided:
      - Use exact path specified
      - Example: --output ~/specs/feature.md → ~/specs/feature.md

   B. If work_folder exists (from Step 1.6):
      - Use: $work_folder/03-plan.md
      - Example: .WIP/EC-1234-add-auth/03-plan.md

   C. If no --output flag and no work_folder (fallback):
      - With Jira ID: ./spec-[JIRA-ID].md
        * Example: EC-1234 → ./spec-EC-1234.md

      - Without Jira ID: ./spec-[TIMESTAMP].md
        * Example: → ./spec-20250411-143052.md

   D. If --no-file flag:
      - Skip file creation entirely
      - Only terminal output

2. Check if file exists:
   - If exists: Prompt user for overwrite confirmation
   - If new: Proceed with write

3. Write spec to file using Write tool:
   - Full markdown content from subagent
   - Preserve formatting and structure

4. Confirm write:
   💾 **[Create-Spec]** Spec saved to: [FILE_PATH]

5. Update Metadata (if work folder exists):

   **If work_folder is set** (from Step 1.6):

   Read existing metadata:
   ```bash
   cat "$work_folder/.metadata.json"
   ```

   Update fields:
   ```json
   {
     ...existing,
     "workflow": {
       ...existing.workflow,
       "completed": [...existing.completed, "plan"],
       "current": "plan"
     },
     "files": {
       ...existing.files,
       "plan": "03-plan.md"
     },
     "timestamps": {
       ...existing.timestamps.created,
       "lastModified": "[now from date -u]"
     },
     "phases": {
       "total": [count phases in plan],
       "completed": 0,
       "current": null,
       "list": [extract from plan if multi-phase]
     }
   }
   ```

   Use Write tool to save updated metadata to `$work_folder/.metadata.json`.

   **If no work folder** (fallback mode):
   - Skip metadata update

6. Provide helpful next steps:
   "Spec file created. Next steps:
   - Review and edit the spec if needed
   [If work_folder]: - Run /schovi:implement to start implementation
   [If no work_folder]: - Use /schovi:start-implementation [jira-id] when ready
   - Share spec with team for review"
```

### Step 3.3: Jira Poster (Optional, requires --post-to-jira)

```
ONLY execute if --post-to-jira flag provided AND Jira ID is available.

1. If no Jira ID:
   ⚠️ **[Create-Spec]** Cannot post to Jira: No Jira issue ID provided
   Skip this step

2. If Jira ID available:
   📤 **[Create-Spec]** Posting spec to Jira issue [JIRA-ID]...

3. Format spec for Jira comment:
   - Convert markdown to Jira markup (if needed)
   - Add label prefix: "**SPEC - DRAFT**" at top
   - Include metadata (created date, version)
   - Add separator at end

4. Use mcp__jira__addCommentToJiraIssue tool:
   - cloudId: [Detected from issue or default]
   - issueIdOrKey: [JIRA-ID]
   - commentBody: [Formatted spec]

5. On success:
   ✅ **[Create-Spec]** Spec posted to Jira
   📎 View at: [Jira comment URL if available]

6. On failure:
   ❌ **[Create-Spec]** Failed to post to Jira: [Error message]
   💾 Spec is still saved locally at: [FILE_PATH]
```

---

## PHASE 4: COMPLETION & NEXT STEPS

### Step 4.1: Summary

```
Present completion summary:

╭──────────────────────────────────────────────────╮
│ ✅ SPECIFICATION CREATED                         │
╰──────────────────────────────────────────────────╯

**Spec Details**:
- Title: [Spec title]
- Jira Issue: [JIRA-ID or N/A]
- Template: [Full / Minimal]

**Outputs**:
- 📺 Terminal: [Displayed / Skipped]
- 💾 File: [FILE_PATH or N/A]
- 📎 Jira: [Posted / Skipped]

**Spec Contents**:
- Implementation tasks: [N] tasks
- Acceptance criteria: [N] criteria
- Testing scenarios: [N] scenarios
- Sections: [List key sections included]
```

### Step 4.2: Proactive Next Steps

```
Offer helpful next actions:

"✨ **What's next?**

1. **Review & Edit**: Open [FILE_PATH] to review/modify the spec
2. **Start Implementation**: Use `/schovi:start-implementation [jira-id]` to set up workspace
3. **Share for Review**: Share spec with team before implementation
4. **Ask Questions**: Ask me if you need clarification on any section"

Wait for user direction.
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

### Spec Generation
- [ ] Spec generated via spec-generator subagent (context isolated)
- [ ] Spec contains title and metadata
- [ ] Decision rationale or goal statement present
- [ ] Implementation tasks are specific and actionable (checkboxes)
- [ ] Acceptance criteria are testable and clear
- [ ] Testing strategy included (unit/integration/manual)
- [ ] Risks documented (if applicable for full template)
- [ ] File references use `file:line` format where applicable

### Output Handling
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

Start with Phase 1: Input Resolution.
