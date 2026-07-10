# Schovi Workflows

Personal workflow plugins for Claude Code and Codex. One repo, two plugins, both runtimes install from the same local marketplace.

## Plugins

| Plugin | Purpose |
|--------|---------|
| `schovi` | Everyday engineering workflows: PR publishing, code review, debugging, Jira/GitHub/Datadog context detection |
| `homebrew` | CI-gated GitHub release workflow for Homebrew-distributed repos. Install only where it applies |
| `workflow` | Task-board work framework for hobby/solo repos: tasks are files in `workflow/<status>/` folders (folder = status, moves are `git mv`), board view via `./workflow/status`, repo specifics in a `workflow/AGENTS.md` contract. Full model and lifecycle: [plugins/workflow/README.md](plugins/workflow/README.md) |

## Tools

### Skills

| Skill | Plugin | Invocation | What it does |
|-------|--------|------------|--------------|
| `publish` | schovi | `/schovi:publish` or "create a PR" | Auto-commits, pushes, and creates/updates a GitHub PR with a generated description |
| `review` | schovi | `/schovi:review #123` | Structured code review of PRs, Jira tickets, branches, or local files |
| `feedback` | schovi | `/schovi:feedback #123` | Posts feedback to a PR both ways: as reviewer (inline + general comments, optional verdict) or as author replying to change-request threads with what you changed; previews before posting |
| `debug` | schovi | `/schovi:debug EC-1234` | Root cause analysis with fix proposal from Jira, GitHub, Datadog, or error text |
| `jira-auto-detector` | schovi | automatic | Fetches condensed Jira context when issues (EC-1234, URLs) are mentioned |
| `datadog-auto-detector` | schovi | automatic | Fetches condensed Datadog context when observability resources are mentioned |
| `gh-pr-auto-detector` | schovi | automatic | Fetches condensed PR context when GitHub PRs are mentioned |
| `release` | homebrew | `/homebrew:release` only | Cuts a CI-gated SemVer release: green-main gate, release notes, tagging, optional GoReleaser, verification, then a follow-up docs-sync PR for the user to verify |
| `groom` | workflow | `/workflow:groom [id]` | Refines a task file into an implementable spec, then `git mv`s it to `ready/` (with a sparse `priority:`) or `blocked/` (with a `gate:`); one question round, one groom commit per session |
| `work` | workflow | `/workflow:work [id]` | Implements the top Ready task (lowest priority number) or an ad-hoc ask: routed-doc read, brief plan, `task NNN:` commits, acceptance-verifier gate, atomic completion commit (`done:` date + move to `done/` + doc sync) |
| `batch-work` | workflow | `/workflow:batch-work [ids\|count]` | Runs Ready tasks sequentially in isolated subagents, priority order, stop-on-failure, consolidated report |
| `status` | workflow | `/workflow:status` | Read-only combined board view across all repos with `workflow/` status folders (per-repo: `./workflow/status`) |
| `decision` | workflow | `/workflow:decision` | Appends a `D<N>` record to the repo's decision log |
| `framework-init` | workflow | `/workflow:framework-init` | Scaffolds `workflow/` + repo contract + docs skeleton in a fresh repo |
| `framework-check` | workflow | `/workflow:framework-check` | Validates the framework (bundled script) and migrates legacy layouts (docs/board.md, M-IDs, superseded repo skills); reports first, applies on approval |

In Codex, invoke skills as `use $publish`, `use $review`, `use $feedback`, `use $debug`, `use $release`, `use $groom`, `use $work`, etc.

### Subagents (schovi)

Fetch external data in isolated context windows and return condensed summaries, keeping the main context clean (75-95% token savings).

Available in both runtimes: Claude Code registers them from the plugin; Codex uses generated `agent.toml` twins symlinked into `~/.codex/agents/` — run `python3 scripts/sync-codex-agents.py` once after install and after agent changes.

| Agent | What it does |
|-------|--------------|
| `jira-analyzer` | Jira issue → ~1k token summary |
| `gh-pr-reviewer` | GitHub PR (diff, reviews, CI) → max 15k token summary |
| `datadog-analyzer` | Datadog logs/traces/metrics → ~1.2k token summary |
| `debug-executor` | Full debug workflow (fetch + explore + diagnose) → ~2.5k token result |

### Subagents (workflow)

| Agent | What it does |
|-------|--------------|
| `acceptance-verifier` | Fresh-context adversarial check of a task's acceptance criteria before the completion commit → per-criterion verdict with evidence, ~800 tokens. Used by `/workflow:work` and `/workflow:batch-work`; report-only |

## Installation

### Claude Code

```bash
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows
/plugin install homebrew@schovi-workflows   # only in Homebrew-distributed repos
/plugin install workflow@schovi-workflows   # only in repos using the workflow/ status folders
```

Requires: `gh` CLI authenticated; Jira MCP server for Jira features; Datadog MCP server (optional) for observability features.

### Codex

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
python3 scripts/sync-codex-agents.py   # register plugin subagents globally for Codex
```

Enable manually if not prompted:

```toml
# ~/.codex/config.toml
[plugins."schovi@schovi-workflows"]
enabled = true
```

## Development

Edit files under `plugins/`; changes take effect immediately, no build step.

Repo rules (dual-runtime sync, validation, conventions) live in [AGENTS.md](AGENTS.md). Version history in [CHANGELOG.md](CHANGELOG.md).

## License

MIT — David Schovanec
