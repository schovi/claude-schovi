# Issue: Over-engineering in display formatting

**Labels**: `refactoring`, `performance`, `ux`

---

## Problem

Excessive visual formatting (boxes, emojis, visual separators) clutters command logic, slows execution, and makes code harder to read. Commands spend significant effort on formatting instead of functionality.

## Current State

**Visual Element Counts**:

| Command | Visual Boxes | Emojis | Lines of Formatting |
|---------|--------------|--------|---------------------|
| `implement.md` | 47 | 89 | ~150 |
| `publish.md` | 41 | 67 | ~120 |
| `analyze.md` | 34 | 72 | ~110 |
| `commit.md` | 28 | 54 | ~90 |
| `plan.md` | 26 | 48 | ~80 |
| **Total** | **176** | **330** | **~550** |

## Examples of Over-Engineering

### Example 1: Excessive Box Usage

**Current** (analyze.md):
```markdown
╭─────────────────────────────────────────────╮
│ 🔍 ANALYZING STAGED CHANGES                 │
╰─────────────────────────────────────────────╯

📝 **Files Changed**: 5 files
📋 **Insertions**: +234 lines
🔗 **Deletions**: -45 lines

**Affected Files**:
- src/api/auth-controller.ts (+156, -12)
- src/models/user.ts (+45, -8)
- src/services/jwt-service.ts (+28, -0)
- tests/auth.test.ts (+5, -25)
- README.md (+0, -0)

Analyzing changes to determine commit type...

╭─────────────────────────────────────────────╮
│ 🎯 COMMIT TYPE DETERMINED                   │
╰─────────────────────────────────────────────╯
```

**Simplified** (proposed):
```markdown
## ANALYZING CHANGES

Files: 5 | +234 -45 lines

Affected:
- src/api/auth-controller.ts (+156, -12)
- src/models/user.ts (+45, -8)
- src/services/jwt-service.ts (+28, -0)
- tests/auth.test.ts (+5, -25)
- README.md (+0, -0)

Determining commit type... feat (new authentication features detected)
```

**Savings**: 12 lines → 9 lines (25% reduction), clearer to read

### Example 2: Emoji Overload

**Current** pattern:
```markdown
🎯 🔍 📊 💡 🛠️ 📚 ✅ ❌ ⏳ 💬 🚀 🎉 📝 📋 🔗 📌 🏷️ 👀 👥
```

**Problems**:
- Hard to scan visually
- Inconsistent meaning (🔍 used for multiple purposes)
- Distracting from actual information
- No accessibility considerations

**Proposed** - Keep only essential status indicators:
```markdown
✅ Success/passed
❌ Error/failed
⏳ In progress
⚠️ Warning
```

### Example 3: Redundant Visual Separators

**Current** (implement.md):
```markdown
╭─────────────────────────────────────────────╮
│ ✅ GIT STATE VALIDATION PASSED              │
╰─────────────────────────────────────────────╯

**Branch**: feature/user-authentication
**Branch Status**: Valid feature branch
**Jira Validation**: ✅ Branch matches EC-1234
**Changes Detected**: Yes

**Summary**:
- Staged: 3 files
- Unstaged: 5 files
- Untracked: 2 files

Proceeding to staging phase...

╭─────────────────────────────────────────────╮
│ 🔄 STAGING & CHANGE ANALYSIS                │
╰─────────────────────────────────────────────╯
```

**Simplified**:
```markdown
## GIT VALIDATION ✅

Branch: feature/user-authentication (valid)
Jira: EC-1234 match ✅
Changes: 3 staged, 5 unstaged, 2 untracked

## STAGING & ANALYSIS
```

**Savings**: 18 lines → 6 lines (67% reduction)

## Impact

**Performance**:
- String generation/formatting adds execution time
- 550+ lines of pure formatting across commands
- Slower command execution (small but measurable)

**Code Maintainability**:
- Formatting logic obscures actual workflow
- Hard to find business logic among visual elements
- Difficult to modify formatting consistently

**User Experience**:
- Visual noise detracts from important information
- Too much decoration makes it harder to scan output
- Inconsistent formatting patterns across commands

**Accessibility**:
- Emojis may not render correctly in all terminals
- Screen readers may announce emojis incorrectly
- Unicode box characters may break in some environments

## Proposed Formatting Guidelines

### 1. Use Boxes Sparingly

**Use boxes only for**:
- Command start/invocation
- Final completion status
- Critical errors that halt execution

**Example**:
```markdown
╭─────────────────────────────────────────────╮
│ /schovi:analyze - Problem Analyzer          │
╰─────────────────────────────────────────────╯

[... command execution ...]

╭─────────────────────────────────────────────╮
│ ✅ ANALYSIS COMPLETE                        │
╰─────────────────────────────────────────────╯
```

### 2. Use Emojis Only for Status

**Keep these 4 status indicators**:
- `✅` Success/passed/valid
- `❌` Error/failed/invalid
- `⏳` In progress/waiting
- `⚠️` Warning/caution

**Remove decorative emojis**:
- ~~🎯 🔍 📊 💡 🛠️ 📚 🚀 🎉 📝 📋 🔗 📌 🏷️ 👀 👥~~

### 3. Use Markdown Headers for Structure

**Instead of boxes, use headers**:
```markdown
## PHASE 1: INPUT RESOLUTION
## PHASE 2: CONTEXT FETCHING
## PHASE 3: ANALYSIS
## PHASE 4: OUTPUT
```

### 4. Simple Progress Messages

**Instead of**:
```markdown
⏳ Fetching issue details via jira-analyzer...
```

**Use**:
```markdown
Fetching Jira issue EC-1234...
```

### 5. Keep Information Dense

**Instead of**:
```markdown
📝 **Files Changed**: 5 files
📋 **Insertions**: +234 lines
🔗 **Deletions**: -45 lines
```

**Use**:
```markdown
Files: 5 | +234 -45 lines
```

## Implementation Plan

### Phase 1: Create display-formatter Subagent (Week 1)

Create `agents/display-formatter/AGENT.md` with standardized operations:

```markdown
Operations:
- format_command_start(command_name, description)
- format_command_complete(command_name, status, summary)
- format_phase_header(phase_name, phase_number)
- format_status(status_type, message)
- format_error(error_type, message, suggestions)
- format_list(items, style)
- format_stat_line(stats_object)
```

### Phase 2: Update Commands (Week 2)

For each command:
1. Replace box formatting with standardized calls
2. Remove decorative emojis (keep status indicators)
3. Simplify progress messages
4. Use markdown headers for structure
5. Make information more dense

### Phase 3: Test & Measure (Week 2)

- Measure execution time before/after
- User acceptance testing (is output still clear?)
- Verify all commands use consistent formatting
- Check terminal compatibility

## Expected Impact

**Code Reduction**:
- Formatting lines: ~550 → ~150 lines (73% reduction)
- Commands become 10-15% shorter
- More readable code (less visual noise)

**Performance**:
- Faster command execution (5-10% improvement)
- Less string manipulation overhead

**User Experience**:
- Cleaner, more professional output
- Easier to scan for important information
- Better terminal compatibility
- Improved accessibility

**Maintainability**:
- Consistent formatting across all commands
- Easy to update globally (change display-formatter)
- Business logic more visible

## Before/After Comparison

### Example: analyze.md Output

**Before** (~150 lines of formatting):
```markdown
╭─────────────────────────────────────────────╮
│ 🔍 PROBLEM ANALYZER                         │
╰─────────────────────────────────────────────╯

🎯 **[Analyze-Problem]** Detected Jira issue: EC-1234
⏳ Fetching issue details via jira-analyzer...

╭─────────────────────────────────────────────╮
│ 🔍 JIRA ANALYZER                            │
╰─────────────────────────────────────────────╯
[... Jira summary ...]
╭─────────────────────────────────────────────╮
  ✅ Summary complete | ~650 tokens
╰─────────────────────────────────────────────╯

✅ **[Analyze-Problem]** Issue details fetched successfully

╭─────────────────────────────────────────────╮
│ 🔍 DEEP CODEBASE ANALYSIS                   │
╰─────────────────────────────────────────────╯

📊 **Analyzing affected components...**
[...]
```

**After** (~50 lines of formatting):
```markdown
╭─────────────────────────────────────────────╮
│ /schovi:analyze - Problem Analyzer          │
╰─────────────────────────────────────────────╯

## INPUT PROCESSING

Detected: Jira issue EC-1234
Fetching issue details...
✅ Issue fetched (~650 tokens)

## CODEBASE ANALYSIS

Analyzing affected components...
[...]

╭─────────────────────────────────────────────╮
│ ✅ ANALYSIS COMPLETE                        │
╰─────────────────────────────────────────────╯
```

**Improvement**: 67% reduction in formatting overhead, clearer structure

## Acceptance Criteria

- [ ] display-formatter subagent created with standardized operations
- [ ] All commands use display-formatter for output
- [ ] Box usage reduced to 3 per command (start, complete, critical errors)
- [ ] Emoji usage reduced to 4 status indicators only
- [ ] Markdown headers used for phase structure
- [ ] Information density improved (fewer lines for same data)
- [ ] Execution time improved by 5-10%
- [ ] User testing confirms output is clear and professional
- [ ] Terminal compatibility verified (macOS, Linux, Windows)
- [ ] Accessibility improved (screen reader friendly)

## Testing Strategy

**Performance Testing**:
- Benchmark command execution time before/after
- Measure string formatting overhead
- Target: 5-10% improvement

**User Acceptance**:
- Test output clarity with sample users
- Verify important information is prominent
- Confirm professional appearance

**Compatibility Testing**:
- Test in different terminals (iTerm2, Terminal.app, VSCode terminal, etc.)
- Test on different OSes (macOS, Linux, Windows)
- Test with different font sizes/themes

**Accessibility Testing**:
- Test with screen reader (VoiceOver, etc.)
- Verify emoji descriptions are reasonable
- Check unicode box character rendering

## Related

- Supports Issue #1 (Code Duplication) - display-formatter is a shared subagent
- See `workflow-analysis.md` Section 2.4 for detailed problem analysis
- See `workflow-analysis.md` Section 3.3 for complete formatting guidelines

## Priority

**Medium** - Can be done in parallel with other refactoring work. Provides immediate UX improvement.

## Estimated Effort

**Low-Medium** - 1-2 weeks
- Week 1: Create display-formatter, update 2-3 commands
- Week 2: Update remaining commands, testing, refinement
