# Changelog

All notable changes to the Schovi Workflow Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## schovi [1.19.0] - 2026-07-10

### Added
- Codex agent registration: each `AGENT.md` now has a generated `agent.toml` twin (`plugins/schovi/agents/*/agent.toml`) so jira-analyzer, gh-pr-reviewer, datadog-analyzer, and debug-executor are spawnable in Codex sessions, not just reference material. `scripts/sync-codex-agents.py` regenerates the twins from the AGENT.md source of truth (verbatim prompt, MCP-only tools → `read-only` sandbox, Bash/full access → `workspace-write` + network) and symlinks them into `~/.codex/agents/` — Codex plugins cannot ship registered agents natively yet, so global registration bridges the gap. `--check` mode validates without writing. Retire the script when Codex plugin manifests gain an `agents` key

## workflow [2.0.0] - 2026-07-10

### Changed
- **Folder-based board** replaces the markdown board: tasks are single `NNN-slug.md` files in `workflow/{draft,ready,in-progress,blocked,done}/` — the folder IS the status, so every transition is one `git mv` (cheaper and less error-prone than board-line edits, no board merge-conflict hotspot, and the board↔task-file consistency class of bugs disappears). The two card shapes (inline board line vs task file) collapse into one: every task is a file, tiny ones are tiny files. `done/` replaces the separate archive
- Task-file format: first line `# NNN — Title`, then metadata lines — sparse `priority: N` orders ready (lowest = next, insert-between without renames), `gate:` explains blocked, `done: YYYY-MM-DD` dates done. Status is never written inside the file
- Board view: shipped `./workflow/status` script (zero-dependency python3, installed by framework-init with `.gitkeep`s for the empty status folders) prints In progress / Ready (priority order) / Draft / Blocked / Done; `--done N|all` controls history depth. `/workflow:status` uses it per repo for the cross-repo table
- Validator rewritten for the folder model (simpler: no link/board cross-checks) and framework-check migration extended: board cards become files in status folders (Ready order → sparse priorities), interim `workflow/board.md` layouts are detected and migrated the same way

## workflow [1.1.0] - 2026-07-10

### Added
- `acceptance-verifier` subagent: fresh-context adversarial gate before the completion commit. Receives the task's acceptance criteria and diff scope, tries to falsify each criterion (observation over inference, evidence per verdict, ambiguity → fail/unverifiable), returns per-criterion PASS/FAIL/UNVERIFIABLE plus a ready/not-ready verdict, max 800 tokens, report-only. `work` gains an acceptance-gate step (only `ready` proceeds to the completion commit; skipped for ad-hoc asks without written criteria; Codex runs the pass inline); `batch-work` requires the verdict in each task's return. Registered for Codex via `scripts/sync-codex-agents.py`

## workflow [1.0.0] - 2026-07-10

### Added
- New `workflow` plugin unifying the groom/work/board framework previously duplicated across photo-deduplicator, rift-drifter, and warpiq. The unit of work is a **task**; each repo keeps a markdown kanban (`workflow/board.md`, section = status), optional task files (`workflow/tasks/`), archive, reports, and an ID counter under `workflow/`. Repo-specific facts (project one-liner, validation commands, verify-skill mapping, doc routing, decision log) live in a `workflow/AGENTS.md` contract the skills read first
- `groom`: one read pass, one question round, one rewrite; ≤15-line specs fold into the board line, larger ones get a task file; one groom commit per session
- `work`: minimal loop (routed docs → plan in chat → implement → validate → verify → doc sync). Reduced commit ceremony: In progress board move stays uncommitted and rides in the atomic completion commit; all task commits prefixed `task NNN:`; no git tags
- `batch-work` (renamed from batch-run): sequential isolated subagents over Ready tasks, clean-tree gate between tasks, stop-on-failure with preserved state, report in `workflow/reports/`
- `status`: read-only cross-repo board overview (scans `~/work/*/workflow/board.md`)
- `decision`: append-only `D<N>` decision records
- `framework-init`: scaffolds `workflow/` from bundled templates, writes the contract (pre-filled by repo inspection), optional docs skeleton, routes root AGENTS.md to the plugin
- `framework-check`: bundled zero-dependency `validate_workflow.py` (exit 0 valid / 1 issues / 2 legacy-or-missing) plus guided migration: moves `docs/board.md` and task files into `workflow/`, renumbers active M-ID cards only (archives/tags untouched), switches milestone/card vocabulary to task, deletes superseded repo skills (groom/work/batch-run) and scout agents, ensures Codex parity for kept repo agents (generates missing `.codex/agents/*.toml` twins per bundled `references/codex-agents.md` pairing rules, verifies the Codex skills symlink), and reroutes repo instructions to the plugin. Reports first, applies on approval, re-runnable on partial migrations

## [1.18.0] - 2026-06-15

### Added
- `feedback` skill: posts feedback to a GitHub PR in two directions. **Reviewer mode** turns review findings (or dictated comments) into inline + general comments with an optional Approve / Comment / Request-changes verdict; anchors inline comments from review context first and only re-fetches the diff when ambiguous. **Author mode** replies to open change-request threads on your own PR, drafting each reply from the commits/diff since that review (evidence-gated — never claims a fix that isn't in the diff) and never resolving threads. Both always preview before posting and fall back to text output when no PR link is given. Pairs with `/schovi:review`

## [1.17.0] - 2026-06-07

### Added
- `datadog-auto-detector` skill: Datadog auto-detection extracted from `debug` (restores the pre-1.7.0 standalone detector in a slimmer structure)
- `gh-pr-auto-detector` skill: GitHub PR auto-detection extracted from `review`
- `publish` conditional reference `references/jira.md`: Jira integration (analyzer spawn, summary usage, graceful degradation) is read only when a Jira reference is present, keeping the main flow generic for repos without Jira
- Frontmatter descriptions for `datadog-analyzer` and `debug-executor` agents (previously surfaced as "Agent from schovi plugin" in agent listings)

### Changed
- `debug` and `review` are single-mode explicit skills; auto-detection moved to the dedicated detector skills and their descriptions describe one concern each
- `jira-auto-detector` rewritten to the shared detector structure (505 → ~110 lines); stale `/analyze-problem` integration section removed
- Subagent naming docs corrected: all agents live under `agents/` and register as `plugin:agent:agent`

### Fixed
- `publish` and `review` spawned non-existent `schovi:jira-auto-detector:jira-analyzer`; corrected to `schovi:jira-analyzer:jira-analyzer` (regression of the 1.7.0 fix)
- Claude plugin manifest description still mentioned the removed `adr` skill; marketplace entry description was stale (referred to problem analysis / specification / autonomous implementation)

## [1.16.2] - 2026-05-22

### Changed
- Moved subagent scaffold out of `schovi/agents/` so the harness no longer surfaces it as a real agent type. The file is now at `schovi/templates/agent-template.md` and is documentation-only (no `name:` frontmatter), saving the tokens that `schovi:template-agent` was spending in every session's agent listing.

## [1.7.0] - 2026-04-01

### Changed
- **Consolidated skills**: Merged `gh-pr-auto-detector` into `review` skill (dual-mode: explicit review + auto PR detection)
- **Consolidated skills**: Merged `datadog-auto-detector` into `debug` skill (dual-mode: explicit debug + auto Datadog detection)
- **Removed `adr` skill** and its template
- **Removed deprecated agents**: `gh-issue-analyzer` and `gh-pr-analyzer` (replaced by `gh-pr-reviewer`)
- **Fixed subagent_type references**: Corrected `jira-analyzer` from `schovi:jira-auto-detector:jira-analyzer` to `schovi:jira-analyzer:jira-analyzer`
- **Improved jira-auto-detector description**: Added explicit skip conditions for better auto-detection accuracy
- Updated documentation across CLAUDE.md, README.md, architecture docs, and agent/skill references

### Removed
- `schovi/skills/gh-pr-auto-detector/` (absorbed into review skill)
- `schovi/skills/datadog-auto-detector/` (absorbed into debug skill)
- `schovi/skills/adr/` and `schovi/templates/adr/`
- `schovi/agents/gh-issue-analyzer/` and `schovi/agents/gh-pr-analyzer/`
- `doc/skills/gh-pr-auto-detector.md` and `doc/skills/datadog-auto-detector.md`
- `doc/agents/gh-issue-analyzer.md` and `doc/agents/gh-pr-analyzer.md`

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
