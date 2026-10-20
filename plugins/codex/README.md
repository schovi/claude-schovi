# codex plugin

Delegate self-contained tasks to Codex subagents from Claude Code, without their event stream landing in your context.

Codex runs on a separate, much larger token budget. Spend it on volume (bulk implementation, mechanical migrations, standalone investigation, throwaway research) and keep Claude tokens for judgment: architecture, tradeoffs, decisions, and reviewing what comes back.

Claude Code only. Codex delegating to itself is pointless, so there is no Codex plugin manifest.

## Install

```bash
/plugin marketplace add schovi/claude-schovi
/plugin install codex@schovi-workflows
```

Requires the [`codex` CLI](https://github.com/openai/codex), authenticated with `codex login`.

### Teach Claude when to use it

The skill triggers on "ask codex" / "/codex:delegate". To have Claude route work to Codex on its own, paste this into your `~/.claude/CLAUDE.md`:

<details>
<summary>Delegation block (copy into CLAUDE.md)</summary>

````markdown
## Codex vs native subagents

Codex runs on a separate, much larger token budget. When delegating, prefer Codex for volume and keep Claude tokens for brain work. Always go through the `/codex:delegate` skill; never call `codex exec` directly, the skill's wrapper handles output isolation, session ids, and logs.

- **Codex** (`/codex:delegate`): the whole spec fits in one self-contained prompt. Bulk implementation, mechanical migrations, standalone investigation or review of code on disk, throwaway research. The prompt must say the final message is the only output returned
- **Codex via the runner subagent** (`codex:codex-runner:codex-runner`): same codex call wrapped in a haiku agent that enforces contract markers (`-x`) and resumes bounded (max 2, progress-gated, print-only deltas). Use inside Workflow scripts, batch orchestration, or parallel fan-out; the direct script call stays the default for one-off synchronous runs
- **Native Claude subagents**: the task needs session context too large to restate, MCP tools (Jira, Datadog, Slack), plugin-registered agents, or mid-task steering
- **Inline (you)**: judgment. Architecture, tradeoffs, decisions, and reviewing whatever a delegate returned

### Sizing and acceptance

- Make the contract unsatisfiable by a half-done job. Move, extract and replace are create *and* delete; if every check passes with only the create half done, that is where the run stops and it reports success honestly. Require one assertion the halfway state cannot meet (`grep -c "def <name>" <old file>` must print 0), and slice so each run ends at a state you can assert. A bigger model or higher effort does not fix this
- Never poll a backgrounded run. Wait on its output file with one `Monitor` call; each poll costs a full context read and learns nothing
- The final message is a report, not proof. Re-run the checks you can run yourself and read the diff. Unverified "byte-identical" claims and junk left inside passing code are the two recurring misses

### Models and efforts

Model slugs change with every Codex release, so route by role, not by name. `codex-delegate.sh --models` prints the live catalog: visible models by priority, each with its default effort, supported efforts, and description. Map the roles from that list:

- **Workhorse**, the default: the top-priority model ("latest workhorse"). Implementation, refactors, review, scoped debugging. The script picks it when `-m` is omitted
- **Cheap**: the newest model described as fast and affordable. Mechanical edits, boilerplate, format conversions, fetch-and-condense. Higher efforts make it punch above its class while staying cheap
- **Frontier**: the model described as frontier intelligence. Only the hardest cross-cutting reasoning: gnarly root causes, design review, multi-constraint planning. Expensive at every effort

Models described as "previous" or "older" generation are superseded; skip them unless the user names one.

Efforts: start at the model's catalog default (the script uses it when `-e` is omitted) and raise one step for sustained multi-file reasoning. Avoid `ultra` unless asked: it adds Codex-side task delegation, so cost and run shape get unpredictable.

Before raising model or effort, tighten the prompt contract; a better-specified task on a cheaper tier usually beats a vague one on an expensive tier.
````

</details>

Paste it, don't `@`-import [`docs/delegation.md`](docs/delegation.md), the import path breaks when the repo moves. That file is the canonical copy: edit it first, then re-paste.

## What you get

| Piece | What it is |
|-------|------------|
| `/codex:delegate` | Skill that runs a task on Codex and returns only the result |
| `codex-delegate.sh` | The wrapper doing the work: `skills/delegate/scripts/codex-delegate.sh` |
| `codex-runner` | Haiku subagent wrapping one script call, for workflows and parallel fan-out |

## How it works

`codex exec` prints its full reasoning and tool-call stream. Piping that into Claude defeats the point of delegating. The wrapper redirects the stream to a log file and prints only a small header plus the final message:

```
session: 019a...
log: ~/.cache/codex-delegate/20260828-141530-4821.log
---
<final message>
```

That is the entire context cost of a delegation. The log stays on disk for when the final message has gaps.

```bash
codex-delegate.sh [-m MODEL] [-e EFFORT] [-s SANDBOX] [-C DIR] [-r SESSION_ID] [-x MARKERS] "PROMPT"
codex-delegate.sh --models
```

- `--models`: the live Codex catalog (`codex debug models`): visible models by priority with default effort, efforts, and description
- `-m` / `-e`: model and reasoning effort (defaults: the catalog's top-priority model and its default effort)
- `-s`: `read-only` for review and research, `workspace-write` (default) for implementation
- `-C DIR`: point Codex at another repo without changing your own cwd
- `-r SESSION_ID`: resume a run and send only a delta instruction, replaying the session's own workspace, model, effort and sandbox (pass `-C`/`-m`/`-e`/`-s` alongside it only to override one)
- `-x "## Findings,## Files"`: contract check. Literal strings the final message must contain; a miss prints `contract: missing: ...` and exits 3, the message still prints

Prompts must be self-contained, Codex sees nothing of the Claude session, and the final message is the only output that comes back, so it has to carry the whole deliverable.

### Model routing

Slugs change with every Codex release, so the skill routes by role and reads the slugs from `--models`:

| Role | Pick from the catalog | Use for |
|------|-----------------------|---------|
| workhorse | top-priority model | the default: implementation, refactors, review, scoped debugging |
| cheap | newest "fast and affordable" model | mechanical edits, boilerplate, format conversions. High efforts stay cheap |
| frontier | "frontier intelligence" model | hard cross-cutting reasoning. Expensive, use sparingly |

Before raising model or effort, tighten the prompt contract: a well-specified task on a cheaper tier beats a vague one on an expensive tier. Full guidance in [`docs/delegation.md`](docs/delegation.md).

### codex-runner subagent

For a one-off synchronous call, run the script directly, a subagent relay adds nothing. Spawn `codex:codex-runner:codex-runner` when subagent semantics pay: inside Workflow scripts or batch orchestration where steps must be agents, for parallel fan-out, or to keep the contract-check loop out of your context. It runs with `-x`, resumes at most twice on a contract miss (only while the missing set shrinks, deltas print-only so Codex never re-edits files), and returns the final message verbatim under a `verdict:` line.

## Fallback

If `codex` is missing or unauthenticated the script exits non-zero with the log tail on stderr, and the skill tells you to fall back to native Claude subagents.
