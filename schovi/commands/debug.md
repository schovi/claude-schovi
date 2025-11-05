---
description: Deep debugging workflow with root cause analysis, problematic flow identification, and single fix proposal
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|datadog-url|description] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Debugger Workflow

You are performing **deep debugging and root cause analysis** for a bug or production issue. Follow this structured workflow to identify the problematic flow and propose a single, targeted fix.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-3 (debugging and root cause analysis). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

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

**Input Received**: $ARGUMENTS

Parse command arguments to determine:

### Problem Input
Extract the problem identifier (first non-flag argument):
- **Jira Issue ID**: Pattern `[A-Z]+-\d+` (e.g., EC-1234)
- **GitHub PR**: Full URL, `owner/repo#123`, or `#123`
- **GitHub Issue**: Full URL or `owner/repo#123`
- **Datadog Trace/Error**: Full URL or trace ID
- **Text Description**: Free-form problem statement (error message, stack trace, etc.)
- **Empty**: No problem specified

### Flags
Parse optional flags (can appear in any order):

- **`--input PATH`**: Read problem description from file
  - Example: `--input ~/docs/error-log.txt`
  - File should contain error details, stack trace, or context
  - Overrides positional argument if both provided

- **`--output PATH`**: Save debug report to specific file path
  - Example: `--output ~/docs/debug-EC-1234.md`
  - Overrides default filename

- **`--no-file`**: Skip file output, terminal only
  - Mutually exclusive with `--output`
  - Use when you only want to see debug report, not save it

- **`--quiet`**: Skip terminal output, file only
  - Still creates file (unless `--no-file`)
  - Use for automation or when you just want the artifact

- **`--post-to-jira`**: Post debug report as Jira comment
  - Requires Jira ID in problem input
  - Fails gracefully if no Jira ID
  - Posts after successful debug report generation

### Flag Validation
- `--input` overrides positional argument if both provided → Use file content
- `--output` and `--no-file` cannot be used together → Error
- `--post-to-jira` without Jira ID → Warning, skip Jira posting
- Unknown flags → Warn user but continue

### Defaults
If no output flags specified:
- **Default behavior**: Terminal display + save to file
- **Default filename**:
  - With Jira ID: `debug-[JIRA-ID].md` (e.g., `debug-EC-1234.md`)
  - Without Jira ID: `debug-[timestamp].md` (e.g., `debug-2025-04-11-143022.md`)

### Storage for Later Phases
Store parsed values for use in Phases 3-5:
```
input_path = [--input PATH] or [null]
problem_input = [extracted identifier or description or from file]
output_path = [--output PATH] or [default filename] or [null if --no-file]
terminal_output = true (unless --quiet)
jira_posting = [true if --post-to-jira]
```

---

## PHASE 1: INPUT PROCESSING & CONTEXT GATHERING

**Problem Input**: [From argument parsing above]

### Step 1.1: Parse Input

**If `--input PATH` flag provided**:
```
1. Read file content using Read tool:
   file_path: [input_path from argument parsing]

2. Use file content as problem_input (overrides positional argument)

3. Continue to determine input type from file content
```

**Determine input type** (from positional argument or file content):
- **Jira Issue ID**: Matches pattern `[A-Z]+-\d+` (e.g., EC-1234, PROJ-567)
- **GitHub PR**: Matches patterns:
  - Full URL: `https://github.com/owner/repo/pull/123`
  - Short reference: `owner/repo#123`
  - Issue number: `#123` (requires git remote detection)
- **GitHub Issue**: Matches patterns:
  - Full URL: `https://github.com/owner/repo/issues/123`
  - Short reference: `owner/repo#123` (disambiguate from PR)
- **Datadog Trace/Error**: Matches patterns:
  - Full URL: `https://app.datadoghq.com/...`
  - Trace ID: UUID or trace identifier
- **Textual Description**: Free-form problem statement (error message, stack trace, logs)
- **Empty/Unclear**: Missing or ambiguous input

### Step 1.2: Fetch Detailed Information

**If Jira Issue ID Provided**:
```
IMPORTANT: Delegate to the jira-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🐛 **[Debug-Problem]** Detected Jira issue: [ISSUE-KEY]
   ⏳ Fetching issue details via jira-analyzer...

2. Use the Task tool to invoke the jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

3. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "API error"):
   ```
   ❌ **[Debug-Problem]** Failed to fetch Jira issue [ISSUE-KEY]

   Error: [Extract error message from subagent response]

   Options:
   1. Verify issue key and retry
   2. Provide problem description manually
   3. Cancel debugging

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Debug-Problem]** Issue details fetched successfully

4. Use this summary as the primary source for debugging context
```

**If GitHub PR Provided**:
```
IMPORTANT: Delegate to the gh-pr-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🐛 **[Debug-Problem]** Detected GitHub PR: [PR reference]
   ⏳ Fetching PR details via gh-pr-analyzer...

2. Use the Task tool to invoke the gh-pr-analyzer subagent:
   prompt: "Fetch and summarize GitHub PR [URL, owner/repo#123, or #123]"
   subagent_type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
   description: "Fetching GitHub PR summary"

3. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "authentication"):
   ```
   ❌ **[Debug-Problem]** Failed to fetch GitHub PR [PR reference]

   Error: [Extract error message from subagent response]

   Options:
   1. Verify PR reference and retry
   2. Provide problem description manually
   3. Cancel debugging

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Debug-Problem]** PR details fetched successfully

4. Focus on CI failures, test failures, and build errors from PR summary
```

**If GitHub Issue Provided**:
```
IMPORTANT: Delegate to the gh-issue-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🐛 **[Debug-Problem]** Detected GitHub issue: [ISSUE reference]
   ⏳ Fetching issue details via gh-issue-analyzer...

2. Use the Task tool to invoke the gh-issue-analyzer subagent:
   prompt: "Fetch and summarize GitHub issue [URL or owner/repo#123]"
   subagent_type: "schovi:gh-issue-analyzer:gh-issue-analyzer"
   description: "Fetching GitHub issue summary"

3. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "authentication"):
   ```
   ❌ **[Debug-Problem]** Failed to fetch GitHub issue [ISSUE reference]

   Error: [Extract error message from subagent response]

   Options:
   1. Verify issue reference and retry
   2. Provide problem description manually
   3. Cancel debugging

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Debug-Problem]** Issue details fetched successfully
```

**If Datadog Trace/Error Provided**:
```
IMPORTANT: Delegate to the datadog-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🐛 **[Debug-Problem]** Detected Datadog trace: [Trace URL or error ID]
   ⏳ Fetching trace details via datadog-analyzer...

2. Use the Task tool to invoke the datadog-analyzer subagent:
   prompt: "Fetch and summarize Datadog trace [URL or trace ID]"
   subagent_type: "schovi:datadog-analyzer:datadog-analyzer"
   description: "Fetching Datadog trace summary"

3. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "authentication"):
   ```
   ❌ **[Debug-Problem]** Failed to fetch Datadog trace [Trace reference]

   Error: [Extract error message from subagent response]

   This usually means:
   - Trace URL/ID is incorrect
   - Datadog API authentication not configured
   - Trace has expired or been deleted
   - Network connectivity issues

   Options:
   1. Verify trace reference and retry
   2. Provide error details manually (copy from Datadog UI)
   3. Cancel debugging

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Debug-Problem]** Trace details fetched successfully

4. You will receive critical debugging context:
   - Error message and type
   - Affected service and endpoints
   - Key spans with duration (performance bottlenecks)
   - Related logs (errors prioritized)
   - Timestamp and frequency patterns

5. Use this to identify:
   - WHERE: Service, file, function where error occurred
   - WHEN: Timestamp, frequency, patterns
   - WHAT: Operation that failed, error type
   - WHY: Performance issues, dependencies, related errors

NOTE: If datadog-analyzer subagent is not available:
- Ask user to provide error details manually from Datadog UI
- Include: trace ID, error message, affected service, key spans, timestamp
- Continue debugging with manual context
```

**If Textual Description Provided** (error messages, stack traces, logs):
```
1. Parse the error context carefully:

   **For stack traces** (Python, JavaScript, Java, etc.):
   Look for these patterns in the message:

   Exception/Error Type:
   - Python: "Exception:", "Error:", "Traceback"
   - JavaScript: "Error:", "TypeError:", "ReferenceError:"
   - Java: "Exception in thread", "Exception:", "Caused by:"

   File Paths:
   - Python: 'File "/path/to/file.py", line 123'
   - JavaScript: 'at /path/to/file.js:123:45'
   - Java: 'at com.example.Class.method(File.java:123)'

   Error Message:
   - Usually on first line after exception type
   - Extract full message before stack frames begin

   Stack Frames:
   - List of file:line:function calls
   - Identify entry point (first frame) and error point (last frame)
   - Note the deepest frame in your codebase (not libraries)

   **For log messages**:
   Look for these patterns:

   Timestamp:
   - ISO format: "2025-04-11T14:23:45Z"
   - Log format: "[2025-04-11 14:23:45]"

   Log Level:
   - ERROR, WARN, INFO, DEBUG, FATAL

   Component/Logger:
   - [ComponentName], [service.submodule]

   Message:
   - After timestamp and level
   - May include context data (user IDs, request IDs, etc.)

   File References:
   - Sometimes includes file:line where log was emitted

   **Extract and document**:
   - exception_type = [e.g., "TypeError", "NullPointerException"]
   - error_message = [e.g., "Cannot read property 'foo' of undefined"]
   - file_locations = [List of file:line from stack frames or logs]
   - entry_point = [First file:line in your codebase, not libraries]
   - error_point = [Last file:line where error occurred]
   - timestamp = [When error occurred, if available]
   - context_data = [User ID, request ID, etc. if available]

2. Store extracted context for Phase 2:
   - File paths from stack trace → Will guide codebase exploration
   - Exception types → Will guide error handling analysis
   - Line numbers → Will provide exact code locations to examine
   - Entry/error points → Will help trace execution flow
   - Context data → Will help reproduce issue
```

**If No Input Provided**:
```
1. Ask user: "Please provide either:
   - A Jira issue ID (e.g., EC-1234)
   - A GitHub PR (URL, owner/repo#123, or #123)
   - A GitHub Issue (URL or owner/repo#123)
   - A Datadog trace URL or trace ID
   - An error message, stack trace, or problem description"
2. Wait for response and restart this phase
```

### Step 1.3: Work Folder Resolution & Metadata Setup

**Objective**: Create or find work folder for storing debug report and tracking workflow state.

**Integration Point**: Use work folder library (`schovi/lib/work-folder.md`)

#### 1.3.1: Check for Explicit Work Folder

If `work_dir` provided via `--work-dir` flag:
```bash
# Use exactly as specified
work_folder="$work_dir"

# Validate it exists
if [ ! -d "$work_folder" ]; then
  echo "⚠️ Work folder not found: $work_folder"
  echo "Creating folder..."
  mkdir -p "$work_folder/context"
fi
```

#### 1.3.2: Auto-detect Existing Work Folder

If no `--work-dir`, try to find existing folder:

**a) From Git Branch**:
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

**b) From Problem Input Identifier**:
```bash
# Extract Jira ID from problem_input
jira_id=$(echo "$problem_input" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b')

if [ -n "$jira_id" ]; then
  work_folder=$(find .WIP -type d -name "${jira_id}*" | head -1)
fi

# Or extract GitHub issue
gh_issue=$(echo "$problem_input" | grep -oE '(issues|pull)/[0-9]+' | grep -oE '[0-9]+')
if [ -n "$gh_issue" ]; then
  work_folder=$(find .WIP -type d -name "GH-${gh_issue}*" | head -1)
fi
```

#### 1.3.3: Create New Work Folder

If no existing folder found, create new one:

**Generate Identifier**:

If Jira ID present (from Step 1.2):
```bash
jira_id="EC-1234"
jira_title="[from Jira summary]"

# Generate slug from title
slug=$(echo "$jira_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//')

# Combine
identifier="${jira_id}-${slug}"
```

If GitHub issue/PR present:
```bash
gh_number="123"
gh_title="[from GitHub summary]"

# Generate slug
slug=$(echo "$gh_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//')

identifier="GH-${gh_number}-${slug}"
```

If description-based (error/bug without external ID):
```bash
# Generate slug from problem description (first 50 chars)
slug=$(echo "$problem_input" | head -c 50 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | sed 's/-$//')

# Prefix with "debug-"
identifier="debug-${slug}"
```

**Create Folder Structure**:
```bash
work_folder=".WIP/$identifier"
mkdir -p "$work_folder/context"
```

#### 1.3.4: Load or Create Metadata

**If metadata exists** (continuing work):
```bash
cat "$work_folder/.metadata.json"
```

Parse to understand:
- workflow.completed: what's done
- workflow.current: last step
- files: existing outputs

**If new folder** (first debug):

Use Write tool to create `$work_folder/.metadata.json`:
```json
{
  "identifier": "[jira-id or GH-number or debug-slug]",
  "title": "[from Jira/GitHub or problem description]",
  "slug": "[generated slug]",
  "workFolder": ".WIP/[identifier]",

  "workflow": {
    "type": "bug",
    "steps": ["debug", "implement"],
    "completed": [],
    "current": "debug"
  },

  "files": {},

  "git": {
    "branch": "[from git rev-parse --abbrev-ref HEAD]",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": "[if Jira]",
    "jiraUrl": "[if Jira]",
    "githubIssue": "[if GitHub issue]",
    "githubIssueUrl": "[if GitHub issue]",
    "githubPR": "[if GitHub PR]",
    "githubPRUrl": "[if GitHub PR]"
  },

  "timestamps": {
    "created": "[from date -u +\"%Y-%m-%dT%H:%M:%SZ\"]",
    "lastModified": "[same as created]",
    "completed": null
  }
}
```

**Get current timestamp**:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Get current git branch**:
```bash
git rev-parse --abbrev-ref HEAD
```

**Set workflow.type = "bug"** because debug → implement (or debug → plan → implement if complex).

#### 1.3.5: Store Work Folder Info

Store for use in later phases:
```
work_folder = [.WIP/identifier]
identifier = [jira-id or GH-number or debug-slug]
metadata_exists = [true|false]
```

**Acknowledge work folder**:
```
📁 **[Debug-Problem]** Work folder: $work_folder
```

---

## PHASE 2: DEEP DEBUGGING & ROOT CAUSE ANALYSIS

**CRITICAL**: Use the **Task tool with Explore subagent type** for focused debugging exploration. This subagent is optimized for code investigation and pattern finding.

**When spawning Explore subagent, acknowledge:**
```
🐛 **[Debug-Problem]** Starting deep debugging analysis...
⏳ Spawning Explore subagent for code investigation...
```

**Subagent Configuration:**
- **subagent_type**: "Explore"
- **thoroughness**: "very thorough" (for comprehensive debugging)
- **description**: "Deep debugging and root cause analysis"
- **prompt**: [Detailed debugging requirements from Steps 2.1-2.4 below]

**Why Explore Subagent**: The Explore subagent is specialized for quickly finding files, searching code patterns, and answering codebase questions - perfect for debugging workflows.

**After receiving debugging results:**
```
✅ **[Debug-Problem]** Root cause analysis complete
```

### Step 2.1: Prepare Comprehensive Debugging Prompt

**Objective**: Create a detailed, structured prompt for the Explore subagent that incorporates ALL debugging requirements.

**Instructions**: Construct the following prompt to pass to the Explore subagent. Include the problem context from Phase 1 and all debugging requirements below.

**Prompt Template**:
```markdown
# Debugging Investigation Request

## Problem Context
[Insert problem summary from Phase 1: error message, exception type, affected service, severity]

[If stack trace available]:
**Stack Trace Context**:
- Exception: [exception_type]: [error_message]
- Entry Point: [entry_point] - Start investigation here
- Error Point: [error_point] - Error occurs here
- Other References: [file_locations]

[If Datadog trace available]:
**Datadog Trace Context**:
- Trace ID: [trace_id]
- Service: [service_name]
- Operation: [operation_name]
- Error: [error_message]
- Key Spans: [span_details]

## Required Investigation

Your task is to perform comprehensive debugging to identify the root cause of this issue and determine the fix location. Provide specific file:line references throughout.

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

**Requirements**:

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

**After preparing the prompt**: Store it for use in Step 2.2.

### Step 2.2: Invoke Explore Subagent

**Objective**: Delegate the comprehensive debugging to the Explore subagent in an isolated context.

**Instructions**:

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

3. **Wait for subagent completion**: The Explore subagent will work in its isolated context and return structured debugging findings.

4. **Acknowledge completion**:
   ```
   ✅ **[Debug-Problem]** Root cause analysis complete
   ```

**Important**: Do NOT execute the debugging instructions directly. The Explore subagent will handle all code investigation.

### Step 2.3: Capture and Structure Debugging Results

**Objective**: Extract and organize the Explore subagent's findings for use in Phase 3 (Fix Proposal Generation).

**Instructions**:

1. **Extract key findings from subagent response**:
   - error_point_analysis = [Location, immediate cause, code context]
   - execution_flow = [Step-by-step trace with file:line references]
   - root_cause = [Category, explanation, triggering condition]
   - impact_assessment = [Severity, scope, data risk]
   - fix_location = [Specific file:line and fix type]
   - code_locations = [All file:line references discovered]

2. **Validate debugging completeness**:

   Check that the subagent provided sufficient detail:
   - [ ] Error point analyzed with immediate cause
   - [ ] Execution flow traced from entry to error with file:line refs
   - [ ] Root cause identified with category and explanation
   - [ ] Impact assessed (severity, scope)
   - [ ] Fix location identified with specific file:line
   - [ ] At least 3-5 file:line references in execution flow

3. **If validation fails**:
   ```
   ⚠️ **[Debug-Problem]** Debugging incomplete

   The Explore subagent's investigation is missing:
   - [List missing requirements]

   This usually means:
   - Stack trace or error context was insufficient
   - Codebase structure is unclear
   - Error point could not be located

   Options:
   1. Re-run investigation with more context (error logs, reproduction steps)
   2. Supplement with targeted manual code reading
   3. Proceed with available information (note gaps in report)
   ```

   Ask user how to proceed. Do NOT continue to Phase 3 with incomplete data.

4. **If validation passes**:
   ```
   ✅ **[Debug-Problem]** Debugging findings validated and structured for fix proposal generation
   ```

   Store the structured findings for Phase 3 input.

**Next**: Proceed to Phase 3 with the captured debugging results.

---

## PHASE 3: FIX PROPOSAL GENERATION

**CRITICAL**: Use the **Task tool with debug-fix-generator subagent** for context-isolated fix proposal generation.

This phase transforms Phase 2 debugging results into a structured, actionable fix proposal without polluting main context.

### Step 3.1: Prepare Subagent Input Context

**Objective**: Construct the input package for debug-fix-generator subagent using outputs from Phase 2 Step 2.3.

1. Acknowledge fix proposal generation:
   ```
   ⚙️ **[Debug-Problem]** Generating fix proposal...
   ⏳ Spawning debug-fix-generator subagent...
   ```

2. Prepare input package for subagent using captured debugging results:

**Instructions**: Use the structured outputs from Phase 2 Step 2.3 to populate this template.

```markdown
## Input Context

### Problem Context
[From Phase 1: Jira/PR/Issue summary OR error description]
- Source: [Jira ID, PR URL, Issue URL, Datadog URL, or "User description"]
- Title: [Brief problem title]
- Error Type: [Exception type or error category]
- Severity: [critical|high|medium|low]
- Description: [Condensed problem description]

### Debugging Results

#### Error Point Analysis
[Use `error_point_analysis` from Phase 2 Step 2.3]
[Location, immediate cause, code context]

Example format:
- **File**: `path/to/file.ts:123`
- **Immediate Cause**: [e.g., "Null pointer dereference on user.profile"]
- **Code Context**: [Brief code snippet showing problem area]

#### Execution Flow
[Use `execution_flow` from Phase 2 Step 2.3]
[Step-by-step trace with file:line references]

Example format:
```
Entry Point (file:line) - What triggers execution
  ↓
Step 1 (file:line) - What happens
  ↓
Step 2 (file:line) - What happens
  ↓
Error Point (file:line) - Where it breaks
```

#### Root Cause
[Use `root_cause` from Phase 2 Step 2.3]
[Category, explanation, triggering condition]

Example format:
- **Category**: [Logic Error|Data Issue|Timing Issue|Integration Issue|Configuration Issue]
- **Explanation**: [Why this happens]
- **Trigger**: [What condition causes this]

#### Impact Assessment
[Use `impact_assessment` from Phase 2 Step 2.3]
[Severity, scope, data risk]

Example format:
- **Severity**: [Critical|High|Medium|Low]
- **Scope**: [Isolated to X feature | Affects multiple features]
- **Data Risk**: [Can corrupt data | Safe, no data writes]

#### Fix Location
[Use `fix_location` from Phase 2 Step 2.3]
[Specific file:line and fix type]

Example format:
- **Location**: `path/to/file.ts:123`
- **Fix Type**: [Add validation|Fix logic|Error handling|Initialize data|etc.]
- **Related Locations**: [Other places needing similar fixes]

### Code Locations
[Use `code_locations` from Phase 2 Step 2.3]
[All file:line references discovered during debugging]

### Metadata
- Jira ID: [From Phase 1 or N/A]
- PR URL: [From Phase 1 or N/A]
- Issue URL: [From Phase 1 or N/A]
- Datadog Trace: [From Phase 1 or N/A]
- Created by: [User email if available or N/A]
- Created date: [Current date YYYY-MM-DD]
- Error type: [From Phase 1]
- Severity: [From impact assessment]
```

### Step 3.2: Spawn Debug-Fix-Generator Subagent

Use Task tool with the prepared context:

```
subagent_type: "schovi:debug-fix-generator:debug-fix-generator"
description: "Generating fix proposal"
prompt: "Generate structured fix proposal from debugging results.

[PASTE THE FULL INPUT CONTEXT FROM STEP 3.1 HERE]"
```

**The subagent will**:
- Process debugging results in isolated context
- Extract essential findings
- Generate single, targeted fix proposal
- Include code changes, testing approach, rollout strategy
- Return clean, structured report (~1.5-2k tokens) with visual wrappers:

```
╭─────────────────────────────────────────────╮
│ 🔧 DEBUG FIX GENERATOR                      │
╰─────────────────────────────────────────────╯

[YAML frontmatter + all fix proposal sections]

╭─────────────────────────────────────────────╮
  ✅ Fix proposal generated | ~[X] tokens | [Y] lines
╰─────────────────────────────────────────────╯
```

### Step 3.3: Receive and Store Fix Proposal

1. After receiving subagent output, check for errors:

   **If subagent response contains error markers** (❌, "failed", "incomplete", "Generation failed"):
   ```
   ❌ **[Debug-Problem]** Fix proposal generation failed

   Error: [Extract error message from subagent response]

   This usually means:
   - Debugging results were incomplete or malformed
   - Fix proposal template could not be populated
   - Token budget exceeded

   Options:
   1. Review Phase 2 debugging results and re-run if incomplete
   2. Simplify the problem scope and retry
   3. Cancel and review input data quality

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 3.5 (Exit Plan Mode) without valid fix proposal.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Debug-Problem]** Fix proposal generated successfully

2. Extract the fix proposal markdown from subagent response:
   - Remove the visual header/footer wrappers (╭─────╮ boxes)
   - Store the clean markdown (YAML frontmatter + content)

3. Store fix proposal for Phase 4:
   ```
   fix_proposal_markdown = [extracted content without wrappers]
   ```

4. Validate fix proposal completeness:
   - [ ] YAML frontmatter present
   - [ ] Problem summary section exists
   - [ ] Root cause section exists
   - [ ] Fix proposal section exists with code changes
   - [ ] Testing strategy exists
   - [ ] Rollout plan exists
   - [ ] Resources & references exist

   **If validation fails**:
   ```
   ⚠️ **[Debug-Problem]** Fix proposal validation failed

   Missing sections:
   - [List which checklist items failed]

   The debug-fix-generator returned incomplete output. This suggests:
   - Input context was insufficient
   - Subagent encountered internal error

   Options:
   1. Retry fix proposal generation with corrected inputs
   2. Proceed with incomplete fix proposal (not recommended)
   3. Cancel and review debugging quality

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed without complete fix proposal.

---

## PHASE 3.5: EXIT PLAN MODE

**CRITICAL**: You have completed all debugging work (Phases 1-3) in plan mode. Before proceeding to output handling (Phase 4-5), you MUST exit plan mode.

### Step 3.5.1: Use ExitPlanMode Tool

**Acknowledge transition:**
```
⚙️ **[Debug-Problem]** Debugging complete. Transitioning from plan mode to execution mode...
```

**Use the ExitPlanMode tool:**
```
plan: |
  ## Debug Summary

  **Problem**: [One-line problem summary from Phase 1]

  **Root Cause**: [Root cause category and brief explanation]

  **Fix Location**: [file:line where fix should be applied]

  **Fix Type**: [Add validation|Fix logic|Error handling|Initialize data|etc.]

  **Severity**: [Impact assessment from Phase 2]

  **Next Steps**:
  1. Save fix proposal to file (if not --no-file)
  2. Display to terminal (if not --quiet)
  3. Post to Jira (if --post-to-jira)
  4. Present completion summary
```

**After exiting plan mode:**
```
✅ **[Debug-Problem]** Entered execution mode. Proceeding with output handling...
```

**Important**: After using ExitPlanMode, you are now in execution mode and can use Write tool, Bash for file operations, and mcp__jira__* tools for posting.

---

## PHASE 4: OUTPUT HANDLING

Handle fix proposal output based on flags from Argument Parsing:

### Step 4.1: Terminal Output

**If `terminal_output == true`** (default, unless `--quiet`):

1. Display fix proposal to terminal:
   ```
   [Display the full fix_proposal_markdown with proper formatting]
   ```

2. Use visual separator before/after for clarity

**If `--quiet` flag present**:
- Skip terminal display entirely

### Step 4.2: File Output & Metadata Update

**If `output_path != null`** (default, unless `--no-file`):

1. Determine filename:
   - If `--output PATH` specified: Use provided path
   - Else if work_folder exists: `$work_folder/02-debug.md` (work folder)
   - Else if Jira ID present: `./debug-[JIRA-ID].md` (current directory - fallback)
   - Else: `./debug-[YYYY-MM-DD-HHMMSS].md` (current directory - fallback)

2. Resolve and validate output path:

   **Convert to absolute path**:
   ```bash
   # If path starts with ~, expand it
   if [[ "$output_path" == ~* ]]; then
     output_path="${output_path/#\~/$HOME}"
   fi

   # If path is relative, make it absolute from CWD
   if [[ "$output_path" != /* ]]; then
     output_path="$(pwd)/$output_path"
   fi
   ```

   **Create parent directory if needed**:
   ```bash
   # Extract directory from path
   output_dir="$(dirname "$output_path")"

   # Check if parent directory exists
   if [ ! -d "$output_dir" ]; then
     # Try to create it
     mkdir -p "$output_dir" 2>/dev/null

     if [ $? -ne 0 ]; then
       # Creation failed
       echo "⚠️ **[Debug-Problem]** Cannot create directory: $output_dir"
       echo ""
       echo "Options:"
       echo "1. Use current directory instead: ./$(basename "$output_path")"
       echo "2. Specify different output path"
       echo "3. Skip file output (continue with terminal display only)"
       echo ""
       echo "How would you like to proceed?"

       # Wait for user decision and adjust output_path accordingly
     fi
   fi
   ```

   **Final path**: `output_path` (now absolute and parent directory exists)

3. Write fix proposal to file:
   ```
   Use Write tool:
   file_path: [output_path - absolute path]
   content: [fix_proposal_markdown]
   ```

   **Handle write errors**:
   If Write tool fails (permissions, disk full, etc.):
   ```
   ⚠️ **[Debug-Problem]** Failed to write file: [output_path]

   Error: [error message from Write tool]

   The fix proposal is still available in terminal output above.

   Options:
   1. Try different output path
   2. Continue without file (fix proposal shown in terminal)

   How would you like to proceed?
   ```

4. Acknowledge file creation:
   ```
   📄 **[Debug-Problem]** Fix proposal saved to: [output_path]
   ```

5. Update Metadata (if work folder exists):

   **If work_folder is set** (from Step 1.3):

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
       "completed": ["debug"],
       "current": "debug"
     },
     "files": {
       ...existing.files,
       "debug": "02-debug.md"
     },
     "timestamps": {
       ...existing.timestamps.created,
       "lastModified": "[now from date -u]"
     }
   }
   ```

   Use Write tool to save updated metadata to `$work_folder/.metadata.json`.

   **If no work folder** (fallback mode):
   - Skip metadata update

**If `--no-file` flag present**:
- Skip file creation entirely
- Skip metadata update

### Step 4.3: Jira Posting (Optional)

**If `jira_posting == true`** (from `--post-to-jira` flag):

1. Check if Jira ID exists:
   - If NO Jira ID: Warn user and skip this step
     ```
     ⚠️ **[Debug-Problem]** Cannot post to Jira: No Jira ID provided
     ```
   - If Jira ID exists: Proceed

2. Format fix proposal for Jira:
   - Add header with metadata:
     ```
     # Debug Report - Generated by Claude Code

     **Generated**: [timestamp]
     **Debugger**: Claude Code
     **Local File**: [absolute path to output_path if file was created, or "Terminal only"]

     ---
     ```
   - Wrap fix proposal in code block for better formatting: \`\`\`markdown ... \`\`\`

3. Post to Jira using mcp__jira__addCommentToJiraIssue:
   ```
   cloudId: "productboard.atlassian.net"
   issueIdOrKey: [Jira ID from Phase 1]
   commentBody: [formatted fix proposal]
   ```

4. Acknowledge posting:
   ```
   ✅ **[Debug-Problem]** Fix proposal posted to Jira: [JIRA-ID]
   ```

5. If posting fails:
   ```
   ⚠️ **[Debug-Problem]** Failed to post to Jira: [error message]
   ```
   Continue anyway (don't halt workflow)

**If `--post-to-jira` flag NOT present**:
- Skip this step entirely

---

## PHASE 5: COMPLETION & NEXT STEPS

### Step 5.1: Summary

Present completion summary:

```
╭─────────────────────────────────────────────╮
│ ✅ DEBUGGING COMPLETE                       │
╰─────────────────────────────────────────────╯

**Problem**: [One-line summary]

**Root Cause**: [Root cause category and brief explanation]

**Fix Location**: [file:line]

**Work Folder**: [If work_folder exists: $work_folder]

**Output**:
[If file created] - 📄 Saved to: [filename]
[If posted to Jira] - 📋 Posted to Jira: [JIRA-ID]
[If terminal only] - 🖥️  Terminal display only

**Severity**: [Impact level from Phase 2]
```

### Step 5.2: Proactive Next Steps

Offer automatic next actions based on context:

```
**What would you like to do next?**

1. 🔧 **Apply the fix** - I can implement the proposed fix now
2. 🧪 **Review fix details** - Discuss the fix approach or alternatives
3. 📝 **Update Jira** - Post fix proposal as comment (if not already posted)
4. ✅ **Nothing** - You're all set

Choose an option [1-4] or describe what you need:
```

### Step 5.3: Execute User Choice

Based on user response from Step 5.2:

**If user chose option 1** (Apply the fix):
```
Great! I'll implement the fix now.

I will:
1. Read the file at [fix_location]
2. Apply the proposed changes
3. Run any relevant tests
4. Create a commit with the fix

Shall I proceed? [yes/no]
```

If yes: Implement the fix using Edit tool, run tests if appropriate, offer to commit

**If user chose option 2** (Review fix details):
```
Let's review the fix proposal:

**Fix Location**: [file:line]

**Proposed Changes**: [Summary of code changes]

**Testing**: [Testing approach from fix proposal]

What would you like to discuss?
- Why this fix location was chosen?
- Alternative approaches?
- Testing strategy?
- Rollout considerations?
- Something specific?
```

**If user chose option 3** (Update Jira):
```
[If Jira ID exists and not already posted]:
I'll post the fix proposal as a Jira comment now.
[Use mcp__jira__addCommentToJiraIssue]

[If no Jira ID]:
No Jira issue was associated with this debug session.

[If already posted]:
Fix proposal was already posted to Jira: [JIRA-ID]
```

**If user chose option 4** (Nothing):
```
Perfect! The fix proposal is complete and saved. You can reference it anytime.

Available commands:
- `/schovi:implement` - Start implementation with fix proposal
- `/schovi:commit` - Create structured commit after applying fix

Good luck! 🚀
```

---

## ✅ QUALITY GATES REFERENCE

**Note**: Quality gates are enforced in Phase 3 Step 3.3 (validation). This section documents what is checked.

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

## 💬 INTERACTION GUIDELINES

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
