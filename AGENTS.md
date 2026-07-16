# AGENTS.md

Instructions for AI agents (Claude Code, Codex, and compatible runtimes) working in this repository. This is the single source of truth; `CLAUDE.md` imports it via `@AGENTS.md`.

## Project Overview

This repository hosts **dual plugins for Claude Code and Codex**. Both runtimes share the same skill files; each runtime has its own plugin manifest and marketplace.

| Plugin | Path | Purpose |
|--------|------|---------|
| `schovi` | `plugins/schovi/` | Main workflow plugin: PR publishing, code review, debugging, Jira/GitHub/Datadog context detection |
| `homebrew` | `plugins/homebrew/` | Standalone release workflow for Homebrew-distributed repos. Single skill `release`, explicit invocation only. Installable separately so it can be added only where it applies |
| `workflow` | `plugins/workflow/` | Task-board work framework for hobby/solo repos. Tasks are files in `workflow/<status>/` folders (the folder IS the status; moves are `git mv`); board view via a shipped `./workflow/status` script; repo-specific facts (validation, verify skills, doc routing) live in a `workflow/AGENTS.md` contract the skills read first. Install in repos that track work this way |

Core design: **context isolation**. External data (Jira issues ~10-15k tokens, GitHub PRs 20-50k tokens, Datadog 10-50k tokens) is fetched by subagents in isolated context windows and condensed before returning, keeping the main context clean. Savings: 75-80% on plain fetches, 93-96% on full executor workflows.

## Repository Layout

| Artifact | Claude Code | Codex |
|----------|-------------|-------|
| Plugin manifest | `plugins/<name>/.claude-plugin/plugin.json` | `plugins/<name>/.codex-plugin/plugin.json` |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |
| Skills | `plugins/<name>/skills/*/SKILL.md` | same files, invoked as `use $<skill>` |
| Subagents | `plugins/schovi/agents/*/AGENT.md` | `plugins/schovi/agents/*/agent.toml` — generated twins, registered globally via `scripts/sync-codex-agents.py` |
| Templates | `plugins/schovi/templates/` | shared |
| Human-facing overview | `README.md` | shared |

## Dual-Runtime Sync Rules

Every change must keep both runtimes in sync. Never update one side and leave the other stale.

1. **Manifests stay in sync**: version bumps, skill additions/removals, and description changes apply to BOTH `plugin.json` files of the affected plugin. A version bump has THREE places: `plugins/<name>/.claude-plugin/plugin.json`, `plugins/<name>/.codex-plugin/plugin.json`, and the plugin's entry in `.claude-plugin/marketplace.json` (which carries its own `version`). All three must match. The Codex marketplace (`.agents/plugins/marketplace.json`) is path-only with no version field, so it needs no bump. Grep the old version across the repo before committing to catch a stale copy
2. **Skills serve both runtimes**: `/<plugin>:<skill>` syntax and `Agent` tool / `subagent_type` references are Claude-native. When adding or changing a skill, make sure it degrades gracefully in Codex (trigger text works, subagent steps have a Codex-compatible path or are clearly Claude-only)
3. **Validate JSON after manifest changes**: see [Validation](#validation)
4. **Docs stay in sync**: this file is the single instructions source for both runtimes. When plugin logic changes affect the architecture or patterns documented here, update this file in the same change
5. **README.md stays current**: it is the only human-facing overview (plugins, skills, subagents, installation). Whenever a plugin, skill, or subagent is added, removed, or renamed, update README.md in the same change. Keep it a simple overview; detailed behavior belongs in the SKILL.md/AGENT.md files themselves

### Codex Notes

- Skills are invoked as `use $<skill>`: `use $publish`, `use $review`, `use $feedback`, `use $debug`, `use $release`
- Documented `/<plugin>:<skill>` commands are Claude-native syntax. In Codex they work as trigger text for the skills, not as shell or TUI slash commands
- Keep shared workflow behavior tool-neutral. Put runtime-specific generic-worker dispatch in conditional `references/claude-instructions.md` and `references/codex-instructions.md` files selected by callable capability. When a workflow references a custom Claude `subagent_type`, adapt it to Codex's available tools and built-in subagents
- Codex plugins cannot register agents natively (plugin.json has `skills` but no `agents` key). Bridge: each `AGENT.md` gets a generated `agent.toml` twin, symlinked into `~/.codex/agents/` by `scripts/sync-codex-agents.py` so Codex can spawn the agents in any session. The AGENT.md is the single source of truth — never edit `agent.toml` by hand
- After adding or editing an AGENT.md, rerun `python3 scripts/sync-codex-agents.py` (CI-style validation: `--check`). Codex picks up agent changes on a new task/restart. If a future Codex release adds plugin-native agents, retire the script and the symlinks
- Sandbox mapping in generated twins: MCP-only tool lists → `sandbox_mode = "read-only"`; anything broader (Bash/gh, full access) → `workspace-write` with `network_access = true`

## Skills

| Skill | Plugin | Invocation | Purpose |
|-------|--------|------------|---------|
| publish | schovi | `/schovi:publish` | Create/update GitHub PRs with auto-commit. Jira integration loads conditionally from `references/jira.md` |
| review | schovi | `/schovi:review` | Structured code review of PRs, Jira tickets, branches, or local files |
| feedback | schovi | `/schovi:feedback` | Post feedback to a PR as reviewer (findings/comments inline + general, optional verdict) or as author (reply to change-request threads with what changed, evidence-gated, never resolves). Previews before posting; outputs as text when no PR link is given |
| debug | schovi | `/schovi:debug` | Root cause analysis with fix proposal via debug-executor |
| jira-auto-detector | schovi | auto-detect only | Fetch Jira context when issues are mentioned |
| datadog-auto-detector | schovi | auto-detect only | Fetch Datadog context when observability resources are mentioned |
| gh-pr-auto-detector | schovi | auto-detect only | Fetch GitHub PR context when PRs are mentioned |
| release | homebrew | `/homebrew:release` only | CI-gated GitHub release for Homebrew-distributed projects, plus a follow-up documentation-sync PR (`disable-model-invocation: true`) |
| groom | workflow | `/workflow:groom [id]` | Refine a board task through intent interview and bounded codebase reconnaissance; Ready means one cohesive, independently deliverable outcome sized for one work loop, with known ownership surfaces and load-bearing contracts; one groom commit per session |
| work | workflow | `/workflow:work [id]` | Implement one Ready task, or an ad-hoc ask when explicitly invoked: dependency gate, routed-doc read, plan in chat, `task NNN:` commits, acceptance-verifier gate, atomic completion commit; hand material scope divergence back for re-grooming |
| batch-work | workflow | `/workflow:batch-work [ids\|count\|auto]` | Orchestrator-only runner (main context just plans + dispatches + records condensed returns; all task work in isolated subagents), sequential, stop-on-failure, report to `workflow/reports/`. `auto` builds the batch from the `depends:` graph: deps-before-dependents ordering, pulls whole Ready deps in, drops any dep it can't satisfy in-batch (draft/in-progress not pullable whole, or blocked/external) and reports |
| status | workflow | `/workflow:status` | Default: decision-oriented overview of the current repo (in progress, next up, batchable now, blockers ranked by unblock value). `all`: combined one-row-per-repo table across every repo's `workflow/` folders. Underlying per-repo dump: `./workflow/status` (done hidden by default, `--done N\|all` to list) |
| decision | workflow | `/workflow:decision` | Append a `D<N>` entry to the repo's decision log |
| framework-init | workflow | `/workflow:framework-init` | Explicit-only scaffold of `workflow/` + contract + docs skeleton in a fresh repo; never runs as a missing-framework fallback |
| framework-doctor | workflow | `/workflow:framework-doctor` | Validator + cleanup for an initialized repo: deterministic validation (bundled `validate_workflow.py`), refresh of drifted shipped files (status/TEMPLATE) against templates, contract sanity, Codex agent parity (`references/codex-agents.md`). Report first, apply on approval. Not a migrator |

Description discipline: a skill description states WHEN to trigger (and when to skip), one concern per skill. The body states HOW. Agent descriptions state the contract (what it fetches, input, output budget) because that is what spawners route on.

Workflow discovery is conservative because the plugin may be installed outside its intended hobby/solo repos. Invoke workflow skills explicitly by default. `work`, `groom`, and `status` may be selected implicitly only when the current repo has `workflow/AGENTS.md` and the request unmistakably refers to that board. `framework-init` has Codex's `agents/openai.yaml` policy `allow_implicit_invocation: false`, an explicit-only shared description, and a body guard against inherited invocation. It must never be invoked as another skill's missing-framework fallback.

## Subagents

Two kinds:

| Type | Purpose | Input | Output |
|------|---------|-------|--------|
| **Analyzer** | Fetch and condense external data | URL/ID | condensed summary |
| **Executor** | Run a complete workflow (fetch + explore + generate) in isolation | problem reference | formatted result |

Commands are thin wrappers: parse arguments → spawn subagent → handle output. Executors spawn analyzers and Explore/Plan subagents inside their own isolated context, so the main context only sees the final formatted output, never the intermediate exploration.

### Registry and Token Budgets (strict)

| Agent (full subagent_type) | Purpose | Max output tokens |
|----------------------------|---------|-------------------|
| `schovi:jira-analyzer:jira-analyzer` | Fetch & summarize Jira issues | 1000 |
| `schovi:gh-pr-reviewer:gh-pr-reviewer` | Fetch & summarize GitHub PRs | 15000 (2000-15000 by PR size) |
| `schovi:datadog-analyzer:datadog-analyzer` | Fetch & summarize Datadog data | 1200 |
| `schovi:debug-executor:debug-executor` | Execute debug workflow | 2500 |
| `workflow:acceptance-verifier:acceptance-verifier` | Adversarially verify a task's acceptance criteria before the completion commit (report-only, fresh context) | 800 |

Always condense; never return raw payloads to the main context.

### Naming Convention

Subagent types use **three-part format** `plugin:parent:agent`:

- All current agents live under `agents/`, so the parent segment repeats the agent name: `plugin:agent:agent`, e.g. `schovi:jira-analyzer:jira-analyzer`, `schovi:debug-executor:debug-executor`
- An agent bundled inside a skill folder (none today) would register as `plugin:skill:agent`

`schovi:debug-executor` (two-part) and `schovi:jira-auto-detector:jira-analyzer` (skill-based name for a standalone agent) are both wrong and fail to spawn. Always use the registered three-part identifier.

## Conventions

- Code references use `file:line` format: `src/api/controller.ts:123`, not just the path
- New workflows go in `plugins/<name>/skills/<skill>/SKILL.md`; new agents in `plugins/<name>/agents/<agent>/AGENT.md`
- Naming: `-analyzer` suffix for data fetchers, `-executor` suffix for workflow executors, `-auto-detector` suffix for auto-detection skills, `-verifier` suffix for report-only quality gates
- Source-specific integration steps inside a generic skill live in `references/*.md` within the skill folder, read only when that input type is detected. Each reference file must include a graceful-degradation path so the skill never blocks when the integration is unavailable

## Development

Changes take effect immediately; no build step.

```bash
# Install (Claude Code)
/plugin marketplace add ~/work/claude-schovi
/plugin install schovi@schovi-workflows
/plugin install homebrew@schovi-workflows   # only in Homebrew-distributed repos

# Install (Codex)
codex plugin marketplace add ~/work/claude-schovi
```

Test by invoking: `/schovi:publish`, `/schovi:review`, `/schovi:feedback`, `/homebrew:release` (Claude) or `use $publish`, `use $feedback`, `use $release` (Codex).

### Validation

After changing plugin metadata:

```bash
python3 -m json.tool plugins/schovi/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/schovi/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/homebrew/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/homebrew/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/workflow/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/workflow/.codex-plugin/plugin.json >/dev/null
python3 -m json.tool .claude-plugin/marketplace.json >/dev/null
python3 -m json.tool .agents/plugins/marketplace.json >/dev/null
```

After changing the workflow task-file format or status-folder conventions, keep `plugins/workflow/skills/framework-doctor/scripts/validate_workflow.py` (and its `test_validate_workflow.py`), the `status` script and templates under `plugins/workflow/skills/framework-init/templates/`, and the groom/work skill texts consistent — they all encode the same format.

After changing a workflow `SKILL.md` or skill invocation policy, validate that its trigger text cannot capture unrelated requests or initialize the framework implicitly:

```bash
python3 scripts/validate-workflow-skill-triggers.py
```

After changing any `AGENT.md`:

```bash
python3 scripts/sync-codex-agents.py          # regenerate agent.toml twins + refresh ~/.codex/agents symlinks
python3 scripts/sync-codex-agents.py --check  # verify twins are current without writing
```

After changing skills, refresh the local marketplace and start a new Codex session to verify discovery:

```bash
codex plugin marketplace add /Users/schovi/work/claude-schovi
codex
```

`codex plugin marketplace upgrade` is for Git-backed marketplaces; local marketplaces read directly from the configured path.

## External Dependencies

- **Jira MCP server** (`mcp__jira__*` tools) for Jira integration
- **GitHub CLI** (`gh`), authenticated via `gh auth login`
- **JetBrains MCP server** (optional) for enhanced IDE integration
