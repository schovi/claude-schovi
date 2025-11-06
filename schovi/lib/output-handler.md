---
name: output-handler
description: Unified output handling for terminal, file, Jira, and metadata updates
allowed-tools: ["Write", "Bash", "mcp__jira__*"]
---

# Output Handler Library

## Purpose

Centralizes all output operations across commands:
- Terminal display (with `--quiet` support)
- File writing (with `--output` and `--no-file` support)
- Jira comment posting (with `--post-to-jira` support)
- Metadata updates (for work folder tracking)

## Usage Pattern

**Commands invoke this library after content generation:**

```markdown
Use lib/output-handler.md with:

Configuration:
  content: "[Generated markdown content]"
  content_type: "analysis" | "debug" | "plan" | "review"
  command_label: "Analyze-Problem" | "Debug-Problem" | "Create-Spec" | "Review"

Flags (from argument parser):
  terminal_output: true       # false if --quiet
  file_output: true           # false if --no-file
  jira_posting: false         # true if --post-to-jira

File config:
  output_path: null           # From --output flag, or null for auto-detect
  default_basename: "analysis" | "debug" | "plan" | "review"
  work_folder: ".WIP/EC-1234-feature"  # From work-folder library, or null
  jira_id: "EC-1234"          # For fallback filename, or null
  workflow_step: "analyze"    # For metadata: "analyze" | "debug" | "plan" | "review"

Jira config (if jira_posting = true):
  jira_id: "EC-1234"
  cloud_id: "productboard.atlassian.net"
  jira_title: "Problem Analysis" | "Debug Report" | "Implementation Spec"
  jira_author: "Claude Code"
```

**Output result** (store in variable for commands to reference):
```json
{
  "terminal": {"displayed": true, "skipped_reason": null},
  "file": {"created": true, "path": ".WIP/EC-1234/02-analysis.md", "error": null},
  "jira": {"posted": true, "comment_url": "https://...", "error": null},
  "metadata": {"updated": true, "fields_changed": ["workflow.completed"], "error": null}
}
```

---

## IMPLEMENTATION

### Section 1: Terminal Output

**Execute if `terminal_output == true`** (default unless `--quiet`):

1. Display content with visual separator:
   ```
   ╭─────────────────────────────────────────────────────╮
   │ 📋 [CONTENT_TYPE in uppercase]                      │
   ╰─────────────────────────────────────────────────────╯

   [Display full content with proper markdown formatting]

   ╭─────────────────────────────────────────────────────╮
   │ ✅ Complete                                         │
   ╰─────────────────────────────────────────────────────╯
   ```

2. Record result: `terminal.displayed = true`

**If `--quiet` flag present**:
- Skip terminal display entirely
- Record result: `terminal.displayed = false, terminal.skipped_reason = "quiet flag"`

---

### Section 2: File Output

**Execute if `file_output == true`** (default unless `--no-file`):

#### Step 2.1: Determine Output Path

**Priority order**:

1. **If `--output PATH` flag provided**: Use exact path
2. **Else if `work_folder` exists**: Use `$work_folder/0X-[default_basename].md`
   - Map workflow_step to number:
     - "analyze" → "02-analysis.md"
     - "debug" → "02-debug.md"
     - "plan" → "03-plan.md"
     - "review" → "review.md" (no number prefix)
3. **Else if `jira_id` exists**: Use `./[default_basename]-[JIRA-ID].md` in current directory
4. **Else**: Use `./[default_basename]-[YYYY-MM-DD-HHMMSS].md` in current directory

**Example**:
- `content_type="analysis", work_folder=".WIP/EC-1234", workflow_step="analyze"` → `.WIP/EC-1234/02-analysis.md`
- `content_type="plan", jira_id="EC-1234", work_folder=null` → `./spec-EC-1234.md`

#### Step 2.2: Resolve and Validate Path

Use Bash tool to resolve path:

```bash
# Store determined path
output_path="[path from Step 2.1]"

# Expand tilde if present
if [[ "$output_path" == ~* ]]; then
  output_path="${output_path/#\~/$HOME}"
fi

# Convert to absolute path if relative
if [[ "$output_path" != /* ]]; then
  output_path="$(pwd)/$output_path"
fi

# Extract parent directory
output_dir="$(dirname "$output_path")"

# Create parent directory if needed
if [ ! -d "$output_dir" ]; then
  mkdir -p "$output_dir" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "ERROR: Cannot create directory: $output_dir"
    exit 1
  fi
fi

# Output final resolved path
echo "$output_path"
```

**Handle directory creation failure**:
If bash fails:
```
⚠️ **[Command-Label]** Cannot create directory: [directory]

Options:
1. Use current directory instead: ./[basename]
2. Specify different output path with --output
3. Skip file output with --no-file

How would you like to proceed?
```

Wait for user response and adjust accordingly.

#### Step 2.3: Write Content to File

Use Write tool:
```
file_path: [resolved absolute path]
content: [content from configuration]
```

**Handle write errors**:
If Write tool fails:
```
⚠️ **[Command-Label]** Failed to write file: [path]

Error: [error message from Write tool]

The [content_type] is still available in terminal output above.

Options:
1. Try different output path
2. Continue without file ([content_type] shown in terminal)

How would you like to proceed?
```

**On success**:
```
📄 **[Command-Label]** [Content-type] saved to: [path]
```

Record result: `file.created = true, file.path = [path]`

**If `--no-file` flag present**:
- Skip this entire section
- Record result: `file.created = false, file.skipped_reason = "no-file flag"`

---

### Section 3: Metadata Update

**Execute if `file_output == true` AND `work_folder != null`**:

#### Step 3.1: Read Existing Metadata

Use Bash tool:
```bash
cat "[work_folder]/.metadata.json"
```

#### Step 3.2: Update Metadata Fields

Parse JSON and update:
```json
{
  ...existing fields,
  "workflow": {
    ...existing.workflow,
    "completed": [...existing.completed, "[workflow_step]"],
    "current": "[workflow_step]"
  },
  "files": {
    ...existing.files,
    "[default_basename]": "[filename only, not full path]"
  },
  "timestamps": {
    "created": "[existing]",
    "lastModified": "[current UTC timestamp]"
  }
}
```

**Get current timestamp** using Bash:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

#### Step 3.3: Write Updated Metadata

Use Write tool:
```
file_path: [work_folder]/.metadata.json
content: [updated JSON]
```

Record result: `metadata.updated = true, metadata.fields_changed = ["workflow.completed", "files.[basename]"]`

**If no work folder**:
- Skip this section
- Record result: `metadata.updated = false, metadata.skipped_reason = "no work folder"`

---

### Section 4: Jira Posting

**Execute if `jira_posting == true`** (from `--post-to-jira` flag):

#### Step 4.1: Validate Jira ID

**If `jira_id == null`**:
```
⚠️ **[Command-Label]** Cannot post to Jira: No Jira ID provided
```
Record result: `jira.posted = false, jira.error = "No Jira ID"`
Skip remaining steps.

#### Step 4.2: Format Content for Jira

Prepare comment body:
```markdown
# [Jira-Title] - Generated by Claude Code

**Generated**: [current timestamp in human format]
**Author**: [Jira-Author]
**Local File**: [absolute file path if file created, or "Terminal only"]
**Type**: [Content-Type]

---

```markdown
[content from configuration]
\```
```

**Get human timestamp** using Bash:
```bash
date -u +"%Y-%m-%d %H:%M:%S UTC"
```

#### Step 4.3: Post to Jira

Use mcp__jira__addCommentToJiraIssue tool:
```
cloudId: [cloud_id from configuration]
issueIdOrKey: [jira_id]
commentBody: [formatted content from Step 4.2]
```

**On success**:
```
✅ **[Command-Label]** [Content-Type] posted to Jira: [JIRA-ID]
```
Record result: `jira.posted = true`

**On failure**:
```
⚠️ **[Command-Label]** Failed to post to Jira: [error message]
```
Record result: `jira.posted = false, jira.error = [error message]`
Continue anyway (don't halt workflow).

**If `jira_posting == false`**:
- Skip this entire section
- Record result: `jira.posted = false, jira.skipped_reason = "flag not set"`

---

## Output Result

Return consolidated result object (as formatted text for command to parse):

```
OUTPUT_RESULT:
terminal_displayed: [true|false]
file_created: [true|false]
file_path: [path or null]
jira_posted: [true|false]
metadata_updated: [true|false]
```

Commands can reference these values for completion messages.
