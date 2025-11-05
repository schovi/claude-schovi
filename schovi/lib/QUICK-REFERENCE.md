# Work Folder Management - Quick Reference

One-page reference for integrating work folder management into commands.

## File Structure

```
.WIP/[identifier]/
├── .metadata.json          # State tracking
├── 01-spec.md             # spec command
├── 02-analysis.md         # analyze command
├── 02-debug.md            # debug command (alternative)
├── 03-plan.md             # plan command
├── 04-progress.md         # implement command
└── context/               # Supporting files
    ├── wireframe.png
    └── requirements.pdf
```

## Metadata Structure

```json
{
  "identifier": "EC-1234",
  "title": "Brief title",
  "workFolder": ".WIP/EC-1234-slug",
  "workflow": {
    "type": "full|technical|bug|simple",
    "steps": ["spec", "analyze", "plan", "implement"],
    "completed": ["spec", "analyze"],
    "current": "plan"
  },
  "files": {
    "spec": "01-spec.md",
    "analysis": "02-analysis.md",
    "plan": "03-plan.md"
  },
  "git": {
    "branch": "claude/...",
    "commits": ["abc123f"],
    "lastCommit": "abc123f"
  },
  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://...",
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
    "list": [...]
  }
}
```

## Integration Steps (All Commands)

### 1. Parse Input
```markdown
Extract:
- Jira ID: [A-Z]{2,10}-\d{1,6}
- GitHub: #\d+ or github.com URLs
- Description: free text
- Flags: --work-dir, --input, etc.
```

### 2. Resolve Work Folder

**Try in order:**

a) **Explicit**: `--work-dir` or extract from `--input` path
```bash
dirname .WIP/EC-1234/02-analysis.md  # → .WIP/EC-1234
```

b) **Git branch**:
```bash
git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]{2,10}-[0-9]+'
find .WIP -type d -name "EC-1234*" | head -1
```

c) **Identifier search**:
```bash
find .WIP -type d -name "[identifier]*" | head -1
```

d) **Recent folders**:
```bash
ls -dt .WIP/*/ | head -5
```

### 3. Load or Create Metadata

**If folder exists:**
```bash
cat .WIP/[identifier]/.metadata.json
```

**If new folder:**
```bash
mkdir -p .WIP/[identifier]/context

# Create metadata (see structure above)
# Use Write tool: .WIP/[identifier]/.metadata.json
```

### 4. Validate Prerequisites

Check workflow.completed for required previous steps:
- `plan` requires `analyze` or `spec`
- `implement` requires `plan`

**Error if missing:**
```
❌ Cannot run 'plan' - no analysis found
Run: /schovi:analyze EC-1234 first
```

### 5. Execute Command Logic

[Command-specific implementation]

### 6. Write Output File

**File mapping:**
- spec → `01-spec.md`
- analyze → `02-analysis.md`
- debug → `02-debug.md`
- plan → `03-plan.md`
- implement → `04-progress.md`

```markdown
Use Write tool:
- file_path: .WIP/[identifier]/[number]-[name].md
- content: [output]
```

### 7. Update Metadata

**Update fields:**
```json
{
  "workflow": {
    "completed": [...existing, "current_command"],
    "current": "current_command"
  },
  "files": {
    "command": "0X-output.md"
  },
  "timestamps": {
    "lastModified": "[now]"
  }
}
```

Use Write tool to save updated metadata.

### 8. Show Results

```
✅ [Command] complete!

📁 Work folder: .WIP/[identifier]/
📄 Output: 0X-output.md

Next steps:
- Review: cat .WIP/[identifier]/0X-output.md
- Continue: /schovi:[next-command]
```

## Essential Bash Commands

```bash
# Extract Jira ID
echo "$input" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'

# Generate slug
echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50

# Get current branch
git rev-parse --abbrev-ref HEAD

# Get timestamp
date -u +"%Y-%m-%dT%H:%M:%SZ"

# Find work folder
find .WIP -type d -name "EC-1234*" | head -1

# Check if file exists
ls .WIP/EC-1234/02-analysis.md 2>/dev/null && echo "exists"

# Create folder structure
mkdir -p .WIP/EC-1234/context
```

## Command-Specific Notes

### analyze
- Input: Jira, GitHub, or description
- Creates: `02-analysis.md`
- Metadata: workflow.type = "technical", steps = ["analyze", "plan", "implement"]

### debug
- Input: Jira, GitHub, error description, or stack trace
- Creates: `02-debug.md` (replaces analysis)
- Metadata: workflow.type = "bug", steps = ["debug", "implement"] or ["debug", "plan", "implement"]

### spec
- Input: Images, PDFs, Jira, or description
- Creates: `01-spec.md` + copies files to `context/`
- Metadata: workflow.type = "full", steps = ["spec", "analyze", "plan", "implement"]

### plan
- Input: Auto-detect or --input file
- Requires: "analyze" or "spec" in workflow.completed
- Creates: `03-plan.md`
- Special: Supports `--from-scratch` to bypass analysis

### implement
- Input: Auto-detect work folder
- Requires: "plan" in workflow.completed
- Creates: `04-progress.md`
- Updates: metadata.phases for multi-phase work
- Special: Supports `--resume` and `--phase N`

## Error Patterns

### Work Folder Not Found
```
❌ Work folder not found for "EC-1234"

Suggestions:
- Create: /schovi:analyze EC-1234
- Specify: /schovi:plan --input .WIP/EC-1234/02-analysis.md
```

### Missing Prerequisites
```
❌ Cannot run 'plan' - no analysis found

Current: .WIP/EC-1234/ (workflow: [])
Required: 02-analysis.md or 01-spec.md

Run: /schovi:analyze EC-1234 first
```

### Invalid Input
```
❌ Invalid input format

Expected:
- Jira ID: EC-1234
- GitHub: #123 or owner/repo#123
- Description: "Add feature X"
```

## Quick Copy-Paste Templates

### Create Work Folder
```bash
identifier="EC-1234-slug"
mkdir -p ".WIP/$identifier/context"
```

### Auto-detect from Git
```bash
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]{1,6}')
work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)
```

### Read Metadata Field
```bash
cat .WIP/EC-1234/.metadata.json | jq -r '.workflow.current'
```

### Generate Identifier
```bash
# From Jira + title
jira_id="EC-1234"
slug=$(echo "Add user auth" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
identifier="${jira_id}-${slug}"
```

## Workflow Types

| Type | Steps | Use Case |
|------|-------|----------|
| **full** | spec → analyze → plan → implement | New feature with discovery |
| **technical** | analyze → plan → implement | Clear requirements, explore solutions |
| **bug** | debug → [plan] → implement | Bug investigation and fix |
| **simple** | plan → implement | Obvious solution, no analysis needed |

## File Number Assignment

| Command | Number | Filename |
|---------|--------|----------|
| spec | 01 | 01-spec.md |
| analyze | 02 | 02-analysis.md |
| debug | 02 | 02-debug.md |
| plan | 03 | 03-plan.md |
| implement | 04 | 04-progress.md |

## Validation Checklist

Before proceeding with command:
- [ ] Input parsed correctly
- [ ] Work folder resolved or created
- [ ] Metadata exists and valid
- [ ] Prerequisites met (workflow.completed)
- [ ] Output file path determined
- [ ] Ready to execute command logic

After command execution:
- [ ] Output file written
- [ ] Metadata updated
- [ ] User-friendly message shown
- [ ] Next steps communicated

## Common Patterns

### Idempotency
Commands should be re-runnable:
- Overwrite existing output files
- Update metadata instead of appending
- Show warning if re-running: "02-analysis.md exists, regenerating..."

### Progressive Enhancement
Handle missing metadata gracefully:
- Recreate from folder contents if corrupted
- Infer workflow state from existing files
- Warn user: "Metadata recreated"

### Fail Fast
Stop early with clear guidance:
- Don't proceed without prerequisites
- Show exact command to run next
- Example: "Run /schovi:analyze EC-1234 first"

## Links to Full Documentation

- **Full Guide**: `schovi/lib/work-folder.md`
- **Integration Guide**: `schovi/lib/command-integration-guide.md`
- **Examples**: `schovi/lib/EXAMPLES.md`
- **Helpers**: `schovi/lib/work-folder-helpers.sh`
- **Schema**: `schovi/lib/metadata-template.json`

---

**Remember**: Auto-detect first, fail with clear guidance, update metadata always!
