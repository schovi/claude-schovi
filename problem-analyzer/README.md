# Problem Analyzer Plugin for Claude Code

A comprehensive problem analysis workflow plugin that performs deep codebase exploration, flow mapping, and provides multi-option solution proposals for bugs and feature requests.

## 🎯 Overview

The Problem Analyzer plugin helps you systematically analyze complex problems by:

- **Automatic Jira Detection**: Intelligent Skill that detects when you mention Jira issues and automatically fetches context (works in ANY conversation, not just commands)
- **Deep Codebase Analysis**: Explores code using specialized agents to understand user flows, data flows, and dependencies
- **Smart Clarification**: Automatically detects ambiguous inputs and asks targeted questions before analysis
- **Context-Isolated Jira Fetching**: Uses a specialized subagent to fetch and summarize Jira issues without polluting main context (reduces token usage by ~9k per analysis)
- **Multi-Option Solutions**: Proposes 2-3 solution approaches with comprehensive pros/cons analysis
- **Implementation Guidance**: Provides step-by-step plans, testing requirements, and rollout strategies

## 📦 Installation

### Prerequisites

- Claude Code CLI installed
- MCP Server: Jira (required)
- MCP Server: JetBrains (optional, for enhanced IDE integration)

### Install Plugin

1. Clone or symlink the plugin to your global plugins directory:

```bash
ln -s ~/work/claude-schovi/problem-analyzer ~/.claude/plugins/problem-analyzer
```

2. Verify installation:

```bash
# The plugin should be automatically discovered by Claude Code
# Try running:
/analyze-problem --help
```

3. Configure MCP servers in your Claude Code settings to enable Jira integration.

## 🚀 Usage

### Basic Syntax

```bash
/analyze-problem [jira-id|description]
```

### Examples

#### Example 1: Analyze a Jira Issue

```bash
/analyze-problem EC-1234
```

This will:
1. Fetch the Jira issue details
2. Perform deep codebase analysis
3. Propose multiple solutions
4. Provide implementation guidance

#### Example 2: Analyze with Description

```bash
/analyze-problem "Users report login fails after OAuth provider returns 302 redirect"
```

This will:
1. Parse the problem description
2. Ask clarifying questions if the description is ambiguous
3. Explore affected code areas
4. Propose solutions with trade-off analysis

#### Example 3: Interactive Mode

```bash
/analyze-problem
```

This will prompt you to provide either a Jira ID or problem description.

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
~/work/claude-schovi/
├── .claude/
│   ├── agents/
│   │   └── jira-analyzer/        # Context-isolated Jira subagent
│   │       └── AGENT.md
│   └── skills/
│       └── jira-auto-detector/   # Automatic Jira detection skill
│           └── SKILL.md
└── problem-analyzer/
    ├── .claude-plugin/
    │   └── plugin.json           # Plugin metadata (required)
    ├── commands/
    │   └── analyze-problem.md    # Main analysis command
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

**Location**: `problem-analyzer/commands/analyze-problem.md`

**How it works:**
- User explicitly invokes: `/problem-analyzer:analyze-problem EC-1234`
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

1. Edit files in `~/work/claude-schovi/problem-analyzer/`
2. Test changes by running `/analyze-problem`
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
ls -la ~/.claude/plugins/problem-analyzer

# Should show:
# problem-analyzer -> /Users/schovi/work/claude-schovi/problem-analyzer
```

### Jira Integration Not Working

1. Verify Jira MCP server is configured in Claude Code settings
2. Test Jira connection: `mcp__jira__atlassianUserInfo`
3. Check that your Jira credentials are valid

### Analysis Incomplete

If analysis seems shallow:
- Check that the Task tool is available
- Verify allowed-tools in the command frontmatter
- Ensure the Plan subagent is accessible

## 📝 Version History

### v1.0.0 (Current)
- Initial release
- `/analyze-problem` command
- Smart clarification detection
- Deep codebase analysis workflow
- Multi-option solution proposals
- Jira integration (read-only)
- Sonnet model for thorough analysis

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

David Schovanec (david.schovanec@productboard.com)

---

**Note**: This plugin is part of a larger workflow system. See `~/.claude/CLAUDE.md` for Flow 2 (Implementation) and other workflows.
