# Problem Analyzer Plugin for Claude Code

A comprehensive problem analysis workflow plugin that performs deep codebase exploration, flow mapping, and provides multi-option solution proposals for bugs and feature requests.

## 🎯 Overview

The Problem Analyzer plugin helps you systematically analyze complex problems by:

- **Deep Codebase Analysis**: Explores code using specialized agents to understand user flows, data flows, and dependencies
- **Smart Clarification**: Automatically detects ambiguous inputs and asks targeted questions before analysis
- **Multi-Option Solutions**: Proposes 2-3 solution approaches with comprehensive pros/cons analysis
- **Implementation Guidance**: Provides step-by-step plans, testing requirements, and rollout strategies
- **Jira Integration**: Reads Jira issues directly for context-rich analysis

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
problem-analyzer/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (required)
├── commands/
│   └── analyze-problem.md   # Main analysis command
├── skills/                   # (future) Auto-invoked capabilities
└── README.md
```

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
