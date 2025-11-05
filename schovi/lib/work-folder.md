# Work Folder Management Library

This library provides utilities and instructions for managing the `.WIP/` folder structure used by all schovi commands.

## Overview

All schovi commands that produce artifacts (analyze, debug, plan, implement, spec) should:
1. Create or use an existing work folder in `.WIP/[identifier]/`
2. Write output to numbered files (01-spec.md, 02-analysis.md, etc.)
3. Maintain metadata in `.metadata.json`
4. Follow consistent naming and structure conventions

## Constants and Conventions

### Base Directory
```
BASE_DIR = ".WIP"
```
All work folders live under `.WIP/` in the repository root.

### File Naming Convention
```
01-spec.md          # Product specification (from spec command)
02-analysis.md      # Technical analysis (from analyze command)
02-debug.md         # Debug analysis (from debug command, alternative to analysis)
03-plan.md          # Implementation plan (from plan command)
04-progress.md      # Progress tracking (from implement command)
.metadata.json      # Metadata tracking (auto-generated)
context/            # Supporting materials (images, PDFs, etc.)
```

### Workflow Type Mapping
```
spec → analyze → plan → implement    = Full product cycle
analyze → plan → implement           = Technical assignment
debug → [plan] → implement           = Bug fix workflow
plan → implement                     = Simple implementation
```

## Core Functions

### 1. Generate Identifier

**Purpose**: Create a unique, human-readable identifier for the work folder.

**Input Sources** (priority order):
1. Jira issue key (e.g., `EC-1234`)
2. GitHub issue/PR (e.g., `GH-123`)
3. User-provided identifier (via `--work-dir` flag)
4. Auto-generated slug from description

**Implementation Instructions**:

```markdown
## Step 1: Check for Jira ID
- Pattern: [A-Z]{2,10}-\d{1,6}
- If found: Use as-is (e.g., "EC-1234")

## Step 2: Check for GitHub issue/PR
- Pattern: #\d+ or owner/repo#\d+ or github.com URLs
- If found: Extract number (e.g., "GH-123")

## Step 3: Check for --work-dir flag
- If provided: Use exactly as specified
- Validate: No special chars except dash/underscore

## Step 4: Generate slug from description
- Take first 50 chars of description/title
- Convert to lowercase kebab-case
- Remove special characters
- Example: "Add user authentication" → "add-user-authentication"
```

**Output Format**:
```
[identifier]                           # Simple identifier
[identifier]-[slug]                    # Identifier with descriptive slug
```

**Examples**:
```
EC-1234                                # Jira only
EC-1234-add-user-auth                  # Jira with description
GH-123-fix-timeout                     # GitHub issue
debug-payment-processing               # Auto-generated
add-loading-spinner                    # Simple slug
```

### 2. Create Work Folder

**Purpose**: Initialize a new work folder with proper structure.

**Implementation Instructions**:

```markdown
## Step 1: Generate full path
workFolder = `.WIP/[identifier]/`

## Step 2: Check if folder exists
- Use Bash: ls .WIP/[identifier] 2>/dev/null
- If exists: Read .metadata.json to validate
- If new: Proceed to create

## Step 3: Create directory structure
- Use Bash: mkdir -p .WIP/[identifier]/context

## Step 4: Initialize .metadata.json
- See "Create Metadata" section below
```

**Example Bash Commands**:
```bash
# Check if folder exists and read metadata
ls .WIP/EC-1234 2>/dev/null && cat .WIP/EC-1234/.metadata.json 2>/dev/null

# Create new folder structure
mkdir -p .WIP/EC-1234/context
```

### 3. Create/Update Metadata

**Purpose**: Track work folder state, workflow, and history.

**Metadata Schema** (`.metadata.json`):
```json
{
  "identifier": "EC-1234",
  "title": "Add user authentication",
  "slug": "add-user-auth",
  "workFolder": ".WIP/EC-1234-add-user-auth",

  "workflow": {
    "type": "full",
    "steps": ["spec", "analyze", "plan", "implement"],
    "completed": ["spec", "analyze"],
    "current": "plan"
  },

  "files": {
    "spec": "01-spec.md",
    "analysis": "02-analysis.md",
    "plan": "03-plan.md",
    "progress": "04-progress.md"
  },

  "git": {
    "branch": "claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED",
    "commits": ["abc123f", "def456a"],
    "lastCommit": "def456a"
  },

  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://company.atlassian.net/browse/EC-1234",
    "githubPR": null,
    "githubIssue": null
  },

  "timestamps": {
    "created": "2025-01-15T10:00:00Z",
    "lastModified": "2025-01-15T14:30:00Z",
    "completed": null
  },

  "phases": {
    "total": 4,
    "completed": 1,
    "current": 2,
    "list": [
      {
        "number": 1,
        "title": "Authentication Core",
        "status": "completed",
        "commit": "abc123f"
      },
      {
        "number": 2,
        "title": "User Management",
        "status": "in_progress",
        "commit": null
      }
    ]
  }
}
```

**Implementation Instructions**:

```markdown
## For New Metadata (first command in workflow)

1. Gather information:
   - identifier (from input source)
   - title (from Jira/GitHub/user description)
   - workflow type (based on command)
   - external links (Jira URL, GitHub URL)

2. Create initial metadata:
   - workflow.completed = []
   - workflow.current = [current command]
   - timestamps.created = now
   - git.branch = from `git rev-parse --abbrev-ref HEAD`

3. Write to .WIP/[identifier]/.metadata.json:
   - Use Write tool with JSON.stringify(metadata, null, 2)

## For Updating Metadata (subsequent commands)

1. Read existing metadata:
   - Use Read tool on .WIP/[identifier]/.metadata.json
   - Parse JSON

2. Update relevant fields:
   - workflow.completed: append previous step
   - workflow.current: set to current command
   - timestamps.lastModified: now
   - files: add new file entry
   - git.commits: append if new commits made
   - phases: update if in implement phase

3. Write updated metadata:
   - Use Write tool (overwrites existing)
```

**Example Code Flow**:
```bash
# Read existing metadata
cat .WIP/EC-1234/.metadata.json

# Update would look like:
{
  ...existing,
  "workflow": {
    "completed": [...existing.completed, "analyze"],
    "current": "plan"
  },
  "files": {
    ...existing.files,
    "plan": "03-plan.md"
  },
  "timestamps": {
    ...existing.timestamps,
    "lastModified": "2025-01-15T15:00:00Z"
  }
}
```

### 4. Write Numbered File

**Purpose**: Write command output to correctly numbered file in work folder.

**File Number Mapping**:
```
spec command      → 01-spec.md
analyze command   → 02-analysis.md
debug command     → 02-debug.md  (alternative to analysis)
plan command      → 03-plan.md
implement command → 04-progress.md (not the full implementation)
```

**Implementation Instructions**:

```markdown
## Step 1: Determine file number and name
- Based on command type (see mapping above)
- Check metadata to see if file already exists

## Step 2: Prepare file path
filePath = `.WIP/[identifier]/[number]-[name].md`

## Step 3: Check if overwriting
- Use Bash: ls [filePath] 2>/dev/null
- If exists: Warn user or append timestamp

## Step 4: Write content
- Use Write tool with full markdown content
- Ensure proper formatting and structure

## Step 5: Update metadata
- Add file entry to metadata.files
- Update workflow.completed if command finished
- Update timestamps.lastModified
```

**Example Implementation**:
```markdown
# In analyze command:

1. Generate identifier: "EC-1234"
2. Ensure work folder exists: .WIP/EC-1234/
3. Prepare file path: .WIP/EC-1234/02-analysis.md
4. Write content using Write tool
5. Update .metadata.json:
   - workflow.completed: ["spec"]
   - workflow.current: "analyze"
   - files.analysis: "02-analysis.md"
```

### 5. Read Work Folder

**Purpose**: Load existing work folder state and files.

**Implementation Instructions**:

```markdown
## Step 1: Locate work folder
- If --work-dir provided: Use directly
- If identifier in input (Jira/GitHub): Search for matching folder
- If no args: Check metadata for recent work folders

## Step 2: Validate folder exists
- Use Bash: ls .WIP/[identifier]
- If not found: Error or create new

## Step 3: Read metadata
- Use Read tool on .WIP/[identifier]/.metadata.json
- Parse JSON to understand state

## Step 4: Read required files
- Based on command, read previous step outputs
- Example: plan command reads 02-analysis.md or 01-spec.md
- Use Read tool for each file

## Step 5: Return structured data
- Metadata object
- File contents by type (spec, analysis, plan, etc.)
- Current workflow state
```

**Example Search Logic**:
```bash
# Find work folder by Jira ID
find .WIP -type d -name "EC-1234*" | head -1

# Find work folder by GitHub issue
find .WIP -type d -name "GH-123*" | head -1

# List all work folders sorted by modification time
ls -dt .WIP/*/ | head -5

# Read metadata from found folder
cat .WIP/EC-1234-add-user-auth/.metadata.json
```

### 6. Auto-detect Work Folder from Context

**Purpose**: Intelligently find relevant work folder when no explicit input provided.

**Implementation Instructions**:

```markdown
## Strategy 1: Check current git branch
- Extract identifier from branch name
- Pattern: claude/.*-(EC-\d+)-.*
- Search for matching work folder

## Strategy 2: Check recent conversation
- Look for recent analyze/debug/spec command outputs
- Extract identifier from outputs
- Validate folder still exists

## Strategy 3: Check for --input file path
- If user provides --input .WIP/foo/02-analysis.md
- Extract work folder from path

## Strategy 4: List recent work folders
- Use: ls -dt .WIP/*/ | head -5
- Read metadata for each
- Check timestamps.lastModified
- Present options to user if multiple found

## Strategy 5: Ask user
- If no work folder found and command requires input
- Prompt: "No work folder found. Provide identifier or --work-dir"
```

**Example Detection Flow**:
```bash
# Get current branch
git rev-parse --abbrev-ref HEAD
# Returns: claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED

# Extract identifier (EC-1234)
# Search for work folder
find .WIP -type d -name "EC-1234*"
# Returns: .WIP/EC-1234-add-user-auth

# Read metadata to confirm
cat .WIP/EC-1234-add-user-auth/.metadata.json
```

## Integration Patterns

### Pattern 1: Command Starting New Workflow

**Example**: User runs `/schovi:analyze "Add user auth"` with no prior work.

```markdown
1. Parse input: "Add user auth"
2. Generate identifier: "add-user-auth"
3. Create work folder: .WIP/add-user-auth/
4. Create metadata:
   - workflow.type: "technical"
   - workflow.steps: ["analyze", "plan", "implement"]
   - workflow.current: "analyze"
5. Execute analyze command
6. Write output: .WIP/add-user-auth/02-analysis.md
7. Update metadata:
   - workflow.completed: ["analyze"]
8. Show user: "Analysis saved to .WIP/add-user-auth/02-analysis.md"
```

### Pattern 2: Command Continuing Workflow

**Example**: User runs `/schovi:plan` after analyze completed.

```markdown
1. Auto-detect work folder:
   - Check git branch: claude/auth-EC-1234-...
   - Find: .WIP/EC-1234-add-user-auth/
2. Read metadata: .WIP/EC-1234-add-user-auth/.metadata.json
3. Validate: workflow.completed includes "analyze"
4. Read input: .WIP/EC-1234-add-user-auth/02-analysis.md
5. Execute plan command
6. Write output: .WIP/EC-1234-add-user-auth/03-plan.md
7. Update metadata:
   - workflow.completed: ["analyze", "plan"]
   - workflow.current: "plan"
   - files.plan: "03-plan.md"
8. Show user: "Plan saved to .WIP/EC-1234-add-user-auth/03-plan.md"
```

### Pattern 3: Command with Explicit Input

**Example**: User runs `/schovi:plan --input .WIP/EC-1234/02-analysis.md`

```markdown
1. Parse --input flag: .WIP/EC-1234/02-analysis.md
2. Extract work folder: .WIP/EC-1234/
3. Read metadata: .WIP/EC-1234/.metadata.json
4. Read input file: .WIP/EC-1234/02-analysis.md
5. Execute plan command
6. Write output: .WIP/EC-1234/03-plan.md
7. Update metadata
8. Show user: "Plan saved to .WIP/EC-1234/03-plan.md"
```

### Pattern 4: Command with External Source

**Example**: User runs `/schovi:analyze EC-1234` (Jira issue).

```markdown
1. Parse input: Jira ID "EC-1234"
2. Fetch Jira summary via jira-analyzer subagent
3. Extract title from Jira: "Add user authentication"
4. Generate identifier: "EC-1234-add-user-auth"
5. Create work folder: .WIP/EC-1234-add-user-auth/
6. Create metadata:
   - identifier: "EC-1234"
   - title: "Add user authentication"
   - external.jiraIssue: "EC-1234"
   - external.jiraUrl: "https://..."
7. Execute analyze command with Jira context
8. Write output: .WIP/EC-1234-add-user-auth/02-analysis.md
9. Update metadata
10. Show user: "Analysis saved to .WIP/EC-1234-add-user-auth/02-analysis.md"
```

## Error Handling

### Scenario 1: Work folder not found
```markdown
Error: Work folder not found for identifier "EC-1234"

Suggestions:
- Create new workflow: /schovi:analyze EC-1234
- Specify path: /schovi:plan --input .WIP/EC-1234/02-analysis.md
- List folders: ls .WIP/
```

### Scenario 2: Invalid workflow step
```markdown
Error: Cannot run 'plan' command - no analysis found

Current state: .WIP/EC-1234/ (workflow: [])
Required: 02-analysis.md or 01-spec.md

Action: Run /schovi:analyze EC-1234 first
```

### Scenario 3: Metadata corrupted
```markdown
Warning: Metadata corrupted or missing in .WIP/EC-1234/

Action: Recreating metadata from folder contents...
- Found: 02-analysis.md, 03-plan.md
- Workflow: ["analyze", "plan"]
- Current: plan

Metadata recreated successfully.
```

### Scenario 4: File already exists
```markdown
Warning: .WIP/EC-1234/02-analysis.md already exists

Options:
1. Overwrite (default)
2. Append timestamp: 02-analysis-2025-01-15.md
3. Cancel

Proceeding with overwrite in 5 seconds...
```

## Utilities Reference

### Quick Command Reference

```bash
# Create work folder
mkdir -p .WIP/[identifier]/context

# Check if folder exists
ls .WIP/[identifier] 2>/dev/null && echo "exists" || echo "not found"

# Read metadata
cat .WIP/[identifier]/.metadata.json

# Write metadata
cat > .WIP/[identifier]/.metadata.json <<'EOF'
{json content}
EOF

# Find work folder by pattern
find .WIP -type d -name "[identifier]*" | head -1

# List recent work folders
ls -dt .WIP/*/ | head -5

# Get current git branch
git rev-parse --abbrev-ref HEAD

# Check git status
git status --porcelain

# Copy supporting materials
cp wireframe.png .WIP/[identifier]/context/
```

### Slug Generation Algorithm

```markdown
Input: "Add User Authentication with OAuth2"

Step 1: Lowercase
"add user authentication with oauth2"

Step 2: Replace spaces with dashes
"add-user-authentication-with-oauth2"

Step 3: Remove special characters (keep dash, underscore, alphanumeric)
"add-user-authentication-with-oauth2"

Step 4: Collapse multiple dashes
"add-user-authentication-with-oauth2"

Step 5: Trim to 50 chars
"add-user-authentication-with-oauth2"

Step 6: Trim trailing dashes
"add-user-authentication-with-oauth2"

Output: "add-user-authentication-with-oauth2"
```

### Identifier Extraction Patterns

```markdown
# Jira
Pattern: \b([A-Z]{2,10}-\d{1,6})\b
Examples: EC-1234, PROJ-999, IS-8046

# GitHub Issue
Pattern: #(\d+) or owner/repo#(\d+)
Examples: #123, myorg/myrepo#456

# GitHub URL
Pattern: github\.com/.+/(issues|pull)/(\d+)
Examples: github.com/owner/repo/issues/123

# Extract logic:
if jira_pattern:
  return jira_id
elif github_pattern:
  return f"GH-{number}"
else:
  return generate_slug(description)
```

## Testing Checklist

When implementing commands using this library, verify:

- [ ] Work folder created with correct identifier
- [ ] `.metadata.json` created with all required fields
- [ ] Numbered file written to correct location
- [ ] Metadata updated after command completion
- [ ] Work folder auto-detected correctly
- [ ] Handles existing folder gracefully
- [ ] Error messages are clear and actionable
- [ ] Git branch extracted correctly
- [ ] External links (Jira/GitHub) captured
- [ ] Supporting materials (images/PDFs) can be copied to context/

## Example Complete Flow

```markdown
# User Command
/schovi:analyze EC-1234

# Step 1: Fetch Jira
- Use jira-analyzer subagent
- Get title: "Add user authentication"

# Step 2: Generate identifier
- Jira: EC-1234
- Slug: add-user-authentication
- Full: EC-1234-add-user-authentication

# Step 3: Create work folder
mkdir -p .WIP/EC-1234-add-user-authentication/context

# Step 4: Create metadata
{
  "identifier": "EC-1234",
  "title": "Add user authentication",
  "workFolder": ".WIP/EC-1234-add-user-authentication",
  "workflow": {
    "type": "full",
    "steps": ["analyze", "plan", "implement"],
    "completed": [],
    "current": "analyze"
  },
  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://company.atlassian.net/browse/EC-1234"
  },
  "git": {
    "branch": "claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED"
  },
  "timestamps": {
    "created": "2025-01-15T10:00:00Z"
  }
}

# Step 5: Execute analyze
[Deep codebase analysis]

# Step 6: Write output
.WIP/EC-1234-add-user-authentication/02-analysis.md

# Step 7: Update metadata
{
  ...existing,
  "workflow": {
    "completed": ["analyze"],
    "current": "analyze"
  },
  "files": {
    "analysis": "02-analysis.md"
  },
  "timestamps": {
    "lastModified": "2025-01-15T11:30:00Z"
  }
}

# Step 8: Output to user
✅ Analysis complete!

📁 Work folder: .WIP/EC-1234-add-user-authentication/
📄 Analysis: 02-analysis.md

Next steps:
- Review analysis: cat .WIP/EC-1234-add-user-authentication/02-analysis.md
- Generate plan: /schovi:plan
```
