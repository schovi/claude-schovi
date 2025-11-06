# Argument Parser Library

**Purpose**: Standardized argument parsing for all commands with validation and error handling.

## Overview

This library provides consistent argument parsing across all schovi commands, handling:
- Positional argument extraction and classification
- Flag parsing and validation
- Conflict detection between mutually exclusive flags
- Computed values derived from flags
- Standardized error messages

## Usage Pattern

Commands invoke this library by describing their argument structure:

```markdown
**Parse arguments using argument-parser library**:

Input: $ARGUMENTS

Configuration:
  positional_args:
    - name: "problem-input"
      required: false
      description: "Jira ID, GitHub URL, or description"
      patterns:
        - jira: "[A-Z]+-\d+"
        - github_pr: "github.com/.*/pull/\d+|owner/repo#\d+|#\d+"
        - github_issue: "github.com/.*/issues/\d+"
        - file: "^[./].*"
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
      conflicts: []

    - name: "--post-to-jira"
      type: "boolean"
      description: "Post to Jira as comment"
      conflicts: []

    - name: "--quick"
      type: "boolean"
      description: "Use quick mode"
      conflicts: []

    - name: "--work-dir"
      type: "path"
      description: "Specify work folder"
      conflicts: []
```

## Implementation

### Step 1: Extract Positional Arguments

Scan $ARGUMENTS for non-flag values (not starting with `--`):

```bash
positional_args=[]
for arg in $ARGUMENTS; do
  if [[ ! "$arg" =~ ^-- ]]; then
    positional_args+=("$arg")
  fi
done
```

### Step 2: Classify Positional Arguments

Match each positional argument against configured patterns:

**For problem-input pattern matching**:

1. **Jira ID** - Pattern: `[A-Z]{2,10}-\d{1,6}`
   - Examples: EC-1234, PROJ-567, IS-8046
   - Extract: `echo "$arg" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'`

2. **GitHub PR** - Patterns:
   - Full URL: `https://github.com/owner/repo/pull/123`
   - Short ref: `owner/repo#123`
   - Number only: `#123`
   - Detection: `contains "github.com/.*/pull/" OR matches "owner/repo#\d+" OR matches "^#\d+$"`

3. **GitHub Issue** - Patterns:
   - Full URL: `https://github.com/owner/repo/issues/123`
   - Short ref: `owner/repo#123` (when not a PR)
   - Detection: `contains "github.com/.*/issues/" OR matches "owner/repo#\d+"`

4. **File Path** - Pattern: `^[./].*|^/.*`
   - Starts with `.` or `/`
   - Examples: `./spec.md`, `/home/user/doc.md`, `../analysis.md`

5. **Text Description** - Pattern: `.*`
   - Fallback: anything that doesn't match above patterns
   - Example: "Add loading spinner to login page"

**Classification Output**:
```
{
  "value": "EC-1234",
  "type": "jira",
  "matched_pattern": "[A-Z]+-\d+"
}
```

### Step 3: Parse Flags

Extract flag values from $ARGUMENTS:

**Boolean flags** (--no-file, --quiet, --quick, --post-to-jira):
```bash
if echo "$ARGUMENTS" | grep -q "\--no-file"; then
  no_file_flag=true
else
  no_file_flag=false
fi
```

**Path flags** (--input PATH, --output PATH, --work-dir PATH):
```bash
# Extract --output value
output_path=$(echo "$ARGUMENTS" | grep -oP '\--output\s+\K\S+')

# Extract --input value
input_path=$(echo "$ARGUMENTS" | grep -oP '\--input\s+\K\S+')

# Extract --work-dir value
work_dir_path=$(echo "$ARGUMENTS" | grep -oP '\--work-dir\s+\K\S+')
```

### Step 4: Validate Flag Conflicts

Check for mutually exclusive flags:

**Conflict: --output vs --no-file**:
```
if output_path is set AND no_file_flag is true:
  ERROR: "Cannot use --output and --no-file together"
  HALT
```

**Conflict: --input vs positional argument**:
```
if input_path is set AND positional_args is not empty:
  WARNING: "--input overrides positional argument"
  Use --input value, ignore positional
```

**Conflict: --quiet vs --no-file (both true)**:
```
if quiet_flag is true AND no_file_flag is true:
  ERROR: "Cannot suppress both terminal and file output"
  HALT
```

### Step 5: Compute Derived Values

Calculate computed values based on flags:

```
terminal_output = NOT quiet_flag
file_output = NOT no_file_flag

# Determine output path
if output_path is set:
  final_output_path = output_path
elif file_output is true:
  # Use default naming (command-specific)
  if jira_id exists:
    final_output_path = "[command-name]-[JIRA-ID].md"
  else:
    final_output_path = "[command-name]-[timestamp].md"
else:
  final_output_path = null

# Determine work folder
work_folder = work_dir_path OR null (will auto-detect later)
```

### Step 6: Validate Required Arguments

Check if required arguments are missing:

```
if positional is required AND positional_args is empty AND input_path is null:
  ERROR: "Missing required argument: problem identifier or --input"
  Show usage example
  HALT
```

## Output Format

Return structured data for use by commands:

```json
{
  "positional": {
    "problem-input": {
      "value": "EC-1234",
      "type": "jira",
      "matched_pattern": "[A-Z]+-\d+"
    }
  },
  "flags": {
    "--input": null,
    "--output": "./custom-analysis.md",
    "--no-file": false,
    "--quiet": false,
    "--post-to-jira": true,
    "--quick": false,
    "--work-dir": null
  },
  "computed": {
    "terminal_output": true,
    "file_output": true,
    "output_path": "./custom-analysis.md",
    "work_folder": null
  },
  "validation": {
    "passed": true,
    "errors": [],
    "warnings": ["--output flag used, will save to custom location"]
  }
}
```

## Standard Error Messages

### Missing Required Argument
```
L **Error**: Missing required argument

Usage: /schovi:[command] [jira-id|pr-url|description] [flags]

Examples:
  /schovi:analyze EC-1234
  /schovi:analyze https://github.com/owner/repo/pull/123
  /schovi:analyze "Add loading spinner"
  /schovi:analyze --input ./problem.md

For help: /help schovi:[command]
```

### Conflicting Flags
```
L **Error**: Conflicting flags detected

Cannot use --output and --no-file together.
  --output: Save analysis to specific file
  --no-file: Skip file creation entirely

Please choose one approach.
```

### Invalid Flag Value
```
L **Error**: Invalid flag value

Flag --output requires a file path.
Received: --output (no value)

Usage: --output PATH
Example: --output ./analysis.md
```

### Unknown Flag
```
  **Warning**: Unknown flag ignored

Flag: --unknown-flag
This flag is not recognized and will be ignored.

Valid flags:
  --input PATH        Read from file
  --output PATH       Save to file
  --no-file           Skip file output
  --quiet             Suppress terminal output
  --post-to-jira      Post to Jira
  --quick             Quick mode
  --work-dir PATH     Specify work folder
```

## Examples

### Example 1: Analyze with Jira ID and output
```
Input: /schovi:analyze EC-1234 --output ./my-analysis.md

Parsed:
  positional: { value: "EC-1234", type: "jira" }
  flags: { --output: "./my-analysis.md" }
  computed: { terminal_output: true, file_output: true, output_path: "./my-analysis.md" }
```

### Example 2: Review with PR and quick mode
```
Input: /schovi:review #123 --quick

Parsed:
  positional: { value: "#123", type: "github_pr" }
  flags: { --quick: true }
  computed: { terminal_output: true, file_output: false }
```

### Example 3: Plan with input file
```
Input: /schovi:plan --input ./spec.md --post-to-jira

Parsed:
  positional: null
  flags: { --input: "./spec.md", --post-to-jira: true }
  computed: { terminal_output: true, file_output: true }
```

### Example 4: Debug with conflict (error)
```
Input: /schovi:debug EC-1234 --output ./debug.md --no-file

Error:
  L Cannot use --output and --no-file together
  Parsing halted
```

## Integration Notes

**For command developers**:

1. Copy the "Parse arguments using argument-parser library" block to your command
2. Customize the `positional_args` and `flags` configuration
3. Use the returned structured data throughout your command
4. Handle validation errors gracefully

**Benefits**:
-  Consistent flag behavior across all commands
-  Automatic conflict detection
-  Standard error messages
-  Type classification for inputs
-  Computed values reduce repetition

**Token efficiency**:
- Library is read-only (not injected into context)
- ~80 lines of documentation
- Replaces ~100 lines × 4 commands = 400 lines
