---
name: jira-auto-detector
description: "Auto-detection: when user mentions Jira issues (EC-1234, IS-8046, PROJ-567, Atlassian URLs) and needs context (asking about issue, requesting implementation, analyzing, comparing), automatically fetches condensed summary via jira-analyzer subagent. Skips auto-fetch for past tense mentions ('I fixed EC-1234'), passive listings, technical identifiers (endpoint names), already-fetched issues, or casual references."
user-invocable: false
---

# Jira Auto-Detector Skill

Seamlessly integrates Jira issue context into conversations without polluting the main context window. You decide WHEN to fetch; the jira-analyzer subagent decides HOW to fetch and what to condense.

When an explicit skill is invoked with a Jira ID as argument (`/schovi:publish EC-1234`, `/schovi:review EC-1234`, `/schovi:debug EC-1234`), that skill owns the fetching. Don't activate on top of it.

## Codex Compatibility

If a Claude-style `Agent` tool or custom `subagent_type` is unavailable, use the configured Jira MCP tools directly and return the same condensed summary shape. Keep the main response concise and never paste raw Jira payloads.

## Pattern Recognition

- **Issue keys**: `[A-Z]{2,10}-\d{1,6}` (EC-1234, IS-8046, PROJ-567)
- **URLs**: `https://productboard.atlassian.net/browse/[KEY]`
- **Multiple mentions**: "Compare EC-1234 and IS-8046"

## When to Fetch

- Direct questions: "What is EC-1234 about?", "Tell me about IS-8046"
- Analysis requests: "Analyze EC-1234", "Investigate IS-8046"
- Implementation requests: "Implement EC-1234", "Fix IS-8046"
- Problem-solving: "How should I approach EC-1234?"
- Comparisons: "Compare EC-1234 and IS-8046"

## When to Skip

- Past tense: "I fixed EC-1234 yesterday", "EC-1234 was released last week"
- Passive listing: "Released with EC-1234, EC-1235, IS-8046", "Changelog: EC-1234"
- Technical identifiers: "The EC-1234 endpoint returns JSON", "table PROJ_567_users"
- Casual reference: "Similar to EC-1234 but different", "like we did in PROJ-567"
- Already fetched this session (check transcript for previous jira-analyzer calls)

## Workflow

### Step 1: Detect & Evaluate

Scan the message for issue keys and Atlassian URLs. For each match, apply the fetch/skip rules above. Ask yourself: will I need issue details to answer, or is this a passing mention?

### Step 2: Fetch

Acknowledge detection first:

```markdown
🎯 **[Jira Auto-Detector]** Detected issue reference: [ISSUE-KEY]
⏳ Fetching issue details...
```

Then spawn the subagent:

```
Tool: Agent
Parameters:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  prompt: "Fetch and summarize https://productboard.atlassian.net/browse/[ISSUE-KEY]"
  description: "Fetching Jira issue context"
```

Always pass the FULL browse URL, not the bare key, so the subagent parses the issue reliably.

Expected output: structured summary (~800 tokens) with core info (type, status, priority), condensed description, acceptance criteria, key comments, technical context.

### Step 3: Integrate Naturally

Confirm completion (`✅ **[Jira Auto-Detector]** Issue details fetched successfully`), then answer using the relevant parts of the summary. Acknowledge you fetched it ("Based on EC-1234..."), don't regurgitate the whole summary.

### Step 4: Multiple Issues

- Prioritize the issue most central to the question; fetch others only if needed (e.g. comparison)
- Fetch sequentially, max 3 issues per response
- For long lists, ask which ones the user wants details on

## Session Memory

Track what you've fetched this conversation (look for "Jira Issue Summary: [KEY]" in the transcript). Reuse existing context instead of re-fetching.

## Error Handling

- **Issue not found**: "I couldn't fetch EC-1234, it might not exist or you may not have access. Can you verify the issue key?"
- **API error**: Ask the user for the key details manually; never block on a failed fetch
- **Timeout**: Ask clarifying questions in the meantime, incorporate the summary when it arrives

## Examples

- "What is EC-1234 about?" → fetch, answer from summary
- "Implement IS-8046" → fetch, plan implementation from acceptance criteria
- "I finished EC-1234 yesterday, now working on EC-1235" → fetch neither; ask what help they need with EC-1235
- "The EC-1234 endpoint is returning 500 errors" → no fetch (endpoint name), debug the endpoint
- "Can you also check if EC-1234 affects the login flow?" (fetched earlier) → reuse previous summary
