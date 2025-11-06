---
description: Deep analysis of bugs/features with codebase exploration, flow mapping, solution proposals, and structured output
argument-hint: [jira-id|pr-url|#pr-number|github-issue-url|description] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--quick] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "ExitPlanMode", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Analyzer Workflow

You are performing a **comprehensive problem analysis** for a bug or feature request. Follow this structured workflow meticulously.

---

## ⚙️ MODE ENFORCEMENT

**CRITICAL**: This command operates in **PLAN MODE** throughout Phases 1-2 (analysis and exploration). You MUST use the **ExitPlanMode tool** before Phase 4 (output handling) to transition from analysis to execution.

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

Use lib/argument-parser.md:

```
Configuration:
  command_name: "analyze"
  command_label: "Analyze-Problem"

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
      description: "Custom output file path for analysis"
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
      description: "Post analysis as Jira comment"
    - name: "--quick"
      type: "boolean"
      description: "Generate quick analysis (minimal sections)"

  validation:
    - --output and --no-file are mutually exclusive
    - --post-to-jira requires Jira ID in problem_input
    - At least one input source required (positional or --input)
```

**Store parsed values:**
- `problem_input`: Positional argument or --input file content
- `output_path`: --output value or null
- `work_dir`: --work-dir value or null
- `file_output`: true (unless --no-file)
- `terminal_output`: true (unless --quiet)
- `jira_posting`: true if --post-to-jira
- `quick_mode`: true if --quick

---

## PHASE 1: INPUT PROCESSING & CLARIFICATION

Use lib/input-processing.md:

```
Configuration:
  command_context: "analyze"
  command_label: "Analyze-Problem"

  input_sources:
    - jira: true         # Fetch issue details from Jira via jira-analyzer
    - github_pr: true    # Fetch PR context via gh-pr-analyzer
    - github_issue: true # Fetch issue context via gh-issue-analyzer
    - text: true         # Parse free-form problem descriptions
    - file: true         # Read from --input file

  parsing_hints:
    - Extract problem description, severity, type (bug/feature)
    - Identify affected areas, user impact, business context
    - Note technical details, reproduction steps, acceptance criteria
    - Extract stakeholder info, priority, deadlines

  validation:
    - Ensure problem description is clear
    - Verify problem type is identified (bug/feature/refactor)
    - Check severity/priority is noted

Output (store for Phase 2):
  problem_summary: "[One-line problem description]"
  problem_details: {
    description: "...",
    type: "bug|feature|refactor|investigation",
    severity: "Critical|High|Medium|Low",
    affected_area: "...",
    user_impact: "...",
    business_context: "..."
  }
  acceptance_criteria: ["..."]
  technical_notes: ["..."]
  jira_id: "EC-1234" or null
```

---

### Step 1.3: Work Folder Resolution

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"

  identifier: [jira_id from input processing, or null]
  description: [problem_summary from input processing]

  workflow_type: "full"  # Full workflow: analyze → plan → implement

  workflow_steps:
    - "analyze"     # Current step
    - "plan"
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
- [ ] Problem input parsed successfully
- [ ] Context fetched (Jira/GitHub/text)
- [ ] Problem details extracted (description, type, severity)
- [ ] Acceptance criteria noted (if available)
- [ ] Work folder resolved (if applicable)
```

---

## PHASE 2: DEEP CODEBASE ANALYSIS

**CRITICAL**: Use the **Task tool with Plan subagent type** for analytical exploration in plan mode.

### Step 2.1: Prepare Comprehensive Exploration Prompt

**Construct detailed prompt for Plan subagent:**

```markdown
# Codebase Analysis Request

## Problem Context
[problem_summary from Phase 1]

**Problem Details**:
- Type: [type - bug/feature/refactor]
- Severity: [severity]
- Affected Area: [affected_area]
- User Impact: [user_impact]
- Business Context: [business_context]

[If acceptance criteria available]:
**Acceptance Criteria**:
[List criteria from Phase 1]

[If technical notes available]:
**Technical Notes**:
[List notes from Phase 1]

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

### Step 2.2: Invoke Plan Subagent

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

3. **Wait for subagent completion**

4. **Acknowledge completion**:
   ```
   ✅ **[Analyze-Problem]** Codebase analysis complete
   ```

**Important**: Do NOT execute the exploration instructions directly. The Plan subagent will handle all codebase exploration.

### Step 2.3: Capture and Structure Exploration Results

**Extract key findings from subagent response**:
- affected_components = [List of components with file:line references and roles]
- user_flow = [Step-by-step user journey with file:line references]
- data_flow = [Data movement and transformations with file:line references]
- dependencies = [Categorized dependency graph: direct, indirect, integration]
- code_quality_issues = [Technical debt, test gaps, code smells with file:line refs]
- historical_context = [Recent changes, patterns, stakeholders]
- issues_identified = [Problems found with evidence and root causes, with file:line refs]
- code_locations = [Comprehensive list of all file:line references discovered]

**Validate exploration completeness**:
```
- [ ] At least 3 affected components identified with specific file:line references
- [ ] User flow traced from entry point to problem occurrence
- [ ] Data flow mapped through at least 3 transformation points
- [ ] Dependencies catalogued (direct, indirect, or integration)
- [ ] At least 2 code quality issues or technical observations noted
- [ ] Root causes identified with supporting evidence
```

**If validation fails**:
```
⚠️ **[Analyze-Problem]** Exploration incomplete

The Plan subagent's analysis is missing:
- [List missing requirements]

Options:
1. Re-run exploration with more specific guidance
2. Supplement with targeted manual searches
3. Proceed with available information (note gaps in analysis)
```

Ask user how to proceed. Do NOT continue to Phase 3 with incomplete data.

**If validation passes**:
```
✅ **[Analyze-Problem]** Exploration findings validated and structured for analysis generation
```

Store the structured findings for Phase 3.

---

## PHASE 3: ANALYSIS GENERATION

Use lib/subagent-invoker.md:

```
Configuration:
  subagent: "analysis-generator"  # Note: This may not exist yet, use structured generation
  command_context: "analyze"
  command_label: "Analyze-Problem"

  input_context:
    problem_summary: [from Phase 1]
    problem_details: [from Phase 1]

    exploration_results:
      affected_components: [from Phase 2]
      user_flow: [from Phase 2]
      data_flow: [from Phase 2]
      dependencies: [from Phase 2]
      code_quality_issues: [from Phase 2]
      historical_context: [from Phase 2]
      issues_identified: [from Phase 2]
      code_locations: [from Phase 2]

    analysis_mode: "full" | "quick"
      - "full": Comprehensive analysis with 2-3 solution proposals
      - "quick": Quick analysis with 1 solution option

  template_guidance:
    - Problem summary with core issue, impact, severity
    - Current state analysis with affected components
    - User flow and data flow analysis with file:line references
    - Issues identified with root causes
    - Solution proposals (2-3 for full, 1 for quick) with:
      * Approach description
      * Required changes with file:line references
      * Pros and cons
      * Effort estimate
      * Risk level
      * Implementation guidance
    - Recommended solution marked with ⭐
    - Testing requirements
    - Resources & references

  validation_rules:
    - Must have YAML frontmatter with all required fields
    - Must have problem summary with core issue, impact, severity
    - Must have current state analysis with affected components
    - Must have flow analysis with file:line references
    - Must have issues identified with root causes
    - Must have solution proposals (2+ for full, 1 for quick)
    - Each solution must have approach, changes, pros/cons, effort, risk
    - Must have implementation guidance with recommended approach
    - Must have testing requirements listed
    - All file references must use file:line format
    - Recommended solution marked with ⭐ (full mode only)
    - Token count under 4000

  error_handling:
    - If validation fails: Regenerate with more specific prompt
    - If subagent not available: Generate analysis directly using template
```

**Note**: If analysis-generator subagent doesn't exist yet, generate the analysis directly using the template guidance above and the structured findings from Phase 2.

**Store generated analysis for Phase 4.**

---

## PHASE 3.5: EXIT PLAN MODE

Use lib/exit-plan-mode.md:

```
Configuration:
  command_type: "analyze"
  command_label: "Analyze-Problem"

  summary:
    problem: [problem_summary from Phase 1]
    analysis_type: "Full" or "Quick" [based on --quick flag]
    key_findings: [Top 3 findings from Phase 2]
    solution_options_count: [Number of solutions from Phase 3]
    recommended_option: [Recommended solution name from Phase 3]
```

---

## PHASE 4: OUTPUT HANDLING

Use lib/output-handler.md:

```
Configuration:
  content: [Generated analysis from Phase 3]
  content_type: "analysis"
  command_label: "Analyze-Problem"

  flags:
    terminal_output: [terminal_output from argument parsing]
    file_output: [file_output from argument parsing]
    jira_posting: [jira_posting from argument parsing]

  file_config:
    output_path: [output_path from arguments, or null for auto]
    default_basename: "analysis"
    work_folder: [work_folder from Phase 1, or null]
    jira_id: [jira_id from Phase 1, or null]
    workflow_step: "analyze"

  jira_config:
    jira_id: [jira_id from Phase 1, or null]
    cloud_id: "productboard.atlassian.net"
    jira_title: "Problem Analysis"
    jira_author: "Claude Code"

Output (store result for Phase 5):
  output_result: {
    terminal_displayed: [true/false],
    file_created: [true/false],
    file_path: [path or null],
    jira_posted: [true/false],
    metadata_updated: [true/false]
  }
```

---

## PHASE 5: COMPLETION & NEXT STEPS

Use lib/completion-handler.md:

```
Configuration:
  command_type: "analyze"
  command_label: "Analyze-Problem"

  summary_data:
    problem: [problem_summary from Phase 1]
    output_files: [file_path from output_result if file_created]
    jira_posted: [jira_posted from output_result]
    jira_id: [jira_id from Phase 1 or null]
    work_folder: [work_folder from Phase 1 or null]
    terminal_only: [true if file_output was false]

  command_specific_data:
    analysis_type: "Full" or "Quick" [based on --quick flag]
    solution_options_count: [Number of solutions from Phase 3]
    recommended_option: [Recommended solution name from Phase 3]

This will:
  - Display completion summary box with analysis type and solution count
  - Offer to automatically run /schovi:plan if file was created
  - Provide alternative next steps: discuss solution, deep dive, update Jira
  - Handle user's choice (run plan command, discuss, explore, post to Jira)
```

---

## QUALITY GATES REFERENCE

**Note**: Quality gates are enforced in Phase 2.3 and Phase 3 validation.

Analysis must contain:

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
- [ ] Token count under 4000 (from subagent footer if used)

---

## INTERACTION GUIDELINES

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
- Phase 3: Generate or delegate analysis (context isolation if subagent used)
- Phase 4-5: Handle output (clean main context)

**Token Efficiency**:
- If using subagent: Processes verbose exploration (~3-5k tokens), returns clean analysis (~2-3k tokens)
- If generating directly: Keep analysis under 4000 tokens
- Main context stays clean for next task

---

## 🚀 BEGIN ANALYSIS

Start with Argument Parsing, then proceed to Phase 1: Input Processing & Clarification.
