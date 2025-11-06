# Phase 1: Build Foundation

**Timeline**: Week 1 (5-7 days)
**Priority**: 🔴 Critical - Foundational infrastructure
**Status**: 📋 Ready to Start

---

## 📝 Overview

Create the shared library system that will eliminate 60-70% code duplication across commands. This phase establishes the foundational abstractions that all subsequent refactoring depends on.

**Core Goal**: Replace 1,980 lines of duplicated code with 4 reusable libraries (~400 lines total).

---

## 🎯 Objectives

1. **Eliminate code duplication** across analyze, debug, plan, review commands
2. **Standardize patterns** for argument parsing, input processing, and work folder management
3. **Create reusable abstractions** that can be referenced from commands
4. **Maintain backward compatibility** - no changes to command behavior or outputs
5. **Preserve token efficiency** - ensure libraries don't increase context usage

---

## 📊 Problem Analysis

### Current State Issues

**Issue #1: Work Folder Logic Duplicated 3×**
- Location: analyze.md (lines 736-912), debug.md (lines 387-555), plan.md (lines 346-421)
- Lines: 177 + 169 + 76 = 422 lines duplicated
- Impact: Bug fixes must be manually synced across 3 files
- Risk: Metadata structure divergence (already showing signs)

**Issue #2: Argument Parsing Duplicated 4×**
- Location: analyze.md (lines 40-114), debug.md (lines 40-102), plan.md (lines 15-114), review.md (lines 11-40)
- Lines: ~100 lines × 4 = 400 lines duplicated
- Impact: Inconsistent flag handling (e.g., --quiet behavior varies)
- Risk: New flags require 4× implementation effort

**Issue #3: Input Processing Logic Duplicated 2×**
- Location: analyze.md (lines 117-636), debug.md (lines 105-379)
- Lines: 520 + 275 = 795 lines duplicated
- Impact: Jira/GitHub/Datadog fetching logic copied wholesale
- Risk: Subagent invocation patterns drift over time

**Issue #4: Subagent Invocation Patterns Inconsistent**
- No standard template for spawning subagents
- Error handling varies (some halt, some warn and continue)
- Visual formatting inconsistent (different box styles)

### Target State

```
schovi/lib/
├── argument-parser.md         (~80 lines)
├── input-processing.md        (~200 lines)
├── work-folder.md             (~100 lines)
└── subagent-invoker.md        (~70 lines)

Total: ~450 lines (replaces 1,980 lines duplicated code)
Reduction: 77% less code to maintain
```

---

## 🛠️ Detailed Tasks

### Task 1.1: Create Library Directory Structure

**Effort**: 15 minutes
**Dependencies**: None

**Actions**:
```bash
# Create library directory
mkdir -p schovi/lib

# Create placeholder files
touch schovi/lib/argument-parser.md
touch schovi/lib/input-processing.md
touch schovi/lib/work-folder.md
touch schovi/lib/subagent-invoker.md
touch schovi/lib/README.md
```

**Deliverable**: Directory structure with placeholder files

---

### Task 1.2: Implement `argument-parser.md`

**Effort**: 3-4 hours
**Dependencies**: Task 1.1

**Problem Context**:
Currently, each command (analyze, debug, plan, review) implements its own argument parsing with slight variations:
- Different flag names for same concept (e.g., `--work-dir` vs `--work-folder`)
- Inconsistent validation (some check flag conflicts, some don't)
- Different error messages for same errors
- No standardized help text

**Analysis of Current Patterns**:

From analyze.md (lines 40-114):
```markdown
### Problem Input
Extract the problem identifier (first non-flag argument):
- **Jira Issue ID**: Pattern `[A-Z]+-\d+` (e.g., EC-1234)
- **GitHub PR**: Full URL, `owner/repo#123`, or `#123`
- **GitHub Issue**: Full URL or `owner/repo#123`
- **Text Description**: Free-form problem statement
- **Empty**: No problem specified

### Flags
- **`--input PATH`**: Read problem description from file
- **`--output PATH`**: Save analysis to specific file path
- **`--no-file`**: Skip file output, terminal only
- **`--quiet`**: Skip terminal output, file only
- **`--post-to-jira`**: Post analysis as Jira comment
- **`--quick`**: Generate quick analysis
- **`--work-dir PATH`**: Use specific work folder
```

From debug.md (lines 40-102) - nearly identical structure
From plan.md (lines 15-114) - different flags (--from-scratch)
From review.md (lines 11-40) - minimal flags (--quick only)

**Implementation Design**:

```markdown
---
name: argument-parser
description: Standardized argument parsing for all commands with validation and error handling
allowed-tools: []
---

# Argument Parser Library

## Purpose
Provides consistent argument parsing across all commands with standardized:
- Positional argument extraction
- Flag parsing and validation
- Conflict detection
- Error messaging

## Usage Pattern

Commands invoke this library with configuration:

```
Parse arguments using argument-parser library:

Configuration:
  positional_args:
    - name: "problem-input"
      required: false
      description: "Jira ID, GitHub URL, or description"
      patterns:
        - jira: "[A-Z]+-\d+"
        - github_pr: "github.com/.*/pull/\d+|owner/repo#\d+|#\d+"
        - github_issue: "github.com/.*/issues/\d+"
        - text: ".*"

  flags:
    - name: "--input"
      type: "path"
      description: "Read input from file"
      conflicts: ["positional:problem-input"]

    - name: "--output"
      type: "path"
      description: "Save output to file"
      conflicts: ["--no-file"]

    - name: "--no-file"
      type: "boolean"
      description: "Skip file creation"
      conflicts: ["--output"]

    - name: "--quiet"
      type: "boolean"
      description: "Suppress terminal output"

    - name: "--post-to-jira"
      type: "boolean"
      description: "Post to Jira as comment"

    - name: "--quick"
      type: "boolean"
      description: "Use quick mode"

    - name: "--work-dir"
      type: "path"
      description: "Specify work folder"

Output Format:
  {
    "positional": {
      "problem-input": {
        "value": "EC-1234",
        "type": "jira",
        "matched_pattern": "[A-Z]+-\d+"
      }
    },
    "flags": {
      "--output": "./analysis.md",
      "--quiet": false,
      "--post-to-jira": true,
      "--work-dir": null
    },
    "computed": {
      "terminal_output": true,
      "file_output": true,
      "output_path": "./analysis.md"
    },
    "validation": {
      "passed": true,
      "errors": []
    }
  }
```

## Implementation

[Detailed parsing logic with validation, conflict detection, and error formatting]

## Standard Error Messages

[Templated error messages for common failures]
```

**Individual Changes**:

1. **Create file structure** (30 min):
   - Write frontmatter with metadata
   - Create usage documentation section
   - Create output format specification

2. **Implement positional argument parsing** (60 min):
   - Pattern matching for jira, github_pr, github_issue, text
   - Classification logic
   - Empty/ambiguous detection

3. **Implement flag parsing** (60 min):
   - Boolean flags (--no-file, --quiet, --quick, --post-to-jira)
   - Path flags (--input, --output, --work-dir)
   - Value extraction and validation

4. **Implement conflict detection** (45 min):
   - Check --output vs --no-file
   - Check --input vs positional argument
   - Generate clear error messages

5. **Implement computed values** (30 min):
   - terminal_output = !flags["--quiet"]
   - file_output = !flags["--no-file"]
   - output_path = flags["--output"] || default

6. **Create error templates** (30 min):
   - Invalid flag format
   - Conflicting flags
   - Missing required arguments
   - Unknown flags

7. **Write tests/examples** (30 min):
   - Example invocations
   - Edge cases
   - Error scenarios

**Testing**:
- Parse `/schovi:analyze EC-1234 --output ./test.md`
- Parse `/schovi:plan --from-scratch "Add feature"`
- Parse `/schovi:review #123 --quick`
- Test conflict: `--output ./test.md --no-file` (should error)
- Test empty: `/schovi:analyze` (should detect no input)

**Success Criteria**:
- [ ] All current flags supported
- [ ] Conflict detection works
- [ ] Clear error messages
- [ ] Consistent output format
- [ ] Documentation complete with examples

**Deliverable**: `schovi/lib/argument-parser.md` (~80 lines)

---

### Task 1.3: Implement `input-processing.md`

**Effort**: 6-8 hours
**Dependencies**: Task 1.2 (uses parsed input types)

**Problem Context**:
Phase 1 input processing is duplicated almost identically in analyze.md and debug.md:
- analyze.md lines 117-636 (520 lines)
- debug.md lines 105-379 (275 lines)

Both follow the same pattern:
1. Determine input type (Jira, GitHub PR, GitHub Issue, Datadog, text)
2. Fetch context using appropriate subagent
3. Handle errors with standard options
4. Parse additional context (stack traces, logs)

The logic is 95% identical but maintained separately, leading to:
- Inconsistent error messages
- Different subagent invocation patterns
- Duplicated validation logic

**Analysis of Current Implementation**:

**Jira Fetching** (analyze.md lines 175-242):
```markdown
**If Jira Issue ID Provided**:
```
IMPORTANT: Delegate to the jira-analyzer subagent to prevent context pollution.

1. Acknowledge detection:
   🛠️ **[Analyze-Problem]** Detected Jira issue: [ISSUE-KEY]
   ⏳ Fetching issue details via jira-analyzer...

2. Use the Task tool to invoke the jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

3. After receiving the summary, check for errors:
   [Error handling logic - 30 lines]

4. You will receive a structured summary containing:
   [Field descriptions - 10 lines]
```
```

**GitHub PR Fetching** (analyze.md lines 244-316):
```markdown
**If GitHub PR Provided**:
```
IMPORTANT: Delegate to the gh-pr-analyzer subagent to prevent context pollution.

[Nearly identical structure to Jira fetching, just different subagent]
```
```

**Pattern Recognition**: All fetchers follow this template:
1. Detection acknowledgment (with emoji and context label)
2. Subagent invocation (Task tool with specific subagent type)
3. Error handling (check for ❌ markers, provide 3 options)
4. Success acknowledgment (✅ marker)
5. Field description

**Implementation Design**:

```markdown
---
name: input-processing
description: Unified input processing and context fetching for all problem inputs
allowed-tools: ["Task", "Read", "AskUserQuestion"]
---

# Input Processing Library

## Purpose
Centralizes context fetching logic for all input types:
- Jira issues
- GitHub PRs
- GitHub issues
- Datadog traces
- Text descriptions
- Stack traces and error logs

## Usage Pattern

Commands invoke this library after argument parsing:

```
Fetch context using input-processing library:

Configuration:
  input_type: [from argument-parser classification]
  input_value: [parsed value]
  mode: "standard"  # or "quick", "full"
  command_context: "analyze"  # For logging/error messages

  supported_types:
    - jira: Use jira-analyzer subagent
    - github_pr: Use gh-pr-analyzer subagent (mode: compact|full)
    - github_issue: Use gh-issue-analyzer subagent
    - datadog: Use datadog-analyzer subagent (if available)
    - text: Parse directly (stack traces, error logs)
    - empty: Prompt user for input

  error_handling:
    strategy: "halt-with-options"
    options:
      - "Retry with corrected input"
      - "Provide context manually"
      - "Cancel operation"

Output Format:
  {
    "input_type": "jira",
    "input_value": "EC-1234",
    "context": {
      "source": "jira-analyzer subagent",
      "summary": "[Full subagent response]",
      "metadata": {
        "issue_key": "EC-1234",
        "title": "...",
        "type": "Bug",
        "status": "In Progress"
      }
    },
    "success": true,
    "fetch_method": "subagent",
    "tokens_used": 850
  }
```

## Subagent Invocation Templates

### Template 1: Jira Analyzer
```
1. Acknowledge detection:
   🛠️ **[{command_context}]** Detected Jira issue: {issue_key}
   ⏳ Fetching issue details via jira-analyzer...

2. Use Task tool:
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"
   prompt: "Fetch and summarize Jira issue {input_value}"

3. Check for errors in response:
   Pattern: ❌, "failed", "not found", "API error"

   If error found:
     ❌ **[{command_context}]** Failed to fetch Jira issue {issue_key}

     Error: [Extract error message from subagent response]

     Options:
     1. Verify issue key and retry
     2. Provide problem description manually
     3. Cancel operation

     HALT and wait for user choice

4. If success (✅ marker present):
   ✅ **[{command_context}]** Issue details fetched successfully
```

### Template 2: GitHub PR Analyzer
[Similar structure, different subagent and fields]

### Template 3: GitHub Issue Analyzer
[Similar structure, different subagent and fields]

### Template 4: Datadog Analyzer
[Similar structure, with fallback if not available]

### Template 5: Text/Stack Trace Parser
```
1. Detect content type:
   - Python stack trace: "Traceback", "File \"/path/file.py\", line X"
   - JavaScript error: "Error:", "at /path/file.js:X:Y"
   - Java exception: "Exception in thread", "at com.example.Class.method"
   - Log messages: Timestamp + level + message

2. Extract structured data:
   {
     "exception_type": "...",
     "error_message": "...",
     "file_locations": ["file:line", ...],
     "entry_point": "file:line",
     "error_point": "file:line",
     "timestamp": "...",
     "context_data": {...}
   }

3. Return parsed context
```

## Error Handling Patterns

### Pattern 1: Subagent Fetch Failed
[Standard error template with 3 options]

### Pattern 2: Authentication Required
[gh CLI or Jira MCP not configured]

### Pattern 3: Not Found
[Issue/PR doesn't exist or no access]

### Pattern 4: Network Error
[Connection issues, timeouts]

## Additional Context Handling

### Stack Trace Parsing
[Detailed regex patterns for Python, JS, Java stack traces]

### Log Message Parsing
[Patterns for structured logs, timestamps, levels]

### Error Message Extraction
[Common error message formats]
```

**Individual Changes**:

1. **Create file structure** (30 min):
   - Frontmatter
   - Purpose and overview
   - Usage pattern documentation

2. **Implement Jira fetching template** (90 min):
   - Detection acknowledgment logic
   - Subagent invocation via Task tool
   - Error detection and parsing
   - Error handling with 3 options
   - Success acknowledgment

3. **Implement GitHub PR fetching template** (90 min):
   - Adapt Jira template for PR context
   - Mode parameter (compact vs full)
   - PR-specific error scenarios
   - Repository detection from git remote

4. **Implement GitHub Issue fetching template** (60 min):
   - Similar to PR but for issues
   - Different subagent
   - Issue-specific fields

5. **Implement Datadog fetching template** (60 min):
   - Conditional (check if datadog-analyzer available)
   - Fallback to manual input if not available
   - Trace-specific parsing

6. **Implement text/stack trace parser** (90 min):
   - Python stack trace regex patterns
   - JavaScript error parsing
   - Java exception parsing
   - Log message parsing
   - Structured data extraction

7. **Implement error handling patterns** (60 min):
   - Standard error template
   - Authentication errors
   - Not found errors
   - Network errors
   - Consistent formatting

8. **Create output format standardization** (30 min):
   - JSON structure for context
   - Metadata extraction
   - Token tracking

9. **Write comprehensive documentation** (60 min):
   - Usage examples from each command
   - Error scenario examples
   - Integration guide

**Testing**:
- Test Jira fetch: `EC-1234`
- Test GitHub PR: `https://github.com/owner/repo/pull/123`
- Test GitHub Issue: `owner/repo#456`
- Test stack trace parsing (Python, JS, Java examples)
- Test error handling (invalid input, network errors)
- Test fallback to manual input

**Success Criteria**:
- [ ] All 5 input types supported
- [ ] Consistent subagent invocation
- [ ] Standard error handling
- [ ] Stack trace parsing works
- [ ] Clear documentation with examples
- [ ] Can replace analyze.md Phase 1 entirely

**Deliverable**: `schovi/lib/input-processing.md` (~200 lines)

---

### Task 1.4: Implement `work-folder.md`

**Effort**: 4-5 hours
**Dependencies**: Task 1.2 (uses parsed arguments)

**Problem Context**:
Work folder logic is duplicated across 3 commands:
- analyze.md: lines 736-912 (177 lines)
- debug.md: lines 387-555 (169 lines)
- plan.md: lines 346-421 (76 lines)

All implement the same workflow:
1. Check for explicit --work-dir flag
2. Auto-detect from git branch
3. Auto-detect from problem input (Jira ID, GitHub number)
4. Create new work folder if not found
5. Load or create .metadata.json

But with subtle differences:
- analyze creates workflow.type = "technical"
- debug creates workflow.type = "bug"
- plan can create workflow.type = "full", "technical", or "simple"

This leads to:
- Metadata structure drift
- Inconsistent folder naming
- Different slug generation logic

**Analysis of Current Implementation**:

**From analyze.md (lines 736-912)**:

Step 1.6.1: Check for Explicit Work Folder
```bash
work_folder="$work_dir"
if [ ! -d "$work_folder" ]; then
  echo "⚠️ Work folder not found: $work_folder"
  mkdir -p "$work_folder/context"
fi
```

Step 1.6.2: Auto-detect from Git Branch
```bash
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)
if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)
fi
```

Step 1.6.3: Create New Work Folder
```bash
# Generate slug from Jira title
slug=$(echo "$jira_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//')
identifier="${jira_id}-${slug}"
work_folder=".WIP/$identifier"
mkdir -p "$work_folder/context"
```

Step 1.6.4: Create Metadata
```json
{
  "identifier": "EC-1234-fix-validation",
  "title": "Fix validation logic",
  "slug": "fix-validation",
  "workFolder": ".WIP/EC-1234-fix-validation",
  "workflow": {
    "type": "technical",
    "steps": ["analyze", "plan", "implement"],
    "completed": [],
    "current": "analyze"
  },
  "files": {},
  "git": {
    "branch": "claude/EC-1234",
    "commits": [],
    "lastCommit": null
  },
  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://...",
    ...
  },
  "timestamps": {
    "created": "2025-04-11T14:30:00Z",
    "lastModified": "2025-04-11T14:30:00Z",
    "completed": null
  }
}
```

**Implementation Design**:

```markdown
---
name: work-folder
description: Unified work folder resolution and metadata management
allowed-tools: ["Bash", "Read", "Write"]
---

# Work Folder Management Library

## Purpose
Provides standardized work folder operations:
- Folder detection (explicit, git branch, problem input)
- Folder creation with proper structure
- Metadata management (.metadata.json)
- Consistent naming and slug generation

## Usage Pattern

Commands invoke this library to manage work folders:

```
Resolve work folder using work-folder library:

Configuration:
  mode: "detect"  # detect, create, explicit

  # For explicit mode
  explicit_path: null  # From --work-dir flag

  # For detection
  identifier_sources:
    - git_branch: true   # Extract from current branch
    - problem_input: "EC-1234"  # From Jira ID, GH number, etc.

  # For creation
  create_if_missing: true
  identifier: "EC-1234"  # or "GH-123" or "debug-slug"
  title: "Fix validation logic"
  workflow_type: "technical"  # technical, bug, full, simple

  # Metadata fields
  external_refs:
    jira_issue: "EC-1234"
    jira_url: "https://..."
    github_pr: null
    github_issue: null

Output Format:
  {
    "work_folder": ".WIP/EC-1234-fix-validation",
    "identifier": "EC-1234-fix-validation",
    "slug": "fix-validation",
    "exists": true,
    "metadata_exists": true,
    "metadata": {
      "workflow": {
        "type": "technical",
        "steps": ["analyze", "plan", "implement"],
        "completed": [],
        "current": "analyze"
      },
      ...
    }
  }
```

## Detection Strategy

### Priority Order:
1. **Explicit**: If --work-dir provided, use exact path
2. **Git Branch**: Extract identifier from branch name
3. **Problem Input**: Use Jira ID, GitHub number, etc.
4. **Create New**: Generate identifier from title

### Implementation:

**Step 1: Check Explicit Path**
```bash
if [ -n "$explicit_path" ]; then
  work_folder="$explicit_path"

  # Validate exists
  if [ ! -d "$work_folder" ]; then
    echo "⚠️ Work folder not found: $work_folder"
    if [ "$create_if_missing" = true ]; then
      mkdir -p "$work_folder/context"
    fi
  fi

  return work_folder
fi
```

**Step 2: Auto-detect from Git Branch**
```bash
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Extract Jira ID pattern
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)

if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)

  if [ -n "$work_folder" ]; then
    return work_folder
  fi
fi
```

**Step 3: Auto-detect from Problem Input**
```bash
# Try Jira ID
jira_id=$(echo "$problem_input" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b')
if [ -n "$jira_id" ]; then
  work_folder=$(find .WIP -type d -name "${jira_id}*" | head -1)
  if [ -n "$work_folder" ]; then
    return work_folder
  fi
fi

# Try GitHub issue/PR number
gh_issue=$(echo "$problem_input" | grep -oE '(issues|pull)/[0-9]+' | grep -oE '[0-9]+')
if [ -n "$gh_issue" ]; then
  work_folder=$(find .WIP -type d -name "GH-${gh_issue}*" | head -1)
  if [ -n "$work_folder" ]; then
    return work_folder
  fi
fi
```

**Step 4: Create New Work Folder**
```bash
# Generate identifier
if [ -n "$jira_id" ]; then
  # Jira: EC-1234-slug-from-title
  slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//')
  identifier="${jira_id}-${slug}"

elif [ -n "$gh_issue" ]; then
  # GitHub: GH-123-slug-from-title
  slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//')
  identifier="GH-${gh_issue}-${slug}"

else
  # Plain description: slug-from-description
  slug=$(echo "$title" | head -c 50 | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | sed 's/-$//')
  identifier="$slug"
fi

# Create folder structure
work_folder=".WIP/$identifier"
mkdir -p "$work_folder/context"
```

## Metadata Management

### Metadata Schema (Standard):
```json
{
  "identifier": "EC-1234-fix-validation",
  "title": "Fix validation logic",
  "slug": "fix-validation",
  "workFolder": ".WIP/EC-1234-fix-validation",

  "workflow": {
    "type": "technical|bug|full|simple",
    "steps": ["analyze", "plan", "implement"] | ["debug", "implement"],
    "completed": [],
    "current": "analyze|debug|plan|implement"
  },

  "files": {
    "analysis": "02-analysis.md",
    "debug": "02-debug.md",
    "plan": "03-plan.md",
    ...
  },

  "git": {
    "branch": "claude/EC-1234-feature",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://productboard.atlassian.net/browse/EC-1234",
    "githubIssue": null,
    "githubIssueUrl": null,
    "githubPR": null,
    "githubPRUrl": null
  },

  "timestamps": {
    "created": "2025-04-11T14:30:00Z",
    "lastModified": "2025-04-11T14:30:00Z",
    "completed": null
  }
}
```

### Workflow Type Mapping:
- **technical**: analyze → plan → implement (feature development)
- **bug**: debug → implement (bug fixes)
- **full**: spec → plan → implement (from requirements doc)
- **simple**: plan → implement (from-scratch simple tasks)

### Loading Metadata:
```bash
if [ -f "$work_folder/.metadata.json" ]; then
  # Read existing metadata
  metadata=$(cat "$work_folder/.metadata.json")

  # Extract current workflow state
  completed=$(jq -r '.workflow.completed[]' <<< "$metadata")
  current=$(jq -r '.workflow.current' <<< "$metadata")

  return {work_folder, metadata, exists: true}
fi
```

### Creating Metadata:
```bash
# Get current timestamp
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get current git branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Create metadata JSON
cat > "$work_folder/.metadata.json" <<EOF
{
  "identifier": "$identifier",
  "title": "$title",
  "slug": "$slug",
  "workFolder": "$work_folder",

  "workflow": {
    "type": "$workflow_type",
    "steps": $(get_workflow_steps "$workflow_type"),
    "completed": [],
    "current": "$current_step"
  },

  "files": {},

  "git": {
    "branch": "$branch",
    "commits": [],
    "lastCommit": null
  },

  "external": $(format_external_refs),

  "timestamps": {
    "created": "$timestamp",
    "lastModified": "$timestamp",
    "completed": null
  }
}
EOF
```

### Updating Metadata:
```bash
# Update workflow.completed
jq '.workflow.completed += ["analyze"]' "$work_folder/.metadata.json" > tmp && mv tmp "$work_folder/.metadata.json"

# Update workflow.current
jq '.workflow.current = "plan"' "$work_folder/.metadata.json" > tmp && mv tmp "$work_folder/.metadata.json"

# Update files
jq '.files.analysis = "02-analysis.md"' "$work_folder/.metadata.json" > tmp && mv tmp "$work_folder/.metadata.json"

# Update lastModified
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq ".timestamps.lastModified = \"$timestamp\"" "$work_folder/.metadata.json" > tmp && mv tmp "$work_folder/.metadata.json"
```

## Helper Functions

### get_workflow_steps(type):
```bash
case "$type" in
  technical)
    echo '["analyze", "plan", "implement"]'
    ;;
  bug)
    echo '["debug", "implement"]'
    ;;
  full)
    echo '["plan", "implement"]'
    ;;
  simple)
    echo '["plan", "implement"]'
    ;;
esac
```

### format_external_refs():
```bash
cat <<EOF
{
  "jiraIssue": "$jira_issue",
  "jiraUrl": "$jira_url",
  "githubIssue": "$github_issue",
  "githubIssueUrl": "$github_issue_url",
  "githubPR": "$github_pr",
  "githubPRUrl": "$github_pr_url"
}
EOF
```
```

**Individual Changes**:

1. **Create file structure** (30 min):
   - Frontmatter and metadata
   - Purpose documentation
   - Usage pattern

2. **Implement detection strategy** (90 min):
   - Explicit path handling
   - Git branch detection
   - Problem input detection
   - Priority logic

3. **Implement folder creation** (60 min):
   - Identifier generation (Jira, GitHub, description)
   - Slug generation with sanitization
   - Directory structure creation

4. **Implement metadata schema** (90 min):
   - Define standard schema
   - Workflow type mapping
   - External refs formatting
   - Timestamp handling

5. **Implement metadata loading** (45 min):
   - Read .metadata.json
   - Parse with jq
   - Extract workflow state

6. **Implement metadata creation** (60 min):
   - Template generation
   - Field population
   - JSON formatting

7. **Implement metadata updating** (45 min):
   - Update completed steps
   - Update current step
   - Update files mapping
   - Update timestamps

8. **Create helper functions** (30 min):
   - get_workflow_steps()
   - format_external_refs()
   - Utility functions

9. **Write documentation** (45 min):
   - Usage examples
   - Schema documentation
   - Integration guide

**Testing**:
- Test explicit path: `--work-dir .WIP/test`
- Test git branch detection: Create branch `feature/EC-1234-test`
- Test Jira detection: Input `EC-1234`
- Test GitHub detection: Input `#123`
- Test creation with Jira ID
- Test creation with description
- Test metadata loading
- Test metadata updating

**Success Criteria**:
- [ ] All detection modes work
- [ ] Consistent folder naming
- [ ] Standard metadata schema
- [ ] Update operations preserve data
- [ ] Clear documentation
- [ ] Can replace 3 command implementations

**Deliverable**: `schovi/lib/work-folder.md` (~100 lines)

---

### Task 1.5: Implement `subagent-invoker.md`

**Effort**: 2-3 hours
**Dependencies**: None (but used by input-processing.md)

**Problem Context**:
Subagent invocation patterns are inconsistent across commands:
- Different visual formatting (emojis, box styles)
- Different error detection logic
- Different acknowledgment messages
- No standard template for success/failure

This leads to:
- Inconsistent user experience
- Duplicated error handling
- Different retry patterns

**Analysis of Current Patterns**:

From analyze.md (Jira subagent invocation):
```markdown
1. Acknowledge detection:
   🛠️ **[Analyze-Problem]** Detected Jira issue: [ISSUE-KEY]
   ⏳ Fetching issue details via jira-analyzer...

2. Use the Task tool to invoke the jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

3. After receiving the summary, check for errors:
   Pattern: ❌, "failed", "not found", "API error"

   If error: [Display error message with 3 options]
   HALT and wait for user

4. If success (✅ marker present):
   ✅ **[Analyze-Problem]** Issue details fetched successfully
```

From review.md (PR subagent invocation):
```markdown
Use Task tool with subagent_type: `schovi:gh-pr-analyzer:gh-pr-analyzer`
Prompt: "Fetch and summarize GitHub PR [input] with mode: full"
Description: "Fetching GitHub PR summary (full mode)"

Wait for subagent completion before proceeding.
```

Different patterns, different detail levels, different error handling.

**Implementation Design**:

```markdown
---
name: subagent-invoker
description: Standardized subagent invocation with consistent error handling and visual feedback
allowed-tools: ["Task", "AskUserQuestion"]
---

# Subagent Invoker Library

## Purpose
Provides consistent patterns for invoking subagents:
- Visual acknowledgments (before/after)
- Error detection and handling
- Standard retry/fallback options
- Logging and debugging

## Usage Pattern

Commands invoke subagents through this library:

```
Invoke subagent using subagent-invoker library:

Configuration:
  subagent:
    type: "schovi:jira-analyzer:jira-analyzer"
    description: "Fetching Jira issue summary"
    prompt: "Fetch and summarize Jira issue EC-1234"

  context:
    command: "analyze"  # For context labels
    operation: "Fetching issue details"

  visual:
    pre_emoji: "🛠️"
    pre_message: "Detected Jira issue: EC-1234"
    loading_emoji: "⏳"
    loading_message: "Fetching issue details via jira-analyzer..."
    success_emoji: "✅"
    success_message: "Issue details fetched successfully"
    error_emoji: "❌"

  error_handling:
    strategy: "halt-with-options"
    error_patterns: ["❌", "failed", "not found", "API error"]
    options:
      - "Verify input and retry"
      - "Provide context manually"
      - "Cancel operation"
    halt: true

  output:
    return_format: "structured"  # or "raw"
    extract_metadata: true

Response Format:
  {
    "success": true,
    "subagent_type": "jira-analyzer",
    "response": "[Full subagent response]",
    "metadata": {
      "tokens_used": 850,
      "execution_time": "3.2s"
    },
    "error": null
  }
```

## Visual Templates

### Template 1: Pre-Invocation Acknowledgment
```
{pre_emoji} **[{command_context}]** {pre_message}
{loading_emoji} {loading_message}
```

Example:
```
🛠️ **[Analyze-Problem]** Detected Jira issue: EC-1234
⏳ Fetching issue details via jira-analyzer...
```

### Template 2: Post-Invocation Success
```
{success_emoji} **[{command_context}]** {success_message}
```

Example:
```
✅ **[Analyze-Problem]** Issue details fetched successfully
```

### Template 3: Post-Invocation Error
```
{error_emoji} **[{command_context}]** Failed to {operation}

Error: {extracted_error_message}

This usually means:
{error_explanation}

Options:
{numbered_options}

How would you like to proceed?
```

Example:
```
❌ **[Analyze-Problem]** Failed to fetch Jira issue EC-1234

Error: Issue not found or access denied

This usually means:
- Issue key is incorrect or doesn't exist
- You don't have access to this issue
- Jira API is unavailable
- MCP Jira server is not configured

Options:
1. Verify issue key and retry
2. Provide problem description manually
3. Cancel analysis

How would you like to proceed?
```

## Error Detection

### Detection Patterns:
```
Primary indicators (in order of priority):
1. ❌ emoji in response
2. Text patterns:
   - "failed"
   - "not found"
   - "API error"
   - "authentication"
   - "cannot"
   - "unable to"

Secondary indicators:
3. Missing success marker (✅)
4. Empty response
5. Timeout indicators
```

### Error Message Extraction:
```
1. Look for explicit error line after ❌ marker
2. Extract from "Error:" prefix
3. Extract from first sentence containing error keyword
4. Default: "Unknown error occurred"
```

## Invocation Logic

### Step 1: Pre-Invocation
```
1. Display pre-invocation message:
   {pre_emoji} **[{command_context}]** {pre_message}
   {loading_emoji} {loading_message}

2. Prepare Task tool parameters:
   - subagent_type: {fully qualified name}
   - description: {short description}
   - prompt: {detailed prompt for subagent}
```

### Step 2: Invocation
```
3. Execute Task tool:
   Use Task tool with prepared parameters

4. Wait for completion:
   Subagent executes in isolated context
   Returns response when complete
```

### Step 3: Response Processing
```
5. Receive response

6. Check for error patterns:
   for pattern in error_patterns:
     if pattern in response:
       error_detected = true
       break

7. If error detected:
   - Extract error message
   - Display error template
   - Present options to user
   - If halt=true: HALT execution, wait for user choice
   - If halt=false: Log error, continue with fallback

8. If success:
   - Display success message
   - Extract metadata if configured
   - Return structured response
```

### Step 4: Metadata Extraction
```
9. Parse response for metadata:
   - Token count: Look for "~X tokens" or "| ~X tokens"
   - Execution time: Track from invocation to completion
   - Response size: Character/line count

10. Return structured output:
    {
      "success": true,
      "response": "[Full response]",
      "metadata": {...},
      "error": null
    }
```

## Standard Subagent Configurations

### Configuration: jira-analyzer
```yaml
subagent:
  type: "schovi:jira-analyzer:jira-analyzer"
  description: "Fetching Jira issue summary"
  prompt_template: "Fetch and summarize Jira issue {input}"

visual:
  pre_emoji: "🛠️"
  pre_message: "Detected Jira issue: {input}"
  loading_emoji: "⏳"
  loading_message: "Fetching issue details via jira-analyzer..."
  success_emoji: "✅"
  success_message: "Issue details fetched successfully"

error_handling:
  error_patterns: ["❌", "failed", "not found", "API error"]
  options:
    - "Verify issue key and retry"
    - "Provide problem description manually"
    - "Cancel operation"
  halt: true
```

### Configuration: gh-pr-analyzer
```yaml
subagent:
  type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
  description: "Fetching GitHub PR summary"
  prompt_template: "Fetch and summarize GitHub PR {input}"

visual:
  pre_emoji: "🛠️"
  pre_message: "Detected GitHub PR: {input}"
  loading_emoji: "⏳"
  loading_message: "Fetching PR details via gh-pr-analyzer..."
  success_emoji: "✅"
  success_message: "PR details fetched successfully"

error_handling:
  error_patterns: ["❌", "failed", "not found", "authentication"]
  options:
    - "Verify PR reference and retry"
    - "Provide problem description manually"
    - "Cancel operation"
  halt: true
```

### Configuration: gh-issue-analyzer
[Similar to gh-pr-analyzer]

### Configuration: datadog-analyzer
[Similar pattern with conditional availability check]

### Configuration: spec-generator
```yaml
subagent:
  type: "schovi:spec-generator:spec-generator"
  description: "Generating implementation spec"
  prompt_template: "Generate implementation specification from analysis: {analysis}"

visual:
  pre_emoji: "⚙️"
  pre_message: "Generating implementation specification..."
  loading_emoji: "⏳"
  loading_message: "Spawning spec-generator subagent..."
  success_emoji: "✅"
  success_message: "Spec generated successfully"

error_handling:
  error_patterns: ["❌", "failed", "incomplete", "Generation failed"]
  options:
    - "Review input and retry"
    - "Simplify scope and retry"
    - "Cancel operation"
  halt: true
```
```

**Individual Changes**:

1. **Create file structure** (20 min):
   - Frontmatter
   - Purpose and overview
   - Usage pattern documentation

2. **Implement visual templates** (45 min):
   - Pre-invocation template
   - Success template
   - Error template
   - Variable substitution logic

3. **Implement error detection** (60 min):
   - Pattern matching
   - Priority ordering
   - Error message extraction
   - Default fallbacks

4. **Implement invocation logic** (60 min):
   - Pre-invocation display
   - Task tool execution
   - Response waiting
   - Post-invocation processing

5. **Implement error handling** (45 min):
   - Error template population
   - Options presentation
   - Halt logic
   - Retry support

6. **Implement metadata extraction** (30 min):
   - Token count parsing
   - Timing tracking
   - Response size calculation

7. **Create standard configurations** (45 min):
   - jira-analyzer config
   - gh-pr-analyzer config
   - gh-issue-analyzer config
   - spec-generator config

8. **Write documentation** (30 min):
   - Usage examples
   - Configuration guide
   - Error handling examples

**Testing**:
- Test Jira subagent invocation (success and error)
- Test GitHub PR subagent (success and error)
- Test error detection with various patterns
- Test metadata extraction
- Test halt behavior
- Verify visual consistency

**Success Criteria**:
- [ ] Consistent visual feedback
- [ ] Error detection works reliably
- [ ] Standard configurations documented
- [ ] Clear error messages with options
- [ ] Metadata extraction accurate
- [ ] Can be used by input-processing.md

**Deliverable**: `schovi/lib/subagent-invoker.md` (~70 lines)

---

### Task 1.6: Test Libraries with Review Command

**Effort**: 2-3 hours
**Dependencies**: Tasks 1.2, 1.3, 1.4, 1.5

**Purpose**:
Validate all libraries work correctly by refactoring the smallest command (review.md, 567 lines) as a proof of concept. This will:
- Test library integration in real command
- Identify any gaps in library design
- Measure actual complexity reduction
- Create template for other command refactors

**Implementation**:

1. **Back up original** (5 min):
   ```bash
   cp schovi/commands/review.md schovi/commands/review.md.backup
   ```

2. **Refactor Phase 1: Input Parsing** (30 min):

   **Before** (lines 11-40):
   ```markdown
   ## Command Arguments
   **Input Types**:
   - GitHub PR: URL, `owner/repo#123`, or `#123`
   - Jira ID: `EC-1234`, `IS-8046`, etc.
   - GitHub Issue: URL or `owner/repo#123`
   - File path: `./path/to/file.md` or absolute path
   - Free-form: Description text

   **Flags**:
   - `--quick`: Perform quick review
   ```

   **After**:
   ```markdown
   ## PHASE 1: INPUT PARSING & CLASSIFICATION

   Use lib/argument-parser.md with:
   - positional: [input]
   - flags: [--quick]
   - classification: [github-pr, jira, github-issue, file, text]
   ```

3. **Refactor Phase 2: Context Fetching** (45 min):

   **Before** (lines 42-68):
   ```markdown
   ### Phase 2: Context Fetching
   1. **GitHub PR**: Use Task tool with gh-pr-analyzer
   2. **Jira Issue**: Use Task tool with jira-analyzer
   3. **GitHub Issue**: Use Task tool with gh-issue-analyzer
   4. **File Path**: Use Read tool
   5. **Free-form**: Use provided text
   ```

   **After**:
   ```markdown
   ## PHASE 2: CONTEXT FETCHING

   Use lib/input-processing.md with:
   - input_type: [from argument-parser classification]
   - input_value: [parsed value]
   - mode: "full"  # Review needs full PR mode
   - command_context: "review"
   ```

4. **Test functionality** (60 min):
   - Test with GitHub PR: `/schovi:review #123`
   - Test with Jira: `/schovi:review EC-1234`
   - Test with file: `/schovi:review ./spec.md`
   - Test quick mode: `/schovi:review #123 --quick`
   - Verify output unchanged
   - Verify error handling works

5. **Measure improvements** (15 min):
   - Count lines before: 567
   - Count lines after: [expected ~350]
   - Calculate reduction: [expected ~38%]
   - Document any issues found

6. **Update documentation** (15 min):
   - Update review.md with library references
   - Add comments explaining library usage
   - Document any quirks or gotchas

**Success Criteria**:
- [ ] review.md refactored successfully
- [ ] All test cases pass
- [ ] Line count reduced by 30%+
- [ ] No functionality changes
- [ ] Error handling preserved
- [ ] Documentation updated

**Deliverable**: Refactored `schovi/commands/review.md` using libraries

---

### Task 1.7: Create Library Documentation

**Effort**: 2 hours
**Dependencies**: Tasks 1.2-1.6

**Purpose**:
Create comprehensive documentation for the library system to enable future development and maintenance.

**Individual Changes**:

1. **Create `schovi/lib/README.md`** (60 min):
   - Overview of library system
   - Purpose and benefits
   - List of all libraries with descriptions
   - Usage patterns and examples
   - Integration guide for commands
   - Migration guide from inline code

2. **Update `CLAUDE.md`** (45 min):
   - Add "Shared Libraries" section
   - Document library architecture
   - Add examples of library usage
   - Update "Extending the Plugin" section
   - Add library development guidelines

3. **Create migration guide** (15 min):
   - Step-by-step process for refactoring commands
   - Before/after examples
   - Common pitfalls
   - Testing checklist

**Deliverable**: Complete library documentation

---

## 📊 Success Metrics

### Quantitative Metrics

**Code Reduction**:
- [ ] 1,980 lines duplicated code → 450 lines in libraries (77% reduction)
- [ ] Average command length reduced by 40%+ (1,185 → ~710 lines)
- [ ] Review command reduced by 30%+ (567 → ~400 lines)

**Consistency**:
- [ ] 100% of commands use same argument parsing
- [ ] 100% of commands use same work folder logic
- [ ] 100% of commands use same input processing
- [ ] 100% of commands use same error handling

**Maintainability**:
- [ ] Bug fixes apply to all commands automatically
- [ ] New input types added once (not 4×)
- [ ] Metadata schema centralized

### Qualitative Metrics

**Developer Experience**:
- [ ] Libraries are well-documented
- [ ] Clear usage examples exist
- [ ] Migration guide is comprehensive
- [ ] New commands can reference libraries

**Quality**:
- [ ] All libraries tested with real command
- [ ] Error handling is consistent
- [ ] Visual formatting is standardized
- [ ] No functionality regressions

---

## 🔗 Dependencies

**External Dependencies**:
- None - pure markdown implementation

**Internal Dependencies**:
- Task 1.2 (argument-parser) → Used by 1.3, 1.4
- Task 1.5 (subagent-invoker) → Used by 1.3
- Tasks 1.2-1.5 → Required for 1.6 (testing)
- Task 1.6 → Validates all libraries work

---

## 🚨 Risks & Mitigations

**Risk 1**: Library abstraction too complex
- **Mitigation**: Start with review.md (simplest command) as proof of concept
- **Fallback**: Keep original files as .backup

**Risk 2**: Libraries don't cover all edge cases
- **Mitigation**: Comprehensive testing in Task 1.6
- **Fallback**: Allow commands to override library behavior

**Risk 3**: Token usage increases due to library references
- **Mitigation**: Libraries use Claude's reading context, not injected
- **Validation**: Measure token usage in testing

**Risk 4**: Breaking changes to command behavior
- **Mitigation**: Strict backward compatibility requirement
- **Testing**: Validate all test cases pass

---

## ✅ Definition of Done

Phase 1 is complete when:

- [ ] All 4 libraries created and documented
- [ ] review.md successfully refactored
- [ ] All test cases pass
- [ ] Line reduction targets met (77%+)
- [ ] Documentation complete
- [ ] No functionality regressions
- [ ] Ready for Phase 2 command refactoring

---

## 📚 References

- Current code duplication analysis: See improvement proposal
- Command line counts: See analysis spreadsheet
- Architecture documentation: CLAUDE.md sections
- Work folder metadata schema: analyze.md lines 848-886

---

## 🎯 Next Steps

After Phase 1 completion:
→ **Phase 2**: Refactor all commands using libraries (Week 2)
→ Validate token savings maintained
→ Measure development velocity improvements
