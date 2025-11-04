---
description: Deep analysis of bugs/features with codebase exploration, flow mapping, solution proposals, and structured output
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|description] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--quick]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Analyzer Workflow

You are performing a **comprehensive problem analysis** for a bug or feature request. Follow this structured workflow meticulously.

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

### Output Flags
Parse optional flags (can appear in any order):

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
problem_input = [extracted identifier or description]
output_path = [--output PATH] or [default filename] or [null if --no-file]
terminal_output = true (unless --quiet)
jira_posting = [true if --post-to-jira]
quick_mode = [true if --quick]
```

---

## PHASE 1: INPUT PROCESSING & CLARIFICATION

**Problem Input**: [From argument parsing above]

### Step 1.1: Parse Input

Determine input type:
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

4. After receiving the summary, acknowledge:
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

4. After receiving the summary, acknowledge:
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

4. After receiving the summary, acknowledge:
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

**CRITICAL**: Use the **Task tool with Plan subagent type** for thorough exploration. DO NOT use direct search tools unless for targeted follow-up queries.

**When spawning Plan subagent, acknowledge:**
```
🛠️ **[Analyze-Problem]** Starting deep codebase analysis...
⏳ Spawning Plan subagent for exploration...
```

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

### Step 2.1: User Flow Mapping

**Objective**: Trace the complete user journey through the system.

**Execute**:
```
1. Identify entry points:
   - UI components (React, Vue, Angular components)
   - API endpoints (REST, GraphQL)
   - CLI commands
   - Background jobs/workers

2. Map user journey step-by-step:
   User Action → UI Component → Event Handler → API Call → Backend Service → Data Layer → Response → UI Update

3. Document touchpoints:
   - Where user interacts with the system
   - What triggers the behavior
   - Expected vs. actual flow paths
   - Error handling points

4. Note affected screens/interfaces:
   - Component file paths with line numbers
   - Route definitions
   - Navigation flows
```

**Deliverable**: Complete user flow diagram with file:line references.

### Step 2.2: Data Flow Analysis

**Objective**: Map how data moves and transforms through the system.

**Execute**:
```
1. Identify data sources:
   - Database tables/collections
   - External APIs
   - File systems
   - Cache layers (Redis, Memcached)
   - Message queues (Kafka, RabbitMQ)

2. Trace data transformations:
   Input → Validation → Business Logic → Storage → Retrieval → Formatting → Output

3. Document data structures:
   - Database schemas
   - API request/response models
   - Internal data transfer objects
   - State management structures

4. Identify data integrity points:
   - Where validation occurs
   - Transaction boundaries
   - Data consistency mechanisms
   - Rollback/compensation logic
```

**Deliverable**: Data flow diagram showing sources, transformations, and destinations with specific code locations.

### Step 2.3: Dependency Discovery

**Objective**: Map all dependencies that could be affected or impact the solution.

**A. Direct Dependencies**:
```
- Imported modules and packages
- Called functions and methods
- Database tables and indexes
- External API endpoints
- Configuration files
- Environment variables
```

**B. Indirect Dependencies**:
```
- Shared state and singletons
- Event emitters/listeners
- Kafka topics (producers/consumers)
- Background jobs and schedulers
- Cache invalidation triggers
- Feature flags
- A/B test configurations
```

**C. Integration Points**:
```
- Microservices communication (sync/async)
- Third-party integrations (payment, auth, analytics)
- Webhooks (incoming/outgoing)
- CDN and asset pipelines
- Monitoring and logging systems
```

**Deliverable**: Complete dependency graph with categorization and impact assessment.

### Step 2.4: Code Quality Assessment

**Objective**: Evaluate technical health of affected areas.

**Execute**:
```
1. Identify technical debt:
   - TODO/FIXME comments
   - Code duplication
   - Complex/nested logic
   - Missing error handling

2. Assess test coverage:
   - Unit test presence
   - Integration test gaps
   - E2E test scenarios
   - Mock/stub quality

3. Note code smells:
   - Long functions/files
   - Deep nesting
   - Magic numbers/strings
   - Tight coupling
   - God objects/classes

4. Review recent changes:
   - Recent commits in affected areas
   - Outstanding PRs
   - Known issues/bugs
```

**Deliverable**: Code quality report with specific file:line references to issues.

### Step 2.5: Historical Context

**Objective**: Understand evolution and patterns.

**Execute**:
```
1. Review git history:
   - Recent changes to affected files
   - Previous bug fixes in same area
   - Related feature implementations
   - Authors/teams involved

2. Check for patterns:
   - Recurring issues
   - Failed attempts at similar changes
   - Deprecated approaches
   - Migration history

3. Identify stakeholders:
   - Code owners
   - Frequent contributors
   - Domain experts
```

**Deliverable**: Historical context summary with relevant commits and patterns.

---

## PHASE 3: ANALYSIS GENERATION

**CRITICAL**: Use the **Task tool with analysis-generator subagent** for context-isolated analysis generation.

This phase transforms Phase 2 exploration results into structured, polished analysis document without polluting main context.

### Step 3.1: Prepare Subagent Input Context

1. Acknowledge analysis generation:
   ```
   ⚙️ **[Analyze-Problem]** Generating structured analysis...
   ⏳ Spawning analysis-generator subagent...
   ```

2. Prepare input package for subagent:

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
[From Phase 2.1: List of components with file:line references and their roles]

#### User Flow
[From Phase 2.1: Step-by-step user journey with file:line references]

#### Data Flow
[From Phase 2.2: Data movement and transformations with file:line references]

#### Dependencies
[From Phase 2.3: Only if complex - direct, indirect, integration dependencies]

#### Issues Identified
[From Phase 2: Problems found with evidence and root causes, with file:line references]

### Code Locations
[All file:line references discovered during exploration]

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

1. After receiving subagent output, acknowledge:
   ```
   ✅ **[Analyze-Problem]** Analysis generated successfully
   ```

2. Extract the analysis markdown from subagent response:
   - Remove the visual header/footer wrappers
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

If validation fails, report error and halt.

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
   - Else if Jira ID present: `analysis-[JIRA-ID].md`
   - Else: `analysis-[YYYY-MM-DD-HHMMSS].md`

2. Write analysis to file:
   ```
   Use Write tool:
   file_path: [determined filename]
   content: [analysis_markdown]
   ```

3. Acknowledge file creation:
   ```
   📄 **[Analyze-Problem]** Analysis saved to: [filename]
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

1. 📋 **Create Specification**: Use `/schovi:create-spec [analysis-file]` to generate implementation spec
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
