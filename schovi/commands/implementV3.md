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

  # Commit flags
  - name: "--verbose"
    type: "boolean"
    description: "Use enhanced conventional commits with type detection"

# Flag validation rules
conflicts:
  - flags: ["--output", "--no-file"]
    error: "Cannot use --output and --no-file together"
    resolution: "Choose either custom log path (--output) or no log file (--no-file)"

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

### Step 3.5: Verify Acceptance Criteria

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

### Step 3.6: Validation Summary

**Success Scenario**:
```
╭─────────────────────────────────────────────╮
│ ✅ VALIDATION COMPLETE                      │
╰─────────────────────────────────────────────╯

**Linting**: ✅ Passed (Attempt 1/2)
**Type Check**: ✅ Passed
**Tests**: ✅ Passed (Attempt 1/2, [count]/[count] tests)
**Acceptance Criteria**: ✅ [auto]/[total] verified ([manual] pending)

**Commits Created**: [impl] implementation + [fix] fixes
**Total Changes**: +[add] -[del] lines across [files] files

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
**Acceptance Criteria**: ✅ [auto]/[total] verified

**Commits Created**: [impl] implementation + [fix] fixes
**Total Changes**: +[add] -[del] lines across [files] files

**Fix Details**:
- Linting: Auto-fix resolved [count] issues
- Tests: Fixed [brief description]

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
**Acceptance Criteria**: ⚠️  [auto]/[total] verified

**Issues**:
- Linting ([count] remaining):
  [List issues]
- Type Check ([count] errors):
  [List errors]
- Tests ([count] failures):
  [List failures]

**Commits Created**: [impl] implementation + [partial] partial fixes
**Total Changes**: +[add] -[del] lines across [files] files

**Recommendation**:
- Fix remaining issues manually
- Re-run validation: [commands]
- Then proceed to PR creation
```

---

## PHASE 4: COMPLETION & NEXT STEPS

### Step 4.1: Display Final Summary

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

**Git Commits**:
[For each commit]:
  [N]. [$short_hash] - [message first line]

**Validation Results**:
- [✅|⚠️|❌] Linting: [status]
- [✅|⚠️|❌] Type check: [status]
- [✅|⚠️|❌] Tests: [status]
- [✅|⚠️] Acceptance criteria: [auto]/[total] verified

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

### Step 4.3: Suggest Next Steps

**If validation complete (all passed)**:
```
**Next Steps**:

1. 📝 Review changes:
   git diff origin/main
   git log --oneline

2. 🧪 Manual testing (from spec):
   [List manual testing steps from Testing Strategy section]

3. 🚀 Create PR:
   /schovi:publish

   Options:
   - Auto-detect from branch: /schovi:publish
   - Explicit Jira ID: /schovi:publish [jira_id]
   - Explicit spec: /schovi:publish --spec [spec_file]

   Features:
   - Auto-pushes branch with upstream tracking
   - Creates draft PR by default (use --ready for ready PR)
   - Generates description from spec → Jira → commits
   - Updates existing PR if run again

4. 👥 Request code review

5. ✅ Address feedback & merge
```

**If validation incomplete (failures)**:
```
**Next Steps**:

1. ⚠️  Fix validation issues first:
   [For each failing validation]:
   - [Type]: [Brief description of issue]
   - Command: [command to re-run]

2. 📝 Review failed tests/linting:
   [List specific files/tests]

3. 🔧 Apply fixes:
   [Suggestions for fixing issues]

4. ♻️  Re-run validation:
   [lint command]
   [test command]

5. 💾 Commit fixes when ready

6. 🚀 Then create PR: /schovi:publish
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
