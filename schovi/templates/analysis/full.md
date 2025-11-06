# Full Analysis Template

This template is used for complex problems requiring comprehensive exploration.

**When to use**: Complex features, architectural changes, unclear problems, investigations

---

## Structure

```markdown
---
jira_id: EC-1234
pr_url: https://github.com/owner/repo/pull/123  # if from PR
issue_url: https://github.com/owner/repo/issues/456  # if from issue
title: "Brief problem description"
problem_type: "bug|feature|investigation|performance|refactor"
severity: "critical|high|medium|low"
created_date: 2025-04-11
created_by: user@example.com
---

# ANALYSIS: EC-1234 Brief Description

## 🎯 1. PROBLEM SUMMARY

**Core Issue**: [1-2 sentence description of the problem at its essence]

**Impact**:
- [Specific impact 1 - who/what is affected and how]
- [Specific impact 2 - quantify if possible]
- [Specific impact 3 - business or technical impact]

**Severity**: [Critical|High|Medium|Low] - [1 sentence justification]

**Urgency**: [Immediate|Soon|Medium|Low] - [1 sentence explanation of timeline]

**Context**: [1-2 sentences of relevant background or how this arose]

---

## 📊 2. CURRENT STATE ANALYSIS

### Affected Components

**Primary Components**:
- **ComponentName** (`path/to/file.ts:123`) - [Role in problem, current behavior]
- **AnotherComponent** (`path/to/another.ts:456`) - [Role in problem, current behavior]

**Secondary Components** (if applicable):
- **RelatedComponent** (`path/to/related.ts:789`) - [How it's affected]

### Flow Analysis

**User Flow** (if applicable):
```
User Action: [What user does]
  ↓
System Entry Point: (file:line)
  ↓
Processing Step 1: (file:line) - [What happens]
  ↓
Processing Step 2: (file:line) - [What happens]
  ↓
Problem Occurs: (file:line) - [Where/why it breaks]
  ↓
Observable Result: [What user sees]
```

**Data Flow** (if applicable):
```
Data Source: [Where data comes from]
  ↓
Validation: (file:line) - [Current validation logic]
  ↓
Transformation: (file:line) - [Current transformation]
  ↓
Business Logic: (file:line) - [Current logic, where problem occurs]
  ↓
Persistence/Output: [Where data goes]
```

### Dependencies (conditional - only if complex)

**Direct Dependencies**:
- [Dependency 1 with version if applicable]
- [Dependency 2]

**Indirect Dependencies**:
- [System/service that depends on this]
- [Another system affected by changes]

**Integration Points**:
- [External API or service involved]
- [Database or data store involved]

### Issues Identified

1. **[Issue Category 1]** (`file:line`):
   - Problem: [Specific technical issue]
   - Evidence: [What shows this is a problem - logs, behavior, code inspection]
   - Root cause: [Why this is happening]

2. **[Issue Category 2]** (`file:line`):
   - Problem: [Specific technical issue]
   - Evidence: [What shows this is a problem]
   - Root cause: [Why this is happening]

3. **[Issue Category 3]** (if applicable):
   - Problem: [Additional issue]
   - Evidence: [Supporting evidence]
   - Root cause: [Underlying cause]

---

## 💡 3. SOLUTION PROPOSALS

### Option 1: [Solution Name] ⭐ RECOMMENDED

**Approach**: [1-2 sentences describing the solution at a high level]

**Key Changes**:
- Change 1: [Specific modification to make] (`file:line` if applicable)
- Change 2: [Another modification] (`file:line` if applicable)
- Change 3: [Additional change] (`file:line` if applicable)

**Pros**:
- ✅ [Advantage 1 - specific benefit]
- ✅ [Advantage 2 - why this is good]
- ✅ [Advantage 3 - technical or business benefit]

**Cons / Trade-offs**:
- ⚠️ [Limitation or trade-off 1]
- ⚠️ [Concern or consideration 2]
- ⚠️ [Risk or downside 3]

**Effort Estimate**: [Small (1-2 days) | Medium (3-5 days) | Large (1-2 weeks) | X-Large (2+ weeks)]

**Risk Level**: [Low | Medium | High] - [1 sentence why]

---

### Option 2: [Alternative Solution Name]

**Approach**: [1-2 sentences describing this alternative]

**Key Changes**:
- Change 1: [Specific modification] (`file:line` if applicable)
- Change 2: [Another modification] (`file:line` if applicable)
- Change 3: [Additional change] (`file:line` if applicable)

**Pros**:
- ✅ [Advantage 1 - what makes this appealing]
- ✅ [Advantage 2 - unique benefit vs Option 1]
- ✅ [Advantage 3 - when this would be better]

**Cons / Trade-offs**:
- ⚠️ [Why this wasn't recommended]
- ⚠️ [Additional limitation]
- ⚠️ [Risk or complexity]

**Effort Estimate**: [Size estimate]

**Risk Level**: [Level] - [1 sentence why]

---

### Option 3: [Third Alternative] (optional)

**Approach**: [1-2 sentences describing this alternative]

**Key Changes**:
- [Similar structure to Option 2]

**Pros**:
- ✅ [Advantages]

**Cons / Trade-offs**:
- ⚠️ [Disadvantages]

**Effort Estimate**: [Size estimate]

**Risk Level**: [Level] - [1 sentence why]

---

## 🛠️ 4. IMPLEMENTATION GUIDANCE

### Recommended Approach

**Choice**: Option [1|2|3] - [Solution Name]

**Rationale**: [2-3 sentences explaining WHY this option is recommended over others. Consider architecture alignment, maintainability, risk, effort, impact.]

### Key Considerations

**Technical**:
- [Important technical consideration 1]
- [Important technical consideration 2]
- [Important technical consideration 3]

**Testing Requirements**:
- [What needs to be tested - test type and scope]
- [Additional test coverage needed]
- [Edge cases to verify]

**Backward Compatibility** (if applicable):
- [How to handle existing functionality]
- [Migration strategy if needed]
- [Deprecation plan if applicable]

### Tests to Update/Create

**Unit Tests**:
- `path/to/test.spec.ts` - [What scenarios to add]
- `path/to/another.spec.ts` - [Additional test coverage]

**Integration Tests**:
- [End-to-end scenario 1 to verify]
- [End-to-end scenario 2 to verify]

**Manual Testing**:
- [ ] [User flow 1 to test manually]
- [ ] [User flow 2 to test manually]
- [ ] [Edge case 1]
- [ ] [Edge case 2]

### Deployment & Rollout (conditional - only for risky/complex changes)

**Deployment Strategy**:
- [How to deploy - e.g., staged rollout, feature flag, canary]
- [Monitoring requirements]
- [Rollback plan]

**Rollout Plan**:
1. [Step 1 - e.g., deploy to staging]
2. [Step 2 - e.g., enable for internal users]
3. [Step 3 - e.g., gradual rollout to production]

**Monitoring**:
- [Metric 1 to watch]
- [Metric 2 to track]
- [Alert condition if applicable]

---

## 📚 5. RESOURCES & REFERENCES

### Code Locations

**Primary Files**:
- `path/to/primary/file.ts:123` - [Description of what's here]
- `path/to/another/file.ts:456` - [Description]

**Related Files**:
- `path/to/related/file.ts:789` - [Why relevant]
- `path/to/test/file.spec.ts` - [Test coverage location]

### Related Issues/PRs

- **Jira**: [EC-1234] [Link if available]
- **GitHub PR**: #123 [Link and description if applicable]
- **Related Issue**: #456 [Context if applicable]

### Documentation

- [Link to architecture docs if applicable]
- [Link to API docs if applicable]
- [Link to relevant wiki/confluence if applicable]

### Stakeholders (conditional - if relevant)

- **Engineering**: @username - [Role/interest]
- **Product**: @username - [Role/interest]
- **Operations**: @username - [Role/interest]

### Historical Context (conditional - if valuable)

- [Previous related work or decision]
- [Why current state exists]
- [Past attempts or similar issues]

---

```

## Writing Guidelines

### Be Specific
❌ "The validation is broken"
✅ "Field validation in `FieldValidator.ts:67` rejects valid email addresses with '+' characters"

### Quantify Impact
❌ "This affects many users"
✅ "This affects ~500 users daily (15% of active users) who cannot save their settings"

### Provide Evidence
❌ "The code is slow"
✅ "API response time is 2.3s (p95) vs target 200ms, traced to N+1 query in `UserService.ts:123`"

### Use File References
❌ "Update the controller"
✅ "Update `api/controllers/MappingController.ts:123`"

### Make Trade-offs Clear
❌ "Option 1 is better"
✅ "Option 1 is faster to implement (2 days vs 1 week) but increases technical debt vs Option 2's cleaner architecture"

### Be Actionable
❌ "Consider performance"
✅ "Add Redis caching layer in `CacheService.ts` to reduce database queries by ~80%"

---

## Validation Checklist

Before returning analysis, ensure:
- [ ] YAML frontmatter has all required fields (jira_id/pr_url/issue_url, title, problem_type, severity, created_date)
- [ ] Problem summary has core issue, impact (3 items), severity, urgency, context
- [ ] Current state has affected components with file:line references
- [ ] Flow analysis present (user flow and/or data flow)
- [ ] Dependencies identified (if complex)
- [ ] At least 2 issues identified with problem/evidence/root cause
- [ ] At least 2 solution options provided
- [ ] Each solution has approach, key changes, pros (3+), cons (3+), effort, risk
- [ ] Recommended solution marked with ⭐
- [ ] Implementation guidance has choice, rationale, considerations, testing
- [ ] Resources section has code locations with file:line references
- [ ] All file references use `file:line` format (e.g., `src/app.ts:123`)
- [ ] Token count under 4000
