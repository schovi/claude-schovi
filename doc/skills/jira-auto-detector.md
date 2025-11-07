# `jira-auto-detector` Skill

## Description

Automatic detection skill that identifies Jira issue mentions across ALL conversations and intelligently fetches context when needed. Works in any conversation, not just plugin commands.

## Purpose

Provide seamless Jira integration by:
- Detecting Jira issue pattern mentions (EC-1234, IS-8046, etc.)
- Classifying user intent (asking about issue vs. mentioning past work)
- Fetching context only when relevant
- Reusing already-fetched context within conversation
- Avoiding false positives

## Detection Pattern

Regex: `[A-Z]{2,10}-\d{1,6}`

Examples:
- EC-1234
- IS-8046
- PROJ-123456

## Intelligence Features

✅ **Fetch When**:
- User asks about the issue ("What is EC-1234?", "Analyze EC-1234")
- User requests analysis/details
- Issue mentioned in present/future tense

❌ **Skip When**:
- Past tense mentions ("I fixed EC-1234", "We merged EC-1234")
- Issue already fetched in current conversation
- False positives (code snippets, error messages)
- User explicitly asks not to fetch

## Dependencies

### Calls
- `jira-analyzer` agent (for fetching Jira data)

### Called By
- Automatic activation (not user-invoked)
- Works in any conversation context

## Token Savings

By using context isolation via `jira-analyzer`:
- Without isolation: 10-15k tokens in main context
- With isolation: ~800 tokens returned to main context
- **Savings: ~75%**

## Usage Pattern

Automatic - no user invocation needed. Examples:

```
User: "Analyze EC-1234"
→ Skill detects EC-1234
→ Classifies intent: needs full context
→ Spawns jira-analyzer subagent
→ Returns 800 token summary to main context

User: "I already fixed EC-1234 last week"
→ Skill detects EC-1234
→ Classifies intent: past tense, no fetch needed
→ Skips fetching

User: "What's the status of EC-1234?"
→ Skill detects EC-1234
→ Checks: not already fetched in conversation
→ Spawns jira-analyzer subagent
→ Returns summary

User: "Still working on EC-1234"
→ Skill detects EC-1234
→ Checks: already fetched earlier in conversation
→ Reuses existing context, skips fetch
```

## Configuration

- Default Jira Cloud ID: `productboard.atlassian.net`
- Configurable via MCP server settings

## Quality Requirements

- Accurately classify user intent
- Reuse context when already fetched
- Avoid false positives (code snippets, logs)
- Respect past tense mentions (skip fetch)
- Always use `jira-analyzer` for fetching (never fetch directly)

## Location

`schovi/skills/jira-auto-detector/SKILL.md`
