# Issue: Spec-generator template issues

**Labels**: `bug`, `spec-generation`, `quality`

---

## Problem

The `spec-generator` subagent has two template issues that lead to lower-quality specs and unnecessary boilerplate:

1. **Testing Strategy** instructions are ambiguous, leading to manual testing checklists instead of code test specifications
2. **Deployment & Rollout** section is created even for standard deployments where it's unnecessary

## Issue #1: Testing Strategy Creates Manual Checklists

### Current Problem

**Location**: `agents/spec-generator/AGENT.md:146-167`

The instructions for Testing Strategy section say both:
- "Structure from approach details" (lines 148-149)
- "**FOCUS ON CODE TESTS ONLY**" (line 149)

But the **earlier description** (before line 148) says:
```markdown
## Testing Strategy
Structure from approach details:
- Unit Tests: List scenarios to test
- Integration Tests: List scenarios to test
- E2E Tests (if applicable): List scenarios
- Manual Testing Checklist: Step-by-step verification
```

This **contradicts** the actual instruction which explicitly says:
```markdown
**FOCUS ON CODE TESTS ONLY**:
- **Unit Tests**: Which test files need to be modified/created and what scenarios to test
- **Integration Tests**: Which integration test files need updates and what scenarios to cover
- **E2E Tests** (if applicable): Which E2E test files need updates
- **NO manual testing checklists** - manual verification happens during PR review
```

### Impact

**Specs include unnecessary manual testing checklists**:
```markdown
## Testing Strategy

### Manual Testing Checklist
- [ ] Open dashboard
- [ ] Click authentication button
- [ ] Enter credentials
- [ ] Verify login success
- [ ] Check session persistence
- [ ] Test logout flow
```

**This is wrong** because:
- Manual testing happens during PR review, not implementation
- Implementation phase should focus on automated tests
- Manual checklists clutter specs with non-implementation tasks
- Creates confusion about what implementer should do

### Expected Behavior

Specs should **only** include test file specifications:
```markdown
## Testing Strategy

### Tests to Update/Create

**Unit Tests** (modified/new):
- `services/FieldMappingValidator.spec.ts` - Add tests for boolean rejection, verify number/text types still pass
- `controllers/MappingController.spec.ts` - Update existing tests to cover new validation error

**Integration Tests** (modified/new):
- `integration/mapping-api.spec.ts` - Test end-to-end API flow with boolean type returns 400 error

**E2E Tests** (if needed):
- `e2e/mapping-flow.spec.ts` - Verify error message displays correctly in UI
```

### Solution for Issue #1

**Update `agents/spec-generator/AGENT.md:146-167`**:

Remove the initial description that mentions "Manual Testing Checklist" and make the instructions crystal clear:

```markdown
##### Section 5: Testing Strategy

**IMPORTANT**: Focus on CODE TESTS ONLY. Do NOT create manual testing checklists.

Specify which test files need to be created/modified and what scenarios they should cover:

- **Unit Tests**: Which test files need to be modified/created and what scenarios to test
- **Integration Tests**: Which integration test files need updates and what scenarios to cover
- **E2E Tests** (if applicable): Which E2E test files need updates

**DO NOT include**:
- Manual testing checklists
- Step-by-step verification procedures
- UI interaction sequences

Manual verification happens during PR review, not during implementation.

Example format:
```markdown
## Testing Strategy

### Tests to Update/Create

**Unit Tests** (modified/new):
- `services/FieldMappingValidator.spec.ts` - Add tests for boolean rejection, verify number/text types still pass
- `controllers/MappingController.spec.ts` - Update existing tests to cover new validation error

**Integration Tests** (modified/new):
- `integration/mapping-api.spec.ts` - Test end-to-end API flow with boolean type returns 400 error

**E2E Tests** (if needed):
- `e2e/mapping-flow.spec.ts` - Verify error message displays correctly in UI
```

**Key Points**:
- NO "Manual Testing Checklist" section
- Focus on test files and scenarios
- Specify which test files to create/modify
- Describe what scenarios to cover
```

---

## Issue #2: Deployment Section for Standard Deployments

### Current Problem

**Location**: `agents/spec-generator/AGENT.md:189-229`

The instructions say to conditionally include Deployment & Rollout section:
```markdown
**IMPORTANT**: Only include this section if deployment is non-standard.
```

But then provide an example for when NOT needed:
```markdown
Example when not needed:
```markdown
## Deployment & Rollout

Standard deployment process applies. No special rollout coordination needed.
```
```

**This is wrong** because:
- If deployment is standard, **don't include the section at all**
- Including boilerplate "standard deployment" text adds no value
- Clutters specs with unnecessary sections
- Creates confusion (is deployment special or not?)

### Expected Behavior

**When deployment is standard**: **Skip the section entirely**. Don't include it at all.

**When deployment is non-standard**: Include section with specific details.

### Solution for Issue #2

**Update `agents/spec-generator/AGENT.md:189-229`**:

Make it absolutely clear to skip the section for standard deployments:

```markdown
##### Section 7: Deployment & Rollout (Conditional)

**IMPORTANT**: Only include this section if deployment is non-standard.

**Include when**:
- Feature flag (LaunchDarkly) required for gradual rollout
- Multiple repositories must be deployed in specific order
- Database migrations or breaking changes involved
- Coordination with other teams required
- Complex monitoring or rollback procedures

**Skip when**: Standard single-repo deployment with no special requirements.
  - **DO NOT include this section at all**
  - **DO NOT write "Standard deployment process applies"**
  - **Just skip to the next section (References)**

**If including, provide**:
- Feature flag details (name, location, strategy)
- Deployment sequence (if multi-repo)
- Critical monitoring metrics (only if specific)
- Rollback procedure (only if non-trivial)

Example when deployment IS non-standard (only then include):
```markdown
## Deployment & Rollout

**Feature Flag**: `enable-kafka-events` in `config/feature-flags.ts`
- Strategy: Gradual rollout starting at 10%, monitor for 24h before 100%

**Deployment Sequence**:
1. Deploy `backend-service` first (adds Kafka producer)
2. Deploy `event-consumer` second (adds listener)
3. Enable feature flag

**Critical Monitoring**: Watch Kafka lag and event processing errors

**Rollback**: Disable feature flag, events will queue until re-enabled
```

**When deployment is standard**: Section is completely omitted from spec. Jump directly to References section.
```

**Update Quality Checks** (lines 402-413):

Add to checklist:
```markdown
- [ ] Deployment & Rollout section only included if truly non-standard (NOT just "standard deployment applies")
- [ ] If deployment is standard, section is completely absent
```

---

## Combined Fix Implementation

### Files to Update

1. **`agents/spec-generator/AGENT.md`**
   - Lines 146-167: Testing Strategy instructions
   - Lines 189-229: Deployment & Rollout instructions
   - Lines 402-413: Quality checks

### Testing Strategy

**Test spec generation with**:

1. **Standard deployment scenarios**:
   - Simple bug fix (no migrations, no flags, no coordination)
   - New feature (single repo, standard deployment)
   - Expected: No Deployment & Rollout section in spec

2. **Non-standard deployment scenarios**:
   - Feature with LaunchDarkly flag
   - Multi-repo deployment
   - Database migration
   - Expected: Deployment & Rollout section with specific details

3. **Test implementation scenarios**:
   - New feature requiring unit + integration tests
   - Bug fix requiring test updates
   - Expected: Testing Strategy with test file specifications only (no manual checklists)

### Before/After Examples

#### Example 1: Testing Strategy

**Before** (current - wrong):
```markdown
## Testing Strategy

### Unit Tests
- Test boolean validation
- Test number/text types pass

### Integration Tests
- Test API returns 400 for boolean

### Manual Testing Checklist
- [ ] Open mapping UI
- [ ] Try to create mapping with boolean field
- [ ] Verify error message displays
- [ ] Verify number/text fields still work
```

**After** (fixed - correct):
```markdown
## Testing Strategy

### Tests to Update/Create

**Unit Tests** (modified/new):
- `services/FieldMappingValidator.spec.ts` - Add boolean rejection test, verify number/text pass
- `controllers/MappingController.spec.ts` - Update to cover new validation error

**Integration Tests** (modified/new):
- `integration/mapping-api.spec.ts` - Test boolean type returns 400 error
```

#### Example 2: Deployment & Rollout

**Before** (current - wrong for standard deployment):
```markdown
## Deployment & Rollout

Standard deployment process applies. No special rollout coordination needed.
```

**After** (fixed - correct for standard deployment):
```markdown
[Section completely absent - jumps from Testing Strategy to References]
```

**After** (fixed - correct for non-standard deployment):
```markdown
## Deployment & Rollout

**Feature Flag**: `enable-jwt-auth` in `config/feature-flags.ts`
- Strategy: Enable for internal users first, then gradual rollout to 100%

**Migration**: Run `scripts/migrate-sessions-to-jwt.ts` before enabling flag

**Rollback**: Disable flag, system falls back to session auth
```

---

## Impact

**Quality of Generated Specs**:
- ✅ Clearer focus on implementation tasks (code tests, not manual checklists)
- ✅ Less clutter (no unnecessary deployment sections)
- ✅ Better signal-to-noise ratio

**Implementation Experience**:
- ✅ Implementers focus on writing automated tests
- ✅ No confusion about "standard deployment" boilerplate
- ✅ Clearer when deployment is actually special

**Spec Maintenance**:
- ✅ Less noise in specs
- ✅ Easier to scan for important information

## Acceptance Criteria

### Testing Strategy Fix:
- [ ] Instructions explicitly forbid manual testing checklists
- [ ] Examples show only test file specifications
- [ ] Example output includes test file names and scenarios
- [ ] Quality checks verify no manual checklists

### Deployment Section Fix:
- [ ] Instructions explicitly say to skip section for standard deployments
- [ ] Instructions say "DO NOT write 'Standard deployment applies'"
- [ ] Example shows section completely absent for standard case
- [ ] Quality checks verify section only included when truly non-standard

### Testing:
- [ ] Generate spec with standard deployment → no Deployment section
- [ ] Generate spec with feature flag → Deployment section with details
- [ ] Generate spec for new feature → Testing Strategy with test files only
- [ ] Generate spec for bug fix → Testing Strategy without manual checklist

## Related

- See `workflow-analysis.md` Section 2.6 for detailed problem analysis
- See `workflow-analysis.md` Section 3.5 for complete fix specification
- Affects quality of specs generated by `/schovi:plan` command

## Priority

**High** - This is a quality issue that affects every spec generated. Simple fix with high impact.

## Estimated Effort

**Very Low** - 30 minutes
- 15 minutes: Update instructions in spec-generator.md
- 15 minutes: Test with sample specs, verify fix works
