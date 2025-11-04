# Issue: Missing shared library/utilities

**Labels**: `enhancement`, `architecture`, `technical-debt`

---

## Problem

There are no reusable modules for common operations. This leads to duplicated code across commands and makes maintenance difficult. Common operations like git commands, file discovery, and display formatting are re-implemented in each command file.

**Note**: This issue is essentially the same as Issue #1 (Code Duplication) but focuses on the architectural solution rather than the problem description.

## Common Operations That Are Duplicated

### 1. Git Operations
**Used in**: commit.md, publish.md, implement.md

Operations duplicated:
- Check current branch
- Validate branch name (with Jira ID matching)
- Check git status (staged, unstaged, conflicts)
- Stage files
- Create commits
- Push to remote
- Verify upstream tracking
- Check for uncommitted changes

**Lines duplicated**: ~300 lines across 3 commands

### 2. File Discovery
**Used in**: plan.md, implement.md, publish.md

Operations duplicated:
- Search for `spec-*.md` files
- Search for `analysis-*.md` files
- Parse YAML frontmatter
- Extract markdown sections
- Resolve file paths (current dir, parent dirs, user paths)

**Lines duplicated**: ~200 lines across 3 commands

### 3. Context Fetching
**Used in**: All commands

Operations duplicated:
- Detect Jira IDs (regex pattern matching)
- Spawn jira-analyzer subagent
- Detect GitHub issues/PRs (URL parsing, short-form parsing)
- Spawn gh-*-analyzer subagents
- Handle fetch errors
- Cache/reuse fetched context

**Lines duplicated**: ~300 lines across 5 commands

### 4. Display Formatting
**Used in**: All commands

Operations duplicated:
- Visual box generation (╭─╮ │ ╰─╯)
- Status indicators (✅ ❌ ⏳ ⚠️)
- Progress messages
- Error formatting
- Section headers

**Lines duplicated**: ~550 lines across 5 commands

### 5. Flag Parsing
**Used in**: All commands

Operations duplicated:
- Extract flags from arguments
- Parse flag values
- Validate flag combinations
- Set defaults
- Handle unknown flags

**Lines duplicated**: ~350 lines across 5 commands

## Total Duplication

**Estimated total**: ~1,700 lines of duplicated code across all commands

**Impact**:
- Bug fixes require updating 3-5 files
- New features require updating multiple commands
- Inconsistent implementations
- Testing burden (same logic tested multiple times)

## Proposed Solution: Create Shared Subagents

As detailed in **Issue #1**, create 5 shared subagents to extract common operations:

### 1. git-operations Subagent

**Location**: `agents/git-operations/AGENT.md`

**Operations**:
```
get_current_branch() → branch_name
validate_branch(branch, jira_id?) → {valid, warnings}
get_git_status() → {staged, unstaged, untracked, conflicts}
stage_files(pattern) → success/error
create_commit(message) → commit_hash
push_branch(force?, upstream?) → success/error
check_remote() → {exists, authenticated, url}
check_upstream() → {exists, ahead, behind}
```

**Benefits**:
- Git logic centralized and tested
- Consistent error handling
- Easy to add new git operations

### 2. file-discovery Subagent

**Location**: `agents/file-discovery/AGENT.md`

**Operations**:
```
find_spec_file(jira_id?, search_paths?) → file_path or null
find_analysis_file(jira_id?, search_paths?) → file_path or null
parse_yaml_frontmatter(file_path) → metadata object
extract_markdown_section(file_path, section_name) → content
search_conversation_for_file(pattern) → file_path or null
```

**Benefits**:
- Consistent file search logic
- Centralized path resolution
- Easy to add new file types

### 3. context-fetcher Subagent

**Location**: `agents/context-fetcher/AGENT.md`

**Operations**:
```
detect_references(text) → {jira_ids[], github_prs[], github_issues[]}
fetch_jira(issue_key) → summary (via jira-analyzer)
fetch_github_pr(pr_ref) → summary (via gh-pr-analyzer)
fetch_github_issue(issue_ref) → summary (via gh-issue-analyzer)
fetch_datadog(query) → summary (via datadog-analyzer)
cache_context(key, summary) → void
get_cached_context(key) → summary or null
```

**Benefits**:
- Single entry point for all context fetching
- Consistent caching and error handling
- Automatic routing to correct subagent

### 4. display-formatter Subagent

**Location**: `agents/display-formatter/AGENT.md`

**Operations**:
```
format_command_start(name, description) → formatted_output
format_command_complete(name, status, summary) → formatted_output
format_phase_header(name, number?) → formatted_output
format_status(type, message) → formatted_output
format_error(type, message, suggestions) → formatted_output
format_list(items, style) → formatted_output
format_stats(stats_object) → formatted_output
```

**Benefits**:
- Consistent visual style
- Easy to update formatting globally
- Reduced code clutter

### 5. flag-parser Subagent

**Location**: `agents/flag-parser/AGENT.md`

**Operations**:
```
parse_flags(args, schema) → {flags, positional, errors}
validate_flags(flags, rules) → {valid, conflicts}
get_flag_value(flags, name, default?) → value
has_flag(flags, name) → boolean
extract_positional(args, flags) → values[]
```

**Benefits**:
- Standardized flag parsing
- Centralized validation
- Easy to add new flags

## Implementation Order

**Must follow this order** to avoid circular dependencies:

### Phase 1: Foundation Subagents (Week 1)
1. **flag-parser** - No dependencies
2. **display-formatter** - No dependencies
3. **git-operations** - Depends on display-formatter

### Phase 2: Discovery & Fetching (Week 1-2)
4. **file-discovery** - Depends on flag-parser
5. **context-fetcher** - Depends on existing analyzers

### Phase 3: Command Refactoring (Week 2-3)
- Refactor commands one by one to use shared subagents
- Start with simplest (commit.md)
- End with most complex (implement.md)

## Expected Impact

**Code Metrics**:
- Shared subagents: +5 new files (~1,500 lines total)
- Commands: -1,700 lines of duplication
- Net reduction: ~200 lines
- Duplication: 40% → <5%

**Maintainability**:
- Fix bugs in one place (shared subagent)
- Add features in one place
- Consistent behavior across commands
- 5x easier to maintain

**Testing**:
- Test shared subagents independently
- Focused unit tests
- Integration tests for commands
- Less duplication in tests

**Development Speed**:
- New commands easier to create (reuse shared logic)
- New features faster to add
- Less time debugging inconsistencies

## Relationship to Other Issues

This issue is the **architectural solution** to:
- **Issue #1**: Code Duplication (same issue, implementation focus)
- **Issue #3**: Commands Too Long (shared subagents enable shorter commands)
- **Issue #4**: Display Formatting (display-formatter standardizes output)
- **Issue #5**: Flag Naming (flag-parser enforces standards)

This issue **blocks**:
- Issue #3 (commands can't be shortened without shared subagents)

This issue **is blocked by**:
- Nothing (can start immediately)

## Acceptance Criteria

- [ ] 5 shared subagents created with full specifications
- [ ] Each subagent has clear input/output interfaces
- [ ] Each operation documented with examples
- [ ] Error handling specified for each operation
- [ ] Unit tests for each subagent operation
- [ ] Integration tests with commands
- [ ] All commands use shared subagents (no duplication)
- [ ] Code duplication measured at <5%
- [ ] Documentation updated
- [ ] CLAUDE.md reflects new architecture

## Testing Strategy

**Unit Tests** (per subagent):
- Test each operation independently
- Mock external dependencies (git, file system)
- Test error cases
- Test edge cases

**Integration Tests** (with commands):
- Test commands using shared subagents
- Verify behavior matches original
- Test all flag combinations
- Test error scenarios

**Regression Tests**:
- Compare command outputs before/after
- Verify no behavioral changes
- Performance within 10% of original

## Related

- **Duplicate of**: Issue #1 (same problem, different perspective)
- **Enables**: Issue #3 (shorter commands via delegation)
- **Includes**: Issue #4 (display-formatter), Issue #5 (flag-parser)
- See `workflow-analysis.md` Section 2.8 and 3.1 for details

## Priority

**Critical** - This is the foundation for all other refactoring work. Should be first task.

## Estimated Effort

**Medium-High** - 2-3 weeks
- Week 1: Create 5 shared subagents + unit tests
- Week 2: Refactor 3 commands (commit, plan, analyze)
- Week 3: Refactor 2 commands (publish, implement) + integration testing
