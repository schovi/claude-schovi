# Issue: Complex context fetching decision logic

**Labels**: `refactoring`, `simplification`, `ux`

---

## Problem

The `commit` command tries to be too smart about when to fetch external context (Jira/GitHub), using complex heuristics that are subjective, inconsistent, and may skip valuable context. This adds unnecessary complexity and provides minimal benefit.

## Current Behavior

**Location**: `commands/commit.md:343-419` (Phase 4: Optional Context Fetching)

```markdown
## PHASE 4: Optional Context Fetching

### Step 4.1: Evaluate Need for External Context

Decision logic:
IF context_type is "jira" OR "github_issue" OR "github_pr":
    IF primary_change is clear AND key_changes are substantial:
        SKIP context fetching
        Display: "📊 Change analysis is clear, skipping external context fetch"
    ELSE:
        FETCH external context
        Display: "🔍 Fetching external context to enrich commit message..."
ELSE:
    SKIP context fetching
```

**"Clear" is defined as**:
- 3+ key changes identified
- Primary change is descriptive (>15 chars)
- Commit type confidence is high

## Problems with Current Approach

### 1. Subjective Heuristics

**"Clear" is subjective**:
- What makes primary_change "descriptive"?
- How to measure "commit type confidence"?
- Why is 15 characters the threshold?
- Why are 3 key changes "substantial"?

These are arbitrary decisions that may not match user expectations.

### 2. Inconsistent Behavior

**User provides reference → sometimes fetched, sometimes not**:

```bash
# User explicitly provides Jira ID
/schovi:commit EC-1234

# Scenario A: Diff shows clear changes (3+ files, descriptive)
# → Context NOT fetched (heuristic says "clear enough")
# → Commit message lacks issue context

# Scenario B: Diff shows minimal changes (1-2 files, simple)
# → Context IS fetched
# → Commit message includes issue context
```

**This is confusing**: If user provided reference, they likely want that context in commit.

### 3. Minimal Time Savings

**Context fetching is FAST** thanks to context isolation:
- Jira fetch: ~1-2 seconds (subagent returns ~800 tokens)
- GitHub fetch: ~1-2 seconds (subagent returns ~1000 tokens)
- Total overhead: Negligible

**Heuristics save**: Maybe 1-2 seconds per commit
**Heuristics cost**: Added complexity, inconsistent behavior

**Not worth it.**

### 4. May Skip Valuable Context

**Even with "clear" diff analysis**, external context provides:
- **Why** the change was needed (problem statement)
- **Acceptance criteria** (what should be tested)
- **Related issues** (dependencies, blockers)
- **Comments** (important context from team)

This context enriches commit messages even when diff is clear.

### 5. Unnecessary Complexity

**Current implementation**:
- ~76 lines of heuristic logic
- Multiple conditions to evaluate
- Hard to understand when context will be fetched
- Difficult to test all edge cases

**Proposed implementation**:
- ~10 lines of simple logic
- One condition: "Was reference provided?"
- Obvious behavior
- Easy to test

## Proposed Solution

**Simplified Logic**: If user provided reference, always fetch it.

```markdown
## PHASE 4: Context Fetching

If user provided Jira ID, GitHub issue, or GitHub PR:
  - Always fetch context via appropriate subagent
  - Display: "Fetching context from [source]..."
  - Context fetching is fast (<2s) due to isolation
  - Always enriches commit message with issue context

Otherwise:
  - Use only diff analysis
  - Generate commit message from code changes
```

## Rationale

### User Intent

**If user provided reference → they want that context**:
```bash
/schovi:commit EC-1234        # User explicitly referenced Jira
# → Should ALWAYS fetch EC-1234 context

/schovi:commit owner/repo#123 # User explicitly referenced PR
# → Should ALWAYS fetch PR context

/schovi:commit                # No reference provided
# → Use diff analysis only
```

### Performance

**Context fetching is fast** thanks to architecture:
- Context isolation burns tokens in isolated context
- Returns only ~800-1000 token summary
- Takes 1-2 seconds
- User barely notices

**Heuristics save**: 1-2 seconds
**Heuristics cost**: Complexity, inconsistency, user confusion

### Consistency

**Simpler logic = predictable behavior**:
- User knows: "If I provide reference, it will be fetched"
- User knows: "If I don't provide reference, diff analysis only"
- No surprises, no guessing

### Better Commit Messages

**External context always improves commits**:
- Adds "why" (problem being solved)
- Adds "what" (acceptance criteria)
- Adds "context" (related issues, comments)
- More informative for code reviewers and future developers

## Implementation

### Step 1: Simplify commit.md

**Update `commands/commit.md:343-419`**:

**Before** (~76 lines):
```markdown
## PHASE 4: Optional Context Fetching

### Step 4.1: Evaluate Need for External Context

Decision logic:
IF context_type is "jira" OR "github_issue" OR "github_pr":
    IF primary_change is clear AND key_changes are substantial:
        SKIP context fetching
        Display: "📊 Change analysis is clear, skipping external context fetch"
    ELSE:
        FETCH external context
        Display: "🔍 Fetching external context to enrich commit message..."
ELSE:
    SKIP context fetching

Indicators that analysis is "clear":
- 3+ key changes identified
- Primary change is descriptive (>15 chars)
- Commit type confidence is high

### Step 4.2: Fetch Context (if needed)
[... 50+ lines of fetching logic ...]
```

**After** (~15 lines):
```markdown
## PHASE 4: Context Fetching

If context_type is "jira":
  - Fetch via jira-analyzer subagent
  - Display: "Fetching Jira issue [KEY]..."

If context_type is "github_issue":
  - Fetch via gh-issue-analyzer subagent
  - Display: "Fetching GitHub issue..."

If context_type is "github_pr":
  - Fetch via gh-pr-analyzer subagent
  - Display: "Fetching GitHub PR..."

Otherwise:
  - No external context to fetch
  - Use diff analysis only
```

**Reduction**: 76 lines → 15 lines (80% reduction)

### Step 2: Update Message Generation

**Update Phase 5** to always use external context when available:

```markdown
## PHASE 5: Commit Message Generation

Combine:
- External context (if fetched): Problem statement, acceptance criteria
- Diff analysis: Specific changes, affected files, commit type

Generate message:
- Title: From diff analysis (commit type + primary change)
- Description: From external context (problem being solved)
- Bullets: From diff analysis (specific technical changes)
- Related: From external context (issue reference)
```

### Step 3: Test

**Test scenarios**:

1. **With Jira ID**:
   ```bash
   /schovi:commit EC-1234
   ```
   - Should ALWAYS fetch EC-1234
   - Should include issue context in commit message

2. **With GitHub PR**:
   ```bash
   /schovi:commit owner/repo#123
   ```
   - Should ALWAYS fetch PR #123
   - Should include PR context in commit message

3. **Without reference**:
   ```bash
   /schovi:commit
   ```
   - Should NOT fetch external context
   - Should use diff analysis only

4. **With clear vs unclear diffs**:
   - Both should behave identically when reference provided
   - No heuristics, no special cases

## Expected Impact

**Code Reduction**:
- Phase 4: 76 lines → 15 lines (80% reduction)
- Total commit.md: 795 → ~735 lines (8% reduction)

**Behavior**:
- ✅ More predictable (no heuristics)
- ✅ More consistent (always fetch when reference provided)
- ✅ Better commit messages (always have issue context)
- ✅ Simpler logic (one condition instead of many)

**User Experience**:
- ✅ Behavior matches expectations
- ✅ No confusion about when context is fetched
- ✅ Richer commit messages
- ✅ Negligible performance impact (<2s)

## Acceptance Criteria

- [ ] Phase 4.1 (heuristic evaluation) removed from commit.md
- [ ] Phase 4 simplified to: "If reference provided, fetch it"
- [ ] No heuristics for "clear" or "substantial" changes
- [ ] Jira references always fetched when provided
- [ ] GitHub references always fetched when provided
- [ ] No reference = diff analysis only
- [ ] All test scenarios pass
- [ ] Commit message quality maintained or improved
- [ ] Performance impact negligible (<2s overhead)

## Testing Strategy

**Functional Tests**:
- Test commit with Jira ID (verify always fetches)
- Test commit with GitHub PR (verify always fetches)
- Test commit with GitHub issue (verify always fetches)
- Test commit without reference (verify no fetch)

**Quality Tests**:
- Compare commit messages before/after change
- Verify external context included when reference provided
- Verify commit type detection still works

**Performance Tests**:
- Measure execution time with/without context fetching
- Verify <2s overhead for context fetching
- No user-noticeable slowdown

## Related Commands

**Note**: `analyze.md` and `plan.md` already do this correctly:
- They always fetch context when reference is provided
- No complex heuristics
- Simple, predictable behavior

**This change aligns `commit.md` with existing patterns.**

## Related

- See `workflow-analysis.md` Section 2.7 for detailed problem analysis
- See `workflow-analysis.md` Section 3.6 for complete simplification plan
- Aligns with patterns in `analyze.md` and `plan.md`

## Priority

**Medium** - Improves consistency and commit quality. Simple change with low risk.

## Estimated Effort

**Very Low** - 1-2 hours
- 30 minutes: Update commit.md Phase 4
- 30 minutes: Test all scenarios
- 30 minutes: Documentation update
