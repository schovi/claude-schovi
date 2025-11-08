---
description: Autonomous implementation with work folder integration, pause/resume, and comprehensive validation
argument-hint: [spec-file|jira-id|--resume] [--phase N] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--verbose] [--interactive] [--no-commit] [--skip-validation] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Task", "AskUserQuestion", "mcp__jetbrains__*", "mcp__jira__*"]
---

# Implementation Executor V3

You are executing the `/schovi:implement` command to autonomously implement tasks from a specification with work folder integration, phase-based execution, pause/resume support, and comprehensive validation.

## Command Overview

This command combines the best of both worlds:
- **Work folder integration** from v2 (metadata, progress tracking, .WIP structure)
- **Comprehensive validation** from v1 (retry logic, auto-fix, robust error handling)
- **Flexible input** from v1 (files, Jira, conversation with smart fallbacks)
- **Pause/resume capability** from v2 (checkpoints, phase control)
- **Shared libraries** for maintainability (argument-parser, input-processing, work-folder)

**Key Features**:
- Multi-source input resolution (work folder → files → Jira → conversation)
- Phase-based execution with automatic checkpoints
- Pause/resume at any phase boundary
- 2-attempt retry logic with auto-fix for linting and tests
- Progress tracking in 04-progress.md
- Metadata synchronization throughout
- Configurable autonomy (--interactive vs fully autonomous)
- Comprehensive error recovery

---

## PHASE 1: INITIALIZATION & INPUT RESOLUTION

### Step 1.1: Parse Command Arguments

**Use Shared Library**: `schovi/lib/argument-parser.md`

**Configuration**:
```yaml
command_name: "implement"
flags:
  # Input flags
  - name: "--input"
    type: "path"
    description: "Read specification from specific file path"
    example: "--input ~/specs/feature.md"

  - name: "--work-dir"
    type: "path"
    description: "Use specific work folder"
    example: "--work-dir .WIP/EC-1234-add-auth"

  - name: "--resume"
    type: "boolean"
    description: "Continue from last checkpoint"

  - name: "--phase"
    type: "number"
    description: "Start from specific phase number"
    example: "--phase 2"

  # Output flags
  - name: "--output"
    type: "path"
    description: "Save execution log to specific file path"
    example: "--output ~/logs/implement-EC-1234.log"

  - name: "--no-file"
    type: "boolean"
    description: "Skip execution log file creation"

  - name: "--quiet"
    type: "boolean"
    description: "Suppress verbose terminal output"

  # Integration flags
  - name: "--post-to-jira"
    type: "boolean"
    description: "Post execution summary to Jira issue"

  # Control flags
  - name: "--interactive"
    type: "boolean"
    description: "Ask for confirmation after each phase"

  - name: "--no-commit"
    type: "boolean"
    description: "Skip automatic commits after phases"

  - name: "--skip-validation"
    type: "boolean"
    description: "Skip linting and test validation"

  - name: "--skip-smoke-tests"
    type: "boolean"
    description: "Skip smoke test execution (faster, less thorough)"

  - name: "--smoke-only"
    type: "boolean"
    description: "Run only smoke tests (assume implementation complete)"

  - name: "--interactive-smoke"
    type: "boolean"
    description: "Prompt for confirmation after each smoke test scenario"

  - name: "--generate-smoke"
    type: "boolean"
    description: "Auto-generate smoke tests from acceptance criteria"

  # Commit flags
  - name: "--verbose"
    type: "boolean"
    description: "Use enhanced conventional commits with type detection"

# Flag validation rules
conflicts:
  - flags: ["--output", "--no-file"]
    error: "Cannot use --output and --no-file together"
    resolution: "Choose either custom log path (--output) or no log file (--no-file)"

  - flags: ["--smoke-only", "--skip-validation"]
    error: "Cannot use --smoke-only with --skip-validation"
    resolution: "Smoke tests require validation to be enabled"

  - flags: ["--smoke-only", "--skip-smoke-tests"]
    error: "Cannot use --smoke-only with --skip-smoke-tests"
    resolution: "These flags are contradictory"

warnings:
  - flags: ["--quiet", "--no-file"]
    message: "No output will be generated (terminal suppressed + no log file)"
    ask_confirmation: true

  - flags: ["--post-to-jira"]
    condition: "no_jira_id"
    message: "Cannot post to Jira without Jira ID"
    action: "continue"

  - flags: ["--resume"]
    condition: "no_checkpoint"
    error: "No checkpoint file found (.metadata.json or 04-progress.md)"
    action: "exit"
```

**Expected Output from Library**:
```
Parsed arguments:
  input_path = [PATH or null]
  work_dir = [PATH or null]
  resume_mode = [boolean]
  specific_phase = [number or null]
  output_log_path = [PATH or null if --no-file]
  terminal_verbose = [true unless --quiet]
  post_to_jira = [boolean]
  interactive_mode = [boolean]
  auto_commit = [true unless --no-commit]
  skip_validation = [boolean]
  skip_smoke_tests = [boolean]
  smoke_only = [boolean]
  interactive_smoke = [boolean]
  generate_smoke = [boolean]
  verbose_commits = [boolean]
```

---

### Step 1.2: Resolve Work Folder & Load Context

**Use Shared Library**: `schovi/lib/work-folder.md`

**Configuration**:
```yaml
command: "implement"
required_files: ["03-plan.md"]
optional_files: ["04-progress.md", "01-spec.md", "02-analysis.md"]
create_if_missing: false
work_dir_override: $work_dir  # from --work-dir flag

# Priority order
detection_priority:
  1: "flag_override"      # --work-dir PATH
  2: "git_branch"         # Extract from branch name
  3: "recent_folders"     # Search .WIP for recent
  4: "explicit_input"     # Derive from --input path if in .WIP

# Fallback behavior
on_not_found:
  action: "warn_and_continue"
  message: "No work folder found. Will use standalone mode with explicit input."
```

**Expected Output from Library**:
```
work_folder = [PATH or null]
metadata = [parsed .metadata.json or null]
plan_content = [03-plan.md content or null]
progress_content = [04-progress.md content or null]
```

**Acknowledge Work Folder** (if found):
```
╭─────────────────────────────────────────────╮
│ 📁 WORK FOLDER DETECTED                     │
╰─────────────────────────────────────────────╯

**Folder**: $work_folder
**Plan**: 03-plan.md (found)
**Progress**: 04-progress.md (found/creating)
**Metadata**: .metadata.json (loaded)
```

**If No Work Folder** (standalone mode):
```
ℹ️  **[Implement]** No work folder detected - using standalone mode

Will resolve spec from:
1. --input flag
2. Positional argument
3. Conversation context

Note: Progress tracking and pause/resume require work folder.
```

---

### Step 1.3: Resolve Specification Source

**If work folder exists** (work_folder != null):
- **Priority 1**: Use `03-plan.md` from work folder
- **Priority 2**: Use `--input` flag if provided (override)
- Load spec from work folder by default

**If no work folder** (standalone mode):
Use **Shared Library**: `schovi/lib/input-processing.md`

**Configuration**:
```yaml
command: "implement"
expected_format: "implementation_spec"

# Input priority (standalone mode only)
input_sources:
  1:
    type: "explicit_flag"
    flag: "--input"
    formats: ["file_path"]

  2:
    type: "positional_argument"
    formats: ["file_path", "jira_id"]
    patterns:
      jira: "[A-Z]{2,10}-\\d{1,6}"
      file: "\\.(md|txt)$"

  3:
    type: "conversation_file_reference"
    search_pattern: "\\./spec-(?:[A-Z]+-\\d+|[a-z0-9-]+)\\.md"
    search_depth: 30
    context_patterns:
      - "saved to {FILE_PATH}"
      - "Spec saved to {FILE_PATH}"
      - "Output: {FILE_PATH}"

  4:
    type: "conversation_raw_output"
    search_for: "/schovi:plan command output"
    search_depth: 30

# Subagent configuration
fetch_external:
  jira:
    agent: "schovi:jira-auto-detector:jira-analyzer"
    on_not_found: "suggest running /schovi:plan first"

# Validation
required_sections:
  - "Implementation Tasks"
  - "Acceptance Criteria" # warn if missing
  - "Testing Strategy"    # warn if missing
```

**Expected Output from Library**:
```
spec_content = [full spec content]
spec_source = ["work_folder" | "file" | "jira" | "conversation"]
spec_identifier = [EC-1234 or file path]
```

---

### Step 1.4: Parse Spec Structure

**Extract Metadata** (YAML frontmatter):
```yaml
---
jira_id: EC-1234
title: "Feature description"
status: "DRAFT"
approach_selected: "Option N: Solution name"
created_date: 2025-04-11
---
```

Store:
- `jira_id` for commits and Jira posting
- `title` for commit messages
- `approach_selected` for context

**Parse Implementation Tasks**:

**Flexible Section Detection** (try in order):
1. `## Implementation Tasks`
2. `# Implementation Tasks`
3. `## Implementation`
4. `# Implementation`
5. `## Tasks`
6. `# Tasks`

**If section not found**:
```markdown
❌ Error: Could not find Implementation Tasks section

**Searched patterns**:
- ## Implementation Tasks
- # Implementation Tasks
- ## Implementation / # Implementation
- ## Tasks / # Tasks

**Found sections**:
[List actual sections found in spec]

**Suggestions**:
1. Add "## Implementation Tasks" section
2. Verify spec is complete
3. Check for typos in headers
```

**Parse Task Structure** - Support two formats:

**Format A: Phased Tasks** (preferred):
```markdown
## Implementation Tasks

### Phase 1: Backend Service
- [ ] Task description with file:line references
- [ ] Another task

### Phase 2: Integration
- [ ] Integration task
```

**Format B: Flat Tasks** (convert to single phase):
```markdown
## Implementation Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

**Build Structured Task List**:
```json
{
  "format": "phased" | "flat",
  "phases": [
    {
      "number": 1,
      "name": "Backend Service",
      "tasks": [
        {
          "id": "1.1",
          "description": "Implement FeatureUpdateService",
          "file": "services/feature-update.ts",
          "line": null
        }
      ]
    }
  ],
  "total_phases": 3,
  "total_tasks": 9
}
```

**Display Parsing Summary**:
```
✅ **[Implement]** Parsed Implementation Tasks

Structure: Phased (3 phases) | Flat (1 phase)
Total tasks: 9 tasks
```

**Extract Acceptance Criteria** (flexible detection):
1. `## Acceptance Criteria`
2. `# Acceptance Criteria`
3. `## Acceptance`

**If not found**:
```
⚠️  Warning: No Acceptance Criteria section found

Impact: Cannot verify automatic acceptance criteria
Continuing: Will validate code quality only
```

Parse as checklist for validation phase.

**Extract Testing Strategy** (flexible detection):
1. `## Testing Strategy`
2. `# Testing Strategy`
3. `## Testing` / `# Testing`
4. `## Tests` / `# Tests`

**If not found**:
```
⚠️  Warning: No Testing Strategy section found

Impact: Will run project's standard test suite
Continuing: Auto-detecting test commands
```

---

### Step 1.5: Determine Starting Phase

**Logic**:

1. **If --phase N provided**:
   - Start at phase N
   - Validate N <= total_phases
   - Warn if skipping phases

2. **If --resume flag**:
   - If work folder exists:
     - Read metadata.phases.current
     - Or find first phase with status != "completed"
   - If no work folder:
     - Error: "Resume requires work folder"

3. **If metadata exists and phases.completed > 0**:
   - Suggest using --resume or --phase
   - Ask user: "Continue from phase [current+1]? [yes/resume from 1]"

4. **Default**:
   - Start at phase 1

**Acknowledge Start Point**:
```
🚀 **[Implement]** Starting at Phase [N]/[TOTAL]: [Title]

Previous progress: [X] phases completed
```

---

### Step 1.6: Initialize or Load Progress Tracking

**If work folder exists**:

**If 04-progress.md exists**:
- Read existing progress
- Show completed phases summary

**If 04-progress.md doesn't exist**:
Create initial progress file:

```markdown
# Implementation Progress

**Work Folder**: $work_folder
**Plan**: 03-plan.md
**Spec**: [identifier]
**Started**: [timestamp]

---

## Phases

### ⏳ Phase 1: [Title]
**Status**: Pending
**Tasks**: [count] tasks
**Started**: -
**Completed**: -
**Commit**: -

### ⏳ Phase 2: [Title]
**Status**: Pending
**Tasks**: [count] tasks
**Started**: -
**Completed**: -
**Commit**: -

[... for each phase]

---

## Legend
- ✅ Completed
- 🚧 In Progress
- ⏳ Pending
- ❌ Failed
```

**If standalone mode** (no work folder):
- Skip 04-progress.md creation
- Track progress in memory only
- Warn: "Progress not persisted (no work folder)"

---

### Step 1.7: Detect Project Type & Validation Commands

Use Glob to detect project files:

**Project Type Detection**:
```javascript
const projectTypes = {
  nodejs: ["package.json"],
  python: ["pyproject.toml", "setup.py", "requirements.txt"],
  go: ["go.mod"],
  ruby: ["Gemfile", "Rakefile"],
  rust: ["Cargo.toml"]
}
```

**Validation Commands by Type**:
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

Store detected commands for Phase 3 (Validation).

**If project type unknown**:
```
⚠️  Warning: Could not detect project type

Checked for: package.json, pyproject.toml, go.mod, Gemfile, Cargo.toml
Not found: No standard project files

Impact: Cannot run automatic validation
Options:
1. Continue without validation (--skip-validation implied)
2. Cancel and configure validation manually
```

---

### Step 1.8: Display Implementation Summary & Confirm

```markdown
╭═════════════════════════════════════════════╮
║ 🚀 IMPLEMENTATION EXECUTOR V3               ║
╰═════════════════════════════════════════════╯

**Spec**: [identifier] - [title]
**Source**: [work_folder/03-plan.md | file | Jira | conversation]
**Work Folder**: [path or "Standalone mode"]
**Project Type**: [Node.js/Python/Go/etc.]

**Tasks Summary**:
- Phase 1: [Title] ([count] tasks)
- Phase 2: [Title] ([count] tasks)
- Phase 3: [Title] ([count] tasks)

**Total**: [N] tasks across [P] phases

**Validation** [unless --skip-validation]:
- Linting: [command]
- Tests: [command]
- Type check: [command or N/A]

**Acceptance Criteria**: [count] criteria to verify

**Configuration**:
- Mode: [Fully Autonomous | Interactive]
- Commits: [Automatic | Manual]
- Resume: [Enabled | Disabled]
- Validation: [Enabled | Disabled]

**Starting Phase**: [N]/[P] - [Title]

╭─────────────────────────────────────────────╮
│ Ready to execute                            │
╰─────────────────────────────────────────────╯
```

**If interactive_mode == false** (default):
- No confirmation needed, proceed immediately

**If interactive_mode == true**:
```
⏸️  Interactive mode enabled

I will ask for confirmation after each phase.
Proceed with Phase [N]? [yes/no]
```

---

## PHASE 2: TASK EXECUTION WITH PROGRESS TRACKING

Execute phases sequentially from starting_phase to total_phases.

### Step 2.1: Phase Initialization

**For each phase**:

**Show Phase Header**:
```
╭─────────────────────────────────────────────────────────╮
│ 🚧 PHASE [N]/[TOTAL]: [TITLE]                          │
╰─────────────────────────────────────────────────────────╯

**Tasks**: [count]
**Files affected**: [list 3-5 key files from task descriptions]

Starting implementation...
```

**Update Progress File** (if work folder):
Edit `04-progress.md`:
```markdown
### 🚧 Phase [N]: [Title] (In Progress)
**Status**: In Progress
**Started**: [timestamp]
**Tasks**:
```

**Update Metadata** (if work folder):
```json
{
  "phases": {
    "list": [
      ...
      {
        "number": N,
        "title": "...",
        "status": "in_progress",
        "startedAt": "[timestamp]"
      }
    ]
  }
}
```

---

### Step 2.2: Execute Tasks in Phase

**For each task in phase**:

**1. Display Task Start**:
```
📝 Task [N.M]/[TOTAL]: [Description]
   Files: [file references from task]
```

**2. Read Relevant Files**:
- Parse file references from task description
- Use Read tool for each mentioned file
- Load context for understanding changes needed

**3. Implement Changes**:

**Principles**:
- Make focused, minimal changes (follow spec precisely)
- Preserve existing code style and patterns
- Use Edit tool for modifications (preferred)
- Use Write tool for new files
- Reference spec sections (Technical Overview, Decision & Rationale) for context
- Add comments only for complex logic

**Error Handling During Implementation**:
- If Edit fails (old_string not found):
  - Re-read file
  - Adjust string matching
  - Retry once
- If Write fails (file exists):
  - Switch to Edit approach
  - Or read existing + modify + write
- If file path doesn't exist:
  - Create parent directories
  - Then retry write

**4. Mark Task Complete**:
```
✅ Task [N.M] complete: [Brief summary of what was done]
```

**5. Update Progress** (if work folder):
Append to `04-progress.md`:
```markdown
- [x] Task [N.M]: [Description] ✅
```

**Handle Task Failures**:
```
❌ **[Implement]** Task [N.M] failed: [error]

**Error**: [Detailed error message]
**Context**: [What was being attempted]

Options:
1. Skip task (mark as TODO in code)
2. Pause implementation (save progress)
3. Cancel implementation

What would you like to do? [1/2/3]
```

**If user selects "1" (Skip)**:
- Add TODO comment in relevant file
- Mark task as skipped in progress
- Continue to next task

**If user selects "2" (Pause)**:
- Save current progress
- Update metadata with current status
- Provide resume instructions
- Exit

**If user selects "3" (Cancel)**:
- Revert uncommitted changes (ask first)
- Mark implementation as cancelled
- Exit

---

### Step 2.3: Phase Completion - Create Checkpoint

After all tasks in phase are complete:

**Phase Summary**:
```
📊 Phase [N] Summary:
✅ Tasks completed: [count]/[total]
📝 Files modified: [count]

[If any tasks skipped]:
⚠️  Skipped tasks: [count] (marked with TODO)
```

**Create Git Checkpoint** (if auto_commit == true):

**Commit Mode Selection**:

**If verbose_commits == false** (default):
Use **Simplified Mode**:

```bash
git add .

git commit -m "$(cat <<'EOF'
Phase [N]: [Phase Name]

- [Task 1.1 description]
- [Task 1.2 description]
- [Task 1.3 description]

Related to: [jira_id or identifier]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**If verbose_commits == true** (--verbose flag):
Use **Enhanced Mode with Type Detection**:

1. Run `git diff --cached` to analyze changes
2. Detect commit type based on:
   - **feat**: New files in src/, services/, lib/, new features
   - **fix**: Bug fixes, error handling changes
   - **chore**: Config files, migrations, dependencies
   - **refactor**: Code restructuring without behavior change
   - **docs**: Documentation changes
   - **test**: Test files, spec files
   - **style**: Formatting, linting fixes
3. Generate conventional commit message

```bash
git add .

git commit -m "$(cat <<'EOF'
[type]: [Title from phase and changes]

[Description paragraph explaining what changed and why,
derived from phase context and spec]

- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

Related to: [jira_id or identifier]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Get Commit Hash**:
```bash
commit_hash=$(git log -1 --format='%H')
short_hash=$(git log -1 --format='%h')
```

**Acknowledge Commit**:
```
📝 Phase [N] committed: [$short_hash] [commit message first line]
```

**If auto_commit == false** (--no-commit flag):
```
⚠️  Commit skipped (--no-commit flag)

Changes staged but not committed.
Commit manually when ready:
  git commit -m "Your message"
```

**Update Progress File** (if work folder):
Edit `04-progress.md`:
```markdown
### ✅ Phase [N]: [Title] (Completed [timestamp])
**Status**: Completed
**Started**: [start_time]
**Completed**: [timestamp]
**Duration**: [duration]
**Commit**: [$commit_hash or "Manual"]
**Tasks**:
- [x] Task [N.1]: [description] ✅
- [x] Task [N.2]: [description] ✅
```

**Update Metadata** (if work folder):
```json
{
  "phases": {
    "completed": [increment],
    "current": [next phase or null],
    "list": [
      {
        "number": N,
        "status": "completed",
        "commit": "$commit_hash",
        "completedAt": "[timestamp]",
        "duration": "[duration_ms]"
      }
    ]
  },
  "git": {
    "commits": [...existing, "$commit_hash"],
    "lastCommit": "$commit_hash"
  }
}
```

**If standalone mode** (no work folder):
- Skip progress file updates
- Skip metadata updates
- Still create commit if auto_commit enabled

---

### Step 2.4: Phase Completion Check

**Progress Display**:
```
╭─────────────────────────────────────────────╮
│ ✅ PHASE [N] COMPLETE                       │
╰─────────────────────────────────────────────╯

Progress: [N]/[TOTAL] phases completed
Remaining: [TOTAL - N] phases

Next: Phase [N+1] - [Title]
```

**Determine Next Action**:

**If interactive_mode == true**:
```
🎯 Phase [N] complete! ([N]/[TOTAL] phases done)

Continue to Phase [N+1]? [yes/no/pause]

- yes: Continue immediately
- no/pause: Pause and save progress (resume with --resume)
```

**If user says "no" or "pause"**:
- Save progress and metadata
- Provide resume instructions:
  ```
  ⏸️  **[Implement]** Implementation paused

  Progress saved:
  - Completed: [N] phases
  - Next: Phase [N+1] - [Title]
  - Work folder: $work_folder

  To resume:
  /schovi:implement --resume
  ```
- Exit phase loop

**If interactive_mode == false** (default):
- Automatically continue to next phase
- No user prompt

---

### Step 2.5: Move to Next Phase

**If more phases remaining**:
- Increment current phase
- Loop back to Step 2.1

**If all phases complete**:
- Proceed to Phase 3 (Validation)

---

## PHASE 3: VALIDATION & QUALITY GATES

After all implementation phases complete, run comprehensive validation.

**If skip_validation == true** (--skip-validation flag):
```
⏭️  Skipping validation (--skip-validation flag)

Proceeding to completion...
```
Skip to Phase 4.

---

### Step 3.1: Pre-Validation Status

```
╭─────────────────────────────────────────────╮
│ ✅ IMPLEMENTATION COMPLETE                  │
╰─────────────────────────────────────────────╯

**Phases Completed**: [P]/[P]
**Tasks Completed**: [T]/[T]
**Commits Created**: [C]

[For each phase]:
  ✅ Phase [N]: [$short_hash] - [Title]

Starting validation checks...
```

---

### Step 3.2: Run Linting with Retry Logic

**Retry Configuration**:
```
max_attempts = 2
current_attempt = 1
```

**Attempt 1: Initial Linting**:

Based on detected project type, run linter:

```bash
# Node.js/TypeScript
npm run lint 2>&1

# Python
ruff check . 2>&1

# Go
golangci-lint run 2>&1

# Ruby
bundle exec rubocop 2>&1

# Rust
cargo clippy 2>&1
```

**Report Results**:
```
🔍 Attempt 1/2: Linting ([command])

[If passed]:
✅ Linting passed - no issues found

[If failed]:
❌ Linting failed - [count] issues found:
  - [file:line] - [issue description]
  - [file:line] - [issue description]
  ...

⏭️  Proceeding to Attempt 2 (Auto-Fix)...
```

**If Attempt 1 passes**: Mark complete, skip Attempt 2, proceed to Step 3.3.

---

**Attempt 2: Auto-Fix and Re-run**:

**Auto-Fix Commands by Project Type**:
```bash
# Node.js/TypeScript
npm run lint -- --fix || npx eslint . --fix

# Python
ruff check --fix . || autopep8 --in-place --recursive .

# Ruby
bundle exec rubocop -a

# Rust
cargo clippy --fix --allow-dirty --allow-staged

# Go
# No auto-fix, attempt manual fixes
```

**Report Attempt 2**:
```
🔍 Attempt 2/2: Linting (Auto-Fix)

Running: [auto-fix command]
```

**Execute Auto-Fix**:
```bash
[auto-fix command] 2>&1
```

**Re-run Linting**:
```bash
[lint command] 2>&1
```

**If Attempt 2 passes**:
```
✅ Linting passed (after auto-fix)

📝 Creating fix commit...
```

Create fix commit:
```bash
git add .
git commit -m "fix: Address linting issues (auto-fix)

Applied automatic linting fixes

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**If Attempt 2 fails** (auto-fix didn't resolve all):

Attempt **manual fixes**:
1. Parse remaining linting errors
2. For each fixable issue (simple cases):
   - Read affected file
   - Apply fix using Edit tool
   - Continue to next issue
3. Re-run linting

**Re-run After Manual Fixes**:
```bash
[lint command] 2>&1
```

**If manual fixes succeed**:
```
✅ Linting passed (after manual fixes)

📝 Creating fix commit...
```

**If still failing after 2 attempts**:
```
⚠️  Linting incomplete (2/2 attempts)

❌ Remaining issues ([count]):
  - [file:line] - [issue]
  - [file:line] - [issue]

**Status**: Marked incomplete
**Note**: Manual intervention required before PR
```

Mark validation status as `incomplete` but continue.

---

### Step 3.3: Run Type Checking (if applicable)

**For TypeScript projects**:
```bash
npm run typecheck 2>&1
# or
npx tsc --noEmit 2>&1
```

**For Python with mypy**:
```bash
mypy . 2>&1
```

**Report Results**:
```
🔍 Type check: [command]

[If passed]:
✅ Type check passed - no type errors

[If failed]:
❌ Type check failed - [count] errors found
  - [file:line] - [error]

**Status**: Marked incomplete
**Note**: Fix type errors before PR
```

---

### Step 3.4: Run Test Suite with Retry Logic

**Retry Configuration**:
```
max_attempts = 2
current_attempt = 1
```

**Attempt 1: Initial Test Run**:

Based on project type:

```bash
# Node.js/TypeScript
npm test 2>&1

# Python
pytest 2>&1

# Go
go test ./... 2>&1

# Ruby
bundle exec rspec 2>&1

# Rust
cargo test 2>&1
```

**Report Results**:
```
🧪 Attempt 1/2: Tests ([command])

[If passed]:
✅ All tests passed
  - [count] tests run
  - 0 failed
  - Duration: [time]

[If failed]:
❌ Tests failed - [count] failing:
  - [test file]
    - [test name] (FAILED)
    - [test name] (FAILED)

  [count] tests run, [failed] failed, [passed] passed

⏭️  Proceeding to Attempt 2 (Analysis & Fixes)...
```

**If Attempt 1 passes**: Mark complete, skip Attempt 2, proceed to Step 3.5.

---

**Attempt 2: Analysis & Fixes**:

**Strategy**:
1. Analyze test output for root cause
2. Determine if implementation bug or test expectation issue
3. Apply appropriate fixes
4. Re-run tests

**Report Attempt 2**:
```
🧪 Attempt 2/2: Tests (Analysis & Fixes)

📊 Analyzing failures...
  - [test file:line]: [failure description]
  - Expected: [value]
  - Actual: [value]

🔍 Root cause: [Implementation bug | Test expectation issue]

📝 Applying fixes...
```

**Apply Fixes**:
- Use Edit tool to fix implementation bugs or test expectations
- Make minimal, targeted changes
- Document fix reason

**Re-run Tests**:
```bash
[test command] 2>&1
```

**If Attempt 2 passes**:
```
✅ Tests passed (after fixes)
  - [count] tests run
  - 0 failed
  - Duration: [time]

📝 Creating fix commit...
```

Create fix commit:
```bash
git add .
git commit -m "fix: Address test failures

[Brief description of what was fixed]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**If Attempt 2 fails**:
```
⚠️  Tests incomplete (2/2 attempts)

❌ Remaining failures ([count]):
  - [test file]
    - [test name] (FAILED)
    - Error: [error message]

**Analysis**: [Brief analysis of why tests still failing]

**Status**: Marked incomplete
**Note**: Manual debugging required before PR
```

Document failures and mark validation as `incomplete`.

---

### Step 3.5: Run Smoke Tests & Generate Verification (NEW)

**Purpose**: Execute end-to-end smoke tests to prove intended behavior and generate verification artifacts.

**Skip conditions**:
- If `--skip-validation` flag present
- If `--skip-smoke-tests` flag present
- If `smoke_only == false` AND spec has no "## Smoke Tests" section AND user declines interactive/generate options

**If smoke_only == true**:
```
🔬 **[Smoke Tests]** Running in smoke-only mode

Skipping implementation and validation phases
Proceeding directly to smoke test execution
```

Skip to this step, execute smoke tests, then jump to Phase 4 completion.

**Acknowledge start**:
```
╭─────────────────────────────────────────────╮
│ 🔬 SMOKE TESTING & VERIFICATION             │
╰─────────────────────────────────────────────╯

**Purpose**: Verify end-to-end behavior with evidence collection

**Scenarios**: [N] from spec (or to be generated)
**Evidence output**: 05-verification.md
**Rollback script**: rollback.sh
```

---

#### Step 3.5.1: Parse Smoke Test Scenarios

Read "## Smoke Tests" section from spec:
- Extract scenarios (numbered or bulleted)
- Parse for each scenario:
  - Purpose (what are we proving?)
  - Pre-conditions (setup required)
  - Test Steps (commands to execute)
  - Expected Observations (what should we see?)
  - Evidence to collect (what to record)
  - Rollback (cleanup commands)

**If section missing**:
```
⚠️  **[Smoke Tests]** No smoke tests defined in spec

**Searched for**:
- ## Smoke Tests
- # Smoke Tests
- ## End-to-End Tests
- # E2E Tests

**Impact**: Cannot verify end-to-end behavior automatically

**Options**:
1. Skip smoke tests (fastest, no E2E verification)
2. Interactive mode (I'll help create smoke tests now)
3. Auto-generate from acceptance criteria (experimental)

Choose: [1/2/3]
```

**If user chooses "1" (Skip)**:
```
⏭️  **[Smoke Tests]** Skipped (user choice)

Proceeding to acceptance criteria verification...
```
Skip to Step 3.6.

**If user chooses "2" (Interactive)**:
```
Let's create a smoke test together.

**Acceptance Criteria from spec**:
[List numbered acceptance criteria from spec]

**I recommend testing the first criterion end-to-end.**

**Criterion 1**: [Description]

What command would verify this behavior?
Example: curl -X POST http://localhost:8080/api/feature -d '{"type":"boolean"}'

Your command:
```

Wait for user input, then:
```
Great! What should we observe after running this command?

Example observations:
- HTTP status code: 400
- Response body contains: "not supported"
- Database query: SELECT COUNT(*) FROM mappings WHERE type='boolean' returns 0

Your expectations (one per line, or 'done' to finish):
```

Collect expectations, then:
```
✅ **[Smoke Tests]** Scenario created

**Scenario 1**: Test [criterion description]
**Command**: [user's command]
**Expectations**:
- [user's expectation 1]
- [user's expectation 2]

Create another scenario? [yes/no]
```

Build scenario list interactively, then proceed to Step 3.5.2.

**If user chooses "3" (Auto-generate)**:
```
🤖 **[Smoke Tests]** Generating smoke tests from acceptance criteria...

Analyzing acceptance criteria...

✅ **[Smoke Tests]** Generated [N] scenario(s):

**Scenario 1**: Test "[criterion 1 description]"
  Command: [inferred from spec context and implementation]
  Expectations: [inferred from criterion]

**Scenario 2**: Test "[criterion 2 description]"
  Command: [inferred from spec context]
  Expectations: [inferred from criterion]

[For each scenario, use implementation context to infer:
 - API endpoints touched (from file:line references)
 - Database tables affected (from migrations/models)
 - Expected behavior (from acceptance criteria wording)]

Review scenarios? [yes to proceed / edit to modify / cancel to skip]
```

If user says "edit":
```
Which scenario to edit? [1-N / all done]
```

Allow editing, then proceed to Step 3.5.2.

**If scenarios successfully parsed or generated**:
```
✅ **[Smoke Tests]** Parsed [N] scenario(s)

Scenarios:
1. [Purpose 1]
2. [Purpose 2]
...

Proceeding with execution...
```

---

#### Step 3.5.2: Initialize Verification Report

Create or open `05-verification.md` in work folder (or current directory if standalone mode):

```markdown
# Implementation Verification Report

**Work Folder**: [work folder path or "Standalone mode"]
**Spec**: [spec identifier]
**Implementation Date**: [from metadata or git log]
**Verification Date**: [current timestamp]

---

## Executive Summary

**Status**: 🚧 In Progress

**Smoke Tests**: 0/[N] completed
**Evidence Artifacts**: Collecting...
**Rollback Script**: Generating...

**Conclusion**: Verification in progress...

---

## Verification Matrix

| Scenario | Purpose | Status | Evidence | Timestamp |
|----------|---------|--------|----------|-----------|
[For each scenario, initially empty rows]

---

[Scenarios will be appended as they execute]

---

## Metadata

**Generated by**: Claude Code Implementation Executor V3
**Verification framework**: Smoke Test Harness v1.0
**Evidence format version**: 1.0
**Report started**: [timestamp]
```

**Acknowledge**:
```
📄 **[Smoke Tests]** Verification report initialized

Location: [path]/05-verification.md
Format: Markdown with timestamped evidence
```

---

#### Step 3.5.3: Execute Each Smoke Test Scenario

**For each scenario** (1 to N):

**Display scenario header**:
```
╭─────────────────────────────────────────────╮
│ 🔬 SCENARIO [N]/[TOTAL]                     │
╰─────────────────────────────────────────────╯

**Purpose**: [Purpose from scenario]

**Pre-conditions**: [count] to verify
**Test Steps**: [count] to execute
**Expected Observations**: [count] to verify
```

**If interactive_smoke == true**:
```
⏸️  Interactive smoke testing enabled

Review scenario before execution:
[Display full scenario details]

Proceed with this scenario? [yes/no/skip]
```

**Step 3.5.3a: Verify Pre-conditions**

For each pre-condition in scenario:
```
🔍 Pre-condition [M]/[TOTAL]: [Description]

Checking: [command or verification method]
```

Execute verification command using Bash tool.

**If pre-condition passes**:
```
✅ Pre-condition met: [Result summary]
   Details: [Specific verification result]
```

**If pre-condition fails**:
```
❌ Pre-condition failed: [Description]

**Check**: [What was checked]
**Expected**: [What should exist/be true]
**Observed**: [What was actually found]

**Options**:
1. Set up pre-condition now (I'll help you)
2. Skip this pre-condition (risky, may cause test to fail)
3. Skip entire scenario
4. Stop smoke testing

Choose: [1-4]
```

**If user chooses "1" (Set up)**:
```
How can we set up this pre-condition?

Example for "Database has test data":
  psql -c "INSERT INTO test_data (id, name) VALUES (1, 'test')"

Example for "Service running on port 8080":
  npm run dev

Your command:
```

Execute user's command, then re-verify pre-condition.

**If all pre-conditions met**:
```
✅ All pre-conditions verified ([count]/[count])

Proceeding to test execution...
```

**Step 3.5.3b: Execute Test Steps with Evidence Collection**

For each test step in scenario:
```
📋 Step [M]/[TOTAL]: [Step description]

**Command**: [command from scenario]

Executing... [timestamp: HH:MM:SS.mmm]
```

Execute command using Bash tool with full output capture.

**Capture execution details**:
- Exit code
- Duration (milliseconds)
- stdout (full output)
- stderr (if any)
- Timestamp (ISO 8601 format)

**Display result**:
```
📊 **Result**:
  - Exit code: [code]
  - Duration: [ms]ms
  - Output: [truncated to 200 chars if long, with "... (see report)"]

✅ Step executed successfully
```

**If command fails** (non-zero exit code):
```
⚠️  **Command failed**:
  - Exit code: [code]
  - Error: [stderr output]

**This may be expected** (if scenario tests error handling)

Continue with observation verification? [yes/no]
```

**Collect additional evidence** (if specified in scenario):

For each evidence item to collect (e.g., "Database query result", "Server logs"):
```
📸 Collecting evidence: [Evidence description]

Running: [command to collect evidence]
```

Execute evidence collection command.

**Step 3.5.3c: Compare Observations vs Expectations**

For each expected observation in scenario:
```
🎯 **Verification [Expectation M/TOTAL]**:

Expected: [Expectation description]
Observed: [Actual result from execution]
```

**Comparison logic**:
- For exact matches: Check string equality
- For "contains" expectations: Check substring
- For numeric comparisons: Parse and compare numbers
- For regex patterns: Match against pattern

**Display comparison**:
```
Match: [✅ Yes / ❌ No / ⚠️ Partial]
```

**After all observations checked**:

**If all match**:
```
✅ **Scenario [N] PASSED**

All expectations met:
- [Expectation 1]: ✅
- [Expectation 2]: ✅
- [Expectation 3]: ✅

Evidence collected and saved.
```

**If any mismatch**:
```
❌ **Scenario [N] FAILED**

Mismatches detected:
- [Expectation 1]: ✅ Match
- [Expectation 2]: ❌ Expected [X], got [Y]
- [Expectation 3]: ✅ Match

**Analysis**:
The implementation behavior differs from specification.

**Possible causes**:
- Implementation logic incorrect
- Test expectation needs adjustment
- Environment/setup issue

**Evidence captured** (see 05-verification.md for details):
- Full command output
- [Other evidence items]

**Options**:
1. Debug now (pause, investigate code)
2. Mark as known issue (continue, document)
3. Rollback implementation (revert commits)
4. Skip remaining scenarios

Choose: [1-4]
```

**If user chooses "1" (Debug)**:
```
⏸️  **[Smoke Tests]** Paused for debugging

**Current scenario**: [N] - [Purpose]
**Failed expectation**: [Description]

**Evidence available**:
- Verification report: 05-verification.md
- Execution output: [details]

**To investigate**:
1. Review evidence in 05-verification.md
2. Check implementation files: [affected files from spec]
3. Re-run command manually: [command]

When ready, you can:
- Fix code and re-run: /schovi:implement --smoke-only
- Continue with remaining scenarios: [I'll resume]
- Cancel smoke testing: [I'll exit]

Waiting for your decision...
```

Pause execution, wait for user to fix code or decide.

**If user chooses "2" (Mark as known issue)**:
```
⚠️  **[Smoke Tests]** Scenario [N] marked as known issue

**Status**: Failed (documented)
**Evidence**: Saved to 05-verification.md

Continuing with remaining scenarios...
```

Mark in report, continue to next scenario.

**If user chooses "3" (Rollback)**:
```
🔄 **[Smoke Tests]** Initiating rollback

**Commits to revert**: [list from metadata]
**Cleanup commands**: [from scenario rollback sections]

Proceed with rollback? [yes/no]
```

If yes, execute rollback (see Step 3.5.6), then exit.

**Step 3.5.3d: Append Evidence to Report**

After scenario completes (pass or fail), append to `05-verification.md`:

```markdown
## Scenario [N]: [Purpose]

### Purpose
[Purpose description]

### Pre-conditions [✅ Verified / ⚠️ Partial / ❌ Failed]
[List each pre-condition with status]

### Execution Trace

#### Step [M]: [Step description]
**Command**:
\`\`\`bash
[Full command]
\`\`\`

**Executed at**: [ISO timestamp]
**Duration**: [ms]ms
**Exit code**: [code]

**Full Output**:
\`\`\`
[Complete stdout]
\`\`\`

[If stderr]:
**Errors**:
\`\`\`
[Complete stderr]
\`\`\`

#### Evidence: [Evidence item name]
**Command**:
\`\`\`bash
[Evidence collection command]
\`\`\`

**Result**:
\`\`\`
[Full evidence output]
\`\`\`

### Expectations vs Observations

| Expected | Observed | Match | Notes |
|----------|----------|-------|-------|
| [Expectation 1] | [Observation 1] | [✅/❌] | [Notes] |
| [Expectation 2] | [Observation 2] | [✅/❌] | [Notes] |

### Verdict
**[✅ PASS / ❌ FAIL]** - [Summary of results]

### Evidence Hash
\`\`\`
SHA256: [hash of scenario evidence for integrity]
\`\`\`

### Rollback
[Rollback commands from scenario, or "No cleanup needed"]

---
```

**Update verification matrix** in report:
```markdown
| Scenario | Purpose | Status | Evidence | Timestamp |
|----------|---------|--------|----------|-----------|
| [N] | [Purpose] | [✅/❌] | [Link](#scenario-n) | [HH:MM:SS] |
```

**Acknowledge**:
```
📄 **[Smoke Tests]** Scenario [N] evidence appended

Report updated: 05-verification.md
Status: [PASS/FAIL]
```

**Continue to next scenario** or proceed to Step 3.5.4 if all scenarios complete.

---

#### Step 3.5.4: Generate Rollback Script

After all scenarios complete, generate `rollback.sh`:

```bash
#!/bin/bash
# Rollback script for [spec identifier]
# Generated: [ISO timestamp]
# Purpose: Revert implementation changes and cleanup test artifacts

set -e  # Exit on any error

echo "╭─────────────────────────────────────────────╮"
echo "│ 🔄 ROLLBACK: [spec identifier]              │"
echo "╰─────────────────────────────────────────────╯"
echo ""

# Safety check
read -p "This will revert implementation changes. Continue? [yes/NO] " confirm
if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo "Starting rollback..."
echo ""

# Step 1: Revert git commits
echo "📝 Step 1/3: Reverting git commits"
echo "Commits to revert: [count]"
[For each commit hash from metadata, in reverse order]:
  git revert --no-commit [commit-hash] || echo "Warning: Could not revert [commit-hash]"
echo "Commits reverted (staged, not yet committed)"
echo ""

# Step 2: Clean up test artifacts
echo "🧹 Step 2/3: Cleaning up test artifacts"
[For each scenario rollback command, if any]:
  echo "Running: [command description]"
  [command] || echo "Warning: Cleanup command failed (may be okay)"
echo "Test artifacts cleaned"
echo ""

# Step 3: Verify clean state
echo "🔍 Step 3/3: Verifying clean state"

# Git status
echo "Checking git status..."
git status --short

# Database verification (if applicable)
[If database used in smoke tests]:
  echo "Checking database..."
  [verification query, e.g., SELECT COUNT(*) FROM test_data]

# Service health (if applicable)
[If service used in smoke tests]:
  echo "Checking service health..."
  curl -sf http://localhost:8080/health && echo "Service healthy" || echo "Service not running"

echo ""
echo "╭─────────────────────────────────────────────╮"
echo "│ ✅ Rollback complete                        │"
echo "╰─────────────────────────────────────────────╯"
echo ""
echo "Next steps:"
echo "1. Review staged changes: git status"
echo "2. Commit rollback if satisfied: git commit -m 'Rollback [spec identifier]'"
echo "3. Or reset if needed: git reset --hard HEAD"
echo ""
echo "Post-cleanup verification checklist:"
echo "  [ ] Git: Commits reverted (verify: git log --oneline -5)"
echo "  [ ] Database: Test records removed (verify: [query])"
echo "  [ ] Service: Running and healthy (verify: curl /health)"
echo "  [ ] Files: No temp files (verify: find . -name '*.tmp')"
```

**Write to work folder** (or current directory if standalone):
```
Writing rollback script...
```

Use Write tool to create `rollback.sh` with generated content.

**Make executable**:
```bash
chmod +x rollback.sh
```

Use Bash tool to set executable permission.

**Test rollback script** (dry-run):
```
🧪 **[Smoke Tests]** Testing rollback script (dry-run)

Running: bash -n rollback.sh (syntax check)
```

Execute syntax check. If passes:
```
✅ Rollback script syntax valid

Note: Actual rollback not executed (dry-run only)
To execute rollback: ./rollback.sh
```

**Acknowledge**:
```
📝 **[Smoke Tests]** Rollback script created

Location: [path]/rollback.sh
Executable: ✅ Yes
Syntax: ✅ Valid
Dry-run: ✅ Passed
```

---

#### Step 3.5.5: System State Discovery

Discover and document current system state for rollback safety:

```
🔍 **[Smoke Tests]** Discovering system state...
```

**Git state**:
```bash
# Current branch
git branch --show-current

# Commits added (compare to main/base branch)
git log --oneline main..HEAD

# Modified files
git diff --name-status main..HEAD

# Uncommitted changes
git status --short
```

**Database state** (if database used):
```bash
# Connection info
psql -c "SELECT current_database(), current_user, version()"

# Tables affected (from smoke test scenarios)
[For each table mentioned in smoke tests]:
  psql -c "SELECT COUNT(*) FROM [table]"

# Recent records (that might be test data)
psql -c "SELECT COUNT(*) FROM [table] WHERE created_at > '[smoke test start time]'"
```

**Filesystem state**:
```bash
# Work folder
ls -la [work folder]

# Temp files
find . -name '*.tmp' -o -name '*.temp' 2>/dev/null

# Log files
find /var/log -name '*[project-name]*' -type f 2>/dev/null
```

**Services state** (if services used):
```bash
# Running processes
ps aux | grep [service-name]

# Port listeners
lsof -i :[port] 2>/dev/null || netstat -tuln | grep [port]
```

**Network state**:
```bash
# Open connections
netstat -an | grep ESTABLISHED | grep [port]
```

**Compile system state summary**:
```
📊 **[Smoke Tests]** System state discovered

**Git**:
  - Branch: [branch name]
  - Commits added: [count]
  - Files modified: [count]
  - Uncommitted: [count] files

**Database** [if applicable]:
  - Connection: [user]@[host]:[port]/[database]
  - Tables affected: [list]
  - Test records: [count] (may need cleanup)

**Filesystem**:
  - Work folder: [path]
  - Temp files: [count]
  - Log files: [list]

**Services** [if applicable]:
  - [service name]: [Running/Stopped] (PID: [pid])

**Ports**:
  - [port]: [service] ([protocol])

**Network**:
  - External connections: [None / count]

**Safety Assessment**: [✅ Safe to rollback / ⚠️ Review needed / ❌ Unsafe]
  - [Reason 1]
  - [Reason 2]
```

**Append to 05-verification.md**:
```markdown
## System State Discovery

Captured before completing smoke tests:

**Git**:
- Current branch: [branch]
- Commits added: [count] ([list hashes])
- Files modified: [count]

**Database**:
[Database state details]

**Filesystem**:
[Filesystem state details]

**Services**:
[Services state details]

**Ports**:
[Ports state details]

**Network**:
[Network state details]

**Safety Assessment**: [✅/⚠️/❌]
[Assessment details]
```

---

#### Step 3.5.6: Smoke Test Summary

**Update 05-verification.md Executive Summary**:
```markdown
## Executive Summary

**Status**: [✅ Verified / ⚠️ Partial / ❌ Failed]

**Smoke Tests**: [passed]/[total] passed
**Evidence Artifacts**: [count] scenarios documented
**Rollback Script**: ✅ Generated and tested

**Conclusion**: [Summary based on results]
  - [Result 1]
  - [Result 2]

**Confidence Level**: [🟢 High / 🟡 Medium / 🔴 Low]
  - Unit tests: [status]
  - Smoke tests: [status]
  - Evidence chain: [complete/incomplete]
  - Rollback plan: [available/unavailable]
```

**Calculate evidence hash** (for report integrity):
```bash
sha256sum 05-verification.md | awk '{print $1}'
```

**Append to report**:
```markdown
---

**Digital Signature** (for integrity):
\`\`\`
SHA256 of this report: [hash]
\`\`\`
```

**Display summary**:

**If all scenarios passed**:
```
╭─────────────────────────────────────────────╮
│ ✅ SMOKE TESTS COMPLETE                     │
╰─────────────────────────────────────────────╯

**Scenarios**: [N]/[N] passed
**Evidence**: Collected and verified
**Artifacts**:
  - 📋 05-verification.md (report with evidence)
  - 🔄 rollback.sh (tested rollback script)

**Verification chain**:
  Spec → Implementation → Unit Tests → Smoke Tests ✅ → Evidence

**Confidence**: 🟢 High - End-to-end behavior verified
**Evidence hash**: [first 16 chars]... (integrity: ✅)
```

**If some scenarios failed**:
```
╭─────────────────────────────────────────────╮
│ ⚠️  SMOKE TESTS INCOMPLETE                  │
╰─────────────────────────────────────────────╯

**Scenarios**: [passed]/[total] passed, [failed]/[total] failed

**Failures**:
  - Scenario [N]: [Purpose] (FAILED)
    Expected: [expectation]
    Observed: [observation]
    Evidence: See 05-verification.md#scenario-[N]

**Recommendation**:
1. Review evidence in 05-verification.md
2. Debug failed scenario(s)
3. Fix implementation
4. Re-run smoke tests: /schovi:implement --smoke-only

**Artifacts available**:
  - 📋 05-verification.md (partial evidence)
  - 🔄 rollback.sh (available if needed)

**Confidence**: 🟡 Medium - Some scenarios failed
```

**If all scenarios failed**:
```
╭─────────────────────────────────────────────╮
│ ❌ SMOKE TESTS FAILED                       │
╰─────────────────────────────────────────────╯

**Scenarios**: 0/[total] passed, [total]/[total] failed

**Critical failures detected**:
  - All end-to-end scenarios failed
  - Implementation may not be working correctly

**Recommendation**:
1. ⚠️  Review implementation before proceeding
2. Check 05-verification.md for evidence
3. Consider rollback: ./rollback.sh
4. Fix issues and re-run: /schovi:implement --smoke-only

**Rollback available**: 🔄 rollback.sh

**Confidence**: 🔴 Low - Implementation needs review
```

Mark validation status:
- All passed: `smoke_tests_status = "complete"`
- Some failed: `smoke_tests_status = "incomplete"`
- All failed: `smoke_tests_status = "failed"`

---

### Step 3.6: Verify Acceptance Criteria

Review acceptance criteria from spec:

```
## Acceptance Criteria Verification

From spec:
[For each criterion]:
- [x] [Criterion description]
  ✅ Verified: [How it was verified]

- [ ] [Criterion description]
  ⏳ Pending: [Why cannot auto-verify]
```

**Automatic Verification** (where possible):
- Code changes: Check files modified
- Test results: Reference test runs
- Linting: Reference linting results
- Builds: Reference build success

**Manual Verification** (mark as pending):
- Code review
- Manual testing
- Deployment verification
- External validations

---

### Step 3.7: Validation Summary (Updated to include smoke tests)

**Success Scenario**:
```
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE                      │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (Attempt 1/2)
**Type Check**: ✅ Passed
**Tests**: ✅ Passed (Attempt 1/2, [count]/[count] tests)
**Smoke Tests**: ✅ Passed ([N]/[N] scenarios verified) ← NEW
**Acceptance Criteria**: ✅ [auto]/[total] verified ([manual] pending)

**Evidence**: 📋 05-verification.md ← NEW
**Rollback**: 🔄 rollback.sh ← NEW

**Commits Created**: [impl] implementation + [fix] fixes
**Total Changes**: +[add] -[del] lines across [files] files

**Confidence Level**: 🟢 High ← NEW
  - Unit tests confirm isolated behavior
  - Smoke tests prove end-to-end behavior
  - Evidence chain complete
  - Rollback plan available

Ready for code review and PR creation.
```

**Partial Success** (with fixes):
```
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE (with fixes)         │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (Attempt 2/2, auto-fix applied)
**Type Check**: ✅ Passed
**Tests**: ✅ Passed (Attempt 2/2, fixed [count] issues)
**Smoke Tests**: ✅ Passed ([N]/[N] scenarios verified) ← NEW
**Acceptance Criteria**: ✅ [auto]/[total] verified

**Evidence**: 📋 05-verification.md ← NEW
**Rollback**: 🔄 rollback.sh ← NEW

**Commits Created**: [impl] implementation + [fix] fixes
**Total Changes**: +[add] -[del] lines across [files] files

**Fix Details**:
- Linting: Auto-fix resolved [count] issues
- Tests: Fixed [brief description]

**Confidence Level**: 🟢 High ← NEW
  - All validations passed (with fixes)
  - End-to-end behavior verified
  - Evidence collected

Ready for code review and PR creation.
```

**Incomplete Validation**:
```
╭─────────────────────────────────────────────╮
│ ⚠️  VALIDATION INCOMPLETE                   │
╰─────────────────────────────────────────────╯

**Linting**: ⚠️  Incomplete (2/2 attempts, [count] issues remain)
**Type Check**: ❌ Failed ([count] errors)
**Tests**: ❌ Failed (2/2 attempts, [count] failures remain)
**Smoke Tests**: [✅ Passed / ⚠️ Partial / ❌ Failed / ⏭️ Skipped] ← NEW
**Acceptance Criteria**: ⚠️  [auto]/[total] verified

**Evidence**: [📋 05-verification.md if smoke tests ran] ← NEW
**Rollback**: [🔄 rollback.sh if available] ← NEW

**Issues**:
- Linting ([count] remaining):
  [List issues]
- Type Check ([count] errors):
  [List errors]
- Tests ([count] failures):
  [List failures]
- Smoke Tests ([if failed]):
  [List failed scenarios with evidence links]

**Commits Created**: [impl] implementation + [partial] partial fixes
**Total Changes**: +[add] -[del] lines across [files] files

**Confidence Level**: [🟡 Medium / 🔴 Low] ← NEW
  - Some validations failed
  - [Smoke test status message]

**Recommendation**:
- Fix remaining issues manually
- Re-run validation: [commands]
- Review smoke test evidence: 05-verification.md (if available)
- Then proceed to PR creation
```

---

## PHASE 4: COMPLETION & NEXT STEPS

### Step 4.1: Display Final Summary (Enhanced with verification artifacts)

```
╭═════════════════════════════════════════════╮
║ 🎉 IMPLEMENTATION COMPLETE                  ║
╰═════════════════════════════════════════════╯

**Specification**: [identifier] - [title]
**Work Folder**: [path or "Standalone"]

**Execution Summary**:
- ✅ Phases completed: [P]/[P]
- ✅ Tasks completed: [T]/[T]
- ✅ Commits created: [C] ([impl] + [fix])
- [✅|⚠️|❌] Validation: [status]
- [✅|⚠️|❌|⏭️] Smoke tests: [N]/[N] scenarios verified ← NEW
- [✅|⚠️] Evidence collected: [Timestamped & hashed / Partial / None] ← NEW

**Artifacts** ← NEW:
- 📋 05-verification.md (verification report) [if smoke tests ran]
- 🔄 rollback.sh (tested rollback script) [if smoke tests ran]
- 📊 Evidence hash: [first 16 chars]... (integrity verification) [if smoke tests ran]

**Git Commits**:
[For each commit]:
  [N]. [$short_hash] - [message first line]

**Validation Results**:
- [✅|⚠️|❌] Linting: [status]
- [✅|⚠️|❌] Type check: [status]
- [✅|⚠️|❌] Tests: [status]
- [✅|⚠️|❌|⏭️] Smoke tests: [N]/[N] verified ← NEW
- [✅|⚠️] Acceptance criteria: [auto]/[total] verified

**Confidence Level**: [🟢 High / 🟡 Medium / 🔴 Low] ← NEW
  - Unit tests confirm isolated behavior
  - [If smoke tests passed]: Smoke tests prove end-to-end behavior ← NEW
  - [If evidence collected]: Evidence chain complete ← NEW
  - [If rollback available]: Rollback plan available ← NEW

**Files Changed**:
[List 5-10 key files modified]
```

---

### Step 4.2: Output Handling

**Execution Log** (if output_log_path != null):

**Determine filename**:
- If `--output PATH`: Use provided path
- Else: `./implement-[identifier]-[YYYY-MM-DD-HHMMSS].log`

**Log content**:
```markdown
# Implementation Execution Log

**Date**: [timestamp]
**Spec**: [identifier] - [title]
**Work Folder**: [path or "Standalone"]

## Execution Summary
[Copy from Step 4.1]

## Phase Details
[For each phase]:
  ### Phase [N]: [Title]
  **Status**: [Completed|Failed]
  **Duration**: [time]
  **Commit**: [$hash]
  **Tasks**:
  - [task details]

## Validation Results
[Copy validation output from Phase 3]

## Git Commits
[List all commits with full messages]

## Files Modified
[Full file list with line changes]

## Next Steps
[Copy from Step 4.3]
```

Write using Write tool.

**Acknowledge**:
```
📄 **[Implement]** Execution log saved: [filename]
```

---

**Jira Posting** (if post_to_jira == true AND jira_id exists):

**Format summary**:
```markdown
**Implementation Completed - Claude Code**

✅ **Status**: Implementation complete

**Phases**: [P]/[P] completed
**Tasks**: [T]/[T] completed
**Commits**: [C] commits

**Git Commits**:
[For each commit]:
- [$short_hash] - [message first line]

**Validation**:
- Linting: [✅|⚠️|❌] [status]
- Tests: [✅|⚠️|❌] [count]/[count] passing
- Acceptance criteria: [✅|⚠️] [auto]/[total] verified

[If validation incomplete]:
**Issues Remaining**:
- [List critical issues]

**Next Steps**: Review changes, create PR, request code review

---
Generated by Claude Code Implementation Executor
```

**Post to Jira**:
```
Use mcp__jira__addCommentToJiraIssue:
  cloudId: "productboard.atlassian.net"
  issueIdOrKey: [jira_id]
  commentBody: [formatted summary]
```

**Acknowledge**:
```
✅ **[Implement]** Summary posted to Jira: [jira_id]
```

**If posting fails**:
```
⚠️  **[Implement]** Failed to post to Jira: [error]
(Continuing anyway)
```

**If no Jira ID**:
```
⚠️  **[Implement]** Cannot post to Jira: No Jira ID available
```

---

### Step 4.3: Suggest Next Steps (Enhanced with verification guidance)

**If validation complete (all passed)**:
```
**Next Steps**:

1. 📝 Review implementation:
   - Code changes: git diff origin/main
   - Commit history: git log --oneline
   - Verification report: cat [path]/05-verification.md ← NEW
   - Evidence review: Check timestamped observations ← NEW

2. 🔍 Code review preparation:
   - Attach 05-verification.md to PR description ← NEW
   - Reference evidence hashes for integrity ← NEW
   - Mention smoke test coverage in PR ← NEW

3. 🧪 Manual testing (from spec):
   [List manual testing steps from Testing Strategy section]
   - Note: Smoke tests already verified end-to-end behavior ← NEW

4. 🚀 Create PR:
   /schovi:publish

   PR will include: ← NEW
   - Spec (03-plan.md)
   - Implementation commits ([count])
   - Verification report (05-verification.md) ← NEW
   - Rollback script (rollback.sh) ← NEW

   Options:
   - Auto-detect from branch: /schovi:publish
   - Explicit Jira ID: /schovi:publish [jira_id]
   - Explicit spec: /schovi:publish --spec [spec_file]

   Features:
   - Auto-pushes branch with upstream tracking
   - Creates draft PR by default (use --ready for ready PR)
   - Generates description from spec → Jira → commits
   - Updates existing PR if run again

5. 📊 Staging deployment: ← NEW
   - Re-run smoke tests in staging environment
   - Compare evidence hashes (should match)
   - Verify rollback script works in staging

6. 👥 Request code review

7. ✅ Address feedback & merge

8. 📊 Production deployment: ← NEW
   - Rollback plan ready if needed: ./rollback.sh
   - Smoke tests can verify production behavior
```

**If validation incomplete (failures)**:
```
**Next Steps**:

1. ⚠️  Fix validation issues first:
   [For each failing validation]:
   - [Type]: [Brief description of issue]
   - Command: [command to re-run]
   - [If smoke tests failed]: Review 05-verification.md for evidence ← NEW

2. 📝 Review failures:
   - Failed tests/linting: [List specific files/tests]
   - Failed smoke scenarios: See 05-verification.md#scenario-[N] ← NEW
   - Evidence collected: [path]/05-verification.md ← NEW

3. 🔧 Apply fixes:
   [Suggestions for fixing issues]
   - For smoke test failures: Check expectations vs observations in report ← NEW

4. ♻️  Re-run validation:
   [lint command]
   [test command]
   - For smoke tests only: /schovi:implement --smoke-only ← NEW

5. 💾 Commit fixes when ready

6. 🚀 Then create PR: /schovi:publish

**Emergency Rollback** (if needed): ← NEW
If implementation is causing issues:
  cd [work folder]
  ./rollback.sh
  # Verify clean state with post-cleanup checklist
```

---

### Step 4.4: Proactive PR Creation Offer

**If validation complete AND work folder exists**:
```
🚀 Ready to publish?

I can create a GitHub Pull Request with:
- Branch: [current_branch]
- Title: [from Jira or commits]
- Description: [from spec/plan]
- Changes: [all commits]

Would you like me to run `/schovi:publish` now? [yes/no]
```

**If user says "yes"**:
- Use SlashCommand tool: `/schovi:publish`

**If user says "no"**:
```
Perfect! Create PR when ready:
  /schovi:publish
```

---

### Step 4.5: Completion Signal

Execute confetti command:
```bash
open "raycast://extensions/raycast/raycast/confetti" 2>/dev/null || true
```

Display final message:
```
╭─────────────────────────────────────────────╮
│ 🎊 Implementation workflow complete!        │
╰─────────────────────────────────────────────╯
```

**Update Final Metadata** (if work folder):
```json
{
  "workflow": {
    "completed": ["analyze", "plan", "implement"],
    "current": "implement"
  },
  "phases": {
    "completed": [total],
    "current": null
  },
  "validation": {
    "linting": "passed|incomplete|failed",
    "tests": "passed|incomplete|failed",
    "typecheck": "passed|incomplete|failed|n/a"
  },
  "timestamps": {
    "lastModified": "[now]",
    "completed": "[now]"
  }
}
```

---

## ERROR HANDLING & EDGE CASES

### Scenario 1: No Spec Found (Standalone Mode)

```
❌ Error: Could not find specification

**Tried**:
- Work folder: No work folder detected
- --input flag: Not provided
- Positional argument: Not provided
- Conversation history: No spec found (searched 30 messages)

**Suggestions**:
1. Create spec first: /schovi:plan [input]
2. Provide file path: /schovi:implement --input ./spec.md
3. Provide Jira ID: /schovi:implement EC-1234
4. Ensure you're in project with .WIP folder structure
```

---

### Scenario 2: Work Folder Found But No Plan

```
❌ Error: Work folder found but no plan

**Work Folder**: $work_folder
**Problem**: 03-plan.md not found

**Suggestions**:
1. Generate plan: /schovi:plan
2. Check work folder is correct
3. Or use standalone mode: /schovi:implement --input ./spec.md
```

---

### Scenario 3: Spec Malformed

```
⚠️  Warning: Spec structure incomplete

**Found**:
- YAML frontmatter: [✅|❌]
- Implementation Tasks: [✅|❌]
- Acceptance Criteria: [⚠️ Missing]
- Testing Strategy: [⚠️ Missing]

**Problem**: [Description]

**Impact**: [What functionality will be limited]

**Options**:
1. Fix spec and re-run
2. Continue with limited information (risky)
3. Cancel and regenerate spec

Continue anyway? [yes/no]
```

---

### Scenario 4: Project Type Unknown

```
⚠️  Warning: Could not detect project type

**Checked for**:
- package.json (Node.js)
- pyproject.toml, setup.py (Python)
- go.mod (Go)
- Gemfile (Ruby)
- Cargo.toml (Rust)

**Not found**: No standard project files

**Impact**: Cannot run automatic validation

**Options**:
1. Continue without validation (--skip-validation implied)
2. Cancel and configure validation manually
3. Specify validation commands [future feature]

Continue without validation? [yes/no]
```

---

### Scenario 5: Git Issues - Uncommitted Changes

```
⚠️  Git warning: Uncommitted changes detected

**Current Status**:
- Modified: [count] files
- Untracked: [count] files
- Staged: [count] files

**Impact**: Implementation commits may be mixed with existing changes

**Options**:
1. Stash changes: git stash
2. Commit existing changes: git commit -am "WIP"
3. Continue anyway (not recommended)
4. Cancel

What would you like to do? [1-4]
```

---

### Scenario 6: Git Conflicts During Commit

```
❌ Git conflicts detected

**Phase**: [N]
**Problem**: Cannot commit due to merge conflicts

**Conflicts in**:
- [file1]
- [file2]

**Actions**:
1. Resolve conflicts manually:
   - Edit conflicted files
   - git add [files]
   - Continue: /schovi:implement --resume

2. Skip auto-commit for now:
   - Cancel this implementation
   - Re-run with: /schovi:implement --no-commit
   - Commit manually later

3. Rollback phase:
   - Revert changes: git reset --hard
   - Re-run phase

What would you like to do? [1-3]
```

---

### Scenario 7: Task Execution Failure

```
⚠️  Task execution issue

**Task**: [N.M] - [Description]
**Error**: [Error message]
**File**: [file being modified]

**Attempted**:
- [What was tried]
- [Result]

**Options**:
1. Skip task (add TODO comment in code)
2. Retry with different approach [if applicable]
3. Pause implementation (save progress)
4. Cancel implementation

What would you like to do? [1-4]
```

---

### Scenario 8: File Not Found

```
❌ Cannot find file: [file_path]

**Mentioned in**: Phase [N], Task [M]
**Expected**: [description from task]

**Possible causes**:
- File path incorrect in plan
- File not yet created (task order issue)
- Wrong directory
- File moved/renamed

**Actions**:
1. Search for file: find . -name "[filename]"
2. Skip task and mark as TODO
3. Create file structure and retry
4. Pause implementation

What would you like to do? [1-4]
```

---

### Scenario 9: Validation Timeout

```
⚠️  Validation timeout

**Command**: [test/lint command]
**Timeout**: Exceeded 5 minutes
**Status**: Still running in background

**Options**:
1. Wait longer (extend timeout)
2. Skip this validation
3. Kill process and continue
4. Cancel implementation

What would you like to do? [1-4]
```

---

### Scenario 10: Resume Without Progress

```
❌ Error: Cannot resume - no progress found

**--resume flag**: Present
**Problem**: No checkpoint data found

**Checked**:
- Work folder: [path or "Not found"]
- 04-progress.md: [Not found]
- .metadata.json phases.current: [Not found or null]

**Possible reasons**:
1. No previous implementation run
2. Checkpoint files deleted
3. Wrong directory

**Resolution**:
1. Start fresh: /schovi:implement
2. Start from specific phase: /schovi:implement --phase N
3. Check directory: pwd
```

---

### Scenario 11: Phase Specified Out of Range

```
❌ Error: Invalid phase number

**--phase flag**: [N]
**Total phases**: [P]
**Problem**: Phase [N] does not exist (only [P] phases in plan)

**Available phases**:
- Phase 1: [Title]
- Phase 2: [Title]
...
- Phase [P]: [Title]

**Resolution**:
Specify valid phase: /schovi:implement --phase [1-P]
```

---

## USAGE EXAMPLES

### Example 1: Fresh Implementation (Work Folder)

```bash
# After analyze → plan workflow
/schovi:implement

# Workflow:
# 1. Auto-detects work folder from git branch
# 2. Loads 03-plan.md
# 3. Creates/updates 04-progress.md
# 4. Executes Phase 1 → Commits
# 5. Executes Phase 2 → Commits (automatic, no prompts)
# 6. Executes Phase 3 → Commits
# 7. Runs validation (linting, tests)
# 8. Shows completion summary
# 9. Offers to create PR
```

---

### Example 2: Fresh Implementation (Standalone)

```bash
# With explicit spec file
/schovi:implement --input ./spec-EC-1234.md

# Workflow:
# 1. No work folder found → Standalone mode
# 2. Loads spec from ./spec-EC-1234.md
# 3. Executes all phases with commits
# 4. Runs validation
# 5. Shows completion (no work folder = no 04-progress.md)
```

---

### Example 3: Resume After Pause

```bash
# Previously paused after Phase 2
/schovi:implement --resume

# Workflow:
# 1. Auto-detects work folder
# 2. Reads metadata: phases.current = 3
# 3. Reads 04-progress.md
# 4. Shows: "Resuming from Phase 3"
# 5. Continues with Phase 3 and remaining phases
```

---

### Example 4: Interactive Mode

```bash
# Ask after each phase
/schovi:implement --interactive

# Workflow:
# After each phase commits, asks:
# "Continue to Phase N? [yes/no/pause]"
# User has control over pacing
```

---

### Example 5: Manual Commits

```bash
# No automatic commits
/schovi:implement --no-commit

# Workflow:
# 1. Executes all tasks
# 2. Updates progress.md
# 3. No git commits created
# 4. User commits manually:
#    git add .
#    git commit -m "Custom message"
```

---

### Example 6: Skip Validation

```bash
# For quick prototyping
/schovi:implement --skip-validation

# Workflow:
# 1. Executes all phases
# 2. Skips linting, tests, type check
# 3. Faster completion
```

---

### Example 7: Enhanced Commits

```bash
# Conventional commit format
/schovi:implement --verbose

# Commits use:
# feat: Add new feature
# fix: Correct bug
# chore: Update config
```

---

### Example 8: Start from Specific Phase

```bash
# Jump to Phase 3
/schovi:implement --phase 3

# Use case: Phases 1-2 done manually
# Validates phase 3 <= total_phases
```

---

### Example 9: Full Featured

```bash
# All bells and whistles
/schovi:implement \
  --interactive \
  --verbose \
  --output ./logs/impl.log \
  --post-to-jira

# Interactive with enhanced commits, logging, Jira posting
```

---

### Example 10: Conversation Auto-detect

```bash
# After running /schovi:plan in same session
/schovi:plan EC-1234
# ... plan generates ...

/schovi:implement
# Auto-detects spec from conversation
# Or from work folder if available
```

---

## KEY FEATURES SUMMARY

1. ✅ **Work Folder Integration** - Seamless .WIP structure, metadata sync
2. ✅ **Pause/Resume** - Checkpoint at any phase boundary
3. ✅ **Multi-source Input** - Work folder → Files → Jira → Conversation
4. ✅ **Progress Tracking** - 04-progress.md with visual indicators
5. ✅ **Retry Logic** - 2-attempt validation with auto-fix
6. ✅ **Configurable Autonomy** - --interactive vs fully autonomous
7. ✅ **Phase Control** - --resume, --phase N for granular control
8. ✅ **Comprehensive Validation** - Linting, tests, type check with fixes
9. ✅ **Flexible Commits** - Simplified (default) or --verbose (conventional)
10. ✅ **Robust Error Handling** - 11+ scenarios with recovery strategies
11. ✅ **Shared Libraries** - Modular, maintainable, reusable patterns
12. ✅ **Output Options** - Logs, Jira posting, terminal control
13. ✅ **Proactive Next Steps** - Offers PR creation automatically
14. ✅ **Multi-language** - Node.js, Python, Go, Ruby, Rust

---

## VALIDATION CHECKLIST

Before starting:
- [ ] Arguments parsed successfully
- [ ] Work folder detected or standalone mode confirmed
- [ ] Spec loaded and parsed
- [ ] Phases extracted (phased or flat)
- [ ] Starting phase determined
- [ ] Project type detected
- [ ] Validation commands identified
- [ ] Git working directory status checked

During implementation:
- [ ] Each task executed or explicitly skipped
- [ ] Progress file updated after each task (if work folder)
- [ ] Phase checkpoint created (commit or progress update)
- [ ] Metadata updated with phase status (if work folder)
- [ ] User prompted after phase (if interactive mode)

During validation:
- [ ] Linting attempted (max 2 attempts)
- [ ] Auto-fix attempted if linting fails
- [ ] Type check run (if applicable)
- [ ] Tests attempted (max 2 attempts)
- [ ] Test fixes attempted if tests fail
- [ ] Acceptance criteria verified (auto + manual)
- [ ] Validation summary generated

After completion:
- [ ] All phases marked complete
- [ ] Final metadata updated (if work folder)
- [ ] Summary displayed
- [ ] Output log created (if requested)
- [ ] Jira posted (if requested)
- [ ] Next steps provided
- [ ] Proactive PR offer (if applicable)
- [ ] Confetti executed

---

## SUCCESS METRICS

**Implementation successful when**:
- ✅ All phases completed or explicitly paused
- ✅ All tasks completed or explicitly skipped (with TODO)
- ✅ Commits created (if auto_commit enabled)
- ✅ Validation passed or documented as incomplete
- ✅ Acceptance criteria verified (automatic ones)
- ✅ Clear next steps provided
- ✅ User can proceed to PR or address issues

**Implementation requires follow-up when**:
- ⚠️  Validation failures after 2 attempts
- ⚠️  Tasks blocked by missing dependencies
- ⚠️  Spec ambiguities required assumptions
- ⚠️  Manual testing needed before PR

---

## NOTES FOR IMPLEMENTATION

**Model Selection**:
- Use Haiku for efficiency on straightforward implementations
- Escalate to Sonnet for complex logic or error recovery

**Context Management**:
- Keep spec content in context throughout
- Reference spec sections when making decisions
- Don't reload spec unnecessarily
- Use shared libraries to reduce context size

**User Experience**:
- Show progress frequently (visual updates)
- Use formatting (boxes, emojis) for milestones
- Provide clear status per task/phase
- Celebrate completion with confetti

**Error Recovery**:
- Auto-fix when possible (linting, simple test fixes)
- Continue execution with autonomy (mark failures, continue)
- Document failures clearly in summary
- Provide actionable next steps

**Git Best Practices**:
- Phase-based commits keep history clean
- Descriptive messages reference spec
- Include Jira ID for traceability
- Use HEREDOC format for multi-line messages

**Testing Philosophy**:
- Run full test suite
- Attempt automatic fixes (2 attempts max)
- Document when manual intervention needed
- Don't skip validation unless explicitly requested

---

## FINAL REMINDERS

1. **Execute with configurable autonomy** - Default fully autonomous, --interactive for control
2. **Integrate with work folders** - Use .WIP, metadata, progress tracking when available
3. **Support standalone mode** - Graceful fallback when no work folder
4. **Make focused changes** - Follow spec precisely
5. **Create meaningful commits** - Phased or conventional (--verbose)
6. **Validate thoroughly** - 2-attempt retry with auto-fix
7. **Handle errors gracefully** - 11+ scenarios with recovery
8. **Report clearly** - Progress, celebrate success, document issues
9. **Leverage shared libraries** - Argument parser, input processor, work folder manager
10. **Provide next steps** - Guide user, offer PR creation
11. **Run confetti** - Signal completion

---

🚀 **Ready to execute implementation with best of v1 and v2!**
