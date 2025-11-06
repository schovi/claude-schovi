# Full Specification Template

This template is used when detailed analysis is available.

**When to use**: After `/schovi:analyze`, from Jira with analysis, from detailed analysis file

---

## Structure

```markdown
---
jira_id: EC-1234
title: "Brief description of the change"
status: "DRAFT"
approach_selected: "Option 2: Backend service + queue"
created_date: 2025-04-11
created_by: user@example.com
---

# SPEC: EC-1234 Brief Description

## Decision & Rationale

**Approach Selected**: Option 2 - Backend service with Kafka queue

**Rationale**: [2-3 sentences explaining WHY this approach was chosen over others. Focus on alignment with architecture, scalability, maintainability, or other key factors.]

**Alternatives Considered**:
- Option 1: [Solution name] (rejected: [reason in 1 sentence])
- Option 3: [Solution name] (rejected: [reason in 1 sentence])

## Technical Overview

### Data Flow
[Diagram or description showing how data moves through the system]

```
Input Source: [Where data originates]
  ↓
Validation: [file:line reference]
  ↓
Transformation: [file:line reference]
  ↓
Business Logic: [file:line reference]
  ↓
Persistence: [Database/storage]
  ↓
Output: [Where data goes]
```

### Affected Services
- **ServiceName** (`path/to/service.ts:123`): [Role and what changes]
- **AnotherService** (`path/to/another.ts:456`): [Role and what changes]

### Key Changes
- [Major change 1 - high level]
- [Major change 2 - high level]
- [Major change 3 - high level]

## Implementation Tasks

### Phase 1: [Phase Name - e.g., Backend Service]
- [ ] [Specific, actionable task] (`file:line` if applicable)
- [ ] [Another specific task] (`file:line` if applicable)
- [ ] [Another task]

### Phase 2: [Phase Name - e.g., Frontend Integration]
- [ ] [Specific task]
- [ ] [Another task]

### Phase 3: [Phase Name - e.g., Testing & Validation]
- [ ] [Testing-related task]
- [ ] [Validation task]

## Acceptance Criteria

- [ ] [Testable criterion 1 - specific and measurable]
- [ ] [Testable criterion 2 - specific and measurable]
- [ ] [Testable criterion 3 - specific and measurable]
- [ ] All tests pass (unit + integration)
- [ ] Code passes linting
- [ ] Code reviewed and approved

## Testing Strategy

### Unit Tests
- **Test file**: `path/to/component.spec.ts`
  - Scenario 1: [What to test]
  - Scenario 2: [What to test]
  - Scenario 3: [What to test]

- **Test file**: `path/to/service.spec.ts`
  - Scenario 1: [What to test]
  - Scenario 2: [What to test]

### Integration Tests
- **Scenario**: [End-to-end integration scenario]
  - Setup: [Prerequisites]
  - Execute: [What to run]
  - Assert: [Expected outcome]

- **Scenario**: [Another integration scenario]
  - Setup: [Prerequisites]
  - Execute: [What to run]
  - Assert: [Expected outcome]

### Manual Testing
- [ ] [User flow 1 to verify manually]
- [ ] [User flow 2 to verify manually]
- [ ] [Edge case 1 to test]
- [ ] [Edge case 2 to test]

## Risks & Mitigations

- **Risk**: [Description of potential risk]
  - *Mitigation*: [How to reduce or handle this risk]

- **Risk**: [Another potential risk]
  - *Mitigation*: [Mitigation strategy]

- **Risk**: [Third risk if applicable]
  - *Mitigation*: [Mitigation strategy]

## References

- Jira issue: [JIRA-ID or link]
- Analysis: [Link to analysis artifact or Jira comment]
- Architecture docs: [Link if applicable]
- Related PRs: [Links if applicable]
```

---

## Writing Guidelines

### Be Specific
❌ "Fix the bug in the validator"
✅ "Update validation logic in `FieldMappingValidator.ts:67` to reject boolean field types"

### Be Actionable
❌ "Improve error handling"
✅ "Add try-catch block in `processRequest()` method to catch ValidationError and return 400 status"

### Be Measurable
❌ "System should be fast"
✅ "API response time <200ms for 95th percentile"

### Use File References
❌ "Update the controller"
✅ "Update `api/controllers/MappingController.ts:123`"

### Make Tasks Atomic
❌ "Implement the feature"
✅ Multiple specific tasks:
- "Create `FeatureService` class"
- "Add `processFeature()` method"
- "Wire up dependency injection"

---

## Validation Checklist

Before returning spec, ensure:
- [ ] YAML frontmatter has all required fields (jira_id, title, status, approach_selected, created_date, created_by)
- [ ] Decision & Rationale section has approach, rationale (2-3 sentences), alternatives considered
- [ ] Technical Overview has data flow, affected services with file:line, key changes (3-5 items)
- [ ] Implementation Tasks organized in phases with checkboxes
- [ ] Each task is specific and actionable with file:line references where applicable
- [ ] Acceptance Criteria has 3+ testable criteria plus standard criteria (tests, linting, review)
- [ ] Testing Strategy has unit tests, integration tests, and manual testing with specific scenarios
- [ ] Risks & Mitigations has at least 2 risks with mitigation strategies
- [ ] References section has Jira issue and analysis source
- [ ] All file references use `file:line` format
- [ ] Token count under 3000
