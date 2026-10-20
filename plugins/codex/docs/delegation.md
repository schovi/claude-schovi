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
