# Support Model Selection for Plugin Subagents

## Problem

Plugin subagents spawned via `Task` tool currently inherit the parent's model (Sonnet 4.5), even when performing simple tasks that don't require advanced reasoning:
- API data fetching (Jira, GitHub, Datadog)
- Data transformation (JSON → Markdown)
- Payload condensing (10k tokens → 800 tokens)

**Result**: 73% cost waste compared to using Haiku for these tasks.

## Real-World Example

My production plugin performs PR code reviews:

**Current** (forced Sonnet for everything):
```
/schovi:review PR#123
├─ Main Review (Sonnet) ✅ needs reasoning
└─ gh-pr-reviewer (Sonnet) ❌ simple data fetch
    70k tokens × $0.000009 avg = $0.63
```
**Cost**: $0.59 per review

**Desired** (Haiku for data fetching):
```
/schovi:review PR#123
├─ Main Review (Sonnet) ✅ needs reasoning
└─ gh-pr-reviewer (Haiku) ✅ simple data fetch
    70k tokens × $0.0000024 avg = $0.17
```
**Cost**: $0.30 per review (38% additional savings)

**Savings**: $0.29 per review × 100 reviews/month = **$29/month** ($348/year)

## Proposed Solution

Add optional `model` parameter:

### Option A: Task Tool Parameter
```markdown
Task tool:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  model: "claude-3-5-haiku-20241022"  # NEW
  prompt: "Fetch PR data"
```

### Option B: AGENT.md Frontmatter
```yaml
---
name: gh-pr-reviewer
allowed-tools: ["Bash"]
model: claude-3-5-haiku-20241022  # NEW
---
```

### Option C: Hybrid (Preferred)
Agent defines default, Task tool can override.

## Impact

**Cost Reduction**:
- Per subagent call: 73% cheaper (Haiku vs Sonnet)
- 100 reviews/month: $29/month savings
- 500 reviews/month: $132/month savings

**Performance**: 2-3x faster (Haiku is faster)

**Better Architecture**: Right model for each task

## Backwards Compatibility

✅ Fully backwards compatible
- Existing plugins work unchanged
- Default: inherit parent's model (current behavior)
- Opt-in: specify model when beneficial

## My Plugin's Readiness

I've already documented preferred models in 6 data-fetching agents:
```yaml
# preferred-model: claude-3-5-haiku-20241022
# TODO: When Claude Code supports model selection
```

Ready to switch immediately when feature available!

**Plugin**: https://github.com/schovi/claude-schovi

---

**Thank you for considering!** This would enable cost-effective plugin development and better architectural decisions. Happy to test early implementations or contribute to docs.
