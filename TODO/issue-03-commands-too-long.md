# Issue: Commands are too long (700-1330 lines)

**Labels**: `refactoring`, `maintainability`, `technical-debt`

---

## Problem

Single-file commands are extremely long (700-1330 lines each), making them difficult to maintain, understand, and modify. Industry best practice suggests functions/modules should be <300 lines.

## Current State

| Command | Lines | Target | Reduction Needed |
|---------|-------|--------|------------------|
| `implement.md` | 1330 | 500 | 62% |
| `publish.md` | 1230 | 450 | 63% |
| `analyze.md` | 879 | 350 | 60% |
| `commit.md` | 795 | 300 | 62% |
| `plan.md` | 716 | 300 | 58% |
| **Average** | **990** | **380** | **61%** |

## Why This Matters

**Cognitive Overload**:
- Difficult to understand flow at a glance
- Hard to find specific logic sections
- Easy to introduce bugs during modifications

**Maintenance Burden**:
- Changes require editing massive files
- Risk of breaking unrelated functionality
- Difficult to review PRs with 1000+ line files

**Testing Difficulty**:
- Can't test individual pieces in isolation
- Must test entire command flow each time
- Hard to write comprehensive unit tests

**Poor Separation of Concerns**:
- Commands mix orchestration with implementation
- Business logic intertwined with I/O operations
- No clear boundaries between phases

## Example: analyze.md (879 lines)

**Current structure**:
```
Lines 1-12:    Metadata (12 lines)
Lines 13-80:   Flag parsing logic (68 lines)
Lines 82-140:  Input processing (58 lines)
Lines 142-200: Fetch Jira (58 lines)
Lines 202-260: Fetch GitHub (58 lines)
Lines 262-400: Deep codebase analysis (138 lines)
Lines 402-520: Analysis generation (118 lines)
Lines 522-600: Output handling (78 lines)
Lines 602-879: Error handling & examples (277 lines)
```

**Problems**:
- Flag parsing (68 lines) should be shared utility
- Jira/GitHub fetching (116 lines) should delegate to context-fetcher
- Analysis generation (118 lines) should delegate to analysis-generator
- Output handling (78 lines) should delegate to display-formatter
- Error handling (277 lines) is mostly duplicate content

## Proposed Solution

**Pattern**: Commands should be **orchestrators**, not **implementers**

### Refactored Command Structure (~350 lines)

```markdown
# commands/analyze.md (target: 350 lines)

Lines 1-50:    Overview & usage patterns
Lines 51-100:  PHASE 1 - Input resolution
               → Delegate to flag-parser subagent
               → Delegate to file-discovery subagent
Lines 101-150: PHASE 2 - Context fetching
               → Delegate to context-fetcher subagent
Lines 151-200: PHASE 3 - Analysis execution
               → Delegate to analysis-generator subagent
Lines 201-250: PHASE 4 - Output handling
               → Delegate to display-formatter subagent
Lines 251-350: Error handling (simplified, reference docs)
```

**Each phase**: 30-50 lines of orchestration logic only

### Key Principles

1. **Delegate Heavy Lifting**: Use subagents for all implementation details
2. **Orchestration Only**: Commands coordinate workflow, don't implement
3. **Clear Phases**: Each phase has single responsibility
4. **Reference Documentation**: Link to detailed docs instead of inline explanations

## Implementation Strategy

### Prerequisites

Must complete Issue #1 (Code Duplication) first to create shared subagents:
- `agents/git-operations/AGENT.md`
- `agents/file-discovery/AGENT.md`
- `agents/context-fetcher/AGENT.md`
- `agents/display-formatter/AGENT.md`
- `agents/flag-parser/AGENT.md`

### Refactoring Steps

**For each command**:

1. **Identify responsibilities** - What does this command actually do?
2. **Extract to subagents** - Move implementation details to shared/dedicated subagents
3. **Keep orchestration** - Retain only workflow coordination logic
4. **Simplify error handling** - Reference external error guide
5. **Test equivalence** - Verify behavior matches original

### Example Refactor: commit.md

**Before** (795 lines):
```markdown
## PHASE 2: Git State Validation (100 lines)
- Get current branch (5 lines of explanation + bash command)
- Validate branch name (30 lines of logic)
- Check git status (40 lines of parsing logic)
- Summary display (25 lines of formatting)
```

**After** (~30 lines):
```markdown
## PHASE 2: Git State Validation

Use git-operations subagent:
  - validate_branch(branch, jira_id) → {valid, warnings}
  - get_git_status() → {staged, unstaged, conflicts}

If validation fails:
  - Display error via display-formatter
  - Exit with suggestions

If validation passes:
  - Display summary via display-formatter
  - Continue to Phase 3
```

## Refactoring Order

Tackle in order of increasing complexity:

1. **commit.md** (795 lines → 300 lines)
   - Simplest workflow
   - Good pilot for pattern
   - High impact (used by implement.md)

2. **plan.md** (716 lines → 300 lines)
   - Similar to commit
   - Moderate complexity

3. **analyze.md** (879 lines → 350 lines)
   - More complex logic
   - Multiple context sources

4. **publish.md** (1230 lines → 450 lines)
   - Complex git operations
   - Multiple description sources

5. **implement.md** (1330 lines → 500 lines)
   - Most complex workflow
   - Multi-phase execution
   - Depends on other commands

## Expected Impact

**Code Metrics**:
- Total command lines: 4,950 → 1,900 (62% reduction)
- Average command length: 990 → 380 lines (61% reduction)
- Largest command: 1330 → 500 lines (62% reduction)

**Maintainability**:
- Easier to understand workflow at a glance
- Clear separation between phases
- Implementation details in dedicated subagents
- Easier to modify without breaking other parts

**Testing**:
- Can test subagents independently
- Can test command orchestration separately
- Easier to write focused unit tests

**Developer Experience**:
- Faster to find specific logic
- Clearer code structure
- Better separation of concerns
- Easier to onboard new contributors

## Acceptance Criteria

- [ ] All 5 commands refactored to use subagent delegation pattern
- [ ] No command exceeds 500 lines
- [ ] Average command length ≤ 400 lines
- [ ] Each command has clear phase structure
- [ ] All implementation details delegated to subagents
- [ ] Error handling simplified (reference external docs)
- [ ] All existing tests pass
- [ ] Behavior identical from user perspective
- [ ] Documentation updated to reflect new structure

## Testing Strategy

**Per Command**:
1. Create backup of original command
2. Refactor to new structure
3. Run full command test suite
4. Compare outputs before/after
5. Fix any discrepancies
6. Verify performance not degraded

**Integration Tests**:
1. Test complete workflows (analyze → plan → implement → commit → publish)
2. Test with real Jira issues, GitHub PRs
3. Test error scenarios
4. Test edge cases

**Regression Tests**:
1. All existing command tests must pass
2. Output format must match original
3. File artifacts must be identical
4. Performance within 10% of original

## Related

- **Blocks**: Issue #1 (Code Duplication) must be completed first
- See `workflow-analysis.md` Section 2.3 for detailed problem analysis
- See `workflow-analysis.md` Section 3.2 for complete refactoring plan

## Priority

**High** - After Issue #1 is complete. This is the main beneficiary of shared subagents.

## Estimated Effort

**Medium-High** - 2-3 weeks total
- Week 1: Refactor commit.md (pilot) + plan.md
- Week 2: Refactor analyze.md + publish.md
- Week 3: Refactor implement.md + full testing
