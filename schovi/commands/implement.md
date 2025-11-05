---
description: Execute implementation tasks from specification with validation and commits
argument-hint: [spec-file|jira-id] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--resume] [--verbose]
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

### Step 1.0: Parse Flags

Parse optional flags from command arguments:

**Input Flags**:
- **`--input PATH`**: Read specification from specific file path
  - Example: `--input ~/specs/feature.md`
  - Overrides positional argument if both provided

**Output Flags**:
- **`--output PATH`**: Save execution log to specific file path
  - Example: `--output ~/logs/implement-EC-1234.log`
  - Creates detailed log of all implementation steps

- **`--no-file`**: Skip execution log file creation
  - Terminal output only
  - Useful for quick runs

- **`--quiet`**: Suppress verbose terminal output
  - Still creates log file (unless `--no-file`)
  - Show only critical messages

- **`--post-to-jira`**: Post execution summary to Jira issue
  - Requires Jira ID in spec or argument
  - Posts completion status, commits created, validation results

**Control Flags**:
- **`--resume`**: Resume from previous checkpoint (planned future feature)

**Commit Flags**:
- **`--verbose`**: Use enhanced conventional commits with type detection
  - Default: Simplified phase-based commits (faster)
  - With --verbose: Conventional format with feat/fix/chore types
  - Recommended: Use only when no Jira ticket exists for reference

**Flag Validation**:

Validate flag combinations and provide clear error messages:

**1. Conflicting Output Flags**:

If `--output PATH` AND `--no-file` both present:
```markdown
❌ Error: Conflicting flags

**Conflict**: --output and --no-file cannot be used together

**Explanation**:
- --output PATH: Creates execution log at specified path
- --no-file: Skips log file creation entirely

**Resolution**:
1. Remove --no-file to create log at custom path:
   /schovi:implement spec.md --output ./logs/run.log

2. Remove --output to skip log file creation:
   /schovi:implement spec.md --no-file

3. Use neither flag to create log at default location:
   /schovi:implement spec.md
   (creates ./implement-[id]-[timestamp].log)
```
**Action**: Stop execution, display error, exit.

---

**2. No Output Combination**:

If `--quiet` AND `--no-file` both present:
```markdown
⚠️  Warning: No output will be generated

**Configuration**:
- --quiet: Suppresses terminal output
- --no-file: Skips log file creation

**Result**: You will see only error messages during execution. No verbose progress updates, no log file saved.

**Is this intentional?**
- Yes: Press Enter to continue
- No: Cancel (Ctrl+C) and remove one flag

**Recommendation**: Use --quiet alone to still create log file for later review.
```
**Action**: Display warning, ask for confirmation, proceed if confirmed.

---

**3. Jira Posting Without ID**:

If `--post-to-jira` present but no Jira ID found (in argument or spec):
```markdown
⚠️  Warning: Cannot post to Jira

**Issue**: --post-to-jira flag present but no Jira ID available

**Checked**:
- Command argument: No Jira ID provided
- Spec frontmatter: No jira_id field found

**Impact**: Execution will proceed but summary will NOT be posted to Jira

**To fix**:
1. Provide Jira ID as argument:
   /schovi:implement EC-1234 --post-to-jira

2. Add jira_id to spec frontmatter:
   ---
   jira_id: EC-1234
   ---

3. Remove --post-to-jira flag if not needed

**Continuing without Jira posting...**
```
**Action**: Display warning, skip Jira posting, continue execution.

---

**4. Resume Without Checkpoint**:

If `--resume` present but no checkpoint file exists:
```markdown
❌ Error: No checkpoint file found

**Issue**: --resume flag present but .implement-checkpoint.json does not exist

**Checked locations**:
- Current directory: /Users/user/project/.implement-checkpoint.json
- Not found

**Possible reasons**:
1. No previous implementation run in this directory
2. Checkpoint file was deleted manually
3. Running in wrong directory

**Resolution**:
1. Start fresh implementation (without --resume):
   /schovi:implement spec.md

2. Check if you're in correct directory:
   pwd
   ls -la .implement-checkpoint.json

3. If previous run was interrupted, checkpoint may not exist yet

**Note**: --resume is a v2.0 feature (coming soon)
```
**Action**: Stop execution, display error, exit.

---

**5. Unknown Flags**:

If unrecognized flag present (e.g., `--invalid-flag`):
```markdown
⚠️  Warning: Unknown flag detected

**Unknown flag**: --invalid-flag

**Valid flags**:
- Input: --input PATH
- Output: --output PATH, --no-file, --quiet
- Jira: --post-to-jira
- Control: --resume (v2.0)
- Commit: --verbose

**Action**: Ignoring unknown flag, continuing with valid flags

**Did you mean**:
- --input (for input file)
- --verbose (for detailed commits)
```
**Action**: Display warning, ignore unknown flag, continue execution.

---

**6. Positional + --input Flag**:

If both positional argument AND `--input` flag provided:
```markdown
ℹ️  Note: Multiple input sources provided

**Positional argument**: ./spec-v1.md
**--input flag**: ./spec-v2.md

**Resolution**: --input flag takes precedence over positional argument

**Using**: ./spec-v2.md (from --input flag)
```
**Action**: Display info message, use `--input` value, continue.

**Storage for Later Phases**:
```
input_path = [--input PATH] or [null]
output_log_path = [--output PATH] or [default: ./implement-[jira-id]-[timestamp].log] or [null if --no-file]
terminal_verbose = true (unless --quiet)
post_to_jira = [true if --post-to-jira]
verbose_commits = [true if --verbose] or [false (default)]
```

### Step 1.1: Resolve Spec Source

Parse the command argument to determine spec source (in priority order):

---

**PRIORITY 1: Explicit Arguments** (Highest Priority)
Parse arguments first. If any explicit input provided, use it immediately.

**Option A: File Path Provided**
```bash
/schovi:implement ./spec-EC-1234.md
/schovi:implement specs/feature-update.md
/schovi:implement --input ./spec-EC-1234.md
```
- Use Read tool to load spec from provided path (positional or --input flag)
- `--input` flag overrides positional argument if both provided
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

**Flexible Section Detection**:

Use robust pattern matching to find the tasks section. Try patterns in order:

1. **Full h2 header**: `## Implementation Tasks`
2. **Full h1 header**: `# Implementation Tasks`
3. **Shortened h2**: `## Implementation` (exact match)
4. **Shortened h1**: `# Implementation` (exact match)
5. **Task h2**: `## Tasks`
6. **Task h1**: `# Tasks`
7. **Singular variants**: `## Implementation Task`, `# Implementation Task`, `## Task`, `# Task`

If section not found, display error with helpful message:
```markdown
❌ Error: Could not find Implementation Tasks section

**Searched for patterns**:
- ## Implementation Tasks
- # Implementation Tasks
- ## Implementation
- # Implementation
- ## Tasks / # Tasks

**Found sections in spec**:
- ## Problem Summary
- ## Technical Overview
- ## Acceptance Criteria

**Suggestions**:
1. Add "## Implementation Tasks" section to spec
2. Verify spec file is complete
3. Check for typos in section headers
```

**Parse Task Structure**:

Once section found, parse two possible structures:

**Structure A: Phased Tasks** (standard format):
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

**Structure B: Flat Task List** (simple format, no phases):
```markdown
## Implementation Tasks

- [ ] Implement FeatureUpdateService in services/feature-update.ts
- [ ] Add Kafka topic feature-updates to kafka config
- [ ] Update FeatureController to publish events on changes
- [ ] Write unit tests for FeatureUpdateService
- [ ] Create integration test for end-to-end flow
```

**Parsing Logic**:

1. **Detect structure type**:
   - Check for `### Phase N:` pattern → Structure A (phased)
   - If not found, check for flat `- [ ]` tasks → Structure B (flat)
   - If neither found → Error

2. **For Structure A** (phased):
   - Identify phase headers: `### Phase N: [Name]`
   - Extract tasks under each phase: `- [ ] Task description`
   - Preserve file:line references: `services/feature-update.ts` or `feature-update.ts:123`

3. **For Structure B** (flat):
   - Extract all tasks: `- [ ] Task description`
   - Create single phase named "Implementation"
   - Preserve file:line references

4. **Build structured task list**:
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

5. **Display parsing summary**:
   ```markdown
   ✅ Parsed Implementation Tasks
   - Structure: Phased (3 phases)
   - Total tasks: 9
   ```
   or for flat:
   ```markdown
   ✅ Parsed Implementation Tasks
   - Structure: Flat (single phase)
   - Total tasks: 5
   ⚠️  Note: Tasks will be executed in a single phase named "Implementation"
   ```

**3. Extract Acceptance Criteria**

**Flexible Section Detection**:

Try patterns in order:
1. `## Acceptance Criteria`
2. `# Acceptance Criteria`
3. `## Acceptance`
4. `# Acceptance`

If section not found:
```markdown
⚠️  Warning: No Acceptance Criteria section found

**Impact**: Cannot verify automatic acceptance criteria during validation.
**Continuing**: Will validate code quality (linting, tests) only.
```

Parse criteria (if found):
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

**Flexible Section Detection**:

Try patterns in order:
1. `## Testing Strategy`
2. `# Testing Strategy`
3. `## Testing`
4. `# Testing`
5. `## Tests`
6. `# Tests`

If section not found:
```markdown
⚠️  Warning: No Testing Strategy section found

**Impact**: Will run project's standard test suite without test file guidance.
**Continuing**: Validation will use auto-detected test commands.
```

Parse testing details (if found):
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

**Task Complexity Estimation**:

Before displaying task, estimate complexity for progress visibility:

- **Simple** (<5s expected): Single file creation/edit, config changes, small modifications
- **Moderate** (5-30s): Multiple file changes, moderate logic, database migrations
- **Complex** (>30s): Large file generation, multiple integrations, extensive refactoring

**Display Task (with timestamp for complex tasks)**:

For simple/moderate tasks:
```
⏳ Task 1/3: Implement FeatureUpdateService in services/feature-update.ts
```

For complex tasks (>30s expected):
```
⏳ Task 1/3: Generate large migration file with 500+ rows
🕐 Started: 14:23:45
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

---

**Progress Updates for Complex Tasks** (>30s):

While executing complex tasks, display periodic updates every 15-20 seconds:

**Activity Descriptions by Task Type**:

- **File creation**: "Generating code structure...", "Writing class implementations...", "Adding method definitions..."
- **File editing**: "Analyzing existing code...", "Applying modifications...", "Preserving compatibility..."
- **Migration files**: "Generating SQL statements...", "Creating rollback logic...", "Validating schema changes..."
- **Test files**: "Creating test cases...", "Setting up test fixtures...", "Adding assertions..."
- **Configuration**: "Updating config values...", "Merging settings...", "Validating configuration..."
- **Integration**: "Wiring dependencies...", "Connecting services...", "Establishing communication..."

**Progress Update Format**:
```
⏰ Still working on task (15s elapsed): Generating code structure...
```

After 30s:
```
⏰ Still working on task (30s elapsed): Writing class implementations...
```

After 45s:
```
⏰ Still working on task (45s elapsed): Adding method definitions...
```

**Activity Context**: Choose description based on current execution step:
- During Write tool: Use "Generating..." or "Writing..." activity
- During Read tool: Use "Analyzing..." activity
- During Edit tool: Use "Applying..." or "Modifying..." activity
- Between tools: Use "Preparing..." or "Processing..." activity

---

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

**Update Status (with duration for complex tasks)**:

For simple/moderate tasks:
```
✅ Task 1/3 complete: Created FeatureUpdateService with event publishing logic
```

For complex tasks:
```
✅ Task 1/3 complete: Generated large migration file (Duration: 47s)
```

**Handle Errors**:
- If Edit fails (old_string not found), try reading file again and adjusting
- If Write fails (file exists), switch to Edit approach
- If task is blocked (missing dependency), note it and continue to next task
- Log errors but maintain autonomy (don't ask user unless critical)
- **For complex tasks with errors**: Display error context with elapsed time
  ```
  ⚠️  Task 1/3 error after 23s: File write permission denied for services/feature-update.ts
  ```

### Step 2.3: Phase Completion - Git Commit

After all tasks in phase are completed, create git commit.

**Commit Mode Selection**:

Choose commit format based on flags and context:

1. **Check for `--verbose` flag** (from Step 1.0):
   - If `verbose_commits == true`: Use **Enhanced Mode**
   - If `verbose_commits == false`: Use **Simplified Mode** (default)

2. **Commit Mode Comparison**:

| Aspect | Simplified Mode (Default) | Enhanced Mode (--verbose) |
|--------|---------------------------|---------------------------|
| **Format** | Phase-based | Conventional commits |
| **Title** | `Phase N: Name` | `type: Description` |
| **Type Detection** | None | feat/fix/chore/refactor/docs/test |
| **Analysis Overhead** | None (~1s) | Diff analysis (~5-10s) |
| **Use Case** | Standard workflow with Jira | No Jira ticket, need detailed history |
| **Example** | `Phase 1: Backend Service` | `feat: Implement event publishing service` |

**Simplified Mode (Default)**:

Used when `verbose_commits == false` (default behavior).

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

**Simplified Mode Create Commit**:
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

---

**Enhanced Mode (--verbose)**:

Used when `verbose_commits == true` (via `--verbose` flag).

**Process**:
1. **Analyze Git Diff**: Run `git diff --cached` to examine staged changes
2. **Detect Commit Type**: Based on file paths and changes:
   - **feat**: New files in `src/`, `lib/`, `services/`, new features
   - **fix**: Changes to existing files fixing bugs, error handling
   - **chore**: Config files, dependencies, build files, migrations
   - **refactor**: Code restructuring without behavior change
   - **docs**: Documentation files (*.md, comments)
   - **test**: Test files, spec files
   - **style**: Formatting, linting fixes
3. **Generate Conventional Message**: Format with type, description, bullets

**Enhanced Mode Message Format**:
```
type: Title (50-72 chars, present tense)

Description paragraph explaining what changed and why
(derived from phase context and spec)

- Specific change 1
- Specific change 2
- Specific change 3

Related to: [JIRA-ID if available]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Enhanced Mode Create Commit**:
```bash
git add .

# Analyze diff for type detection
git diff --cached > /tmp/phase-diff.txt

# Determine type (logic above)
# Generate message with analysis

git commit -m "$(cat <<'EOF'
feat: Implement event publishing service

Add FeatureUpdateService to handle feature change events with Kafka
integration for downstream consumers.

- Implement FeatureUpdateService in services/feature-update.ts
- Add Kafka topic configuration for feature-updates
- Create database migration for feature_events table

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Type Detection Heuristics**:
- New service/controller/model files → **feat**
- Bug fix keywords in task descriptions → **fix**
- Config/build/migration files only → **chore**
- Renames/moves without logic changes → **refactor**
- Test files only → **test**
- Markdown/comment changes only → **docs**

---

**Verify Commit** (both modes):
```bash
git log -1 --oneline
```

Show commit result:
```
📝 Phase 1 committed: a3b2c1d Phase 1: Backend Service
```
(or with --verbose: `📝 Phase 1 committed: a3b2c1d feat: Implement event publishing service`)

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

**Retry Logic**: Max 2 attempts with auto-fix and manual repair.

**Attempt Tracking**:
```
max_attempts = 2
current_attempt = 1
```

**Attempt 1: Initial Linting Run**

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

**Report Results (Attempt 1)**:
```markdown
🔍 Attempt 1/2: Linting (npm run lint)

✅ Linting passed - no issues found
```

**If Attempt 1 Passes**: Skip Attempt 2, mark complete, move to Step 3.3.

**If Attempt 1 Fails**:
```markdown
🔍 Attempt 1/2: Linting (npm run lint)

❌ Linting failed - 3 issues found:
  - services/feature-update.ts:45 - Unused variable 'result'
  - controllers/mapping.ts:67 - Missing semicolon
  - config/kafka.ts:12 - Prefer const over let

⏭️  Proceeding to Attempt 2 (Auto-Fix)...
```

---

**Attempt 2: Auto-Fix or Manual Repair**

**Strategy**:
1. Try auto-fix command first (if available)
2. If auto-fix fails or unavailable, attempt manual fixes
3. Re-run linting to verify

**Auto-Fix Commands**:
- **Node.js/TypeScript**: `npm run lint -- --fix` or `npx eslint . --fix`
- **Python**: `ruff check --fix` or `autopep8 --in-place --recursive .`
- **Ruby**: `bundle exec rubocop -a`
- **Rust**: `cargo clippy --fix --allow-dirty`
- **Go**: (no auto-fix, skip to manual)

**Report Attempt 2**:
```markdown
🔍 Attempt 2/2: Linting (Auto-Fix)

Running: npm run lint -- --fix
```

**Auto-Fix Execution**:
```bash
npm run lint -- --fix 2>&1
```

**Re-run Linting**:
```bash
npm run lint 2>&1
```

**If Attempt 2 Passes**:
```markdown
✅ Linting passed (after auto-fix)

📝 Creating fix commit...
```

Create fix commit:
```bash
git add .
git commit -m "fix: Address linting issues (auto-fix)"
```

**If Attempt 2 Fails** (auto-fix didn't resolve all issues):

Try manual fixes for remaining issues:
1. Parse error output to identify files and issues
2. For each fixable issue:
   - Read affected file
   - Apply fix using Edit tool (if straightforward)
3. Re-run linting

**Re-run Linting After Manual Fixes**:
```bash
npm run lint 2>&1
```

**If Manual Fixes Succeed**:
```markdown
✅ Linting passed (after manual fixes)

📝 Creating fix commit...
```

**If Still Failing After 2 Attempts**:
```markdown
⚠️  Linting incomplete (2/2 attempts)

❌ Remaining issues (3):
  - services/feature-update.ts:45 - Unused variable 'result'
  - controllers/mapping.ts:67 - Missing semicolon
  - config/kafka.ts:12 - Prefer const over let

**Status**: Marked incomplete, continuing validation
**Note**: Manual intervention required before PR creation
```

Mark validation status as `incomplete` but continue to next step.

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

**Retry Logic**: Max 2 attempts with analysis and fixes.

**Attempt Tracking**:
```
max_attempts = 2
current_attempt = 1
```

**Attempt 1: Initial Test Run**

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

**Report Results (Attempt 1)**:
```markdown
🧪 Attempt 1/2: Tests (npm test)

✅ All tests passed
  - 24 tests run
  - 0 failed
  - Duration: 3.2s
```

**If Attempt 1 Passes**: Skip Attempt 2, mark complete, move to Step 3.5.

**If Attempt 1 Fails**:
```markdown
🧪 Attempt 1/2: Tests (npm test)

❌ Tests failed - 2 failing:
  - FeatureUpdateService.spec.ts
    - should publish event on update (FAILED)
    - should handle errors gracefully (FAILED)

  24 tests run, 2 failed, 22 passed

⏭️  Proceeding to Attempt 2 (Analysis & Fixes)...
```

---

**Attempt 2: Analysis & Fixes**

**Strategy**:
1. Analyze test output to understand failure root cause
2. Determine if implementation bug or test expectation issue
3. Apply appropriate fixes (implementation or tests)
4. Re-run tests to verify

**Analysis Process**:

1. **Read Test Output Carefully**:
   - Identify specific assertions that failed
   - Note expected vs. actual values
   - Check for error messages or stack traces

2. **Determine Root Cause**:
   - **Implementation Bug**: Logic error, missing functionality, incorrect behavior
   - **Test Issue**: Outdated expectations, incorrect fixtures, missing test setup

3. **Apply Fixes**:

   **If Implementation Bug**:
   - Read affected source files
   - Identify bug location
   - Apply fix using Edit tool
   - Document fix reason

   **If Test Issue**:
   - Read test files
   - Update expectations to match new behavior
   - Fix test fixtures or setup
   - Document change reason

**Report Attempt 2**:
```markdown
🧪 Attempt 2/2: Tests (Analysis & Fixes)

📊 Analyzing failures...
  - FeatureUpdateService.spec.ts:45: Expected event.type to be 'update', got 'feature_update'
  - FeatureUpdateService.spec.ts:67: Expected publish to be called, but was not

🔍 Root cause: Implementation bug - incorrect event type constant

📝 Applying fixes...
```

**Apply Fixes**:
- Use Edit tool to fix identified issues
- Make minimal, targeted changes

**Re-run Tests**:
```bash
npm test 2>&1
```

**If Attempt 2 Passes**:
```markdown
✅ Tests passed (after fixes)
  - 24 tests run
  - 0 failed
  - Duration: 3.4s

📝 Creating fix commit...
```

Create fix commit:
```bash
git add .
git commit -m "fix: Address test failures in FeatureUpdateService"
```

**If Attempt 2 Fails** (fixes didn't resolve all issues):

```markdown
⚠️  Tests incomplete (2/2 attempts)

❌ Remaining failures (1):
  - FeatureUpdateService.spec.ts
    - should handle errors gracefully (FAILED)
    - Error: Timeout - async operation did not complete

**Analysis**: Test appears to have timing/async issue requiring deeper investigation

**Status**: Marked incomplete, continuing validation
**Note**: Manual debugging required before PR creation
```

Document failures with:
- Specific test names
- Failure reasons
- Analysis notes
- Recommendations for resolution

Mark validation status as `incomplete` but continue to next step.

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

Create summary of all validation results with attempt history:

**Success Scenario**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE                      │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (Attempt 1/2, npm run lint)
**Type Check**: ✅ Passed (tsc --noEmit)
**Tests**: ✅ Passed (Attempt 1/2, 24/24 tests)
**Acceptance Criteria**: ✅ 5/6 verified (1 pending manual review)

**Commits Created**: 3 implementation + 0 fixes
**Total Changes**: +247 -12 lines across 8 files

Ready for code review and PR creation.
```

**Partial Success with Fixes**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE (with fixes)         │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (Attempt 2/2, auto-fix applied)
**Type Check**: ✅ Passed (tsc --noEmit)
**Tests**: ✅ Passed (Attempt 2/2, fixed 2 issues)
**Acceptance Criteria**: ✅ 5/6 verified (1 pending manual review)

**Commits Created**: 3 implementation + 2 fixes
**Total Changes**: +251 -13 lines across 8 files

**Fix Details**:
- Linting: Auto-fix resolved formatting issues
- Tests: Fixed event type constant and test expectations

Ready for code review and PR creation.
```

**Incomplete Validation**:
```markdown
╭─────────────────────────────────────────────╮
│ ⚠️  VALIDATION INCOMPLETE                   │
╰─────────────────────────────────────────────╯

**Linting**: ⚠️  Incomplete (2/2 attempts, 3 issues remain)
**Type Check**: ✅ Passed (tsc --noEmit)
**Tests**: ❌ Failed (2/2 attempts, 2 failures remain)
**Acceptance Criteria**: ⚠️  3/6 verified

**Issues**:
- Linting (3 remaining):
  - services/feature-update.ts:45 - Unused variable 'result'
  - controllers/mapping.ts:67 - Missing semicolon
  - config/kafka.ts:12 - Prefer const over let
- Tests (2 failures):
  - FeatureUpdateService.spec.ts: async timeout issue
  - MappingController.spec.ts: assertion mismatch

**Commits Created**: 3 implementation + 1 partial fix
**Total Changes**: +249 -12 lines across 8 files

**Recommendation**:
- Fix remaining linting issues manually
- Debug test failures (check async handling)
- Re-run validation before creating PR
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
3. 🚀 Create PR with `/schovi:publish` command:
   - Run: `/schovi:publish` (auto-detects from branch name)
   - Or: `/schovi:publish EC-1234` (explicit Jira ID)
   - Or: `/schovi:publish --spec ./spec-EC-1234.md` (explicit spec)
   - Automatically pushes branch with upstream tracking
   - Creates draft PR by default (use `--ready` for ready PR)
   - Generates description from spec file → Jira issue → commit history
   - Use `--base BRANCH` to target different base branch (default: main)
4. 👥 Request code review from team
5. ✅ Address review feedback
6. 🎯 Merge and deploy

**Manual Testing** (from spec):
- Create mapping with boolean field via UI → See error
- Create mapping with number field → Success
- Verify error message displays correctly

**PR Creation Tips**:
- `/schovi:publish` uses spec file for best description quality
- Draft PRs allow further changes before requesting review
- Update existing PR by running command again on same branch
- See PR URL in output after creation
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

### Step 4.3: Output Handling

Handle execution log output based on flags from Step 1.0:

**If `output_log_path != null`** (default, unless `--no-file`):

1. Determine log filename:
   - If `--output PATH` specified: Use provided path
   - Else: `./implement-[JIRA-ID]-[YYYY-MM-DD-HHMMSS].log`

2. Collect execution log content:
   ```markdown
   # Implementation Execution Log
   **Date**: [Current timestamp]
   **Spec**: [Spec title]
   **Jira**: [JIRA-ID or N/A]

   ## Execution Summary
   [Copy from Step 4.1 summary]

   ## Task Execution Details
   [All task execution logs from Phase 2]

   ## Validation Results
   [All validation output from Phase 3]

   ## Git Commits
   [List of all commits created]

   ## Next Steps
   [Copy from Step 4.2 suggestions]
   ```

3. Write log to file using Write tool:
   - Full execution log with all details
   - Preserve formatting and timestamps

4. Acknowledge file creation:
   ```
   📄 **[Implement]** Execution log saved to: [filename]
   ```

**If `--no-file` flag present**:
- Skip log file creation entirely

**If `post_to_jira == true`** (from `--post-to-jira` flag):

1. Check if Jira ID exists (from spec or argument):
   - If NO Jira ID: Warn user and skip
     ```
     ⚠️ **[Implement]** Cannot post to Jira: No Jira ID available
     ```
   - If Jira ID exists: Proceed

2. Format execution summary for Jira:
   ```markdown
   **Implementation Completed - Claude Code**

   ✅ **Status**: Implementation complete

   **Phases Completed**: 3/3
   **Tasks Completed**: 9/9
   **Commits Created**: 3

   **Git Commits**:
   - a3b2c1d - Phase 1: Backend Service
   - b4c5d2e - Phase 2: Integration
   - c6d7e3f - Phase 3: Testing & Validation

   **Validation**:
   - ✅ Linting: Passed
   - ✅ Tests: 24/24 passing
   - ✅ Acceptance criteria: 5/6 verified

   **Next Steps**: Review changes, create PR, request code review

   Generated by Claude Code Implementation Executor
   ```

3. Post to Jira using mcp__jira__addCommentToJiraIssue:
   ```
   cloudId: "productboard.atlassian.net"
   issueIdOrKey: [Jira ID from spec]
   commentBody: [formatted summary]
   ```

4. Acknowledge posting:
   ```
   ✅ **[Implement]** Execution summary posted to Jira: [JIRA-ID]
   ```

5. If posting fails:
   ```
   ⚠️ **[Implement]** Failed to post to Jira: [error message]
   ```
   Continue anyway (don't halt workflow)

**If `--post-to-jira` flag NOT present**:
- Skip Jira posting entirely

### Step 4.4: Completion Signal

Execute confetti command as per CLAUDE.md:

Use Bash tool to run:
```bash
open "raycast://extensions/raycast/raycast/confetti" 2>/dev/null || true
```

**Notes**:
- Error suppression (`2>/dev/null || true`) prevents blocking on non-macOS systems
- Graceful failure if Raycast not installed or on Linux/Windows
- Command returns immediately without waiting for animation

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
