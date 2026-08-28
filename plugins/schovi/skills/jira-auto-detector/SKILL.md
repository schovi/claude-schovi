---
name: jira-auto-detector
description: "Auto-detection: when user mentions Jira issues (PROJ-123, ABC-456, XY-789, Atlassian URLs) and needs context (asking about issue, requesting implementation, analyzing, comparing), automatically fetches condensed summary via jira-analyzer subagent. Skips auto-fetch for past tense mentions ('I fixed PROJ-123'), passive listings, technical identifiers (endpoint names), already-fetched issues, or casual references."
user-invocable: false
---

# Jira Auto-Detector Skill

Seamlessly integrates Jira issue context into conversations without polluting the main context window. You decide WHEN to fetch; the jira-analyzer subagent decides HOW to fetch and what to condense.

When an explicit skill is invoked with a Jira ID as argument (`/schovi:publish PROJ-123`, `/schovi:review PROJ-123`, `/schovi:debug PROJ-123`), that skill owns the fetching. Don't activate on top of it.

## Codex Compatibility

If a Claude-style `Agent` tool or custom `subagent_type` is unavailable, use the configured Jira MCP tools directly and return the same condensed summary shape. Keep the main response concise and never paste raw Jira payloads.

## Pattern Recognition

- **Issue keys**: `[A-Z]{2,10}-\d{1,6}` (PROJ-123, ABC-456, XY-789)
- **URLs**: `https://<site>.atlassian.net/browse/[KEY]`, or your tracker's own issue URL shape
- **Multiple mentions**: "Compare PROJ-123 and ABC-456"

## When to Fetch

- Direct questions: "What is PROJ-123 about?", "Tell me about ABC-456"
- Analysis requests: "Analyze PROJ-123", "Investigate ABC-456"
- Implementation requests: "Implement PROJ-123", "Fix ABC-456"
- Problem-solving: "How should I approach PROJ-123?"
- Comparisons: "Compare PROJ-123 and ABC-456"

## When to Skip

- Past tense: "I fixed PROJ-123 yesterday", "PROJ-123 was released last week"
- Passive listing: "Released with PROJ-123, PROJ-124, ABC-456", "Changelog: PROJ-123"
- Technical identifiers: "The PROJ-123 endpoint returns JSON", "table XY_789_users"
- Casual reference: "Similar to PROJ-123 but different", "like we did in XY-789"
- Already fetched this session (check transcript for previous jira-analyzer calls)

## Workflow

### Step 1: Detect & Evaluate

Scan the message for issue keys and Atlassian URLs. For each match, apply the fetch/skip rules above. Ask yourself: will I need issue details to answer, or is this a passing mention?

### Step 2: Fetch

Spawn the subagent. Don't announce the detection or narrate the fetch; the answer is what the user wants.

```
Tool: Agent
Parameters:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  prompt: "Fetch and summarize [ISSUE-KEY] at [BROWSE-URL]"
  description: "Fetching Jira issue context"
```

Pass the full browse URL whenever the message or the session gives you one, so the subagent doesn't have to resolve the site. With only a bare key, pass the key and say which site you resolved (or that you couldn't), and let the analyzer resolve or ask. Never fabricate a site host.

Expected output: structured summary (~800 tokens) with core info (type, status, priority), condensed description, acceptance criteria, key comments, technical context.

### Step 3: Integrate Naturally

Answer using the relevant parts of the summary. Ground the answer in the issue ("Based on PROJ-123...") so it's clear where it came from, but don't regurgitate the whole summary.

### Step 4: Multiple Issues

- Prioritize the issue most central to the question; fetch others only if needed (e.g. comparison)
- Fetch sequentially, max 3 issues per response
- For long lists, ask which ones the user wants details on

## Session Memory

Track which issue keys you've already fetched this conversation. Reuse that context instead of re-fetching; only fetch again if the user asks for fresh data.

## Error Handling

- **Issue not found**: "I couldn't fetch PROJ-123, it might not exist or you may not have access. Can you verify the issue key?"
- **API error**: Ask the user for the key details manually; never block on a failed fetch
- **Timeout**: Ask clarifying questions in the meantime, incorporate the summary when it arrives

## Examples

- "What is PROJ-123 about?" → fetch, answer from summary
- "Implement ABC-456" → fetch, plan implementation from acceptance criteria
- "I finished PROJ-123 yesterday, now working on PROJ-124" → fetch neither; ask what help they need with PROJ-124
- "The PROJ-123 endpoint is returning 500 errors" → no fetch (endpoint name), debug the endpoint
- "Can you also check if PROJ-123 affects the login flow?" (fetched earlier) → reuse previous summary
