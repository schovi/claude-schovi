---
name: work-folder
description: Configuration-based work folder resolution and metadata management
allowed-tools: ["Bash", "Read", "Write"]
---

# Work Folder Management Library

**Purpose**: Unified work folder resolution and metadata management for all commands.

**Pattern**: Configuration-based invocation with clear outputs that commands can use.

---

## Quick Start for Commands

All commands use the same pattern:

```markdown
### Work Folder Resolution

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"  # or "create" or "explicit"

  identifier: [jira_id or github_id or null]
  description: [problem_summary or null]

  workflow_type: "brainstorm" | "research" | "debug" | "full"
  current_step: "brainstorm" | "research" | "debug" | "plan" | "implement"

  custom_work_dir: [from --work-dir flag, or null]

Output (store for later):
  work_folder: "/absolute/path/to/repo/.WIP/EC-1234-feature" or null
  metadata_file: "/absolute/path/to/repo/.WIP/EC-1234-feature/.metadata.json" or null
  output_file: "/absolute/path/to/repo/.WIP/EC-1234-feature/brainstorm-EC-1234.md"
  repo_root: "/absolute/path/to/repo"
```

**Important**: All paths are absolute, pointing to `repo_root/.WIP/`. The `.WIP` folder is always created at the repository root (or initial working directory if not in a git repo), ensuring consistency regardless of where commands are executed from.

Store the output values and use them in later phases.
```

---

## Implementation

When a command invokes this library with a Configuration block, execute these steps:

### Step 1: Parse Configuration

Extract from configuration block:
- `mode`: How to resolve folder (auto-detect, create, explicit)
- `identifier`: Jira ID, GitHub ID, or null
- `description`: Problem summary (for slug generation)
- `workflow_type`: Type of workflow (brainstorm, research, debug, full)
- `current_step`: Current command being executed
- `custom_work_dir`: Custom path from --work-dir flag

### Step 2: Resolve Work Folder

**First, determine the repository root or initial working directory:**

```bash
# Get repository root (or fall back to current directory if not in git repo)
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Define WIP base directory at repository root
wip_base="${repo_root}/.WIP"
```

**Important**: All `.WIP` folder operations must use `$wip_base` to ensure folders are created at the repository root, not in subdirectories.

#### Mode: "explicit" (from --work-dir flag)

If `custom_work_dir` is provided:

```bash
# If custom path is relative, make it relative to repo root
if [[ "$custom_work_dir" != /* ]]; then
  work_folder="${repo_root}/${custom_work_dir}"
else
  work_folder="$custom_work_dir"
fi

# Validate and create if needed
mkdir -p "$work_folder/context" 2>/dev/null
```

Set: `work_folder = [custom_work_dir resolved to absolute path]`

#### Mode: "auto-detect" (find existing)

Try in order:

**a) From Git Branch:**
```bash
# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Extract Jira ID
jira_id=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)

# Find work folder at repository root
if [ -n "$jira_id" ]; then
  find "$wip_base" -type d -name "${jira_id}*" 2>/dev/null | head -1
fi
```

**b) From Identifier:**
```bash
# If identifier provided
if [ -n "$identifier" ]; then
  find "$wip_base" -type d -name "${identifier}*" 2>/dev/null | head -1
fi
```

**c) From Recent Folders:**
```bash
# List most recent 5 folders at repository root, let user choose
ls -dt "$wip_base"/*/ 2>/dev/null | head -5
```

If folder found:
- Set: `work_folder = [found_path]`
- Skip to Step 3 (load metadata)

If not found:
- Fall through to "create" mode

#### Mode: "create" (new folder)

If no folder found or mode is "create":

**Generate identifier and slug:**

```bash
# If identifier provided (e.g., EC-1234)
if [ -n "$identifier" ]; then
  # Generate slug from description
  slug=$(echo "$description" | tr '[:upper:]' '[:lower:]' | \
         sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | \
         cut -c1-50 | sed 's/-$//')

  folder_name="${identifier}-${slug}"
else
  # No identifier, use slug only
  slug=$(echo "$description" | tr '[:upper:]' '[:lower:]' | \
         sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | \
         cut -c1-50 | sed 's/-$//')

  folder_name="$slug"
fi

# Create folder at repository root
mkdir -p "${wip_base}/${folder_name}/context"
```

Set: `work_folder = [wip_base]/[folder_name]` (absolute path at repository root)

### Step 3: Load or Create Metadata

#### If folder already exists (auto-detect mode):

```bash
# Read existing metadata
cat "$work_folder/.metadata.json"
```

Parse JSON and update:
- `workflow.current = [current_step]`
- `timestamps.lastModified = [now]`

Store updated metadata for Step 4.

#### If new folder (create mode):

Generate new metadata structure:

```json
{
  "identifier": "[identifier or slug]",
  "title": "[description truncated to 100 chars]",
  "workFolder": "[work_folder path]",

  "workflow": {
    "type": "[workflow_type]",
    "steps": ["[based on workflow_type]"],
    "completed": [],
    "current": "[current_step]"
  },

  "files": {},

  "git": {
    "branch": "[from git rev-parse --abbrev-ref HEAD]",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": "[identifier if Jira, else null]",
    "jiraUrl": "[construct if Jira, else null]",
    "githubIssue": "[identifier if GitHub, else null]",
    "githubPR": null
  },

  "timestamps": {
    "created": "[date -u +\"%Y-%m-%dT%H:%M:%SZ\"]",
    "lastModified": "[date -u +\"%Y-%m-%dT%H:%M:%SZ\"]",
    "completed": null
  }
}
```

**Workflow steps mapping:**
- `brainstorm`: ["brainstorm", "research", "plan", "implement"]
- `research`: ["research", "plan", "implement"]
- `debug`: ["debug", "plan", "implement"]
- `full`: ["brainstorm", "research", "plan", "implement"]

**Get current timestamp:**
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Get current branch:**
```bash
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main"
```

### Step 4: Write Metadata

Use Write tool:
```
file_path: [work_folder]/.metadata.json
content: [JSON from Step 3]
```

### Step 5: Determine Output File Path

Based on `current_step`, determine the output filename:

**Mapping:**
- `brainstorm` → `brainstorm-[identifier].md`
- `research` → `research-[identifier].md` or `research-[identifier]-option[N].md`
- `debug` → `debug-[identifier].md`
- `plan` → `plan-[identifier].md`
- `spec` → `01-spec.md` (product specification, numbered)
- `implement` → `implementation-[identifier].md`

**Full path:**
```
[work_folder]/[filename]
```

### Step 6: Return Output

Format output for command to parse:

```
WORK_FOLDER_OUTPUT:
work_folder: [absolute path to repo_root/.WIP/xxx]
metadata_file: [work_folder]/.metadata.json
output_file: [work_folder]/[filename from Step 5]
identifier: [identifier or slug]
is_new: [true if created, false if existing]
repo_root: [absolute path to repository root]
```

**Important**: `work_folder` is always an absolute path pointing to a folder inside `repo_root/.WIP/`. This ensures consistency regardless of where the command is executed from.

Commands should extract these values and store them for use in output phases.

---

## Output File Writing (For Commands)

After commands receive the output, they write their content:

**Use Write tool:**
```
file_path: [output_file from work-folder library]
content: [command's generated content]
```

**Then update metadata:**
```bash
# Read current metadata
cat "$metadata_file"

# Update fields:
# - workflow.completed: append current_step if not present
# - files.[current_step]: [filename only]
# - timestamps.lastModified: [now]

# Write back
```

Use Write tool to save updated metadata.

---

## Examples

### Example 1: Brainstorm (New Work)

**Command invokes:**
```
Configuration:
  mode: "auto-detect"
  identifier: "EC-1234"
  description: "Add user authentication"
  workflow_type: "brainstorm"
  current_step: "brainstorm"
  custom_work_dir: null
```

**Library executes:**
1. Determine repository root: `repo_root = /home/user/my-project`
2. Set WIP base: `wip_base = /home/user/my-project/.WIP`
3. Mode auto-detect: No folder found for EC-1234
4. Fall through to create mode
5. Generate: `folder_name = "EC-1234-add-user-authentication"`
6. Create: `mkdir -p /home/user/my-project/.WIP/EC-1234-add-user-authentication/context`
7. Create new metadata with workflow.type="brainstorm"
8. Write metadata to `/home/user/my-project/.WIP/EC-1234-add-user-authentication/.metadata.json`
9. Return output

**Library returns:**
```
WORK_FOLDER_OUTPUT:
work_folder: /home/user/my-project/.WIP/EC-1234-add-user-authentication
metadata_file: /home/user/my-project/.WIP/EC-1234-add-user-authentication/.metadata.json
output_file: /home/user/my-project/.WIP/EC-1234-add-user-authentication/brainstorm-EC-1234.md
identifier: EC-1234
is_new: true
repo_root: /home/user/my-project
```

**Command stores:**
```
work_folder = "/home/user/my-project/.WIP/EC-1234-add-user-authentication"
output_file = "/home/user/my-project/.WIP/EC-1234-add-user-authentication/brainstorm-EC-1234.md"
```

**Command writes content:**
```
Write tool:
  file_path: /home/user/my-project/.WIP/EC-1234-add-user-authentication/brainstorm-EC-1234.md
  content: [brainstorm output]
```

**Command updates metadata:**
```
Read: /home/user/my-project/.WIP/EC-1234-add-user-authentication/.metadata.json
Update: workflow.completed = ["brainstorm"]
        files.brainstorm = "brainstorm-EC-1234.md"
Write: /home/user/my-project/.WIP/EC-1234-add-user-authentication/.metadata.json
```

### Example 2: Research (Continuing Workflow)

**Command invokes:**
```
Configuration:
  mode: "auto-detect"
  identifier: "EC-1234"
  description: null
  workflow_type: "research"
  current_step: "research"
  custom_work_dir: null
```

**Library executes:**
1. Determine repository root: `repo_root = /home/user/my-project`
2. Set WIP base: `wip_base = /home/user/my-project/.WIP`
3. Mode auto-detect: Find existing `/home/user/my-project/.WIP/EC-1234-add-user-authentication`
4. Read metadata: workflow.completed = ["brainstorm"]
5. Update metadata: workflow.current = "research"
6. Return output

**Library returns:**
```
WORK_FOLDER_OUTPUT:
work_folder: /home/user/my-project/.WIP/EC-1234-add-user-authentication
metadata_file: /home/user/my-project/.WIP/EC-1234-add-user-authentication/.metadata.json
output_file: /home/user/my-project/.WIP/EC-1234-add-user-authentication/research-EC-1234.md
identifier: EC-1234
is_new: false
repo_root: /home/user/my-project
```

### Example 3: Custom Work Dir (Absolute Path)

**Command invokes:**
```
Configuration:
  mode: "explicit"
  identifier: null
  description: null
  workflow_type: "debug"
  current_step: "debug"
  custom_work_dir: "/tmp/my-debug-session"
```

**Library executes:**
1. Determine repository root: `repo_root = /home/user/my-project`
2. Mode explicit: Use `/tmp/my-debug-session` (absolute path, use as-is)
3. Create folder: `mkdir -p /tmp/my-debug-session/context`
4. Create new metadata
5. Return output

**Library returns:**
```
WORK_FOLDER_OUTPUT:
work_folder: /tmp/my-debug-session
metadata_file: /tmp/my-debug-session/.metadata.json
output_file: /tmp/my-debug-session/debug-session.md
identifier: my-debug-session
is_new: true
repo_root: /home/user/my-project
```

### Example 4: Custom Work Dir (Relative Path)

**Command invokes:**
```
Configuration:
  mode: "explicit"
  identifier: null
  description: null
  workflow_type: "debug"
  current_step: "debug"
  custom_work_dir: "my-work/debug-session"
```

**Library executes:**
1. Determine repository root: `repo_root = /home/user/my-project`
2. Mode explicit: Relative path provided, resolve to `repo_root/my-work/debug-session`
3. Create folder: `mkdir -p /home/user/my-project/my-work/debug-session/context`
4. Create new metadata
5. Return output

**Library returns:**
```
WORK_FOLDER_OUTPUT:
work_folder: /home/user/my-project/my-work/debug-session
metadata_file: /home/user/my-project/my-work/debug-session/.metadata.json
output_file: /home/user/my-project/my-work/debug-session/debug-session.md
identifier: debug-session
is_new: true
repo_root: /home/user/my-project
```

---

## Error Handling

### Folder Not Found (auto-detect)

If auto-detect finds no folder and no identifier to create:

```
⚠️ Cannot resolve work folder

Options:
1. Provide identifier: EC-1234
2. Specify folder: --work-dir .WIP/my-work
3. Continue without work folder (terminal only)

Return: work_folder = null
```

### Invalid Custom Directory

If custom_work_dir cannot be created:

```
⚠️ Cannot create work folder: [custom_work_dir]

Error: [mkdir error]

Return: work_folder = null
```

### Metadata Corruption

If existing .metadata.json is invalid:

```
⚠️ Invalid metadata in [work_folder]/.metadata.json

Backup created: .metadata.json.bak

Creating fresh metadata...
```

---

## Workflow Type Reference

| Workflow Type | Steps | Typical Flow |
|--------------|-------|--------------|
| brainstorm | brainstorm → research → plan → implement | Explore options first |
| research | research → plan → implement | Deep dive analysis |
| debug | debug → plan → implement | Fix bugs |
| full | brainstorm → research → plan → implement | Complete workflow |

---

## File Naming Convention

| Command | Output Filename | Example |
|---------|----------------|---------|
| brainstorm | brainstorm-[id].md | brainstorm-EC-1234.md |
| research | research-[id].md | research-EC-1234.md |
| research (option) | research-[id]-option[N].md | research-EC-1234-option2.md |
| debug | debug-[id].md | debug-EC-1234.md |
| plan | plan-[id].md | plan-EC-1234.md |
| spec | 01-spec.md | 01-spec.md |
| implement | implementation-[id].md | implementation-EC-1234.md |

---

## Bash Utilities

```bash
# Get repository root (or current directory if not in git repo)
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Define WIP base directory
wip_base="${repo_root}/.WIP"

# Extract Jira ID
echo "$text" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b' | head -1

# Generate slug
echo "$description" | tr '[:upper:]' '[:lower:]' | \
  sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | \
  cut -c1-50 | sed 's/-$//'

# Find work folder (always at repository root)
find "$wip_base" -type d -name "EC-1234*" 2>/dev/null | head -1

# Get timestamp
date -u +"%Y-%m-%dT%H:%M:%SZ"

# Get current branch
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main"

# Check if path is absolute (starts with /)
[[ "$path" = /* ]]
```

---

## Integration Notes

**All commands should:**
1. Invoke this library in Phase 1 (after argument parsing)
2. Store the returned `work_folder` and `output_file` values
3. Write their content to `output_file` in output phase
4. Update metadata after writing

**This library does NOT:**
- Write command output content (commands do this)
- Display terminal output (commands handle this)
- Post to Jira (commands use output-handler for this)

**This library DOES:**
- Resolve/create work folder
- Create/update .metadata.json
- Return file paths for commands to use

---

**Version**: 3.1 (Repository root resolution)
**Last Updated**: 2025-11-08
**Changes**: All `.WIP` folders now created at repository root (via `git rev-parse --show-toplevel`) to ensure consistency regardless of execution location. All paths returned are absolute.
**Replaces**: 3.0 (Configuration-based with relative paths)
