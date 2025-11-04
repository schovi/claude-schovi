# Schovi Workflow Plugin for Claude Code

Personal workflow automation and tools for software engineering. Includes problem analysis, Jira integration, intelligent code exploration, and more.

## 🎯 Overview

The Schovi plugin provides an end-to-end workflow for software engineering: from problem analysis to specification to autonomous implementation.

**Complete Workflow**:
1. **Analysis** (`/schovi:analyze`) - Understand the problem, explore codebase, propose solutions
2. **Specification** (`/schovi:plan`) - Document decisions, structure implementation, define success
3. **Implementation** (`/schovi:implement`) - Execute tasks autonomously, validate, commit changes
4. **Commit Management** (`/schovi:commit`) - Create structured commits with validation and smart analysis
5. **Pull Request** (`/schovi:publish`) - Create GitHub PR with auto-push and smart description generation

**Key Features**:
- **Automatic Jira Detection**: Intelligent Skill that detects when you mention Jira issues and automatically fetches context (works in ANY conversation, not just commands)
- **Automatic GitHub PR Detection**: Intelligent Skill that detects PR mentions and fetches condensed context (reviews, CI status, code changes) without polluting main context
- **Automatic Datadog Detection**: Intelligent Skill that detects Datadog URLs and observability queries, fetching condensed metrics, logs, traces, and incidents
- **GitHub Issue Support**: Fetch and analyze GitHub issues with the same context-isolated approach as Jira and PRs
- **Smart Git Commits**: Create structured commits with conventional format, branch validation, and automatic change analysis
- **PR Creation**: Automated PR creation with auto-push, smart description generation from specs/Jira/commits, and validation
- **Deep Codebase Analysis**: Explores code using specialized agents to understand user flows, data flows, and dependencies
- **Smart Clarification**: Automatically detects ambiguous inputs and asks targeted questions before analysis
- **Context-Isolated Fetching**: Uses specialized subagents to fetch and summarize Jira issues, GitHub PRs, GitHub issues, and Datadog observability data without polluting main context (reduces token usage by 75-80%)
- **Multi-Option Solutions**: Proposes 2-3 solution approaches with comprehensive pros/cons analysis
- **Autonomous Implementation**: Executes implementation tasks with full autonomy, creates commits, runs validation

## 📦 Installation

### Prerequisites

- Claude Code CLI installed
- MCP Server: Jira (required for Jira integration)
- GitHub CLI (`gh`) authenticated (required for PR integration)
- MCP Server: Datadog (optional, for observability integration)
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
/schovi:analyze --help
```

4. Configure MCP servers in your Claude Code settings to enable Jira integration.

## 🚀 Usage

### Commands

The plugin provides five main commands for the complete development workflow:

#### `/schovi:analyze` - Problem Analysis

Comprehensive problem analysis with codebase exploration, solution proposals, and structured artifacts.

**Input**: Jira ID, GitHub PR/issue URL, or problem description
**Output**: Terminal + `./analysis-[jira-id].md` (or custom path)
**Modes**: Full analysis (default) or quick analysis (`--quick`)

```bash
/schovi:analyze EC-1234
/schovi:analyze "Users report login failures" --quick
```

#### `/schovi:plan` - Specification Generation

Generates actionable implementation specs from analysis. Bridges exploration and execution.

**Input**: Jira ID, GitHub issue, analysis file, or from scratch
**Output**: Terminal + `./spec-[jira-id].md` (or custom path)

```bash
/schovi:plan EC-1234
/schovi:plan --from-scratch "Add loading spinner"
```

#### `/schovi:implement` - Implementation Execution

Autonomously executes implementation tasks with validation and phase-based commits.

**Input**: Spec file, Jira ID, or auto-detect from conversation
**Output**: Phase-based git commits + execution log
**Features**: Project type detection, automatic validation, auto-fixing

```bash
/schovi:implement ./spec-EC-1234.md
/schovi:implement EC-1234
```

#### `/schovi:commit` - Structured Git Commits

Creates conventional commits with smart analysis and validation.

**Input**: Jira ID, GitHub issue/PR, notes, or auto-analyze changes
**Features**: Conventional format, branch validation, multi-line messages

```bash
/schovi:commit EC-1234
/schovi:commit "Add user authentication"
```

#### `/schovi:publish` - Pull Request Creation

Creates GitHub PRs with auto-push and smart description generation.

**Input**: Jira ID, spec file, or auto-detect from branch/commits
**Features**: Auto-push, smart descriptions (spec → Jira → commits), validation

```bash
/schovi:publish
/schovi:publish --draft --base develop
```

### Common Flags

All commands support these output control flags:

**Input Flags:**
- `--input PATH` - Read input from specific file path

**Output Flags:**
- `--output PATH` - Save output to specific file path
- `--no-file` - Skip file output, terminal only
- `--quiet` - Suppress terminal output, file only
- `--post-to-jira` - Post output as Jira comment

**Command-Specific Flags:**

**/schovi:analyze:**
- `--quick` - Generate quick analysis instead of full

**/schovi:plan:**
- `--from-scratch "desc"` - Create minimal spec interactively

**/schovi:commit:**
- `--message "text"` - Override auto-generated message
- `--staged-only` - Only commit staged changes
- `--type prefix` - Specify commit type (feat, fix, etc.)

**/schovi:publish:**
- `--draft` - Create as draft PR
- `--base branch` - Target branch (default: main)
- `--title "text"` - Override auto-generated title
- `--no-push` - Skip auto-push

Run any command with `--help` for detailed options.

### Examples

#### Complete Workflow: Jira Issue to PR

```bash
# 1. Analyze the problem
/schovi:analyze EC-1234

# 2. Generate implementation spec
/schovi:plan EC-1234

# 3. Execute implementation autonomously
/schovi:implement ./spec-EC-1234.md

# 4. Create pull request
/schovi:publish
```

**What happens:**
- Analysis fetches Jira, explores codebase, proposes 2-3 solutions
- Spec documents chosen approach with tasks and acceptance criteria
- Implementation executes tasks, creates phase-based commits, runs validation
- Publish auto-pushes branch and creates PR with smart description

#### Quick Analysis with Custom Output

```bash
/schovi:analyze "Login fails after OAuth 302 redirect" --quick --output ~/docs/login-bug.md
```

**What happens:**
- Parses problem description
- Performs quick analysis (single solution, minimal sections)
- Saves to custom path for documentation

#### Standalone Commit and PR

```bash
# After manual implementation
/schovi:commit EC-1234
/schovi:commit EC-1234

# Create PR from commits
/schovi:publish --draft
```

**What happens:**
- Commits analyze git diff and create structured messages
- PR uses commit history to generate description
- Created as draft for additional review

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
    │   ├── analyze.md           # Problem analysis command
    │   └── plan.md               # Specification generation command
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

## 🏗️ Architecture: Three-Tier Integration Pattern

The plugin uses a consistent **three-tier architecture** for all external integrations (Jira, GitHub PRs, Datadog), providing massive token savings through context isolation.

### The Problem: Massive External Payloads

External data sources return overwhelming amounts of data:
- **Jira issues**: 10-15k tokens (full history, 50+ comments, verbose metadata)
- **GitHub PRs**: 20-50k tokens (complete diffs, review history, CI logs)
- **Datadog observability**: 10-50k tokens (logs, metrics, traces, incidents)

This pollutes the main context window, leaving less room for actual codebase analysis.

### The Solution: Context-Isolated Subagents

The plugin uses **specialized subagents** that operate in isolated contexts:

```
User mentions external resource (e.g., "EC-1234" or "Check error rate")
       ↓
Auto-Detection Skill activates (Tier 1)
       ↓
Evaluates intent and classifies context need
       ↓
Spawns specialized subagent via Task tool (Tier 3)
       ↓
Subagent Context (Isolated):
  - Fetches 10-50k token payload
  - Analyzes and extracts essence
  - Burns tokens privately
       ↓
Returns clean summary (~800-1200 tokens)
       ↓
Main Context receives summary (75-95% token savings!)
       ↓
User gets relevant context without context pollution
```

### Three-Tier Pattern

All integrations follow the same consistent pattern:

#### **Tier 1: Skills** (Auto-Detection)
Automatic detection across ALL conversations. Just mention a resource and get context.

- **jira-auto-detector**: Detects Jira issue patterns (EC-1234, IS-8046)
- **gh-pr-auto-detector**: Detects PR patterns (URLs, #123, owner/repo#123)
- **gh-issue-analyzer**: Detects GitHub issue patterns
- **datadog-auto-detector**: Detects Datadog URLs and natural language queries

**Intelligence Features:**
- ✅ Fetch when you ask about resources
- ❌ Skip for past tense mentions ("fixed EC-1234", "merged #123")
- ✅ Reuse context if already fetched in session
- ✅ Classify user intent for targeted fetching
- ❌ Avoid false positives

#### **Tier 2: Commands** (Explicit Workflows)
Guaranteed structured workflows with explicit invocation.

- **/schovi:analyze**: Formal problem analysis with Jira/PR/issue integration
- **/schovi:plan**: Specification generation from analysis
- **/schovi:implement**: Autonomous implementation execution
- **/schovi:commit**: Structured git commits with context
- **/schovi:publish**: PR creation with smart descriptions

#### **Tier 3: Subagents** (Execution Layer)
Low-level tools spawned by Skills/Commands for actual data fetching.

- **jira-analyzer**: Fetch and condense Jira issues (~800 tokens)
- **gh-pr-analyzer**: Fetch and condense GitHub PRs (~800-1000 tokens)
- **gh-issue-analyzer**: Fetch and condense GitHub issues (~800 tokens)
- **datadog-analyzer**: Fetch and condense observability data (~800-1200 tokens)
- **spec-generator**: Generate implementation specs (~1500-2500 tokens)
- **analysis-generator**: Generate problem analyses (~2000-3000 tokens)

### Token Savings Comparison

| Integration | Typical Payload | Summary Size | Token Savings | Auto-Detection |
|-------------|----------------|--------------|---------------|----------------|
| **Jira** | 10-15k tokens | ~800 tokens | ~75% | Issue keys (EC-1234) |
| **GitHub PR** | 20-50k tokens | ~800-1000 tokens | ~80-95% | URLs, #123, owner/repo#123 |
| **GitHub Issues** | 10-20k tokens | ~800 tokens | ~75-90% | Issue URLs, owner/repo#123 |
| **Datadog** | 10-50k tokens | ~800-1200 tokens | ~75-95% | URLs, natural language |

### Key Benefits

- **Massive Token Reduction**: 75-95% savings across all integrations
- **Cleaner Context**: Main workflow focuses on code, not external metadata
- **Better Analysis**: More context window for codebase exploration
- **Scalable**: Handles any payload size (10k-50k tokens)
- **Consistent Pattern**: Same architecture across all integrations
- **Intelligent Fetching**: Auto-detection with smart intent classification
- **Context Reuse**: Avoids duplicate fetches in same conversation

### Architecture Details

**Context Isolation Mechanism:**
1. Detection layer (Skill) identifies external resource mentions
2. Intent classification determines what data is needed
3. Task tool spawns subagent in isolated context
4. Subagent fetches full payload using appropriate tools (MCP, CLI)
5. Subagent condenses to essential information with strict token budget
6. Summary returned to main context for use in analysis/workflow
7. Original payload discarded, keeping main context clean

**Subagent Responsibilities:**
- Fetch external data using appropriate tools (MCP tools, `gh` CLI)
- Extract only actionable information
- Return structured markdown summaries
- Never pollute parent context with full payloads
- Respect strict token budgets (800-3000 tokens)

**Example Workflow (Jira Integration):**

```bash
# User mentions Jira issue
/schovi:analyze EC-1234

# Tier 1: jira-auto-detector Skill detects "EC-1234"
# Tier 3: Spawns jira-analyzer subagent via Task tool
# Subagent: Fetches 10k token Jira payload in isolated context
# Subagent: Extracts core info, description (500 chars), top 3 comments, criteria
# Returns: ~800 token summary to main context
# Command: Proceeds with codebase analysis using summary
# Result: 75% token savings, cleaner context
```

---

## ⚙️ Configuration

### Model Selection

The plugin uses `sonnet` model by default for thorough analysis in the command frontmatter. To change the model for a specific command, edit the command's markdown file (e.g., `commands/analyze.md`) and modify the `model:` field in the frontmatter.

### Allowed Tools

The plugin has access to:
- `Read`, `Grep`, `Glob` - Code exploration
- `Task` - Specialized agent invocation
- `mcp__jira__*` - Jira integration
- `mcp__datadog-mcp__*` - Datadog observability integration
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

**Usage**: `/analyze [jira-id or description]`

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
2. Test changes by running `/schovi:analyze`
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

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and changes.

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

David Schovanec (david.schovanec@productboard.com)

---

**Note**: This plugin is part of a larger workflow system. See `~/.claude/CLAUDE.md` for Flow 2 (Implementation) and other workflows.
