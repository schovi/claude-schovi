---
description: Deep analysis of bugs/features with codebase exploration, flow mapping, solution proposals, and structured output
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|description] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--quick]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Analyzer Workflow

You are performing a **comprehensive problem analysis** for a bug or feature request. Follow this structured workflow meticulously.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-3 (analysis and exploration). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

**Why Plan Mode**:
- Phases 1-3 require deep exploration and understanding WITHOUT making changes
- Plan mode ensures safe, read-only codebase research
- Analytical work (understanding flows, dependencies, proposing solutions) should happen in plan mode
- Only file output operations (Phase 4-5) require execution mode

**Workflow**:
```
┌──────────────────────────────────┐
│  PLAN MODE (Read-only)           │
│  Phases 1-3: Analysis            │
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
- **Text Description**: Free-form problem statement
- **Empty**: No problem specified

### Flags
Parse optional flags (can appear in any order):

- **`--input PATH`**: Read problem description from file
  - Example: `--input ~/docs/problem.md`
  - File should contain problem description or context
  - Overrides positional argument if both provided

- **`--output PATH`**: Save analysis to specific file path
  - Example: `--output ~/docs/analysis.md`
  - Overrides default filename

- **`--no-file`**: Skip file output, terminal only
  - Mutually exclusive with `--output`
  - Use when you only want to see analysis, not save it

- **`--quiet`**: Skip terminal output, file only
  - Still creates file (unless `--no-file`)
  - Use for automation or when you just want the artifact

- **`--post-to-jira`**: Post analysis as Jira comment
  - Requires Jira ID in problem input
  - Fails gracefully if no Jira ID
  - Posts after successful analysis generation

- **`--quick`**: Generate quick analysis instead of full
  - Minimal sections for simple problems
  - Faster, less comprehensive
  - Use for straightforward bugs or small features

### Flag Validation
- `--input` overrides positional argument if both provided → Use file content
- `--output` and `--no-file` cannot be used together → Error
- `--post-to-jira` without Jira ID → Warning, skip Jira posting
- Unknown flags → Warn user but continue

### Defaults
If no output flags specified:
- **Default behavior**: Terminal display + save to file
- **Default filename**:
  - With Jira ID: `analysis-[JIRA-ID].md` (e.g., `analysis-EC-1234.md`)
  - Without Jira ID: `analysis-[timestamp].md` (e.g., `analysis-2025-04-11-143022.md`)
- **Default mode**: Full analysis (unless `--quick` specified)

### Storage for Later Phases
Store parsed values for use in Phases 3-5:
```
input_path = [--input PATH] or [null]
problem_input = [extracted identifier or description or from file]
output_path = [--output PATH] or [default filename] or [null if --no-file]
terminal_output = true (unless --quiet)
jira_posting = [true if --post-to-jira]
quick_mode = [true if --quick]
```

---

## PHASE 1: INPUT PROCESSING & CLARIFICATION

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
- **Textual Description**: Free-form problem statement
- **Empty/Unclear**: Missing or ambiguous input

### Step 1.2: Smart Clarification Detection

**IMPORTANT**: Before proceeding with analysis, evaluate if the input is sufficient. Ask clarifying questions ONLY if ANY of these conditions are true:

1. **Ambiguous Scope**:
   - Problem mentions "login" but unclear which login flow (OAuth, username/password, SSO, etc.)
   - Feature request without clear success criteria
   - Bug without reproduction steps

2. **Missing Critical Context**:
   - No indication of affected system/component
   - Unclear user journey or entry point
   - Unknown environment (production, staging, specific version)

3. **Multiple Interpretations**:
   - Request could apply to multiple features/flows
   - Unclear priority or urgency
   - Ambiguous technical requirements

**If clarification is needed**, use the AskUserQuestion tool to ask focused questions:
- What is the affected component/feature?
- What is the expected behavior vs. actual behavior?
- Are there specific reproduction steps?
- Which environment is affected?
- Are there any related systems or dependencies to consider?

**If input is clear**, proceed directly to Step 1.3.

### Step 1.3: Fetch Detailed Information

**If Jira Issue ID Provided**:
```
IMPORTANT: Delegate to the jira-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Analyze-Problem]** Detected Jira issue: [ISSUE-KEY]
   ⏳ Fetching issue details via jira-analyzer...

2. Use the Task tool to invoke the jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

3. The subagent will:
   - Fetch the full Jira payload (~10k tokens) in its isolated context
   - Extract ONLY essential information
   - Return a clean summary (~800 tokens) with visual wrappers:

   ╭─────────────────────────────────────╮
   │ 🔍 JIRA ANALYZER                    │
   ╰─────────────────────────────────────╯

   [Structured summary content]

   ╭─────────────────────────────────────╮
     ✅ Summary complete | ~[X] tokens
   ╰─────────────────────────────────────╯

4. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "API error"):
   ```
   ❌ **[Analyze-Problem]** Failed to fetch Jira issue [ISSUE-KEY]

   Error: [Extract error message from subagent response]

   This usually means:
   - Issue key is incorrect or doesn't exist
   - You don't have access to this issue
   - Jira API is unavailable
   - MCP Jira server is not configured

   Options:
   1. Verify issue key and retry
   2. Provide problem description manually
   3. Cancel analysis

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Analyze-Problem]** Issue details fetched successfully

5. You will receive a structured summary containing:
   - Core information (key, title, type, status, priority)
   - Condensed description
   - Acceptance criteria
   - Key comments (max 3)
   - Related issues
   - Technical context

6. Use this summary as the primary source of truth for your analysis

NEVER fetch Jira directly using mcp__jira__* tools - always delegate to the subagent.
This prevents massive Jira payloads from polluting your context.
```

**If GitHub PR Provided**:
```
IMPORTANT: Delegate to the gh-pr-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Analyze-Problem]** Detected GitHub PR: [PR reference]
   ⏳ Fetching PR details via gh-pr-analyzer...

2. Use the Task tool to invoke the gh-pr-analyzer subagent:
   prompt: "Fetch and summarize GitHub PR [URL, owner/repo#123, or #123]"
   subagent_type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
   description: "Fetching GitHub PR summary"

3. The subagent will:
   - Fetch the full PR payload via gh CLI (~20-50k tokens) in its isolated context
   - Extract ONLY essential information
   - Return a clean summary (~800-1000 tokens) with visual wrappers:

   ╭─────────────────────────────────────╮
   │ 🔍 PR ANALYZER                      │
   ╰─────────────────────────────────────╯

   [Structured summary content]

   ╭─────────────────────────────────────╮
     ✅ Summary complete | ~[X] tokens
   ╰─────────────────────────────────────╯

4. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "authentication"):
   ```
   ❌ **[Analyze-Problem]** Failed to fetch GitHub PR [PR reference]

   Error: [Extract error message from subagent response]

   This usually means:
   - PR number/URL is incorrect
   - Repository doesn't exist or is private
   - gh CLI is not authenticated (run: gh auth login)
   - Network connectivity issues

   Options:
   1. Verify PR reference and retry
   2. Provide problem description manually
   3. Cancel analysis

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Analyze-Problem]** PR details fetched successfully

5. You will receive a structured summary containing:
   - Core information (PR number, title, state, author, base/head branches)
   - Condensed description (max 500 chars)
   - Top 5 changed files with stats
   - CI check status (failures only)
   - Key reviews (max 3, failures/blocks prioritized)
   - Important comments (max 5)

6. Use this summary to understand:
   - Why the PR is failing (CI checks, review feedback)
   - What changes were made (affected files and their impact)
   - What needs to be fixed based on failures
   - Test failures or build issues
   - Code quality concerns from reviews

NEVER fetch PR details directly using gh CLI - always delegate to the subagent.
This prevents massive PR payloads from polluting your context.
```

**If GitHub Issue Provided**:
```
IMPORTANT: Delegate to the gh-issue-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Analyze-Problem]** Detected GitHub issue: [ISSUE reference]
   ⏳ Fetching issue details via gh-issue-analyzer...

2. Use the Task tool to invoke the gh-issue-analyzer subagent:
   prompt: "Fetch and summarize GitHub issue [URL or owner/repo#123]"
   subagent_type: "schovi:gh-issue-analyzer:gh-issue-analyzer"
   description: "Fetching GitHub issue summary"

3. The subagent will:
   - Fetch the full issue payload via gh CLI (~5-15k tokens) in its isolated context
   - Extract ONLY essential information
   - Return a clean summary (~800 tokens) with visual wrappers:

   ╭─────────────────────────────────────╮
   │ 🐛 ISSUE ANALYZER                   │
   ╰─────────────────────────────────────╯

   [Structured summary content]

   ╭─────────────────────────────────────╮
     ✅ Summary complete | ~[X] tokens
   ╰─────────────────────────────────────╯

4. After receiving the summary, check for errors:

   **If subagent response contains error markers** (❌, "failed", "not found", "authentication"):
   ```
   ❌ **[Analyze-Problem]** Failed to fetch GitHub issue [ISSUE reference]

   Error: [Extract error message from subagent response]

   This usually means:
   - Issue number/URL is incorrect
   - Repository doesn't exist or is private
   - gh CLI is not authenticated (run: gh auth login)
   - Network connectivity issues

   Options:
   1. Verify issue reference and retry
   2. Provide problem description manually
   3. Cancel analysis

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 2 without valid input.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Analyze-Problem]** Issue details fetched successfully

5. You will receive a structured summary containing:
   - Core information (issue number, title, state, author)
   - Condensed description (max 500 chars)
   - Labels and assignees
   - Key comments (max 5, requirements prioritized)
   - Analysis notes (status, activity, type)

6. Use this summary to understand:
   - What problem needs to be solved (from issue description)
   - What requirements exist (from comments)
   - What type of work it is (bug, feature, etc. from labels)
   - Current status and activity level

NEVER fetch issue details directly using gh CLI - always delegate to the subagent.
This prevents massive issue payloads from polluting your context.
```

**If Textual Description Provided**:
```
1. Parse the problem statement carefully
2. Identify:
   - Expected behavior
   - Actual behavior (for bugs)
   - Desired outcome (for features)
   - Mentioned files, services, or components
   - User-facing vs. internal impact
3. Document assumptions made
```

**If No Input Provided**:
```
1. Ask user: "Please provide either:
   - A Jira issue ID (e.g., EC-1234)
   - A GitHub PR (URL, owner/repo#123, or #123)
   - A GitHub Issue (URL or owner/repo#123)
   - A problem description with context"
2. Wait for response and restart this phase
```

### Step 1.4: Handle Additional Context (Error Stacktraces, Logs, etc.)

**If user provides additional context** (error stacktraces, logs, screenshots, etc.):

```
IMPORTANT: Handle pasted content carefully to avoid tool errors.

1. Acknowledge additional context:
   📎 **[Analyze-Problem]** Additional context provided: [error stacktrace/logs/etc.]

2. Check if the content is directly accessible:
   - If user mentions "Pasted text #N" or similar references
   - This indicates Claude Code has stored pasted content
   - DO NOT try to access it via Bash commands
   - DO NOT use heredoc syntax to process it

3. If content is NOT directly accessible:
   Use AskUserQuestion tool:
   "I see you've referenced additional context (error stacktrace/logs), but I cannot
   access pasted text references directly. Could you please:
   - Copy-paste the full error stacktrace directly in your next message, OR
   - Save it to a file and provide the file path"

4. If content IS accessible (user pasted directly in message):
   - Extract the relevant information (stack trace, error messages, line numbers)
   - Document it for use in Phase 2 analysis
   - Identify:
     * Exception type and message
     * File paths and line numbers mentioned
     * Root cause indicators
     * Affected components

5. Store extracted context for Phase 2:
   - File paths from stack trace → Will guide codebase exploration
   - Exception types → Will guide error handling analysis
   - Line numbers → Will provide exact code locations to examine

DO NOT:
- Use Bash with heredoc to process pasted content
- Attempt to access "Pasted text #N" references directly
- Assume pasted content format without verification
```

---

## PHASE 2: DEEP CODEBASE ANALYSIS

**CRITICAL**: Use the **Task tool with Plan subagent type** for analytical exploration in plan mode. DO NOT use direct search tools unless for targeted follow-up queries.

**When spawning Plan subagent, acknowledge:**
```
🛠️ **[Analyze-Problem]** Starting deep codebase analysis...
⏳ Spawning Plan subagent for analytical exploration...
```

**Subagent Configuration:**
- **subagent_type**: "Plan"
- **description**: "Deep codebase analysis for problem understanding"
- **prompt**: [Detailed exploration requirements from Steps 2.1-2.5 below]

**Why Plan Subagent**: The Plan subagent operates in plan mode by design, providing analytical capabilities for understanding codebase structure, flows, and dependencies without making changes. This aligns with the command's plan mode enforcement for Phases 1-3.

**After receiving analysis results:**
```
✅ **[Analyze-Problem]** Codebase analysis complete
```

### Tool Selection Strategy: Prefer JetBrains MCP When Available

**IMPORTANT**: Before starting analysis, determine which tools to use:

```
JetBrains MCP tools (mcp__jetbrains__*) provide semantic understanding vs. text-based tools.

✅ PREFER JetBrains tools when available:
┌────────────────────────────────────────────────────────────────────┐
│ Instead of...              │ Use JetBrains MCP...                  │
├────────────────────────────────────────────────────────────────────┤
│ Grep (text search)         │ mcp__jetbrains__search_in_files_by_text│
│                            │ - Faster for large codebases          │
│                            │ - Respects project structure           │
│                            │ - Can filter by file mask             │
├────────────────────────────────────────────────────────────────────┤
│ Read multiple files        │ mcp__jetbrains__get_symbol_info       │
│ to understand classes      │ - Quick documentation lookup          │
│                            │ - Shows signatures, types             │
│                            │ - Includes usage context              │
├────────────────────────────────────────────────────────────────────┤
│ Manual issue detection     │ mcp__jetbrains__get_file_problems     │
│                            │ - IntelliJ inspections                │
│                            │ - Type errors, warnings               │
│                            │ - Suggests what to fix                │
├────────────────────────────────────────────────────────────────────┤
│ ls/tree commands           │ mcp__jetbrains__list_directory_tree   │
│                            │ - Respects .gitignore                 │
│                            │ - Shows project structure             │
│                            │ - Formatted tree view                 │
├────────────────────────────────────────────────────────────────────┤
│ Glob with manual filtering │ mcp__jetbrains__find_files_by_glob    │
│                            │ - Project-aware search                │
│                            │ - Excludes build artifacts            │
│                            │ - Fast indexed search                 │
└────────────────────────────────────────────────────────────────────┘

❌ FALLBACK to text tools (Grep, Read, Glob) when:
- JetBrains MCP not available in this project
- Need regex patterns (use mcp__jetbrains__search_in_files_by_regex)
- Simple one-off file reads

WORKFLOW:
1. For targeted queries (specific file/class): Use JetBrains tools directly
2. For broad exploration: Use Explore subagent (it will use best available tools)
3. Document which tool set you're using for transparency
```

### Step 2.1: Prepare Comprehensive Exploration Prompt

**Objective**: Create a detailed, structured prompt for the Plan subagent that incorporates ALL exploration requirements.

**Instructions**: Construct the following prompt to pass to the Plan subagent. Include the problem context from Phase 1 and all exploration requirements below.

**Prompt Template**:
```markdown
# Codebase Analysis Request

## Problem Context
[Insert problem summary from Phase 1: problem description, type (bug/feature), severity, affected area]

## Required Analysis

Your task is to perform comprehensive codebase analysis to understand this problem's scope, impact, and technical context. Provide structured findings with specific file:line references throughout.

### 1. User Flow Mapping

**Objective**: Trace the complete user journey through the system.

**Requirements**:
- Identify entry points (UI components, API endpoints, CLI commands, background jobs)
- Map user journey step-by-step: User Action → UI Component → Event Handler → API Call → Backend Service → Data Layer → Response → UI Update
- Document touchpoints: where user interacts, what triggers behavior, expected vs. actual flow paths, error handling points
- Note affected screens/interfaces with file:line references, route definitions, navigation flows

**Deliverable**: Complete user flow diagram with file:line references

### 2. Data Flow Analysis

**Objective**: Map how data moves and transforms through the system.

**Requirements**:
- Identify data sources (database tables/collections, external APIs, file systems, cache layers like Redis/Memcached, message queues like Kafka/RabbitMQ)
- Trace data transformations: Input → Validation → Business Logic → Storage → Retrieval → Formatting → Output
- Document data structures (database schemas, API request/response models, internal DTOs, state management structures)
- Identify data integrity points (validation, transaction boundaries, consistency mechanisms, rollback/compensation logic)

**Deliverable**: Data flow diagram showing sources, transformations, and destinations with specific code locations

### 3. Dependency Discovery

**Objective**: Map all dependencies that could be affected or impact the solution.

**Requirements**:

**A. Direct Dependencies**:
- Imported modules and packages
- Called functions and methods
- Database tables and indexes
- External API endpoints
- Configuration files
- Environment variables

**B. Indirect Dependencies**:
- Shared state and singletons
- Event emitters/listeners
- Kafka topics (producers/consumers)
- Background jobs and schedulers
- Cache invalidation triggers
- Feature flags
- A/B test configurations

**C. Integration Points**:
- Microservices communication (sync/async)
- Third-party integrations (payment, auth, analytics)
- Webhooks (incoming/outgoing)
- CDN and asset pipelines
- Monitoring and logging systems

**Deliverable**: Complete dependency graph with categorization and impact assessment

### 4. Code Quality Assessment

**Objective**: Evaluate technical health of affected areas.

**Requirements**:
- Identify technical debt (TODO/FIXME comments, code duplication, complex/nested logic, missing error handling)
- Assess test coverage (unit test presence, integration test gaps, E2E test scenarios, mock/stub quality)
- Note code smells (long functions/files, deep nesting, magic numbers/strings, tight coupling, god objects/classes)
- Review recent changes (recent commits in affected areas, outstanding PRs, known issues/bugs)

**Deliverable**: Code quality report with specific file:line references to issues

### 5. Historical Context

**Objective**: Understand evolution and patterns.

**Requirements**:
- Review git history (recent changes to affected files, previous bug fixes in same area, related feature implementations, authors/teams involved)
- Check for patterns (recurring issues, failed attempts at similar changes, deprecated approaches, migration history)
- Identify stakeholders (code owners, frequent contributors, domain experts)

**Deliverable**: Historical context summary with relevant commits and patterns

## Output Format

Please structure your findings in these sections:

1. **Affected Components**: List of components with file:line references and their roles
2. **User Flow**: Step-by-step flow showing problem occurrence
3. **Data Flow**: Data movement through system
4. **Dependencies**: Direct, indirect, and integration dependencies
5. **Code Quality Issues**: Technical debt, test gaps, code smells with file:line refs
6. **Historical Context**: Recent changes, patterns, stakeholders
7. **Issues Identified**: For each issue found, provide: Problem → Evidence → Root cause (with file:line refs)

## Important Notes
- Use specific file:line references throughout (e.g., `src/services/UserService.ts:123`)
- Focus on actionable findings that inform solution design
- Prioritize information relevant to solving the problem
- If you use JetBrains MCP tools, note which ones and why
```

**After preparing the prompt**: Store it for use in Step 2.2.

### Step 2.2: Invoke Plan Subagent

**Objective**: Delegate the comprehensive exploration to the Plan subagent in an isolated context.

**Instructions**:

1. **Acknowledge subagent invocation**:
   ```
   🛠️ **[Analyze-Problem]** Starting deep codebase analysis...
   ⏳ Spawning Plan subagent for analytical exploration...
   ```

2. **Use Task tool**:
   ```
   subagent_type: "Plan"
   description: "Deep codebase analysis for problem understanding"
   prompt: [The comprehensive prompt prepared in Step 2.1]
   ```

3. **Wait for subagent completion**: The Plan subagent will work in its isolated context and return structured findings.

4. **Acknowledge completion**:
   ```
   ✅ **[Analyze-Problem]** Codebase analysis complete
   ```

**Important**: Do NOT execute the exploration instructions directly. The Plan subagent will handle all codebase exploration using its plan mode capabilities.

### Step 2.3: Capture and Structure Exploration Results

**Objective**: Extract and organize the Plan subagent's findings for use in Phase 3 (Analysis Generation).

**Instructions**:

1. **Extract key findings from subagent response**:
   - affected_components = [List of components with file:line references and roles]
   - user_flow = [Step-by-step user journey with file:line references]
   - data_flow = [Data movement and transformations with file:line references]
   - dependencies = [Categorized dependency graph: direct, indirect, integration]
   - code_quality_issues = [Technical debt, test gaps, code smells with file:line refs]
   - historical_context = [Recent changes, patterns, stakeholders]
   - issues_identified = [Problems found with evidence and root causes, with file:line refs]
   - code_locations = [Comprehensive list of all file:line references discovered]

2. **Validate exploration completeness**:

   Check that the subagent provided sufficient detail:
   - [ ] At least 3 affected components identified with specific file:line references
   - [ ] User flow traced from entry point to problem occurrence
   - [ ] Data flow mapped through at least 3 transformation points
   - [ ] Dependencies catalogued (direct, indirect, or integration)
   - [ ] At least 2 code quality issues or technical observations noted
   - [ ] Root causes identified with supporting evidence

3. **If validation fails**:
   ```
   ⚠️ **[Analyze-Problem]** Exploration incomplete

   The Plan subagent's analysis is missing:
   - [List missing requirements]

   This usually means:
   - Problem description was too vague (add more context)
   - Codebase doesn't have clear entry points (manual investigation needed)
   - Problem area is unfamiliar (consider broader search)

   Options:
   1. Re-run exploration with more specific guidance
   2. Supplement with targeted manual searches
   3. Proceed with available information (note gaps in analysis)
   ```

   Ask user how to proceed. Do NOT continue to Phase 3 with incomplete data.

4. **If validation passes**:
   ```
   ✅ **[Analyze-Problem]** Exploration findings validated and structured for analysis generation
   ```

   Store the structured findings for Phase 3 input.

**Next**: Proceed to Phase 3 with the captured exploration results.

---

## PHASE 3: ANALYSIS GENERATION

**CRITICAL**: Use the **Task tool with analysis-generator subagent** for context-isolated analysis generation.

This phase transforms Phase 2 exploration results into structured, polished analysis document without polluting main context.

### Step 3.1: Prepare Subagent Input Context

**Objective**: Construct the input package for analysis-generator subagent using outputs from Phase 2 Step 2.3.

1. Acknowledge analysis generation:
   ```
   ⚙️ **[Analyze-Problem]** Generating structured analysis...
   ⏳ Spawning analysis-generator subagent...
   ```

2. Prepare input package for subagent using captured exploration results:

**Instructions**: Use the structured outputs from Phase 2 Step 2.3 to populate this template.

```markdown
## Input Context

### Problem Context
[From Phase 1: Jira/PR/Issue summary OR text description]
- Source: [Jira ID, PR URL, Issue URL, or "User description"]
- Title: [Brief problem title]
- Type: [bug|feature|investigation|performance|refactor]
- Severity: [critical|high|medium|low]
- Description: [Condensed problem description]

### Exploration Results

#### Affected Components
[Use `affected_components` from Phase 2 Step 2.3]
[List of components with file:line references and their roles]

Example format:
- **ComponentName** (`path/to/file.ts:123`) - Current behavior and role
- **AnotherComponent** (`path/to/another.ts:456`) - Current behavior and role

#### User Flow
[Use `user_flow` from Phase 2 Step 2.3]
[Step-by-step user journey with file:line references]

Example format:
```
User Action: What user does
  ↓
Entry Point (file:line) - What happens
  ↓
Processing (file:line) - What happens
  ↓
Problem Occurs (file:line) - Where/why it breaks
```

#### Data Flow
[Use `data_flow` from Phase 2 Step 2.3]
[Data movement and transformations with file:line references]

Example format:
```
Data Source
  ↓
Validation (file:line) - Current validation
  ↓
Transformation (file:line) - Current transformation
  ↓
Problem Point (file:line) - Where issue occurs
```

#### Dependencies
[Use `dependencies` from Phase 2 Step 2.3]
[Include if complex - direct, indirect, integration dependencies]

Example format:
- **Direct**: [modules, functions, DB tables]
- **Indirect**: [shared state, events, background jobs]
- **Integration**: [external services, webhooks]

#### Code Quality Issues
[Use `code_quality_issues` from Phase 2 Step 2.3]
[Technical debt, test gaps, code smells with file:line refs]

Example format:
- Technical Debt: [TODO comments, duplication] at file:line
- Test Coverage: [Missing unit tests, integration test gaps]
- Code Smells: [Long functions, tight coupling] at file:line

#### Historical Context
[Use `historical_context` from Phase 2 Step 2.3]
[Recent changes, patterns, stakeholders]

Example format:
- Recent Changes: [Commits affecting this area]
- Patterns: [Recurring issues, previous attempts]
- Stakeholders: [Code owners, domain experts]

#### Issues Identified
[Use `issues_identified` from Phase 2 Step 2.3]
[Problems found with evidence and root causes, with file:line references]

Example format:
1. **Issue Name** (`file:line`):
   - Problem: [Specific technical issue]
   - Evidence: [What shows this is a problem]
   - Root cause: [Why this is happening]

### Code Locations
[Use `code_locations` from Phase 2 Step 2.3]
[Comprehensive list of all file:line references discovered during exploration]

### Template Type
[full|quick based on --quick flag from argument parsing]

### Metadata
- Jira ID: [From Phase 1 or N/A]
- PR URL: [From Phase 1 or N/A]
- Issue URL: [From Phase 1 or N/A]
- Created by: [User email if available or N/A]
- Created date: [Current date YYYY-MM-DD]
- Problem type: [Inferred from Phase 1]
- Severity: [Assessed from Phase 1 or exploration]
```

3. Determine template type:
   - **Full Analysis**: Use unless `--quick` flag was specified
   - **Quick Analysis**: Use if `--quick` flag present

**Important**: All bracketed placeholders should be replaced with actual data from Phase 2 Step 2.3 captured variables. If any variable is empty or incomplete, note the gap in the input context so the analysis-generator can work with available information.

### Step 3.2: Spawn Analysis-Generator Subagent

Use Task tool with the prepared context:

```
subagent_type: "schovi:analysis-generator:analysis-generator"
description: "Generating problem analysis"
prompt: "Generate structured problem analysis from exploration results.

[PASTE THE FULL INPUT CONTEXT FROM STEP 3.1 HERE]"
```

**The subagent will**:
- Process exploration results in isolated context
- Extract essential findings
- Generate 2-3 solution proposals (full mode) or single solution (quick mode)
- Return clean, structured analysis (~2-3k tokens) with visual wrappers:

```
╭─────────────────────────────────────────────╮
│ 🔍 ANALYSIS GENERATOR                       │
╰─────────────────────────────────────────────╯

[YAML frontmatter + all analysis sections]

╭─────────────────────────────────────────────╮
  ✅ Analysis generated | ~[X] tokens | [Y] lines
╰─────────────────────────────────────────────╯
```

### Step 3.3: Receive and Store Analysis

1. After receiving subagent output, check for errors:

   **If subagent response contains error markers** (❌, "failed", "incomplete", "Generation failed"):
   ```
   ❌ **[Analyze-Problem]** Analysis generation failed

   Error: [Extract error message from subagent response]

   This usually means:
   - Exploration results were incomplete or malformed
   - Analysis template could not be populated
   - Token budget exceeded

   Options:
   1. Review Phase 2 exploration results and re-run if incomplete
   2. Simplify the problem scope and retry
   3. Use --quick flag for simpler analysis
   4. Cancel and review input data quality

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed to Phase 3.5 (Exit Plan Mode) without valid analysis.

   **If subagent response is successful** (✅ marker present):
   ✅ **[Analyze-Problem]** Analysis generated successfully

2. Extract the analysis markdown from subagent response:
   - Remove the visual header/footer wrappers (╭─────╮ boxes)
   - Store the clean markdown (YAML frontmatter + content)

3. Store analysis for Phase 4:
   ```
   analysis_markdown = [extracted content without wrappers]
   ```

4. Validate analysis completeness:
   - [ ] YAML frontmatter present
   - [ ] Problem summary section exists
   - [ ] Current state analysis section exists
   - [ ] Solution proposals exist (2+ for full, 1 for quick)
   - [ ] Implementation guidance exists
   - [ ] Resources & references exist

   **If validation fails**:
   ```
   ⚠️ **[Analyze-Problem]** Analysis validation failed

   Missing sections:
   - [List which checklist items failed]

   The analysis-generator returned incomplete output. This suggests:
   - Input context was insufficient
   - Template type mismatch (full vs quick)
   - Subagent encountered internal error

   Options:
   1. Retry analysis generation with corrected inputs
   2. Proceed with incomplete analysis (not recommended)
   3. Cancel and review exploration quality

   How would you like to proceed?
   ```

   **HALT**: Wait for user response. Do NOT proceed without complete analysis.

---

## PHASE 3.5: EXIT PLAN MODE

**CRITICAL**: You have completed all analysis work (Phases 1-3) in plan mode. Before proceeding to output handling (Phase 4-5), you MUST exit plan mode.

### Step 3.5.1: Use ExitPlanMode Tool

**Acknowledge transition:**
```
⚙️ **[Analyze-Problem]** Analysis complete. Transitioning from plan mode to execution mode...
```

**Use the ExitPlanMode tool:**
```
plan: |
  ## Analysis Summary

  **Problem**: [One-line problem summary from Phase 1]

  **Analysis Type**: [Full/Quick based on --quick flag]

  **Key Findings**:
  - [Key finding 1 from exploration]
  - [Key finding 2 from exploration]
  - [Key finding 3 from exploration]

  **Solution Options**: [Number of options from Phase 3]

  **Recommended**: [Recommended option name from Phase 3]

  **Next Steps**:
  1. Save analysis to file (if not --no-file)
  2. Display to terminal (if not --quiet)
  3. Post to Jira (if --post-to-jira)
  4. Present completion summary
```

**After exiting plan mode:**
```
✅ **[Analyze-Problem]** Entered execution mode. Proceeding with output handling...
```

**Important**: After using ExitPlanMode, you are now in execution mode and can use Write tool, Bash for file operations, and mcp__jira__* tools for posting.

---

## PHASE 4: OUTPUT HANDLING

Handle analysis output based on flags from Argument Parsing:

### Step 4.1: Terminal Output

**If `terminal_output == true`** (default, unless `--quiet`):

1. Display analysis to terminal:
   ```
   [Display the full analysis_markdown with proper formatting]
   ```

2. Use visual separator before/after for clarity

**If `--quiet` flag present**:
- Skip terminal display entirely

### Step 4.2: File Output

**If `output_path != null`** (default, unless `--no-file`):

1. Determine filename:
   - If `--output PATH` specified: Use provided path
   - Else if Jira ID present: `./analysis-[JIRA-ID].md` (current directory)
   - Else: `./analysis-[YYYY-MM-DD-HHMMSS].md` (current directory)

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
       echo "⚠️ **[Analyze-Problem]** Cannot create directory: $output_dir"
       echo ""
       echo "Options:"
       echo "1. Use current directory instead: ./$(basename "$output_path")"
       echo "2. Specify different output path"
       echo "3. Skip file output (continue with terminal display only)"
       echo ""
       echo "How would you like to proceed?"

       # Wait for user decision and adjust output_path accordingly
       # If user chooses option 1: output_path="./$(basename "$output_path")"
       # If user chooses option 3: Skip to terminal display only
     fi
   fi
   ```

   **Final path**: `output_path` (now absolute and parent directory exists)

3. Write analysis to file:
   ```
   Use Write tool:
   file_path: [output_path - absolute path]
   content: [analysis_markdown]
   ```

   **Handle write errors**:
   If Write tool fails (permissions, disk full, etc.):
   ```
   ⚠️ **[Analyze-Problem]** Failed to write file: [output_path]

   Error: [error message from Write tool]

   The analysis is still available in terminal output above.

   Options:
   1. Try different output path
   2. Continue without file (analysis shown in terminal)

   How would you like to proceed?
   ```

4. Acknowledge file creation:
   ```
   📄 **[Analyze-Problem]** Analysis saved to: [output_path]
   ```

**If `--no-file` flag present**:
- Skip file creation entirely

### Step 4.3: Jira Posting (Optional)

**If `jira_posting == true`** (from `--post-to-jira` flag):

1. Check if Jira ID exists:
   - If NO Jira ID: Warn user and skip this step
     ```
     ⚠️ **[Analyze-Problem]** Cannot post to Jira: No Jira ID provided
     ```
   - If Jira ID exists: Proceed

2. Format analysis for Jira:
   - Wrap in code block for better formatting: \`\`\`markdown ... \`\`\`
   - Add header: "Problem Analysis - Generated by Claude Code"

3. Post to Jira using mcp__jira__addCommentToJiraIssue:
   ```
   cloudId: "productboard.atlassian.net"
   issueIdOrKey: [Jira ID from Phase 1]
   commentBody: [formatted analysis]
   ```

4. Acknowledge posting:
   ```
   ✅ **[Analyze-Problem]** Analysis posted to Jira: [JIRA-ID]
   ```

5. If posting fails:
   ```
   ⚠️ **[Analyze-Problem]** Failed to post to Jira: [error message]
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
│ ✅ ANALYSIS COMPLETE                        │
╰─────────────────────────────────────────────╯

**Problem**: [One-line summary]

**Analysis Type**: [Full|Quick]

**Output**:
[If file created] - 📄 Saved to: [filename]
[If posted to Jira] - 📋 Posted to Jira: [JIRA-ID]
[If terminal only] - 🖥️  Terminal display only

**Solution Options**: [Number of options provided]
**Recommended**: [Recommended option name]
```

### Step 5.2: Proactive Next Steps

Based on analysis output, suggest next actions:

```
**Suggested Next Steps**:

1. 📋 **Create Specification**: Use `/schovi:plan [analysis-file]` to generate implementation spec
2. 💬 **Discuss Approach**: Review solution options and select preferred approach
3. 🔍 **Deep Dive**: Explore specific technical aspects in more detail
4. 🎯 **Assign Task**: Update Jira issue with analysis and assign to developer

**Quick Actions**:
[If Jira ID exists] - Update Jira status to "In Progress"?
[If analysis saved] - Create spec now using saved analysis?
```

### Step 5.3: User Interaction

Ask user for direction (use conversational tone):

```
What would you like to do next?
- Create implementation spec from this analysis?
- Discuss solution options in more detail?
- Explore a specific technical aspect further?
- Something else?
```

Wait for user response and proceed accordingly.

---

## ✅ QUALITY GATES CHECKLIST

Before moving to Phase 4, verify analysis from subagent contains:

- [ ] YAML frontmatter with all required fields
- [ ] Problem summary with core issue, impact, severity
- [ ] Current state analysis with affected components
- [ ] Flow analysis with file:line references
- [ ] Issues identified with root causes
- [ ] Solution proposals (2+ for full, 1 for quick)
- [ ] Each solution has approach, changes, pros/cons, effort, risk
- [ ] Implementation guidance with recommended approach
- [ ] Testing requirements listed
- [ ] Resources & references with code locations
- [ ] All file references use file:line format
- [ ] Recommended solution marked with ⭐ (full mode)
- [ ] Token count under 4000 (from subagent footer)

---

## 💬 INTERACTION GUIDELINES

**Communication Style**:
- Be clear about what's happening at each phase
- Use visual formatting for phase transitions
- Acknowledge long-running operations (spawning subagents)
- Celebrate completion with clear summary

**Handling Errors**:
- If subagent fails: Report error clearly, don't attempt to continue
- If file write fails: Report error, analysis still in terminal
- If Jira posting fails: Warn but continue (non-critical)

**Context Management**:
- Phase 1-2: Accumulate context (exploration)
- Phase 3: Delegate to subagent (context isolation)
- Phase 4-5: Handle output (clean main context)

**Token Efficiency**:
- Subagent processes verbose exploration (~3-5k tokens)
- Returns clean analysis (~2-3k tokens)
- Main context stays clean for next task

---

## 🚀 BEGIN ANALYSIS

Start with Argument Parsing, then proceed to Phase 1: Input Processing & Clarification.
