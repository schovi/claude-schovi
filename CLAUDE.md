# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** providing workflow automation for software engineering tasks. It integrates Jira and GitHub PR analysis with deep codebase exploration capabilities.

**Key Innovation**: Context isolation architecture that reduces token consumption by 75-80% when fetching external data.

## Architecture

### Three-Tier Integration Pattern

The plugin uses a three-tier architecture for external integrations:

1. **Skills** (Auto-detection, `/schovi/skills/`): Automatically detect mentions and intelligently decide when to fetch context
2. **Commands** (Explicit, `/schovi/commands/`): User-invoked workflows like `/schovi:analyze-problem`
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
│   ├── analyze-problem.md        # Deep problem analysis workflow
│   ├── create-spec.md            # Specification generation workflow
│   ├── implement.md              # Implementation execution workflow
│   ├── commit.md                 # Structured git commit creation
│   └── create-pr.md              # GitHub pull request creation
├── agents/                        # Context-isolated execution
│   ├── jira-analyzer/AGENT.md    # Fetch & summarize Jira (max 1000 tokens)
│   ├── gh-pr-analyzer/AGENT.md   # Fetch & summarize GitHub PR (max 1200 tokens)
│   ├── gh-issue-analyzer/AGENT.md # Fetch & summarize GitHub issues (max 1000 tokens)
│   └── spec-generator/AGENT.md   # Generate implementation specs (max 3000 tokens)
└── skills/                        # Auto-detection intelligence
    ├── jira-auto-detector/SKILL.md   # Detects EC-1234, IS-8046, etc.
    └── gh-pr-auto-detector/SKILL.md  # Detects PR URLs, owner/repo#123, #123
```

## Key Components

### Command: `/schovi:analyze-problem`

**Location**: `schovi/commands/analyze-problem.md`

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

### Command: `/schovi:create-pr`

**Location**: `schovi/commands/create-pr.md`

**Purpose**: Create GitHub pull requests with automated branch pushing and smart description generation

**Workflow**:
1. **Phase 1: Input Parsing** - Parse Jira ID, spec file, flags; auto-detect from branch name
2. **Phase 2: Git State Validation** - Check branch (block main/master), validate naming, check uncommitted changes
3. **Phase 3: Branch Pushing** - Auto-push with upstream tracking, verify push succeeded
4. **Phase 4: Description Source Detection** - Search for spec file → Jira issue → commit history
5. **Phase 5: PR Description Generation** - Create structured description (Problem/Solution/Changes/Other)
6. **Phase 6: PR Title Generation** - Format with Jira ID or from commits (50-100 chars)
7. **Phase 7: PR Creation & Verification** - Execute gh pr create, verify, display URL, run confetti

**Input Options**:
- Jira ID (EC-1234)
- Spec file path (./spec-EC-1234.md)
- Flags: --draft, --base, --title, --no-push, --spec

**Key Features**:
- **Auto-Push**: Always push branch before creating PR (unless --no-push)
- **Smart Description**: Auto-detects best source (spec → Jira → commits priority)
- **Structured Format**: Problem/Solution/Changes/Other sections
- **Branch Validation**: Blocks main/master, warns on naming mismatch
- **Clean State**: Requires no uncommitted changes
- **Confetti**: Runs confetti celebration on successful PR creation

**Description Source Intelligence**:
```
Priority 1: Spec file (./spec-EC-1234.md)
  - Problem from spec Problem section
  - Solution from Technical Overview
  - Changes from Implementation Tasks
  - Other from Testing Strategy

Priority 2: Jira issue (via jira-analyzer)
  - Problem from issue description
  - Changes from acceptance criteria
  - Solution from commits + context

Priority 3: Commit history (git log)
  - Problem from commit summary
  - Changes from commit list
  - Solution from technical analysis
```

**PR Creation Format**:
```bash
gh pr create --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"
```

**Integration**: Standalone manual command (not auto-executed by implement)

### Subagents

**jira-analyzer** (`schovi/agents/jira-analyzer/AGENT.md`):
- Input: Jira URL or issue key (EC-1234)
- Uses: `mcp__jira__*` tools
- Output: ~800 token summary (core info, description condensed to 500 chars, acceptance criteria max 5, key comments max 3)
- Token budget: Max 1000 tokens

**gh-pr-analyzer** (`schovi/agents/gh-pr-analyzer/AGENT.md`):
- Input: PR URL, `owner/repo#123`, or `#123`
- Uses: `gh` CLI via Bash tool
- Output: ~800-1000 token summary (core info, description 500 chars, top 5 changed files, failed CI checks only, max 3 reviews, max 5 comments)
- Token budget: Max 1200 tokens

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
/schovi:analyze-problem test-input

# Commit and push
git add .
git commit -m "Description of changes"
git push
```

### Testing

- Manual testing via `/schovi:analyze-problem [input]`
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
- `schovi/commands/analyze-problem.md`
- `schovi/commands/create-spec.md`
- `schovi/commands/implement.md`
- `schovi/commands/commit.md`
- `schovi/commands/create-pr.md`

**Skills**:
- `schovi/skills/jira-auto-detector/SKILL.md`
- `schovi/skills/gh-pr-auto-detector/SKILL.md`

**Subagents**:
- `schovi/agents/jira-analyzer/AGENT.md`
- `schovi/agents/gh-pr-analyzer/AGENT.md`
- `schovi/agents/gh-issue-analyzer/AGENT.md`
- `schovi/agents/spec-generator/AGENT.md`

**Marketplace**:
- `.claude-plugin/marketplace.json`
