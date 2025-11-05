# Command Integration Guide

This guide shows how to integrate work folder management into schovi commands.

## Overview

Each command should follow this pattern:

1. **Parse Input** - Extract identifier, flags, and options
2. **Resolve Work Folder** - Find existing or create new work folder
3. **Load Context** - Read metadata and previous step outputs
4. **Execute Command** - Perform the actual command logic
5. **Write Output** - Save results to numbered file
6. **Update Metadata** - Track progress and state
7. **Display Results** - Show user-friendly output

## Integration Template

### Phase 1: Input Processing

```markdown
## Step 1.1: Parse command arguments

Extract:
- Identifier (Jira ID, GitHub issue, or description)
- Flags (--work-dir, --input, --from-scratch, etc.)
- Additional context

Examples:
- /schovi:analyze EC-1234
  → identifier: "EC-1234"
- /schovi:plan --input .WIP/EC-1234/02-analysis.md
  → workFolder: ".WIP/EC-1234", inputFile: "02-analysis.md"
- /schovi:debug "Payment timeout after 30 seconds"
  → description: "Payment timeout after 30 seconds"

## Step 1.2: Detect work folder mode

Determine operation mode:
- NEW: Creating new work folder (no existing folder found)
- CONTINUE: Using existing work folder
- EXPLICIT: User provided --work-dir or --input path

```

### Phase 2: Work Folder Resolution

```markdown
## Step 2.1: Check for explicit work folder

If --work-dir flag provided:
- Use exactly as specified
- Validate folder exists or can be created
- Skip auto-detection

If --input flag with path:
- Extract work folder from path
- Example: .WIP/EC-1234/02-analysis.md → .WIP/EC-1234

## Step 2.2: Auto-detect existing work folder

Priority order:
1. Git branch extraction
   - Get current branch: git rev-parse --abbrev-ref HEAD
   - Extract identifier: claude/auth-EC-1234-... → EC-1234
   - Search: find .WIP -type d -name "EC-1234*"

2. Identifier from input
   - Extract Jira ID or GitHub issue
   - Search: find .WIP -type d -name "[identifier]*"

3. Recent work folders
   - List: ls -dt .WIP/*/ | head -5
   - If single match, use it
   - If multiple, ask user to specify

## Step 2.3: Create new work folder if needed

If no existing folder found:
1. Generate identifier:
   - Use reference helper: generate_identifier()
   - Example: "EC-1234" + "Add user auth" → "EC-1234-add-user-auth"

2. Create folder structure:
   mkdir -p .WIP/[identifier]/context

3. Create initial metadata:
   - See "Metadata Creation" section below
```

### Phase 3: Metadata Management

```markdown
## Step 3.1: Read existing metadata (if CONTINUE mode)

Bash command:
cat .WIP/[identifier]/.metadata.json

Parse JSON to extract:
- workflow.completed: What steps are done
- workflow.current: Last active step
- files: Map of existing outputs
- external: Jira/GitHub links
- git: Branch and commits

## Step 3.2: Validate workflow state

Check prerequisites:
- If command is "plan", ensure "analyze" or "spec" in workflow.completed
- If command is "implement", ensure "plan" in workflow.completed

Error if prerequisites missing:
"Cannot run 'plan' - no analysis found. Run /schovi:analyze first."

## Step 3.3: Create initial metadata (if NEW mode)

Current timestamp:
date -u +"%Y-%m-%dT%H:%M:%SZ"

Metadata structure:
{
  "identifier": "[identifier]",
  "title": "[extracted or inferred title]",
  "slug": "[generated slug]",
  "workFolder": ".WIP/[identifier]",

  "workflow": {
    "type": "[full|technical|bug|simple]",
    "steps": ["[expected steps]"],
    "completed": [],
    "current": "[current command]"
  },

  "files": {},

  "git": {
    "branch": "[current branch from git]",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": "[if Jira]",
    "jiraUrl": "[if Jira]",
    "githubPR": null,
    "githubIssue": "[if GitHub]",
    "githubIssueUrl": "[if GitHub]"
  },

  "timestamps": {
    "created": "[now]",
    "lastModified": "[now]",
    "completed": null
  }
}

Write to file:
.WIP/[identifier]/.metadata.json

## Step 3.4: Update metadata (after command execution)

Read existing metadata, update fields:
- workflow.completed: append current command
- workflow.current: current command
- files.[command]: output filename
- timestamps.lastModified: now
- git.commits: append new commits if any
- git.lastCommit: latest commit

Write updated metadata back to .metadata.json
```

### Phase 4: File Operations

```markdown
## Step 4.1: Determine output file path

Use mapping:
- spec → 01-spec.md
- analyze → 02-analysis.md
- debug → 02-debug.md
- plan → 03-plan.md
- implement → 04-progress.md

Full path: .WIP/[identifier]/[number]-[name].md

## Step 4.2: Check if file exists

Bash command:
ls .WIP/[identifier]/02-analysis.md 2>/dev/null

If exists:
- Default: Overwrite (commands are idempotent)
- Optional: Warn user first
- Optional: Backup with timestamp

## Step 4.3: Write output file

Use Write tool:
- file_path: .WIP/[identifier]/[number]-[name].md
- content: [full markdown output]

Ensure proper formatting:
- Frontmatter if needed
- Section headers with emojis
- Code blocks with proper language tags
- File references with file:line format

## Step 4.4: Handle supporting materials

If command receives images, PDFs, etc.:
1. Copy to context/ folder:
   cp wireframe.png .WIP/[identifier]/context/

2. Reference in output:
   "See wireframe: ./context/wireframe.png"

3. Update metadata (optional):
   "files.context": ["wireframe.png", "requirements.pdf"]
```

### Phase 5: User Communication

```markdown
## Step 5.1: Show completion message

Format:
✅ [Command] complete!

📁 Work folder: .WIP/[identifier]/
📄 Output: [filename]

[Optional: Key insights or next steps]

Next steps:
- Review output: cat .WIP/[identifier]/[filename]
- Continue workflow: /schovi:[next-command]

## Step 5.2: Show context information

If external context fetched:
- Jira: EC-1234 - [title]
- GitHub: Issue #123 - [title]
- PR: #456 - [title]

## Step 5.3: Error handling

If error occurred:
❌ [Command] failed: [error message]

📁 Work folder: .WIP/[identifier]/ (preserved)
📊 Progress: [what was completed]

Suggestions:
- [Specific action to resolve]
- [Alternative approach]
```

## Command-Specific Integration

### Analyze Command

```markdown
# Integration steps for analyze command

## Input Processing
- Parse: Jira ID, GitHub issue/PR, or description
- Fetch external context if needed (via subagents)

## Work Folder Resolution
- Generate identifier from Jira/GitHub or description
- Create: .WIP/[identifier]/

## Metadata Creation
- workflow.type: "technical" (analyze → plan → implement)
- workflow.steps: ["analyze", "plan", "implement"]
- workflow.current: "analyze"
- external: Populate Jira/GitHub fields

## Command Execution
- Perform deep codebase analysis
- Generate structured analysis output

## File Output
- Write to: .WIP/[identifier]/02-analysis.md
- Update metadata.files.analysis

## User Communication
- Show work folder path
- Show next step: /schovi:plan
```

### Plan Command

```markdown
# Integration steps for plan command

## Input Processing
- Check for --input flag or auto-detect work folder
- Load analysis from 02-analysis.md or 01-spec.md

## Work Folder Resolution
- CONTINUE mode: Find existing folder with analysis
- Validate: metadata.workflow.completed includes "analyze" or "spec"

## Metadata Update
- workflow.completed: append "plan"
- workflow.current: "plan"

## Command Execution
- Use spec-generator subagent
- Generate phase-based plan for large tasks

## File Output
- Write to: .WIP/[identifier]/03-plan.md
- Update metadata.files.plan
- If phases: Update metadata.phases structure

## User Communication
- Show work folder path
- Show phase count if applicable
- Show next step: /schovi:implement
```

### Implement Command

```markdown
# Integration steps for implement command

## Input Processing
- Auto-detect work folder (from git branch or recent)
- Check for --resume or --phase flags

## Work Folder Resolution
- CONTINUE mode: Must have existing folder with plan
- Validate: metadata.workflow.completed includes "plan"
- Load: 03-plan.md

## Metadata Update
- If first run: Initialize metadata.phases
- Update metadata.phases.current
- Track phase completion

## Command Execution
- Execute tasks from plan
- Checkpoint after each phase
- Support pause/resume

## File Output
- Write to: .WIP/[identifier]/04-progress.md
- Update progress.md after each phase
- Append git commits to metadata.git.commits

## User Communication
- Show current phase
- Show completion percentage
- Show last commit
- Guide to resume: /schovi:implement --resume
```

### Debug Command

```markdown
# Integration steps for debug command

## Input Processing
- Parse: Jira ID, GitHub issue, error description, stack trace
- Fetch external context if needed

## Work Folder Resolution
- Generate identifier from bug reference or description
- Create: .WIP/[identifier]/

## Metadata Creation
- workflow.type: "bug" (debug → [plan] → implement)
- workflow.steps: ["debug", "implement"] or ["debug", "plan", "implement"]
- workflow.current: "debug"

## Command Execution
- Perform deep debugging and root cause analysis
- Generate fix proposal

## File Output
- Write to: .WIP/[identifier]/02-debug.md
- Update metadata.files.debug

## User Communication
- Show work folder path
- Show root cause summary
- Show next step: /schovi:implement or /schovi:plan (if complex)
```

### Spec Command (New)

```markdown
# Integration steps for spec command (to be implemented)

## Input Processing
- Parse: Images, PDFs, Jira ID, or description
- Load documents and images
- Fetch Jira if provided

## Work Folder Resolution
- Generate identifier from Jira or description
- Create: .WIP/[identifier]/

## Metadata Creation
- workflow.type: "full" (spec → analyze → plan → implement)
- workflow.steps: ["spec", "analyze", "plan", "implement"]
- workflow.current: "spec"

## Command Execution
- Analyze product requirements
- Ask clarifying questions
- Generate product specification

## File Output
- Write to: .WIP/[identifier]/01-spec.md
- Copy supporting materials to context/
- Update metadata.files.spec
- Update metadata.files.context: [list of files]

## User Communication
- Show work folder path
- Show next step: /schovi:analyze --input [spec]
```

## Bash Command Reference

### Work Folder Operations

```bash
# Create work folder
mkdir -p .WIP/EC-1234-add-user-auth/context

# Find work folder by identifier
find .WIP -type d -name "EC-1234*" | head -1

# List recent work folders
ls -dt .WIP/*/ | head -5

# Check if folder exists
ls .WIP/EC-1234 2>/dev/null && echo "exists" || echo "not found"
```

### Metadata Operations

```bash
# Read metadata
cat .WIP/EC-1234/.metadata.json

# Read specific field (requires jq)
cat .WIP/EC-1234/.metadata.json | jq -r '.workflow.current'

# Update metadata (create updated JSON, then write)
# Note: In practice, use Read + Edit or Write tool

# Check if metadata exists
ls .WIP/EC-1234/.metadata.json 2>/dev/null
```

### Git Operations

```bash
# Get current branch
git rev-parse --abbrev-ref HEAD

# Extract identifier from branch
git rev-parse --abbrev-ref HEAD | grep -oE '[A-Z]{2,10}-[0-9]+'

# Get last commit
git log -1 --format='%H'

# Get branch commits (for metadata)
git log --format='%H' main..HEAD
```

### Identifier Extraction

```bash
# Extract Jira ID
echo "EC-1234 Add user auth" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'

# Extract GitHub issue from URL
echo "https://github.com/owner/repo/issues/123" | grep -oE 'issues/[0-9]+' | grep -oE '[0-9]+'

# Generate slug
echo "Add User Authentication" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g'
```

## Testing Integration

### Validation Checklist

When implementing command integration:

- [ ] Parse input correctly (Jira, GitHub, description)
- [ ] Generate valid identifier
- [ ] Create work folder structure
- [ ] Initialize metadata with all required fields
- [ ] Validate workflow prerequisites
- [ ] Write output to correct numbered file
- [ ] Update metadata after execution
- [ ] Handle existing work folder gracefully
- [ ] Support --work-dir explicit override
- [ ] Show clear user-friendly output
- [ ] Handle errors with actionable messages

### Test Scenarios

**Scenario 1: New work from Jira**
```bash
/schovi:analyze EC-1234

Expected:
- Fetch Jira issue via jira-analyzer
- Generate identifier: EC-1234-[title-slug]
- Create: .WIP/EC-1234-[title-slug]/
- Create: .metadata.json with Jira fields
- Write: 02-analysis.md
- Show: Next step (/schovi:plan)
```

**Scenario 2: Continue workflow**
```bash
# After analyze completed
/schovi:plan

Expected:
- Auto-detect: .WIP/EC-1234-[title-slug]/
- Read: .metadata.json
- Validate: workflow.completed includes "analyze"
- Read: 02-analysis.md
- Execute: plan generation
- Write: 03-plan.md
- Update: metadata.workflow.completed += "plan"
```

**Scenario 3: Explicit input**
```bash
/schovi:plan --input .WIP/EC-1234/02-analysis.md

Expected:
- Extract work folder: .WIP/EC-1234/
- Read: .metadata.json
- Read: 02-analysis.md
- Execute: plan generation
- Write: 03-plan.md
- Update: metadata
```

**Scenario 4: Error handling**
```bash
/schovi:plan  # No prior analysis

Expected:
- Auto-detect: Try to find work folder
- Check: metadata.workflow.completed
- Error: "Cannot run 'plan' - no analysis found"
- Suggest: "/schovi:analyze [identifier] first"
```

## Migration Strategy

For existing commands that don't use work folders:

### Phase 1: Add work folder support (non-breaking)
- Keep existing behavior as default
- Add --work-dir flag for opt-in
- Support reading from work folders
- Write outputs to both old location and work folder

### Phase 2: Encourage migration
- Show deprecation warnings for old pattern
- Guide users to work folder structure
- Provide migration script

### Phase 3: Default to work folders
- Make work folders default
- Require explicit --legacy flag for old behavior

### Phase 4: Remove legacy support
- Clean up old code paths
- Fully standardize on work folders

## Common Patterns

### Pattern: Idempotent Operations

Commands should be re-runnable:
```markdown
If output file exists:
- Read existing output
- Warn: "02-analysis.md exists, overwriting..."
- Proceed with overwrite

This allows users to:
- Re-run analyze with updated context
- Regenerate plan after editing analysis
- Fix issues by re-running command
```

### Pattern: Progressive Enhancement

Commands should work without full history:
```markdown
If metadata missing:
- Recreate from folder contents
- Infer workflow state from existing files
- Warn: "Metadata recreated from folder"

This handles:
- Manual file edits
- Corrupted metadata
- Migration from old structure
```

### Pattern: Fail Fast with Clear Guidance

Commands should fail early with actionable errors:
```markdown
If prerequisite missing:
- Don't attempt to proceed
- Show clear error message
- Suggest exact command to run
- Example: "Run /schovi:analyze EC-1234 first"

This prevents:
- Confusing intermediate states
- Wasted execution time
- User frustration
```

## Summary

**Key Principles:**
1. **Consistency** - All commands follow same pattern
2. **Visibility** - Clear folder structure and metadata
3. **Resumability** - Can pause and continue work
4. **Traceability** - Full history in metadata and git
5. **Simplicity** - Auto-detection reduces user friction

**Integration Checklist:**
- [ ] Parse input and flags
- [ ] Resolve or create work folder
- [ ] Read/create metadata
- [ ] Validate prerequisites
- [ ] Execute command logic
- [ ] Write output to numbered file
- [ ] Update metadata
- [ ] Show user-friendly results

**Next Steps:**
- Implement this pattern in all commands
- Test with real workflows
- Gather user feedback
- Iterate on UX improvements
