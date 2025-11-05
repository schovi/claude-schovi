---
description: Phase-based implementation with progress tracking, pause/resume support, and automatic checkpoints
argument-hint: [--resume] [--phase N] [--no-commit] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Edit", "Grep", "Glob", "Task", "Bash", "AskUserQuestion"]
---

# Implementation Executor with Phase Management

You are **executing an implementation plan** with phase-based progress tracking, automatic checkpoints, and resume capability for large tasks.

---

## ⚙️ PHASE 1: INITIALIZATION & WORK FOLDER RESOLUTION

### Step 1.1: Parse Command Arguments

**Input Received**: $ARGUMENTS

Parse flags:

- **`--resume`**: Continue from last checkpoint
  - Reads metadata.phases.current to determine where to continue
  - Loads 04-progress.md to show completed work

- **`--phase N`**: Start from specific phase number
  - Example: --phase 2 starts at Phase 2
  - Validates phase exists in plan

- **`--no-commit`**: Skip automatic commits after phases
  - User will handle git commits manually
  - Still updates progress.md

- **`--work-dir PATH`**: Use specific work folder
  - Example: --work-dir .WIP/EC-1234-add-auth
  - Overrides auto-detection

**Store parsed values**:
```
resume_mode = [boolean]
specific_phase = [number or null]
auto_commit = [true unless --no-commit]
work_dir = [path or null]
```

### Step 1.2: Auto-detect Work Folder

**Objective**: Find work folder containing 03-plan.md

**Priority Order**:

1. **From --work-dir flag**:
```bash
work_folder="$work_dir"
```

2. **From Git Branch**:
```bash
branch=$(git rev-parse --abbrev-ref HEAD)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+')

if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)
fi
```

3. **Recent work folders**:
```bash
ls -dt .WIP/*/ | head -5
# Check each for 03-plan.md
```

**Validation**:
```bash
if [ ! -f "$work_folder/03-plan.md" ]; then
  echo "❌ No plan found in $work_folder"
  echo "Run /schovi:plan first to generate implementation plan"
  exit 1
fi
```

**Acknowledge work folder**:
```
📁 **[Implement]** Work folder: $work_folder
```

### Step 1.3: Load Plan and Metadata

**Read plan**:
```bash
cat "$work_folder/03-plan.md"
```

**Parse plan structure**:
- Extract phases (look for "## Phase N:" or "### Phase N:" headers)
- Count total phases
- Extract tasks per phase
- Identify if multi-phase or single-phase

**Read metadata**:
```bash
cat "$work_folder/.metadata.json"
```

**Extract phase status**:
```json
{
  "phases": {
    "total": 4,
    "completed": 2,
    "current": 3,
    "list": [
      {"number": 1, "title": "...", "status": "completed", "commit": "abc123"},
      {"number": 2, "title": "...", "status": "completed", "commit": "def456"},
      {"number": 3, "title": "...", "status": "in_progress", "commit": null},
      {"number": 4, "title": "...", "status": "pending", "commit": null}
    ]
  }
}
```

### Step 1.4: Read or Create Progress File

**If 04-progress.md exists**:
```bash
cat "$work_folder/04-progress.md"
```

**Parse progress**:
- Identify completed phases (✅ markers)
- Identify current phase (🚧 marker)
- Extract last checkpoint commit

**If 04-progress.md doesn't exist, create initial**:

Use Write tool: `$work_folder/04-progress.md`
```markdown
# Implementation Progress

**Work Folder**: [work_folder]
**Plan**: 03-plan.md
**Started**: [timestamp]

## Phases

### ⏳ Phase 1: [Title]
Status: Pending
Tasks: [count] tasks

### ⏳ Phase 2: [Title]
Status: Pending
Tasks: [count] tasks

[... for each phase]

---

**Legend**:
- ✅ Completed
- 🚧 In Progress
- ⏳ Pending
- ❌ Failed
```

### Step 1.5: Determine Starting Phase

**Logic**:

1. **If --phase N provided**:
   - Start at phase N
   - Validate N <= total phases

2. **If --resume flag**:
   - Start at metadata.phases.current
   - Or find first non-completed phase in metadata.phases.list

3. **If neither flag**:
   - If phases.completed == 0: Start at phase 1
   - Else: Ask user to use --resume or --phase

**Acknowledge start point**:
```
🚀 **[Implement]** Starting at Phase [N]: [Title]
```

---

## ⚙️ PHASE 2: PHASE EXECUTION LOOP

**For each phase** from starting_phase to total_phases:

### Step 2.1: Load Phase Context

**Extract phase details from plan**:
```markdown
## Phase [N]: [Title]

**Tasks**:
- Task 1: Description
  Files: path/to/file.ts:123
- Task 2: Description
  Files: path/to/file.ts:456

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
```

**Parse**:
- phase_number = N
- phase_title = [Title]
- phase_tasks = [List of tasks with file references]
- phase_criteria = [Acceptance criteria]

**Show phase header**:
```
╭─────────────────────────────────────────────────────────╮
│ 🚧 PHASE [N]/[TOTAL]: [TITLE]                          │
╰─────────────────────────────────────────────────────────╯

Tasks: [count]
Files affected: [list key files]

Starting implementation...
```

### Step 2.2: Execute Phase Tasks

**For each task in phase**:

1. **Show task**:
   ```
   📝 Task [N.M]: [Description]
      Files: [file references]
   ```

2. **Read relevant files**:
   - Use Read tool for files mentioned in task
   - Load context for changes

3. **Implement changes**:
   - Use Edit tool for modifications
   - Use Write tool for new files
   - Follow task description

4. **Mark task complete**:
   ```
   ✅ Task [N.M] complete
   ```

5. **Update progress.md** (append):
   ```markdown
   - [x] Task [N.M]: [Description]
   ```

**Handle errors**:
```
If task fails (edit error, file not found, etc.):

❌ **[Implement]** Task [N.M] failed: [error]

Options:
1. Skip task and continue (mark as TODO)
2. Pause implementation (save progress)
3. Cancel implementation

What would you like to do? [1-3]
```

### Step 2.3: Verify Phase Completion

**Check acceptance criteria**:
```
For each criterion in phase_criteria:
- Run tests if criterion mentions testing
- Check file exists if criterion mentions file creation
- Validate logic if criterion is verifiable

Mark:
- ✅ if verified
- ⚠️ if cannot auto-verify (manual check needed)
- ❌ if fails
```

**Summary**:
```
📊 Phase [N] Summary:
✅ Tasks completed: [count]/[total]
⚠️ Manual verification needed: [count]
❌ Tests failing: [count]

[If all ✅]:
✅ Phase [N] complete! Ready to commit.

[If any ❌]:
⚠️ Phase [N] has failures. Review before committing.
```

### Step 2.4: Create Phase Checkpoint

**If auto_commit == true** (default):

1. **Stage changes**:
   ```bash
   git add .
   ```

2. **Generate commit message**:
   ```markdown
   feat: Complete [Phase Title] (Phase [N]/[TOTAL])

   Implemented:
   - [Task 1 summary]
   - [Task 2 summary]
   - [Task 3 summary]

   Files modified:
   - path/to/file1.ts
   - path/to/file2.ts

   Related to: [identifier]

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

3. **Commit**:
   ```bash
   git add . && git commit -m "$(cat <<'EOF'
   [commit message from above]
   EOF
   )"
   ```

4. **Get commit hash**:
   ```bash
   git log -1 --format='%H'
   ```

5. **Update metadata**:
   ```json
   {
     "phases": {
       "completed": [current + 1],
       "current": [next phase or null if done],
       "list": [
         ...update phase[N] with status="completed", commit="hash", completedAt="now"
       ]
     },
     "git": {
       "commits": [...existing, "hash"],
       "lastCommit": "hash"
     },
     "timestamps": {
       "lastModified": "[now]"
     }
   }
   ```

6. **Update progress.md**:
   ```markdown
   ### ✅ Phase [N]: [Title] (Completed [timestamp])
   - [x] Task N.1: [description]
   - [x] Task N.2: [description]

   **Commit**: [hash]
   **Duration**: [time since phase started]
   ```

7. **Acknowledge checkpoint**:
   ```
   💾 **[Implement]** Phase [N] checkpoint created
   📍 Commit: [short-hash]
   ```

**If auto_commit == false** (--no-commit):
- Skip git commit
- Update progress.md with status
- Update metadata with completed status (no commit hash)
- Show: "⚠️ Commit skipped (--no-commit flag). Commit manually when ready."

### Step 2.5: Check if Pause Requested

**After each phase, ask**:
```
🎯 Phase [N] complete! ([completed]/[total] phases done)

Continue to Phase [N+1]? [yes/no/pause]

- yes: Continue immediately
- no: Pause (resume with --resume)
- pause: Same as no
```

**If user says "yes"**:
- Continue to next phase

**If user says "no" or "pause"**:
- Update metadata.phases.current to next phase
- Save all progress
- Show resume instructions:
  ```
  ⏸️ **[Implement]** Implementation paused

  Progress saved:
  - Completed: [count] phases
  - Next: Phase [N+1]

  To resume:
  /schovi:implement --resume
  ```
- Exit phase loop

### Step 2.6: Move to Next Phase

**If more phases remaining**:
- Increment current_phase
- Loop back to Step 2.1

**If all phases complete**:
- Proceed to Phase 3 (Completion)

---

## ⚙️ PHASE 3: COMPLETION

### Step 3.1: Final Summary

```
╭─────────────────────────────────────────────────────────╮
│ ✅ IMPLEMENTATION COMPLETE                              │
╰─────────────────────────────────────────────────────────╯

**Work Folder**: $work_folder

**Phases Completed**: [total]
[For each phase]:
  ✅ Phase [N]: [Title]
     Commit: [hash]
     Tasks: [count]

**Total Commits**: [count]
**Total Files Modified**: [count]

**Next Steps**:
- Review changes: git log --oneline
- Run tests: [test command if available]
- Create PR: /schovi:publish
```

### Step 3.2: Update Final Metadata

**Set workflow as complete**:
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
  "timestamps": {
    "lastModified": "[now]",
    "completed": "[now]"
  }
}
```

### Step 3.3: Proactive Next Steps

**Offer to create PR**:
```
🚀 Ready to publish?

I can create a GitHub Pull Request with:
- Branch: [current branch]
- Title: [from Jira or commits]
- Description: [from plan and progress]
- Changes: [all commits]

Would you like me to run `/schovi:publish` now? [yes/no]
```

**If user says "yes"**:
- Use SlashCommand tool: `/schovi:publish`

**If user says "no"**:
```
Perfect! Here's what you can do:

1. 📤 Create PR manually:
   - /schovi:publish
   - Or: gh pr create

2. 🧪 Run tests:
   - npm test
   - pytest
   - [project-specific]

3. 📝 Review changes:
   - git diff main
   - git log --oneline

4. ✅ Mark as done:
   - Implementation complete! 🎉
```

---

## ⚙️ ERROR HANDLING

### Scenario 1: No Plan Found
```
❌ Cannot start implementation - no plan found

Work folder: $work_folder

Required: 03-plan.md

Actions:
1. Generate plan: /schovi:plan
2. Or specify different work folder: --work-dir PATH
```

### Scenario 2: Git Conflicts
```
❌ Git conflicts detected

Cannot commit Phase [N] due to merge conflicts.

Actions:
1. Resolve conflicts manually
2. Stage resolved files: git add .
3. Resume: /schovi:implement --resume

Or:
- Skip auto-commit: /schovi:implement --no-commit
- Commit manually later
```

### Scenario 3: Test Failures
```
⚠️ Tests failing after Phase [N]

Phase committed but tests are failing.

Options:
1. Continue anyway (fix later)
2. Pause and fix now
3. Rollback phase (git reset HEAD~1)

What would you like to do? [1-3]
```

### Scenario 4: File Not Found
```
❌ Cannot find file: path/to/file.ts:123

Mentioned in Phase [N], Task [M]

Possible causes:
- File path incorrect in plan
- File not yet created
- Wrong directory

Actions:
1. Skip task (mark as TODO)
2. Search for file: find . -name "file.ts"
3. Pause implementation

What would you like to do? [1-3]
```

---

## 💡 USAGE EXAMPLES

### Example 1: Fresh Implementation
```bash
# After analyze → plan workflow
/schovi:implement

# Workflow:
# 1. Auto-detects work folder from git branch
# 2. Loads 03-plan.md
# 3. Creates 04-progress.md
# 4. Executes Phase 1
# 5. Commits Phase 1
# 6. Asks to continue to Phase 2
# 7. Repeats until all phases done
```

### Example 2: Resume After Pause
```bash
# Previously paused after Phase 2
/schovi:implement --resume

# Workflow:
# 1. Auto-detects work folder
# 2. Reads metadata: phases.current = 3
# 3. Loads progress from 04-progress.md
# 4. Shows: "Resuming from Phase 3"
# 5. Continues with Phase 3
```

### Example 3: Start from Specific Phase
```bash
# Jump to Phase 3 (skip 1 and 2)
/schovi:implement --phase 3

# Use case: Phases 1-2 already done manually
```

### Example 4: Manual Commits
```bash
# Implement without auto-commits
/schovi:implement --no-commit

# Workflow:
# 1. Executes all tasks
# 2. Updates progress.md
# 3. No git commits
# 4. User commits manually when ready
```

---

## 🎯 KEY FEATURES

1. **Phase-based Execution**: Break large tasks into manageable phases
2. **Progress Tracking**: 04-progress.md shows exactly what's done
3. **Pause/Resume**: Stop anytime, resume later with --resume
4. **Automatic Checkpoints**: Git commit after each phase
5. **Metadata Sync**: Full workflow state in .metadata.json
6. **Error Recovery**: Handle failures gracefully, allow skip/retry
7. **Context Management**: Load only current phase details
8. **Proactive**: Offers next steps (create PR, run tests)

---

## 📋 VALIDATION CHECKLIST

Before starting implementation:
- [ ] Work folder found
- [ ] 03-plan.md exists and readable
- [ ] Metadata loaded successfully
- [ ] Git working directory clean (or user acknowledges)
- [ ] Phases extracted from plan
- [ ] Starting phase determined

During implementation:
- [ ] Each task executed successfully or marked for skip
- [ ] Progress.md updated after each task
- [ ] Phase checkpoint created (commit or progress update)
- [ ] Metadata updated with phase status
- [ ] User prompted for pause after each phase

After completion:
- [ ] All phases marked complete
- [ ] Final metadata updated
- [ ] Summary shown to user
- [ ] Next steps provided

---

## 🚀 WORKFLOW INTEGRATION

**Full Workflow**:
```
spec → analyze → plan → implement → commit → publish
  ↓        ↓        ↓        ↓
01-spec  02-anly  03-plan  04-prog
```

**Technical Workflow**:
```
analyze → plan → implement → commit → publish
    ↓        ↓        ↓
02-anly  03-plan  04-prog
```

**Bug Workflow**:
```
debug → [plan] → implement → commit → publish
   ↓               ↓
02-dbg         04-prog
```

---

## 🎉 BEGIN IMPLEMENTATION

Start with Phase 1: Initialization & Work Folder Resolution.
