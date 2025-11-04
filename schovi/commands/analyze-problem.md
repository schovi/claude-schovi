---
description: Deep analysis of bugs/features with codebase exploration, flow mapping, and solution proposals
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|description]
allowed-tools: ["Read", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Analyzer Workflow

You are performing a **comprehensive problem analysis** for a bug or feature request. Follow this structured workflow meticulously.

---

## PHASE 1: INPUT PROCESSING & CLARIFICATION

**Input Received**: $ARGUMENTS

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

## PHASE 3: STRUCTURED OUTPUT

Present your findings in this exact format:

---

### 🎯 1. PROBLEM SUMMARY

```
[2-4 sentence executive summary]

**Core Issue**: [What is broken or needed - one clear sentence]

**Impact**:
- Users affected: [Who experiences this]
- Systems affected: [Which components/services]
- Severity: [Critical/High/Medium/Low - with justification]

**Urgency**: [Immediate/High/Medium/Low - based on Jira priority or assessment]
```

---

### 📊 2. CURRENT STATE ANALYSIS

#### Affected Components

List each component with its role and issue:

- **`path/to/component.ts:123`** - [Component name]
  - Role: [What it does]
  - Issue: [What's wrong or missing]

- **`path/to/service.ts:456`** - [Service name]
  - Role: [What it does]
  - Issue: [What needs to change]

*(Repeat for all affected components)*

#### Flow Analysis

Trace the complete user journey and data transformations through the system:

```
1. User Action: [What user does]
   ↓
2. Entry Point: Component A (`path/to/componentA.ts:123`)
   → Data: [Input format/structure]
   ↓
3. Validation: [`path/to/validator.ts:456`]
   → Checks: [What is validated]
   ↓
4. Processing: Service B (`path/to/serviceB.ts:789`)
   → Transform: [How data changes]
   ↓
5. Persistence: Database/API (`path/to/repository.ts:234`)
   → Storage: [What is stored/retrieved]
   ↓
6. Response: Format & Return (`path/to/controller.ts:567`)
   → Output: [Response format]
   ↓
7. UI Update: Component C (`path/to/componentC.ts:890`)
   → Display: [How user sees result]
```

**Key Touchpoints**:
- Entry: [Where request enters system]
- Transformation: [Critical data changes]
- Integration: [External systems called]
- Error handling: [Where errors are caught]

#### Dependencies & External Integrations

**IMPORTANT**: Only include this section if the solution involves critical external dependencies. Skip for simple internal changes.

**Include when**:
- Feature flags (LaunchDarkly) control behavior
- Multiple repositories must be coordinated
- External services/APIs are called
- Kafka topics or async messaging involved
- Non-standard deployment dependencies

**External Dependencies** (if applicable):
- Feature Flag: `flag-name` - [Checked in: `file:line`]
- Repository: `other-repo-name` - [How it's affected]
- External API: Service Name - [Called from: `file:line`]
- Kafka Topic: `topic-name` - [Producer: `file:line`, Consumer: `file:line`]
- Third-party: Service Name - [Integration: `file:line`]

**Internal Dependencies** (only if complex):
- Background Job: `JobName` - [Scheduler: `file:line`, Worker: `file:line`]
- Cache Layer: Redis key pattern `pattern:*` - [Used in: `file:line`]

#### Issues Identified

1. **Root Cause**: [Primary issue with explanation]
   - Location: `path/to/file.ts:123`
   - Impact: [What breaks or degrades]
   - Evidence: [Git commit, error logs, test failures]

2. **Secondary Issues**: [Related problems discovered]
   - Location: `path/to/file.ts:456`
   - Impact: [Potential side effects]

3. **Technical Debt**: [Existing problems that complicate solution]
   - Location: `path/to/file.ts:789`
   - Risk: [How it affects implementation]

---

### 💡 3. SOLUTION PROPOSALS

Present at least **2-3 solution options** with comprehensive analysis:

---

#### ✅ Option 1: [Solution Name]
*[Add ⭐ RECOMMENDED if this is the best option]*

**Approach**:
[2-3 sentence high-level strategy explaining the solution]

**Key Changes**:
- **`path/to/file1.ts:123`**: [Concise description of modification and why]
- **`path/to/file2.ts:456`**: [Concise description of modification and why]
- **`path/to/file3.ts:789`**: [Concise description of modification and why]

*(3-5 key changes maximum - detailed implementation will be in spec)*

**Pros**:
- ✅ [Advantage 1 with specific benefit]
- ✅ [Advantage 2 with specific benefit]
- ✅ [Advantage 3 with specific benefit]

**Cons**:
- ⚠️ [Trade-off 1 with impact assessment]
- ⚠️ [Trade-off 2 with impact assessment]

**Effort Estimate**: [Small/Medium/Large]
- Development: [Time estimate or story points]
- Testing: [Testing effort]
- Deployment: [Rollout complexity]

**Risk Level**: [Low/Medium/High]
- Technical risk: [What could go wrong]
- Business risk: [Impact if it fails]
- Mitigation: [How to reduce risk]

---

#### Option 2: [Alternative Solution Name]

*[Same structure as Option 1]*

---

#### Option 3: [Another Alternative]

*[Same structure as Option 1 - only if there's a genuinely different approach]*

---

### 🛠️ 4. IMPLEMENTATION GUIDANCE

#### Recommended Approach

**Selected Option**: Option [1/2/3] - [Solution Name]

**Rationale**:
[2-3 sentences explaining why this option is best, considering effort, risk, impact, and alignment with system architecture]

**Implementation Strategy**:
[High-level approach - phased rollout, big bang, incremental, etc.]

**Key Considerations**:
- [Critical consideration 1]
- [Critical consideration 2]
- [Critical consideration 3]

*Detailed step-by-step implementation will be in the spec (use `/schovi:create-spec`)*

#### Tests to Update/Create

List test files that need modification or creation to verify changes:

**Unit Tests** (modified/new):
- `path/to/fileA.spec.ts` - [Brief: what needs testing in this file]
- `path/to/fileB.spec.ts` - [Brief: what needs testing in this file]
- `path/to/fileC.spec.ts` - [Brief: what needs testing in this file]

**Integration Tests** (modified/new):
- `path/to/integration.spec.ts` - [Brief: what scenario to cover]
- `path/to/api-integration.spec.ts` - [Brief: what scenario to cover]

**E2E Tests** (if applicable):
- `path/to/e2e.spec.ts` - [Brief: what user journey to cover]

*Note: Focus on code tests only. Manual verification will be done during PR review.*

#### Deployment & Rollout

**IMPORTANT**: Only include this section if deployment is non-standard. Skip for simple changes with standard deployment.

**Include when**:
- Feature flag (LaunchDarkly) required for gradual rollout
- Multiple repositories must be deployed in specific order
- Database migrations or breaking changes involved
- Coordination with other teams required
- Complex monitoring or rollback procedures

**Standard Deployment**: If none of the above apply, state:
"Standard deployment process applies. No special rollout coordination needed."

---

**Feature Flag** (if applicable):
- Flag name: `feature-xyz-enabled`
- Location: `path/to/feature-flags.ts`
- Strategy: [Gradual rollout / Canary / A/B test / Kill switch]

**Deployment Sequence** (if multi-repo or dependencies):
1. [Repository/service 1] - [What to deploy first]
2. [Repository/service 2] - [What to deploy second]
3. [Repository/service 3] - [What to deploy last]

**Critical Monitoring** (only if specific metrics required):
- [Metric 1]: [What could go wrong]
- [Metric 2]: [What could go wrong]

**Rollback Procedure** (only if non-trivial):
- Trigger: [When to rollback]
- Steps: [How to revert]

---

### 📚 5. RESOURCES & REFERENCES

#### Code Locations

**Entry Points**:
- Main: `path/to/main-entry.ts:123`
- API: `path/to/api-controller.ts:456`
- UI: `path/to/ui-component.tsx:789`

**Core Logic**:
- Service: `path/to/core-service.ts:234`
- Repository: `path/to/data-repository.ts:567`
- Utils: `path/to/utility-functions.ts:890`

**Tests**:
- Unit: `path/to/unit.spec.ts`
- Integration: `path/to/integration.spec.ts`
- E2E: `path/to/e2e.spec.ts`

**Configuration**:
- Feature Flags: `path/to/feature-flags.ts`
- Environment: `path/to/config.ts`
- Database: `path/to/schema.sql`

#### Related Issues

**Jira**:
- Blocker: [PROJ-123] - [Brief description]
- Related: [PROJ-456] - [Brief description]
- Duplicate: [PROJ-789] - [Brief description]

**Previous Work**:
- PR #123 - [Brief description] - [Link]
- Commit abc1234 - [Brief description]
- Issue #456 - [Brief description]

#### Documentation

**Internal Docs**:
- [Architecture overview] - [Link or path]
- [API documentation] - [Link or path]
- [Runbook] - [Link or path]

**External References**:
- [Library documentation] - [Link]
- [Third-party API docs] - [Link]
- [Relevant blog posts/articles] - [Link]

#### Stakeholders

**Ownership**:
- Team: [Team name]
- Tech Lead: [Name]
- Product Owner: [Name]

**Review Required**:
- Code review: [Reviewer name/role]
- Architecture review: [If needed, who]
- Security review: [If needed, who]

**Dependencies on Other Teams**:
- [Team name] - [What they need to provide/approve]
- [Team name] - [What they need to provide/approve]

---

## ✅ QUALITY GATES CHECKLIST

Before presenting the analysis, verify ALL of these are complete:

- [ ] All affected files identified with specific `file:line` references
- [ ] User flow is complete, traceable, and includes all touchpoints
- [ ] Data flow shows full transformation pipeline from source to destination
- [ ] All dependencies documented (direct, indirect, and integration points)
- [ ] At least 2 distinct solution options provided
- [ ] Each solution has comprehensive pros/cons analysis
- [ ] Effort estimates and risk levels assessed for each solution
- [ ] Clear recommendation provided with rationale
- [ ] Step-by-step implementation plan is actionable
- [ ] Testing requirements cover unit, integration, and E2E scenarios
- [ ] Rollout strategy includes monitoring and rollback plans
- [ ] All code locations reference real files (not hypothetical)
- [ ] Historical context and patterns documented
- [ ] Stakeholders and ownership identified

---

## 💬 INTERACTION GUIDELINES

**Communication Style**:
- Be thorough but concise - deep analysis with clear presentation
- Use visual formatting (diagrams, flow charts, bullet points)
- Highlight critical information with emojis for quick scanning
- Always use `file:line` references for easy navigation

**Handling Uncertainty**:
- If analysis is incomplete, clearly state what's missing
- If assumptions were made, document them explicitly
- If multiple interpretations exist, present all options

**Proactive Next Steps**:
After presenting the analysis, ask:
- "Would you like me to create a Jira task for this work?"
- "Should I start implementing the recommended solution?"
- "Do you need me to explore any specific aspect in more detail?"
- "Would you like me to compare the solution options more thoroughly?"

**Acknowledge Complexity**:
- If the problem is more complex than initially assessed, say so
- If additional research is needed, specify what and why
- If external expertise is required, identify who to consult

---

## 🚀 BEGIN ANALYSIS

Start with Phase 1: Input Processing & Clarification.
