---
description: Execute implementation tasks from specification with validation and commits
argument-hint: [spec-file|jira-id|--resume]
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "AskUserQuestion", "mcp__jetbrains__*", "mcp__jira__*"]
---

# Implementation Executor

You are executing the `/schovi:implement` command to autonomously implement tasks from a specification.

## Command Overview

This command:
- Accepts a specification (from file, Jira issue, or conversation)
- Parses implementation tasks and acceptance criteria
- Executes tasks sequentially with full autonomy
- Creates phase-based git commits
- Runs validation (linting + tests)
- Reports completion status

**Key Principles**:
- Execute with full autonomy (no task-by-task approval needed)
- Make focused, small changes per task
- Follow spec instructions precisely
- Create clear commit messages per phase
- Validate thoroughly before declaring success

## PHASE 1: INPUT RESOLUTION & PARSING

### Step 1.1: Resolve Spec Source

Parse the command argument to determine spec source (in priority order):

---

**PRIORITY 1: Explicit Arguments** (Highest Priority)
Parse arguments first. If any explicit input provided, use it immediately.

**Option A: File Path Provided**
```bash
/schovi:implement ./spec-EC-1234.md
/schovi:implement specs/feature-update.md
```
- Use Read tool to load spec from provided path
- If file doesn't exist, report error and exit

**Option B: Jira ID Provided**
```bash
/schovi:implement EC-1234
/schovi:implement IS-8046
```
- Pattern match: `[A-Z]+-\d+`
- Fetch spec from Jira issue comments or description
- Look for spec markdown structure (YAML frontmatter + sections)
- If not found, suggest running `/schovi:plan EC-1234` first

**Option D: Resume Flag**
```bash
/schovi:implement --resume
```
- ⚠️ Not implemented in v1.3.0
- Show message: "Resume feature coming in future version. For now, re-run command and manually skip completed tasks."

---

**PRIORITY 2: File References in Conversation** (Smart Auto-Detect)
If no explicit arguments, search conversation for file references from previous commands.

**Option C1: Spec File Reference (Auto-detect)**
```bash
/schovi:implement
```

**Detection Process**:
1. Acknowledge search:
   ```
   🔍 **[Implement]** No explicit arguments provided
   🔍 **[Implement]** Searching for spec file references...
   ```

2. Search conversation history (last 30 messages) for file path patterns:
   - Regex pattern: `\./spec-(?:[A-Z]+-\d+|[a-z0-9-]+)\.md`
   - Look in contexts:
     * "saved to [FILE_PATH]"
     * "Spec saved to [FILE_PATH]"
     * "Output: [FILE_PATH]"
     * Standalone mentions: "./spec-EC-1234.md"

3. If file reference found:
   ```
   ✅ **[Implement]** Found spec file reference: [FILE_PATH]
   📄 **[Implement]** Attempting to read spec...
   ```

   A. Use Read tool to load file
   B. Verify file validity:
      - Check file exists (Read succeeds)
      - Check contains spec structure:
        * Has YAML frontmatter
        * Contains "## Implementation Tasks" section
        * Has checkboxes with tasks

   C. If file valid:
      ```
      ✅ **[Implement]** Spec loaded from file ([X] lines)
      ```

      STOP here - proceed to Step 1.2 (don't search raw conversation)

   D. If file invalid or empty:
      ```
      ⚠️ **[Implement]** File found but invalid/empty
      ⏭️ **[Implement]** Falling back to conversation search...
      ```

      Continue to Option C2 (raw conversation output)

4. If NO file reference found:
   ```
   ℹ️ **[Implement]** No file references detected
   ⏭️ **[Implement]** Searching raw conversation output...
   ```

   Continue to Option C2 (raw conversation output)

**Why Priority 2?**
- Files are complete and structured (no truncation)
- Files are faster to read than parsing conversation
- Files are more reliable than extracting from messages
- When spec was saved to file, that's the source of truth

---

**PRIORITY 3: Raw Conversation Output** (Fallback)
If no explicit arguments AND no file references found, search for raw command output.

**Option C2: Conversation Context (Auto-detect fallback)**
```bash
/schovi:implement
```

**Detection Process** (only if Priority 2 failed):
1. Acknowledge search:
   ```
   🔍 **[Implement]** Searching conversation for raw spec output...
   ```

2. Search conversation history (last 30 messages) for:
   - Output from `/schovi:plan` command
   - Spec markdown with YAML frontmatter
   - Implementation tasks section with checkboxes

3. Extract most recent spec found

4. If multiple specs found:
   - Show list and ask user to choose

5. If no spec found:
   ```
   ❌ **[Implement]** No spec found in conversation

   **Suggestions**:
   1. Provide spec file path: /schovi:implement ./spec-EC-1234.md
   2. Provide Jira ID: /schovi:implement EC-1234
   3. Create spec first: /schovi:plan
   ```

   Exit with error

### Step 1.2: Parse Spec Structure

Once spec is loaded, extract key sections:

**1. Extract Metadata (YAML Frontmatter)**
```yaml
---
jira_id: EC-1234
title: "Feature description"
status: "DRAFT"
approach_selected: "Option N: Solution name"
created_date: 2025-04-11
---
```
- Store jira_id for reference
- Store title for commit messages
- Note approach_selected for context

**2. Extract Implementation Tasks**

Look for section: `## Implementation Tasks`

Parse task structure:
```markdown
## Implementation Tasks

### Phase 1: Backend Service
- [ ] Implement FeatureUpdateService in services/feature-update.ts
- [ ] Add Kafka topic feature-updates to kafka config
- [ ] Create database migration for feature_events table

### Phase 2: Integration
- [ ] Update FeatureController to publish events on changes
- [ ] Add Kafka listener in consumers/feature-consumer.ts
- [ ] Wire up dependency injection

### Phase 3: Testing & Validation
- [ ] Write unit tests for FeatureUpdateService
- [ ] Create integration test for end-to-end flow
- [ ] Manual testing checklist completion
```

**Parsing Logic**:
- Identify phase headers: `### Phase N: [Name]`
- Extract tasks as checkboxes: `- [ ] Task description`
- Preserve file:line references: `services/feature-update.ts` or `feature-update.ts:123`
- Build structured task list:
  ```json
  {
    "phases": [
      {
        "number": 1,
        "name": "Backend Service",
        "tasks": [
          {
            "description": "Implement FeatureUpdateService in services/feature-update.ts",
            "file": "services/feature-update.ts",
            "line": null
          }
        ]
      }
    ]
  }
  ```

**3. Extract Acceptance Criteria**

Look for section: `## Acceptance Criteria`

Parse criteria:
```markdown
## Acceptance Criteria

- [ ] Boolean field types are rejected during mapping validation
- [ ] Only number and text types pass validation
- [ ] Error message clearly states rejection reason
- [ ] All unit tests pass
- [ ] Integration tests cover boolean rejection scenario
- [ ] Code review approved
```

Store as checklist for validation phase.

**4. Extract Testing Strategy**

Look for sections: `## Testing Strategy` or `## Testing`

Parse testing details:
```markdown
### Unit Tests
- FieldMappingValidator.spec.ts
  - Test: Boolean type returns validation error
  - Test: Number type passes validation

### Integration Tests
- MappingController.integration.spec.ts
  - Test: POST /mapping with boolean field returns 400
```

Store test file names and scenarios for validation phase.

### Step 1.3: Detect Project Type & Validate Setup

**Project Type Detection**:

Use Glob or Read tools to detect project files:
- `package.json` → Node.js/TypeScript project
- `pyproject.toml` or `setup.py` → Python project
- `go.mod` → Go project
- `Gemfile` or `Rakefile` → Ruby project
- `Cargo.toml` → Rust project

**Validation Commands by Project Type**:

```javascript
const validationCommands = {
  nodejs: {
    lint: "npm run lint || npx eslint .",
    test: "npm test || npm run test:unit",
    typecheck: "npm run typecheck || npx tsc --noEmit"
  },
  python: {
    lint: "ruff check . || flake8 .",
    test: "pytest || python -m pytest",
    typecheck: "mypy . || echo 'mypy not configured'"
  },
  go: {
    lint: "golangci-lint run || go vet ./...",
    test: "go test ./...",
    build: "go build ./..."
  },
  ruby: {
    lint: "bundle exec rubocop || rubocop",
    test: "bundle exec rspec || rspec",
    style: "bundle exec standardrb || echo 'standardrb not configured'"
  },
  rust: {
    lint: "cargo clippy",
    test: "cargo test",
    build: "cargo build"
  }
}
```

**Verify Current Directory**:
- Run `pwd` to confirm location
- Check for `.git` directory (ensure we're in git repo)
- Optionally run `git status` to verify clean state (or note uncommitted changes)

### Step 1.4: Display Summary & Confirmation

Show parsed information to user:

```markdown
╭─────────────────────────────────────────────╮
│ 🚀 IMPLEMENTATION EXECUTOR                  │
╰─────────────────────────────────────────────╯

**Spec**: EC-1234 - Feature description
**Source**: ./spec-EC-1234.md
**Project Type**: Node.js/TypeScript

**Tasks Summary**:
- Phase 1: Backend Service (3 tasks)
- Phase 2: Integration (3 tasks)
- Phase 3: Testing & Validation (3 tasks)

**Total**: 9 implementation tasks across 3 phases

**Validation**:
- Linting: npm run lint
- Tests: npm test
- Type check: npm run typecheck

**Acceptance Criteria**: 6 criteria to verify

╭─────────────────────────────────────────────╮
│ Ready to execute with full autonomy         │
╰─────────────────────────────────────────────╯
```

**No user confirmation needed** (full autonomy mode) - proceed directly to Phase 2.

## PHASE 2: TASK EXECUTION (Phase-by-Phase)

Execute each phase sequentially. For each phase:

### Step 2.1: Phase Header

Display phase start:
```markdown
╭─────────────────────────────────────────────╮
│ 📦 PHASE 1: Backend Service                 │
╰─────────────────────────────────────────────╯
```

### Step 2.2: Execute Each Task in Phase

For each task in the phase:

**Display Task**:
```
⏳ Task 1/3: Implement FeatureUpdateService in services/feature-update.ts
```

**Analyze Task**:
- Read task description carefully
- Identify files to create/modify from description and file references
- Consider context from spec sections (Decision & Rationale, Technical Overview)
- Check if file exists (use Glob or Read)

**Execute Implementation**:

Use appropriate tools based on task:
- **New files**: Use Write tool
- **Existing files**: Use Edit tool (preferred) or Read + Write
- **Configuration changes**: Use Edit for precise modifications
- **Complex changes**: Break into multiple Edit calls

**Implementation Principles**:
- Make focused, minimal changes (don't refactor unrelated code)
- Preserve existing code style and patterns
- Add comments only for complex logic (per user's CLAUDE.md preferences)
- Use file:line references from spec when available
- If task is unclear, use best judgment based on spec context

**Example Task Execution**:
```markdown
Task: "Implement FeatureUpdateService in services/feature-update.ts"

1. Check if services/feature-update.ts exists
2. If not exists:
   - Create file with Write tool
   - Add class structure
   - Implement methods based on spec context
3. If exists:
   - Read existing file
   - Edit to add new functionality
   - Preserve existing code
```

**Update Status**:
```
✅ Task 1/3 complete: Created FeatureUpdateService with event publishing logic
```

**Handle Errors**:
- If Edit fails (old_string not found), try reading file again and adjusting
- If Write fails (file exists), switch to Edit approach
- If task is blocked (missing dependency), note it and continue to next task
- Log errors but maintain autonomy (don't ask user unless critical)

### Step 2.3: Phase Completion - Git Commit

After all tasks in phase are completed, create git commit:

**Note**: This implements simplified phase-based commits. For more advanced commit validation and analysis, see `/schovi:commit` command (branch validation, conventional commits, smart type detection).

**Commit Message Format**:
```
Phase N: [Phase Name from Spec]

- Task 1 description
- Task 2 description
- Task 3 description

Related to: [JIRA-ID if available]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Create Commit**:
```bash
git add .
git commit -m "$(cat <<'EOF'
Phase 1: Backend Service

- Implement FeatureUpdateService in services/feature-update.ts
- Add Kafka topic feature-updates to kafka config
- Create database migration for feature_events table

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Verify Commit**:
```bash
git log -1 --oneline
```

Show commit result:
```
📝 Phase 1 committed: a3b2c1d Phase 1: Backend Service
```

### Step 2.4: Continue to Next Phase

Repeat Steps 2.1-2.3 for each remaining phase.

**Phase Progress Display**:
```markdown
✅ Phase 1: Backend Service (3/3 tasks) - committed a3b2c1d
⏳ Phase 2: Integration (0/3 tasks) - in progress
⬜ Phase 3: Testing & Validation (0/3 tasks) - pending
```

## PHASE 3: VALIDATION & QUALITY GATES

After all implementation tasks are complete, run comprehensive validation.

### Step 3.1: Pre-Validation Status

Show implementation summary:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ IMPLEMENTATION COMPLETE                  │
╰─────────────────────────────────────────────╯

**Phases Completed**: 3/3
**Tasks Completed**: 9/9
**Commits Created**: 3

**Phase 1**: a3b2c1d - Backend Service
**Phase 2**: b4c5d2e - Integration
**Phase 3**: c6d7e3f - Testing & Validation

Starting validation checks...
```

### Step 3.2: Run Linting

Based on detected project type, run linter:

**Node.js/TypeScript**:
```bash
npm run lint 2>&1
```
or fallback:
```bash
npx eslint . 2>&1
```

**Python**:
```bash
ruff check . 2>&1
```
or fallback:
```bash
flake8 . 2>&1
```

**Go**:
```bash
golangci-lint run 2>&1
```
or fallback:
```bash
go vet ./... 2>&1
```

**Ruby**:
```bash
bundle exec rubocop 2>&1
```

**Rust**:
```bash
cargo clippy 2>&1
```

**Report Results**:
```markdown
🔍 Linting: npm run lint

✅ Linting passed - no issues found
```

or if failures:
```markdown
🔍 Linting: npm run lint

❌ Linting failed - 3 issues found:
  - services/feature-update.ts:45 - Unused variable 'result'
  - controllers/mapping.ts:67 - Missing semicolon
  - config/kafka.ts:12 - Prefer const over let
```

**Handle Lint Failures**:
- If auto-fixable (e.g., formatting), run auto-fix command:
  - `npm run lint -- --fix`
  - `ruff check --fix`
  - `rubocop -a`
- If not auto-fixable, attempt to fix manually:
  - Read affected files
  - Apply fixes using Edit tool
  - Re-run linter to verify
- If fixes are applied, create amend commit or new commit:
  ```bash
  git add .
  git commit -m "fix: Address linting issues"
  ```

### Step 3.3: Run Type Checking (if applicable)

For TypeScript projects:
```bash
npm run typecheck 2>&1
```
or fallback:
```bash
npx tsc --noEmit 2>&1
```

For Python with mypy:
```bash
mypy . 2>&1
```

**Report Results**:
```markdown
🔍 Type check: npm run typecheck

✅ Type check passed - no type errors
```

### Step 3.4: Run Test Suite

Based on project type, run tests:

**Node.js/TypeScript**:
```bash
npm test 2>&1
```
or specific:
```bash
npm run test:unit 2>&1
```

**Python**:
```bash
pytest 2>&1
```
or with coverage:
```bash
pytest --cov 2>&1
```

**Go**:
```bash
go test ./... 2>&1
```

**Ruby**:
```bash
bundle exec rspec 2>&1
```

**Rust**:
```bash
cargo test 2>&1
```

**Report Results**:
```markdown
🧪 Tests: npm test

✅ All tests passed
  - 24 tests run
  - 0 failed
  - Duration: 3.2s
```

or if failures:
```markdown
🧪 Tests: npm test

❌ Tests failed - 2 failing:
  - FeatureUpdateService.spec.ts
    - should publish event on update (FAILED)
    - should handle errors gracefully (FAILED)

  24 tests run, 2 failed, 22 passed
```

**Handle Test Failures**:
- Read test output carefully to understand failures
- Identify root cause (implementation bug vs test issue)
- Fix implementation if bug found:
  - Read affected source files
  - Apply fixes using Edit tool
  - Re-run tests to verify
- If tests need updates (e.g., new behavior):
  - Read test files
  - Update expectations
  - Re-run tests
- Create fix commit if changes made:
  ```bash
  git add .
  git commit -m "fix: Address test failures in FeatureUpdateService"
  ```

### Step 3.5: Verify Acceptance Criteria

Review acceptance criteria from spec and check each:

```markdown
## Acceptance Criteria Verification

From spec:
- [x] Boolean field types are rejected during mapping validation
  ✅ Verified: Implemented in FieldMappingValidator.ts:67
- [x] Only number and text types pass validation
  ✅ Verified: Type check logic added
- [x] Error message clearly states rejection reason
  ✅ Verified: Error message added to constants
- [x] All unit tests pass
  ✅ Verified: 24/24 tests passing
- [x] Integration tests cover boolean rejection scenario
  ✅ Verified: MappingController.integration.spec.ts updated
- [ ] Code review approved
  ⏳ Pending: Requires manual review (create PR next)
```

**Automatic Verification**:
- Can verify: Code changes, test results, linting, builds
- Cannot verify: Manual testing, code review, deployment

Mark automatic items as verified based on implementation and test results.

### Step 3.6: Validation Summary

Create summary of all validation results:

```markdown
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE                      │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (npm run lint)
**Type Check**: ✅ Passed (tsc --noEmit)
**Tests**: ✅ Passed (24/24 tests)
**Acceptance Criteria**: ✅ 5/6 verified (1 pending manual review)

**Commits Created**: 3 implementation + 0 fixes
**Total Changes**: +247 -12 lines across 8 files

Ready for code review and PR creation.
```

or if failures:
```markdown
╭─────────────────────────────────────────────╮
│ ⚠️  VALIDATION INCOMPLETE                   │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed
**Type Check**: ✅ Passed
**Tests**: ❌ Failed (2 failures)
**Acceptance Criteria**: ⚠️  3/6 verified

**Issues**:
- Test failures in FeatureUpdateService.spec.ts
- Unable to verify criteria dependent on tests

**Recommendation**: Review test failures and fix before proceeding.
```

## PHASE 4: COMPLETION & NEXT STEPS

### Step 4.1: Display Completion Summary

Show final summary with all results:

```markdown
╭═════════════════════════════════════════════╮
║ 🎉 IMPLEMENTATION COMPLETE                  ║
╰═════════════════════════════════════════════╯

**Specification**: EC-1234 - Reject boolean field types in mapping

**Execution Summary**:
- ✅ Phases completed: 3/3
- ✅ Tasks completed: 9/9
- ✅ Commits created: 3
- ✅ Validation: All checks passed

**Git Commits**:
1. a3b2c1d - Phase 1: Backend Service
2. b4c5d2e - Phase 2: Integration
3. c6d7e3f - Phase 3: Testing & Validation

**Validation Results**:
- ✅ Linting: Passed
- ✅ Type check: Passed
- ✅ Tests: 24/24 passing
- ✅ Acceptance criteria: 5/6 verified

**Files Changed**:
- services/FieldMappingValidator.ts
- api/controllers/MappingController.ts
- constants/errorMessages.ts
- tests/FieldMappingValidator.spec.ts
- tests/MappingController.integration.spec.ts
- migrations/003_remove_boolean_mappings.sql
```

### Step 4.2: Suggest Next Steps

Based on validation results and workflow from CLAUDE.md:

**If All Validations Passed**:
```markdown
**Next Steps**:
1. 📝 Review changes: `git diff origin/main`
2. 🔍 Manual testing: Follow testing strategy from spec
3. 🚀 Create PR: [Manual for now - PR automation coming in v1.4.0]
4. 👥 Request code review from team
5. ✅ Address review feedback
6. 🎯 Merge and deploy

**Manual Testing** (from spec):
- Create mapping with boolean field via UI → See error
- Create mapping with number field → Success
- Verify error message displays correctly

**PR Description Template**:
Use structured format from CLAUDE.md:
- Problem: [Copy from spec]
- Solution: [Copy approach from spec]
- Changes: [List major changes]
- Other: [Testing notes, deployment considerations]
```

**If Validations Failed**:
```markdown
**Next Steps**:
1. ⚠️  Fix validation issues first
2. 📝 Review failed tests: [list test files]
3. 🔧 Address linting errors: [list errors]
4. ♻️  Re-run validation: `npm test && npm run lint`
5. 💾 Commit fixes when ready

**Issues to Address**:
- [List specific issues from validation]

**Once Fixed**:
Re-run `/schovi:implement --resume` [when supported] or manually complete remaining tasks.
```

### Step 4.3: Completion Signal

Run confetti command as per CLAUDE.md:
```bash
open "raycast://extensions/raycast/raycast/confetti"
```

Display final message:
```markdown
╭─────────────────────────────────────────────╮
│ 🎊 Implementation workflow complete!        │
╰─────────────────────────────────────────────╯
```

## QUALITY GATES CHECKLIST

Before declaring implementation complete, verify:

- [ ] Spec successfully parsed (tasks, criteria, testing strategy extracted)
- [ ] Project type correctly detected
- [ ] All phases executed in order
- [ ] All tasks attempted (mark blocked tasks explicitly)
- [ ] Phase-based commits created with descriptive messages
- [ ] Linting ran and passed (or auto-fixed)
- [ ] Type checking ran and passed (if applicable)
- [ ] Test suite ran and passed
- [ ] Acceptance criteria verified (automatic ones)
- [ ] File changes are focused and minimal
- [ ] No unrelated refactoring introduced
- [ ] Completion summary displayed
- [ ] Next steps suggested to user
- [ ] Confetti command executed

## ERROR HANDLING & EDGE CASES

### Spec Not Found
```markdown
❌ Error: Could not find specification

**Tried**:
- File path: ./spec-EC-1234.md (not found)
- Jira issue: EC-1234 (no spec in comments)
- Conversation history: No recent spec output

**Suggestions**:
1. Create spec first: `/schovi:plan EC-1234`
2. Provide correct file path: `/schovi:implement path/to/spec.md`
3. Ensure spec was posted to Jira with `--post-to-jira` flag
```

### Spec Malformed
```markdown
⚠️  Warning: Spec structure incomplete

**Found**:
- YAML frontmatter: ✅
- Implementation tasks: ❌ Missing

**Problem**: Could not find "## Implementation Tasks" section in spec.

**Suggestion**: Ensure spec follows template from `/schovi/templates/spec-template.md`

Continue with limited information? [Ask user]
```

### Project Type Unknown
```markdown
⚠️  Warning: Could not detect project type

**Checked for**:
- package.json (Node.js)
- pyproject.toml (Python)
- go.mod (Go)
- Gemfile (Ruby)
- Cargo.toml (Rust)

**Not found**: No standard project files detected.

**Impact**: Cannot run automatic linting and testing.

**Options**:
1. Run validation manually after implementation
2. Specify validation commands via flags [future feature]
3. Continue without validation (not recommended)

Continue without validation? [Ask user]
```

### Task Execution Failure
```markdown
⚠️  Task execution issue

**Task**: Implement FeatureUpdateService in services/feature-update.ts
**Error**: File services/ directory does not exist

**Action**: Attempting to create directory structure...

✅ Created services/ directory
✅ Retrying task execution...
```

### Validation Failures
```markdown
❌ Validation failed - implementation has issues

**Linting**: ✅ Passed
**Tests**: ❌ Failed (2 test failures)

**Failed Tests**:
- FeatureUpdateService.spec.ts:45 - Expected true but got false
- FeatureUpdateService.spec.ts:67 - TypeError: Cannot read property 'publish'

**Attempted Fix**: [Describe what was tried]
**Result**: [Success/Still failing]

**Recommendation**:
- Review test expectations against implementation
- Check if test fixtures need updating
- Consider if spec requirements were ambiguous

Manual intervention may be needed.
```

### Git Issues
```markdown
⚠️  Git warning

**Issue**: Uncommitted changes detected before starting

**Current Status**:
- Modified: 3 files
- Untracked: 1 file

**Options**:
1. Stash changes and proceed: `git stash`
2. Commit existing changes first: `git commit -am "WIP"`
3. Continue anyway (changes may conflict)

How to proceed? [Ask user]
```

### Incomplete Phase
```markdown
⚠️  Phase partially complete

**Phase 2**: Integration (2/3 tasks completed)
**Incomplete Task**: "Wire up dependency injection"

**Reason**: Could not locate dependency injection configuration file

**Action Taken**: Skipped task, added TODO comment in relevant file

**Note**: Manual completion may be required for this task.

Continue to next phase? [Yes - full autonomy mode]
```

## COMMAND FLAGS (Future Enhancements)

Document planned flags for future versions:

### --resume (Planned v1.4.0)
Resume implementation from last checkpoint
```bash
/schovi:implement --resume
```

### --only-phase (Planned v1.4.0)
Execute specific phase only
```bash
/schovi:implement --only-phase 2
```

### --skip-validation (Planned v1.4.0)
Skip validation phase
```bash
/schovi:implement --skip-validation
```

### --commit-strategy (Planned v1.4.0)
Change commit granularity
```bash
/schovi:implement --commit-strategy per-task
```
Options: per-phase (default), per-task, single

### --publish (Planned v1.4.0)
Auto-create PR after successful implementation
```bash
/schovi:implement --publish
```

### --update-jira (Planned v1.4.0)
Update Jira status during implementation
```bash
/schovi:implement --update-jira
```

## NOTES FOR IMPLEMENTATION

**Model Selection**: Use Haiku model for efficiency
- Haiku can handle spec parsing (~500-1000 tokens)
- Sequential task execution maintains context
- Cost-effective for autonomous execution

**Context Management**:
- Keep spec content in context throughout execution
- Reference spec sections when making decisions
- Don't reload spec unnecessarily

**User Experience**:
- Show progress frequently (don't go silent for long periods)
- Use visual formatting (boxes, emojis) for key milestones
- Provide clear status updates per task
- Celebrate completion with confetti

**Error Recovery**:
- Try to auto-fix when possible (linting, formatting)
- Continue execution even if some tasks fail (full autonomy)
- Document failures clearly in summary
- Provide actionable next steps

**Git Best Practices**:
- Phase-based commits keep history clean
- Descriptive commit messages reference spec
- Include Jira ID in commit for traceability
- Use conventional commit format (feat:, fix:) for amendments

**Testing Philosophy**:
- Run full test suite, not just affected tests
- Attempt to fix test failures automatically
- Document when manual intervention is needed
- Don't skip validation even if time-consuming

## SUCCESS METRICS

Implementation is successful when:
- ✅ All implementation tasks completed or explicitly marked blocked
- ✅ Phase-based commits created with clear messages
- ✅ Linting passes (or issues auto-fixed)
- ✅ Tests pass (or failures documented with attempted fixes)
- ✅ Acceptance criteria verified (automatic ones)
- ✅ Clear summary provided with next steps
- ✅ User can immediately proceed to PR creation/review

Implementation requires follow-up when:
- ⚠️  Some tasks blocked due to missing dependencies
- ⚠️  Validation failures that couldn't be auto-fixed
- ⚠️  Spec ambiguities that required assumptions
- ⚠️  Manual testing required before PR
- ⚠️  External dependencies need configuration

## EXAMPLES

### Example 1: Full Successful Execution

```bash
/schovi:implement ./spec-EC-1234.md
```

**Output**:
```markdown
╭─────────────────────────────────────────────╮
│ 🚀 IMPLEMENTATION EXECUTOR                  │
╰─────────────────────────────────────────────╯

**Spec**: EC-1234 - Reject boolean field types in mapping
**Source**: ./spec-EC-1234.md
**Project Type**: Node.js/TypeScript
**Tasks**: 9 tasks across 3 phases

╭─────────────────────────────────────────────╮
│ 📦 PHASE 1: Backend Service                 │
╰─────────────────────────────────────────────╯

⏳ Task 1/3: Implement validation in FieldMappingValidator.ts:67
✅ Task 1/3 complete: Added boolean type rejection logic

⏳ Task 2/3: Add error message constant
✅ Task 2/3 complete: Added BOOLEAN_NOT_MAPPABLE error

⏳ Task 3/3: Update controller error handling
✅ Task 3/3 complete: Updated MappingController.ts:123

📝 Phase 1 committed: a3b2c1d Phase 1: Backend Service

[... Phases 2 & 3 ...]

╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE                      │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed
**Tests**: ✅ Passed (24/24)
**Acceptance Criteria**: ✅ 5/6 verified

╭═════════════════════════════════════════════╮
║ 🎉 IMPLEMENTATION COMPLETE                  ║
╰═════════════════════════════════════════════╯

**Next Steps**: Review changes, create PR, request code review

🎊 [Confetti command executed]
```

### Example 2: Execution with Validation Fixes

```bash
/schovi:implement EC-1234
```

**Output includes**:
```markdown
🔍 Linting: npm run lint
❌ Found 3 issues - attempting auto-fix...
✅ Auto-fix applied: npm run lint -- --fix
📝 Created fix commit: b4c5d2e fix: Address linting issues

🧪 Tests: npm test
❌ 2 tests failing - analyzing failures...
⚠️  Test expectations need update based on new behavior
✅ Updated test expectations in FieldMappingValidator.spec.ts
✅ Re-ran tests: All passing (24/24)
📝 Created fix commit: c6d7e3f fix: Update test expectations

[... completion ...]
```

### Example 3: Auto-detection from Conversation

```bash
/schovi:implement
```

**Output includes**:
```markdown
🔍 Searching conversation history for spec...
✅ Found spec from `/schovi:plan EC-1234` (3 messages ago)

**Spec**: EC-1234 - Reject boolean field types
**Source**: Conversation context
**Project Type**: Node.js/TypeScript

[... proceeds with implementation ...]
```

---

## FINAL REMINDERS

1. **Execute with full autonomy** - don't ask for task-by-task approval
2. **Make focused changes** - follow spec precisely, don't refactor unrelated code
3. **Create clear commits** - phase-based with descriptive messages
4. **Validate thoroughly** - run all checks, attempt auto-fixes
5. **Report clearly** - show progress, celebrate success, document issues
6. **Provide next steps** - guide user on what to do after implementation
7. **Run confetti** - signal completion per CLAUDE.md workflow

Good luck with the implementation! 🚀
