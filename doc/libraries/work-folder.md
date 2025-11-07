# `work-folder` Library

## Description

Work folder resolution and metadata management library. Provides consistent file output handling with automatic folder detection and metadata tracking.

## Purpose

Eliminate work folder duplication by providing:
- Automatic work folder detection (current directory default)
- File naming conventions (brainstorm-[id].md, research-[id].md, etc.)
- YAML frontmatter generation with metadata
- File write with validation
- Output display formatting

## Size

~483 lines (saves ~120 lines per command)

## Features

- **Folder Detection**: Uses current directory by default, respects --output flag
- **File Naming**: Consistent patterns (brainstorm-[id].md, research-[id]-option[N].md, spec-[id].md)
- **Metadata**: YAML frontmatter with type, id, timestamp, options, source
- **Output Modes**: Terminal, file, both, or quiet
- **Validation**: Checks for file overwrites, validates paths

## Usage Pattern

Commands reference this library in their final phase:

```markdown
## PHASE 4: OUTPUT HANDLING

Use lib/work-folder.md with configuration:
- Content type: brainstorm | research | spec
- Identifier: [jira-id or timestamp]
- Content: [generated content from previous phase]
- Flags: --output, --no-file, --quiet, --post-to-jira
- Metadata: {type, id, timestamp, source, options}
```

## File Naming Conventions

| Content Type | Pattern | Example |
|-------------|---------|---------|
| Brainstorm | `brainstorm-[id].md` | `brainstorm-EC-1234.md` |
| Research | `research-[id].md` | `research-EC-1234.md` |
| Research (option) | `research-[id]-option[N].md` | `research-EC-1234-option2.md` |
| Spec | `spec-[id].md` | `spec-EC-1234.md` |
| Debug Fix | `fix-[id].md` | `fix-EC-1234.md` |
| Timestamp fallback | `[type]-[timestamp].md` | `brainstorm-20250107-143022.md` |

## YAML Frontmatter

```yaml
---
type: brainstorm  # or research, spec, etc.
id: EC-1234
timestamp: 2025-01-07T14:30:22Z
source: jira  # or github-pr, github-issue, text, etc.
options: 3  # for brainstorm
selected_option: 2  # for research
---
```

## Output Modes

Based on flags:
- **Default**: Terminal + File
- **--no-file**: Terminal only
- **--quiet**: File only
- **--output PATH**: Terminal + Custom file path
- **--post-to-jira**: Terminal + File + Jira comment

## Dependencies

### Called By
- All commands that generate output files (brainstorm, research, plan, debug)

### Calls
- Write tool (for file creation)
- Read tool (for validation)
- Jira MCP tools (optional, for --post-to-jira)

## Code Reduction

Before library:
- Each command: ~120 lines of work folder logic
- 4 commands × 120 lines = **480 duplicate lines**

After library:
- Library: 483 lines (shared, includes extra features)
- Per command: Reference only (~5 lines)
- **Reduction: ~450 lines (94%)**

## Example Configuration

```markdown
Configuration:
  Content Type: research
  Identifier: EC-1234
  Selected Option: 2
  Content: [research markdown from Phase 3]
  Flags:
    --output: ./docs/research-EC-1234-option2.md
    --post-to-jira: true

Processing:
  1. Generate filename: research-EC-1234-option2.md
  2. Create YAML frontmatter with metadata
  3. Combine frontmatter + content
  4. Write to ./docs/research-EC-1234-option2.md
  5. Display terminal summary
  6. Post to Jira as comment (--post-to-jira)
```

## Quality Requirements

- Respect all output flags
- Generate valid YAML frontmatter
- Use consistent file naming
- Validate file paths before writing
- Handle file overwrite confirmations
- Format terminal output consistently

## Location

`schovi/lib/work-folder.md`
