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
**Complexity**: [Small / Medium / High]

**Tasks**:
- [ ] [Specific, actionable task] (`file:line` if applicable)
- [ ] [Another specific task] (`file:line` if applicable)
- [ ] [Another task]

**Phase Gates** (must complete before Phase 2):
- [ ] [Exit criterion 1 - proves key assumption or viability]
- [ ] [Exit criterion 2 - validates approach works]

### Phase 2: [Phase Name - e.g., Frontend Integration]
**Complexity**: [Small / Medium / High]

**Tasks**:
- [ ] [Specific task]
- [ ] [Another task]

**Phase Gates** (must complete before Phase 3):
- [ ] [Exit criterion 1 - integration verified]
- [ ] [Exit criterion 2 - no blocking issues]

### Phase 3: [Phase Name - e.g., Testing & Validation]
**Complexity**: [Small / Medium / High]

**Tasks**:
- [ ] [Testing-related task]
- [ ] [Validation task]

**Phase Gates** (must complete before deployment):
- [ ] [Exit criterion 1 - all tests pass]
- [ ] [Exit criterion 2 - acceptance criteria met]

## Acceptance Criteria

Each criterion should map to risks from the Research phase or Risks & Mitigations section.

- [ ] [Testable criterion 1 - specific and measurable] *(mitigates: [Risk name])*
- [ ] [Testable criterion 2 - specific and measurable] *(mitigates: [Risk name])*
- [ ] [Testable criterion 3 - specific and measurable] *(mitigates: [Risk name])*
- [ ] All tests pass (unit + integration) *(mitigates: Quality risk)*
- [ ] Code passes linting *(mitigates: Quality risk)*
- [ ] Code reviewed and approved *(mitigates: Quality risk)*

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

## Smoke Tests

Minimal end-to-end scenarios that prove the intended behavior. These will be executed during implementation to generate verification evidence.

### Scenario 1: [Description of what we're proving]
**Purpose**: Prove that [specific behavior] actually works in practice

**Pre-conditions**:
- [ ] [Prerequisite 1 - e.g., "Database has test data loaded"]
- [ ] [Prerequisite 2 - e.g., "Service is running on port 8080"]
- [ ] [Prerequisite 3 - e.g., "Environment variable X is set"]

**Test Steps**:
1. Execute: `[Command to run - e.g., curl -X POST http://localhost:8080/api/feature -d '{"type":"boolean"}']`
2. Observe: [What to observe - e.g., "Response status code"]
3. Observe: [Another observation - e.g., "Response body contains error message"]

**Expected Observations**:
- [Observation 1]: [Expected value - e.g., "Status code: 400"]
- [Observation 2]: [Expected value - e.g., "Response body: {\"error\": \"Boolean field types are not supported\"}"]
- [Observation 3]: [Expected value - e.g., "Database query: SELECT COUNT(*) FROM mappings WHERE type='boolean' returns 0"]

**Evidence to collect**:
- [Evidence 1 - e.g., "HTTP response (full)"]
- [Evidence 2 - e.g., "Database query result"]
- [Evidence 3 - e.g., "Server logs for the request"]

**Rollback** (if test creates side effects):
```bash
# Commands to clean up any test data or artifacts
# Example: psql -c "DELETE FROM mappings WHERE id IN (SELECT id FROM mappings WHERE created_at > '2025-04-11 14:30:00')"
```

### Scenario 2: [Another critical behavior to prove]
**Purpose**: Prove that [different aspect of behavior] works correctly

**Pre-conditions**:
- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]

**Test Steps**:
1. Execute: `[Command]`
2. Observe: [What to check]

**Expected Observations**:
- [Observation]: [Expected value]

**Evidence to collect**:
- [Evidence item]

**Rollback**:
```bash
# Cleanup commands
```

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

### Define Clear Phase Gates
Phase gates are go/no-go checkpoints that prove viability before proceeding.

❌ Generic gates: "Phase complete", "All tasks done"
✅ Specific gates that validate assumptions:
- "API endpoint returns expected data structure (smoke test)"
- "Database migration runs without errors on staging data"
- "Integration test passes with real external service"

**Gate Principles**:
- Each gate proves a key assumption or risk is mitigated
- Gates should be testable/verifiable (not subjective)
- Failing a gate means reconsidering the approach
- Typically 1-3 gates per phase

### Estimate Complexity, Not Time
Use complexity ratings to set expectations without false precision.

❌ "2 hours", "3 days", "1 week" (overly precise, often wrong)
✅ Complexity levels:
- **Small**: Straightforward change, single file, low risk, ~1-4 hours
- **Medium**: Multiple files, some unknowns, moderate risk, ~1-2 days
- **High**: Cross-cutting change, many dependencies, high risk, 3+ days

### Link Acceptance Criteria to Risks
Show traceability between what you're testing and what risk it mitigates.

❌ "Feature works correctly"
✅ "API handles concurrent requests without data corruption *(mitigates: Race condition risk)*"

**Traceability Benefits**:
- Ensures every identified risk has a verification step
- Makes testing strategy more focused and purposeful
- Helps reviewers understand why each criterion matters

### Write Executable Smoke Tests
Smoke tests should be concrete commands that can be executed during implementation.

❌ "Test that the API returns an error"
✅ Complete smoke test with:
- **Purpose**: "Prove that boolean field types are rejected with clear error message"
- **Test Step**: `curl -X POST http://localhost:8080/api/feature -d '{"type":"boolean"}'`
- **Expected Observation**: "Status code: 400"
- **Evidence**: "Full HTTP response"

**Smoke Test Principles**:
- Keep it minimal (1-3 scenarios that prove critical behavior)
- Make it executable (actual commands, not descriptions)
- Make it observable (specific expectations with measurable outcomes)
- Make it evidential (specify what to capture as proof)
- Make it reversible (include rollback if test has side effects)

**Good Smoke Test Candidates**:
- Happy path for main feature (proves it works end-to-end)
- Critical error handling (proves validation/safety works)
- Integration point (proves external service communication works)

**Bad Smoke Test Candidates**:
- Edge cases better suited for unit tests
- Performance/load testing (use dedicated perf tests)
- Comprehensive coverage (that's what test suites are for)

---

## Validation Checklist

Before returning spec, ensure:
- [ ] YAML frontmatter has all required fields (jira_id, title, status, approach_selected, created_date, created_by)
- [ ] Decision & Rationale section has approach, rationale (2-3 sentences), alternatives considered
- [ ] Technical Overview has data flow, affected services with file:line, key changes (3-5 items)
- [ ] Implementation Tasks organized in phases with checkboxes
- [ ] Each phase has complexity rating (Small / Medium / High)
- [ ] Each phase has 1-3 phase gates that prove viability before proceeding
- [ ] Each task is specific and actionable with file:line references where applicable
- [ ] Acceptance Criteria has 3+ testable criteria plus standard criteria (tests, linting, review)
- [ ] Each acceptance criterion links to a risk it mitigates (traceability)
- [ ] Testing Strategy has unit tests, integration tests, and manual testing with specific scenarios
- [ ] Smoke Tests has 1-3 end-to-end scenarios with purpose, pre-conditions, test steps, expected observations, evidence to collect, and rollback commands
- [ ] Risks & Mitigations has at least 2 risks with mitigation strategies
- [ ] References section has Jira issue and analysis source
- [ ] All file references use `file:line` format
- [ ] Token count under 3500 (increased to accommodate smoke tests section)
