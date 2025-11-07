# `argument-parser` Library

## Description

Standardized argument parsing library for commands. Provides consistent argument handling with validation across all commands.

## Purpose

Eliminate argument parsing duplication by providing:
- Standardized flag parsing (--input, --output, --type, etc.)
- Input format detection (Jira ID, GitHub URL, file path, text)
- Validation and error messages
- Help text generation

## Size

~80 lines (saves ~70 lines per command)

## Features

- **Flag Parsing**: `--input`, `--output`, `--no-file`, `--quiet`, `--post-to-jira`, command-specific flags
- **Input Detection**: Auto-classifies Jira IDs, GitHub URLs, file paths, free-form text
- **Validation**: Ensures required args present, flags have valid values
- **Error Messages**: Clear, actionable error messages
- **Help Text**: Auto-generates help from configuration

## Usage Pattern

Commands reference this library in their phase 1:

```markdown
## PHASE 1: ARGUMENT PARSING

Use lib/argument-parser.md with configuration:
- Supported flags: --input, --output, --quick, --from-scratch
- Required: [input] (Jira ID, file, or description)
- Optional: --quick (boolean), --from-scratch (string)
- Help text: [command description]
```

## Dependencies

### Called By
- All commands (brainstorm, research, debug, plan, implement, commit, publish, review)

### Calls
- None (pure parsing logic)

## Code Reduction

Before library:
- Each command: ~70 lines of argument parsing
- 8 commands × 70 lines = **560 duplicate lines**

After library:
- Library: 80 lines (shared)
- Per command: Reference only (~5 lines)
- **Reduction: 480 lines (85%)**

## Example Configuration

```markdown
Configuration:
  Flags:
    - --input PATH: Input file path or identifier
    - --output PATH: Output file path
    - --quick: Generate quick analysis
    - --from-scratch TEXT: Create from description
  Required:
    - input (Jira ID, GitHub URL, file, or text)
  Input Types:
    - Jira ID: EC-1234, IS-8046
    - GitHub: URLs, owner/repo#123, #123
    - File: ./path/to/file.md
    - Text: Free-form description
```

## Quality Requirements

- Accurately classify input types
- Validate required arguments
- Provide clear error messages for invalid flags
- Support all common flag patterns
- Generate help text from configuration

## Location

`schovi/lib/argument-parser.md`
