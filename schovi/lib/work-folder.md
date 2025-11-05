# Work Folder Management Library

**TL;DR:** All commands write to `.WIP/[identifier]/` with numbered files (01-spec.md, 02-analysis.md, etc.) and track state in `.metadata.json`.

## Quick Start

### For Commands

Every command that produces output should:

```markdown
1. Find or create work folder: .WIP/EC-1234-slug/
2. Load or create .metadata.json
3. Write output: 0X-name.md (see file mapping below)
4. Update metadata: workflow.completed, files, timestamps
5. Show user: "Output saved to .WIP/EC-1234/02-analysis.md"
```

### File Mapping

| Command | Output File | Workflow Type |
|---------|-------------|---------------|
| spec | 01-spec.md | full (spec→analyze→plan→implement) |
| analyze | 02-analysis.md | technical (analyze→plan→implement) |
| debug | 02-debug.md | bug (debug→[plan]→implement) |
| plan | 03-plan.md | any |
| implement | 04-progress.md | any |

## Folder Structure

```
.WIP/
├── EC-1234-add-user-auth/              # Jira-based work
│   ├── .metadata.json                  # State tracking
│   ├── 02-analysis.md                  # From analyze command
│   ├── 03-plan.md                      # From plan command
│   ├── 04-progress.md                  # From implement command
│   └── context/                        # Supporting files
│       └── wireframe.png
│
├── GH-123-fix-timeout/                 # GitHub-based work
│   ├── .metadata.json
│   ├── 02-debug.md                     # From debug command
│   └── 03-plan.md
│
└── add-loading-spinner/                # Simple work (no external ID)
    ├── .metadata.json
    └── 03-plan.md
```

## Metadata Structure (.metadata.json)

```json
{
  "identifier": "EC-1234",
  "title": "Add user authentication",
  "workFolder": ".WIP/EC-1234-add-user-auth",

  "workflow": {
    "type": "technical",
    "steps": ["analyze", "plan", "implement"],
    "completed": ["analyze"],
    "current": "plan"
  },

  "files": {
    "analysis": "02-analysis.md",
    "plan": "03-plan.md"
  },

  "git": {
    "branch": "claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED",
    "commits": ["abc123f"],
    "lastCommit": "abc123f"
  },

  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://company.atlassian.net/browse/EC-1234",
    "githubIssue": null,
    "githubPR": null
  },

  "timestamps": {
    "created": "2025-01-15T10:00:00Z",
    "lastModified": "2025-01-15T12:00:00Z",
    "completed": null
  },

  "phases": {
    "total": 4,
    "completed": 2,
    "current": 3,
    "list": [
      {
        "number": 1,
        "title": "Auth setup",
        "status": "completed",
        "commit": "abc123f"
      }
    ]
  }
}
```

**Required fields:** identifier, title, workFolder, workflow, files, git, external, timestamps
**Optional fields:** phases (only for multi-phase implement)

## Command Integration Pattern

### Template (Copy This)

```markdown
## Phase 1: Resolve Work Folder

### 1.1: Parse input
- Extract Jira ID, GitHub issue, or description
- Check for --work-dir flag

### 1.2: Find existing work folder (if continuing workflow)

**Try in order:**

a) From --work-dir flag:
   Use exactly as specified

b) From git branch:
   bash:
   git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]{2,10}-[0-9]+'
   find .WIP -type d -name "EC-1234*" | head -1

c) From identifier in input:
   bash:
   echo "$input" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'
   find .WIP -type d -name "[identifier]*" | head -1

d) Recent folders:
   bash:
   ls -dt .WIP/*/ | head -5

### 1.3: Create work folder (if new work)

If no folder found:

bash:
# Generate identifier
jira_id="EC-1234"
slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50)
identifier="${jira_id}-${slug}"

# Create folder
mkdir -p ".WIP/$identifier/context"

## Phase 2: Load or Create Metadata

### 2.1: If folder exists, read metadata

bash:
cat .WIP/EC-1234/.metadata.json

Parse to understand:
- workflow.completed: what's done
- workflow.current: last step
- files: existing outputs

### 2.2: If new folder, create metadata

Use Write tool:
- file_path: .WIP/[identifier]/.metadata.json
- content: JSON with structure above

Set:
- workflow.type based on command (spec→"full", analyze→"technical", debug→"bug")
- workflow.steps: expected workflow
- workflow.completed: []
- workflow.current: [current command]
- git.branch: from git rev-parse --abbrev-ref HEAD
- timestamps.created: date -u +"%Y-%m-%dT%H:%M:%SZ"

### 2.3: Validate prerequisites

Check workflow.completed for required previous step:
- plan needs: "analyze" OR "spec"
- implement needs: "plan"

If missing, STOP with error:
"❌ Cannot run 'plan' - no analysis found. Run: /schovi:analyze EC-1234"

## Phase 3: Execute Command

[Your command-specific logic here]

Read previous outputs if needed:
- Plan command reads: 02-analysis.md or 01-spec.md
- Implement reads: 03-plan.md

## Phase 4: Write Output

Determine file path:
- spec → .WIP/[identifier]/01-spec.md
- analyze → .WIP/[identifier]/02-analysis.md
- debug → .WIP/[identifier]/02-debug.md
- plan → .WIP/[identifier]/03-plan.md
- implement → .WIP/[identifier]/04-progress.md

Use Write tool:
- file_path: [path above]
- content: [your output]

## Phase 5: Update Metadata

Read existing metadata, update:
- workflow.completed: append current command (if not already there)
- workflow.current: current command
- files.[command]: output filename
- timestamps.lastModified: now
- git.commits: append new commits if any
- phases.*: update if implement command

Use Write tool to save updated metadata.

## Phase 6: Show Results

✅ [Command] complete!

📁 Work folder: .WIP/[identifier]/
📄 Output: 0X-name.md

Next steps:
- Review: cat .WIP/[identifier]/0X-name.md
- Continue: /schovi:[next-command]
```

## Examples

### Example 1: Analyze Command (New Work)

**Input:** `/schovi:analyze EC-1234`

```markdown
1. Parse input: EC-1234 (Jira ID)

2. Fetch Jira via jira-analyzer:
   Title: "Add user authentication"

3. Generate identifier:
   bash: echo "Add user authentication" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
   Result: EC-1234-add-user-authentication

4. Check if folder exists:
   bash: find .WIP -type d -name "EC-1234*"
   Result: (empty)

5. Create folder:
   bash: mkdir -p .WIP/EC-1234-add-user-authentication/context

6. Create metadata:
   Write tool: .WIP/EC-1234-add-user-authentication/.metadata.json
   Set: workflow.type="technical", steps=["analyze","plan","implement"]

7. Execute analysis: [deep codebase analysis]

8. Write output:
   Write tool: .WIP/EC-1234-add-user-authentication/02-analysis.md

9. Update metadata:
   workflow.completed=["analyze"], files.analysis="02-analysis.md"

10. Show user:
    ✅ Analysis complete!
    📁 Work folder: .WIP/EC-1234-add-user-authentication/
    📄 Analysis: 02-analysis.md
    Next: /schovi:plan
```

### Example 2: Plan Command (Auto-detect)

**Input:** `/schovi:plan` (no args)

```markdown
1. Parse input: (empty)

2. Auto-detect from git branch:
   bash: git rev-parse --abbrev-ref HEAD
   Result: claude/auth-EC-1234-011CUpGnQ1VA

   bash: echo "claude/auth-EC-1234-011CUpGnQ1VA" | grep -oE '[A-Z]{2,10}-[0-9]+'
   Result: EC-1234

3. Find folder:
   bash: find .WIP -type d -name "EC-1234*"
   Result: .WIP/EC-1234-add-user-authentication

4. Read metadata:
   bash: cat .WIP/EC-1234-add-user-authentication/.metadata.json
   workflow.completed: ["analyze"] ✅

5. Validate: "analyze" in completed ✅

6. Read input:
   Read tool: .WIP/EC-1234-add-user-authentication/02-analysis.md

7. Execute plan generation: [use spec-generator subagent]

8. Write output:
   Write tool: .WIP/EC-1234-add-user-authentication/03-plan.md

9. Update metadata:
   workflow.completed=["analyze","plan"], files.plan="03-plan.md"

10. Show user:
    ✅ Plan complete!
    📁 Work folder: .WIP/EC-1234-add-user-authentication/
    📄 Plan: 03-plan.md
    Next: /schovi:implement
```

### Example 3: Implement with Resume

**Input:** `/schovi:implement --resume`

```markdown
1. Parse input: --resume flag

2. Auto-detect from git:
   bash: git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]{2,10}-[0-9]+'
   bash: find .WIP -type d -name "EC-1234*"
   Result: .WIP/EC-1234-add-user-authentication

3. Read metadata:
   phases.completed: 2
   phases.current: 3
   phases.total: 4

4. Read progress:
   Read tool: .WIP/EC-1234-add-user-authentication/04-progress.md
   Phase 1: ✅ Complete
   Phase 2: ✅ Complete
   Phase 3: 🚧 In progress (50%)

5. Read plan (Phase 3 only):
   Read tool: .WIP/EC-1234-add-user-authentication/03-plan.md
   Extract Phase 3 tasks only

6. Execute Phase 3 tasks: [implementation]

7. Commit phase:
   bash: git add . && git commit -m "feat: Complete Phase 3"
   bash: git log -1 --format='%H'
   Result: ghi789j

8. Update progress:
   Write tool: .WIP/EC-1234-add-user-authentication/04-progress.md
   Phase 3: ✅ Complete (commit: ghi789j)

9. Update metadata:
   phases.completed=3, phases.list[2].status="completed", git.commits+=["ghi789j"]

10. Show user:
    ✅ Phase 3 complete!
    📊 Progress: 3/4 phases (75%)
    💾 Commit: ghi789j
    Next: /schovi:implement --resume
```

## Essential Bash Commands

```bash
# Extract Jira ID
echo "$input" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'

# Extract GitHub issue
echo "$input" | grep -oE '(issues|pull)/[0-9]+' | grep -oE '[0-9]+'

# Generate slug
echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//'

# Get current branch
git rev-parse --abbrev-ref HEAD

# Extract identifier from branch
git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]{2,10}-[0-9]+'

# Find work folder
find .WIP -type d -name "EC-1234*" | head -1

# List recent folders
ls -dt .WIP/*/ | head -5

# Get timestamp
date -u +"%Y-%m-%dT%H:%M:%SZ"

# Check if file exists
ls .WIP/EC-1234/02-analysis.md 2>/dev/null && echo "exists"

# Create folder
mkdir -p .WIP/EC-1234-slug/context
```

## Error Patterns

### Work Folder Not Found
```
❌ Work folder not found for "EC-1234"

Suggestions:
- Create: /schovi:analyze EC-1234
- Specify: /schovi:plan --input .WIP/EC-1234/02-analysis.md
- List: ls .WIP/
```

### Missing Prerequisites
```
❌ Cannot run 'plan' - no analysis found

Current: .WIP/EC-1234/ (workflow: [])
Required: 02-analysis.md or 01-spec.md

Action: Run /schovi:analyze EC-1234 first
```

## Command-Specific Notes

### analyze
- Creates: 02-analysis.md
- Workflow: technical (analyze→plan→implement)
- Can fetch Jira/GitHub context

### debug
- Creates: 02-debug.md (replaces analysis in bug workflow)
- Workflow: bug (debug→[plan]→implement)
- Root cause analysis + fix proposal

### spec (new, to be implemented)
- Creates: 01-spec.md
- Workflow: full (spec→analyze→plan→implement)
- Product discovery from images/docs/requirements

### plan
- Requires: analyze OR spec completed
- Creates: 03-plan.md
- Can use --from-scratch to bypass analysis
- Multi-phase for large tasks

### implement (to be enhanced)
- Requires: plan completed
- Creates: 04-progress.md
- Supports --resume for multi-phase
- Auto-commits after each phase

## Key Principles

1. **Auto-detect first** - Try git branch, then identifier, then recent folders
2. **Fail fast** - Block if prerequisites missing, show exact command to run
3. **Idempotent** - Commands can be re-run safely, overwrite existing outputs
4. **Update metadata always** - After every command execution
5. **Clear errors** - Always suggest exact next action

## Testing

```bash
# Test analyze (new work)
/schovi:analyze TEST-001
ls .WIP/TEST-001*/
cat .WIP/TEST-001*/.metadata.json | jq .

# Test plan (auto-detect)
/schovi:plan
cat .WIP/TEST-001*/03-plan.md

# Test error handling
/schovi:plan TEST-999  # Should fail with clear message
```

## Utilities

See `work-folder-helpers.sh` for bash utility functions:
- `generate_identifier()` - Create folder identifier
- `find_work_folder()` - Search for work folder
- `extract_jira_id()` - Parse Jira ID from text
- `get_output_file_path()` - Get correct output path for command

See `metadata-template.json` for complete JSON schema.
