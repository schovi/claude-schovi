---
name: gh-pr-auto-detector
description: "Auto-detection: when user mentions GitHub PRs (URLs, #123, owner/repo#123, 'PR #123') and needs context (asking questions, checking CI status, comparing, applying changes), automatically fetches condensed PR summary via gh-pr-reviewer subagent. Skips auto-fetch for past tense mentions, passive listings, technical identifiers, or already-fetched PRs."
user-invocable: false
---

# GitHub PR Auto-Detector Skill

Seamlessly integrates GitHub PR context into conversations without polluting the main context window. You decide WHEN to fetch; the gh-pr-reviewer subagent decides HOW to fetch and what to condense.

For explicit review requests ("review #123", `/schovi:review`), the `review` skill owns the whole flow. Don't activate on top of it.

## Codex Compatibility

If a Claude-style `Task` tool or custom `subagent_type` is unavailable, use the `gh` CLI commands described in `plugins/schovi/agents/gh-pr-reviewer/AGENT.md` directly, then condense the result. Never paste raw PR payloads.

## Pattern Recognition

- **Full URL**: `https://github.com/owner/repo/pull/123`
- **Short form**: `owner/repo#123`
- **Hash-only**: `#123`
- **Explicit**: "PR #123", "pull request 123"

**Repository resolution for bare `#123`:**
1. Check conversation history for previous repo context
2. Check cwd: `git remote get-url origin`, parse owner/repo
3. If neither works, ask user to clarify

## When to Fetch

- Questions about a PR: "What is #123 about?", "What's in owner/repo#456?"
- Status checks: "Did CI pass on #123?", "Is #456 approved?"
- Context needs: "Apply changes from #123", "Why did #123 fail?"
- Comparisons: "Compare #123 and #456"

## When to Skip

- Past tense: "I merged #123 yesterday", "Fixed in #456"
- Passive listing: "Released with #123, #124, #125"
- Technical identifier: "The PR-123 endpoint", "Variable pr_456_result"
- Already fetched this session (check transcript for previous gh-pr-reviewer calls)

## Workflow

### Step 1: Detect & Evaluate

Scan the message for PR patterns. For each match, apply the fetch/skip rules above.

### Step 2: Fetch

```
Tool: Task
Parameters:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  prompt: "Fetch and summarize GitHub PR: [owner/repo#number or URL]"
  description: "Fetching GitHub PR context"
```

### Step 3: Integrate Naturally

Answer the user's question using the relevant parts of the summary. Don't regurgitate the full summary.

**Multiple PRs:** Fetch max 3 per response. Launch in parallel when independent.

## Session Memory

Track what you've fetched this conversation. Reuse existing context; re-fetch only if the user explicitly requests fresh data or needs different aspects.

## Error Handling

- **PR not found**: Report error, suggest checking PR number and repository
- **Auth failure**: Suggest `gh auth login`
- **Missing repo context**: Ask user to specify as `owner/repo#123`
