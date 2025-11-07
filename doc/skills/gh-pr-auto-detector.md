# `gh-pr-auto-detector` Skill

## Description

Automatic detection skill that identifies GitHub PR and issue mentions across ALL conversations and intelligently fetches context when needed. Works in any conversation, not just plugin commands.

## Purpose

Provide seamless GitHub integration by:
- Detecting PR/issue patterns (URLs, #123, owner/repo#123)
- Classifying user intent (full context, reviews focus, CI focus, minimal)
- Resolving repository for short formats (#123)
- Fetching appropriate context level
- Reusing already-fetched context within conversation

## Detection Patterns

- Full URLs: `https://github.com/owner/repo/pull/123`, `https://github.com/owner/repo/issues/456`
- Short format: `owner/repo#123`
- Repo-relative: `#123` (resolves from git remote)
- Descriptive: "PR #123", "pull request 123", "issue #456"

## Intelligence Features

✅ **Fetch When**:
- User asks about PR/issue
- User requests review/analysis
- PR/issue mentioned in present/future tense

❌ **Skip When**:
- Past tense mentions ("I merged #123", "We closed #456")
- Already fetched in current conversation
- False positives
- User explicitly asks not to fetch

### Intent Classification

**Full Context** - Spawns `gh-pr-analyzer` (compact mode):
- General questions ("What's in #123?")
- Analysis requests
- Default mode

**Reviews Focus** - May fetch reviews specifically:
- "What feedback on #123?"
- "Show me review comments"

**CI Focus** - May fetch CI status specifically:
- "Did #123 pass CI?"
- "What failed in #123?"

**Minimal** - Skip fetch:
- Just referencing PR number
- Past tense mentions

## Repository Resolution

For short format (#123):
1. Extract from git remote: `git remote get-url origin`
2. Parse owner/repo from URL
3. Construct full format: `owner/repo#123`

## Dependencies

### Calls
- `gh-pr-analyzer` agent (for compact PR context)
- `gh-issue-analyzer` agent (for issue context)
- Git commands (for repo resolution)

### Called By
- Automatic activation (not user-invoked)
- Works in any conversation context

## Token Savings

By using context isolation via subagents:
- Without isolation: 20-50k tokens in main context
- With isolation (compact): ~800-1000 tokens returned
- **Savings: ~80-95%**

## Usage Pattern

Automatic - no user invocation needed. Examples:

```
User: "Review #123"
→ Skill detects #123
→ Resolves repo from git remote: owner/repo
→ Classifies intent: full context + review focus
→ Spawns gh-pr-analyzer subagent (compact mode)
→ Returns ~800 token summary

User: "I merged #123 yesterday"
→ Skill detects #123
→ Classifies intent: past tense, skip fetch
→ Skips fetching

User: "Did owner/repo#456 pass CI?"
→ Skill detects owner/repo#456
→ Classifies intent: CI focus
→ Spawns gh-pr-analyzer with CI focus
→ Returns summary with CI details

User: "What's the issue with https://github.com/owner/repo/issues/789?"
→ Skill detects issue URL
→ Spawns gh-issue-analyzer subagent
→ Returns ~800 token summary
```

## PR vs Issue Detection

- `/pull/` or `#123` with PR context → PR analyzer
- `/issues/` or issue keywords → Issue analyzer
- Ambiguous `#123` → Defaults to PR analyzer

## Quality Requirements

- Accurately classify user intent
- Correctly resolve repository for #123 format
- Distinguish between PRs and issues
- Reuse context when already fetched
- Avoid false positives
- Always use appropriate analyzer subagent (never fetch directly)

## Location

`schovi/skills/gh-pr-auto-detector/SKILL.md`
