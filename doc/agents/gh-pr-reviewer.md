# `gh-pr-reviewer` Agent

## Description

Context-isolated subagent that fetches **comprehensive** GitHub PR data with complete diff for code review. Provides full PR context including all files, reviews, CI checks, and actual diff content.

## Purpose

Fetch complete GitHub PR data for code review with:
- ALL changed files (not just top 20)
- ALL review comments (not just critical)
- ALL CI checks (not just failed)
- **Complete diff content** (for normal PRs)
- PR head SHA (for file fetching)

Handles massive PRs (>50 files or >5000 lines) by omitting diff and returning file stats only.

## Input

- PR URL (https://github.com/owner/repo/pull/123)
- Short format (owner/repo#123 or #123)

## Output

### Normal PRs (≤50 files, ≤5000 lines)
Comprehensive data with complete diff (max 15000 tokens):
- PR title, number, author, status, branch names, PR head SHA
- ALL changed files with stats
- ALL review comments
- ALL CI checks (passed and failed)
- **Complete diff content** (full file diffs)
- Labels, milestones, assignees

### Massive PRs (>50 files or >5000 lines)
File stats only without diff (max 3000 tokens):
- PR metadata (same as normal)
- ALL changed files with stats (but no diff)
- ALL reviews and CI checks
- Message: "Diff omitted (massive PR)"

## Token Budget

- Normal PRs: **Max 15000 tokens**
- Massive PRs: **Max 3000 tokens**

## Mode

**Full only** - For comprehensive code review with actual source code

For concise PR context in general analysis, see `gh-pr-analyzer` agent.

## Tools Used

- `gh` CLI via Bash tool
- GitHub API via Bash tool
- Git commands via Bash tool

## Dependencies

### Called By
- `/schovi:review` command only

### Calls
- GitHub CLI and API tools only (no subagents)

## Token Savings

For normal PRs:
- Typical PR payload: 20-50k tokens (raw)
- Full summary with diff: ~10000-15000 tokens
- **Savings: ~25-50%** (still provides complete diff)

For massive PRs:
- Typical PR payload: 50-100k+ tokens
- File stats only: ~3000 tokens
- **Savings: ~95-97%**

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:gh-pr-auto-detector:gh-pr-reviewer"
  prompt: "Fetch and summarize GitHub PR owner/repo#123 in full mode with complete diff"
  description: "Fetching PR for review"
```

## Quality Requirements

- Return ALL files, not just top 20
- Return ALL review comments, not just critical
- Return ALL CI checks, passed and failed
- Include complete diff content for normal PRs
- Include PR head SHA for file fetching
- For massive PRs, return file stats but omit diff
- Never exceed token budgets
- Clearly indicate when diff is omitted

## Difference from gh-pr-analyzer

| Feature | gh-pr-analyzer (compact) | gh-pr-reviewer (full) |
|---------|-------------------------|---------------------|
| Purpose | General analysis | Code review |
| Files | Top 20 | ALL files |
| Reviews | Max 3 critical | ALL reviews |
| CI Checks | Failed only | ALL checks |
| Diff | Compact summary | Complete diff |
| Token Budget | Max 1200 | Max 15000 |
| Used By | brainstorm, research, debug, plan | review command only |

## Location

`schovi/agents/gh-pr-reviewer/AGENT.md`
