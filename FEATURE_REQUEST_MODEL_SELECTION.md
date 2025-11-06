# Feature Request: Support Model Selection for Plugin Subagents

## Problem Statement

Plugin subagents spawned via the `Task` tool currently inherit the parent context's model (e.g., Claude Sonnet 4.5). This creates inefficiency when subagents perform simple, non-reasoning tasks like:
- Fetching data from APIs (Jira, GitHub, Datadog)
- Transforming structured data (JSON → Markdown)
- Condensing large payloads (10k tokens → 800 tokens)
- Generating templated outputs (specifications, reports)

These tasks don't require Sonnet's advanced reasoning capabilities, yet they consume Sonnet's pricing, wasting **73% of the cost** compared to using Haiku for the same task.

## Real-World Use Case

I maintain a production Claude Code plugin for engineering workflow automation with **6 data-fetching subagents**:

### Current Architecture (Forced to Use Sonnet)
```
/schovi:review PR#123
├─ Main Review (Sonnet 4.5) ✅ Needs reasoning
└─ gh-pr-reviewer subagent (Sonnet 4.5) ❌ Simple data fetch
   ├─ Fetches PR via gh CLI
   ├─ Extracts metadata, files, reviews
   ├─ Condenses 50k payload → 10k summary
   └─ Returns to parent
```

**Current cost**: $0.59 per review (after optimization)
- Subagent: ~$0.41 (70k tokens × Sonnet pricing)
- Main analysis: ~$0.18

### Desired Architecture (With Model Selection)
```
/schovi:review PR#123
├─ Main Review (Sonnet 4.5) ✅ Needs reasoning
└─ gh-pr-reviewer subagent (Haiku 3.5) ✅ Simple data fetch
   ├─ Fetches PR via gh CLI
   ├─ Extracts metadata, files, reviews
   ├─ Condenses 50k payload → 10k summary
   └─ Returns to parent
```

**Future cost**: $0.30-0.35 per review (38% additional savings)
- Subagent: ~$0.12-0.15 (70k tokens × Haiku pricing, 73% cheaper)
- Main analysis: ~$0.18

## Impact Analysis

### Cost Comparison (Per Subagent Call)

**Sonnet 4.5 (Current)**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Example 70k token subagent: ~$0.69

**Haiku 3.5 (Proposed)**
- Input: $0.80 per 1M tokens (4x cheaper)
- Output: $4 per 1M tokens (3.75x cheaper)
- Same 70k token subagent: ~$0.184
- **Savings: 73% per subagent call**

### Production Savings (Monthly)

| Scenario | Current (Optimized) | With Haiku | Savings |
|----------|---------------------|------------|---------|
| 20 reviews/month | $11.80 | **$6.50** | $5.30 |
| 100 reviews/month | $59 | **$32.50** | **$26.50** |
| 500 reviews/month | $295 | **$162.50** | **$132.50** |
| **Annual (100/mo)** | **$708** | **$390** | **$318/year** |

### Additional Benefits
- ⚡ **2-3x faster execution** (Haiku is faster than Sonnet)
- 🎯 **Better cost/performance optimization** for production plugins
- 🧩 **Right tool for the job** (use expensive models only when needed)

## Proposed Solution

Add optional `model` parameter to specify which Claude model a subagent should use.

### Option A: Task Tool Parameter (Preferred)

```markdown
# Current (no model selection)
Task tool:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  prompt: "Fetch and summarize GitHub PR #123"
  description: "Fetching PR data"

# Proposed (with model selection)
Task tool:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  model: "claude-3-5-haiku-20241022"  # NEW
  prompt: "Fetch and summarize GitHub PR #123"
  description: "Fetching PR data"
```

**Pros**: Explicit per-call control, easy to override in special cases

**Cons**: Slightly more verbose

### Option B: AGENT.md Frontmatter (Alternative)

```yaml
---
name: gh-pr-reviewer
description: Fetches comprehensive GitHub PR data for review
allowed-tools: ["Bash"]
model: claude-3-5-haiku-20241022  # NEW - default model for this agent
---
```

**Pros**: Set once, applies to all invocations, cleaner call sites

**Cons**: Less flexibility for per-call overrides

### Option C: Hybrid (Best of Both)

```yaml
# Agent defines preferred model
---
name: gh-pr-reviewer
model: claude-3-5-haiku-20241022  # DEFAULT
---
```

```markdown
# Task tool can override if needed
Task tool:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  model: "claude-sonnet-4-5"  # OVERRIDE for complex case
  prompt: "..."
```

**Pros**: Best of both worlds - sensible defaults with override capability

## Implementation Suggestions

### Model Inheritance Hierarchy
```
1. Task tool `model` parameter (highest priority)
2. AGENT.md `model` field (agent default)
3. Parent context model (current behavior, lowest priority)
```

### Validation
- Validate model string against available Claude models
- Provide clear error if model doesn't exist or lacks required capabilities
- Warn if agent's `allowed-tools` might not work with selected model

### Documentation Updates
- Add `model` field to AGENT.md spec
- Document in plugin authoring guide
- Provide examples of when to use Haiku vs Sonnet vs Opus

## Ideal Subagents for Haiku

Based on my production plugin, these agent types are perfect for Haiku:

| Agent Type | Current | With Haiku | Task Complexity |
|------------|---------|------------|-----------------|
| **API Data Fetchers** | Sonnet | ✅ Haiku | Fetch Jira/GitHub/Datadog, extract fields |
| **Data Transformers** | Sonnet | ✅ Haiku | JSON → Markdown, condense 10k→800 tokens |
| **Structured Generators** | Sonnet | ✅ Haiku | Generate specs, reports from templates |
| **Code Analyzers** | Sonnet | ❌ Sonnet | Deep reasoning, security analysis |
| **Planning Agents** | Sonnet | ❌ Sonnet | Strategic decisions, trade-offs |

## Backwards Compatibility

This feature would be **fully backwards compatible**:
- Existing plugins without `model` field work unchanged
- Default behavior: inherit parent's model (current behavior)
- Opt-in feature: only affects agents that specify a model

## Related Work

Similar patterns exist in other agent frameworks:
- **LangChain**: Allows per-agent model specification
- **AutoGPT**: Supports model selection for sub-agents
- **Semantic Kernel**: Model selection via configuration

## My Plugin's Readiness

I've already documented the preferred models in my production plugin:

```yaml
# schovi/agents/gh-pr-reviewer/AGENT.md
---
name: gh-pr-reviewer
allowed-tools: ["Bash"]
# preferred-model: claude-3-5-haiku-20241022
# TODO: When Claude Code supports model selection, use Haiku for 73% cost savings
---
```

All 6 of my data-fetching agents are ready to switch to Haiku **immediately** when this feature becomes available. Just need to uncomment the line!

## Request

Please consider adding model selection for subagents to enable cost-effective plugin development. This would:
1. **Reduce production costs by 40-70%** for plugins with multiple subagents
2. **Improve performance** (faster execution with Haiku)
3. **Enable better architectural decisions** (right model for each task)
4. **Support sustainable plugin ecosystems** (lower costs = more plugins)

## References

- **Plugin**: https://github.com/schovi/claude-schovi (production engineering workflow automation)
- **Agents using this**: 6 data-fetching subagents (jira-analyzer, gh-pr-reviewer, gh-pr-analyzer, gh-issue-analyzer, spec-generator, debug-fix-generator)
- **Current optimization**: Already reduced costs 50% through token optimization, but hitting architectural limits without model selection

---

**Thank you for considering this feature!** Happy to provide more details, test early implementations, or contribute to documentation if this moves forward.
