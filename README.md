# Schovi Workflows

Personal workflow plugins for Claude Code and Codex. One repo, two plugins, both runtimes install from the same local marketplace.

## Plugins

| Plugin | Purpose |
|--------|---------|
| `schovi` | Everyday engineering workflows: PR publishing, code review, debugging, Jira/GitHub/Datadog context detection |
| `homebrew` | CI-gated GitHub release workflow for Homebrew-distributed repos. Install only where it applies |

## Tools

### Skills

| Skill | Plugin | Invocation | What it does |
|-------|--------|------------|--------------|
| `publish` | schovi | `/schovi:publish` or "create a PR" | Auto-commits, pushes, and creates/updates a GitHub PR with a generated description |
| `review` | schovi | `/schovi:review #123` | Structured code review of PRs, Jira tickets, branches, or local files |
| `debug` | schovi | `/schovi:debug EC-1234` | Root cause analysis with fix proposal from Jira, GitHub, Datadog, or error text |
| `jira-auto-detector` | schovi | automatic | Fetches condensed Jira context when issues (EC-1234, URLs) are mentioned |
| `datadog-auto-detector` | schovi | automatic | Fetches condensed Datadog context when observability resources are mentioned |
| `gh-pr-auto-detector` | schovi | automatic | Fetches condensed PR context when GitHub PRs are mentioned |
| `release` | homebrew | `/homebrew:release` only | Cuts a CI-gated SemVer release: green-main gate, release notes, tagging, optional GoReleaser, verification, then a follow-up docs-sync PR for the user to verify |

In Codex, invoke skills as `use $publish`, `use $review`, `use $debug`, `use $release`.

### Subagents (schovi)

Fetch external data in isolated context windows and return condensed summaries, keeping the main context clean (75-95% token savings).

| Agent | What it does |
|-------|--------------|
| `jira-analyzer` | Jira issue → ~1k token summary |
| `gh-pr-reviewer` | GitHub PR (diff, reviews, CI) → max 15k token summary |
| `datadog-analyzer` | Datadog logs/traces/metrics → ~1.2k token summary |
| `debug-executor` | Full debug workflow (fetch + explore + diagnose) → ~2.5k token result |

## Installation

### Claude Code

```bash
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows
/plugin install homebrew@schovi-workflows   # only in Homebrew-distributed repos
```

Requires: `gh` CLI authenticated; Jira MCP server for Jira features; Datadog MCP server (optional) for observability features.

### Codex

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
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
