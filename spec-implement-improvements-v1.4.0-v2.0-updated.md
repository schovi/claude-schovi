---
title: "Comprehensive Implementation Improvements for /schovi:implement Command"
status: "DRAFT"
version_1: "v1.4.0"
version_2: "v2.0"
created_date: 2025-01-05
updated_date: 2025-01-05
created_by: david.schovanec@productboard.com
source: analysis-implement-improvements.md
modifications: "Validation retry: 2 attempts (not 3), Line numbers updated to match actual implement.md structure"
---

# SPEC: Comprehensive /schovi:implement Command Improvements (v1.4.0 + v2.0)

## Decision & Rationale

**Implementation Strategy**: Two-phase rollout across two versions

**v1.4.0 (Improvements 1-8)**: Critical fixes and high-priority enhancements that provide immediate value with minimal architectural changes. These improvements address user feedback, fix missing features, and enhance the user experience without requiring new infrastructure.

**v2.0 (Improvements 9-11)**: Architectural enhancements that require new subagent infrastructure and checkpoint systems. These provide advanced capabilities like token optimization, resume functionality, and execution preview but require more substantial implementation effort.

**Rationale for 2 Retry Attempts**: User explicitly requested "2 retry attempts instead of 3" for faster failure detection. This means:
- Attempt 1: Initial validation run
- Attempt 2: Auto-fix OR manual fix
- After 2 attempts: Mark incomplete, continue gracefully

This change reduces retry overhead while still providing one auto-recovery opportunity.

**Alternatives Considered**: A single-phase rollout was rejected because it would delay critical fixes while building infrastructure for advanced features. The two-phase approach delivers immediate value (v1.4.0) while planning for future enhancements (v2.0).

## Technical Overview

### Version 1.4.0 (Critical + High Priority)

**Data Flow**:
```
User invokes command
  ↓
Parse flags (including --verbose)
  ↓
Load spec with flexible parsing (h1/h2, with/without phases)
  ↓
Execute phases sequentially
  ↓
Create commits (simplified default, enhanced with --verbose)
  ↓
Run validation (max 2 attempts with clear status)
  ↓
Display completion with next steps (includes /schovi:publish reference)
  ↓
Execute confetti celebration
```

**Affected Files**:
- `schovi/commands/implement.md` (all improvements 1-8)
- `schovi/README.md` (documentation updates)
- `CLAUDE.md` (global user instructions)

**Key Changes** (with accurate line numbers):

1. **Next Steps Section** (lines 829-869): Add explicit `/schovi:publish` reference with usage instructions
   - Currently says "PR automation coming in v1.4.0"
   - Replace with actual `/schovi:publish` command documentation
   - Add usage examples and workflow integration

2. **Completion Signal** (lines 972-983): Execute confetti command instead of just displaying it
   - Currently lines 974-976 just show the command as text
   - Change to execute via Bash tool with error suppression
   - Add graceful failure for non-macOS systems

3. **Commit Mode Selection** (lines 469-515): Use `--verbose` flag for enhanced conventional commits only when no related Jira ticket exists.
   - Current commit strategy is basic phase-based (lines 469-515)
   - Add flag parsing in Step 1.0 (lines 30-71)
   - Implement commit mode detection
   - Enhanced mode uses `/schovi:commit` style analysis

4. **Spec Parsing** (lines 215-296): Support h1/h2 variants, shortened headers, flat task lists
   - Current parsing looks for `## Implementation Tasks` only (line 235)
   - Add flexible pattern matching (h1, h2 variants, "Implementation" shorthand)
   - Handle flat lists without phase structure
   - Display warnings for missing sections

5. **Validation Retry** (lines 552-722): Max 2 attempts with status display
   - Current validation has no retry logic
   - Add attempt tracking to Step 3.2 (Linting, lines 552-622)
   - Add attempt tracking to Step 3.4 (Tests, lines 648-722)
   - Display "Attempt 1/2" and "Attempt 2/2" status
   - Mark incomplete after 2 attempts

6. **Input Validation** (lines 59-63): Clear, actionable error messages for flag conflicts
   - Current validation is basic (lines 59-63)
   - Add detailed conflict detection
   - Provide clear resolution steps for each conflict type

7. **Progress Updates** (lines 412-466): Display activity every 15-20s for tasks >30s
   - Current progress is simple "⏳ Task X/Y:" (lines 416-417)
   - Add complexity estimation
   - Add periodic updates for long-running tasks
   - Show timestamps and durations

8. **Documentation**: Update workflow examples and flag references

### Version 2.0 (Future Enhancements)

**Data Flow**:
```
User invokes command (with optional --dry-run, --resume)
  ↓
Check for checkpoint file (if --resume)
  ↓
Validate checkpoint state (git, spec checksum)
  ↓
Skip completed phases, resume from current
  ↓
For each phase: Spawn specialized subagent (code/test/verify/config)
  ↓
Subagent executes in isolated context
  ↓
Subagent returns compressed summary (~800 tokens)
  ↓
Main context creates commit based on summary
  ↓
Create checkpoint after each phase
  ↓
On completion: Delete checkpoint
```

**Affected Files**:
- `schovi/commands/implement.md` (execution mode detection, checkpoint logic)
- `schovi/agents/code-executor/AGENT.md` (NEW)
- `schovi/agents/test-executor/AGENT.md` (NEW)
- `schovi/agents/verify-executor/AGENT.md` (NEW)
- `schovi/agents/config-executor/AGENT.md` (NEW)

**Key Changes**:

9. **Subagent Architecture**: Isolate phase execution in specialized subagents, reduce main context tokens by 70-85%
10. **Checkpoint/Resume System**: Persistent state file (`.implement-checkpoint.json`) with git validation
11. **Dry-Run Mode**: Preview execution plan without making changes, estimate impact

## Implementation Tasks

### Phase 1: v1.4.0 Critical Fixes (Immediate)

- [ ] Update next steps section in `implement.md:829-869` to reference `/schovi:publish` command
  - Replace "PR automation coming in v1.4.0" text (around line 837)
  - Add usage instructions: `/schovi:publish` or `/schovi:publish EC-1234`
  - Explain auto-push, draft PR creation, spec-based description generation
  - Add steps 4-5 for code review and merge
  - Keep existing manual testing guidance

- [ ] Modify confetti section in `implement.md:972-983` to execute command instead of displaying
  - Replace lines 974-976 text display with Bash tool execution
  - Add error suppression: `2>/dev/null || true`
  - Add note about non-macOS graceful failure
  - Keep display message after execution (lines 978-982)

- [ ] Document commit strategy with `--verbose` flag in `implement.md:469-515`
  - Add flag parsing to Step 1.0 (lines 30-71) - add `--verbose` to list
  - Add Step 2.3 commit mode selection logic (before line 469)
  - Document simplified mode (default): Phase-based format (current behavior)
  - Document enhanced mode (--verbose): Conventional commits with type detection
  - Create comparison table showing differences
  - Add `--verbose` to argument-hint in frontmatter (line 3)

### Phase 2: v1.4.0 High Priority Enhancements

- [ ] Implement robust spec parsing in `implement.md:215-296`
  - Replace Step 1.2 parsing logic (lines 215-296)
  - Add flexible pattern matching for "Implementation Tasks" section
  - Support patterns: `## Implementation Tasks`, `# Implementation Tasks`, `## Implementation`, `# Implementation`, `## Task`, singular variants
  - Handle flat task lists (no `### Phase N:` headers) with single-phase fallback
  - Add validation warnings for missing sections (display but continue)
  - Display parsing summary with warnings/successes after line 296

- [ ] Add validation retry logic with max 2 attempts in `implement.md:552-722`
  - Add attempt tracking to Step 3.2 Linting (lines 552-622)
    - Add variables: max_attempts = 2, current_attempt = 1
    - Wrap linting execution in attempt loop
    - Attempt 1: Initial run, display "🔍 Attempt 1/2: Linting"
    - If fails: Attempt 2 with auto-fix, display "🔍 Attempt 2/2: Linting (Auto-Fix)"
    - If still fails: Mark incomplete, display "⚠️ Incomplete (2/2 attempts)"
  - Add attempt tracking to Step 3.4 Tests (lines 648-722)
    - Same pattern as linting
    - Attempt 1: Initial test run
    - If fails: Attempt 2 with analysis, fixes, re-run
    - After 2 attempts: Mark incomplete, document issues
  - Update Step 3.6 Validation Summary (lines 752-788) to show attempt history

- [ ] Improve input validation error messages in `implement.md:59-63`
  - Replace Step 1.0 flag validation (lines 59-63)
  - Add specific error displays for each conflict:
    - `--output` + `--no-file`: Error block execution, explain conflict, suggest solutions
    - `--quiet` + `--no-file`: Warn, ask confirmation (no output at all)
    - `--post-to-jira` without Jira ID: Warn, explain posting will be skipped
    - `--resume` without checkpoint: Error, suggest options
  - Add unknown flag warning with valid flag list

- [ ] Add progress visibility for long tasks in `implement.md:412-466`
  - Update Step 2.2 task execution (lines 412-466)
  - Add task complexity estimation (simple <5s, moderate 5-30s, complex >30s)
  - For complex tasks (>30s):
    - Display task start with timestamp: "⏳ Task 1/3: ... 🕐 Started: HH:MM:SS"
    - Add periodic progress updates every 15-20s
    - Display activity descriptions by task type (file creation, editing, migration, tests)
    - Display duration on completion: "✅ Task 1/3 complete (Duration: Xs)"
  - Show activity context if task errors

### Phase 3: v1.4.0 Documentation & Testing

- [ ] Update `schovi/README.md` with v1.4.0 features
  - Add `--verbose` flag to command reference
  - Update examples showing progress updates
  - Document validation retry behavior (2 attempts)
  - Add `/schovi:publish` integration note

- [ ] Update `CLAUDE.md` (project) with workflow changes
  - Update Phase 4 (Implementation) showing new features
  - Add example with `--verbose` flag
  - Update completion flow with `/schovi:publish` step

- [ ] Update `CLAUDE.md` (global user instructions)
  - Update implementation workflow section
  - Add validation retry explanation
  - Document commit mode options

- [ ] Manual testing checklist for v1.4.0
  - Test 1: Verify `/schovi:publish` reference appears in next steps
  - Test 2: Verify confetti executes on completion (macOS)
  - Test 3: Test `--verbose` commits vs simplified commits
  - Test 4: Test spec parsing with h1/h2 variants and flat lists
  - Test 5: Inject linting failure, verify 2 retry attempts with status
  - Test 6: Test progress updates for long tasks (>30s)
  - Test 7: Test all input validation error messages

### Phase 4: v2.0 Subagent Architecture (Future)

- [ ] Create `schovi/agents/code-executor/AGENT.md` subagent
  - Allowed tools: Read, Write, Edit, Glob, Grep, mcp__jetbrains__*
  - Input: Phase context, task list, spec technical overview
  - Output: Compressed summary (~800 tokens) with files changed, line counts
  - Token budget: Max 5000 tokens output
  - Add task execution logic with autonomy
  - Add result compression logic

- [ ] Create `schovi/agents/test-executor/AGENT.md` subagent
  - Allowed tools: Read, Write, Edit, Glob, Grep, Bash (for test execution)
  - Input: Phase context, test tasks, spec testing strategy
  - Output: Test file creation summary + test run results (~800 tokens)
  - Token budget: Max 5000 tokens output
  - Add test file creation logic
  - Optional: Run tests within subagent

- [ ] Create `schovi/agents/verify-executor/AGENT.md` subagent
  - Allowed tools: Bash (validation commands), Read (error analysis)
  - Input: Project type, validation commands, changed files
  - Output: Validation summary with pass/fail + error details (~1000 tokens)
  - Token budget: Max 6000 tokens output
  - Implement retry logic within subagent (2 attempts)
  - Return compressed validation results

- [ ] Create `schovi/agents/config-executor/AGENT.md` subagent
  - Allowed tools: Read, Write, Edit, Grep
  - Input: Configuration task list, project type
  - Output: Config change summary (~600 tokens)
  - Token budget: Max 3000 tokens output
  - Handle build configs, CI files, dependencies, migrations

- [ ] Update `implement.md` with subagent execution logic
  - Add Step 0.5: Execution strategy selection (auto-detect or manual flag)
  - Detection logic: IF total_tasks >= 9 OR any_phase >= 4_tasks → subagent mode
  - Add subagent spawning logic for each phase type
  - Add result aggregation from subagent returns
  - Update commit creation (Step 2.3) to use aggregated results
  - Display subagent execution status

### Phase 5: v2.0 Checkpoint/Resume System (Future)

- [ ] Design checkpoint JSON schema for `.implement-checkpoint.json`
  - Fields: version, spec_source, spec_checksum, started_at, last_updated
  - Completed phases array with commit_hash, tasks_completed, files_changed
  - Current state: current_phase, total_phases, validation_status
  - Git state: branch, commits, uncommitted_changes

- [ ] Implement checkpoint creation logic in `implement.md`
  - Add checkpoint creation after Step 2.3 (Phase commit)
  - Generate spec checksum with sha256sum
  - Capture phase data (number, name, tasks, commit hash, files)
  - Write JSON to `.implement-checkpoint.json`
  - Display checkpoint status: "💾 Checkpoint saved (Phase X/Y complete)"

- [ ] Implement resume logic with `--resume` flag in `implement.md`
  - Update Step 1.1 Option D (lines 102-108) with full resume logic
  - Add Step 1: Detect --resume flag
  - Add Step 2: Read checkpoint file, display details
  - Add Step 3: Validate checkpoint state (spec exists, checksum matches, git state matches, no uncommitted changes)
  - Add Step 4: Resume from current phase, skip completed phases
  - Add Step 5: Update checkpoint during resume execution
  - Add Step 6: Delete checkpoint on successful completion (Step 4.4)

- [ ] Add checkpoint validation error handling
  - Scenario 1: Spec file changed (checksum mismatch) → warn, offer options
  - Scenario 2: Git state diverged (branch/commits missing) → error, suggest resolution
  - Scenario 3: Uncommitted changes → error, require clean state
  - Scenario 4: Checkpoint file corrupted → error, suggest fresh start

- [ ] Add `--status` helper command (optional)
  - Display current checkpoint status without resuming
  - Show progress percentage, completed phases, remaining work
  - Suggest actions: resume, start fresh, delete checkpoint

- [ ] Update documentation with checkpoint/resume workflow
  - Add checkpoint lifecycle diagram
  - Document resume scenarios (interruption, validation failure, manual skip)
  - Add examples of checkpoint inspection commands

### Phase 6: v2.0 Dry-Run Mode (Future)

- [ ] Add `--dry-run` flag to `implement.md` frontmatter
  - Update argument-hint in line 3: [...] [--dry-run]
  - Add flag description in Step 1.0 (lines 30-71)

- [ ] Implement dry-run detection and banner display
  - Add Step 0.1 before Phase 1: Detect --dry-run flag
  - Display dry-run mode banner
  - Set dry_run variable for conditional execution

- [ ] Add task analysis logic for dry-run mode
  - Parse task descriptions to extract file paths, operations
  - Check file existence without modifying
  - Estimate changes based on task complexity (simple/moderate/complex)
  - Map operations to tools (CREATE → Write, EDIT → Edit)
  - Display planned action with estimated line counts

- [ ] Modify all execution steps with dry-run conditionals
  - Before Write/Edit tool execution in Step 2.2 (lines 412-466): Check IF dry_run
  - If dry-run: Display what WOULD happen, skip tool execution
  - If not dry-run: Execute normally
  - Apply pattern to all task execution points

- [ ] Create dry-run execution summary display
  - Total phases, tasks, estimated file changes
  - List all files that would be modified
  - Git commits that would be created
  - Validation commands that would run
  - Estimated duration
  - Next steps to execute for real

- [ ] Add detailed phase view (optional interactive enhancement)
  - Offer drill-down into specific phases
  - Show current file content and planned changes
  - Display reasoning for changes
  - Show estimated impact per task

- [ ] Document dry-run mode with examples
  - Basic dry-run usage
  - Dry-run + --verbose (show commit message format)
  - Dry-run + --output (save plan to file)
  - Estimation accuracy disclaimer (±20% variance)

### Phase 7: v2.0 Testing & Documentation

- [ ] Manual testing for subagent architecture
  - Test with small implementation (verify no regression)
  - Test with large implementation (9+ tasks, verify token savings)
  - Measure token usage before/after (expect 70-85% reduction)
  - Verify subagent compression doesn't lose critical context

- [ ] Manual testing for checkpoint/resume system
  - Test normal flow with checkpoint creation
  - Test interruption recovery (kill command after Phase 1)
  - Test validation failure recovery (fix issues, resume)
  - Test spec change detection (modify spec, verify warning)
  - Test git state validation (switch branch, verify error)
  - Test checkpoint cleanup on completion

- [ ] Manual testing for dry-run mode
  - Verify no files modified with --dry-run
  - Verify no commits created
  - Compare estimates to actual execution (record variance)
  - Test with various spec sizes
  - Test dry-run + other flag combinations

- [ ] Update all documentation for v2.0 features
  - Update `schovi/README.md` with subagent architecture diagram
  - Update `CLAUDE.md` (project) with checkpoint/resume workflow
  - Update `CLAUDE.md` (global) with dry-run examples
  - Add v2.0 section to plugin README

## Acceptance Criteria

### v1.4.0 Acceptance Criteria

- [ ] Next steps section includes clear `/schovi:publish` reference with usage instructions
- [ ] Confetti command executes on successful completion (not just displayed)
- [ ] Confetti fails gracefully on non-macOS systems
- [ ] `--verbose` flag enables enhanced commit mode with conventional format
- [ ] Default commits remain simplified phase-based format
- [ ] Commit type detection works for feat/fix/chore/refactor when using --verbose
- [ ] Spec parsing handles h1 headers: `# Implementation Tasks`
- [ ] Spec parsing handles h2 shortened headers: `## Implementation`
- [ ] Spec parsing handles flat task lists without phase structure
- [ ] Missing spec sections display warnings but continue execution
- [ ] Validation retry attempts max 2 times (not 3) with clear status updates
- [ ] Attempt 1: Initial validation displays "Attempt 1/2"
- [ ] Attempt 2: Auto-fix or manual fix displays "Attempt 2/2"
- [ ] After 2 attempts: Marks incomplete, documents issues, continues
- [ ] Input validation displays clear error for --output + --no-file conflict
- [ ] Input validation warns for --quiet + --no-file combination
- [ ] Input validation warns for --post-to-jira without Jira ID
- [ ] Input validation errors for --resume without checkpoint file
- [ ] Progress updates display every 15-20s for tasks >30s
- [ ] Progress updates show specific activity descriptions
- [ ] Progress updates include duration tracking
- [ ] All documentation updated with v1.4.0 features
- [ ] Manual testing checklist completed with all tests passing

### v2.0 Acceptance Criteria

- [ ] Code-executor subagent successfully executes code implementation tasks
- [ ] Test-executor subagent successfully creates and runs tests
- [ ] Verify-executor subagent successfully runs validation with retry logic
- [ ] Config-executor subagent successfully handles configuration changes
- [ ] Subagent returns compressed summaries (~800 tokens per phase)
- [ ] Token usage reduced by 70-85% in main context for implementations with 9+ tasks
- [ ] Execution strategy auto-detects when to use subagents (9+ tasks or 4+ tasks per phase)
- [ ] Checkpoint file created after each successful phase commit
- [ ] Checkpoint JSON schema valid with all required fields
- [ ] Spec checksum calculated and stored correctly
- [ ] Git state captured in checkpoint (branch, commits)
- [ ] `--resume` flag reads checkpoint and displays details
- [ ] Resume validates spec checksum (warns if changed)
- [ ] Resume validates git state (errors if diverged)
- [ ] Resume validates no uncommitted changes
- [ ] Resume skips completed phases successfully
- [ ] Resume continues from current phase
- [ ] Checkpoint updated during resume execution
- [ ] Checkpoint deleted on successful completion
- [ ] Checkpoint validation errors provide clear resolution steps
- [ ] `--status` command displays checkpoint status without resuming (optional)
- [ ] `--dry-run` flag shows complete execution plan
- [ ] Dry-run displays estimated file changes
- [ ] Dry-run shows git commits that would be created
- [ ] Dry-run shows validation commands that would run
- [ ] Dry-run estimates duration
- [ ] Dry-run mode makes zero file modifications
- [ ] Dry-run mode creates zero git commits
- [ ] Dry-run estimates within ±20% of actual execution
- [ ] All v2.0 documentation complete and accurate

## Testing Strategy

### Tests to Update/Create

**Manual Testing for v1.4.0**:

Run implementation with test spec containing all scenarios:

1. **Next Steps Test**:
   - Complete full implementation
   - Verify completion summary displays `/schovi:publish` reference
   - Verify instructions explain auto-push and draft PR creation
   - Verify steps 4-5 mention code review and merge

2. **Confetti Test**:
   - Complete implementation on macOS
   - Verify confetti command executes (raycast://extensions/raycast/raycast/confetti)
   - Verify celebration visible
   - Test on Linux VM, verify graceful failure (no blocking error)

3. **Commit Mode Test**:
   - Run implementation WITHOUT --verbose flag
   - Verify commits use simplified format: "Phase N: Name\n\n- Task list..."
   - Run implementation WITH --verbose flag
   - Verify commits use conventional format: "TYPE: Title\n\nDescription\n\n- Bullets..."
   - Verify type detection (feat for new features, fix for bug fixes, chore for configs)

4. **Spec Parsing Test**:
   - Create test spec with h1 headers: `# Implementation Tasks`
   - Verify parsing succeeds
   - Create test spec with h2 shortened: `## Implementation`
   - Verify parsing succeeds
   - Create test spec with flat task list (no `### Phase N:` structure)
   - Verify treats as single phase named "Implementation"
   - Create test spec missing "Implementation Tasks" section
   - Verify clear error displayed listing found sections

5. **Validation Retry Test**:
   - Inject linting failure: Add unused variable to file
   - Start implementation
   - Verify Attempt 1: Displays "Attempt 1/2", detects failure
   - Verify Attempt 2: Displays "Attempt 2/2 (Auto-Fix)", attempts npm run lint -- --fix
   - If still fails after 2 attempts: Verify marks incomplete, documents issues, continues
   - Verify validation summary shows attempt history: "⚠️ Incomplete (2/2 attempts, N issues remain)"

6. **Input Validation Test**:
   - Test 6a: `/schovi:implement spec.md --output log.txt --no-file`
     - Verify error blocks execution
     - Verify error explains conflict and suggests solutions
   - Test 6b: `/schovi:implement spec.md --quiet --no-file`
     - Verify warning asks confirmation
     - Verify explains result (no output)
   - Test 6c: `/schovi:implement spec.md --post-to-jira` (no Jira ID in spec)
     - Verify warning explains posting will be skipped
     - Verify suggests how to provide Jira ID
   - Test 6d: `/schovi:implement --resume` (no checkpoint file)
     - Verify error explains no checkpoint found
     - Verify suggests options (start new, check directory)

7. **Progress Updates Test**:
   - Create test spec with task requiring >30s execution (e.g., large file generation)
   - Start implementation
   - Verify task start displays with timestamp: "⏳ Task 1/3: ... 🕐 Started: HH:MM:SS"
   - Wait 15-20 seconds
   - Verify progress update appears: "⏰ Still working on task (15s elapsed): [activity]"
   - Verify activity description matches task type (e.g., "Generating code..." for new file)
   - Verify completion shows duration: "✅ Task 1/3 complete (Duration: Xs)"

**Manual Testing for v2.0**:

8. **Subagent Architecture Test**:
   - Create test spec with 9+ tasks across 3 phases
   - Start implementation
   - Verify execution mode detection: "🚀 Using subagent architecture for optimal performance"
   - Verify subagent spawning message: "🛠️ Spawning Code-Executor Subagent"
   - Verify subagent completion message with compressed summary
   - Verify files changed list in summary
   - Measure token usage in main context (use /token-usage or inspect conversation)
   - Compare with direct execution mode (should be 70-85% less)

9. **Checkpoint/Resume Test**:
   - Test 9a: Normal checkpoint flow
     - Start implementation with 3-phase spec
     - After Phase 1 commit: Verify checkpoint file created `.implement-checkpoint.json`
     - After Phase 2 commit: Verify checkpoint updated
     - After completion: Verify checkpoint deleted

   - Test 9b: Interruption recovery
     - Start implementation
     - After Phase 1 commit: Kill command (Ctrl+C)
     - Verify checkpoint file remains
     - Run `/schovi:implement --resume`
     - Verify displays checkpoint details, shows Phase 1 complete
     - Verify skips Phase 1 execution
     - Verify resumes from Phase 2
     - Complete implementation
     - Verify checkpoint deleted

   - Test 9c: Validation failure recovery
     - Complete all phases but validation fails (tests failing)
     - Checkpoint remains with all phases complete
     - Fix tests manually, commit fix
     - Run `/schovi:implement --resume`
     - Verify re-runs validation
     - Verify deletes checkpoint on success

   - Test 9d: Spec change detection
     - Start implementation, complete Phase 1
     - Modify spec file (change task description)
     - Run `/schovi:implement --resume`
     - Verify warning about checksum mismatch
     - Verify offers options: continue with old spec, restart with new spec

   - Test 9e: Git state validation
     - Start implementation, complete Phase 1
     - Switch to different branch: `git checkout main`
     - Run `/schovi:implement --resume`
     - Verify error about branch mismatch
     - Verify suggests switching back to correct branch

10. **Dry-Run Mode Test**:
    - Test 10a: Basic dry-run
      - Run `/schovi:implement spec.md --dry-run`
      - Verify banner: "🔍 DRY-RUN: EXECUTION PLAN PREVIEW"
      - Verify displays execution plan for all phases
      - Verify shows estimated file changes
      - Verify shows git commits that would be created
      - Verify NO files modified (check with git status)
      - Verify NO commits created (check with git log)

    - Test 10b: Dry-run accuracy
      - Run dry-run, record estimates (file counts, line counts, duration)
      - Run actual execution
      - Record actual values
      - Calculate variance: |estimate - actual| / actual
      - Verify variance <= 20%

    - Test 10c: Dry-run + verbose
      - Run `/schovi:implement spec.md --dry-run --verbose`
      - Verify shows conventional commit message format in plan
      - Verify displays commit type, title, description, bullets

    - Test 10d: Dry-run + output
      - Run `/schovi:implement spec.md --dry-run --output plan.md`
      - Verify plan saved to `plan.md`
      - Verify file contains full execution plan
      - Review file content for completeness

## Risks & Mitigations

### v1.4.0 Risks

**Risk 1: Verbose commits add significant execution time**
- *Impact*: Users may find --verbose mode too slow
- *Likelihood*: Medium
- *Mitigation*: Document performance impact in help text, benchmark diff analysis overhead (~5-10s per commit), keep simplified as default for speed
- *Fallback*: If overhead >30s per commit, add --quick-verbose mode with lighter analysis

**Risk 2: Validation retry logic doesn't handle all edge cases**
- *Impact*: Some validation failures may not auto-recover within 2 attempts
- *Likelihood*: Medium-High
- *Mitigation*: Clear documentation that 2 attempts is best-effort, provide detailed error output for manual resolution, always allow continuation after max attempts
- *Fallback*: User can always fix manually and re-run validation, or accept incomplete validation for PR discussion

**Risk 3: Progress updates too frequent or verbose**
- *Impact*: User finds updates distracting or noisy
- *Likelihood*: Low
- *Mitigation*: Keep messages concise (1 line), use consistent format, tune interval to 15-20s, test with users for feedback
- *Fallback*: Add `--quiet-progress` flag to suppress updates

**Risk 4: Flexible spec parsing too permissive**
- *Impact*: Accepts malformed specs that shouldn't parse
- *Likelihood*: Low
- *Mitigation*: Require at least one valid task found, display warnings for missing sections, provide clear error when truly malformed
- *Fallback*: Add `--strict-parsing` flag for validation mode

**Risk 5: Input validation too strict**
- *Impact*: Blocks valid use cases
- *Likelihood*: Low
- *Mitigation*: Distinguish blocking errors (true conflicts) from warnings (unusual combinations), always provide override path, test edge cases
- *Fallback*: Add `--force` flag to bypass non-critical validations

### v2.0 Risks

**Risk 6: Subagent compression loses critical context**
- *Impact*: Implementation quality suffers, commits lack detail
- *Likelihood*: Medium
- *Mitigation*: Test with various spec complexities, tune compression rules, preserve critical info (file paths, error messages, key decisions), add verbosity controls
- *Fallback*: Add `--no-subagents` flag to force direct execution mode

**Risk 7: Checkpoint file corruption or state inconsistency**
- *Impact*: Resume fails or causes incorrect state
- *Likelihood*: Medium
- *Mitigation*: Add JSON validation on read, checksums for integrity, validate all checkpoint fields before resume, provide clear error messages
- *Fallback*: Easy manual deletion (`rm .implement-checkpoint.json`), suggest fresh start in errors

**Risk 8: Spec changes during implementation not detected properly**
- *Impact*: Resume with outdated checkpoint causes mismatch
- *Likelihood*: Medium
- *Mitigation*: Strong checksum validation (sha256), warn prominently on mismatch, offer clear options (continue old vs. restart new), never auto-merge changes
- *Fallback*: User can manually delete checkpoint and restart

**Risk 9: Git state divergence breaks resume**
- *Impact*: Resume fails or applies changes to wrong commits
- *Likelihood*: Low-Medium
- *Mitigation*: Validate all checkpoint commits exist, check current branch matches, require clean working directory, provide detailed resolution steps
- *Fallback*: Error clearly, suggest manual git fixes, never force-resume

**Risk 10: Dry-run estimates significantly inaccurate**
- *Impact*: User loses trust in dry-run mode
- *Likelihood*: Medium
- *Mitigation*: Document estimates are approximate (±20%), tune estimation heuristics based on real data, display disclaimer in output
- *Fallback*: Clearly state "estimates may vary" in all dry-run output

**Risk 11: Subagent spawning overhead negates token savings**
- *Impact*: Subagent architecture slower than direct execution
- *Likelihood*: Low
- *Mitigation*: Only use subagents for large implementations (9+ tasks), benchmark spawning cost, optimize subagent prompts for speed
- *Fallback*: Tune auto-detection threshold (e.g., 12+ tasks instead of 9+)

**Risk 12: v2.0 complexity increases maintenance burden**
- *Impact*: Harder to debug, more potential failure modes
- *Likelihood*: High
- *Mitigation*: Excellent documentation, comprehensive testing, clear error messages, phased rollout to catch issues early
- *Fallback*: Feature flags to disable problematic features, rollback plan

## Deployment & Rollout

### v1.4.0 Rollout

**Standard Plugin Update Process**:
1. Implement all improvements 1-8
2. Update documentation (README, CLAUDE.md files)
3. Test manually with checklist
4. Commit changes to main branch
5. Users get update automatically (markdown-based plugin, no build needed)

**No Special Rollout Requirements**: All v1.4.0 changes are additive or fix existing behavior. No breaking changes.

**Feature Flags**: None needed for v1.4.0. New features are opt-in via flags (--verbose) or enhancements to existing flow.

### v2.0 Rollout

**Staged Rollout Recommended**:

**Phase 1: Infrastructure (Week 1)**
- Deploy subagent files (code-executor, test-executor, verify-executor, config-executor)
- No user-facing changes yet
- Test subagent spawning in isolation

**Phase 2: Opt-In Subagents (Week 2)**
- Enable subagent architecture with manual flag: `--execution-mode subagent`
- Auto-detection disabled initially
- Monitor performance and gather feedback
- Fix issues before enabling auto-detection

**Phase 3: Auto-Detection (Week 3)**
- Enable auto-detection for 9+ tasks
- Monitor token savings and execution time
- Gather user feedback on compressed summaries

**Phase 4: Checkpoint/Resume (Week 4)**
- Enable checkpoint system
- Test with real-world interruptions
- Monitor checkpoint file creation/deletion
- Validate resume success rate

**Phase 5: Dry-Run Mode (Week 5)**
- Enable --dry-run flag
- Gather accuracy feedback
- Tune estimation heuristics
- Monitor usage patterns

**Feature Flags** (if needed):
- `ENABLE_SUBAGENTS=true|false` (environment variable)
- `ENABLE_CHECKPOINTS=true|false`
- `ENABLE_DRYRUN=true|false`

**Rollback Plan**: If critical issues detected:
1. Add `--no-subagents` flag for users to opt-out
2. Disable auto-detection, require manual flag
3. Disable checkpoint creation if corruption issues
4. Revert to v1.4.0 if fundamental architectural problems

**Monitoring**: Track key metrics during rollout:
- Subagent token savings (target: 70-85%)
- Subagent execution time vs. direct mode
- Checkpoint resume success rate (target: >95%)
- Dry-run estimate accuracy (target: ±20%)
- User feedback on new features

## References

- **Source Analysis**: `analysis-implement-improvements.md` (contains detailed design for all 11 improvements)
- **Main Command**: `schovi/commands/implement.md` (primary file being enhanced, lines 1-1330)
- **Related Commands**: `schovi/commands/commit.md` (commit structure reference), `schovi/commands/publish.md` (next step integration)
- **Documentation**: `schovi/README.md` (plugin docs), `CLAUDE.md` (project and global instructions)
- **User Feedback**: Analysis document captures user priorities and explicit requirements (confetti "must have", 2 retry attempts, simplified commits as default)
