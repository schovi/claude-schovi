# Minimal Specification Template

This template is used for simple tasks or when creating specs from scratch.

**When to use**: `--from-scratch` mode, simple bug fixes, straightforward tasks without analysis

---

## Structure

```markdown
---
title: "Brief description of the task"
status: "DRAFT"
created_date: 2025-04-11
---

# SPEC: Brief Description

## Goal

[2-3 sentences describing what needs to be built or fixed and why it matters]

## Requirements

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]
- [Requirement 4]
- [Requirement 5]

## Implementation Tasks

- [ ] [Task 1 - specific and actionable]
- [ ] [Task 2 - specific and actionable]
- [ ] [Task 3 - specific and actionable]
- [ ] [Task 4 - specific and actionable]
- [ ] [Task 5 - specific and actionable]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]
- [ ] Tests pass
- [ ] Code reviewed

## Testing

**Manual test**:
1. [Step 1 to verify functionality]
2. [Step 2]
3. [Step 3]

**Expected result**: [What should happen when working correctly]
```

---

## Writing Guidelines

### Be Specific
❌ "Fix the bug"
✅ "Add null check in `UserService.ts:67` before accessing user.email"

### Be Actionable
❌ "Improve validation"
✅ "Add email format validation using regex pattern in `validateEmail()` function"

### Be Measurable
❌ "Make it work"
✅ "Form submits successfully with valid input and shows error message for invalid input"

### Make Tasks Atomic
❌ "Build the feature"
✅ Multiple specific tasks:
- "Create form component"
- "Add validation logic"
- "Wire up submit handler"

---

## Validation Checklist

Before returning spec, ensure:
- [ ] YAML frontmatter has title, status, created_date
- [ ] Goal is clear and explains what needs to be done (2-3 sentences)
- [ ] Requirements list has 3-5 functional requirements
- [ ] Implementation Tasks has 3-5 actionable tasks with checkboxes
- [ ] Acceptance Criteria has 3+ testable criteria plus standard criteria
- [ ] Testing section has manual test steps with expected result
- [ ] Token count under 1000
