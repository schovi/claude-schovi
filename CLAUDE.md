# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** providing workflow automation for software engineering tasks. It integrates Jira and GitHub PR analysis with deep codebase exploration capabilities.

**Key Innovation**: Context isolation architecture that reduces token consumption by 75-80% when fetching external data.

## Architecture

### Three-Tier Integration Pattern

The plugin uses a three-tier architecture for external integrations:

1. **Skills** (Auto-detection, `/schovi/skills/`): Automatically detect mentions and intelligently decide when to fetch context
2. **Commands** (Explicit, `/schovi/commands/`): User-invoked workflows like `/schovi:analyze`
3. **Subagents** (Execution, `/schovi/agents/`): Execute in isolated context windows to fetch and summarize external data

### Context Isolation Architecture

**The Problem**: Jira issues return ~10-15k tokens, GitHub PRs return 20-50k tokens. This pollutes the main context window.

**The Solution**: Subagents execute in isolated contexts:
```
Main Context → Spawn Subagent (Task tool) → Isolated Context (fetch 10-50k payload)
→ Extract essence (~800 tokens) → Return to Main Context
```

**Result**: 75-80% token savings, keeping main context clean for codebase analysis.

## Plugin Structure

```
schovi/
├── .claude-plugin/plugin.json    # Plugin metadata
├── commands/
│   ├── analyze.md        # Deep problem analysis workflow
│   ├── debug.md          # Deep debugging workflow with root cause analysis
│   ├── plan.md            # Specification generation workflow
│   ├── implement.md              # Implementation execution workflow
│   ├── commit.md                 # Structured git commit creation
│   ├── publish.md              # GitHub pull request creation
│   └── review.md                 # Comprehensive code review with issue detection
├── agents/                        # Context-isolated execution
│   ├── jira-analyzer/AGENT.md    # Fetch & summarize Jira (max 1000 tokens)
│   ├── gh-pr-analyzer/AGENT.md   # Fetch & summarize GitHub PR (compact: max 1200, full: max 2000 tokens)
│   ├── gh-issue-analyzer/AGENT.md # Fetch & summarize GitHub issues (max 1000 tokens)
│   ├── spec-generator/AGENT.md   # Generate implementation specs (max 3000 tokens)
│   └── debug-fix-generator/AGENT.md # Generate fix proposals from debugging (max 2500 tokens)
└── skills/                        # Auto-detection intelligence
    ├── jira-auto-detector/SKILL.md   # Detects EC-1234, IS-8046, etc.
    └── gh-pr-auto-detector/SKILL.md  # Detects PR URLs, owner/repo#123, #123
```

## Key Components

### Command: `/schovi:analyze`

**Location**: `schovi/commands/analyze.md`

**Purpose**: Comprehensive problem analysis with codebase exploration

**Workflow**:
1. **Phase 1: Input Processing** - Parse Jira ID, GitHub issue, GitHub PR, or description; fetch details via appropriate subagent
2. **Phase 2: Deep Codebase Analysis** - Use Task tool with Plan subagent to map user flows, data flows, dependencies, code quality
3. **Phase 3: Structured Output** - Problem summary, current state, 2-3 solution proposals with pros/cons, implementation guidance

**Input Sources**:
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Free-form descriptions

**Quality Gates** (all must be met):
- All affected files with `file:line` references
- Complete user and data flow diagrams
- Full dependency mapping (direct, indirect, integrations)
- At least 2 solution options with comprehensive pros/cons analysis
- Actionable implementation plan with testing and rollout strategies

### Command: `/schovi:plan`

**Location**: `schovi/commands/plan.md`

**Purpose**: Generate implementation specifications from problem analysis. **Does NOT perform analysis** - transforms existing analysis into actionable specs.

**⚠️ CRITICAL**: **Analysis-first requirement** - Plan command enforces strict workflow:
- Accepts ONLY analyzed inputs (analysis files, conversation analysis, or from-scratch)
- REJECTS raw inputs (Jira IDs, GitHub URLs) with clear guidance to run `/schovi:analyze` first
- This ensures specs have specific file:line references and technical context

**Workflow**:
1. **Phase 1: Input Validation** - Classify input type; STOP if raw input detected, direct user to analyze first
2. **Phase 1 (cont): Extract Analysis** - Read from file or conversation; validate has file:line refs
3. **Phase 1.5: Optional Enrichment** - Ask user if they want to enrich vague component references via Explore subagent
4. **Phase 2: Spec Generation** - Use `spec-generator` subagent to transform analysis into structured spec
5. **Phase 3: Output Handling** - Terminal, file, optional Jira posting

**Valid Input Sources**:
- Analysis file via `--input ./analysis-EC-1234.md`
- Conversation output from recent `/schovi:analyze` command
- From-scratch via `--from-scratch "description"` (bypasses analysis, creates minimal spec)

**Invalid Input Sources** (will STOP with guidance):
- Jira IDs (EC-1234) - **Must run** `/schovi:analyze EC-1234` **first**
- GitHub issue/PR URLs - **Must analyze first**
- Free-form descriptions without `--from-scratch` flag
- Empty/no arguments without recent analysis in conversation

**Key Features**:
- **Strict validation**: Enforces analyze → plan workflow for quality
- **Optional enrichment**: Can fill gaps in analysis using Explore subagent (with user permission)
- **Context isolation**: Uses spec-generator subagent to prevent token pollution
- **Multiple outputs**: Terminal, file (default: `./spec-[id].md`), optional Jira comment
- **Template flexibility**: Full template (with analysis) or minimal (from-scratch mode)

**Enrichment Phase** (new in Phase 1.5):
- Detects if analysis lacks specific file:line references
- Asks user permission before enriching via Explore subagent
- Quick targeted search (20-40s) to find missing file locations
- User can approve, skip, or provide locations manually

**Example Usage**:
```bash
# Wrong: Raw Jira ID (will STOP with guidance)
/schovi:plan EC-1234  ❌

# Right: Analyze first, then plan
/schovi:analyze EC-1234
/schovi:plan --input ./analysis-EC-1234.md  ✅

# Or use conversation
/schovi:analyze EC-1234
/schovi:plan  ✅ (auto-detects from conversation)

# Or from-scratch for simple tasks
/schovi:plan --from-scratch "Add loading spinner"  ✅
```

**Quality Gates** (all must be met):
- Input validated as analyzed (not raw)
- Analysis content successfully extracted
- Chosen approach identified (if multiple options)
- Spec generated via spec-generator subagent
- Implementation tasks are specific and actionable
- Acceptance criteria are testable
- File references use `file:line` format

### Command: `/schovi:debug`

**Location**: `schovi/commands/debug.md`

**Purpose**: Deep debugging workflow with root cause analysis and single fix proposal

**Workflow**:
1. **Phase 1: Input Processing & Context Gathering** - Parse Jira ID, GitHub issue, GitHub PR, Datadog trace, or error description; fetch details via appropriate subagent
2. **Phase 2: Deep Debugging & Root Cause Analysis** - Use Task tool with Explore subagent to trace execution flow, identify error point, and determine root cause
3. **Phase 3: Fix Proposal Generation** - Use debug-fix-generator subagent to create structured fix with code changes, testing, and rollout plan

**Input Sources**:
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Datadog traces (via `datadog-analyzer` subagent when available)
- Error messages, stack traces, logs (parsed directly)
- Free-form problem descriptions

**Key Differences from Analyze**:
- **Focus**: Debugging and root cause identification (vs. solution exploration)
- **Output**: Single targeted fix proposal (vs. 2-3 solution options)
- **Approach**: Execution flow tracing and error point analysis (vs. comprehensive problem analysis)
- **Result**: Actionable fix with code changes (vs. high-level solution proposals)

**Quality Gates** (all must be met):
- Error point analyzed with immediate cause
- Execution flow traced from entry to error with file:line references
- Root cause identified with category and explanation
- Impact assessed (severity, scope, data risk)
- Fix location identified with specific file:line
- Code changes provided (before/after)
- Testing strategy with concrete test cases
- Rollout plan with deployment and rollback steps

### Command: `/schovi:commit`

**Location**: `schovi/commands/commit.md`

**Purpose**: Create structured git commits with validation, smart analysis, and conventional format

**Workflow**:
1. **Phase 1: Input Parsing** - Detect Jira ID, GitHub issue/PR, custom notes, or auto-detect changes
2. **Phase 2: Git State Validation** - Check branch (block main/master), validate branch naming, check for conflicts
3. **Phase 3: Staging & Analysis** - Auto-stage changes (or use staged-only), analyze diff to determine commit type
4. **Phase 4: Optional Context Fetching** - Fetch external context (Jira/GitHub) only if diff analysis unclear
5. **Phase 5: Message Generation** - Create conventional commit with title, description, bullet points, references
6. **Phase 6: Commit & Verification** - Execute commit with HEREDOC format, verify success

**Input Options**:
- Jira ID (EC-1234)
- GitHub issue/PR (URL or owner/repo#123)
- Custom notes (free-form text)
- Flags: --message, --staged-only, --type

**Key Features**:
- **Conventional Commits**: Auto-detect type (feat, fix, chore, refactor, docs, test, style, perf)
- **Branch Validation**: Blocks main/master commits, warns on branch/Jira mismatch
- **Smart Analysis**: Analyzes git diff to generate descriptive multi-line messages
- **Change Intelligence**: Determines commit type from file paths, diff content, and keywords
- **Optional Context**: Fetches Jira/GitHub context only when needed (defers to diff analysis)

**Commit Message Format**:
```
PREFIX: Title (50-72 chars)

Description paragraph explaining problem/solution/changes

- Bullet point of specific change
- Bullet point of specific change
- Bullet point of specific change

Related to: [Reference]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Integration**: Can be used standalone or called from implement flow for phase-based commits

### Command: `/schovi:publish`

**Location**: `schovi/commands/publish.md`

**Purpose**: Create or update GitHub pull requests with automated branch pushing and smart description generation

**Workflow**:
1. **Phase 1: Input Parsing** - Parse Jira ID, spec file, flags; auto-detect from branch name
2. **Phase 2: Git State Validation** - Check branch (block main/master), validate naming, check uncommitted changes, detect existing PR
3. **Phase 3: Branch Pushing** - Auto-push with upstream tracking, verify push succeeded
4. **Phase 4: Description Source Detection** - Search for spec file → Jira issue → commit history
5. **Phase 5: PR Description Generation** - Create structured description (Problem/Solution/Changes/Other)
6. **Phase 6: PR Title Generation** - Format with Jira ID or from commits (50-100 chars)
7. **Phase 7: PR Creation/Update & Verification** - Execute gh pr create (draft by default) or gh pr edit for updates, verify, display URL, run confetti

**Input Options**:
- Jira ID (EC-1234)
- Spec file path (./spec-EC-1234.md)
- Flags: --ready, --base, --title, --no-push, --spec

**Key Features**:
- **Draft by Default**: Creates draft PRs by default for safer workflow, use --ready for ready PRs
- **Update Support**: Automatically detects and updates existing PRs when called multiple times
- **Auto-Push**: Always push branch before creating/updating PR (unless --no-push)
- **Smart Description**: Auto-detects best source (spec → Jira → commits priority)
- **Concise Format**: Problem/Solution/Changes/Quality & Impact (target 150-250 words, human-readable)
- **Branch Validation**: Blocks main/master, warns on naming mismatch
- **Clean State**: Requires no uncommitted changes
- **Confetti**: Runs confetti celebration on successful PR creation or update

**Description Source Intelligence**:
```
Priority 1: Spec file (./spec-EC-1234.md)
  - Problem: 2-3 sentences from spec Problem section
  - Solution: Single paragraph from Technical Overview (no subsections)
  - Changes: Grouped bullets from Implementation Tasks (no phases)
  - Quality & Impact: Combined testing/breaking/rollback from Testing Strategy

Priority 2: Jira issue (via jira-analyzer)
  - Problem: Condensed from issue description
  - Changes: Simplified from acceptance criteria
  - Solution: Brief approach from commits + context
  - Quality & Impact: From issue comments + analysis

Priority 3: Commit history (git log)
  - Problem: Inferred from commit summary
  - Changes: Key commits as bullets
  - Solution: Technical approach from analysis
  - Quality & Impact: Minimal (encourages manual update)

Brevity Principles: Remove phase numbering, file:line details, exhaustive lists,
verbose explanations. Focus on WHAT changed for human readers, not execution HOW.
```

**PR Creation Format**:
```bash
# Default: Draft PR
gh pr create --draft --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"

# With --ready flag: Ready PR
gh pr create --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"
```

**PR Update Format**:
```bash
# Update description
gh pr edit <number> --body "$(cat <<'EOF' ... EOF)"

# Update title (if --title flag)
gh pr edit <number> --title "New title"

# Convert draft to ready (if --ready flag)
gh pr ready <number>
```

**Integration**: Standalone manual command (not auto-executed by implement)

### Command: `/schovi:review`

**Location**: `schovi/commands/review.md`

**Purpose**: Comprehensive code review with issue detection and improvement suggestions. Focused on GitHub PRs but supports Jira tickets, GitHub issues, and documents.

**Workflow**:
1. **Phase 1: Input Parsing & Classification** - Parse and classify input (PR, Jira, issue, file, free-form)
2. **Phase 2: Context Fetching** - Use appropriate subagent to fetch context (gh-pr-analyzer, jira-analyzer, gh-issue-analyzer)
3. **Phase 2.5: Source Code Fetching** - Fetch actual source files for code-level analysis (local filesystem, JetBrains MCP, or GitHub API)
4. **Phase 3: Review Analysis** - Direct code analysis on fetched files with deep exploration (default) or quick review (--quick flag)
5. **Phase 4: Structured Output** - Terminal-only output with summary, key changes, issues, improvements

**Input Sources**:
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- File paths (via Read tool)
- Free-form descriptions

**Review Modes**:
- **Deep Review** (default): Comprehensive analysis with actual source code fetching and exploration
  - Fetches up to 10 source files via local filesystem, JetBrains MCP, or GitHub API
  - Direct code analysis on fetched files (not just summaries)
  - Fetches related dependencies and test files
  - Multi-dimensional analysis (functionality, quality, security, performance, testing, architecture)
  - Code-specific issue detection (TODO comments, console.log, hardcoded values, etc.)
  - Security focus with actual code inspection (SQL injection, XSS, auth issues, data leaks)
  - Optional Explore subagent for additional context
  - Takes 2-5 minutes
- **Quick Review** (--quick): Lighter analysis with minimal file fetching
  - Fetches up to 3 most important files or uses diff only
  - No dependency exploration
  - Context-based analysis with limited code inspection
  - Focus on obvious issues and high-level patterns
  - Takes 30-60 seconds

**Key Features**:
- **Actual Source Code Analysis**: Fetches and reviews real source files (not just PR descriptions)
- **Multi-source Fetching**: Local filesystem (preferred), JetBrains MCP, or GitHub API fallback
- **Smart File Prioritization**: Fetches most relevant files based on changes and impact
- **Dependency Exploration**: Discovers and analyzes related files and test coverage
- **Terminal Output Only**: No file creation, no work folder integration
- **Security Focus**: Code-level vulnerability detection (SQL injection, XSS, auth issues)
- **Code-Specific Issues**: Detects TODO comments, debug statements, hardcoded values
- **Severity Classification**: Issues categorized as Critical/Medium/Minor
- **Actionable Feedback**: Specific file:line references from actual code
- **Multi-dimensional Analysis**: Functionality, quality, security, performance, testing, architecture

**Output Structure**:
```
# 🔍 Code Review: [Input Identifier]

## 📝 Summary
[2-3 sentence overview and overall assessment]

## 🔍 Key Changes/Information
- Bullet points with file:line references

## ⚠️ Potential Issues
### 🚨 Critical / ⚠️ Medium / 💭 Minor
- Issues with file:line and explanation

## 💡 Improvement Suggestions
1-5 actionable suggestions with benefits

## 🎯 Overall Assessment
[Approve with minor changes / Needs work / Blocked by issues]
```

**Example Usage**:
```bash
# Deep review of GitHub PR
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123

# Quick review
/schovi:review #123 --quick

# Review Jira ticket
/schovi:review EC-1234

# Review local file
/schovi:review ./spec-EC-1234.md
```

**Quality Gates** (all must be met):
- Context successfully fetched from external sources
- Source code fetched via local/JetBrains/GitHub (with method reported to user)
- Analysis completed on actual code (deep or quick mode)
- At least 3 key changes/info points identified with specific code references
- Issues section populated with code-level findings or marked as none found
- Security analysis performed on fetched code
- 2-5 improvement suggestions provided with specific file:line references
- File references use `file:line` format for all code mentions
- Overall assessment with clear recommendation

**Integration**: Standalone command (not integrated with implement/debug workflows)

### Subagents

**jira-analyzer** (`schovi/agents/jira-analyzer/AGENT.md`):
- Input: Jira URL or issue key (EC-1234)
- Uses: `mcp__jira__*` tools
- Output: ~800 token summary (core info, description condensed to 500 chars, acceptance criteria max 5, key comments max 3)
- Token budget: Max 1000 tokens

**gh-pr-analyzer** (`schovi/agents/gh-pr-analyzer/AGENT.md`):
- Input: PR URL, `owner/repo#123`, or `#123` + optional `mode` parameter
- Uses: `gh` CLI and GitHub API via Bash tool
- Modes:
  - **Compact** (default): ~800-1000 tokens (top 20 files, max 3 reviews, failed CI only, max 1200 tokens)
  - **Full** (for review): ~1200-1500 tokens (ALL files with stats, all reviews, all CI checks, PR head SHA, max 2000 tokens)
- Output: Condensed summary with mode-specific detail level
- Used by: analyze/debug/plan (compact), review (full)

**gh-issue-analyzer** (`schovi/agents/gh-issue-analyzer/AGENT.md`):
- Input: GitHub issue URL or `owner/repo#123`
- Uses: `gh` CLI via Bash tool
- Output: ~600-800 token summary (core info, description 500 chars, labels, assignees, max 5 key comments, analysis notes)
- Token budget: Max 1000 tokens

**spec-generator** (`schovi/agents/spec-generator/AGENT.md`):
- Input: Analysis content (problem, approach, technical details)
- Uses: Read tool only
- Output: ~1500-2500 token spec (structured markdown with tasks, criteria, testing, risks)
- Token budget: Max 3000 tokens

**debug-fix-generator** (`schovi/agents/debug-fix-generator/AGENT.md`):
- Input: Debugging results (error point, execution flow, root cause, impact, fix location)
- Uses: None (pure transformation)
- Output: ~1500-2000 token fix proposal (problem summary, root cause, code changes, testing, rollout)
- Token budget: Max 2500 tokens
- Purpose: Transform debugging results into single, actionable fix proposal with before/after code

### Skills

**jira-auto-detector** (`schovi/skills/jira-auto-detector/SKILL.md`):
- Pattern: `[A-Z]{2,10}-\d{1,6}` (EC-1234, IS-8046)
- Intelligence: Fetch when user asks about issue, skip past tense ("fixed EC-1234"), reuse already-fetched context

**gh-pr-auto-detector** (`schovi/skills/gh-pr-auto-detector/SKILL.md`):
- Pattern: Full URLs, `owner/repo#123`, `#123`, "PR #123"
- Intent classification: Full context, reviews focus, CI focus, or minimal
- Repository resolution: Extracts from git remote for `#123` patterns

## Development Workflow

### Installation

```bash
# Add marketplace
/plugin marketplace add ~/work/claude-schovi

# Install plugin
/plugin install schovi@schovi-workflows
```

### Making Changes

**No build system** - This is a pure markdown-based plugin. Changes take effect immediately.

```bash
# Edit files in schovi/ directory
cd /Users/schovi/work/claude-schovi/schovi/

# Changes are live - reload Claude Code or test command
/schovi:analyze test-input

# Commit and push
git add .
git commit -m "Description of changes"
git push
```

### Testing

- Manual testing via `/schovi:analyze [input]`
- Test with real Jira issues: `EC-1234` format
- Test with GitHub PRs: `owner/repo#123` or `#123`
- Verify token reduction by checking context usage

## Plugin System Specifics

### Command Structure
```markdown
---
description: Brief description
argument-hint: [optional-args]
allowed-tools: ["Tool1", "Tool2"]
---

# Command Instructions
[Markdown instructions for Claude to execute]
```

### Skill Structure
```markdown
---
name: skill-name
description: When to use
---

# Skill Instructions
[Intelligence layer - when to activate, how to use]
```

### Subagent Structure
```markdown
---
name: agent-name
allowed-tools: ["Tool1", "Tool2"]
---

# Agent Instructions
[Execution layer - pure logic, no intelligence]
```

### Spawning Subagents

**From commands or skills**, use Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  prompt: "Fetch and summarize Jira issue EC-1234"
  description: "Fetching Jira issue summary"
```

**Important**: Use fully qualified format `plugin:skill:agent` (e.g., `schovi:jira-analyzer:jira-analyzer`), NOT just `jira-analyzer`.

## Key Patterns and Conventions

### Code References
Always use `file:line` format for specificity and navigation:
- ✅ `src/api/controller.ts:123`
- ❌ `src/api/controller.ts` (too vague)

### Markdown Formatting
- Section headers: Use emojis (🎯, 📊, 💡, 🛠️, 📚)
- Pros/Cons: ✅ for advantages, ⚠️ for trade-offs
- Status indicators: ✅ passing, ❌ failing, ⏳ pending, 💬 comment

### Token Budgets (Strict)
- Jira summaries: **Max 1000 tokens**
- PR summaries: **Max 1200 tokens**
- Always condense, never return raw payloads to main context

## External Dependencies

### Required
- **MCP Server: Jira** - For Jira integration (`mcp__jira__*` tools)
- **GitHub CLI (`gh`)** - For PR and issue integration, must be authenticated (`gh auth login`)

### Optional
- **MCP Server: JetBrains** - Enhanced IDE integration (`mcp__jetbrains__*` tools)

### Configuration
- Default Jira Cloud ID: `productboard.atlassian.net`
- GitHub repo resolution: Extracted from `git remote` for `#123` patterns

## Extending the Plugin

### Adding New Integrations

Follow the proven three-tier pattern:

1. **Create Subagent** (`agents/new-service-analyzer/AGENT.md`):
   - Allowed tools for API/CLI access
   - Fetch and condense to ~800-1000 tokens
   - Set strict token budget

2. **Create Skill** (`skills/new-service-auto-detector/SKILL.md`):
   - Pattern detection (regex, keywords)
   - Intelligence for when to fetch
   - Call subagent via Task tool

3. **Optional Command** (`commands/new-workflow.md`):
   - Structured workflow using the subagent
   - Multi-phase execution
   - Quality gates

### Critical Rules

1. **Context Isolation**: ALWAYS use subagents for large API fetches (>5k tokens)
2. **Token Budgets**: Set and enforce max token limits for summaries
3. **Fully Qualified Names**: Use `plugin:skill:agent` format when spawning subagents
4. **Reuse Context**: Skills should check if data already fetched in conversation
5. **Quality Gates**: Commands should have checklists before presenting output

## Important File Paths

**Core Plugin**:
- Metadata: `schovi/.claude-plugin/plugin.json`
- README: `schovi/README.md`

**Commands**:
- `schovi/commands/analyze.md`
- `schovi/commands/debug.md`
- `schovi/commands/plan.md`
- `schovi/commands/implement.md`
- `schovi/commands/commit.md`
- `schovi/commands/publish.md`
- `schovi/commands/review.md`

**Skills**:
- `schovi/skills/jira-auto-detector/SKILL.md`
- `schovi/skills/gh-pr-auto-detector/SKILL.md`

**Subagents**:
- `schovi/agents/jira-analyzer/AGENT.md`
- `schovi/agents/gh-pr-analyzer/AGENT.md`
- `schovi/agents/gh-issue-analyzer/AGENT.md`
- `schovi/agents/spec-generator/AGENT.md`
- `schovi/agents/debug-fix-generator/AGENT.md`

**Marketplace**:
- `.claude-plugin/marketplace.json`
