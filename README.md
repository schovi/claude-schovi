# Schovi Workflow Plugin for Codex and Claude Code

Personal workflow automation and tools for software engineering. Includes problem analysis, Jira integration, intelligent code exploration, and more.

## Quick Links

- **[Architecture Overview](doc/architecture.md)** - Plugin design, three-tier pattern, context isolation, shared libraries
- **[Installation & Getting Started](#installation)** - Prerequisites and setup instructions

## 📋 Table of Contents

- [Commands](#commands) - User-invoked workflows
- [Agents](#agents) - Context-isolated execution
- [Skills](#skills) - Auto-detection intelligence
- [Libraries](#libraries) - Shared code libraries
- [Architecture](#architecture) - System design

---

## Commands

User-invoked workflows for software engineering tasks.

### [`/schovi:brainstorm`](doc/commands/brainstorm.md)
Explore 2-3 distinct solution options with broad feasibility analysis.

**Dependencies:**
- Calls: `jira-analyzer`, `gh-pr-reviewer`, `brainstorm-generator`, Plan subagent
- Libraries: `argument-parser`, `input-processing`, `work-folder`

**Example:** `/schovi:brainstorm EC-1234`

---

### [`/schovi:research`](doc/commands/research.md)
Deep technical analysis of ONE specific approach with detailed file:line references.

**Dependencies:**
- Calls: `jira-analyzer`, `gh-pr-reviewer`, `research-generator`, Plan subagent
- Libraries: `argument-parser`, `input-processing`, `work-folder`

**Example:** `/schovi:research --input brainstorm-EC-1234.md --option 2`

---

### [`/schovi:plan`](doc/commands/plan.md)
Generate implementation specifications from research analysis (enforces research-first workflow).

**Dependencies:**
- Calls: `spec-generator`, Explore subagent (optional)
- Libraries: `argument-parser`, `input-processing`, `work-folder`

**Example:** `/schovi:plan --input research-EC-1234-option2.md`

---

### [`/schovi:debug`](doc/commands/debug.md)
Deep debugging workflow with root cause analysis and single fix proposal. Includes Datadog auto-detection for observability context.

**Dependencies:**
- Calls: `jira-analyzer`, `gh-pr-reviewer`, `datadog-analyzer`, `debug-fix-generator`, Explore subagent
- Libraries: `argument-parser`, `input-processing`, `work-folder`

**Example:** `/schovi:debug EC-1234`

---

### [`/schovi:implement`](doc/commands/implement.md)
Autonomous implementation execution with validation and phase-based commits.

**Dependencies:**
- Calls: `/schovi:commit` command
- Libraries: `argument-parser`, `input-processing`, `completion-handler`

**Example:** `/schovi:implement ./spec-EC-1234.md --verbose`

---

### [`/schovi:commit`](doc/commands/commit.md)
Create structured git commits with validation, smart analysis, and conventional format.

**Dependencies:**
- Calls: `jira-analyzer` (optional), `gh-pr-reviewer` (optional)
- Libraries: `argument-parser`
- Called by: `/schovi:implement`

**Example:** `/schovi:commit EC-1234`

---

### [`/schovi:publish`](doc/commands/publish.md)
Create or update GitHub pull requests with automated branch pushing and smart description generation.

**Dependencies:**
- Calls: `jira-analyzer` (optional), `spec-generator` (via file read)
- Libraries: `argument-parser`

**Example:** `/schovi:publish`

---

### [`/schovi:review`](doc/commands/review.md)
Comprehensive code review + automatic GitHub PR context detection. Two modes: explicit `/review` for structured review, auto-detection for casual PR mentions.

**Dependencies:**
- Calls: `gh-pr-reviewer`, `jira-analyzer`, Explore subagent (optional)
- Libraries: `code-fetcher`

**Example:** `/schovi:review #123` or just mention `#123` in conversation

---

## Agents

Context-isolated subagents that execute in separate contexts for token efficiency.

### [Analyzer Agents](doc/agents/)

Fetch and summarize external data with aggressive token reduction.

#### [`jira-analyzer`](doc/agents/jira-analyzer.md)
Fetch and summarize Jira issues (10-15k → 800 tokens, 75% savings).

**Dependencies:**
- Called by: `jira-auto-detector`, commands (brainstorm, research, debug, commit, publish)
- Uses: `mcp__jira__*` tools

**Example:** Spawned via `schovi:jira-auto-detector:jira-analyzer` when EC-1234 detected

---

#### [`gh-pr-reviewer`](doc/agents/gh-pr-reviewer.md)
Fetch and summarize GitHub PRs with comprehensive data (max 15k tokens).

**Dependencies:**
- Called by: All commands and skills that need GitHub PR/issue context
- Uses: `gh` CLI, GitHub API

**Example:** Spawned via `schovi:gh-pr-reviewer:gh-pr-reviewer` when #123 detected

---

#### [`datadog-analyzer`](doc/agents/datadog-analyzer.md)
Fetch and summarize Datadog observability data (10-50k → 1200 tokens, 75-95% savings).

**Dependencies:**
- Called by: `/schovi:debug` skill/command
- Uses: `mcp__datadog-mcp__*` tools

**Example:** Spawned when Datadog URL or observability query detected

---

### [Generator Agents](doc/agents/)

Generate structured content in isolated contexts.

#### [`brainstorm-generator`](doc/agents/brainstorm-generator.md)
Generate 2-3 solution options with pros/cons (~3000 tokens).

**Dependencies:**
- Called by: `/schovi:brainstorm` command
- Uses: Read tool (for template)

**Example:** Spawned by brainstorm command after codebase exploration

---

#### [`research-generator`](doc/agents/research-generator.md)
Generate deep technical analysis (~6000 tokens).

**Dependencies:**
- Called by: `/schovi:research` command
- Uses: Read tool (for template)

**Example:** Spawned by research command after thorough exploration

---

#### [`spec-generator`](doc/agents/spec-generator.md)
Generate implementation specifications (~2500 tokens).

**Dependencies:**
- Called by: `/schovi:plan` command
- Uses: Read tool (for template)

**Example:** Spawned by plan command to transform research into spec

---

#### [`debug-fix-generator`](doc/agents/debug-fix-generator.md)
Generate fix proposals from debugging results (~2000 tokens).

**Dependencies:**
- Called by: `/schovi:debug` command
- Uses: None (pure transformation)

**Example:** Spawned by debug command after root cause analysis

---

## Skills

Auto-detection intelligence that works across ALL conversations.

### [`jira-auto-detector`](doc/skills/jira-auto-detector.md)
Automatically detect Jira issue mentions (EC-1234, IS-8046) and intelligently fetch context.

**Dependencies:**
- Calls: `jira-analyzer` agent

**Example:** User mentions "Analyze EC-1234" → Auto-fetches Jira context

---

## Libraries

Shared code libraries that eliminate duplication across commands (77% code reduction).

### [`argument-parser`](doc/libraries/argument-parser.md)
Standardized argument parsing with validation (~80 lines, saves ~70 lines per command).

**Dependencies:**
- Called by: All commands

**Example:** Parses `--input EC-1234 --output ./analysis.md --quick`

---

### [`input-processing`](doc/libraries/input-processing.md)
Unified context fetching from external sources (~200 lines, saves ~150-200 lines per command).

**Dependencies:**
- Called by: All commands with external input
- Calls: Analyzer agents (jira, gh-pr, gh-issue, datadog)

**Example:** Routes EC-1234 → jira-analyzer, #123 → gh-pr-reviewer

---

### [`work-folder`](doc/libraries/work-folder.md)
Work folder resolution and file output management (~483 lines, saves ~120 lines per command).

**Dependencies:**
- Called by: Commands that generate output files (brainstorm, research, plan, debug)

**Example:** Saves brainstorm output to `./brainstorm-EC-1234.md` with YAML frontmatter

---

### [`subagent-invoker`](doc/libraries/subagent-invoker.md)
Standardized subagent invocation via Task tool (~70 lines, saves ~40 lines per command).

**Dependencies:**
- Called by: Commands that spawn subagents

**Example:** Spawns `schovi:brainstorm-generator` with error handling and timeout

---

### [`code-fetcher`](doc/libraries/code-fetcher.md)
Source code fetching with fallback strategies (~80 lines, saves ~60 lines per command).

**Dependencies:**
- Called by: `/schovi:review` command
- Uses: Read tool, JetBrains MCP, GitHub API

**Example:** Fetches 10 files via local → JetBrains → GitHub fallback

---

### [`phase-template`](doc/libraries/phase-template.md)
Standard command phase structure template (~300 lines, structural guide).

**Dependencies:**
- Used by: All commands (as structural guide)

**Example:** Provides consistent phase pattern (Input → Processing → Generation → Output)

---

### [`command-template`](doc/libraries/command-template.md)
New command development guide with boilerplate (~200 lines, template).

**Dependencies:**
- Used by: Developers creating new commands

**Example:** Copy template → Configure → Customize phases → Test

---

## Architecture

### [Architecture Overview](doc/architecture.md)

Comprehensive guide to the plugin's architecture:
- **Three-Tier Pattern**: Skills (auto-detect) → Commands (workflow) → Agents (execute)
- **Context Isolation**: 75-95% token savings through isolated subagent contexts
- **Shared Libraries**: 77% code reduction through reusable components
- **Quality Gates**: Validation at each phase
- **Extension Patterns**: How to add new integrations and commands

---

## Installation

### Codex CLI

This repository is installable as a local Codex plugin marketplace.

1. Add the marketplace:

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
```

2. Enable the plugin if Codex does not prompt you automatically:

```toml
# ~/.codex/config.toml
[plugins."schovi@schovi-workflows"]
enabled = true
```

3. Start a new Codex session and invoke skills naturally:

```text
use $commit to commit my work
use $review to review this branch
use $publish to create a draft PR
use $debug to investigate EC-1234
```

Notes:
- The `/schovi:*` examples below are Claude Code command syntax. In Codex, use natural language or `$skill` mentions.
- Claude-style custom subagents in `schovi/agents/*/AGENT.md` are reference material for Codex. Codex skills should adapt those instructions to available Codex tools and built-in subagents.

### Claude Code

#### Prerequisites

- Claude Code CLI installed
- **MCP Server: Jira** (required for Jira integration)
- **GitHub CLI (`gh`)** authenticated (required for PR integration)
- MCP Server: Datadog (optional, for observability integration)
- MCP Server: JetBrains (optional, for enhanced IDE integration)

#### Install Plugin

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
/schovi:brainstorm --help
```

---

## Workflow Examples

### Complete Workflow: Jira Issue to PR

```bash
# 1. Explore solution options
/schovi:brainstorm EC-1234

# 2. Deep technical analysis of chosen option
/schovi:research --input brainstorm-EC-1234.md --option 2

# 3. Generate implementation specification
/schovi:plan --input research-EC-1234-option2.md

# 4. Execute implementation autonomously
/schovi:implement ./spec-EC-1234.md --verbose

# 5. Create pull request
/schovi:publish
```

### Debugging Workflow

```bash
# Debug with root cause analysis
/schovi:debug EC-1234

# Or debug from error description
/schovi:debug "NullPointerException in UserService.authenticate"

# Or debug from Datadog trace
/schovi:debug "https://app.datadoghq.com/apm/traces/..."
```

### Code Review Workflow

```bash
# Deep review with source code fetching
/schovi:review #123

# Quick review for fast feedback
/schovi:review #123 --quick

# Review from GitHub URL
/schovi:review https://github.com/owner/repo/pull/123
```

---

## Key Features

### Context Isolation Architecture

Reduces token consumption by **75-95%** when fetching external data:
- Jira: 10-15k → 800 tokens (75% savings)
- GitHub PRs: 20-50k → 1000 tokens (80-95% savings)
- Datadog: 10-50k → 1200 tokens (75-95% savings)

### Shared Library System

Eliminates **77% of duplicate code** (1,980 lines → 450 lines):
- Single source of truth for common operations
- Consistent user experience across all commands
- 80% faster development of new commands

### Three-Tier Integration Pattern

Consistent architecture for all external integrations:
- **Tier 1 (Skills)**: Auto-detection across all conversations
- **Tier 2 (Commands)**: Structured workflows with quality gates
- **Tier 3 (Agents)**: Context-isolated execution

---

## Documentation Structure

```
/
├── README.md (this file)              # Guidepost with hierarchical listing
├── CLAUDE.md                          # Claude Code project instructions
├── doc/
│   ├── architecture.md                # Architecture overview
│   ├── commands/                      # Command documentation
│   │   ├── brainstorm.md
│   │   ├── research.md
│   │   ├── plan.md
│   │   ├── debug.md
│   │   ├── implement.md
│   │   ├── commit.md
│   │   ├── publish.md
│   │   └── review.md
│   ├── agents/                        # Agent documentation
│   │   ├── jira-analyzer.md
│   │   ├── gh-pr-reviewer.md
│   │   ├── datadog-analyzer.md
│   │   ├── brainstorm-generator.md
│   │   ├── research-generator.md
│   │   ├── spec-generator.md
│   │   └── debug-fix-generator.md
│   ├── skills/                        # Skill documentation
│   │   └── jira-auto-detector.md
│   └── libraries/                     # Library documentation
│       ├── argument-parser.md
│       ├── input-processing.md
│       ├── work-folder.md
│       ├── subagent-invoker.md
│       ├── code-fetcher.md
│       ├── phase-template.md
│       └── command-template.md
└── schovi/                            # Plugin implementation
    ├── commands/                      # Command implementations
    ├── agents/                        # Agent implementations
    ├── skills/                        # Skill implementations
    ├── lib/                           # Library implementations
    └── templates/                     # Output structure templates
```

---

## Contributing

To enhance this plugin:

1. Edit files in `schovi/` directory
2. Test changes by running commands
3. Commit and push changes
4. Share improvements with your team

For new commands, use the `COMMAND-TEMPLATE` library in `schovi/lib/`.

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and changes.

---

## License

MIT License - See LICENSE file for details

---

## Author

David Schovanec (david.schovanec@productboard.com)

---

**Note**: This plugin uses a three-tier architecture for maximum token efficiency. See [Architecture Overview](doc/architecture.md) for details.
