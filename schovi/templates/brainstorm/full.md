# Brainstorm Output Template

This template defines the structure for brainstorm command output. The brainstorm-generator subagent reads this template to generate consistent, well-structured solution exploration with 2-3 distinct options.

## Purpose

Brainstorm provides **broad exploration** of 2-3 distinct solution approaches with:
- High-level feasibility assessment
- Benefits and challenges per option
- Light codebase context (no deep file:line drilling)
- Recommendation for which option to research further

**NOT included**: Deep technical analysis, detailed implementation steps, exhaustive dependency mapping. Use research command for depth.

---

## Template Structure

```markdown
# 🧠 Brainstorm: [Problem Title]

**Context ID**: [Jira ID, GitHub Issue/PR, or "Custom"]
**Generated**: [Timestamp]
**Work Folder**: [Path to WIP folder]

---

## 📋 Problem Summary

[2-4 paragraphs explaining:]
- What problem/feature/change is being addressed
- Why it matters (business impact, user impact, technical debt)
- Current pain points or gaps
- Key context from external sources (Jira description, GitHub issue, etc.)

**Scope**: [What's in scope, what's explicitly out of scope]

---

## 🎯 Constraints & Requirements

### Technical Constraints
- [e.g., Must maintain backward compatibility]
- [e.g., Performance budget: <200ms response time]
- [e.g., Cannot modify database schema]

### Business Requirements
- [e.g., Must support 10k concurrent users]
- [e.g., Rollout to 25% of users initially]

### Dependencies
- [e.g., Requires Auth v2 migration to complete first]
- [e.g., Frontend team must coordinate on API changes]

---

## 💡 Solution Options

### Option 1: [Approach Name - e.g., "Incremental Refactor with Feature Flags"]

**Overview**: [2-4 sentences describing the high-level approach]

**Key Components**:
- Component/area 1 that needs changes (high-level file/folder reference)
- Component/area 2 that needs changes
- Component/area 3 that needs changes

**Benefits**:
- ✅ [Benefit 1 - e.g., Low risk, can roll back easily]
- ✅ [Benefit 2 - e.g., Minimal disruption to existing code]
- ✅ [Benefit 3 - e.g., Allows parallel team work]

**Challenges**:
- ⚠️ [Challenge 1 - e.g., Increases code complexity temporarily]
- ⚠️ [Challenge 2 - e.g., Requires 2-3 sprint timeline]
- ⚠️ [Challenge 3 - e.g., Need to maintain dual paths during migration]

**Feasibility**: [High/Medium/Low]
**Estimated Effort**: [e.g., 3-5 days, 2-3 sprints]
**Risk Level**: [Low/Medium/High]

---

### Option 2: [Approach Name - e.g., "Big Bang Replacement"]

**Overview**: [2-4 sentences describing the high-level approach]

**Key Components**:
- Component/area 1 that needs changes
- Component/area 2 that needs changes
- Component/area 3 that needs changes

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Feasibility**: [High/Medium/Low]
**Estimated Effort**: [e.g., 1-2 weeks]
**Risk Level**: [Low/Medium/High]

---

### Option 3: [Approach Name - e.g., "Hybrid Approach with Adapter Pattern"] *(if applicable)*

**Overview**: [2-4 sentences describing the high-level approach]

**Key Components**:
- Component/area 1 that needs changes
- Component/area 2 that needs changes
- Component/area 3 that needs changes

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Feasibility**: [High/Medium/Low]
**Estimated Effort**: [e.g., 5-7 days]
**Risk Level**: [Low/Medium/High]

---

## 📊 Comparison Matrix

| Criteria | Option 1 | Option 2 | Option 3 |
|----------|----------|----------|----------|
| **Effort** | [e.g., Medium] | [e.g., Low] | [e.g., High] |
| **Risk** | [e.g., Low] | [e.g., High] | [e.g., Medium] |
| **Timeline** | [e.g., 3-5 days] | [e.g., 1-2 days] | [e.g., 1-2 weeks] |
| **Complexity** | [e.g., Medium] | [e.g., Low] | [e.g., High] |
| **Maintainability** | [e.g., High] | [e.g., Medium] | [e.g., High] |
| **Rollback Ease** | [e.g., Easy] | [e.g., Hard] | [e.g., Medium] |

---

## 🎯 Recommendation

**Recommended Option**: [Option N - Name]

**Reasoning**:
[2-3 paragraphs explaining why this option is recommended considering:]
- Risk vs. reward balance
- Team capacity and timeline
- Technical constraints
- Business priorities
- Long-term maintainability

**Next Steps**:
1. Run `/schovi:research --input brainstorm-[ID].md --option [N]` for deep technical analysis
2. [Other preparatory steps if needed]

---

## 📚 Exploration Notes

**Codebase Areas Examined**:
- [Area 1 - e.g., `src/api/controllers/`]
- [Area 2 - e.g., `src/services/auth/`]
- [Area 3 - e.g., `tests/integration/`]

**Key Patterns Identified**:
- [Pattern 1 - e.g., All controllers use middleware chain pattern]
- [Pattern 2 - e.g., Auth service has singleton lifecycle]

**Assumptions Made**:
- [Assumption 1 - e.g., Database migration tools are available]
- [Assumption 2 - e.g., Frontend can adapt to API changes within 1 sprint]

**Open Questions** *(to investigate during research phase)*:
- [Question 1 - e.g., Can we use existing cache invalidation, or need new approach?]
- [Question 2 - e.g., What's the exact performance impact of Option 2?]
```

---

## Guidelines for Subagent

### Content Generation

**Problem Summary**:
- Extract from Jira/GitHub issue or provided description
- Focus on WHAT and WHY, not HOW
- Keep concise but complete (2-4 paragraphs max)
- Include scope boundaries

**Constraints & Requirements**:
- Technical: Architecture, performance, compatibility, security
- Business: Timeline, user impact, rollout strategy
- Dependencies: Prerequisites, team coordination, external factors
- Be specific, not generic (e.g., "Must support 10k users" not "Must scale")

**Solution Options**:
- Generate 2-3 DISTINCT approaches (not variations of same idea)
- Each option should have clear trade-offs
- Avoid bias - present pros/cons objectively
- Keep component descriptions high-level (folder/area, not specific file:line)
- Estimate effort realistically based on codebase complexity

**Comparison Matrix**:
- Use consistent criteria across all options
- Be honest about trade-offs
- Consider: Effort, Risk, Timeline, Complexity, Maintainability, Rollback

**Recommendation**:
- Pick ONE option as recommended (can be "depends on...")
- Explain reasoning clearly with specific factors
- Be pragmatic - consider team velocity, business constraints
- If no clear winner, explain decision criteria for stakeholders

### Validation Checklist

Before returning output, verify:

- [ ] Problem summary is clear and complete (2-4 paragraphs)
- [ ] Constraints are specific, not generic
- [ ] 2-3 distinct options provided (not variations)
- [ ] Each option has overview + components + benefits + challenges
- [ ] Feasibility, effort, and risk assessed for each option
- [ ] Comparison matrix completed with consistent criteria
- [ ] One option recommended with clear reasoning
- [ ] Exploration notes document what was examined
- [ ] Open questions identified for research phase
- [ ] Output adheres to markdown structure exactly
- [ ] Total output is ~2000-3000 tokens (broad, not deep)

### Token Budget

**Maximum**: 3500 tokens for entire output

**Target Distribution**:
- Problem Summary: ~300 tokens
- Constraints: ~200 tokens
- Option 1: ~400 tokens
- Option 2: ~400 tokens
- Option 3: ~400 tokens (if applicable)
- Comparison Matrix: ~150 tokens
- Recommendation: ~300 tokens
- Exploration Notes: ~200 tokens

**If over budget**: Trim exploration notes first, then compress option descriptions while keeping structure.

---

## Example Output

See `schovi/templates/brainstorm/example.md` for a full example (to be created if needed).

---

**Version**: 1.0
**Last Updated**: 2025-11-07
**Related Templates**: `templates/research/full.md`, `templates/spec/full.md`
