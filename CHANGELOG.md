# Changelog

All notable changes to the Schovi Workflow Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-01-04

### Added
- **Datadog Integration** (read-only observability)
  - `datadog-analyzer` subagent for context-isolated observability data fetching
  - `datadog-auto-detector` skill for automatic Datadog mention detection
  - Support for all Datadog resource types (logs, metrics, traces, incidents, monitors, services, dashboards, events, RUM)
  - URL parsing for Datadog links across all resource types
  - Natural language query detection ("error rate of service", "show logs for service")
  - Intent classification (Full Context, Specific Query, Quick Status, Investigation, Comparison)
  - Smart conversation history checking to avoid duplicate fetches
  - 75-80% token reduction for Datadog analysis (10k-50k → ~800-1200 tokens)
  - Integration with Datadog MCP server (`mcp__datadog-mcp__*` tools)
  - Comprehensive error handling and edge case management

### Changed
- Plugin description updated to include Datadog integration
- Workflow now supports observability data integration for analysis and debugging

## [1.5.0] - 2025-01-04

### Added
- **Pull Request Creation**: `/schovi:publish` command
  - Automated branch pushing with upstream tracking
  - Smart PR description generation (spec → Jira → commits)
  - Multiple input options (Jira ID, spec file, auto-detection)
  - Flags: `--draft`, `--base`, `--title`, `--no-push`, `--spec`
  - Structured PR format: Problem / Solution / Changes / Other
  - Branch validation (blocks main/master, naming checks)
  - Clean state validation (no uncommitted changes)
  - Confetti celebration on successful PR creation
- **Context-Aware File Detection**: Commands auto-detect spec files and Jira IDs from branch names and conversation
- **Commit Naming Unification**: Simplified command naming to use unified action verbs

### Changed
- Workflow now complete: Analysis → Spec → Implementation → Commit → PR
- Documentation updated with PR creation examples and flow

## [1.4.0] - 2025-01-03

### Added
- **Structured Git Commits**: `/schovi:commit` command
  - Conventional commit format with automatic type detection
  - Smart branch validation (blocks main/master)
  - Branch name validation against Jira ID
  - Multi-line commit messages with title, description, bullets, references
  - Optional external context fetching (Jira, GitHub issue, GitHub PR)
  - Diff analysis for intelligent message generation
  - Flags: `--message`, `--staged-only`, `--type`
  - Automatic change staging with git add
  - Commit verification and success reporting

### Changed
- **Analysis Generation Refactored**
  - Context isolation via `analysis-generator` subagent
  - Analysis artifacts saved to files by default (`analysis-[jira-id].md`)
  - Support for quick vs full analysis modes (`--quick` flag)
  - Multiple output destinations (terminal/file/Jira)
  - New output flags: `--output PATH`, `--no-file`, `--quiet`, `--post-to-jira`
  - Consistent architecture with plan pattern
  - Token efficiency: 30-40% savings in main context
  - Analysis template (`templates/analysis-template.md`) documents structure
- Updated workflow: Analysis now produces reusable artifacts
- Matches plan pattern: Exploration → Subagent → Output Handling

## [1.3.0] - 2024-12-15

### Added
- **Implementation Execution**: `/schovi:implement` command
  - Autonomous task execution with full autonomy mode
  - Parse specs to extract implementation tasks and acceptance criteria
  - Execute tasks sequentially without interruptions
  - Phase-based git commits with descriptive messages
  - Project type detection (Node.js, Python, Go, Ruby, Rust)
  - Automatic validation (linting, type checking, tests)
  - Auto-fix validation issues when possible
  - Acceptance criteria verification
  - Uses Haiku model for efficient execution
  - Comprehensive error handling and progress reporting

### Changed
- Updated workflow documentation in CLAUDE.md (Phase 4 added)
- Completes the workflow: Analysis → Spec → Implementation

## [1.2.0] - 2024-12-10

### Added
- **Specification Generation**: `/schovi:plan` command
  - Implementation spec generation from analysis
  - `spec-generator` subagent for context-isolated spec creation
  - Flexible input sources (conversation, Jira, file, from-scratch)
  - Multiple output options (terminal, file, Jira posting)
  - Full and minimal spec templates
  - Bridges analysis and implementation workflow

### Changed
- Updated workflow documentation in CLAUDE.md (Phase 2 added)

## [1.1.0] - 2024-12-05

### Added
- **GitHub PR Integration**
  - `gh-pr-analyzer` subagent for context-isolated PR fetching
  - `gh-pr-auto-detector` skill for automatic PR detection
  - Intent classification (reviews/CI/full context)
  - Repository context detection from git remote
  - 75-80% token reduction for PR analysis

### Changed
- Enhanced documentation with PR examples

## [1.0.0] - 2024-12-01

### Added
- Initial release
- `/analyze` command for deep problem analysis
- Smart clarification detection
- Deep codebase analysis workflow
- Multi-option solution proposals
- **Jira Integration** (read-only)
  - `jira-analyzer` subagent for context-isolated fetching
  - `jira-auto-detector` skill for automatic detection
  - 75% token reduction for Jira analysis
- Sonnet model for thorough analysis
- Context isolation architecture
- Three-tier integration pattern (Skills → Commands → Subagents)

[1.6.0]: https://github.com/schovi/claude-schovi/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/schovi/claude-schovi/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/schovi/claude-schovi/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/schovi/claude-schovi/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/schovi/claude-schovi/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/schovi/claude-schovi/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/schovi/claude-schovi/releases/tag/v1.0.0
