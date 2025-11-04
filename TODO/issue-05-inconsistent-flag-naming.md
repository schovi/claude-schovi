# Issue: Inconsistent flag naming across commands

**Labels**: `ux`, `consistency`, `documentation`

---

## Problem

Similar flags have different names and behaviors across commands, creating a confusing user experience. Users must learn different flag conventions for each command instead of having a consistent, predictable interface.

## Current Inconsistencies

### Flag Comparison Table

| Flag Purpose | analyze.md | plan.md | implement.md | commit.md | publish.md |
|-------------|-----------|---------|--------------|-----------|------------|
| Skip file output | `--no-file` | `--no-file` | `--no-file` | ❌ (none) | `--no-file` |
| Skip auto-action | ❌ (none) | ❌ (none) | ❌ (none) | `--staged-only` | `--no-push` |
| Quick mode | `--quick` | ❌ (none) | ❌ (none) | ❌ (none) | ❌ (none) |
| Specify file | `--input` | `--input` | `--input` | ❌ (none) | `--input` |
| Override message | ❌ (none) | ❌ (none) | ❌ (none) | `--message` | `--title` |
| Minimal output | `--quiet` | `--quiet` | `--quiet` | ❌ (none) | `--quiet` |
| Post to Jira | `--post-to-jira` | `--post-to-jira` | `--post-to-jira` | ❌ (none) | `--post-to-jira` |

### Specific Inconsistencies

**1. Skip auto-action behavior**:
- `commit.md`: `--staged-only` (don't auto-stage files)
- `publish.md`: `--no-push` (don't auto-push branch)
- **Issue**: Different naming pattern for similar concept

**2. Override generated text**:
- `commit.md`: `--message "text"` (override commit message)
- `publish.md`: `--title "text"` (override PR title)
- **Issue**: Should both be `--message` or both be specific (`--commit-message`, `--pr-title`)

**3. Quick/minimal mode**:
- `analyze.md`: `--quick` (generate quick analysis)
- Other commands: No equivalent
- **Issue**: Should `plan.md` have `--quick` for minimal specs?

**4. Missing flags**:
- `commit.md`: No `--input`, `--no-file`, `--quiet`, `--post-to-jira`
- **Issue**: Commit command is less consistent with others

## Impact

**User Experience**:
- Confusion about which flags are available
- Must check documentation for each command
- Can't leverage knowledge from one command to another
- Increased learning curve

**Documentation Burden**:
- Must document flags separately for each command
- Hard to maintain consistency in docs
- No single reference for all flags

**Development Burden**:
- Adding new flags requires updating 5 different files
- Easy to miss flags when adding features
- Testing requires checking each command separately

## Proposed Standard Flag Schema

### Universal Flags (All Commands)

**Input Flags**:
```bash
--input PATH              # Specify input file explicitly
--from TEXT               # Create from scratch with description
```

**Output Flags**:
```bash
--output PATH             # Save to specific file
--no-file                 # Skip file creation (terminal only)
--quiet                   # Minimal terminal output
```

**Integration Flags**:
```bash
--post-to-jira            # Post result to Jira (requires Jira ID)
```

### Mode Flags (Command-Specific)

**Quick/Minimal Mode**:
```bash
--quick                   # Quick mode (analyze, plan)
--draft                   # Draft mode (publish)
--resume                  # Resume from checkpoint (implement)
```

**Skip Auto-Actions**:
```bash
--staged-only             # Use only staged files (commit, implement)
--no-push                 # Skip auto-push (publish)
```

### Override Flags

```bash
--message TEXT            # Override generated message (commit)
--title TEXT              # Override generated title (publish)
--base BRANCH             # Specify base branch (publish)
--type PREFIX             # Force commit type (commit)
```

## Naming Conventions

### Boolean Flags

**Positive form**:
```bash
--quick                   # Enable quick mode
--draft                   # Enable draft mode
--resume                  # Enable resume mode
```

**Negative form** (for disabling default behavior):
```bash
--no-file                 # Disable file creation
--no-push                 # Disable auto-push
```

**Constraint form** (for limiting scope):
```bash
--staged-only             # Use only staged files
```

### Value Flags

**Pattern**: `--flag-name VALUE`
```bash
--input PATH              # Input file path
--output PATH             # Output file path
--message TEXT            # Message text
--title TEXT              # Title text
--base BRANCH             # Branch name
--type PREFIX             # Type prefix
--from TEXT               # From-scratch description
```

### Multi-Word Flags

**Use hyphens** (not camelCase or underscores):
```bash
✅ --staged-only
✅ --no-file
✅ --post-to-jira

❌ --stagedOnly
❌ --no_file
❌ --postToJira
```

## Implementation Plan

### Phase 1: Create Flag Reference (Week 1)

Create `docs/flag-reference.md` documenting:
- All standard flags
- Flag naming conventions
- Which flags apply to which commands
- Examples of each flag

### Phase 2: Standardize Flags (Week 1-2)

**For each command**:

1. **analyze.md**:
   - ✅ Already has: `--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`, `--quick`
   - No changes needed

2. **plan.md**:
   - ✅ Already has: `--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`
   - Add: `--quick` (for minimal spec generation)
   - Add: `--from "text"` (alias for `--from-scratch`)

3. **implement.md**:
   - ✅ Already has: `--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`
   - Add: `--resume` (for resuming from checkpoint)
   - Consider: `--staged-only` (if relevant)

4. **commit.md**:
   - ❌ Missing: `--input`, `--no-file`, `--quiet`, `--post-to-jira`
   - Add: `--input PATH` (read commit notes from file)
   - Add: `--no-file` (don't save commit message to file)
   - Add: `--quiet` (minimal output)
   - Add: `--post-to-jira` (post commit info to Jira)
   - ✅ Keep: `--message`, `--staged-only`, `--type`

5. **publish.md**:
   - ✅ Already has: `--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`
   - ✅ Keep: `--draft`, `--base`, `--title`, `--no-push`

### Phase 3: Update flag-parser Subagent (Week 2)

When creating `agents/flag-parser/AGENT.md` (from Issue #1):
- Implement standardized flag parsing
- Validate flag combinations
- Provide clear error messages for invalid flags
- Support all standard flags

### Phase 4: Documentation (Week 2)

1. Create comprehensive flag reference
2. Update README.md with flag overview
3. Update CLAUDE.md with flag conventions
4. Add examples to each command's documentation

### Phase 5: Deprecation (Week 3+)

If any flags need to be renamed:
- Support old flag names with deprecation warning
- Update documentation to show new names
- After 1-2 versions, remove deprecated names

## Expected Impact

**User Experience**:
- ✅ Consistent flag names across all commands
- ✅ Predictable behavior
- ✅ Learn once, use everywhere
- ✅ Better discoverability

**Documentation**:
- ✅ Single flag reference guide
- ✅ Consistent examples
- ✅ Easier to maintain

**Development**:
- ✅ Standard flag parser handles all flags
- ✅ Easy to add new flags consistently
- ✅ Clear conventions for new commands

## Acceptance Criteria

- [ ] `docs/flag-reference.md` created with complete flag documentation
- [ ] All commands support universal flags (`--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`)
- [ ] Flag naming follows conventions (hyphens, not camelCase)
- [ ] Boolean flags use positive/negative/constraint patterns consistently
- [ ] Value flags follow `--flag-name VALUE` pattern
- [ ] `commit.md` updated with missing universal flags
- [ ] `plan.md` has `--quick` flag for minimal specs
- [ ] `implement.md` has `--resume` flag documented
- [ ] All flag combinations validated (no conflicts)
- [ ] Documentation updated across all commands
- [ ] Examples show correct flag usage
- [ ] Deprecated flags (if any) show warning messages

## Testing Strategy

**Flag Parsing Tests**:
- Test each flag individually
- Test flag combinations
- Test invalid flags (should error)
- Test conflicting flags (should error)

**Command Tests**:
- Test each command with all applicable flags
- Test flag behavior (does `--no-file` actually skip file creation?)
- Test flag defaults (what happens when no flags provided?)

**Documentation Tests**:
- Verify all flags documented
- Verify examples are correct
- Verify flag reference matches implementation

## Migration Guide

For users of current version:

### Breaking Changes (if any)

**None expected** - We're adding flags, not removing/renaming existing ones.

### New Flags Available

**commit.md** now supports:
- `--input PATH` - Read commit message from file
- `--no-file` - Don't save commit message
- `--quiet` - Minimal output
- `--post-to-jira` - Post commit to Jira

**plan.md** now supports:
- `--quick` - Generate minimal spec
- `--from "description"` - Alternative to `--from-scratch`

**implement.md** now supports:
- `--resume` - Resume from last checkpoint

### Updated Documentation

See `docs/flag-reference.md` for complete flag listing.

## Related

- Supports Issue #1 (Code Duplication) - flag-parser handles standardization
- See `workflow-analysis.md` Section 2.5 for detailed problem analysis
- See `workflow-analysis.md` Section 3.4 for complete standardization plan

## Priority

**Medium** - Improves UX significantly but doesn't block other work. Can be done in parallel.

## Estimated Effort

**Low-Medium** - 1-2 weeks
- Week 1: Create flag reference, update commands
- Week 2: Testing, documentation, refinement
