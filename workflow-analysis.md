# Claude Workflow Analysis & Improvement Recommendations

**Date**: 2025-11-04
**Current Version**: v1.6.0
**Analyzer**: Claude Code

---

## Executive Summary

Your schovi plugin demonstrates **excellent architectural foundations** with the three-tier pattern (Skills → Commands → Subagents) and context isolation achieving 75-95% token savings. However, there are significant opportunities to improve **code quality, simplicity, and maintainability** through strategic refactoring.

**Key Metrics**:
- **Current Complexity**: 5 commands (700-1330 lines each), 3 skills (500-750 lines), 6 subagents
- **Duplication Level**: ~40% code duplication across commands
- **Improvement Potential**: 50% reduction in total lines, 60% reduction in duplication

---

## 1. Architecture Strengths

### ✅ What's Working Well

1. **Three-Tier Pattern** - Brilliant separation of concerns
   - Skills (intelligence layer): When to fetch
   - Commands (workflow layer): What to do
   - Subagents (execution layer): How to fetch

2. **Context Isolation** - Game-changing token efficiency
   - 75-95% token savings by isolating large payloads
   - Clean main context for codebase analysis

3. **Comprehensive Workflows** - End-to-end coverage
   - Analyze → Plan → Implement → Commit → Publish
   - Each phase is well-defined

4. **Structured Outputs** - Consistent formats
   - YAML frontmatter + markdown
   - File references with line numbers
   - Quality gates at each phase

5. **Integration Flexibility** - Multiple input sources
   - Jira, GitHub Issues, GitHub PRs, Datadog
   - Auto-detection via skills
   - Manual invocation via commands

---

## 2. Critical Issues

### ❌ Issue 1: Massive Code Duplication (~40%)

**Problem**: Commands share 90% of their input/output handling logic.

**Examples of Duplication**:
```
All 5 commands duplicate:
- Flag parsing (--input, --output, --no-file, --quiet, --post-to-jira)
- File discovery (searching for spec-*.md, analysis-*.md)
- Context fetching (Jira/GitHub via subagents)
- Git validation (branch checks, status checks)
- Display formatting (visual boxes, emojis)
- Error handling (file not found, API errors)
```

**Files Affected**:
- `commands/analyze.md` (879 lines) - Lines 13-80 (flag parsing)
- `commands/plan.md` (716 lines) - Lines 13-80 (flag parsing)
- `commands/implement.md` (1330 lines) - Lines 29-70 (flag parsing)
- `commands/commit.md` (795 lines) - Lines 55-94 (input parsing)
- `commands/publish.md` (1230 lines) - Lines 55-113 (input parsing)

**Impact**:
- Hard to maintain (5 places to update for any change)
- Inconsistent behavior (flag handling differs slightly)
- Unnecessary complexity

**Recommendation**: Extract to shared agent modules (see Section 3.1)

---

### ❌ Issue 2: Incorrect Subagent Invocation in Skills

**Problem**: Skills use `"general-purpose"` instead of fully qualified subagent names.

**Location**:
- `skills/jira-auto-detector/SKILL.md:134` - Uses `"general-purpose"`
- Should be: `"schovi:jira-analyzer:jira-analyzer"`

**From CLAUDE.md**:
```markdown
### Spawning Subagents

**From commands or skills**, use Task tool with fully qualified name:

Task tool:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
```

**Current Code** (jira-auto-detector:134):
```markdown
Tool: Task
Parameters:
  prompt: "Fetch and summarize https://productboard.atlassian.net/browse/[ISSUE-KEY]"
  subagent_type: "general-purpose"  # ❌ WRONG!
  description: "Fetching Jira issue context"
```

**Should Be**:
```markdown
Tool: Task
Parameters:
  prompt: "Fetch and summarize https://productboard.atlassian.net/browse/[ISSUE-KEY]"
  subagent_type: "schovi:jira-analyzer:jira-analyzer"  # ✅ CORRECT
  description: "Fetching Jira issue context"
```

**Impact**:
- Skills may not use optimized subagents
- Context isolation may not work properly
- Token savings may be compromised

**Files to Fix**:
- `skills/jira-auto-detector/SKILL.md:134`
- `skills/gh-pr-auto-detector/SKILL.md:230` (if same issue)
- `skills/datadog-auto-detector/SKILL.md` (verify)

---

### ❌ Issue 3: Commands Are Too Long (700-1330 lines)

**Problem**: Single-file commands are difficult to maintain and understand.

**Current State**:
- `implement.md`: 1330 lines
- `publish.md`: 1230 lines
- `analyze.md`: 879 lines
- `commit.md`: 795 lines
- `plan.md`: 716 lines

**Why This Matters**:
- Hard to find specific logic
- Difficult to test individual pieces
- Cognitive overload for contributors
- High risk of introducing bugs during changes

**Industry Best Practice**: Functions/modules should be <300 lines

**Recommendation**: See Section 3.2 - Modular Command Architecture

---

### ❌ Issue 4: Over-Engineering in Display Formatting

**Problem**: Excessive visual formatting clutters logic and slows execution.

**Examples**:
```markdown
# Every command has these boxes everywhere:
╭─────────────────────────────────────────────╮
│ 📝 SECTION TITLE                            │
╰─────────────────────────────────────────────╯

# Repeated emoji patterns:
🎯 🔍 📊 💡 🛠️ 📚 ✅ ❌ ⏳ 💬 🚀 🎉
```

**Counts**:
- `implement.md`: 47 visual boxes, 89 emojis
- `analyze.md`: 34 visual boxes, 72 emojis
- `publish.md`: 41 visual boxes, 67 emojis

**Impact**:
- Makes code harder to read
- Slows down command execution
- Distracts from actual logic

**Recommendation**: Simplify to minimal, consistent formatting (see Section 3.3)

---

### ❌ Issue 5: Inconsistent Flag Naming & Behavior

**Problem**: Similar flags have different names and behaviors across commands.

**Examples**:

| Flag Purpose | analyze.md | plan.md | implement.md | commit.md | publish.md |
|-------------|-----------|---------|--------------|-----------|------------|
| Skip file output | `--no-file` | `--no-file` | `--no-file` | (none) | `--no-file` |
| Skip auto-action | (none) | (none) | (none) | `--staged-only` | `--no-push` |
| Quick mode | `--quick` | (none) | (none) | (none) | (none) |
| Specify file | `--input` | `--input` | `--input` | (none) | `--input` |
| Override message | (none) | (none) | (none) | `--message` | `--title` |

**Impact**:
- Confusing UX (users must remember different flags)
- Harder to document
- Increased cognitive load

**Recommendation**: Standardize flag naming (see Section 3.4)

---

### ❌ Issue 6: Spec-Generator Template Issues

**Problem 1**: Testing Strategy focuses on manual checklists instead of code tests.

**Location**: `agents/spec-generator/AGENT.md:146-167`

**Current Instruction**:
```markdown
## Testing Strategy
Structure from approach details:
- Unit Tests: List scenarios to test
- Integration Tests: List scenarios to test
- E2E Tests (if applicable): List scenarios
- Manual Testing Checklist: Step-by-step verification
```

**But the spec says** (lines 148-167):
```markdown
**FOCUS ON CODE TESTS ONLY**:
- **Unit Tests**: Which test files need to be modified/created and what scenarios to test
- **Integration Tests**: Which integration test files need updates and what scenarios to cover
- **E2E Tests** (if applicable): Which E2E test files need updates
- **NO manual testing checklists** - manual verification happens during PR review
```

**Problem 2**: Deployment & Rollout section is often unnecessary.

**Location**: `agents/spec-generator/AGENT.md:189-229`

**Issue**: Creates "Deployment & Rollout" section even for standard deployments where no special instructions are needed.

**Should**:
- Skip section entirely for standard deployments
- Only include when truly non-standard (feature flags, multi-repo coordination, complex rollback)

**Impact**:
- Specs include unnecessary boilerplate
- Confuses implementers about whether deployment is special
- Wastes time documenting standard processes

**Recommendation**: See Section 3.5

---

### ⚠️ Issue 7: Complex Context Fetching Decision Logic

**Problem**: Commands try to be too smart about when to fetch external context.

**Location**: `commands/commit.md:343-419` (Phase 4: Optional Context Fetching)

**Current Logic**:
```markdown
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

**Issues**:
- Complex heuristics ("clear" is subjective)
- May skip valuable context
- Saves minimal time (context fetching is fast with isolation)
- Inconsistent behavior (sometimes fetches, sometimes doesn't)

**Impact**:
- Commit messages may lack important issue context
- User confusion about why context wasn't fetched
- Unnecessary complexity

**Recommendation**: Simplify to "Always fetch if reference provided" (see Section 3.6)

---

### ⚠️ Issue 8: Missing Shared Library/Utilities

**Problem**: No reusable modules for common operations.

**Common Operations Duplicated**:

1. **Git Operations** (used in commit.md, publish.md, implement.md):
   - Check current branch
   - Validate branch name
   - Check git status
   - Stage files
   - Push to remote
   - Verify commits

2. **File Discovery** (used in plan.md, implement.md, publish.md):
   - Search for spec-*.md files
   - Search for analysis-*.md files
   - Parse YAML frontmatter
   - Extract sections from markdown

3. **Context Fetching** (used in all commands):
   - Detect Jira IDs (regex pattern)
   - Spawn jira-analyzer subagent
   - Detect GitHub issues/PRs
   - Spawn gh-*-analyzer subagents
   - Handle fetch errors

4. **Display Formatting** (used in all commands):
   - Visual box generation
   - Status indicators (✅ ❌ ⏳)
   - Progress messages
   - Error formatting

5. **Flag Parsing** (used in all commands):
   - Extract --input, --output, --no-file, --quiet
   - Validate flag combinations
   - Set defaults

**Impact**:
- 40% code duplication
- Inconsistent implementations
- Bug fixes must be applied to multiple files

**Recommendation**: See Section 3.7 - Shared Agent Modules

---

## 3. Proposed Improvements

### 3.1 Extract Shared Agent Modules

**Goal**: Reduce duplication from 40% to <5%

**Create New Subagents for Reusable Logic**:

#### A. `git-operations` Subagent
**Location**: `agents/git-operations/AGENT.md`
**Purpose**: All git commands in one place
**Operations**:
- `get_current_branch()` → branch name
- `validate_branch(branch, jira_id?)` → {valid, warnings}
- `get_git_status()` → {staged, unstaged, untracked, conflicts}
- `stage_files(pattern)` → success/error
- `create_commit(message)` → commit_hash
- `push_branch(force?)` → success/error
- `check_remote()` → {exists, authenticated}

**Benefits**:
- Git logic tested in one place
- Consistent error handling
- Easy to add new git operations

#### B. `file-discovery` Subagent
**Location**: `agents/file-discovery/AGENT.md`
**Purpose**: Find and parse project files
**Operations**:
- `find_spec_file(jira_id?, search_paths?)` → file_path or null
- `find_analysis_file(jira_id?, search_paths?)` → file_path or null
- `parse_yaml_frontmatter(file_path)` → metadata object
- `extract_markdown_section(file_path, section_name)` → content

**Benefits**:
- Consistent file search logic
- Centralized path resolution
- Easy to add new file types

#### C. `context-fetcher` Subagent
**Location**: `agents/context-fetcher/AGENT.md`
**Purpose**: Universal context fetching dispatcher
**Operations**:
- `detect_references(text)` → {jira_ids, github_prs, github_issues}
- `fetch_context(reference_type, reference_id)` → summary
- Internally routes to jira-analyzer, gh-pr-analyzer, etc.

**Benefits**:
- Single entry point for all context fetching
- Consistent error handling
- Automatic retries and caching

#### D. `display-formatter` Subagent
**Location**: `agents/display-formatter/AGENT.md`
**Purpose**: Standardized output formatting
**Operations**:
- `format_section(title, content, type?)` → formatted_output
- `format_list(items, bullet_type?)` → formatted_list
- `format_status(status, message)` → status_line
- `format_error(error_type, message, suggestions)` → error_display

**Benefits**:
- Consistent visual style
- Easy to update formatting globally
- Reduced clutter in command logic

#### E. `flag-parser` Subagent
**Location**: `agents/flag-parser/AGENT.md`
**Purpose**: Standardized argument parsing
**Operations**:
- `parse_flags(args, schema)` → {parsed_flags, errors}
- `validate_flag_combinations(flags)` → {valid, conflicts}
- `extract_positional(args, flags)` → positional_values

**Benefits**:
- Consistent flag naming
- Centralized validation
- Easy to add new flags globally

**Implementation Strategy**:
```markdown
# Before (in each command):
## PHASE 1: INPUT PARSING
[200 lines of flag parsing logic]
[100 lines of file search logic]
[150 lines of git validation logic]

# After (using shared subagents):
## PHASE 1: INPUT RESOLUTION

Use flag-parser subagent:
  - Parse arguments → {input_path, output_path, flags}
  - Validate → {valid, errors, warnings}

Use file-discovery subagent:
  - Find spec file → path or null
  - Parse frontmatter → {jira_id, title, status}

Use git-operations subagent:
  - Get current branch → branch_name
  - Validate branch → {valid, warnings}
  - Check git status → {staged_files, unstaged_files}

[Reduced to ~30 lines in each command]
```

**Estimated Impact**:
- Commands: 700-1330 lines → 300-500 lines (50-62% reduction)
- Duplication: 40% → <5%
- Maintainability: Much easier to update shared logic

---

### 3.2 Modular Command Architecture

**Goal**: Break commands into manageable phases with clear responsibilities

**Pattern**: Each command should delegate heavy lifting to subagents

**Refactored Command Structure**:
```markdown
# command/analyze.md (target: <400 lines)

## PHASE 1: Input Resolution (use flag-parser + file-discovery subagents)
## PHASE 2: Context Fetching (use context-fetcher subagent)
## PHASE 3: Analysis Execution (use analysis-generator subagent)
## PHASE 4: Output Handling (use display-formatter subagent)

Each phase: 30-50 lines of orchestration logic
```

**Example Refactor - analyze.md**:

**Before** (879 lines):
```markdown
Lines 13-80: Flag parsing logic (68 lines)
Lines 82-140: Input processing (58 lines)
Lines 142-200: Fetch Jira (58 lines)
Lines 202-260: Fetch GitHub (58 lines)
Lines 262-400: Deep codebase analysis (138 lines)
Lines 402-520: Analysis generation (118 lines)
Lines 522-600: Output handling (78 lines)
Lines 602-879: Error handling & examples (277 lines)
```

**After** (~350 lines):
```markdown
Lines 1-50: Overview & usage patterns
Lines 51-100: PHASE 1 - Input resolution (delegate to flag-parser + file-discovery)
Lines 101-150: PHASE 2 - Context fetching (delegate to context-fetcher)
Lines 151-200: PHASE 3 - Analysis (delegate to analysis-generator)
Lines 201-250: PHASE 4 - Output (delegate to display-formatter)
Lines 251-350: Error handling (simplified)
```

**Benefits**:
- Commands become orchestrators, not implementers
- Logic reuse across commands
- Easier to test and maintain

---

### 3.3 Simplify Display Formatting

**Goal**: Reduce visual clutter by 70%, speed up execution

**Current Approach** (analyze.md example):
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
```

**Simplified Approach**:
```markdown
## ANALYZING CHANGES

Files: 5 | +234 -45 lines

Affected:
- src/api/auth-controller.ts (+156, -12)
- src/models/user.ts (+45, -8)
- src/services/jwt-service.ts (+28, -0)
- tests/auth.test.ts (+5, -25)
- README.md (+0, -0)

Determining commit type...
```

**Formatting Guidelines**:
- **Use boxes only** for: Command start, completion, critical errors
- **Use emojis sparingly**: One per major phase transition
- **Use markdown headers**: ## for phases, ### for steps
- **Keep progress messages simple**: "Fetching context...", "Analyzing...", "Done"

**Status Indicators** (keep these):
- ✅ Success/passed
- ❌ Error/failed
- ⏳ In progress
- ⚠️ Warning

**Benefits**:
- Faster to execute (less string formatting)
- Easier to read (less visual noise)
- More professional appearance

---

### 3.4 Standardize Flag Naming

**Goal**: Consistent, predictable flag names across all commands

**Proposed Standard Flags**:

#### Input Flags (all commands):
- `--input PATH` - Specify input file explicitly
- `--from TEXT` - Create from scratch with description

#### Output Flags (all commands):
- `--output PATH` - Save to specific file
- `--no-file` - Skip file creation (terminal only)
- `--quiet` - Minimal terminal output

#### Integration Flags (all commands with external systems):
- `--post-to-jira` - Post result to Jira (requires Jira ID)

#### Mode Flags (specific commands):
- `--quick` - Quick mode (analyze, plan)
- `--draft` - Draft mode (publish)
- `--resume` - Resume from checkpoint (implement)

#### Override Flags:
- `--staged-only` - Use only staged files (commit, implement)
- `--no-push` - Skip auto-push (publish)
- `--base BRANCH` - Specify base branch (publish)
- `--message TEXT` - Override generated message (commit)
- `--title TEXT` - Override generated title (publish)
- `--type PREFIX` - Force commit type (commit)

**Naming Conventions**:
- Boolean flags: `--flag-name` or `--no-flag-name` (for negation)
- Value flags: `--flag-name VALUE`
- Multi-word flags: Use hyphens (--staged-only, not --stagedonly)

**Benefits**:
- Users learn once, use everywhere
- Easier documentation
- Reduced cognitive load

---

### 3.5 Fix Spec-Generator Template Issues

#### Fix 1: Testing Strategy - Code Tests Only

**Current Location**: `agents/spec-generator/AGENT.md:146-167`

**Problem**: Ambiguous instructions lead to manual testing checklists

**Fix - Update Section 5 (Testing Strategy)**:

Replace lines 146-167 with:
```markdown
##### Section 5: Testing Strategy
Structure from approach details - **FOCUS ON CODE TESTS ONLY**:
- **Unit Tests**: Which test files need to be modified/created and what scenarios to test
- **Integration Tests**: Which integration test files need updates and what scenarios to cover
- **E2E Tests** (if applicable): Which E2E test files need updates
- **NO manual testing checklists** - manual verification happens during PR review

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

#### Fix 2: Deployment & Rollout - Only When Needed

**Current Location**: `agents/spec-generator/AGENT.md:189-229`

**Problem**: Always creates Deployment section even for standard deployments

**Fix - Update Section 7 (Deployment & Rollout)**:

Replace lines 189-229 with:
```markdown
##### Section 7: Deployment & Rollout (Conditional)
**IMPORTANT**: Only include this section if deployment is non-standard.

**Include when**:
- Feature flag (LaunchDarkly) required for gradual rollout
- Multiple repositories must be deployed in specific order
- Database migrations or breaking changes involved
- Coordination with other teams required
- Complex monitoring or rollback procedures

**Skip when**: Standard single-repo deployment with no special requirements

**If including, provide**:
- Feature flag details (name, location, strategy)
- Deployment sequence (if multi-repo)
- Critical monitoring metrics (only if specific)
- Rollback procedure (only if non-trivial)

Example when needed:
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

Example when not needed - DO NOT include this section at all. Skip to next section.
```

**Quality Check Update** (lines 402-413):

Add to checklist:
```markdown
- [ ] Deployment & Rollout section only included if truly non-standard
```

**Benefits**:
- Specs focus on implementation, not boilerplate
- Clearer signal when deployment IS special
- Less clutter in specs

---

### 3.6 Simplify Context Fetching Logic

**Goal**: Remove complex heuristics, always fetch when reference provided

**Current Approach** (commit.md:343-419):
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

**Simplified Approach**:
```markdown
## PHASE 4: Context Fetching

If user provided Jira ID, GitHub issue, or GitHub PR:
  - Always fetch context via appropriate subagent
  - Display: "Fetching context from [source]..."
  - Context fetching is fast (<2s) due to isolation
  - Always enriches commit message with issue context

Otherwise:
  - Use only diff analysis
```

**Rationale**:
- Context fetching is fast (thanks to isolation)
- User explicitly provided reference → they want that context
- Simpler logic = fewer edge cases = fewer bugs
- More consistent behavior

**Files to Update**:
- `commands/commit.md` - Remove Phase 4.1, simplify Phase 4
- `commands/analyze.md` - Already does this correctly
- `commands/plan.md` - Already does this correctly

**Benefits**:
- Reduced complexity (~50 lines removed)
- More predictable behavior
- Better commit messages (always have issue context)

---

### 3.7 Create Shared Documentation

**Goal**: Reduce duplication in documentation and examples

**Current State**:
- Error handling documented in every command (~200 lines each)
- Usage examples repeated
- Flag documentation repeated
- Architecture explanations repeated

**Proposed Structure**:
```
schovi/
├── docs/
│   ├── getting-started.md     # Installation, first use
│   ├── architecture.md        # Three-tier pattern, context isolation
│   ├── command-reference.md   # All commands, all flags
│   ├── flag-reference.md      # Standardized flags across commands
│   ├── error-guide.md         # Common errors and solutions
│   └── extending.md           # How to add integrations
├── commands/
│   ├── analyze.md            # Just workflow, reference docs/
│   ├── plan.md               # Just workflow, reference docs/
│   ├── implement.md          # Just workflow, reference docs/
│   ├── commit.md             # Just workflow, reference docs/
│   └── publish.md            # Just workflow, reference docs/
```

**Command Structure After**:
```markdown
# commands/analyze.md

---
description: Deep analysis of bugs/features with codebase exploration
argument-hint: [jira-id|pr-url|description] [flags]
allowed-tools: [...]
---

# Problem Analyzer Workflow

See: [Command Reference](../docs/command-reference.md#analyze) for full details.

## Workflow

### Phase 1: Input Resolution
[Concise phase description - 20 lines]

### Phase 2: Context Fetching
[Concise phase description - 20 lines]

### Phase 3: Analysis
[Concise phase description - 20 lines]

### Phase 4: Output
[Concise phase description - 20 lines]

## Error Handling
See: [Error Guide](../docs/error-guide.md) for common issues.
```

**Benefits**:
- Commands: 700-1330 lines → 200-300 lines (70% reduction)
- Single source of truth for shared concepts
- Easier to keep documentation in sync
- Better user experience (centralized docs)

---

### 3.8 Add Command Output Examples

**Goal**: Help users understand what to expect

**Current State**: Commands describe output but don't show actual examples

**Proposed Addition**: Add `examples/` directory

```
schovi/
├── examples/
│   ├── analyze-output.md      # Example analyze command output
│   ├── plan-output.md         # Example spec generation
│   ├── implement-log.md       # Example implementation execution
│   ├── commit-example.md      # Example commit message
│   └── pr-example.md          # Example PR description
```

**Each example shows**:
- Input command
- Actual output (truncated for brevity)
- Resulting artifacts (files created)

**Benefits**:
- Users know what to expect
- Easier to debug when output differs
- Better onboarding experience

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Fix critical issues, establish shared patterns

**Tasks**:
1. ✅ Fix subagent invocation in skills (Issue #2)
   - Update jira-auto-detector.md:134
   - Update gh-pr-auto-detector.md:230
   - Test with actual Jira/GitHub calls

2. ✅ Fix spec-generator template issues (Issue #6)
   - Update testing strategy section (lines 146-167)
   - Update deployment section (lines 189-229)
   - Test spec generation with new template

3. ✅ Simplify context fetching logic (Issue #7)
   - Remove complex heuristics from commit.md
   - Always fetch if reference provided
   - Test with various scenarios

4. ✅ Standardize flag naming (Issue #5)
   - Document standard flags in new flag-reference.md
   - Update all commands to use standard names
   - Add validation for deprecated flags

**Deliverables**:
- `docs/flag-reference.md`
- Fixed skill invocations
- Updated spec-generator template
- Simplified commit command

**Testing**:
- Run each command with test inputs
- Verify subagents are called correctly
- Check generated specs match new template
- Verify commit messages include context

---

### Phase 2: Shared Modules (Week 3-4)
**Goal**: Create reusable subagents, reduce duplication

**Tasks**:
1. Create shared subagents
   - `agents/git-operations/AGENT.md`
   - `agents/file-discovery/AGENT.md`
   - `agents/context-fetcher/AGENT.md`
   - `agents/display-formatter/AGENT.md`
   - `agents/flag-parser/AGENT.md`

2. Test shared subagents independently
   - Unit test each operation
   - Integration test with real git repos
   - Edge case testing

3. Update one command as pilot (recommend: commit.md)
   - Refactor to use shared subagents
   - Measure line reduction
   - Test thoroughly

4. Document shared module patterns
   - Add to architecture.md
   - Examples of using shared subagents

**Deliverables**:
- 5 new shared subagents
- Refactored commit.md (pilot)
- Documentation in architecture.md
- Test suite for shared modules

**Success Metrics**:
- commit.md: 795 lines → ~300 lines (62% reduction)
- All operations work identically
- No new bugs introduced

---

### Phase 3: Command Refactoring (Week 5-6)
**Goal**: Update all commands to use shared modules

**Tasks**:
1. Refactor analyze.md
   - Use flag-parser, file-discovery, context-fetcher
   - Target: 879 → 350 lines (60% reduction)

2. Refactor plan.md
   - Use flag-parser, file-discovery, context-fetcher
   - Target: 716 → 300 lines (58% reduction)

3. Refactor implement.md
   - Use flag-parser, file-discovery, git-operations
   - Target: 1330 → 500 lines (62% reduction)

4. Refactor publish.md
   - Use flag-parser, file-discovery, git-operations
   - Target: 1230 → 450 lines (63% reduction)

5. Update all subagents to use display-formatter
   - Standardize output formatting
   - Remove custom formatting logic

**Deliverables**:
- All 5 commands refactored
- Consistent behavior across commands
- ~60% overall line reduction

**Testing**:
- Full integration tests for each command
- Test all flag combinations
- Test error cases
- Compare outputs before/after (should be identical)

---

### Phase 4: Documentation (Week 7)
**Goal**: Create comprehensive, centralized documentation

**Tasks**:
1. Create documentation structure
   - `docs/getting-started.md`
   - `docs/architecture.md`
   - `docs/command-reference.md`
   - `docs/flag-reference.md`
   - `docs/error-guide.md`
   - `docs/extending.md`

2. Create examples directory
   - Example outputs for each command
   - Example workflows (end-to-end)

3. Update README.md
   - Link to new docs
   - Simplified overview
   - Quick start guide

4. Update CLAUDE.md
   - Reference new architecture
   - Document shared modules
   - Update plugin structure

**Deliverables**:
- Complete documentation set
- Example outputs
- Updated README and CLAUDE.md

---

### Phase 5: Polish & Testing (Week 8)
**Goal**: Final quality pass, comprehensive testing

**Tasks**:
1. Simplify display formatting across all commands
   - Implement guidelines from Section 3.3
   - Reduce emoji usage by 70%
   - Reduce boxes by 80%

2. Comprehensive integration testing
   - Test complete workflows (analyze → plan → implement → commit → publish)
   - Test with real Jira issues
   - Test with real GitHub PRs
   - Test error scenarios

3. Performance optimization
   - Measure execution time for each command
   - Identify bottlenecks
   - Optimize slow operations

4. Create migration guide
   - Document breaking changes
   - Provide upgrade path
   - Note deprecated patterns

**Deliverables**:
- Polished, consistent UX
- Comprehensive test suite
- Performance benchmarks
- Migration guide

---

## 5. Expected Impact

### Quantitative Improvements

**Code Reduction**:
```
Before:
- Commands: 4,950 lines (avg 990 lines)
- Subagents: 3,200 lines (avg 533 lines)
- Skills: 1,750 lines (avg 583 lines)
- Total: 9,900 lines

After:
- Commands: 2,000 lines (avg 400 lines) - 60% reduction
- Subagents: 4,500 lines (avg 450 lines) - includes 5 new shared modules
- Skills: 900 lines (avg 300 lines) - 49% reduction
- Total: 7,400 lines - 25% overall reduction

Net: +5 new shared modules, -2,500 lines, -25% duplication
```

**Duplication Reduction**:
```
Before: ~40% duplication (input parsing, git ops, display formatting)
After: <5% duplication (only command-specific logic)
Improvement: 88% reduction in duplicated code
```

**Maintainability**:
```
Before: Update requires changes in 5 files (all commands)
After: Update requires change in 1 file (shared subagent)
Improvement: 5x easier to maintain
```

---

### Qualitative Improvements

**For Users**:
- ✅ Consistent flag names across all commands
- ✅ Predictable behavior (no surprising skips or heuristics)
- ✅ Cleaner, more readable output
- ✅ Faster execution (less formatting overhead)
- ✅ Better documentation (centralized, comprehensive)

**For Maintainers**:
- ✅ Easier to add new commands (copy pattern, use shared modules)
- ✅ Easier to fix bugs (fix once in shared module)
- ✅ Easier to understand (shorter files, clear separation)
- ✅ Easier to test (test shared modules independently)

**For Architecture**:
- ✅ Cleaner three-tier pattern (more consistent)
- ✅ Better separation of concerns (orchestration vs execution)
- ✅ More extensible (easy to add new integrations)
- ✅ More robust (shared modules are battle-tested)

---

## 6. Risks & Mitigations

### Risk 1: Breaking Changes
**Risk**: Refactoring may break existing workflows

**Mitigation**:
- Comprehensive testing at each phase
- Keep old commands during migration (deprecate, don't remove)
- Create migration guide with examples
- Test with real Jira/GitHub data

### Risk 2: Scope Creep
**Risk**: Improvements may expand beyond original plan

**Mitigation**:
- Strict adherence to 8-week roadmap
- Prioritize Phase 1-2 (foundation + shared modules)
- Phase 3-5 can be deferred if needed
- Focus on high-impact, low-risk changes first

### Risk 3: Subagent Overhead
**Risk**: More subagents may slow execution

**Mitigation**:
- Measure execution time before/after
- Optimize hot paths (git operations, file discovery)
- Consider caching for expensive operations
- Context isolation already proves subagents are fast

### Risk 4: User Confusion
**Risk**: Changes to flags/behavior may confuse existing users

**Mitigation**:
- Provide migration guide
- Deprecation warnings for old patterns
- Comprehensive documentation with examples
- Gradual rollout (tag releases, allow testing)

---

## 7. Success Criteria

### Must Have (Phase 1-2)
- ✅ Fixed critical issues (#2, #6, #7)
- ✅ 5 shared subagents created and tested
- ✅ At least 1 command refactored (pilot)
- ✅ Standardized flag naming documented

### Should Have (Phase 3-4)
- ✅ All 5 commands refactored
- ✅ 60% line reduction in commands
- ✅ <5% code duplication
- ✅ Comprehensive documentation

### Nice to Have (Phase 5)
- ✅ Simplified display formatting
- ✅ Performance optimization
- ✅ Example outputs
- ✅ Migration guide

### Metrics
- **Code Quality**: <5% duplication, avg 400 lines per command
- **Test Coverage**: >90% for shared modules
- **Performance**: <10% regression in execution time
- **User Satisfaction**: Zero breaking changes for documented patterns

---

## 8. Conclusion

Your Claude workflow has **excellent architectural foundations** with the three-tier pattern and context isolation. The proposed improvements focus on:

1. **Reducing complexity** - From 40% duplication to <5%
2. **Improving maintainability** - Shared modules, shorter commands
3. **Enhancing UX** - Consistent flags, cleaner output, better docs
4. **Fixing critical issues** - Subagent invocations, template issues

**Priority Order**:
1. 🔴 **Critical** (Week 1-2): Fix subagent invocations, spec templates, context fetching
2. 🟡 **High Impact** (Week 3-4): Create shared modules, pilot refactor
3. 🟢 **Nice to Have** (Week 5-8): Refactor all commands, polish, documentation

**Next Steps**:
1. Review this analysis
2. Approve Phase 1-2 tasks
3. Create implementation branch
4. Start with subagent invocation fixes (quick win)
5. Test thoroughly before proceeding to Phase 2

The end result will be a **simpler, more maintainable, and more powerful** workflow system that's easier to extend and debug.

---

**Questions?** Let me know if you'd like me to:
- Implement Phase 1 fixes immediately
- Create detailed specs for shared subagents
- Prototype the refactored command structure
- Anything else!
