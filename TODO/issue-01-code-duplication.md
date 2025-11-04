# Issue: Massive code duplication (~40%) across commands

**Labels**: `refactoring`, `technical-debt`, `high-priority`

---

## Problem

Commands share approximately **40% of their code**, primarily in input/output handling, flag parsing, file discovery, git operations, and display formatting. This creates significant maintenance burden and inconsistent behavior.

## Examples of Duplication

All 5 commands duplicate:
- **Flag parsing** (--input, --output, --no-file, --quiet, --post-to-jira) - ~70 lines per command
- **File discovery** (searching for spec-*.md, analysis-*.md) - ~100 lines per command
- **Context fetching** (Jira/GitHub via subagents) - ~150 lines per command
- **Git validation** (branch checks, status checks) - ~100 lines per command
- **Display formatting** (visual boxes, emojis) - ~50 lines per command
- **Error handling** (file not found, API errors) - ~200 lines per command

## Files Affected

- `commands/analyze.md` (879 lines) - Lines 13-80 (flag parsing), 142-200 (context fetching)
- `commands/plan.md` (716 lines) - Lines 13-80 (flag parsing), 82-200 (file discovery)
- `commands/implement.md` (1330 lines) - Lines 29-70 (flag parsing), 117-250 (file discovery)
- `commands/commit.md` (795 lines) - Lines 55-94 (input parsing), 97-250 (git validation)
- `commands/publish.md` (1230 lines) - Lines 55-113 (input parsing), 115-270 (git validation)

## Impact

- **Maintenance burden**: Bug fixes must be applied to 5 different files
- **Inconsistent behavior**: Each command implements shared logic slightly differently
- **Code bloat**: ~2,000 lines of duplicated code across all commands
- **Testing difficulty**: Must test same logic 5 times in different contexts

## Proposed Solution

Extract shared logic into specialized subagents:

1. **`agents/git-operations/AGENT.md`** - All git commands
   - Operations: get_current_branch, validate_branch, get_git_status, stage_files, create_commit, push_branch, check_remote

2. **`agents/file-discovery/AGENT.md`** - File search and parsing
   - Operations: find_spec_file, find_analysis_file, parse_yaml_frontmatter, extract_markdown_section

3. **`agents/context-fetcher/AGENT.md`** - Universal context fetching
   - Operations: detect_references, fetch_context (routes to jira-analyzer, gh-pr-analyzer, etc.)

4. **`agents/display-formatter/AGENT.md`** - Standardized output
   - Operations: format_section, format_list, format_status, format_error

5. **`agents/flag-parser/AGENT.md`** - Argument parsing
   - Operations: parse_flags, validate_flag_combinations, extract_positional

## Implementation Plan

### Phase 1: Create Shared Subagents (Week 1)
- Create 5 new subagent files with detailed specifications
- Define input/output interfaces for each operation
- Add error handling patterns

### Phase 2: Test Independently (Week 1)
- Unit test each operation
- Integration test with real repos
- Edge case testing

### Phase 3: Refactor Commands (Week 2-3)
- Start with `commit.md` as pilot (shortest command)
- Measure line reduction and verify behavior
- Apply to remaining 4 commands

### Phase 4: Cleanup (Week 3)
- Remove duplicated code
- Update documentation
- Run full test suite

## Expected Impact

- **Code reduction**: 9,900 lines → 7,400 lines (25% overall reduction)
- **Duplication**: 40% → <5%
- **Maintenance**: 5x easier (fix once vs. fix in 5 files)
- **Command length**: Average 990 lines → 400 lines (60% reduction)
- **Consistency**: All commands use identical implementations for shared operations

## Acceptance Criteria

- [ ] 5 shared subagents created with full specifications
- [ ] Each subagent has clear input/output interfaces
- [ ] All commands refactored to use shared subagents
- [ ] Code duplication measured at <5%
- [ ] All existing functionality preserved (regression tests pass)
- [ ] Command behavior identical from user perspective
- [ ] Documentation updated to reflect new architecture

## Testing Strategy

**Unit Tests**:
- Test each shared subagent operation independently
- Mock git operations, file I/O
- Cover edge cases (missing files, invalid input, etc.)

**Integration Tests**:
- Test commands end-to-end with shared subagents
- Use real git repos and files
- Verify outputs match previous behavior

**Regression Tests**:
- Run all existing command tests
- Compare outputs before/after refactoring
- Ensure no behavioral changes

## Related

- See `workflow-analysis.md` Section 2.1 for detailed problem analysis
- See `workflow-analysis.md` Section 3.1 for complete implementation plan
- Related to Issue #8 (Missing Shared Library/Utilities)

## Priority

**High** - This is the foundation for other improvements and blocks several other issues.
