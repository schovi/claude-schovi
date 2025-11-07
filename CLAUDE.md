# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** providing workflow automation for software engineering tasks. It integrates Jira and GitHub PR analysis with deep codebase exploration capabilities.

**Key Innovation**: Context isolation architecture that reduces token consumption by 75-80% when fetching external data.

## Architecture

### Three-Tier Integration Pattern

The plugin uses a three-tier architecture for external integrations:

1. **Skills** (Auto-detection, `/schovi/skills/`): Automatically detect mentions and intelligently decide when to fetch context
2. **Commands** (Explicit, `/schovi/commands/`): User-invoked workflows like `/schovi:brainstorm`, `/schovi:research`, `/schovi:plan`
3. **Subagents** (Execution, `/schovi/agents/`): Execute in isolated context windows to fetch and summarize external data

### Context Isolation Architecture

**The Problem**: Jira issues return ~10-15k tokens, GitHub PRs return 20-50k tokens. This pollutes the main context window.

**The Solution**: Subagents execute in isolated contexts:
```
Main Context → Spawn Subagent (Task tool) → Isolated Context (fetch 10-50k payload)
→ Extract essence (~800 tokens) → Return to Main Context
```

**Result**: 75-80% token savings, keeping main context clean for codebase analysis.

### Shared Libraries Architecture

**The Problem**: Commands had 60-70% code duplication, with common operations (argument parsing, input fetching, work folder management) copy-pasted across 4-7 commands.

**The Solution**: Shared library system providing reusable abstractions:
```
Command (brainstorm.md) → References → Library (argument-parser.md)
                                     ↓
                               Claude reads library
                                     ↓
                               Executes logic
                                     ↓
                               Returns to command
```

**Result**: 77% code reduction (1,980 duplicate lines → 450 library lines), faster development, consistent behavior.

**Available Libraries** (`schovi/lib/`):
- **argument-parser.md** (~80 lines): Standardized argument parsing with validation
- **input-processing.md** (~200 lines): Unified context fetching from Jira/GitHub/Datadog/text
- **work-folder.md** (~483 lines): Work folder resolution and metadata management
- **subagent-invoker.md** (~70 lines): Standardized subagent invocation with error handling
- **phase-template.md** (~300 lines): Standard command phase structure for consistency (Phase 3)
- **code-fetcher.md** (~80 lines): Unified source code fetching with fallback strategies (Phase 3)
- **COMMAND-TEMPLATE.md** (~200 lines): Template and guide for rapid new command development (Phase 3)

**Benefits**:
- ✅ Single source of truth (bug fixes apply everywhere)
- ✅ Consistent user experience across commands
- ✅ 80% faster development of new commands
- ✅ Token efficient (libraries read on-demand, not injected)

**See**: `schovi/lib/README.md` for detailed documentation

## Plugin Structure

```
schovi/
├── .claude-plugin/plugin.json    # Plugin metadata
├── lib/                           # Shared libraries
│   ├── README.md                  # Library system documentation
│   ├── argument-parser.md         # Standardized argument parsing (~80 lines)
│   ├── input-processing.md        # Unified context fetching (~200 lines)
│   ├── work-folder.md             # Work folder management (~483 lines)
│   ├── subagent-invoker.md        # Subagent invocation patterns (~70 lines)
│   ├── phase-template.md          # Standard command phase structure (~300 lines) [Phase 3]
│   ├── code-fetcher.md            # Source code fetching with fallback (~80 lines) [Phase 3]
│   └── COMMAND-TEMPLATE.md        # Command template and development guide (~200 lines) [Phase 3]
├── templates/                     # Output structure templates (read by agents)
│   ├── brainstorm/                # Brainstorm templates for brainstorm command
│   │   └── full.md                # Solution options structure (expandable with variants)
│   ├── research/                  # Research templates for research command
│   │   └── full.md                # Deep technical analysis structure (expandable with variants)
│   └── spec/                      # Specification templates for plan command
│       └── full.md                # Implementation spec structure (expandable with variants)
├── commands/
│   ├── brainstorm.md     # Explore 2-3 solution options with broad analysis
│   ├── research.md       # Deep technical analysis of ONE specific approach
│   ├── debug.md          # Deep debugging workflow with root cause analysis
│   ├── plan.md           # Specification generation workflow
│   ├── implement.md      # Implementation execution workflow
│   ├── commit.md         # Structured git commit creation
│   ├── publish.md        # GitHub pull request creation
│   └── review.md         # Comprehensive code review with issue detection
├── agents/                        # Context-isolated execution
│   ├── TEMPLATE.md                # Standard subagent template [Phase 3]
│   ├── jira-analyzer/AGENT.md    # Fetch & summarize Jira (max 1000 tokens)
│   ├── gh-pr-analyzer/AGENT.md   # Fetch & summarize GitHub PR compact mode (max 1200 tokens) [Phase 3]
│   ├── gh-pr-reviewer/AGENT.md   # Fetch comprehensive PR data for review (max 15000 tokens) [Phase 3]
│   ├── gh-issue-analyzer/AGENT.md # Fetch & summarize GitHub issues (max 1000 tokens)
│   ├── brainstorm-generator/AGENT.md # Generate 2-3 solution options (max 3500 tokens)
│   ├── research-generator/AGENT.md # Generate deep technical analysis (max 6500 tokens)
│   ├── spec-generator/AGENT.md   # Generate implementation specs (max 3000 tokens)
│   └── debug-fix-generator/AGENT.md # Generate fix proposals from debugging (max 2500 tokens)
└── skills/                        # Auto-detection intelligence
    ├── jira-auto-detector/SKILL.md   # Detects EC-1234, IS-8046, etc.
    └── gh-pr-auto-detector/SKILL.md  # Detects PR URLs, owner/repo#123, #123
```

## Key Components

### Command: `/schovi:brainstorm`

**Location**: `schovi/commands/brainstorm.md`

**Purpose**: Explore 2-3 distinct solution options with broad feasibility analysis

**Workflow**:
1. **Phase 1: Input Processing** - Parse Jira ID, GitHub issue, GitHub PR, or description; fetch details via appropriate subagent
2. **Phase 2: Light Codebase Exploration** - Use Task tool with Plan subagent (medium thoroughness) for broad understanding
3. **Phase 3: Generate Solution Options** - Use `brainstorm-generator` subagent to create 2-3 distinct approaches with pros/cons
4. **Phase 4: Output Handling** - Save to work folder, display summary, guide to research command

**Input Sources**:
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Files or free-form descriptions

**Output** (~2000-3000 tokens):
- Problem summary and constraints
- 2-3 distinct solution options (not variations)
- Comparison matrix (effort, risk, complexity, etc.)
- Recommendation with reasoning
- Next steps: Guide to research command

**Quality Gates** (all must be met):
- Light exploration completed (2-4 minutes, medium mode)
- 2-3 distinct options generated (different approaches, not variations)
- Each option has benefits, challenges, feasibility, effort, risk
- Comparison matrix with consistent criteria
- One option recommended with clear reasoning
- Output saved to work folder as `brainstorm-[id].md`

### Command: `/schovi:research`

**Location**: `schovi/commands/research.md`

**Purpose**: Deep technical analysis of ONE specific approach with detailed file:line references

**Workflow**:
1. **Phase 1: Input Classification** - Parse `--input` (brainstorm file, Jira ID, GitHub URL, file, text) and extract research target
2. **Phase 1 (cont): Option Selection** - If brainstorm file, extract option via `--option N` flag or ask user interactively
3. **Phase 2: Deep Codebase Exploration** - Use Task tool with Plan subagent (thorough mode) for comprehensive analysis
4. **Phase 3: Generate Deep Research** - Use `research-generator` subagent to create detailed technical analysis
5. **Phase 4: Output Handling** - Save to work folder, display summary, guide to plan command

**Input Sources**:
- Brainstorm files with `--option N` flag (e.g., `--input brainstorm-EC-1234.md --option 2`)
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues/PRs (via respective subagents)
- Files or direct descriptions

**Output** (~4000-6000 tokens):
- Problem/topic summary with research focus
- Current state analysis with file:line references
- Architecture overview and component interactions
- Technical deep dive (data flow, dependencies, code quality)
- Implementation considerations (complexity, testing, risks)
- Performance and security implications
- Next steps: Guide to plan command

**Quality Gates** (all must be met):
- Deep exploration completed (4-6 minutes, thorough mode)
- Architecture mapped with file:line references
- Dependencies identified (direct and indirect)
- Data flow traced with file:line references
- Code quality assessed with specific examples
- Implementation considerations provided (complexity, risks, testing)
- Performance and security analyzed
- Output saved to work folder as `research-[id].md` or `research-[id]-option[N].md`

### Command: `/schovi:plan`

**Location**: `schovi/commands/plan.md`

**Purpose**: Generate implementation specifications from research analysis. **Does NOT perform research** - transforms existing research into actionable specs.

**⚠️ CRITICAL**: **Research-first requirement** - Plan command enforces strict workflow:
- Accepts ONLY research files, conversation research, or from-scratch mode
- REJECTS brainstorm files with guidance to run research first
- REJECTS raw inputs (Jira IDs, GitHub URLs) with guidance to run brainstorm → research first
- This ensures specs have specific file:line references and technical context

**Workflow**:
1. **Phase 1: Input Validation** - Classify input type; STOP if brainstorm/raw input detected, direct user to research first
2. **Phase 1 (cont): Extract Research** - Read from file or conversation; validate has file:line refs
3. **Phase 1.5: Optional Enrichment** - Ask user if they want to enrich vague component references via Explore subagent
4. **Phase 2: Spec Generation** - Use `spec-generator` subagent to transform research into structured spec
5. **Phase 3: Output Handling** - Terminal, file, optional Jira posting

**Valid Input Sources**:
- Research file via `--input ./research-EC-1234.md`
- Analysis file via `--input ./analysis-EC-1234.md` (legacy, backward compatibility)
- Conversation output from recent `/schovi:research` command
- From-scratch via `--from-scratch "description"` (bypasses research, creates minimal spec)

**Invalid Input Sources** (will STOP with guidance):
- Brainstorm files (brainstorm-*.md) - **Must run** `/schovi:research --input brainstorm-*.md --option N` **first**
- Jira IDs (EC-1234) - **Must run** `/schovi:research --input EC-1234` **first** (or brainstorm first)
- GitHub issue/PR URLs - **Must research first**
- Free-form descriptions without `--from-scratch` flag
- Empty/no arguments without recent research in conversation

**Key Features**:
- **Strict validation**: Enforces brainstorm → research → plan workflow for quality
- **Optional enrichment**: Can fill gaps in research using Explore subagent (with user permission)
- **Context isolation**: Uses spec-generator subagent to prevent token pollution
- **Multiple outputs**: Terminal, file (default: `./spec-[id].md`), optional Jira comment
- **Template flexibility**: Full template (with research) or minimal (from-scratch mode)
- **Brainstorm rejection**: Clear error message guiding user to research command

**Enrichment Phase** (optional):
- Detects if research lacks specific file:line references
- Asks user permission before enriching via Explore subagent
- Quick targeted search (20-40s) to find missing file locations
- User can approve, skip, or provide locations manually

**Example Usage**:
```bash
# Wrong: Brainstorm file (will STOP with guidance)
/schovi:plan --input brainstorm-EC-1234.md  ❌

# Wrong: Raw Jira ID (will STOP with guidance)
/schovi:plan EC-1234  ❌

# Right: Full workflow
/schovi:brainstorm EC-1234
/schovi:research --input brainstorm-EC-1234.md --option 2
/schovi:plan --input research-EC-1234-option2.md  ✅

# Or skip brainstorm, go direct to research
/schovi:research --input EC-1234
/schovi:plan --input research-EC-1234.md  ✅

# Or use conversation
/schovi:research --input EC-1234
/schovi:plan  ✅ (auto-detects from conversation)

# Or from-scratch for simple tasks
/schovi:plan --from-scratch "Add loading spinner"  ✅
```

**Quality Gates** (all must be met):
- Input validated as research (not brainstorm or raw)
- Research content successfully extracted
- Chosen approach identified (if multiple options in research)
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

**Key Differences from Brainstorm/Research**:
- **Focus**: Debugging and root cause identification (vs. solution exploration or technical analysis)
- **Output**: Single targeted fix proposal (vs. 2-3 solution options or deep research)
- **Approach**: Execution flow tracing and error point analysis (vs. broad exploration or deep architecture analysis)
- **Result**: Actionable fix with code changes (vs. high-level solution proposals or technical implementation considerations)

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
- **Holistic Assessment**: Risk, Security, and Performance sections always included
- **Priority-Based Issues**: Organizes by urgency (Must Fix / Should Fix / Consider) with Action items
- **Clear Verdict**: Explicit merge decision with criteria checklist and estimated fix time
- **Terminal Output Only**: No file creation, no work folder integration
- **Security Focus**: Code-level vulnerability detection (SQL injection, XSS, auth issues)
- **Code-Specific Issues**: Detects TODO comments, debug statements, hardcoded values
- **Actionable Feedback**: Specific file:line references with Action recommendations
- **Multi-dimensional Analysis**: Functionality, quality, security, performance, testing, architecture

**Output Structure**:
```
# 🔍 Code Review: [Input Identifier]

## 📝 Summary
[2-3 sentence overview and overall assessment]

## 🎯 Risk Assessment
**Risk Level:** Low/Medium/High
- Technical risk factors, test coverage, deployment risk

## 🔒 Security Review
✅ No concerns / ⚠️ Concerns identified
- Verified security patterns or specific issues

## ⚡ Performance Impact
✅ No concerns / ⚠️ Concerns identified
- Database queries, memory handling, algorithm efficiency

## 🔍 Key Changes/Information
- **2-5 word title**
  - Short detail with file:line reference

## ⚠️ Issues Found
### 🚨 Must Fix
1. **Issue** (file:line) - **Action:** Fix recommendation

### ⚠️ Should Fix
2. **Issue** (file:line) - **Action:** Fix recommendation

### 💭 Consider
3. **Issue** (file:line) - **Action:** Suggestion

## 💡 Recommendations
1-5 actionable suggestions with benefits and optional code examples

## 🎯 Verdict
**⚠️ Approve with changes / ✅ Approve / 🚫 Needs work / ❌ Blocked**

**Merge Criteria:**
- [ ] Specific requirements from Must Fix items

**Estimated Fix Time:** X minutes/hours
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
- Summary with 2-3 sentence overview
- Risk Assessment with risk level and 2-4 factors
- Security Review section present (concerns found OR explicit "no concerns")
- Performance Impact section present (concerns found OR explicit "no concerns")
- At least 3 key changes/info points identified with specific code references
- Issues organized by priority (Must Fix / Should Fix / Consider) with Action items
- 2-5 recommendations with benefits and optional code examples
- All file references use `file:line` format
- Verdict with approval status, merge criteria checklist, and estimated fix time

**Integration**: Standalone command (not integrated with implement/debug workflows)

### Subagents

**jira-analyzer** (`schovi/agents/jira-analyzer/AGENT.md`):
- Input: Jira URL or issue key (EC-1234)
- Uses: `mcp__jira__*` tools
- Output: ~800 token summary (core info, description condensed to 500 chars, acceptance criteria max 5, key comments max 3)
- Token budget: Max 1000 tokens

**gh-pr-analyzer** (`schovi/agents/gh-pr-analyzer/AGENT.md`):
- Input: PR URL, `owner/repo#123`, or `#123`
- Uses: `gh` CLI via Bash tool
- Mode: **Compact only** (simplified in Phase 3)
- Output: ~800-1000 tokens (top 20 files, max 3 reviews, failed CI only)
- Token budget: Max 1200 tokens
- Used by: brainstorm, research, debug, plan commands
- Purpose: Provide concise PR context for general analysis

**gh-pr-reviewer** (`schovi/agents/gh-pr-reviewer/AGENT.md`):
- Input: PR URL, `owner/repo#123`, or `#123`
- Uses: `gh` CLI and GitHub API via Bash tool
- Mode: **Full only** (new in Phase 3)
- Output: Comprehensive PR data with ALL files, reviews, CI checks, and PR head SHA
  - Normal PRs (≤50 files, ≤5000 lines): Includes complete diff content (max 15000 tokens)
  - Massive PRs (>50 files or >5000 lines): File stats only, diff omitted (max 3000 tokens)
- Token budget: Max 15000 tokens (normal), max 3000 tokens (massive)
- Used by: review command only
- Purpose: Provide complete code review data with actual diff

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

- Manual testing via `/schovi:brainstorm [input]` and `/schovi:research --input [input]`
- Test with real Jira issues: `EC-1234` format
- Test with GitHub PRs: `owner/repo#123` or `#123`
- Test brainstorm → research → plan workflow
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
  subagent_type: "schovi:jira-auto-detector:jira-analyzer"
  prompt: "Fetch and summarize Jira issue EC-1234"
  description: "Fetching Jira issue summary"
```

**Important**: Use fully qualified format `plugin:skill:agent` (e.g., `schovi:jira-auto-detector:jira-analyzer`), NOT just `jira-analyzer`.

## Key Patterns and Conventions

### Code References
Always use `file:line` format for specificity and navigation:
- ✅ `src/api/controller.ts:123`
- ❌ `src/api/controller.ts` (too vague)

### Markdown Formatting
- Section headers: Use emojis (🎯, 📊, 💡, 🛠️, 📚)
- Pros/Cons: ✅ for advantages, ⚠️ for trade-offs
- Status indicators: ✅ passing, ❌ failing, ⏳ pending, 💬 comment

### Template System

**Purpose**: Output structure templates that agents read dynamically to generate consistent, well-structured brainstorms, research, and specifications.

**Architecture**:
```
brainstorm command → brainstorm-generator agent → Read templates/brainstorm/full.md
research command → research-generator agent → Read templates/research/full.md
plan command → spec-generator agent → Read templates/spec/full.md
```

**Benefits**:
- ✅ Single source of truth for output structure
- ✅ Easy to update without changing agent code
- ✅ Clean architecture with separation of structure and logic
- ✅ Extensible design ready for future template variants

**Available Templates**:
- `templates/brainstorm/full.md` - Solution options structure with 2-3 approaches
- `templates/research/full.md` - Deep technical analysis structure with file:line references
- `templates/spec/full.md` - Implementation spec structure (~150 lines)

**Current Implementation**:
- Each agent reads its single template file
- Template provides complete structure, examples, guidelines, and validation checklist
- Agent populates template sections with content from input context
- Straightforward and maintainable

**Future Extensibility** (when needed):
1. Create new template variant (e.g., `templates/brainstorm/quick.md`, `templates/research/performance.md`)
2. Add conditional logic to agent to select template based on input
3. Update command to pass template selection parameter
4. Templates remain self-contained - no other changes needed

**Example future variants**:
- `brainstorm/quick.md` - Lightweight brainstorm with 2 options
- `brainstorm/comprehensive.md` - Extended brainstorm with 4-5 options
- `research/quick.md` - Lighter research for simple features
- `research/investigative.md` - Extra-deep research for complex systems
- `research/performance.md` - Performance-focused research
- `spec/migration.md` - Migration/refactor specifications

**Token Considerations**:
- Reading template adds ~200-500 tokens to agent context
- But templates were already embedded inline (~400-600 lines)
- Net token usage is approximately the same
- Main benefit is maintainability, not token reduction

### Token Budgets (Strict)
- Jira summaries: **Max 1000 tokens**
- PR summaries (compact mode): **Max 1200 tokens**
- PR summaries (full mode): **Max 15000 tokens** (with complete diff for normal PRs)
- PR summaries (full mode, massive PRs): **Max 3000 tokens** (file stats only, no diff)
- Always condense, never return raw payloads to main context (except full diff in full mode)

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

### Developing with Shared Libraries

When creating or refactoring commands, leverage the shared library system:

**For New Commands**:
1. Use `lib/argument-parser.md` for argument parsing (saves ~70 lines)
2. Use `lib/input-processing.md` for context fetching (saves ~150-200 lines)
3. Use `lib/work-folder.md` for work folder management (saves ~120 lines)
4. Use `lib/subagent-invoker.md` for custom subagent calls (saves ~40 lines)

**Example Command Structure**:
```markdown
## PHASE 1: ARGUMENT PARSING
Use lib/argument-parser.md with: [config]

## PHASE 2: INPUT PROCESSING
Use lib/input-processing.md with: [config]

## PHASE 3: YOUR CUSTOM LOGIC
[Command-specific implementation]

## PHASE 4: WORK FOLDER & OUTPUT
Use lib/work-folder.md with: [config]
```

**Creating New Libraries**:
1. Identify code duplicated across 2+ commands
2. Extract common pattern into new library
3. Document usage with examples
4. Update commands to use library
5. Measure line reduction

**Library Design Principles**:
- ✅ Single responsibility (one clear purpose)
- ✅ Configuration-based (not hardcoded)
- ✅ Standard output format
- ✅ Token efficient (~50-200 lines)
- ✅ Well-documented with examples

**See**: `schovi/lib/README.md` for comprehensive library development guide

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
- `schovi/commands/brainstorm.md`
- `schovi/commands/research.md`
- `schovi/commands/debug.md`
- `schovi/commands/plan.md`
- `schovi/commands/implement.md`
- `schovi/commands/commit.md`
- `schovi/commands/publish.md`
- `schovi/commands/review.md`

**Skills**:
- `schovi/skills/jira-auto-detector/SKILL.md`
- `schovi/skills/gh-pr-auto-detector/SKILL.md`

**Shared Libraries**:
- `schovi/lib/README.md`
- `schovi/lib/argument-parser.md`
- `schovi/lib/input-processing.md`
- `schovi/lib/work-folder.md`
- `schovi/lib/subagent-invoker.md`

**Templates**:
- `schovi/templates/brainstorm/full.md` - Solution options structure
- `schovi/templates/research/full.md` - Deep technical analysis structure
- `schovi/templates/spec/full.md` - Implementation spec structure

**Subagents**:
- `schovi/agents/jira-analyzer/AGENT.md`
- `schovi/agents/gh-pr-analyzer/AGENT.md`
- `schovi/agents/gh-pr-reviewer/AGENT.md`
- `schovi/agents/gh-issue-analyzer/AGENT.md`
- `schovi/agents/brainstorm-generator/AGENT.md`
- `schovi/agents/research-generator/AGENT.md`
- `schovi/agents/spec-generator/AGENT.md`
- `schovi/agents/debug-fix-generator/AGENT.md`

**Marketplace**:
- `.claude-plugin/marketplace.json`
