# Source Resolution (shared reference)

Read this when a skill received a source reference and needs the content behind it. It isolates every integration so the main skill flows stay generic: a repo with no issue tracker, no observability vendor, and no doc tool never executes any of it.

Callers: `/schovi:publish`, `/schovi:review`, `/schovi:debug`, `schovi:debug-executor:debug-executor`. From a skill folder the path is `../../references/sources.md`.

## 1. Classify the reference

Most specific first:

| Reference | Type |
|---|---|
| `#123`, `owner/repo#123`, or a `github.com` URL | `github` |
| a path that exists on disk | `file` / `folder` |
| `[A-Z][A-Z0-9]{1,9}-\d{1,6}` (`PROJ-123`) | `ticket` |
| anything else starting with `http` | `url` |
| anything else | `text` |

`url` is the general case, not a leftover: any link the user pastes is a valid source.

## 2. Resolve a ticket key to a URL

Never hardcode a tracker host and never guess one. In order:

1. the URL the user pasted, if they pasted one
2. a URL for the same key already in the conversation, the branch description, or a commit trailer
3. repo configuration: `AGENTS.md` / `CLAUDE.md`, `.git/config`, or a tracker env var (`JIRA_SITE`, `TRACKER_URL`)
4. the tracker MCP's own site listing (`getAccessibleAtlassianResources` and its equivalents). One site, use it; several, ask which
5. ask the user for the link

A tracker URL that came from none of these is invented. Don't write it.

## 3. Pick the fetcher

| Source | Preferred | Fallback |
|---|---|---|
| Jira issue | `schovi:jira-analyzer:jira-analyzer` | Jira / Atlassian MCP directly, condensed per `agents/jira-analyzer/AGENT.md` |
| GitHub PR or issue | current repo: `gh pr view` / `gh issue view` inline. Another repo, or a large PR: `schovi:gh-pr-reviewer:gh-pr-reviewer` | `gh api` |
| Datadog | `schovi:datadog-analyzer:datadog-analyzer` | Datadog MCP directly, condensed per `agents/datadog-analyzer/AGENT.md` |
| Any other URL | the MCP server for that host, when one is connected | WebFetch, then ask the user to paste |
| File | read it |  |
| Folder | read the main document, preferring `spec*.md`, then `plan*.md`, then `README.md`, then the first `.md` |  |
| Text | use as-is |  |

**Matching an arbitrary URL to an MCP server.** Map the host to a connected tool namespace (`mcp__<product>__*`, `mcp__claude_ai_<Product>__*`): `linear.app` to Linear, `*.notion.so` to Notion, `*.atlassian.net/wiki` to Confluence, `*.slack.com/archives` to Slack, a product's own domain to that product's server. Inside the server, prefer a fetch-by-URL or get-by-id tool (`*fetch*`, `*get_*`, `*_document`, `*_page`) and fall back to its search tool keyed on the id from the URL. The live tool descriptions are the authority on parameters. If no namespace matches the host, WebFetch it; if that fails on an auth wall or a JS-only app, say so in one line and ask for the content or a file instead.

**A file or text that carries a link.** If the content names a canonical source and the skill needs more than the file gives, resolve that one link too. Don't chase links recursively.

## 4. Fetch inline or in a subagent

Same judgment call as everywhere else in this plugin: isolate a payload that is genuinely large or mostly noise (a ticket with 50 comments, a log dump, an oversized PR), read it inline when it isn't. A subagent round-trip costs latency and fidelity, so it has to buy back more than it costs.

## 5. Return contract

Whoever fetches, subagent or inline, hands the calling skill:

- **Canonical URL** — the link a reader can open. Required; this is what a PR's Context section cites
- **Title** — the source's own title, plus the ticket key when there is one
- **What and why** — the problem or goal in a few lines, markup stripped
- **Acceptance criteria or constraints** — as written, when the source has them
- **Signal from the discussion** — only the comments that change the approach, attributed
- **Technical references** — file paths, service names, error strings, environments, verbatim

Roughly 1000 tokens. Never pass the raw payload back to the caller.

## 6. Never block the skill

An unavailable or failed source degrades, it doesn't stop the work: report the failure in one line, continue from what you have (commit history, the diff, the reference text), and ask for a link only where the skill genuinely needs one. Never invent a URL, a ticket key, or an acceptance criterion.

## Codex

No `Agent` tool: run the preferred fetch inline with the MCP or `gh` tooling and condense per the matching `AGENT.md` in `plugins/schovi/agents/`.
