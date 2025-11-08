# Brainstorm Output Template

This template defines the structure for brainstorm command output. The brainstorm-executor subagent reads this template to generate consistent, well-structured solution exploration with 3-5 distinct options.

## Purpose

Brainstorm provides **broad exploration** of 3-5 distinct solution approaches with:
- Problem framing and constraints
- High-level option space (conceptual approaches, not implementation details)
- Relative sizing (S/M/L) for effort, risk, complexity
- Explicit assumptions and open questions
- Recommendation for which option to research further

**NOT included**: Implementation details (file paths, scripts, specific time estimates), deep technical analysis, exhaustive dependency mapping. Use research command for depth.

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

## 🔍 Assumptions & Unknowns

**Assumptions** *(explicitly labeled, ID for traceability)*:
- **A-1**: [Assumption statement - e.g., Database migration tools are available]
- **A-2**: [Assumption statement - e.g., Frontend can adapt to API changes within 1 sprint]
- **A-3**: [Assumption statement - e.g., Current auth middleware is compatible with new approach]

**Unknowns** *(need investigation in research phase)*:
- **U-1**: [Unknown question - e.g., Exact performance impact of caching strategy]
- **U-2**: [Unknown question - e.g., Third-party API rate limits for this use case]
- **U-3**: [Unknown question - e.g., Compatibility with legacy client versions]

**Fragment System**: These IDs will be used to create individual fragment files (`fragments/A-1.md`, `fragments/U-1.md`, etc.) for tracking across brainstorm → research → plan workflow.

---

## 💡 Solution Options

### Option 1: [Approach Name - e.g., "Incremental Refactor with Feature Flags"]

**Overview**: [2-4 sentences describing the high-level conceptual approach, NOT implementation details]

**Key Areas of Change** *(conceptual, not file paths)*:
- [Area 1 - e.g., Authentication layer]
- [Area 2 - e.g., Data validation logic]
- [Area 3 - e.g., API contract definitions]

**Benefits**:
- ✅ [Benefit 1 - e.g., Low risk, can roll back easily]
- ✅ [Benefit 2 - e.g., Minimal disruption to existing code]
- ✅ [Benefit 3 - e.g., Allows parallel team work]

**Challenges**:
- ⚠️ [Challenge 1 - e.g., Increases code complexity temporarily]
- ⚠️ [Challenge 2 - e.g., Need to maintain dual paths during migration]
- ⚠️ [Challenge 3 - e.g., Coordination required across multiple teams]

**Sizing**:
- **Effort**: S/M/L
- **Risk**: Low/Medium/High
- **Complexity**: Low/Medium/High

---

### Option 2: [Approach Name - e.g., "Big Bang Replacement"]

**Overview**: [2-4 sentences describing the high-level conceptual approach, NOT implementation details]

**Key Areas of Change** *(conceptual, not file paths)*:
- [Area 1 - e.g., Core business logic]
- [Area 2 - e.g., External integrations]
- [Area 3 - e.g., Database schema]

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Sizing**:
- **Effort**: S/M/L
- **Risk**: Low/Medium/High
- **Complexity**: Low/Medium/High

---

### Option 3: [Approach Name - e.g., "Hybrid Approach with Adapter Pattern"]

**Overview**: [2-4 sentences describing the high-level conceptual approach, NOT implementation details]

**Key Areas of Change** *(conceptual, not file paths)*:
- [Area 1]
- [Area 2]
- [Area 3]

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Sizing**:
- **Effort**: S/M/L
- **Risk**: Low/Medium/High
- **Complexity**: Low/Medium/High

---

### Option 4: [Approach Name] *(if applicable)*

**Overview**: [2-4 sentences describing the high-level conceptual approach, NOT implementation details]

**Key Areas of Change** *(conceptual, not file paths)*:
- [Area 1]
- [Area 2]
- [Area 3]

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Sizing**:
- **Effort**: S/M/L
- **Risk**: Low/Medium/High
- **Complexity**: Low/Medium/High

---

### Option 5: [Approach Name] *(if applicable)*

**Overview**: [2-4 sentences describing the high-level conceptual approach, NOT implementation details]

**Key Areas of Change** *(conceptual, not file paths)*:
- [Area 1]
- [Area 2]
- [Area 3]

**Benefits**:
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Challenges**:
- ⚠️ [Challenge 1]
- ⚠️ [Challenge 2]
- ⚠️ [Challenge 3]

**Sizing**:
- **Effort**: S/M/L
- **Risk**: Low/Medium/High
- **Complexity**: Low/Medium/High

---

## 📊 Comparison Matrix

| Criteria | Option 1 | Option 2 | Option 3 | Option 4* | Option 5* |
|----------|----------|----------|----------|----------|----------|
| **Effort** | S/M/L | S/M/L | S/M/L | S/M/L | S/M/L |
| **Risk** | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High |
| **Complexity** | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High |
| **Maintainability** | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High | Low/Med/High |
| **Rollback Ease** | Easy/Med/Hard | Easy/Med/Hard | Easy/Med/Hard | Easy/Med/Hard | Easy/Med/Hard |

*Include Options 4 and 5 columns only if those options are generated

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

## ❓ Questions for Research

**Critical Questions** *(must answer before implementation)*:
- [Question 1 - e.g., Can we use existing cache invalidation, or need new approach?]
- [Question 2 - e.g., What's the exact performance impact of each option?]
- [Question 3 - e.g., Are there hidden dependencies we need to account for?]

**Nice to Know** *(investigate during research if time permits)*:
- [Question 4 - e.g., Could we reuse patterns from similar past projects?]
- [Question 5 - e.g., What monitoring/observability should we add?]

---

## 📚 Exploration Notes

**Codebase Areas Examined** *(conceptual, not file paths)*:
- [Area 1 - e.g., API layer and controllers]
- [Area 2 - e.g., Authentication services]
- [Area 3 - e.g., Integration test suite]

**Key Patterns Identified**:
- [Pattern 1 - e.g., All controllers use middleware chain pattern]
- [Pattern 2 - e.g., Auth service has singleton lifecycle]
- [Pattern 3 - e.g., Feature flags control gradual rollouts]
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

**Assumptions & Unknowns**:
- EXPLICITLY label all assumptions (e.g., "We assume X is available")
- List unknowns that need investigation (e.g., "Unknown: exact performance impact")
- Be honest about what you don't know yet
- Separate assumptions (educated guesses) from unknowns (need data)

**Solution Options**:
- Generate 3-5 DISTINCT approaches (not variations of same idea)
- Each option should explore DIFFERENT conceptual approaches
- Keep descriptions at CONCEPTUAL level - NO file paths, NO scripts, NO specific time estimates
- Use "Key Areas of Change" with conceptual areas (e.g., "Authentication layer", not "src/auth/middleware.ts")
- Use S/M/L sizing for effort, risk, complexity (NOT "3-5 days" or "2 weeks")
- Avoid bias - present pros/cons objectively

**Questions for Research**:
- Identify critical questions that MUST be answered before implementation
- Identify nice-to-know questions for research phase
- Make questions specific and actionable
- Focus on unknowns that will inform option selection

**Comparison Matrix**:
- Use consistent criteria across all options
- Use S/M/L for Effort, Low/Med/High for Risk and Complexity
- Use Easy/Med/Hard for Rollback Ease
- NO specific timelines or numeric estimates
- Be honest about trade-offs

**Recommendation**:
- Pick ONE option as recommended (can be "depends on...")
- Explain reasoning clearly with specific factors
- Be pragmatic - consider team velocity, business constraints
- If no clear winner, explain decision criteria for stakeholders

### Validation Checklist

Before returning output, verify:

- [ ] Problem summary is clear and complete (2-4 paragraphs)
- [ ] Constraints are specific, not generic
- [ ] Assumptions section has A-1, A-2, ... IDs for traceability
- [ ] Unknowns section has U-1, U-2, ... IDs for research phase
- [ ] All assumptions use **A-#**: format (bold ID with colon)
- [ ] All unknowns use **U-#**: format (bold ID with colon)
- [ ] 3-5 distinct options provided (not variations)
- [ ] Each option stays at CONCEPTUAL level (no file paths, scripts, or specific time estimates)
- [ ] Each option has overview + key areas + benefits + challenges
- [ ] Sizing uses S/M/L for effort, Low/Med/High for risk/complexity (NO numeric estimates)
- [ ] Comparison matrix completed with consistent S/M/L sizing
- [ ] Questions for Research section present (critical + nice-to-know)
- [ ] One option recommended with clear reasoning
- [ ] Exploration notes document conceptual areas examined (not specific file paths)
- [ ] Output adheres to markdown structure exactly
- [ ] Total output is ~2000-4000 tokens (broad, not deep)

### Token Budget

**Maximum**: 4500 tokens for entire output

**Target Distribution**:
- Problem Summary: ~300 tokens
- Constraints: ~200 tokens
- Assumptions & Unknowns: ~150 tokens
- Option 1: ~300 tokens
- Option 2: ~300 tokens
- Option 3: ~300 tokens
- Option 4: ~300 tokens (if applicable)
- Option 5: ~300 tokens (if applicable)
- Comparison Matrix: ~200 tokens
- Recommendation: ~300 tokens
- Questions for Research: ~200 tokens
- Exploration Notes: ~150 tokens

**If over budget**: Trim exploration notes first, reduce number of options to 3, then compress option descriptions while keeping structure.

**Quality over Quantity**: If problem is simple, 3 well-analyzed options are better than 5 superficial ones.

---

## Example Output

See `schovi/templates/brainstorm/example.md` for a full example (to be created if needed).

---

**Version**: 2.0
**Last Updated**: 2025-11-08
**Related Templates**: `templates/research/full.md`, `templates/spec/full.md`
**Changelog**: v2.0 - Added Assumptions & Unknowns section, Questions for Research section, changed to 3-5 options, S/M/L relative sizing, removed implementation details
