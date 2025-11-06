# Quick Analysis Template

This template is used for simple problems with clear solutions.

**When to use**: Simple bug fixes, straightforward enhancements, well-defined tasks

---

## Structure

```markdown
---
title: "Brief problem description"
problem_type: "bug|feature|investigation"
severity: "critical|high|medium|low"
created_date: 2025-04-11
---

# ANALYSIS: Brief Description

## 🎯 PROBLEM SUMMARY

**Core Issue**: [1-2 sentence description of the problem]

**Impact**: [Who/what is affected and how - 1-2 sentences]

**Severity**: [Critical|High|Medium|Low] - [1 sentence justification]

---

## 📊 CURRENT STATE

**Affected Components**:
- **ComponentName** (`path/to/file.ts:123`) - [Current behavior]
- **AnotherComponent** (`path/to/another.ts:456`) - [Current behavior]

**Root Cause**: [1-2 sentences explaining what's causing the problem]

---

## 💡 SOLUTION

**Approach**: [1-2 sentences describing the fix]

**Changes Needed**:
- [ ] Change 1: [Specific action] (`file:line`)
- [ ] Change 2: [Another action] (`file:line`)
- [ ] Change 3: [Additional action] (`file:line`)

**Pros**:
- ✅ [Key benefit 1]
- ✅ [Key benefit 2]

**Cons**:
- ⚠️ [Main limitation if any]

**Effort**: [Small|Medium|Large]
**Risk**: [Low|Medium|High]

---

## 🛠️ IMPLEMENTATION

**Testing**:
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]
- [ ] [Edge case]

**Files to Update**:
- `path/to/file.ts:123` - [What to change]
- `path/to/test.spec.ts` - [Test to add]

---

## 📚 KEY REFERENCES

- `path/to/primary/file.ts:123` - [Main file]
- `path/to/related/file.ts:456` - [Related]
- Jira: [EC-1234] [if applicable]

---

```

## Writing Guidelines

### Be Specific
❌ "The validation is broken"
✅ "Field validation in `FieldValidator.ts:67` rejects valid email addresses with '+' characters"

### Quantify Impact
❌ "This affects users"
✅ "This affects ~500 users daily who cannot save their settings"

### Use File References
❌ "Update the controller"
✅ "Update `api/controllers/MappingController.ts:123`"

### Be Actionable
❌ "Fix the bug"
✅ "Add null check in `validateUser()` at `UserService.ts:67` before accessing `user.email`"

---

## Validation Checklist

Before returning analysis, ensure:
- [ ] YAML frontmatter has title, problem_type, severity, created_date
- [ ] Problem summary has core issue, impact, severity
- [ ] Current state has affected components with file:line references
- [ ] Root cause clearly stated (1-2 sentences)
- [ ] Solution has approach, changes needed (checkboxes), pros/cons
- [ ] Implementation has testing checklist and files to update
- [ ] Key references has primary file locations with file:line format
- [ ] All file references use `file:line` format (e.g., `src/app.ts:123`)
- [ ] Token count under 2000
