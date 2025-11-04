---
description: Generate implementation specification from problem analysis with flexible input sources
argument-hint: [jira-id|github-issue-url|--file path|--from-scratch description]
allowed-tools: ["Read", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion", "Write"]
---

# Create Specification Workflow

You are **creating an implementation specification** that bridges problem analysis and implementation. This spec transforms exploratory analysis into actionable, clear implementation guidance.

---

## PHASE 1: INPUT RESOLUTION

**Input Received**: $ARGUMENTS

### Step 1.1: Parse Arguments and Determine Input Source

**Priority Order**:

**PRIORITY 1: Explicit Arguments** (Highest Priority)
Parse arguments first. If any explicit input provided, use it immediately.

1. **Jira Issue ID**: Matches pattern `[A-Z]+-\d+` (e.g., EC-1234, PROJ-567)
   - Command: `/schovi:plan EC-1234`
   - Action: Fetch from Jira via jira-analyzer subagent

2. **GitHub Issue URL**: Matches pattern `https://github.com/[owner]/[repo]/issues/\d+` or `[owner]/[repo]#\d+`
   - Command: `/schovi:plan https://github.com/owner/repo/issues/123`
   - Command: `/schovi:plan owner/repo#123`
   - Action: Fetch from GitHub via gh-issue-analyzer subagent

3. **File Path**: Uses `--file` flag
   - Command: `/schovi:plan --file ./analysis.md`
   - Action: Read markdown file from provided path

4. **From Scratch**: Uses `--from-scratch` flag with description
   - Command: `/schovi:plan --from-scratch "Build user authentication"`
   - Action: Create minimal spec interactively

**PRIORITY 2: File References in Conversation** (Smart Auto-Detect)
If no explicit arguments, search conversation for file references from previous commands.

5. **Analysis File Reference** (Auto-detect)
   - Command: `/schovi:plan`
   - Detect: Search last 50 messages for patterns like:
     * "saved to ./analysis-*.md"
     * "Output: ./analysis-*.md"
     * Any mention of `./analysis-*.md` or `./problem-*.md`
   - Action: Read detected file path
   - Fallback: If file not found or invalid, proceed to Priority 3

**PRIORITY 3: Raw Conversation Output** (Fallback)
If no explicit arguments AND no file references found, search for raw command output.

6. **Conversation Context** (Auto-detect fallback)
   - Command: `/schovi:plan`
   - Detect: Search last 50 messages for `/schovi:analyze` output structure
   - Action: Extract analysis sections from conversation
   - Fallback: If not found, ask user for input

**PRIORITY 4: User Prompt**

7. **Empty/Unclear**: Missing or ambiguous input
   - Action: Ask user which input source to use

### Step 1.2: Parse Output Flags

**Optional Output Flags**:
- `--output path.md` - Save to specific file path
- `--post-to-jira` - Post spec as Jira comment (requires Jira ID)
- `--no-file` - Skip file creation, terminal only
- `--quiet` - Suppress terminal output

**Default Behavior** (no flags):
- Display spec in terminal (formatted)
- Save to file: `./spec-[jira-id].md` or `./spec-[timestamp].md`
- Do NOT post to Jira (explicit opt-in only)

### Step 1.3: Fetch Analysis Content

Execute based on detected input source (in priority order):

---

#### Source A1: Analysis File Reference (Auto-detected from Conversation)

```
PRIORITY 2: Search conversation for file references before parsing raw output.

1. Acknowledge search:
   🔍 **[Create-Spec]** No explicit arguments provided
   🔍 **[Create-Spec]** Searching for analysis file references...

2. Search conversation history (last 50 messages) for file path patterns:
   - Regex pattern: `\./(?:analysis|problem)-[A-Z0-9-]+\.md`
   - Look in contexts:
     * "saved to [FILE_PATH]"
     * "Output: [FILE_PATH]"
     * "Analysis saved to [FILE_PATH]"
     * Standalone mentions: "./analysis-EC-1234.md"

3. If file reference found:
   ✅ **[Create-Spec]** Found file reference: [FILE_PATH]
   📄 **[Create-Spec]** Attempting to read file...

   A. Use Read tool to load file:
      - File path: [DETECTED_PATH]
      - Full content read

   B. Verify file validity:
      - Check file exists (Read succeeds)
      - Check contains analysis structure:
        * Has markdown headers (##, ###)
        * Contains problem/solution sections
        * Has technical details or requirements

   C. If file valid:
      ✅ **[Create-Spec]** Analysis loaded from file ([X] lines)

      Extract same content as Source D (File Path):
      - Problem statement
      - Solution options
      - Technical details (files, flows, dependencies)
      - User preferences and notes

      STOP here - proceed to Step 1.4 (don't search raw conversation)

   D. If file invalid or empty:
      ⚠️ **[Create-Spec]** File found but invalid/empty
      ⏭️ **[Create-Spec]** Falling back to conversation search...

      Continue to Source A (raw conversation output)

4. If NO file reference found:
   ℹ️ **[Create-Spec]** No file references detected
   ⏭️ **[Create-Spec]** Searching raw conversation output...

   Continue to Source A (raw conversation output)
```

**Why Priority 2?**
- Files are complete and structured (no truncation)
- Files are faster to read than parsing conversation
- Files are more reliable than extracting from messages
- When analysis was saved to file, that's the source of truth

---

#### Source A: Conversation Context (Raw Output Fallback)

```
PRIORITY 3: Only executed if no explicit args AND no file references found.

1. Acknowledge search:
   🔍 **[Create-Spec]** Searching conversation for raw analysis output...

2. Search conversation history (last 50 messages) for:
   - Messages containing "/schovi:analyze" command invocation
   - Messages with analysis output structure:
     * "🎯 1. PROBLEM SUMMARY"
     * "📊 2. CURRENT STATE ANALYSIS"
     * "💡 3. SOLUTION PROPOSALS"

3. If found:
   ✅ **[Create-Spec]** Found analysis from [N messages ago]

   Extract:
   - Problem summary (core issue, impact, urgency)
   - Affected components (files with line numbers)
   - User flow and data flow diagrams
   - Solution proposals (Option 1, Option 2, etc.)
   - User's comments indicating preference ("I think Option 2 makes sense")

4. If NOT found:
   ⚠️ **[Create-Spec]** No recent analysis found in conversation

   Prompt user with AskUserQuestion:
   "No recent analysis found. What should I use?
   1. Provide Jira issue ID
   2. Provide file path to analysis
   3. Create spec from scratch
   4. Paste analysis directly"

   Wait for response and restart Phase 1
```

---

#### Source B: GitHub Issue (URL Provided)

```
IMPORTANT: Delegate to gh-issue-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Create-Spec]** Detected GitHub issue: [OWNER/REPO#NUMBER]
   ⏳ Fetching issue details via gh-issue-analyzer...

2. Use the Task tool to invoke gh-issue-analyzer subagent:
   prompt: "Fetch and summarize GitHub issue [GITHUB-ISSUE-URL or owner/repo#number]"
   subagent_type: "schovi:gh-issue-analyzer:gh-issue-analyzer"
   description: "Fetching GitHub issue summary"

3. The subagent will return structured summary (~800 tokens) with:
   - Core information (number, title, url, state, author)
   - Condensed description
   - Labels and assignees
   - Key comments (including requirements/clarifications)
   - Analysis notes

4. Acknowledge receipt:
   ✅ **[Create-Spec]** Issue details fetched successfully

5. Extract from summary:
   - Problem description from issue body
   - Requirements from comments (if present)
   - User preferences from comment thread
   - Labels indicating type (bug, feature, etc.)

6. If GitHub issue contains detailed requirements:
   - Use requirements as input for spec
   - Create spec from issue description + comments

7. If GitHub issue lacks detailed analysis:
   - Create spec from issue description only
   - Use minimal template (less technical detail)

NEVER fetch GitHub issues directly - always use subagent for context isolation.
```

---

#### Source C: Jira Issue (ID Provided)

```
IMPORTANT: Delegate to jira-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Create-Spec]** Detected Jira issue: [ISSUE-KEY]
   ⏳ Fetching issue details via jira-analyzer...

2. Use the Task tool to invoke jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

3. The subagent will return structured summary (~800 tokens) with:
   - Core information (key, title, type, status, priority)
   - Condensed description
   - Acceptance criteria
   - Key comments (including analysis if present)
   - Technical context

4. Acknowledge receipt:
   ✅ **[Create-Spec]** Issue details fetched successfully

5. Extract from summary:
   - Problem description from Jira description field
   - Analysis content from comments (if present)
   - User preferences from comment thread
   - Acceptance criteria (for spec inclusion)

6. If Jira contains analysis:
   - Use analysis sections as input

7. If Jira lacks detailed analysis:
   - Create spec from Jira description + acceptance criteria
   - Use minimal template (less technical detail)

NEVER fetch Jira directly - always use subagent for context isolation.
```

---

#### Source D: File Path (--file Provided)

```
1. Acknowledge file read:
   📄 **[Create-Spec]** Reading analysis from file: [PATH]

2. Use Read tool to load file contents

3. If file doesn't exist:
   ❌ **[Create-Spec]** File not found: [PATH]

   Ask user:
   "File not found. Please provide:
   - Correct file path, OR
   - Different input source (Jira ID, conversation context, from-scratch)"

   Wait for response and restart Phase 1

4. If file exists:
   ✅ **[Create-Spec]** File loaded ([X] lines)

5. Parse file structure (flexible format):
   - Look for section headers (##, ###)
   - Identify problem description
   - Extract solution options
   - Find affected files/components
   - Capture user notes and preferences

6. Handle various markdown formats:
   - Structured analysis output (from analyze command)
   - Unstructured notes with bullets
   - Mix of text and code snippets
   - Links and references

7. Extract key information:
   - Problem statement
   - Chosen approach (if indicated)
   - Technical details (files, flows, dependencies)
   - Any user comments or decisions
```

---

#### Source E: From Scratch (--from-scratch Provided)

```
1. Acknowledge mode:
   ✨ **[Create-Spec]** Creating spec from scratch...

2. Parse provided description:
   - Extract brief description from argument
   - Example: "Build user authentication" → Title: "User Authentication Feature"

3. Use AskUserQuestion tool for key details:
   Question 1: "What is the primary goal of this task?"
   - Options: Bug fix, New feature, Refactoring, Technical debt, Other

   Question 2: "Which components/areas are affected?"
   - (Free text input for user to specify)

   Question 3: "What are the key requirements or acceptance criteria?"
   - (Free text input, bullet points)

   Question 4: "Any known constraints or risks?"
   - (Free text input, optional)

4. Acknowledge collected info:
   ✅ **[Create-Spec]** Requirements collected, generating minimal spec...

5. Prepare minimal template data:
   - Title from description
   - Goal from user answer
   - Affected components from user answer
   - Basic acceptance criteria from user answer
   - Constraints/risks if provided

6. Skip detailed analysis sections:
   - No user/data flow diagrams
   - No dependency mapping
   - No solution comparisons
   - Focus on "what to build" not "how it works"
```

---

### Step 1.4: Detect User's Chosen Approach

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

### Step 3.2: File Writer (Default, unless --no-file)

```
1. Determine file path:

   A. If --output flag provided:
      - Use exact path specified
      - Example: --output ~/specs/feature.md → ~/specs/feature.md

   B. If no --output flag (default):
      - With Jira ID: ./spec-[JIRA-ID].md
        * Example: EC-1234 → ./spec-EC-1234.md

      - Without Jira ID: ./spec-[TIMESTAMP].md
        * Example: → ./spec-20250411-143052.md

   C. If --no-file flag:
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

5. Provide helpful next steps:
   "Spec file created. Next steps:
   - Review and edit the spec if needed
   - Use /schovi:start-implementation [jira-id] when ready to begin
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

### Input Resolution
- [ ] Input source successfully identified (conversation/Jira/file/scratch)
- [ ] Analysis content or requirements successfully extracted
- [ ] User's chosen approach identified (or prompted if multiple options)

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
