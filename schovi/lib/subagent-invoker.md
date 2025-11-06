# Subagent Invoker Library

**Purpose**: Standardized subagent invocation with consistent error handling and visual feedback.

## Overview

This library provides consistent patterns for invoking subagents across all commands, ensuring:
- Uniform visual acknowledgments (before/after invocation)
- Standard error detection and handling
- Consistent retry/fallback options
- Metadata extraction (tokens, timing)

## Usage Pattern

Commands invoke subagents through this library:

```markdown
**Invoke subagent using subagent-invoker library**:

Configuration:
  subagent:
    type: "schovi:jira-analyzer:jira-analyzer"
    description: "Fetching Jira issue summary"
    prompt: "Fetch and summarize Jira issue EC-1234"

  context:
    command: "analyze"  # For context labels: [Analyze-Problem]
    operation: "fetch Jira issue EC-1234"

  visual:
    pre_emoji: "=à"
    pre_message: "Detected Jira issue: EC-1234"
    loading_emoji: "ó"
    loading_message: "Fetching issue details via jira-analyzer..."
    success_emoji: ""
    success_message: "Issue details fetched successfully"
    error_emoji: "L"

  error_handling:
    strategy: "halt-with-options"
    error_patterns: ["L", "failed", "not found", "API error"]
    options:
      - "Verify input and retry"
      - "Provide context manually"
      - "Cancel operation"
    halt: true

  output:
    return_format: "structured"  # or "raw"
    extract_metadata: true
```

## Implementation

### Step 1: Pre-Invocation Display

Show acknowledgment message before invoking subagent:

```
{pre_emoji} **[{command_context}]** {pre_message}
{loading_emoji} {loading_message}
```

**Example**:
```
=à **[Analyze-Problem]** Detected Jira issue: EC-1234
ó Fetching issue details via jira-analyzer...
```

### Step 2: Invoke Subagent via Task Tool

Execute subagent in isolated context:

```
Use Task tool:
  subagent_type: {fully qualified subagent type}
  description: {short description}
  prompt: {detailed prompt for subagent}
```

**Example**:
```
Task tool:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  description: "Fetching Jira issue summary"
  prompt: "Fetch and summarize Jira issue EC-1234"
```

### Step 3: Wait for Response

Subagent executes in isolated context and returns response when complete.

### Step 4: Detect Success or Error

**Check for error indicators** (in priority order):

1. **Primary**: L emoji present in response
2. **Secondary**: Error keywords in response:
   - "failed"
   - "not found"
   - "API error"
   - "authentication"
   - "cannot"
   - "unable to"
3. **Tertiary**: Missing success marker ()
4. **Quaternary**: Empty or very short response (<50 chars)

**Detection Logic**:
```
if response contains "L":
  error_detected = true
elif response contains any error_pattern:
  error_detected = true
elif response does NOT contain "":
  error_detected = true
elif length(response) < 50:
  error_detected = true
else:
  error_detected = false
```

### Step 5a: Handle Success

If no error detected:

**Display success message**:
```
{success_emoji} **[{command_context}]** {success_message}
```

**Example**:
```
 **[Analyze-Problem]** Issue details fetched successfully
```

**Extract metadata** (if `extract_metadata: true`):
```
Parse response for:
- Token count: Look for "~X tokens" or "| ~X tokens"
- Execution time: Track from invocation to completion
- Response length: Character/line count
```

**Return structured response**:
```json
{
  "success": true,
  "subagent_type": "jira-analyzer",
  "response": "[Full subagent response]",
  "metadata": {
    "tokens_used": 850,
    "execution_time_seconds": 3.2,
    "response_length": 1243
  },
  "error": null
}
```

### Step 5b: Handle Error

If error detected:

**Extract error message** from response:
```
Priority order:
1. Line immediately after L marker
2. Text after "Error:" prefix
3. First sentence containing error keyword
4. Default: "Unknown error occurred"
```

**Display error template**:
```
{error_emoji} **[{command_context}]** Failed to {operation}

Error: {extracted_error_message}

This usually means:
{error_explanation}

Options:
{numbered_options}

How would you like to proceed?
```

**Example**:
```
L **[Analyze-Problem]** Failed to fetch Jira issue EC-1234

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

**If `halt: true`**: HALT execution and wait for user choice

**Return error response**:
```json
{
  "success": false,
  "subagent_type": "jira-analyzer",
  "response": "[Error response]",
  "metadata": null,
  "error": {
    "message": "Issue not found or access denied",
    "type": "not_found",
    "user_action_required": true
  }
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
  pre_emoji: "=à"
  pre_message: "Detected Jira issue: {input}"
  loading_emoji: "ó"
  loading_message: "Fetching issue details via jira-analyzer..."
  success_emoji: ""
  success_message: "Issue details fetched successfully"

error_handling:
  error_patterns: ["L", "failed", "not found", "API error"]
  error_explanation: |
    - Issue key is incorrect or doesn't exist
    - You don't have access to this issue
    - Jira API is unavailable
    - MCP Jira server is not configured
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
  prompt_template: "Fetch and summarize GitHub PR {input} with mode: {mode}"

visual:
  pre_emoji: "=à"
  pre_message: "Detected GitHub PR: {input}"
  loading_emoji: "ó"
  loading_message: "Fetching PR details via gh-pr-analyzer (mode: {mode})..."
  success_emoji: ""
  success_message: "PR details fetched successfully"

error_handling:
  error_patterns: ["L", "failed", "not found", "authentication"]
  error_explanation: |
    - PR reference is incorrect or doesn't exist
    - Repository is private or you don't have access
    - GitHub CLI is not authenticated (run: gh auth login)
    - Network connectivity issues
  options:
    - "Verify PR reference and retry"
    - "Authenticate with GitHub (gh auth login)"
    - "Provide problem description manually"
    - "Cancel operation"
  halt: true
```

### Configuration: gh-issue-analyzer

```yaml
subagent:
  type: "schovi:gh-issue-analyzer:gh-issue-analyzer"
  description: "Fetching GitHub issue summary"
  prompt_template: "Fetch and summarize GitHub issue {input}"

visual:
  pre_emoji: "=à"
  pre_message: "Detected GitHub issue: {input}"
  loading_emoji: "ó"
  loading_message: "Fetching issue details via gh-issue-analyzer..."
  success_emoji: ""
  success_message: "Issue details fetched successfully"

error_handling:
  error_patterns: ["L", "failed", "not found", "authentication"]
  error_explanation: |
    - Issue reference is incorrect or doesn't exist
    - Repository is private or you don't have access
    - GitHub CLI is not authenticated (run: gh auth login)
  options:
    - "Verify issue reference and retry"
    - "Provide problem description manually"
    - "Cancel operation"
  halt: true
```

### Configuration: spec-generator

```yaml
subagent:
  type: "schovi:spec-generator:spec-generator"
  description: "Generating implementation spec"
  prompt_template: "Generate implementation specification from analysis: {analysis}"

visual:
  pre_emoji: "™"
  pre_message: "Generating implementation specification..."
  loading_emoji: "ó"
  loading_message: "Spawning spec-generator subagent..."
  success_emoji: ""
  success_message: "Spec generated successfully"

error_handling:
  error_patterns: ["L", "failed", "incomplete", "Generation failed"]
  error_explanation: |
    - Analysis input is incomplete or malformed
    - Spec generation failed due to complexity
    - Subagent encountered internal error
  options:
    - "Review input and retry"
    - "Simplify scope and retry"
    - "Cancel operation"
  halt: true
```

### Configuration: debug-fix-generator

```yaml
subagent:
  type: "schovi:debug-fix-generator:debug-fix-generator"
  description: "Generating fix proposal"
  prompt_template: "Generate fix proposal from debugging results: {debug_results}"

visual:
  pre_emoji: "='"
  pre_message: "Generating fix proposal..."
  loading_emoji: "ó"
  loading_message: "Spawning debug-fix-generator subagent..."
  success_emoji: ""
  success_message: "Fix proposal generated successfully"

error_handling:
  error_patterns: ["L", "failed", "incomplete"]
  error_explanation: |
    - Debugging results are incomplete
    - Root cause not clearly identified
    - Fix generation failed
  options:
    - "Review debugging and retry"
    - "Provide manual fix guidance"
    - "Cancel operation"
  halt: true
```

## Visual Templates

### Template 1: Pre-Invocation
```
{pre_emoji} **[{command_context}]** {pre_message}
{loading_emoji} {loading_message}
```

### Template 2: Success
```
{success_emoji} **[{command_context}]** {success_message}
```

### Template 3: Error
```
{error_emoji} **[{command_context}]** Failed to {operation}

Error: {error_message}

This usually means:
{error_explanation}

Options:
{numbered_options}

How would you like to proceed?
```

## Integration Notes

**For command developers**:

1. Use standard configurations when possible (copy from above)
2. Customize `context.command` for your command name
3. Set `error_handling.halt: true` for critical failures
4. Set `output.extract_metadata: true` to track token usage
5. Handle returned response in your command logic

**Benefits**:
-  Consistent user experience across all commands
-  Standard error messages and recovery options
-  Visual feedback shows progress clearly
-  Metadata tracking for monitoring token efficiency
-  Centralized error handling patterns

**Token efficiency**:
- Subagents execute in isolated contexts
- Main context only receives condensed responses
- Visual templates add minimal token overhead (~50 tokens)
