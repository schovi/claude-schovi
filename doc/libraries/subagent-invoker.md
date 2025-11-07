# `subagent-invoker` Library

## Description

Standardized subagent invocation library with error handling. Provides consistent pattern for spawning subagents via Task tool.

## Purpose

Eliminate subagent invocation duplication by providing:
- Standardized Task tool invocation pattern
- Fully qualified subagent names
- Error handling and retries
- Timeout management
- Result validation

## Size

~70 lines (saves ~40 lines per command)

## Features

- **Fully Qualified Names**: Always uses `plugin:skill:agent` format
- **Error Handling**: Graceful failures with clear messages
- **Retry Logic**: Optional retries on transient failures
- **Timeout Management**: Configurable timeouts
- **Result Validation**: Checks token budgets and format

## Usage Pattern

Commands reference this library when spawning custom subagents:

```markdown
Use lib/subagent-invoker.md with configuration:
- Subagent: brainstorm-generator
- Fully Qualified: schovi:brainstorm-generator
- Prompt: [context for subagent]
- Description: "Generating solution options"
- Expected Output: ~2000-3000 tokens
- Timeout: 300s
```

## Subagent Name Format

**Always use fully qualified format**:
```
schovi:skill:agent  # For skill-based subagents
schovi:agent        # For standalone subagents
```

Examples:
- ✅ `schovi:jira-auto-detector:jira-analyzer`
- ✅ `schovi:brainstorm-generator`
- ❌ `jira-analyzer` (incorrect, will fail)

## Task Tool Invocation

```
Task tool:
  subagent_type: "schovi:skill:agent"
  prompt: "[Detailed instructions for subagent]"
  description: "Brief description (3-5 words)"
  model: "haiku" (optional, for quick tasks)
```

## Dependencies

### Called By
- Commands that spawn subagents (brainstorm, research, debug, plan, review)

### Calls
- Task tool (Claude Code built-in)

## Code Reduction

Before library:
- Each command: ~40 lines of Task tool invocation logic
- 8 commands × 40 lines = **320 duplicate lines**

After library:
- Library: 70 lines (shared, includes error handling)
- Per command: Reference only (~5 lines)
- **Reduction: 250 lines (78%)**

## Example Configuration

```markdown
Configuration:
  Subagent: research-generator
  Fully Qualified: schovi:research-generator
  Prompt: |
    Generate deep technical analysis for:

    Problem: [problem description]
    Chosen Approach: [option 2 from brainstorm]
    Codebase Exploration: [exploration results]

    Follow template structure from templates/research/full.md
  Description: "Generating research analysis"
  Timeout: 180s
  Expected Token Range: 4000-6000

Processing:
  1. Validate subagent name format
  2. Construct fully qualified name
  3. Invoke Task tool
  4. Wait for completion (with timeout)
  5. Validate result (token count, format)
  6. Return to command
```

## Error Handling

- **Timeout**: Clear message if subagent exceeds timeout
- **Invalid Name**: Error if not fully qualified
- **Token Overflow**: Warning if exceeds expected range
- **Empty Result**: Error with retry option
- **Subagent Error**: Pass through error message from subagent

## Quality Requirements

- Always use fully qualified names
- Provide detailed prompts to subagents
- Set appropriate timeouts
- Validate results before returning
- Handle errors gracefully
- Never invoke subagents directly (always via Task tool)

## Location

`schovi/lib/subagent-invoker.md`
