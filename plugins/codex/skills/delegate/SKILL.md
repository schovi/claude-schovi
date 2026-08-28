---
name: delegate
description: >
  Delegate a self-contained task to a Codex (GPT-5.6) subagent through the
  bundled codex-delegate.sh wrapper, which hides the event stream and returns
  only the final message plus a resumable session id. Use when the user says
  "/codex:delegate", "ask codex", "delegate this to codex", or when offloading
  token-heavy but well-specified work (bulk implementation, mechanical
  migrations, standalone investigation or review, throwaway research) would
  preserve Claude context for judgment work. Skip for anything finishable in a
  handful of tool calls, or tasks whose context can't be written into one
  self-contained prompt.
---

# Codex Delegate

Codex runs on a separate, much larger token budget. Spend it on volume; keep Claude tokens for brain work: architecture, tradeoffs, decisions, and reviewing what comes back.

## Running

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/delegate/scripts/codex-delegate.sh" [-m MODEL] [-e EFFORT] [-s SANDBOX] [-C DIR] [-r SESSION_ID] [-x MARKERS] "PROMPT"
```

- Output: `session: <id>` and `log: <path>` header, then `---`, then the final message. Nothing else reaches your context.
- `-x "## Findings,## Files"`: deterministic contract check — comma-separated literal strings that must appear in the final message. A miss prints `contract: missing: ...` and exits 3 (message still printed). Pair it with a prompt that requires those exact headings.
- Long or quote-heavy prompts: pass `-` (or omit the prompt) and pipe via stdin with a heredoc.
- Failure: non-zero exit, log tail on stderr. The full event stream (reasoning, tool calls) is always in the log file; read it when the final message has gaps.
- Runs are synchronous and can take minutes. Use the Bash tool's `run_in_background` for anything likely over ~5 minutes, and dispatch independent runs in parallel.

## Model and effort routing

All models accept reasoning efforts `low | medium | high | xhigh | max`; what an effort buys differs by model. Full routing guidance lives in [docs/delegation.md](../../docs/delegation.md).

| Model | Class | Use for |
|-------|-------|---------|
| `gpt-5.6-luna` | haiku-class | mechanical edits, boilerplate, test scaffolding, format conversions, fetch-and-condense. Higher efforts make it punch above its class cheaply |
| `gpt-5.6-terra` | opus-class | the default. Implementation, refactors, code review, debugging with a known scope |
| `gpt-5.6-sol` | strongest (below Fable) | hard cross-cutting reasoning: gnarly root causes, design review, multi-constraint planning. Already deep at low effort; use sparingly |

Defaults: `gpt-5.6-terra`, `medium`. Before raising model or effort, tighten the prompt contract; a better-specified task on a cheaper tier usually beats a vague one on an expensive tier. Escalate effort one step when the task needs sustained multi-file reasoning; jump to `sol` only when terra's result showed it's out of depth. User-stated effort caps (e.g. in CLAUDE.md) win over this table.

## Prompt contract

Codex sees nothing of this session. Every prompt must be self-contained, and the deliverable must survive the trip back:

- State that **the final message is the only output returned**, so it must carry the complete deliverable: findings, file list with `path:line` references, what was changed and how it was verified. Intermediate narration is lost.
- One task per run. Split unrelated asks into separate runs.
- Say what done looks like: expected end state, not just the activity.
- For anything beyond a one-liner, structure the prompt with blocks: `<task>` (job + repo paths + context), `<output_contract>` (exact shape of the final message), `<verification>` (what to run and to report results), `<constraints>` (stay narrow, no unrelated refactors).
- Write tasks must be told to run the repo's build/lint/test and report the outcome in the final message.
- Tell it to proceed on routine judgment calls instead of asking; it cannot ask you anything.

## Sandbox

`-s read-only` for review, research, and investigation; the default `workspace-write` for implementation. Never `danger-full-access`. `-C DIR` points the agent at a different repo without changing your own cwd.

## Via the codex-runner subagent

For one-off synchronous calls, run the script directly — a subagent relay adds nothing. Spawn `codex:codex-runner:codex-runner` (haiku, Bash + Read) instead when subagent semantics pay:

- inside Workflow scripts or batch orchestration, where steps must be agents
- parallel fan-out of several codex runs
- when you want the contract-check-and-resume loop isolated from your context

Give it the full dispatch spec: script path (`${CLAUDE_PLUGIN_ROOT}/skills/delegate/scripts/codex-delegate.sh`), codex model + effort, sandbox, optional workdir, the ready-to-send self-contained prompt, and the contract markers. It runs with `-x`, resumes at most twice on a contract miss (only while the missing set shrinks, deltas are print-only so codex never re-edits files), and returns the final message verbatim under a `verdict:` line — `complete`, `resumed(N)`, `incomplete`, or `failed`. Judge `incomplete`/`failed` yourself; the runner never escalates model or effort on its own.

## Follow-ups and gaps

- Resume with `-r <session id>` and send only the delta instruction ("also cover X", "your final message omitted the file list, print it"). Don't restate the whole prompt unless direction changed materially.
- For missing detail that a resume can't answer cheaply, read the printed log file: it holds the full reasoning and tool-call stream.

## Degradation

If `codex` is missing or unauthenticated (exit 127, or auth errors in the log tail: run `codex login`), tell the user and fall back to native Claude subagents.
