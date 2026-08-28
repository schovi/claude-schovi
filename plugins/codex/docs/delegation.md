## Codex vs native subagents

Codex runs on a separate, much larger token budget. When delegating, prefer Codex for volume and keep Claude tokens for brain work. Always go through the `/codex:delegate` skill; never call `codex exec` directly, the skill's wrapper handles output isolation, session ids, and logs.

- **Codex** (`/codex:delegate`): the whole spec fits in one self-contained prompt. Bulk implementation, mechanical migrations, standalone investigation or review of code on disk, throwaway research. The prompt must say the final message is the only output returned
- **Codex via the runner subagent** (`codex:codex-runner:codex-runner`): same codex call wrapped in a haiku agent that enforces contract markers (`-x`) and resumes bounded (max 2, progress-gated, print-only deltas). Use inside Workflow scripts, batch orchestration, or parallel fan-out; the direct script call stays the default for one-off synchronous runs
- **Native Claude subagents**: the task needs session context too large to restate, MCP tools (Jira, Datadog, Slack), plugin-registered agents, or mid-task steering
- **Inline (you)**: judgment. Architecture, tradeoffs, decisions, and reviewing whatever a delegate returned

### Models and efforts

All models accept reasoning efforts `low | medium | high | xhigh | max`. What an effort buys differs by model:

- `gpt-5.6-luna`, haiku-class: cheapest and fastest. `low`/`medium` for mechanical edits, boilerplate, format conversions; `high`/`xhigh` make it punch above its class on well-specified tasks while staying cheap; `max` is rarely better than switching to terra
- `gpt-5.6-terra`, opus-class, the default: `low` for routine edits, `medium` for standard implementation and review, `high` for multi-file refactors and debugging; `xhigh`/`max` for sustained cross-file reasoning where switching to sol isn't warranted
- `gpt-5.6-sol`, strongest tier (below Fable): already deep at `low`; every effort step is expensive. For the hardest cross-cutting reasoning: gnarly root causes, design review, multi-constraint planning

Before raising model or effort, tighten the prompt contract; a better-specified task on a cheaper tier usually beats a vague one on an expensive tier.
