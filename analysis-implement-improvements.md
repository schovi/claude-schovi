---
title: "Implementation Improvements for /schovi:implement Command"
created_date: 2025-01-05
problem_type: enhancement
jira_id: N/A
severity: high
status: SPECIFICATION
---

# 🚀 Specification: /schovi:implement Command Improvements

## Executive Summary

This specification addresses 11 identified improvement areas for the `/schovi:implement` command based on comprehensive code review. The improvements range from critical fixes (confetti, publish integration) to architectural enhancements (subagent execution, checkpoint/resume system).

**Priority Breakdown**:
- 🔴 **Critical (3)**: Immediate fixes needed for v1.4.0
- 🟠 **High (5)**: Important quality improvements for v1.4.0
- 🟢 **Future (3)**: Architectural enhancements for v2.0

---

## 📊 Problem Analysis

### Current State

The `/schovi:implement` command (schovi/commands/implement.md) provides autonomous task execution with:
- ✅ Spec parsing and task extraction
- ✅ Phase-by-phase execution
- ✅ Validation (linting, tests, type checking)
- ✅ Git commit creation
- ✅ Quality gates and acceptance criteria verification

### Issues Identified

#### 🔴 Critical Issues

**1. Missing /schovi:publish Integration Reference** (implement.md:830-869)
- **Current**: Says "PR automation coming in v1.4.0"
- **Problem**: `/schovi:publish` already exists but not mentioned
- **Impact**: Users don't know how to complete workflow after implementation

**2. Confetti Not Executed** (implement.md:974-982)
- **Current**: Shows confetti command but doesn't execute it
- **Problem**: Inconsistent with other commands and CLAUDE.md requirements
- **Impact**: No completion signal for user

**3. Commit Strategy Needs Clarification** (implement.md:469-515)
- **Current**: Simplified phase-based commits
- **Problem**: No mention of relationship with `/schovi:commit` command
- **User Request**: Add optional `--verbose` flag for full commit features
- **Impact**: Users miss advanced commit capabilities (branch validation, conventional commits)

#### 🟠 High Priority Issues

**4. Fragile Spec Parsing** (implement.md:215-296)
- **Current**: Assumes exact markdown structure (`## Implementation Tasks`)
- **Problem**: Fails on variations (h1 vs h2, "Implementation" vs "Implementation Tasks", no phases)
- **Impact**: Spec parsing fails on valid but different formats

**5. Basic Validation Retry Logic** (implement.md:609-722)
- **Current**: No retry limits, could loop infinitely
- **Problem**: No max attempts, unclear user feedback
- **User Request**: Max 3 attempts with clear status updates
- **Impact**: Command could hang on unfixable issues

**6. Workflow Context Missing** (Documentation)
- **Current**: Examples don't show full workflow integration
- **Problem**: No guidance on analyze → plan → implement → publish flow
- **Impact**: Users don't understand command sequencing

**7. Input Validation Needs Improvement** (implement.md:59-63)
- **Current**: Generic error messages for flag conflicts
- **Problem**: Unclear what error user sees
- **Impact**: Poor error handling UX

**8. No Progress Visibility** (implement.md:412-466)
- **Current**: Silent during long task execution (>30s)
- **Problem**: Users think command is frozen
- **Impact**: Poor UX for long-running tasks

#### 🟢 Future Enhancements

**9. Subagent Architecture for Phase Execution**
- **Current**: All tasks execute in main context
- **User Request**: Specialized subagents (code, test, verify)
- **Impact**: Token optimization for large implementations

**10. Checkpoint/Resume System**
- **Current**: No way to resume failed implementations
- **User Request**: Implement `--resume` flag with state persistence
- **Impact**: Can't recover from failures without re-running

**11. Dry-Run Mode**
- **Current**: No preview before execution
- **User Request**: Add `--dry-run` flag
- **Impact**: Users want to verify before autonomous execution

---

## 💡 Solution Design

### 🔴 Critical Fix 1: Add /schovi:publish Integration

**Location**: implement.md:830-869 (Step 4.2: Suggest Next Steps)

**Current Code**:
```markdown
**Next Steps**:
1. 📝 Review changes: `git diff origin/main`
2. 🔍 Manual testing: Follow testing strategy from spec
3. 🚀 Create PR: [Manual for now - PR automation coming in v1.4.0]
```

**Proposed Change**:
```markdown
**Next Steps**:
1. 📝 Review changes: `git diff origin/main`
2. 🔍 Manual testing: Follow testing strategy from spec
3. 🚀 Create PR: Use `/schovi:publish` to create GitHub pull request
   - Automatically pushes branch
   - Generates PR description from spec
   - Creates as draft by default (use `--ready` for ready PR)
   - Run: `/schovi:publish` (auto-detects Jira from branch) or `/schovi:publish EC-1234`
4. 👥 Code review: Request review from team after PR creation
5. ✅ Merge: Address feedback and merge when approved
```

**Rationale**:
- User explicitly stated: "I dont want it to automatically publish now. Just commit. Just let customer know about /schovi:publish as next step"
- This maintains autonomy for commits but gives clear guidance for PR creation
- No automatic execution, just documentation

**Effort**: 5 minutes (documentation only)

---

### 🔴 Critical Fix 2: Execute Confetti on Completion

**Location**: implement.md:974-982 (Step 4.4: Completion Signal)

**Current Code**:
```markdown
### Step 4.4: Completion Signal

Run confetti command as per CLAUDE.md:
```bash
open "raycast://extensions/raycast/raycast/confetti"
```
```

**Proposed Change**:
```markdown
### Step 4.4: Confetti & Completion Signal

Execute confetti command (per CLAUDE.md workflow requirements):

```bash
open "raycast://extensions/raycast/raycast/confetti"
```

**Error Handling**:
- Command may fail on non-macOS systems
- Command may fail if Raycast not installed
- These failures are non-critical - continue to display final message

**Implementation**:
```bash
# Execute confetti with error suppression
open "raycast://extensions/raycast/raycast/confetti" 2>/dev/null || true
```

Display final message:
```markdown
╭─────────────────────────────────────────────╮
│ 🎊 Implementation workflow complete!        │
╰─────────────────────────────────────────────╯

🎉 Great work! Your implementation is ready for review.
```
```

**Rationale**:
- User explicitly stated: "Confetti are must have!"
- Must actually execute the command, not just show it
- Consistent with `/schovi:publish` command behavior
- Graceful handling for non-macOS environments

**Effort**: 5 minutes

---

### 🔴 Critical Fix 3: Commit Strategy Unification

**Problem**: User wants optional `--verbose` flag for commits while keeping simplified commits as default.

**User's Feedback**:
> "Propose some commit unification. We have a command /schovi:commit which describes a structure. A simplified commits are primary way to go. But when you are talking about it we should support optional --verbose for commits so please consider it."

#### Proposed Solution: Two-Tier Commit System

**Default Behavior** (Simplified Commits):
```markdown
Phase 1: Backend Service

- Implement FeatureUpdateService in services/feature-update.ts
- Add Kafka topic feature-updates to kafka config
- Create database migration for feature_events table

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**With --verbose Flag** (Full /schovi:commit Features):
```markdown
feat: Implement backend service for feature updates

Implements FeatureUpdateService to handle real-time feature update events
via Kafka messaging system. Adds database migration for feature event
tracking and integrates with existing feature controller.

- Create FeatureUpdateService class with event publishing methods
- Configure Kafka topic 'feature-updates' with appropriate partitions
- Add database migration 003_feature_events.sql with indexes
- Update FeatureController to emit events on feature changes

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Implementation Design

**Option A: Shared Logic with Delegation** (Recommended)

Extract commit logic into shared internal functions that both commands use:

**Structure**:
```
schovi/
├── commands/
│   ├── implement.md          # Uses commit logic
│   └── commit.md              # Defines commit logic
├── lib/                       # NEW: Shared logic (future)
│   └── commit-logic.md        # Reusable commit components
```

**Current Implementation** (v1.4.0 - No new files):

In `implement.md`, add commit mode selection:

```markdown
### Step 2.3: Phase Completion - Git Commit

**Commit Mode Selection**:

1. **Check for --verbose flag**:
   - If `--verbose` provided: Use enhanced commit mode
   - If NOT provided: Use simplified commit mode (default)

2. **Simplified Mode** (Default - Phase-based commits):

   **Purpose**: Fast, autonomous phase grouping

   **Format**:
   ```
   Phase N: [Phase Name from Spec]

   - Task 1 description
   - Task 2 description

   Related to: [JIRA-ID]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

   **Process**:
   ```bash
   git add .
   git commit -m "$(cat <<'EOF'
   Phase 1: Backend Service

   - Task descriptions...

   Related to: EC-1234

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

3. **Enhanced Mode** (--verbose - Full commit command features):

   **Purpose**: Conventional commits with smart analysis

   **Additional Features**:
   - Conventional commit type detection (feat/fix/chore/refactor)
   - Branch validation (blocks main/master)
   - Smart diff analysis for commit type
   - Longer, more descriptive commit messages
   - Phase context in description paragraph

   **Format**:
   ```
   <TYPE>: [Title based on phase and changes]

   [Description paragraph explaining phase context and changes]

   - Detailed change 1
   - Detailed change 2

   Related to: [JIRA-ID]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

   **Process**:
   - Stage changes: `git add .`
   - Analyze diff: `git diff --cached`
   - Determine commit type: feat/fix/chore/refactor based on:
     * Files changed (new files = feat, fixes = fix)
     * Phase context (Testing phase might be test type)
     * Change patterns in diff
   - Generate enhanced message:
     * Title: `<type>: <phase-focused-description>`
     * Description: Explain phase goals and approach
     * Bullets: Technical details from diff analysis
   - Execute commit with full validation

   **Example**:
   ```bash
   # Phase 1: Backend Service with --verbose
   git commit -m "$(cat <<'EOF'
   feat: Implement backend service for feature updates

   Implements Phase 1 (Backend Service) from specification EC-1234.
   Creates FeatureUpdateService to handle real-time feature update
   events via Kafka messaging system. Adds database migration for
   feature event tracking.

   - Create FeatureUpdateService class with event publishing
   - Configure Kafka topic 'feature-updates' with partitions
   - Add database migration 003_feature_events.sql with indexes
   - Set up service interfaces and dependency injection

   Related to: EC-1234

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

**Comparison Table**:

| Feature | Simplified (Default) | Enhanced (--verbose) |
|---------|---------------------|---------------------|
| Commit Format | Phase-based | Conventional |
| Type Detection | None (implicit) | Smart (feat/fix/chore) |
| Title | "Phase N: Name" | "<type>: Description" |
| Description | Task list only | Context + task details |
| Diff Analysis | None | Full analysis |
| Branch Validation | None | Yes (blocks main/master) |
| Execution Speed | Fast | Slower (analysis overhead) |
| Message Length | Short (~5 lines) | Longer (~10-15 lines) |

**When to Use Each**:
- **Simplified**: Default for most implementations, fast autonomous execution
- **Enhanced**: When creating reference commits, PR-ready work, or audit trail needs

**Flag Addition**:
Update argument hint in frontmatter:
```yaml
argument-hint: [spec-file|jira-id] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--resume] [--verbose]
```
```

**Rationale**:
- User wants simplified as "primary way" → Default behavior unchanged
- User wants `--verbose` option → Adds enhanced mode when needed
- No automatic invocation of `/schovi:commit` command (too complex for autonomous flow)
- Instead, implements similar logic inline with phase context
- Clear documentation of differences helps users choose

**Effort**:
- Documentation: 30 minutes
- Implementation logic: 1-2 hours (conditional execution paths)

---

### 🟠 High Priority Fix 4: Robust Spec Parsing

**Location**: implement.md:215-296 (Step 1.2: Parse Spec Structure)

**Current Issues**:
- Assumes exact `## Implementation Tasks` (h2)
- Fails if user writes `# Implementation Tasks` (h1)
- Fails if user writes `## Implementation` (shortened)
- No graceful degradation for missing phases

**Proposed Change**:

```markdown
### Step 1.2: Parse Spec Structure

Once spec is loaded, extract key sections with flexible pattern matching.

#### 1. Extract Metadata (YAML Frontmatter)

**Parsing Logic**:
- Look for YAML block between `---` delimiters at start of file
- Extract: jira_id, title, approach_selected, created_date
- If missing: WARN but continue (use defaults)

**Error Handling**:
```markdown
⚠️ **Spec Metadata Missing**

No YAML frontmatter found in spec. Using defaults:
- Jira ID: Not specified
- Title: Extracted from first heading
- Status: UNKNOWN

Continue with limited metadata? [Yes]
```

#### 2. Extract Implementation Tasks (Flexible Parsing)

**Pattern Matching** (try in order, use first match):

1. **Exact match** (preferred): `## Implementation Tasks`
2. **Shortened variant**: `## Implementation`
3. **H1 variant**: `# Implementation Tasks`
4. **H1 shortened**: `# Implementation`
5. **Plural variant**: `## Implementation Task` (singular)

**Task Structure Detection**:

**WITH Phases** (preferred):
```markdown
### Phase 1: Name
- [ ] Task 1
- [ ] Task 2

### Phase 2: Name
- [ ] Task 3
```

**WITHOUT Phases** (flat structure):
```markdown
## Implementation Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

If no phase headers found, treat as single phase:
```json
{
  "phases": [
    {
      "number": 1,
      "name": "Implementation",
      "tasks": ["all tasks from flat list"]
    }
  ]
}
```

**Parsing Logic**:
```
1. Search for section header (try patterns above)
2. If FOUND:
   a. Check for phase headers (### Phase N:)
   b. If phase headers exist:
      - Parse each phase with tasks
   c. If NO phase headers:
      - Treat all tasks as single phase
      - Phase name = "Implementation"
3. If NOT FOUND:
   - Display error
   - List sections that WERE found
   - Suggest template reference
```

**Error Display** (if no tasks section found):
```markdown
❌ **Spec Structure Invalid**

Could not find "Implementation Tasks" section in spec.

**What I found**:
- ## Problem Summary ✓
- ## Current State Analysis ✓
- ## Decision & Rationale ✓
- ## Technical Overview ✓
- ## Acceptance Criteria ✓
- ## Testing Strategy ✓
- ❌ Missing: Implementation Tasks section

**Expected Format**:
```markdown
## Implementation Tasks

### Phase 1: Phase Name
- [ ] Task description
- [ ] Task description

### Phase 2: Phase Name
- [ ] Task description
```

**Suggestion**:
- Ensure spec follows template from `/schovi/templates/spec-template.md`
- Or ensure section is named "## Implementation Tasks"
- Check for typos in section headers

Cannot proceed without implementation tasks.
```

**Validation After Parsing**:
```
Check that parsing succeeded:
- [ ] At least 1 phase found
- [ ] At least 1 task found in total
- [ ] Task descriptions are non-empty

If validation fails:
- Display what WAS parsed (show structure)
- Ask user if this looks correct
- Offer to continue with available data or cancel
```

#### 3. Extract Acceptance Criteria (Flexible)

**Pattern Matching**:
1. `## Acceptance Criteria` (preferred)
2. `## Acceptance Criterion` (singular)
3. `# Acceptance Criteria` (h1)
4. `## Success Criteria` (alternative)

If not found: WARN but continue
```markdown
⚠️ **Acceptance Criteria Missing**

No "Acceptance Criteria" section found in spec.

**Impact**: Cannot verify automatic acceptance criteria after implementation.

Continue without acceptance criteria? [Yes]
```

#### 4. Extract Testing Strategy (Flexible)

**Pattern Matching**:
1. `## Testing Strategy` (preferred)
2. `## Testing` (shortened)
3. `# Testing Strategy` (h1)
4. `## Test Plan` (alternative)

If not found: WARN but continue
```markdown
⚠️ **Testing Strategy Missing**

No "Testing Strategy" section found in spec.

**Impact**: No test guidance for implementation.

Continue without testing strategy? [Yes]
```

**Summary of Flexible Parsing**:
```markdown
✅ **Spec Parsing Complete**

**Found Sections**:
- YAML Metadata: ✅ Jira ID: EC-1234
- Implementation Tasks: ✅ 3 phases, 9 tasks
- Acceptance Criteria: ✅ 6 criteria
- Testing Strategy: ✅ Unit + Integration tests

**Parsing Warnings**: None

Proceeding to project type detection...
```

or with warnings:
```markdown
✅ **Spec Parsing Complete (with warnings)**

**Found Sections**:
- YAML Metadata: ⚠️  Missing (using defaults)
- Implementation Tasks: ✅ 1 phase, 5 tasks (no phase structure, using flat list)
- Acceptance Criteria: ❌ Not found
- Testing Strategy: ⚠️  Partial (found "Testing" section)

**Warnings**:
1. No YAML frontmatter - Jira ID unknown
2. No phase structure - Using single phase
3. No acceptance criteria - Skipping verification

Continue with limited spec data? [Yes]
```
```

**Rationale**:
- Real-world specs vary in format
- Users might use different heading levels
- Graceful degradation better than hard failure
- Clear error messages guide users to fix issues

**Effort**: 30-45 minutes (enhanced parsing logic)

---

### 🟠 High Priority Fix 5: Validation Retry with Max 3 Attempts

**Location**: implement.md:609-722 (Step 3.2-3.4: Validation)

**User Request**: "Add max 3 attempts policy with good output to user about what is going on."

**Proposed Change**:

```markdown
### Step 3.2: Run Linting (with Retry Logic)

Based on detected project type, run linter with max 3 attempts.

**Attempt Tracking**:
```
max_attempts = 3
current_attempt = 1
```

**Node.js/TypeScript**:
```bash
npm run lint 2>&1
```
or fallback:
```bash
npx eslint . 2>&1
```

#### Retry Logic with Status Updates

**Attempt 1: Initial Linting**

Display:
```markdown
🔍 **Linting: Attempt 1/3**

Running: npm run lint
```

**If SUCCESS**:
```markdown
✅ **Linting Passed** (Attempt 1/3)

No linting issues found. Moving to type checking...
```

**If FAILURE**:
```markdown
❌ **Linting Failed** (Attempt 1/3)

Found 5 issues:
  - src/services/feature.ts:45 - Unused variable 'result'
  - src/controllers/api.ts:67 - Missing semicolon
  - src/config/kafka.ts:12 - Prefer const over let

**Action**: Attempting auto-fix...
```

---

**Attempt 2: Auto-Fix**

Display:
```markdown
🔧 **Linting: Attempt 2/3 (Auto-Fix)**

Running: npm run lint -- --fix
```

**If SUCCESS**:
```markdown
✅ **Auto-Fix Successful** (Attempt 2/3)

Fixed 3/5 issues automatically.

**Remaining Issues**: 2 (require manual fix)
  - src/services/feature.ts:45 - Unused variable 'result'
  - src/controllers/api.ts:120 - Complexity exceeds threshold

**Action**: Attempting manual fixes...
```

**If STILL FAILING**:
```markdown
⚠️ **Auto-Fix Partial** (Attempt 2/3)

Auto-fix applied but issues remain: 5 issues

**Action**: Attempting manual fixes...
```

---

**Attempt 3: Manual Fix**

Display:
```markdown
🛠️ **Linting: Attempt 3/3 (Manual Fix)**

Analyzing failures and applying targeted fixes...

**Fixing**:
1. Reading src/services/feature.ts...
2. Removing unused variable 'result' at line 45...
3. Reading src/controllers/api.ts...
4. Simplifying complex function at line 120...

Running linter again: npm run lint
```

**If SUCCESS**:
```markdown
✅ **Manual Fixes Successful** (Attempt 3/3)

All linting issues resolved.

**Changes Made**:
- Removed unused variable in feature.ts:45
- Refactored complex function in api.ts:120

Creating fix commit...
```

Execute:
```bash
git add .
git commit -m "fix: Address linting issues from validation

- Remove unused variable in FeatureService
- Simplify complex function in ApiController

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**If STILL FAILING**:
```markdown
❌ **Max Attempts Reached** (3/3)

Unable to resolve all linting issues after 3 attempts.

**Remaining Issues**: 2 issues
  - src/services/feature.ts:45 - Unused variable 'result'
  - src/controllers/api.ts:120 - Complexity exceeds threshold

**Attempts Summary**:
1. Initial run: 5 issues detected
2. Auto-fix: 3 issues fixed, 2 remain
3. Manual fix: Attempted but unable to resolve

**Next Steps**:
1. **Option A**: Fix manually and re-run validation
   ```bash
   # Fix the issues
   npm run lint
   git add .
   git commit -m "fix: Address remaining linting issues"
   ```

2. **Option B**: Continue without full linting compliance
   - Mark validation as incomplete
   - Document issues in completion summary
   - Address during code review

**Decision**: Continuing with incomplete validation (full autonomy mode)

Marking linting as ⚠️ INCOMPLETE and documenting issues...
```

---

#### Validation Summary with Retry Status

```markdown
╭─────────────────────────────────────────────╮
│ ⚠️  VALIDATION INCOMPLETE                   │
╰─────────────────────────────────────────────╯

**Linting**: ⚠️ Incomplete (3/3 attempts, 2 issues remain)
**Type Check**: ✅ Passed
**Tests**: ✅ Passed (24/24)

**Linting Details**:
- Attempt 1: 5 issues detected
- Attempt 2: Auto-fix resolved 3 issues
- Attempt 3: Manual fix attempted, 2 issues remain

**Remaining Lint Issues**:
  - src/services/feature.ts:45 - Unused variable 'result'
  - src/controllers/api.ts:120 - Complexity exceeds threshold

**Recommendation**:
- Address remaining lint issues manually
- Re-run validation before creating PR
- Or accept incomplete linting for code review discussion

Proceeding to completion summary...
```

**Max Retry Policy**: Apply same pattern to:
- Type checking (3 attempts)
- Test execution (3 attempts)

**General Pattern**:
```
Attempt 1: Run check (initial)
  → Success: Mark passed, move on
  → Failure: Proceed to Attempt 2

Attempt 2: Auto-fix (if available)
  → Success: Mark passed, move on
  → Failure: Proceed to Attempt 3

Attempt 3: Manual fix (targeted)
  → Success: Mark passed, move on
  → Failure: Mark incomplete, document issues, continue

Max Attempts Reached:
  → Document failures in completion summary
  → Mark validation as incomplete
  → Provide user guidance for manual resolution
  → DO NOT block completion (full autonomy mode)
```
```

**Rationale**:
- User explicitly requested "max 3 attempts"
- Clear status updates at each attempt
- Users know what's happening and why
- Prevents infinite loops on unfixable issues
- Full autonomy maintained (doesn't block on failures)

**Effort**: 45 minutes (retry logic + status display)

---

### 🟠 High Priority Fix 6: Better Input Validation

**Location**: implement.md:59-63 (Flag Validation)

**Current**:
```markdown
**Flag Validation**:
- `--output` and `--no-file` cannot be used together → Error
```

**Proposed Change**:

```markdown
**Flag Validation**:

Check for invalid flag combinations and provide clear error messages.

**Conflict 1: --output and --no-file**
```bash
/schovi:implement ./spec.md --output log.txt --no-file
```

Error Display:
```markdown
❌ **Flag Conflict: --output and --no-file**

You cannot use both flags together:
- `--output log.txt` requests file output to specific path
- `--no-file` requests no file output

**Choose one**:
1. Use `--output log.txt` to save execution log
2. Use `--no-file` for terminal output only
3. Use neither for default behavior (terminal + default log file)

Command cancelled.
```

**Conflict 2: --quiet and --no-file (both true)**
```bash
/schovi:implement ./spec.md --quiet --no-file
```

Warning Display:
```markdown
⚠️ **Ineffective Flags: --quiet and --no-file**

Both flags are set:
- `--quiet` suppresses terminal output
- `--no-file` skips file output

**Result**: You will see almost no output (only critical errors).

**Suggestion**:
- Remove `--quiet` to see terminal output
- Remove `--no-file` to save output to log file

Continue with no output? [yes/no]
```

**Conflict 3: --post-to-jira without Jira ID**
```bash
/schovi:implement ./spec.md --post-to-jira
```

Warning Display:
```markdown
⚠️ **--post-to-jira Flag Warning**

Flag `--post-to-jira` was provided but no Jira issue ID detected:
- Not in spec filename
- Not in spec YAML frontmatter
- Not in command argument

**Impact**: Jira posting will be skipped during completion.

**Suggestion**: Provide Jira ID:
- In command: `/schovi:implement EC-1234 --post-to-jira`
- Or ensure spec has Jira ID in YAML frontmatter

Continue without Jira posting? [yes/no]
```

**Conflict 4: --resume without checkpoint**
```bash
/schovi:implement --resume
```

Error Display:
```markdown
❌ **--resume Flag Error**

No checkpoint file found to resume from.

**Checked**: ./.implement-checkpoint.json

**Possible Causes**:
1. No previous implementation run in this directory
2. Checkpoint file was deleted
3. Implementation completed successfully (checkpoint cleared)

**Options**:
1. Start new implementation: `/schovi:implement <spec-file>`
2. Check different directory: `cd <path> && /schovi:implement --resume`
3. Review implementation status: `git log` to see commits

Command cancelled.
```

**Unknown Flag Warning**:
```bash
/schovi:implement ./spec.md --unknown-flag
```

Warning Display:
```markdown
⚠️ **Unknown Flag: --unknown-flag**

Flag `--unknown-flag` is not recognized.

**Valid flags**:
- --input PATH      Read spec from file
- --output PATH     Save log to file
- --no-file         Skip log file
- --quiet           Suppress terminal output
- --post-to-jira    Post to Jira issue
- --resume          Resume from checkpoint
- --verbose         Use enhanced commit mode
- --dry-run         Preview execution plan

**Action**: Ignoring unknown flag and continuing...

Proceeding with implementation...
```
```

**Rationale**:
- Clear, actionable error messages
- Explains WHY the conflict exists
- Provides SOLUTIONS for user
- Distinguishes errors (block) from warnings (continue)

**Effort**: 20 minutes

---

### 🟠 High Priority Fix 7: Progress Visibility for Long Tasks

**Location**: implement.md:412-466 (Step 2.2: Execute Task)

**User Request**: "Progress sounds good!"

**Proposed Change**:

```markdown
### Step 2.2: Execute Each Task in Phase (with Progress Updates)

For each task in the phase:

**Display Task Start**:
```
⏳ Task 1/3: Implement FeatureUpdateService in services/feature-update.ts
🕐 Started: 14:23:45
```

**Execute Implementation** (with periodic updates):

**Progress Update Strategy**:
- For tasks expected to take >30 seconds
- Show progress every 15-20 seconds
- Indicate what's happening

**Implementation with Progress**:

```markdown
**Task Execution Timeline**:

00:00 - Start task
15s - Progress update 1 (if still running)
30s - Progress update 2 (if still running)
45s - Progress update 3 (if still running)
...
Done - Completion status
```

**Example Long Task Execution**:

```markdown
⏳ Task 2/3: Create database migration for feature_events table

**00:00** - 🔍 Analyzing existing schema...
**00:15** - 📊 Still working on schema analysis (reading 3 migration files...)
**00:30** - 📝 Generating migration SQL...
**00:45** - 🔧 Still generating migration (complex index creation...)
**01:00** - ✅ Migration file created: migrations/003_feature_events.sql

✅ Task 2/3 complete (Duration: 1m 2s)
```

**Implementation Pattern**:

```markdown
**Before starting task**:
1. Analyze task description
2. Estimate complexity:
   - Simple: <5s (file edit, simple creation)
   - Moderate: 5-30s (new file with logic, multiple edits)
   - Complex: >30s (migrations, complex logic, multiple files)

**During task execution**:
IF complexity = "complex":
  - Start async timer (15s intervals)
  - Show progress updates with current activity
  - Example activities:
    * "Reading existing files..."
    * "Analyzing dependencies..."
    * "Generating code..."
    * "Writing changes..."
    * "Verifying syntax..."

**Progress Update Format**:
```
⏰ Still working on task (Xs elapsed): [current activity]
```

**Example Activities by Task Type**:

**New File Creation**:
```
⏳ Task: Create FeatureUpdateService in services/feature-update.ts

00:00 - 📝 Creating new file structure...
00:15 - 📊 Still working: Analyzing spec requirements...
00:30 - 🔧 Still working: Implementing service methods...
00:45 - 🔧 Still working: Adding error handling and logging...
01:00 - ✅ Complete: FeatureUpdateService created with 5 methods
```

**File Editing**:
```
⏳ Task: Update MappingController to handle new validation

00:00 - 📖 Reading MappingController.ts...
00:15 - 📊 Still working: Locating insertion point...
00:30 - ✏️  Still working: Applying changes to controller...
00:45 - ✅ Complete: MappingController updated with validation
```

**Migration/Schema Changes**:
```
⏳ Task: Create database migration for boolean rejection

00:00 - 🔍 Analyzing current schema...
00:15 - 📊 Still working: Reading existing migrations...
00:30 - 📝 Still working: Generating migration SQL...
00:45 - 📝 Still working: Adding rollback statements...
01:00 - 🧪 Still working: Validating migration syntax...
01:15 - ✅ Complete: Migration 003_remove_boolean_mappings.sql
```

**Test File Creation**:
```
⏳ Task: Write integration tests for feature update flow

00:00 - 📝 Creating test file structure...
00:15 - 🧪 Still working: Writing test scenarios...
00:30 - 🧪 Still working: Adding mock data and fixtures...
00:45 - 🧪 Still working: Implementing test assertions...
01:00 - ✅ Complete: 8 test scenarios added to feature-update.test.ts
```

**Fast Task** (no progress updates needed):
```
⏳ Task 3/3: Add error constant to errorMessages.ts
✅ Task 3/3 complete (Duration: 2s): Added BOOLEAN_NOT_MAPPABLE constant
```

**Error with Progress Context**:
```
⏳ Task: Integrate Kafka consumer in feature-consumer.ts

00:00 - 📖 Reading kafka configuration...
00:15 - 📊 Still working: Analyzing consumer patterns...
00:30 - 📝 Still working: Implementing consumer logic...
00:45 - ❌ Error: Cannot find Kafka config file (kafka.config.ts)

**Task Failed** (Duration: 48s)
**Error**: Missing dependency - kafka.config.ts not found

**Action**: Marking task as blocked, documenting in summary
```

**Implementation Notes**:
- Use timestamp-based updates (not message count)
- Activity descriptions should be specific to task type
- Duration tracking helps user gauge progress
- Errors should show what was accomplished before failure
```

**Rationale**:
- User thinks command is frozen during long tasks
- Periodic updates show command is working
- Activity descriptions provide context
- Duration helps set expectations

**Effort**: 45 minutes (timer logic + activity tracking)

---

### 🟢 Future Enhancement 9: Subagent Architecture for Phase Execution

**User Request**:
> "I like it and it makes absolute sense. Propose me how to do it? I can imagine we will have sub agents for "code" implementation, "test" implementation, then some "verify" to check it? WDYT? Also propose your solution on this."

#### Problem Analysis

**Current Architecture**:
```
Main Context (implement command)
  → Parse spec (~500 tokens)
  → Execute Phase 1 tasks (accumulate context ~2-5k tokens)
  → Execute Phase 2 tasks (accumulate more context ~3-7k tokens)
  → Execute Phase 3 tasks (accumulate more context ~4-10k tokens)
  → Validation (~1-2k tokens)

Total: ~10-25k tokens in main context
```

**Issues**:
- Context bloat for large implementations (9+ tasks)
- Main context includes all task execution details
- Could hit token limits on very large implementations

#### Proposed Subagent Architecture

**Design Philosophy**: Isolate phase execution in subagents while maintaining coordination in main context.

**Architecture**:
```
Main Context (implement command)
  ↓
  Phase 1 → Spawn Code-Executor Subagent
              ↓ (isolated context)
              Execute 3 tasks, accumulate context
              ↓ (compress & return)
              Return: Task results + files changed (~800 tokens)
  ↓
  Phase 2 → Spawn Integration-Executor Subagent
              ↓ (isolated context)
              Execute 3 tasks, accumulate context
              ↓ (compress & return)
              Return: Task results + files changed (~800 tokens)
  ↓
  Phase 3 → Spawn Test-Executor Subagent
              ↓ (isolated context)
              Execute test tasks, accumulate context
              ↓ (compress & return)
              Return: Task results + test file changes (~800 tokens)
  ↓
  Validation → Main Context (or Verify Subagent)
              ↓
              Run linting, tests, type checks
              ↓
              Return: Validation summary

Main Context Total: ~3-5k tokens (compressed results only)
```

**Subagent Specialization**:

1. **Code-Executor Subagent** (`schovi/agents/code-executor/AGENT.md`)
   - **Purpose**: Implement application code (services, controllers, models)
   - **Allowed Tools**: Read, Write, Edit, Glob, Grep, mcp__jetbrains__*
   - **Input**: Phase name, tasks list, spec context (technical overview)
   - **Output**: Task completion summary + files changed (~800 tokens)
   - **Token Budget**: Max 5000 tokens output

2. **Test-Executor Subagent** (`schovi/agents/test-executor/AGENT.md`)
   - **Purpose**: Implement tests (unit, integration, E2E)
   - **Allowed Tools**: Read, Write, Edit, Glob, Grep, Bash (for test execution)
   - **Input**: Phase name, test tasks, spec testing strategy
   - **Output**: Test file creation summary + test run results (~800 tokens)
   - **Token Budget**: Max 5000 tokens output

3. **Verify-Executor Subagent** (`schovi/agents/verify-executor/AGENT.md`)
   - **Purpose**: Run validation checks (linting, type check, tests)
   - **Allowed Tools**: Bash (for running validation commands), Read (for error analysis)
   - **Input**: Project type, validation commands, changed files
   - **Output**: Validation summary with pass/fail + error details (~1000 tokens)
   - **Token Budget**: Max 6000 tokens output

4. **Config-Executor Subagent** (`schovi/agents/config-executor/AGENT.md`)
   - **Purpose**: Configuration changes (build, CI, dependencies, migrations)
   - **Allowed Tools**: Read, Write, Edit, Grep
   - **Input**: Configuration task list, project type
   - **Output**: Config change summary (~600 tokens)
   - **Token Budget**: Max 3000 tokens output

#### Execution Flow with Subagents

**Phase 1: Backend Service** (Code Implementation)

Main Context:
```markdown
╭─────────────────────────────────────────────╮
│ 📦 PHASE 1: Backend Service                 │
╰─────────────────────────────────────────────╯

🛠️ **Spawning Code-Executor Subagent**

**Phase Context**:
- Phase: 1 - Backend Service
- Tasks: 3 tasks
  1. Implement FeatureUpdateService
  2. Add Kafka topic configuration
  3. Create database migration

**Spec Context**:
[Pass relevant technical overview sections]

⏳ Executing phase in isolated context...
```

Code-Executor Subagent (isolated context):
```
[Receives phase context]
[Executes 3 tasks with full autonomy]
[Accumulates 3-5k tokens of execution details]
[Compresses results to essential summary]
[Returns to main context]
```

Subagent Return (~800 tokens):
```markdown
╭─────────────────────────────────────────────╮
│ ✅ CODE-EXECUTOR SUBAGENT                   │
╰─────────────────────────────────────────────╯

**Phase 1: Backend Service** - COMPLETE

**Tasks Completed**: 3/3

1. ✅ Implemented FeatureUpdateService
   - File: services/feature-update.ts
   - Methods: publishUpdate, handleEvent, validatePayload
   - Lines: +156

2. ✅ Added Kafka topic configuration
   - File: config/kafka.ts
   - Topic: feature-updates (3 partitions)
   - Lines: +28

3. ✅ Created database migration
   - File: migrations/003_feature_events.sql
   - Tables: feature_events with indexes
   - Lines: +67

**Summary**:
- Files created: 2
- Files modified: 1
- Total changes: +251 lines

**Files Changed**:
- services/feature-update.ts (new)
- config/kafka.ts (modified)
- migrations/003_feature_events.sql (new)

Ready for git commit.

╭─────────────────────────────────────────────╮
  ✅ Phase complete | ~800 tokens
╰─────────────────────────────────────────────╯
```

Main Context receives compressed summary, creates commit:
```bash
git add services/feature-update.ts config/kafka.ts migrations/003_feature_events.sql
git commit -m "..."
```

**Phase 2: Integration** (Code + Config Implementation)

Main Context:
```markdown
╭─────────────────────────────────────────────╮
│ 📦 PHASE 2: Integration                     │
╰─────────────────────────────────────────────╯

🛠️ **Spawning Code-Executor Subagent**

[Similar flow...]
```

**Phase 3: Testing** (Test Implementation)

Main Context:
```markdown
╭─────────────────────────────────────────────╮
│ 📦 PHASE 3: Testing & Validation            │
╰─────────────────────────────────────────────╯

🛠️ **Spawning Test-Executor Subagent**

**Phase Context**:
- Phase: 3 - Testing & Validation
- Tasks: 3 test tasks
- Testing Strategy: [Pass from spec]

⏳ Executing test phase in isolated context...
```

Test-Executor Subagent Return:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ TEST-EXECUTOR SUBAGENT                   │
╰─────────────────────────────────────────────╯

**Phase 3: Testing & Validation** - COMPLETE

**Test Files Created**: 2

1. ✅ Unit tests: FeatureUpdateService.spec.ts
   - Test cases: 8
   - Coverage: publishUpdate, handleEvent, error handling

2. ✅ Integration tests: feature-update.integration.spec.ts
   - Test cases: 5
   - Coverage: End-to-end Kafka flow

**Test Execution** (optional - within subagent):
- Ran: npm test
- Result: 13/13 passing
- Duration: 2.1s

**Summary**:
- Test files: 2
- Test cases: 13
- All passing: ✅

**Files Changed**:
- tests/feature-update.spec.ts (new)
- tests/feature-update.integration.spec.ts (new)

Ready for git commit.
```

#### Validation with Verify-Executor Subagent

Main Context:
```markdown
╭─────────────────────────────────────────────╮
│ 🔍 VALIDATION PHASE                         │
╰─────────────────────────────────────────────╯

🛠️ **Spawning Verify-Executor Subagent**

**Validation Context**:
- Project type: Node.js/TypeScript
- Changed files: 7 files
- Validation commands:
  * Linting: npm run lint
  * Type check: npm run typecheck
  * Tests: npm test

⏳ Running validation checks in isolated context...
```

Verify-Executor Subagent Return:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ VERIFY-EXECUTOR SUBAGENT                 │
╰─────────────────────────────────────────────╯

**Validation Results**:

**Linting**: ✅ Passed
- Command: npm run lint
- Issues: 0

**Type Check**: ✅ Passed
- Command: npm run typecheck
- Errors: 0

**Tests**: ✅ Passed
- Command: npm test
- Total: 37 tests
- Passing: 37
- Failing: 0
- Duration: 4.3s

**Summary**: All validation checks passed

╭─────────────────────────────────────────────╮
  ✅ Validation complete | ~1000 tokens
╰─────────────────────────────────────────────╯
```

#### When to Use Subagents vs Main Context

**Use Subagents When**:
- Phase has 3+ complex tasks
- Tasks involve substantial code generation
- Implementation expected to generate >2k tokens of details
- Large implementations (9+ total tasks)

**Use Main Context When**:
- Simple implementations (1-2 tasks total)
- Quick fixes or small changes
- User wants to see detailed execution (debugging)

**Configuration**:
```markdown
### Step 0.5: Execution Strategy Selection

**Automatic Detection**:
```
IF total_tasks >= 9 OR any_phase_has >= 4_tasks:
  execution_mode = "subagent"
  Display: "🚀 Using subagent architecture for optimal performance"
ELSE:
  execution_mode = "direct"
  Display: "🚀 Using direct execution mode"
```

**Manual Override**:
- Flag: `--execution-mode subagent|direct`
- Example: `/schovi:implement --execution-mode subagent`
```

#### Subagent Implementation Template

**File**: `schovi/agents/code-executor/AGENT.md`

```markdown
---
name: code-executor
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "mcp__jetbrains__*"]
---

# Code Executor Subagent

You are a specialized subagent for executing code implementation tasks.

## Mission

Execute application code tasks from a specification phase with full autonomy and return compressed summary.

## Input Format

You will receive:
```markdown
## Phase Context
**Phase Number**: 1
**Phase Name**: Backend Service
**Tasks**:
1. Implement FeatureUpdateService in services/feature-update.ts
2. Add Kafka topic configuration to config/kafka.ts
3. Create database migration for feature_events table

## Spec Technical Context
[Relevant technical overview sections]
[Decision rationale]
[File references from spec]
```

## Execution Instructions

### Step 1: Parse Tasks
- Extract file paths from task descriptions
- Identify whether files need to be created or modified
- Note any dependencies between tasks

### Step 2: Execute Tasks Sequentially
For each task:
1. Display task start: `⏳ Task 1/3: [description]`
2. Analyze requirements
3. Create or modify files using appropriate tools:
   - New files: Use Write tool
   - Existing files: Use Edit tool
   - Check existence: Use Glob or Read
4. Display completion: `✅ Task 1/3 complete: [summary]`
5. If error: Document error but continue to next task

### Step 3: Compress Results
Generate summary output (~800 tokens max):
- List completed tasks (checkmarks)
- List files created/modified with line counts
- Brief description of changes per file
- List files ready for git commit

## Output Format

Return this exact format:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ CODE-EXECUTOR SUBAGENT                   │
╰─────────────────────────────────────────────╯

**Phase N: [Phase Name]** - COMPLETE

**Tasks Completed**: X/Y

1. ✅ [Task description]
   - File: [file path]
   - [Key details]
   - Lines: [+additions]

2. ✅ [Task description]
   ...

**Summary**:
- Files created: X
- Files modified: Y
- Total changes: +N lines

**Files Changed**:
- file1.ts (new)
- file2.ts (modified)

Ready for git commit.

╭─────────────────────────────────────────────╮
  ✅ Phase complete | ~800 tokens
╰─────────────────────────────────────────────╯
```

## Constraints

- **Token budget**: Max 5000 tokens output
- **Autonomy**: Full autonomy, no user prompts
- **Error handling**: Continue on errors, document in summary
- **No commits**: Do NOT create git commits (parent handles this)
```

#### Token Savings Comparison

**Current Direct Execution** (9 tasks across 3 phases):
```
Main Context Accumulation:
- Phase 1 execution: ~2-4k tokens
- Phase 2 execution: ~2-4k tokens
- Phase 3 execution: ~2-4k tokens
- Validation: ~1-2k tokens
Total: ~10-20k tokens in main context
```

**With Subagent Architecture**:
```
Main Context:
- Phase 1 subagent return: ~800 tokens
- Phase 2 subagent return: ~800 tokens
- Phase 3 subagent return: ~800 tokens
- Validation subagent return: ~1000 tokens
Total: ~3.4k tokens in main context

Savings: 70-85% token reduction in main context
```

#### Implementation Plan

**Phase 1**: Create subagent infrastructure (v2.0)
1. Create `schovi/agents/code-executor/AGENT.md`
2. Create `schovi/agents/test-executor/AGENT.md`
3. Create `schovi/agents/verify-executor/AGENT.md`
4. Create `schovi/agents/config-executor/AGENT.md`

**Phase 2**: Update implement command
1. Add execution mode detection
2. Add subagent spawning logic for each phase
3. Add result aggregation and commit creation
4. Update documentation with subagent flow

**Phase 3**: Testing and optimization
1. Test with small implementations (verify no regression)
2. Test with large implementations (verify token savings)
3. Optimize subagent compression logic
4. Add performance metrics

**Effort**: 6-8 hours total

**Benefits**:
- 70-85% token reduction in main context
- Better separation of concerns
- Specialized execution logic per phase type
- Scales better for very large implementations
- Main context stays clean for high-level coordination

**Risks**:
- Increased complexity
- Subagent spawning overhead
- Potential context loss if compression too aggressive
- Need good error propagation between contexts

---

### 🟢 Future Enhancement 10: Checkpoint/Resume System

**User Request**:
> "This sounds cool. Propose how it should work!"

#### Problem Analysis

**Current Issues**:
- Long implementations (9+ tasks) take time
- If validation fails after Phase 2, user must re-run entire implementation
- If command interrupted (network, crash), all progress lost
- No way to skip completed phases and resume

#### Proposed Checkpoint System

**Design Philosophy**: Save state after each successful phase to allow resumption.

#### Checkpoint File Structure

**File Location**: `./.implement-checkpoint.json` (in current directory)

**JSON Schema**:
```json
{
  "version": "1.0",
  "spec_source": "./spec-EC-1234.md",
  "spec_checksum": "a3b2c1d4e5f6...",
  "started_at": "2025-01-05T14:23:45Z",
  "last_updated": "2025-01-05T14:35:12Z",
  "execution_mode": "direct",
  "completed_phases": [
    {
      "number": 1,
      "name": "Backend Service",
      "commit_hash": "a3b2c1d",
      "tasks_completed": 3,
      "completed_at": "2025-01-05T14:28:30Z",
      "files_changed": [
        "services/feature-update.ts",
        "config/kafka.ts",
        "migrations/003_feature_events.sql"
      ]
    },
    {
      "number": 2,
      "name": "Integration",
      "commit_hash": "b4c5d2e",
      "tasks_completed": 3,
      "completed_at": "2025-01-05T14:35:12Z",
      "files_changed": [
        "controllers/feature-controller.ts",
        "consumers/feature-consumer.ts",
        "config/dependency-injection.ts"
      ]
    }
  ],
  "current_phase": 3,
  "total_phases": 3,
  "validation_status": "not_started",
  "git_state": {
    "branch": "EC-1234-feature-updates",
    "commits": ["a3b2c1d", "b4c5d2e"],
    "uncommitted_changes": false
  }
}
```

#### Checkpoint Creation Logic

**When to Create Checkpoint**:
```
After successful phase commit:
  1. Extract phase data (number, name, tasks, commit hash)
  2. Create/update checkpoint file
  3. Write JSON to ./.implement-checkpoint.json
  4. Continue to next phase
```

**Checkpoint Creation Code**:
```bash
# After Phase 1 commit
cat > .implement-checkpoint.json <<EOF
{
  "version": "1.0",
  "spec_source": "./spec-EC-1234.md",
  "spec_checksum": "$(sha256sum ./spec-EC-1234.md | cut -d' ' -f1)",
  "started_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "completed_phases": [
    {
      "number": 1,
      "name": "Backend Service",
      "commit_hash": "$(git rev-parse HEAD)",
      "tasks_completed": 3,
      "completed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "files_changed": ["services/feature-update.ts", "config/kafka.ts", "migrations/003_feature_events.sql"]
    }
  ],
  "current_phase": 2,
  "total_phases": 3
}
EOF
```

#### Resume Logic

**Command**: `/schovi:implement --resume`

**Resume Flow**:

```markdown
### Step 1: Detect Resume Flag

If `--resume` flag provided:
  Display:
  ```
  🔄 **Resume Mode Activated**

  Looking for checkpoint file...
  ```

### Step 2: Read Checkpoint File

```bash
# Check if checkpoint exists
if [ ! -f "./.implement-checkpoint.json" ]; then
  echo "❌ No checkpoint file found"
  exit 1
fi

# Read checkpoint
checkpoint=$(cat ./.implement-checkpoint.json)
```

**Display**:
```markdown
✅ **Checkpoint Found**

**Checkpoint Details**:
- Spec: ./spec-EC-1234.md
- Started: 2025-01-05 14:23:45 UTC
- Last updated: 2025-01-05 14:35:12 UTC

**Progress**:
- Completed phases: 2/3
- Current phase: 3 (Testing & Validation)

**Commits Created**:
1. a3b2c1d - Phase 1: Backend Service
2. b4c5d2e - Phase 2: Integration
```

### Step 3: Validate Checkpoint State

**Validation Checks**:
```
1. Verify spec file still exists
   - Check: ./spec-EC-1234.md exists
   - Check: Checksum matches (if different, warn)

2. Verify git state matches
   - Check: Current branch matches checkpoint
   - Check: Commits exist (a3b2c1d, b4c5d2e)
   - Check: No uncommitted changes (clean state)

3. Verify spec hasn't changed
   - Compare checksum
   - If different: WARN user, offer options
```

**Validation Display**:
```markdown
🔍 **Validating Checkpoint**

✅ Spec file exists: ./spec-EC-1234.md
✅ Git branch matches: EC-1234-feature-updates
✅ Commits verified: a3b2c1d, b4c5d2e
✅ Working directory clean: No uncommitted changes
✅ Spec unchanged: Checksum matches

Checkpoint valid. Ready to resume.
```

**If Validation Fails**:

**Scenario 1: Spec file changed**
```markdown
⚠️ **Checkpoint Validation Warning**

**Issue**: Spec file has changed since checkpoint was created

**Checkpoint Checksum**: a3b2c1d4e5f6...
**Current Checksum**: b7c8d9e0f1g2...

**This means**:
- Spec was modified after implementation started
- Tasks or phases may have changed
- Completed work may not match new spec

**Options**:
1. **Continue with old spec** - Use checkpoint from old spec version
2. **Restart with new spec** - Discard checkpoint, start fresh
3. **Manual merge** - Review changes and decide phase-by-phase

Which option? [1-3]
```

**Scenario 2: Git state diverged**
```markdown
❌ **Checkpoint Validation Failed**

**Issue**: Git state doesn't match checkpoint

**Expected Branch**: EC-1234-feature-updates
**Current Branch**: main

**Or**

**Expected Commits**: a3b2c1d, b4c5d2e
**Missing Commits**: b4c5d2e

**This means**:
- Git history was modified (rebase, reset, branch change)
- Checkpoint no longer valid for current state

**Resolution**:
1. Switch to correct branch: `git checkout EC-1234-feature-updates`
2. Verify commits exist: `git log --oneline`
3. Re-run resume: `/schovi:implement --resume`

Or start fresh: `/schovi:implement ./spec-EC-1234.md`
```

### Step 4: Resume from Current Phase

**Display Resume Summary**:
```markdown
╭─────────────────────────────────────────────╮
│ 🔄 RESUMING IMPLEMENTATION                  │
╰─────────────────────────────────────────────╯

**Spec**: EC-1234 - Feature description
**Resume Point**: Phase 3 of 3

**Already Completed** ✅:
- Phase 1: Backend Service (3 tasks) - Commit a3b2c1d
- Phase 2: Integration (3 tasks) - Commit b4c5d2e

**Remaining Work** ⏳:
- Phase 3: Testing & Validation (3 tasks)

Skipping completed phases and resuming from Phase 3...
```

**Resume Execution**:
```
1. Parse spec (same as normal execution)
2. Skip to current_phase (from checkpoint)
3. Execute remaining phases
4. Update checkpoint after each phase
5. On completion, delete checkpoint file
```

### Step 5: Update Checkpoint During Resume

After each phase during resume:
```bash
# Update checkpoint file
jq '.completed_phases += [new_phase_data] | .current_phase += 1 | .last_updated = "now"' \
  .implement-checkpoint.json > .implement-checkpoint.tmp
mv .implement-checkpoint.tmp .implement-checkpoint.json
```

### Step 6: Delete Checkpoint on Completion

When all phases complete and validation passes:
```bash
rm .implement-checkpoint.json
```

**Display**:
```markdown
✅ **Implementation Complete**

**Checkpoint Cleared**: .implement-checkpoint.json deleted

All phases completed successfully. No resume needed.
```
```

#### Checkpoint Management Commands

**Manual Checkpoint Inspection**:
```bash
# View checkpoint status
cat .implement-checkpoint.json | jq '.'

# Check if checkpoint exists
[ -f .implement-checkpoint.json ] && echo "Checkpoint exists" || echo "No checkpoint"

# Delete checkpoint (cancel resume)
rm .implement-checkpoint.json
```

**Checkpoint Status Display** (optional helper):
```markdown
### /schovi:implement --status

Display current checkpoint status without resuming:

```markdown
╭─────────────────────────────────────────────╮
│ 📊 IMPLEMENTATION STATUS                    │
╰─────────────────────────────────────────────╯

**Checkpoint**: Found (.implement-checkpoint.json)

**Spec**: ./spec-EC-1234.md
**Started**: 2025-01-05 14:23:45 UTC
**Last Updated**: 2025-01-05 14:35:12 UTC

**Progress**: 2/3 phases complete (66%)

**Completed Phases**:
✅ Phase 1: Backend Service (a3b2c1d)
✅ Phase 2: Integration (b4c5d2e)

**Remaining**:
⏳ Phase 3: Testing & Validation

**Actions**:
- Resume: `/schovi:implement --resume`
- Start fresh: `/schovi:implement ./spec-EC-1234.md`
- Delete checkpoint: `rm .implement-checkpoint.json`
```
```

#### Error Recovery Scenarios

**Scenario 1: Implementation Interrupted (Network Loss, Crash)**
```markdown
User runs: /schovi:implement ./spec-EC-1234.md

Phase 1 completes → Checkpoint created
Phase 2 starts → Network loss / command interrupted

User re-runs: /schovi:implement --resume

Result:
- Checkpoint detected
- Phase 1 already complete (skipped)
- Resumes from Phase 2
```

**Scenario 2: Validation Fails After Phase 2**
```markdown
User runs: /schovi:implement ./spec-EC-1234.md

Phase 1 completes → Checkpoint created
Phase 2 completes → Checkpoint updated
Phase 3 completes → Checkpoint updated
Validation fails (tests failing)

User fixes test issues manually:
- Edits test files
- Runs tests: npm test (now passing)
- Commits fix: git commit -m "fix: Address test failures"

User re-runs: /schovi:implement --resume

Result:
- Checkpoint shows all phases complete
- Skips to validation phase
- Re-runs validation
- If passes: Complete, delete checkpoint
```

**Scenario 3: User Wants to Skip Failed Phase**
```markdown
User runs: /schovi:implement ./spec-EC-1234.md

Phase 1 completes → Checkpoint created
Phase 2 fails (task blocked, missing dependency)

Command offers:
```
⚠️ **Phase 2 Incomplete**

Task 2/3 blocked: "Wire up dependency injection"
Reason: Cannot locate DI config file

**Options**:
1. **Skip and continue** - Mark phase as incomplete, proceed to Phase 3
2. **Retry phase** - Attempt Phase 2 again
3. **Abort** - Stop implementation, save checkpoint

Which option? [1-3]
```

If user chooses 1 (skip):
- Update checkpoint: Mark Phase 2 as "incomplete"
- Continue to Phase 3
- Note incomplete phase in final summary
```

#### Checkpoint File Lifecycle

```
Implementation Start
  ↓
[No checkpoint file]
  ↓
Phase 1 Completes → Create checkpoint.json
  ↓
Phase 2 Completes → Update checkpoint.json
  ↓
Phase 3 Completes → Update checkpoint.json
  ↓
Validation Passes → Delete checkpoint.json
  ↓
Implementation Complete
```

Or with interruption:
```
Implementation Start
  ↓
Phase 1 Completes → Create checkpoint.json
  ↓
Phase 2 Starts → INTERRUPTED
  ↓
[Checkpoint file remains]
  ↓
User: /schovi:implement --resume
  ↓
Read checkpoint → Resume from Phase 2
  ↓
... (continue)
```

#### Implementation Details

**Location**: implement.md

**Add to Step 0: Flag Parsing**:
```markdown
- **`--resume`**: Resume from checkpoint file
  - Reads ./.implement-checkpoint.json
  - Validates git state matches
  - Skips completed phases
  - Continues from last incomplete phase
```

**Add to Step 2.3: Phase Completion**:
```markdown
After creating phase commit:

1. Create/update checkpoint file
2. Include phase data (number, name, commit hash, files)
3. Update current_phase to next phase
4. Display checkpoint status briefly

```bash
# Create checkpoint
cat > .implement-checkpoint.json <<EOF
{...}
EOF

echo "💾 Checkpoint saved (Phase X/Y complete)"
```
```

**Add to Step 4.4: Completion**:
```markdown
After successful validation:

1. Delete checkpoint file
```bash
rm -f .implement-checkpoint.json
```

2. Display confirmation
```
✅ Checkpoint cleared - Implementation complete
```
```

#### Benefits

1. **Resume Capability**: Can restart after interruptions
2. **Incremental Progress**: No need to re-run completed work
3. **Validation Recovery**: Fix validation issues and continue
4. **Transparency**: User can see what's complete via checkpoint
5. **Git Safety**: Verifies git state before resuming

#### Risks & Mitigations

**Risk 1: Spec changes during implementation**
- Mitigation: Checksum validation, warn user, offer options

**Risk 2: Git history changes (rebase, reset)**
- Mitigation: Validate commits exist, error if diverged

**Risk 3: Checkpoint file corruption**
- Mitigation: JSON validation, clear error messages, fallback to fresh start

**Risk 4: Checkpoint not deleted on error**
- Mitigation: Provide `--status` command to inspect, easy to delete manually

**Effort**: 3-4 hours (checkpoint logic + resume flow + validation)

---

### 🟢 Future Enhancement 11: Dry-Run Mode

**User Request**:
> "--dry-run also sounds good."

#### Problem Analysis

**Current Issue**:
- Command executes autonomously with no preview
- Users want to see what will happen before committing to execution
- No way to verify execution plan without actually running

#### Proposed Dry-Run Mode

**Design Philosophy**: Show execution plan without making any changes.

**Command**: `/schovi:implement ./spec-EC-1234.md --dry-run`

#### Dry-Run Execution Flow

```markdown
### Step 0.1: Detect Dry-Run Flag

If `--dry-run` flag provided:
  Display:
  ```
  🔍 **Dry-Run Mode**

  No changes will be made. Showing execution plan only.
  ```

  Set mode: dry_run = true

### Phase 1: Input Resolution (Read-Only)

Execute normally:
- Parse arguments
- Read spec file
- Extract tasks, phases, acceptance criteria
- Detect project type

Display everything as normal, but add banner:
```markdown
╭─────────────────────────────────────────────╮
│ 🔍 DRY-RUN: EXECUTION PLAN PREVIEW          │
╰─────────────────────────────────────────────╯

**Mode**: Dry-run (no changes will be made)
**Spec**: EC-1234 - Reject boolean field types
**Source**: ./spec-EC-1234.md
**Project Type**: Node.js/TypeScript

**Tasks Summary**:
- Phase 1: Backend Service (3 tasks)
- Phase 2: Integration (3 tasks)
- Phase 3: Testing & Validation (3 tasks)

**Total**: 9 implementation tasks across 3 phases
```

### Phase 2: Execution Plan Display

For each phase, show what WOULD happen:

```markdown
╭─────────────────────────────────────────────╮
│ 📋 PHASE 1: Backend Service (Preview)      │
╰─────────────────────────────────────────────╯

**Task 1/3**: Implement validation in FieldMappingValidator.ts:67
  **Action**: Read existing file, apply Edit
  **File**: src/validators/FieldMappingValidator.ts
  **Operation**: INSERT at line 67
  **Content**: Boolean type rejection logic (~15 lines)
  **Estimated changes**: +15 lines

**Task 2/3**: Add error message constant
  **Action**: Edit existing file
  **File**: src/constants/errorMessages.ts
  **Operation**: APPEND to constants object
  **Content**: BOOLEAN_NOT_MAPPABLE error string
  **Estimated changes**: +3 lines

**Task 3/3**: Update controller error handling
  **Action**: Edit existing file
  **File**: src/api/controllers/MappingController.ts:123
  **Operation**: MODIFY error handling block
  **Content**: Add validation error case
  **Estimated changes**: +8 lines

**Phase Summary**:
- Files to modify: 3
- Estimated changes: +26 lines
- Git commit: "Phase 1: Backend Service"

**Would execute**:
```bash
git add src/validators/FieldMappingValidator.ts src/constants/errorMessages.ts src/api/controllers/MappingController.ts
git commit -m "Phase 1: Backend Service"
```

[Same display for Phase 2 and Phase 3...]
```

### Phase 3: Validation Plan

```markdown
╭─────────────────────────────────────────────╮
│ 🔍 VALIDATION PLAN (Preview)                │
╰─────────────────────────────────────────────╯

**Linting**:
- Command: npm run lint
- Expected: Pass (no issues)
- If fails: Attempt auto-fix (npm run lint -- --fix)

**Type Check**:
- Command: npm run typecheck
- Expected: Pass (no type errors)

**Tests**:
- Command: npm test
- Expected: 24/24 tests passing
- New tests: +13 test cases (from Phase 3)

**Acceptance Criteria** (6 criteria):
- Boolean field types rejected → Verify via code analysis
- Number/text types pass → Verify via code analysis
- Error message clear → Verify error constant added
- Unit tests pass → Verify via test execution
- Integration tests cover scenario → Verify test files
- Code review approved → Pending manual review
```

### Phase 4: Execution Summary

```markdown
╭═════════════════════════════════════════════╮
║ 📊 DRY-RUN EXECUTION SUMMARY                ║
╰═════════════════════════════════════════════╯

**Total Phases**: 3
**Total Tasks**: 9
**Estimated File Changes**: 8 files
**Estimated Line Changes**: +247 lines

**Files That Would Be Modified**:
- src/validators/FieldMappingValidator.ts
- src/constants/errorMessages.ts
- src/api/controllers/MappingController.ts
- src/api/routes/mapping.ts
- src/services/MappingService.ts
- tests/validators/FieldMappingValidator.spec.ts
- tests/api/MappingController.integration.spec.ts
- tests/services/MappingService.spec.ts

**Git Commits That Would Be Created**: 3
1. Phase 1: Backend Service
2. Phase 2: Integration
3. Phase 3: Testing & Validation

**Validation Commands**:
- npm run lint
- npm run typecheck
- npm test

**Estimated Duration**: 3-5 minutes
  - Phase 1: ~60 seconds
  - Phase 2: ~60 seconds
  - Phase 3: ~90 seconds
  - Validation: ~60 seconds

**Next Steps to Execute**:
1. Review the execution plan above
2. Verify tasks match your expectations
3. Check estimated file changes
4. If satisfied, run without --dry-run:
   ```bash
   /schovi:implement ./spec-EC-1234.md
   ```

**Differences from Actual Execution**:
- No files will be modified in dry-run
- No git commits will be created
- Validation commands will not run
- Actual line counts may vary slightly
- Task execution time may differ

╭─────────────────────────────────────────────╮
│ ✅ Dry-run complete. No changes made.      │
╰─────────────────────────────────────────────╯
```
```

#### Task Analysis Logic (Dry-Run)

**For each task, analyze without executing**:

```markdown
**Task Analysis Process** (Dry-Run):

1. **Parse task description**:
   - Extract file paths (explicit or implied)
   - Extract line numbers (if provided)
   - Identify operation type (create, modify, delete)

2. **File existence check**:
   ```bash
   # Check if file exists
   [ -f "src/validators/FieldMappingValidator.ts" ] && echo "exists" || echo "new"
   ```

3. **Estimate changes**:
   - New file: Estimate lines based on task complexity
     * Simple: ~20-30 lines
     * Moderate: ~50-100 lines
     * Complex: ~100-200 lines
   - Existing file modification:
     * Read file to get current line count
     * Estimate added lines based on description

4. **Identify tool to use**:
   - New file → Write tool
   - Existing file, specific location → Edit tool
   - Existing file, append → Edit tool
   - Config changes → Edit tool

5. **Display plan**:
   ```
   **Task**: [Description]
   **Action**: [CREATE/EDIT/DELETE]
   **File**: [Path]
   **Operation**: [INSERT/MODIFY/APPEND/DELETE]
   **Estimated changes**: [+X lines, -Y lines]
   ```

**Example Task Analysis**:

Task: "Implement FeatureUpdateService in services/feature-update.ts"

Analysis:
```
File: services/feature-update.ts
Exists: No (would be created)
Tool: Write
Estimated complexity: Moderate (service class with methods)
Estimated lines: ~120 lines
Content:
  - Class definition
  - Constructor with DI
  - 3-5 public methods
  - Error handling
  - Logging
```

Display:
```
**Task 1/3**: Implement FeatureUpdateService in services/feature-update.ts
  **Action**: CREATE new file
  **File**: services/feature-update.ts
  **Tool**: Write
  **Content**: Service class with event publishing methods
  **Estimated changes**: +120 lines
  **Includes**: Class definition, constructor, 5 methods, error handling
```
```

#### Interactive Dry-Run (Optional Enhancement)

**User can drill down into specific phases**:

```markdown
After dry-run summary:

**Would you like to see detailed plans for any phase?**
[1] Phase 1: Backend Service
[2] Phase 2: Integration
[3] Phase 3: Testing & Validation
[4] Skip to execution confirmation
[5] Cancel

Choose [1-5]:
```

If user chooses 1:
```markdown
╭─────────────────────────────────────────────╮
│ 📋 DETAILED PLAN: Phase 1                   │
╰─────────────────────────────────────────────╯

**Task 1/3**: Implement validation in FieldMappingValidator.ts:67

**Current File** (src/validators/FieldMappingValidator.ts):
```typescript
// Line 60-70 (context)
export class FieldMappingValidator {
  validateFieldType(type: string): ValidationResult {
    if (type === 'string' || type === 'number') {
      return { valid: true };
    }
    // [INSERTION POINT LINE 67]
    return { valid: false, error: 'Invalid type' };
  }
}
```

**Planned Change**:
```typescript
// Would INSERT at line 67:
if (type === 'boolean') {
  return {
    valid: false,
    error: ERROR_MESSAGES.BOOLEAN_NOT_MAPPABLE
  };
}
```

**Reasoning**: Add boolean rejection before generic invalid type error

**Estimated impact**: +5 lines

---

[Similar detail for Task 2 and 3...]
```

#### Flag Combinations

**Dry-Run with Other Flags**:

```bash
# Dry-run with verbose commits (show commit message format)
/schovi:implement ./spec-EC-1234.md --dry-run --verbose

# Dry-run with specific output
/schovi:implement EC-1234 --dry-run --output plan.md

# Dry-run with Jira
/schovi:implement EC-1234 --dry-run --post-to-jira
```

**Dry-Run + Verbose**:
```markdown
**Phase 1 Commit** (Verbose Mode):

**Type**: feat
**Title**: Implement backend service for feature updates

**Description**:
Implements Phase 1 (Backend Service) from specification EC-1234.
Creates FieldMappingValidator to handle boolean field type rejection
during mapping validation process. Adds error constants and updates
controller error handling.

**Bullets**:
- Add boolean type check to FieldMappingValidator
- Create BOOLEAN_NOT_MAPPABLE error constant
- Update MappingController error handling for validation
- Add unit tests for boolean rejection scenario

**Related**: EC-1234

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Dry-Run + Output File**:
```bash
# Saves dry-run plan to file
/schovi:implement ./spec-EC-1234.md --dry-run --output plan.md

# User can review file
cat plan.md

# Then execute
/schovi:implement ./spec-EC-1234.md
```

#### Benefits

1. **Preview Before Execution**: See full plan without committing
2. **Verification**: Validate execution plan matches expectations
3. **Estimation**: Get time and change estimates
4. **Risk Assessment**: Identify potentially risky changes
5. **Documentation**: Save execution plan for reference

#### Implementation Details

**Location**: implement.md

**Add Flag**:
```yaml
argument-hint: [...] [--dry-run]
```

**Add to Step 0: Flag Parsing**:
```markdown
- **`--dry-run`**: Preview execution plan without making changes
  - Shows what would be done
  - Estimates file changes
  - Displays commit plans
  - No files modified, no commits created
```

**Modify Each Execution Step**:
```markdown
Before executing tools (Write, Edit):

IF dry_run == true:
  - Display what WOULD happen
  - Show estimated changes
  - Skip actual tool execution
ELSE:
  - Execute normally
```

**Example Conditional**:
```markdown
**Task Execution** (with dry-run check):

IF dry_run:
  Display:
  ```
  **Would create**: services/feature-update.ts
  **Content**: FeatureUpdateService class
  **Estimated**: +120 lines
  ```

  SKIP tool execution
ELSE:
  Use Write tool to create services/feature-update.ts
  [Normal execution]
```

**Effort**: 2-3 hours (analysis logic + display formatting + conditional execution)

---

## 📋 Implementation Plan

### Version 1.4.0 (Critical + High Priority)

**Phase 1: Critical Fixes** (Immediate)
1. ✅ Update next steps to reference `/schovi:publish` (5 min)
2. ✅ Execute confetti on completion (5 min)
3. ✅ Document commit mode with `--verbose` flag (30 min)

**Phase 2: High Priority Improvements**
4. ✅ Implement robust spec parsing (45 min)
5. ✅ Add validation retry with max 3 attempts (45 min)
6. ✅ Better input validation and error messages (20 min)
7. ✅ Add progress visibility for long tasks (45 min)

**Total Effort for v1.4.0**: ~3-4 hours

### Version 2.0 (Future Enhancements)

**Phase 3: Architectural Improvements**
9. ✅ Subagent architecture for phase execution (6-8 hours)
10. ✅ Checkpoint/resume system (3-4 hours)
11. ✅ Dry-run mode (2-3 hours)

**Total Effort for v2.0**: ~11-15 hours

---

## 🎯 Acceptance Criteria

### v1.4.0 Criteria
- [ ] Next steps mention `/schovi:publish` with clear instructions
- [ ] Confetti executes on successful completion
- [ ] `--verbose` flag enables enhanced commit mode
- [ ] Spec parsing handles h1/h2 variants and missing phases
- [ ] Validation attempts max 3 times with clear status
- [ ] Input validation provides actionable error messages
- [ ] Long tasks (>30s) show progress updates every 15s

### v2.0 Criteria
- [ ] Subagents successfully execute phases in isolation
- [ ] Token usage reduced by 70-85% for large implementations
- [ ] Checkpoint file created after each phase
- [ ] `--resume` flag successfully resumes from checkpoint
- [ ] Dry-run mode shows complete execution plan
- [ ] Dry-run estimates match actual execution (±20% variance)

---

## 🧪 Testing Strategy

### Manual Testing for v1.4.0

**Test 1: /schovi:publish Reference**
1. Run full implementation to completion
2. Verify next steps display includes `/schovi:publish` mention
3. Verify instructions are clear and actionable

**Test 2: Confetti Execution**
1. Run implementation to completion
2. Verify confetti command executes (on macOS)
3. Verify graceful failure on non-macOS

**Test 3: Verbose Commits**
1. Run with `--verbose` flag
2. Verify commit messages use conventional format
3. Verify commit type detection (feat/fix/chore)
4. Compare with default simplified commits

**Test 4: Robust Spec Parsing**
1. Test with h1 headers (`# Implementation Tasks`)
2. Test with shortened headers (`## Implementation`)
3. Test with flat task list (no phases)
4. Verify graceful degradation with warnings

**Test 5: Validation Retry**
1. Inject linting failures (add unused variable)
2. Verify 3 attempts (initial, auto-fix, manual)
3. Verify status displayed at each attempt
4. Verify continues after max attempts reached

**Test 6: Progress Updates**
1. Create task that takes >30 seconds (large file creation)
2. Verify progress updates appear every 15s
3. Verify activity descriptions match task type

### Manual Testing for v2.0

**Test 7: Subagent Execution**
1. Run implementation with 9+ tasks
2. Verify subagent spawning messages
3. Verify compressed results returned
4. Measure token usage (should be 70-85% less)

**Test 8: Checkpoint/Resume**
1. Run implementation, interrupt after Phase 1
2. Verify checkpoint file created
3. Run `--resume`, verify Phase 1 skipped
4. Complete remaining phases
5. Verify checkpoint deleted on completion

**Test 9: Dry-Run Mode**
1. Run with `--dry-run` flag
2. Verify no files modified
3. Verify no commits created
4. Verify execution plan displayed
5. Compare estimates to actual execution

---

## 📚 Documentation Updates

### Updates Needed

**1. implement.md**
- Add `--verbose` flag documentation
- Update next steps section with `/schovi:publish`
- Add confetti execution
- Update spec parsing section
- Add validation retry section
- Add progress update logic
- Document all error messages

**2. CLAUDE.md (Project)**
- Update implementation workflow to show v1.4.0 features
- Add examples with `--verbose` flag
- Update workflow diagram with `/schovi:publish` step

**3. CLAUDE.md (Global User)**
- Update Phase 4 (Implementation) with new features
- Add checkpoint/resume guidance (v2.0)
- Add dry-run examples (v2.0)

**4. README.md (Plugin)**
- Update command reference with new flags
- Add examples for new features
- Update version history

---

## 🚨 Risks & Mitigations

### v1.4.0 Risks

**Risk 1: Verbose commits slower than expected**
- Mitigation: Document performance impact, make optional
- Fallback: Keep simplified as default

**Risk 2: Validation retry logic doesn't handle all cases**
- Mitigation: Clear error messages, document limitations
- Fallback: User can always fix manually and continue

**Risk 3: Progress updates too frequent/annoying**
- Mitigation: Tune interval (15-20s), make concise messages
- Fallback: Add `--quiet` suppression

### v2.0 Risks

**Risk 4: Subagent compression loses important context**
- Mitigation: Test with various spec sizes, tune compression
- Fallback: Add verbosity controls

**Risk 5: Checkpoint system state corruption**
- Mitigation: JSON validation, clear error messages
- Fallback: Easy manual deletion, fresh start

**Risk 6: Dry-run estimates inaccurate**
- Mitigation: Document estimates are approximate
- Fallback: Users understand it's preview only

---

## 💬 User Feedback Integration

### From Review Analysis

**User Priority Signals**:
1. 🔴 Confetti: "must have!" → Immediate implementation
2. 🔴 /schovi:publish: "Just let customer know" → Documentation only
3. 🟠 Commits: "propose something" → `--verbose` flag approach
4. 🟠 Validation: "max 3 attempts" → Clear requirement
5. 🟠 Progress: "sounds good!" → User appreciates
6. 🟢 Subagents: "makes absolute sense" → User excited
7. 🟢 Resume: "sounds cool" → User interested
8. 🟢 Dry-run: "sounds good" → User interested

**User Did NOT Want**:
- Automatic PR creation → Confirmed, keep manual
- Complex commit invocation → Confirmed, simplified approach
- Workflow examples in implement → Confirmed, not relevant

---

## 🎉 Success Metrics

### v1.4.0 Success
- ✅ All 7 improvements implemented and tested
- ✅ Documentation complete and accurate
- ✅ No regressions in existing functionality
- ✅ User feedback positive on improvements

### v2.0 Success
- ✅ Token usage reduced by 70%+ for large implementations
- ✅ Resume success rate >95% (valid checkpoints)
- ✅ Dry-run estimates within ±20% of actual
- ✅ Subagent performance meets expectations

---

## 📝 Next Steps

**Immediate** (This Session):
1. ✅ Create this specification document
2. ✅ Review with user
3. ⏳ Prioritize changes for implementation

**Next Session** (v1.4.0):
1. Implement critical fixes (1-3)
2. Implement high priority improvements (4-7)
3. Test all changes
4. Update documentation
5. Create PR

**Future** (v2.0):
1. Design subagent architecture in detail
2. Implement checkpoint system
3. Implement dry-run mode
4. Test at scale
5. Performance optimization

---

**End of Specification**
