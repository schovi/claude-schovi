# Schovi Workflow Plugin for Claude Code

Personal workflow automation and tools for software engineering. Includes problem analysis, Jira integration, intelligent code exploration, and more.

## 🎯 Overview

The Schovi plugin provides an end-to-end workflow for software engineering: from problem analysis to specification to autonomous implementation.

**Complete Workflow**:
1. **Analysis** (`/schovi:analyze-problem`) - Understand the problem, explore codebase, propose solutions
2. **Specification** (`/schovi:create-spec`) - Document decisions, structure implementation, define success
3. **Implementation** (`/schovi:implement`) - Execute tasks autonomously, validate, commit changes
4. **Commit Management** (`/schovi:commit`) - Create structured commits with validation and smart analysis

**Key Features**:
- **Automatic Jira Detection**: Intelligent Skill that detects when you mention Jira issues and automatically fetches context (works in ANY conversation, not just commands)
- **Automatic GitHub PR Detection**: Intelligent Skill that detects PR mentions and fetches condensed context (reviews, CI status, code changes) without polluting main context
- **GitHub Issue Support**: Fetch and analyze GitHub issues with the same context-isolated approach as Jira and PRs
- **Smart Git Commits**: Create structured commits with conventional format, branch validation, and automatic change analysis
- **Deep Codebase Analysis**: Explores code using specialized agents to understand user flows, data flows, and dependencies
- **Smart Clarification**: Automatically detects ambiguous inputs and asks targeted questions before analysis
- **Context-Isolated Fetching**: Uses specialized subagents to fetch and summarize Jira issues, GitHub PRs, and GitHub issues without polluting main context (reduces token usage by 75-80%)
- **Multi-Option Solutions**: Proposes 2-3 solution approaches with comprehensive pros/cons analysis
- **Autonomous Implementation**: Executes implementation tasks with full autonomy, creates commits, runs validation

## 📦 Installation

### Prerequisites

- Claude Code CLI installed
- MCP Server: Jira (required for Jira integration)
- GitHub CLI (`gh`) authenticated (required for PR integration)
- MCP Server: JetBrains (optional, for enhanced IDE integration)

### Install Plugin

1. Add the marketplace:

```bash
/plugin marketplace add ~/work/claude-schovi
```

2. Install the plugin:

```bash
/plugin install schovi@schovi-workflows
```

3. Verify installation:

```bash
/schovi:analyze-problem --help
```

4. Configure MCP servers in your Claude Code settings to enable Jira integration.

## 🚀 Usage

### Commands

#### `/schovi:analyze-problem` - Problem Analysis

```bash
/schovi:analyze-problem [jira-id|pr-url|github-issue-url|description] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--quick]
```

Performs comprehensive problem analysis with codebase exploration, solution proposals, and structured output artifacts.

**Input Options:**
- `jira-id` - Analyze from Jira issue (e.g., EC-1234)
- `pr-url` - Analyze from GitHub PR (full URL, owner/repo#123, or #123)
- `github-issue-url` - Analyze from GitHub issue (full URL or owner/repo#123)
- `description` - Analyze from free-form problem description

**Output Options:**
- `--output PATH` - Save analysis to specific file path
- `--no-file` - Skip file output, terminal only
- `--quiet` - Skip terminal output, file only
- `--post-to-jira` - Post analysis as Jira comment
- `--quick` - Generate quick analysis (minimal sections) instead of full analysis

**Default**: Displays in terminal + saves to `./analysis-[jira-id].md`

**Analysis Modes**:
- **Full** (default): Complete analysis with 2-3 solution options, flows, dependencies, comprehensive guidance
- **Quick** (`--quick` flag): Minimal analysis with single solution for simple bugs/features

#### `/schovi:create-spec` - Specification Generation

```bash
/schovi:create-spec [jira-id|github-issue-url|--file path|--from-scratch description]
```

Generates actionable implementation specifications from problem analysis. Bridges exploration and execution.

**Input Options:**
- `jira-id` - Generate from Jira issue (with or without prior analysis)
- `github-issue-url` - Generate from GitHub issue (full URL or owner/repo#123)
- No args - Auto-detect from recent conversation analysis
- `--file path.md` - Generate from analysis file
- `--from-scratch "description"` - Create minimal spec interactively

**Output Options:**
- `--output path.md` - Save to specific file
- `--post-to-jira` - Post spec as Jira comment
- `--no-file` - Terminal only
- `--quiet` - Suppress terminal output

**Default**: Displays in terminal + saves to `./spec-[jira-id].md`

#### `/schovi:implement` - Implementation Execution

```bash
/schovi:implement [spec-file|jira-id]
```

Autonomously executes implementation tasks from specification with validation and commits.

**Input Options:**
- `spec-file` - Path to specification file (e.g., `./spec-EC-1234.md`)
- `jira-id` - Fetch spec from Jira issue comments
- No args - Auto-detect from recent conversation

**Execution Flow:**
1. Parse spec to extract implementation tasks and acceptance criteria
2. Execute tasks sequentially with full autonomy (no task-by-task approval)
3. Create phase-based git commits with descriptive messages
4. Run validation (linting, type checking, tests)
5. Verify acceptance criteria
6. Report completion status and suggest next steps

**Features:**
- Full autonomy mode (configured via user preferences)
- Project type detection (Node.js, Python, Go, Ruby, Rust)
- Automatic validation and fixing attempts
- Phase-based git commits
- Comprehensive error handling and reporting

**Model**: Uses Haiku for efficient execution

**Current Scope (v1.3.0)**:
- ✅ Implementation execution with full autonomy
- ✅ Validation (linting + testing)
- ✅ Phase-based git commits
- ⏳ Git worktree setup (coming in v1.4.0)
- ⏳ Jira status updates (coming in v1.4.0)
- ⏳ PR creation (coming in v1.4.0)

#### `/schovi:commit` - Structured Git Commits

```bash
/schovi:commit [jira-id|github-issue|github-pr|notes] [--message "text"] [--staged-only]
```

Creates well-structured git commits with automatic change analysis, validation, and optional external context fetching.

**Input Options:**
- `jira-id` - Include Jira context in commit (e.g., EC-1234)
- `github-issue` - Include GitHub issue context (URL or owner/repo#123)
- `github-pr` - Include GitHub PR context (URL or owner/repo#123)
- `notes` - Free-form notes to guide commit message
- No args - Auto-analyze staged changes and create commit

**Flags:**
- `--message "text"` - Override auto-generated message with custom text
- `--staged-only` - Only commit staged changes (don't auto-stage all)
- `--type prefix` - Specify commit type (feat, fix, chore, etc.)

**Features:**
- **Conventional Commits**: Automatic type detection (feat, fix, chore, refactor, docs, test, style, perf)
- **Smart Validation**: Blocks commits on main/master, validates branch naming against Jira ID
- **Change Analysis**: Analyzes git diff to generate descriptive commit messages with bullet points
- **Optional Context Fetching**: Fetches Jira/GitHub context only when diff analysis is unclear
- **Multi-line Messages**: Title + description paragraph + bullet points + related references + Claude Code footer

**Commit Message Format:**
```
PREFIX: Brief title (50-72 chars)

Short paragraph explaining problem/solution/changes

- Bullet point 1 (specific change)
- Bullet point 2 (specific change)
- Bullet point 3 (specific change)

Related to: [JIRA-ID or GitHub reference]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Validation Rules:**
- ❌ Blocks commits on main/master branches
- ⚠️  Warns if branch name doesn't match Jira issue key
- ❌ Errors if no changes to commit
- ❌ Errors if merge conflicts detected

**Default Behavior**:
- Auto-stages all changes with `git add .`
- Analyzes changes to determine commit type
- Generates descriptive multi-line commit message
- Verifies commit created successfully

### Examples

#### Example 1: Analyze a Jira Issue

```bash
/schovi:analyze-problem EC-1234
```

This will:
1. Fetch the Jira issue details
2. Perform deep codebase analysis using Plan subagent
3. Generate structured analysis with 2-3 solution options via analysis-generator subagent
4. Save to `./analysis-EC-1234.md` + display in terminal
5. Provide implementation guidance with recommended approach

#### Example 2: Analyze with Description and Custom Output

```bash
/schovi:analyze-problem "Users report login fails after OAuth provider returns 302 redirect" --output ~/docs/login-bug-analysis.md
```

This will:
1. Parse the problem description
2. Ask clarifying questions if the description is ambiguous
3. Explore affected code areas
4. Generate analysis with solution proposals
5. Save to custom path: `~/docs/login-bug-analysis.md`

#### Example 3: Quick Analysis with Jira Posting

```bash
/schovi:analyze-problem IS-8046 --quick --post-to-jira
```

This will:
1. Fetch Jira issue IS-8046
2. Perform quick analysis (single solution, minimal sections)
3. Save to `./analysis-IS-8046.md` + display in terminal
4. Post analysis as comment to Jira issue IS-8046

#### Example 4: Interactive Mode

```bash
/schovi:analyze-problem
```

This will prompt you to provide either a Jira ID or problem description.

#### Example 5: Create Spec from Analysis

```bash
# After running analyze-problem and choosing an approach
/schovi:create-spec
```

This will:
1. Detect recent analysis from conversation or analysis file
2. Generate structured implementation spec
3. Save to `./spec-EC-1234.md`
4. Display formatted spec in terminal

#### Example 6: Create Spec with Jira Integration

```bash
/schovi:create-spec EC-1234 --post-to-jira
```

This will:
1. Fetch Jira issue (if analysis available, use it; otherwise create from Jira content)
2. Generate spec with decision rationale and implementation tasks
3. Save locally AND post to Jira as comment
4. Ready for team review before implementation

#### Example 7: Create Minimal Spec from Scratch

```bash
/schovi:create-spec --from-scratch "Add loading spinner to dashboard"
```

This will:
1. Prompt for key requirements interactively
2. Generate minimal spec (goal, tasks, acceptance criteria)
3. Save to `./spec-[timestamp].md`
4. Quick specs for simple tasks

#### Example 8: Implement from Spec File

```bash
/schovi:implement ./spec-EC-1234.md
```

This will:
1. Parse spec to extract 9 tasks across 3 phases
2. Execute Phase 1: Backend Service (3 tasks)
3. Create commit: "Phase 1: Backend Service"
4. Execute Phase 2: Integration (3 tasks)
5. Create commit: "Phase 2: Integration"
6. Execute Phase 3: Testing (3 tasks)
7. Create commit: "Phase 3: Testing"
8. Run validation: linting, type check, tests
9. Verify acceptance criteria
10. Report completion and suggest PR creation

#### Example 9: Implement from Jira with Auto-Detection

```bash
/schovi:implement
```

This will:
1. Search conversation for recent spec from `/schovi:create-spec`
2. Auto-detect spec generated 3 messages ago
3. Execute all implementation tasks autonomously
4. Create phase-based commits
5. Run full validation suite
6. Display completion summary with next steps

#### Example 10: Implement with Validation Fixes

```bash
/schovi:implement EC-1234
```

This will:
1. Fetch spec from Jira issue comments
2. Execute all implementation tasks
3. Run linting → finds 3 issues → auto-fixes with `--fix`
4. Run tests → 2 failures → analyzes and fixes test expectations
5. Re-runs validation → all passing
6. Creates additional fix commits
7. Reports successful completion

## 📋 What the Analysis Includes

### 1. Problem Summary
- Executive summary of the issue
- Impact assessment (users, systems, severity)
- Urgency evaluation

### 2. Current State Analysis
- **Affected Components**: All relevant files with `file:line` references
- **User Flow Mapping**: Complete journey from user action to system response
- **Data Flow Analysis**: How data moves and transforms through the system
- **Dependencies Map**: Direct, indirect, and external integration points
- **Issues Identified**: Root causes, secondary problems, and technical debt

### 3. Solution Proposals
- 2-3 distinct solution options
- Comprehensive pros/cons for each option
- Effort estimates (Small/Medium/Large)
- Risk assessment (Low/Medium/High)
- Clear recommendation with rationale

### 4. Implementation Guidance
- Step-by-step implementation plan
- Testing requirements (unit, integration, E2E, manual)
- Rollout strategy with monitoring and rollback plans
- Feature flag recommendations

### 5. Resources & References
- Code locations with specific file:line references
- Related Jira issues
- Documentation links
- Stakeholder identification

## 📄 What the Spec Includes

### Full Specification (from analysis)
- **Decision & Rationale**: Which approach was chosen and why
- **Technical Overview**: Data flows, affected services, key changes
- **Implementation Tasks**: Broken into phases with checkboxes
- **Acceptance Criteria**: Testable, specific success conditions
- **Testing Strategy**: Unit, integration, and manual test scenarios
- **Risks & Mitigations**: Known risks with mitigation strategies
- **References**: Links to analysis, Jira, architecture docs

### Minimal Specification (from scratch)
- **Goal**: What needs to be built and why
- **Requirements**: Key functional requirements
- **Implementation Tasks**: Simple checklist of work items
- **Acceptance Criteria**: Basic success conditions
- **Testing**: Brief manual testing guidance

Both spec types use markdown format with YAML frontmatter for metadata, saved as `spec-[jira-id].md` or `spec-[timestamp].md`.

## 🎨 Features

### Smart Clarification

The plugin automatically detects when input is ambiguous and asks targeted questions:

```
Ambiguous input detected:
- Problem mentions "login" but unclear which flow
- Missing reproduction steps
- Unknown affected environment

Asking clarifying questions...
```

### Deep Analysis with Specialized Agents

Uses Claude Code's Task tool with Plan subagent for thorough exploration:
- Traces user flows from UI to backend
- Maps data transformations
- Discovers direct and indirect dependencies
- Identifies Kafka topics, background jobs, feature flags
- Assesses code quality and technical debt

### Quality Gates

Every analysis must pass these checks before presentation:
- ✅ All affected files identified with specific references
- ✅ Complete user and data flow diagrams
- ✅ All dependencies documented
- ✅ At least 2 solution options provided
- ✅ Implementation plan is actionable
- ✅ Testing and rollout strategies defined

## 📁 Plugin Structure

The plugin follows Claude Code's standard structure:

```
~/work/claude-schovi/                    # Marketplace repo
├── .claude-plugin/
│   └── marketplace.json                 # Marketplace metadata
└── schovi/                              # Self-contained plugin
    ├── .claude-plugin/
    │   └── plugin.json                  # Plugin metadata
    ├── commands/
    │   ├── analyze-problem.md           # Problem analysis command
    │   └── create-spec.md               # Specification generation command
    ├── agents/
    │   ├── jira-analyzer/               # Context-isolated Jira subagent
    │   │   └── AGENT.md
    │   ├── gh-pr-analyzer/                 # Context-isolated GitHub PR subagent
    │   │   └── AGENT.md
    │   └── spec-generator/              # Context-isolated spec generation subagent
    │       └── AGENT.md
    ├── skills/
    │   ├── jira-auto-detector/          # Automatic Jira detection skill
    │   │   └── SKILL.md
    │   └── gh-pr-auto-detector/         # Automatic GitHub PR detection skill
    │       └── SKILL.md
    ├── templates/
    │   └── spec-template.md             # Specification template reference
    └── README.md
```

## 🏗️ Architecture: Context Isolation

### The Problem

Jira MCP tool returns massive payloads (~10k tokens) containing:
- Full issue history
- All comments (often 50+)
- Verbose metadata, timestamps, formatting
- Linked issues with full details

This pollutes the main analysis context, leaving less room for actual codebase exploration.

### The Solution: Subagent Architecture

The plugin uses a **specialized subagent** (`jira-analyzer`) that operates in isolated context:

```
User invokes: /analyze-problem EC-1234
       ↓
Main Command detects Jira issue
       ↓
Delegates to jira-analyzer subagent (Task tool)
       ↓
Subagent Context (Isolated):
  - Fetches 10k token Jira payload
  - Analyzes and extracts essence
  - Burns tokens privately
       ↓
Returns clean summary (~800 tokens)
       ↓
Main Command receives summary
       ↓
Proceeds with codebase analysis
  (Main context stays clean!)
```

### Benefits

- **31% Token Reduction**: Saves ~9.2k tokens per analysis
- **Cleaner Context**: Main workflow focuses on codebase, not Jira metadata
- **Better Analysis**: More context window available for code exploration
- **Scalable**: Handles any Jira issue size (10k-50k tokens)

### How It Works

1. **Detection**: Main command detects Jira issue ID in input
2. **Delegation**: Uses Task tool to invoke `jira-analyzer` subagent
3. **Isolation**: Subagent fetches full Jira payload in its own context
4. **Extraction**: Subagent extracts only essential info:
   - Core fields (key, title, type, status, priority)
   - Condensed description (first 500 chars)
   - Max 3 key comments
   - Acceptance criteria
   - Technical context
5. **Summary**: Subagent returns structured summary (~800 tokens)
6. **Analysis**: Main command uses summary for codebase exploration

### Subagent: jira-analyzer

Located at: `.claude/agents/jira-analyzer/AGENT.md`

**Responsibilities:**
- Fetch Jira issues using MCP tools
- Extract actionable information only
- Return structured markdown summary
- Never pollute parent context with full payload

**Output Format:**
```markdown
# Jira Issue Summary: EC-1234

## Core Information
- Issue: EC-1234 - Title
- Type: Bug | Status: To Do | Priority: High

## Description
[Condensed, max 500 chars]

## Acceptance Criteria
1. [Criterion 1]
2. [Criterion 2]

## Key Comments
- **Author**: [Summary, max 200 chars]

## Technical Context
- Affected: [Components mentioned]
- Environment: [If specified]
```

**Token Budget:** Max 1000 tokens output (typically ~800)

---

## 🤖 Automatic Jira Detection

### Three-Tier Architecture

The workflow system provides multiple ways to work with Jira issues:

#### **Tier 1: Automatic Detection (Skill)** ⭐ Primary

**jira-auto-detector Skill** - Works across ALL conversations

**Location**: `.claude/skills/jira-auto-detector/SKILL.md`

**How it works:**
- Automatically detects when you mention Jira issues
- Intelligently evaluates if context is needed
- Spawns jira-analyzer subagent automatically
- Seamless - just mention "EC-1234" and get context

**Use cases:**
- Casual questions: "What's EC-1234 about?"
- Quick checks: "Is IS-8046 high priority?"
- Comparisons: "Compare EC-1234 and IS-8046"
- Any conversation where Jira is mentioned

**Intelligence:**
- ✅ Fetch when you ask about an issue
- ❌ Don't fetch when you mention it in past tense ("fixed EC-1234")
- ✅ Reuse context if already fetched in session
- ❌ Avoid false positives (endpoint names, identifiers)

#### **Tier 2: Explicit Command** - Guaranteed workflow

**/analyze-problem Command** - Structured analysis workflow

**Location**: `schovi/commands/analyze-problem.md`

**How it works:**
- User explicitly invokes: `/schovi:analyze-problem EC-1234`
- Guaranteed to fetch Jira issue
- Proceeds with full problem analysis workflow
- Part of documented Flow 1

**Use cases:**
- Formal problem analysis
- When you want guaranteed fetch
- When Skill doesn't activate
- Explicit workflow control

#### **Tier 3: Manual Subagent** - Direct access

**jira-analyzer Subagent** - Low-level tool

**Location**: `.claude/agents/jira-analyzer/AGENT.md`

**How it works:**
- Directly spawn via Task tool
- Use when you need fine control
- Handles actual Jira fetching logic

**Use cases:**
- Custom workflows
- Debugging
- Advanced scenarios

### Comparison

| Approach | Activation | Intelligence | Use Case |
|----------|-----------|--------------|----------|
| **Skill** | Automatic | LLM-powered | General conversations |
| **Command** | Explicit `/` | Workflow-driven | Structured analysis |
| **Subagent** | Manual Task | None (execution only) | Custom workflows |

**Recommendation**: Let the Skill handle detection automatically. Use the Command for explicit analysis workflows.

---

## 🐙 GitHub PR Integration

### The Problem: Massive PR Payloads

GitHub PRs can include enormous amounts of data:
- Complete diff for all changed files (often 10k+ lines)
- Full review history with inline comments (100+ comments)
- Detailed CI/CD logs and check runs
- PR discussions, reactions, metadata
- Linked issues and cross-references

A single `gh pr view` command can return 20k-50k tokens, overwhelming the context window.

### The Solution: PR Analyzer Subagent

Similar to Jira integration, the plugin uses a **specialized subagent** (`gh-pr-analyzer`) that operates in isolated context:

```
User mentions: "Review anthropics/claude-code#123"
       ↓
gh-pr-auto-detector Skill activates
       ↓
Evaluates context need & intent
       ↓
Spawns gh-pr-analyzer subagent (Task tool)
       ↓
Subagent Context (Isolated):
  - Runs gh CLI commands (pr view, pr checks, pr diff)
  - Fetches 20-50k token PR payload
  - Analyzes and extracts essence
  - Burns tokens privately
       ↓
Returns clean summary (~800-1000 tokens)
       ↓
Main Context receives summary
       ↓
User gets relevant PR context
  (Main context stays clean!)
```

### Benefits

- **75-80% Token Reduction**: Saves 15-40k tokens per PR analysis
- **Intelligent Filtering**: Fetches only reviews, CI, or full context based on user intent
- **Repository Context Detection**: Automatically resolves #123 to owner/repo#123 from git remote
- **Cleaner Context**: Main workflow focuses on answering user's question, not PR metadata
- **Scalable**: Handles PRs of any size

### How It Works

1. **Detection**: Skill detects PR mentions (URLs, owner/repo#123, #123, "PR #123")
2. **Context Resolution**: For #123, extracts owner/repo from git remote or conversation
3. **Intent Classification**: Determines what user needs:
   - Full context (default): reviews + CI + code changes
   - Reviews focus: "What are the review comments?"
   - CI focus: "Did tests pass?"
4. **Delegation**: Uses Task tool to invoke `gh-pr-analyzer` subagent with options
5. **Isolation**: Subagent fetches PR data via `gh` CLI in its own context
6. **Extraction**: Subagent condenses:
   - Description (max 500 chars)
   - Code changes (top 5 files, line counts)
   - CI status (overall + failed checks only)
   - Reviews (max 3 latest, with max 5 key comments)
   - Analysis notes
7. **Summary**: Subagent returns structured markdown (~800-1000 tokens)
8. **Integration**: Main context uses summary to answer user's question

### Subagent: gh-pr-analyzer

Located at: `schovi/agents/gh-pr-analyzer/AGENT.md`

**Responsibilities:**
- Parse PR identifiers (URL, owner/repo#123, #123)
- Fetch PR data using `gh` CLI via Bash tool
- Extract actionable information based on options
- Return structured markdown summary
- Never pollute parent context with full payload

**Input Format:**
```
Fetch and summarize GitHub PR: anthropics/claude-code#123
Options: include_reviews=true, include_ci=true
```

**Output Format:**
```markdown
# GitHub PR Summary: anthropics/claude-code#123

## Core Information
- PR: #123 - Add MCP server support
- Author: username
- Status: open | merged | closed
- Base: main ← Head: feature/mcp-support
- URL: https://github.com/anthropics/claude-code/pull/123

## Description
[Condensed description, max 500 chars]

## Code Changes
- Files changed: 15 (+250, -100)
- Key files:
  - src/mcp/server.ts (+120, -30)
  - src/mcp/client.ts (+80, -20)
  - tests/mcp.test.ts (+50, -0)

## CI/CD Status
- Overall: ✅ passing | ❌ failing | ⏳ pending
- Failed checks:
  - test-suite: 3 test failures in auth module
  - lint: 2 style violations

## Reviews
- Review decision: APPROVED | CHANGES_REQUESTED | PENDING
- Latest reviews:
  - **reviewer1** (approved): "LGTM, great work on error handling"
  - **reviewer2** (changes requested): "Please address async handling in server.ts:45"
- Key comments:
  - **reviewer2**: "Line 45: This should use async/await pattern"
  - **reviewer1**: "Consider caching the connection pool"

## Analysis Notes
- Large PR focused on MCP integration
- Some review concerns about error handling
- CI mostly passing except auth tests
```

**Token Budget:** Max 1200 tokens output (typically ~800-1000)

### Automatic PR Detection

#### **Tier 1: Automatic Detection (Skill)** ⭐ Primary

**gh-pr-auto-detector Skill** - Works across ALL conversations

**Location**: `schovi/skills/gh-pr-auto-detector/SKILL.md`

**How it works:**
- Detects PR patterns: URLs, owner/repo#123, #123, "PR #123"
- Resolves #123 to full identifier using git remote
- Intelligently evaluates if context is needed
- Classifies user intent (reviews/CI/full)
- Spawns gh-pr-analyzer subagent with appropriate options
- Seamless - just mention a PR and get context

**Use cases:**
- Questions: "What's anthropics/claude-code#123 about?"
- Reviews: "What are the review comments on #456?"
- CI checks: "Did tests pass on #123?"
- Status: "Is #456 merged?"
- Comparisons: "Compare #123 and #456 approaches"

**Intelligence:**
- ✅ Fetch when you ask about a PR
- ❌ Don't fetch for past tense ("merged #123")
- ✅ Fetch reviews-only when asking about feedback
- ✅ Fetch CI-only when asking about tests
- ✅ Reuse context if already fetched in session
- ❌ Avoid false positives (endpoint names like "PR-123")

**Repository Context Detection:**
- For `#123`: Checks current git remote → `productboard/frontend#123`
- For `owner/repo#123`: Uses as-is
- For URLs: Parses owner, repo, number
- If unclear: Asks user to clarify

#### **Tier 2: Manual Subagent** - Direct access

**gh-pr-analyzer Subagent** - Low-level tool

**Location**: `schovi/agents/gh-pr-analyzer/AGENT.md`

**How it works:**
- Directly spawn via Task tool
- Use when you need fine control
- Handles actual PR fetching via `gh` CLI

**Use cases:**
- Custom workflows
- Debugging
- Advanced scenarios

### Examples

#### Example 1: Review Request
```
User: "Review anthropics/claude-code#123"

Skill Process:
✅ Detect pattern: anthropics/claude-code#123
✅ Evaluate: Review request → full context needed
✅ Classify: Comprehensive review → include_reviews=true, include_ci=true
✅ Spawn gh-pr-analyzer subagent
✅ Receive summary with reviews, CI, code changes
✅ Provide comprehensive review feedback

Response:
"I've reviewed anthropics/claude-code#123. This PR adds MCP server support
with 15 file changes. The CI is passing and there's one review requesting
changes about async handling. Here's my analysis: [detailed review]..."
```

#### Example 2: CI Status Check
```
User: "Did tests pass on #456?"

Skill Process:
✅ Detect pattern: #456
✅ Resolve repo: productboard/frontend#456 (from git remote)
✅ Evaluate: CI question → context needed
✅ Classify: CI focus → include_reviews=false, include_ci=true
✅ Spawn gh-pr-analyzer with CI-only option
✅ Receive CI summary (no reviews to save tokens)
✅ Report CI status

Response:
"I've checked productboard/frontend#456. The build is failing -
the test-suite check has 3 test errors in the auth module.
The linter and type checks passed. Here are the failing tests: [details]..."
```

#### Example 3: Comparison
```
User: "Compare #123 and #456 approaches"

Skill Process:
✅ Detect both PRs
✅ Resolve repo for both
✅ Evaluate: Comparison → both contexts needed
✅ Fetch #123 (full context)
✅ Fetch #456 (full context)
✅ Compare approaches based on summaries

Response:
"I've fetched both PRs. #123 uses session cookies for auth
while #456 uses JWT tokens. Key differences: [comparison analysis]..."
```

### Comparison with Jira Integration

| Feature | Jira Analyzer | PR Analyzer |
|---------|---------------|-------------|
| **Data Source** | Jira MCP tools | `gh` CLI (Bash) |
| **Typical Payload** | 10-15k tokens | 20-50k tokens |
| **Summary Size** | ~800 tokens | ~800-1000 tokens |
| **Token Savings** | ~75% | ~80-95% |
| **Auto-Detection** | jira-auto-detector Skill | gh-pr-auto-detector Skill |
| **Intent Classification** | No (always full) | Yes (reviews/CI/full) |
| **Context Resolution** | URL or issue key | Git remote detection |

---

## 📋 Specification Generation Architecture

### The Problem: Analysis to Implementation Gap

After problem analysis, there's often a gap between exploration (understanding the problem) and execution (implementing the solution):
- Analysis outputs multiple options - which one was chosen?
- Why was that approach selected over alternatives?
- What are the specific implementation steps?
- What are the testable acceptance criteria?
- How should this be tested and rolled out?

Without a formal spec, implementation can drift from the analyzed approach, decisions are forgotten, and there's no approval gate before coding begins.

### The Solution: Spec Generator Subagent

The plugin uses a **specialized subagent** (`spec-generator`) that operates in isolated context:

```
User invokes: /schovi:create-spec
       ↓
Command resolves input (conversation/Jira/file)
       ↓
Analysis content may be 5-20k tokens
       ↓
Spawns spec-generator subagent (Task tool)
       ↓
Subagent Context (Isolated):
  - Processes large analysis payload
  - Extracts technical details
  - Structures into template
  - Generates tasks and criteria
  - Burns tokens privately
       ↓
Returns polished spec (~1.5-2.5k tokens)
       ↓
Command handles output (terminal/file/Jira)
  (Main context stays clean!)
```

### Benefits

- **Context Isolation**: Analysis processing happens in subagent, main context stays clean
- **Structured Output**: Consistent spec format with all required sections
- **Decision Documentation**: Rationale preserved for future reference
- **Approval Gate**: Formal checkpoint before implementation begins
- **Flexible Input**: Works from conversation, Jira, files, or from scratch
- **Multiple Outputs**: Terminal display, file save, Jira posting

### Subagent: spec-generator

Located at: `schovi/agents/spec-generator/AGENT.md`

**Responsibilities:**
- Process analysis content in isolated context
- Extract technical details (flows, files, dependencies)
- Break down approach into actionable tasks
- Generate testable acceptance criteria
- Structure risks and mitigation strategies
- Return formatted markdown spec

**Input Format:**
```markdown
## Input Context

### Problem Summary
[Problem description]

### Chosen Approach
Option 2: [Solution name]
[Approach details]

### Technical Details
- Affected files: [file:line references]
- User flow: [flow description]
- Data flow: [flow description]

### Template Type
[full|minimal]
```

**Output Format:**
```markdown
---
jira_id: EC-1234
title: "Brief description"
status: "DRAFT"
approach_selected: "Option 2: Solution name"
---

# SPEC: EC-1234 Description

## Decision & Rationale
[Why this approach was chosen]

## Technical Overview
[Data flows, affected services]

## Implementation Tasks
- [ ] Phase 1 tasks
- [ ] Phase 2 tasks

## Acceptance Criteria
- [ ] Testable criteria

## Testing Strategy
[Unit, integration, manual tests]

## Risks & Mitigations
[Known risks and how to address them]
```

**Token Budget:** Max 3000 tokens output (typically ~1.5-2.5k)

### Workflow Integration

The spec-generator fits between analysis and implementation:

```
1. Problem Analysis (/analyze-problem)
   - Understand problem
   - Explore codebase
   - Propose options

2. Specification Creation (/create-spec)  ← NEW STEP
   - Choose approach
   - Document decision
   - Structure implementation
   - Define success criteria

3. Implementation (start-implementation)
   - Follow spec
   - Check off tasks
   - Verify criteria
```

This creates a clear handoff: analysis explores possibilities, spec documents decisions, implementation executes the plan.

---

## ⚙️ Configuration

### Model Selection

The plugin uses `sonnet` model by default for thorough analysis in the command frontmatter. To change the model for a specific command, edit the command's markdown file (e.g., `commands/analyze-problem.md`) and modify the `model:` field in the frontmatter.

### Allowed Tools

The plugin has access to:
- `Read`, `Grep`, `Glob` - Code exploration
- `Task` - Specialized agent invocation
- `mcp__jira__*` - Jira integration
- `mcp__jetbrains__*` - IDE integration
- `Bash` - Git history and system commands
- `AskUserQuestion` - Clarification questions

## 🔄 Integration with CLAUDE.md

This plugin is designed to replace Flow 1 in your `~/.claude/CLAUDE.md`:

**Before**:
```markdown
# Flow 1: Analyzing the Problem
## Phase 1: Deep Codebase Analysis
1. Explore desired data/user flow
2. Note affected files...
[...detailed steps...]
```

**After**:
```markdown
# Flow 1: Analyzing the Problem

**Usage**: `/analyze-problem [jira-id or description]`

The Problem Analyzer plugin handles comprehensive analysis. After completion:
- Review proposed solutions
- Ask "Create Jira task" if satisfied
- Switch to Flow 2 for implementation
```

## 📊 Output Format

Analysis results are presented in a structured, scannable format:

```
🎯 1. PROBLEM SUMMARY
   - Core issue, impact, urgency

📊 2. CURRENT STATE ANALYSIS
   - Affected components
   - User & data flows
   - Dependencies
   - Issues identified

💡 3. SOLUTION PROPOSALS
   - Option 1: [Details] ⭐ RECOMMENDED
   - Option 2: [Alternative]
   - Option 3: [Another option]

🛠️ 4. IMPLEMENTATION GUIDANCE
   - Recommended approach
   - Step-by-step plan
   - Testing requirements
   - Rollout strategy

📚 5. RESOURCES & REFERENCES
   - Code locations
   - Related issues
   - Documentation
   - Stakeholders
```

## 🤝 Contributing

To enhance this plugin:

1. Edit files in `~/work/claude-schovi/schovi/`
2. Test changes by running `/schovi:analyze-problem`
3. Commit to git: `cd ~/work/claude-schovi && git commit -am "Enhancement: ..."`
4. Share improvements with your team

### Adding New Commands

Create new commands in the `commands/` directory:

```bash
cat > commands/new-command.md <<'EOF'
---
description: Brief description of your command
argument-hint: [optional-args]
model: sonnet
---

# Your Command Instructions

Command workflow here...
EOF
```

Commands are automatically discovered by Claude Code - no registration needed!

### Adding Skills

For automatic invocation capabilities, create a `skills/` directory:

```bash
mkdir -p skills/my-skill
cat > skills/my-skill/SKILL.md <<EOF
---
name: my-skill
description: When to use this skill and what it does
---

Skill instructions here...
EOF
```

## 🐛 Troubleshooting

### Plugin Not Discovered

```bash
# Verify symlink
ls -la ~/.claude/plugins/schovi

# Should show (if using symlink method, but marketplace installation is preferred):
# schovi -> /Users/schovi/work/claude-schovi/schovi
```

### Jira Integration Not Working

1. Verify Jira MCP server is configured in Claude Code settings
2. Test Jira connection: `mcp__jira__atlassianUserInfo`
3. Check that your Jira credentials are valid

### GitHub PR Integration Not Working

1. Verify `gh` CLI is installed: `which gh`
2. Check authentication: `gh auth status`
3. If not authenticated: `gh auth login`
4. Test PR access: `gh pr view 123 --repo owner/repo`

### Analysis Incomplete

If analysis seems shallow:
- Check that the Task tool is available
- Verify allowed-tools in the command frontmatter
- Ensure the Plan subagent is accessible

## 📝 Version History

### v1.4.0 (Current)
- Refactored Analysis Generation
  - Context isolation for analysis generation via `analysis-generator` subagent
  - Analysis artifacts saved to files by default (`analysis-[jira-id].md`)
  - Support for quick vs full analysis modes (`--quick` flag)
  - Multiple output destinations (terminal/file/Jira)
  - New output flags: `--output PATH`, `--no-file`, `--quiet`, `--post-to-jira`
  - Consistent architecture with `create-spec` pattern
  - Token efficiency: 30-40% savings in main context
  - Analysis template (`templates/analysis-template.md`) documents structure
- Updated workflow: Analysis now produces reusable artifacts
- Matches create-spec pattern: Exploration → Subagent → Output Handling

### v1.3.0
- Added Implementation Execution
  - `/schovi:implement` command for autonomous task execution
  - Parse specs to extract implementation tasks and acceptance criteria
  - Execute tasks with full autonomy (no interruptions)
  - Phase-based git commits with descriptive messages
  - Project type detection (Node.js, Python, Go, Ruby, Rust)
  - Automatic validation (linting, type checking, tests)
  - Auto-fix validation issues when possible
  - Acceptance criteria verification
  - Uses Haiku model for efficient execution
  - Comprehensive error handling and progress reporting
- Updated workflow documentation in CLAUDE.md (Phase 4 added)
- Completes the workflow: Analysis → Spec → Implementation

### v1.2.0
- Added Specification Generation
  - `/schovi:create-spec` command for implementation spec generation
  - `spec-generator` subagent for context-isolated spec creation
  - Flexible input sources (conversation, Jira, file, from-scratch)
  - Multiple output options (terminal, file, Jira posting)
  - Full and minimal spec templates
  - Bridges analysis and implementation workflow
- Updated workflow documentation in CLAUDE.md (Phase 2 added)

### v1.1.0
- Added GitHub PR integration
  - `gh-pr-analyzer` subagent for context-isolated PR fetching
  - `gh-pr-auto-detector` skill for automatic PR detection
  - Intent classification (reviews/CI/full context)
  - Repository context detection from git remote
  - 75-80% token reduction for PR analysis
- Enhanced documentation with PR examples

### v1.0.0
- Initial release
- `/analyze-problem` command
- Smart clarification detection
- Deep codebase analysis workflow
- Multi-option solution proposals
- Jira integration (read-only)
  - `jira-analyzer` subagent
  - `jira-auto-detector` skill
- Sonnet model for thorough analysis

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

David Schovanec (david.schovanec@productboard.com)

---

**Note**: This plugin is part of a larger workflow system. See `~/.claude/CLAUDE.md` for Flow 2 (Implementation) and other workflows.
