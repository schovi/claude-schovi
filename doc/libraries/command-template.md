# `COMMAND-TEMPLATE` Library

## Description

Complete command template and development guide for rapid new command creation. Provides boilerplate structure, best practices, and examples for creating new commands.

## Purpose

Accelerate command development by providing:
- Complete command markdown template
- Frontmatter configuration guide
- Phase structure boilerplate
- Library integration examples
- Quality gates checklist
- Common patterns and anti-patterns

## Size

~200 lines (comprehensive template with documentation)

## Template Structure

```markdown
---
description: Brief command description (1-2 sentences)
argument-hint: [optional-args]
model: sonnet | haiku | opus
allowed-tools: ["Read", "Write", "Task", "Bash", "Grep", "Glob", ...]
---

# Command: /schovi:[name]

## OVERVIEW
[Purpose and what this command does]

## PHASE 1: INPUT PARSING & VALIDATION
Use lib/argument-parser.md with configuration:
[...]

## PHASE 2: CONTEXT FETCHING (if needed)
Use lib/input-processing.md with configuration:
[...]

## PHASE 3: CORE PROCESSING
[Custom command logic]

## PHASE 4: OUTPUT HANDLING
Use lib/work-folder.md with configuration:
[...]

## QUALITY GATES
- [ ] All required inputs validated
- [ ] Processing completed successfully
- [ ] Output formatted correctly
- [ ] User guidance provided
```

## Features

- **Complete Boilerplate**: Ready-to-use command structure
- **Library Integration**: Pre-configured library references
- **Frontmatter Guide**: All configuration options explained
- **Best Practices**: Dos and don'ts for command development
- **Example Configurations**: Real examples from existing commands
- **Quality Checklist**: Standard quality gates

## Development Workflow

### 1. Copy Template
```bash
cp schovi/lib/COMMAND-TEMPLATE.md schovi/commands/new-command.md
```

### 2. Configure Frontmatter
```yaml
---
description: What your command does
argument-hint: [optional-args]
model: sonnet  # or haiku for quick tasks
allowed-tools: ["Read", "Task", "Bash"]  # minimal set
---
```

### 3. Customize Phases
- Phase 1: Use argument-parser library
- Phase 2: Use input-processing library (if external data needed)
- Phase 3: Implement custom logic
- Phase 4: Use work-folder library (if output file needed)

### 4. Add Quality Gates
- Define success criteria for each phase
- Add validation checks
- Specify error handling

### 5. Test Command
```bash
/schovi:new-command test-input
```

## Library Integration Patterns

### Pattern 1: Simple Command (no external data)
```markdown
PHASE 1: Use argument-parser
PHASE 2: Custom processing
PHASE 3: Display results (terminal only)
```

### Pattern 2: Analysis Command (with external data)
```markdown
PHASE 1: Use argument-parser
PHASE 2: Use input-processing
PHASE 3: Use Task tool for exploration
PHASE 4: Use subagent-invoker for generation
PHASE 5: Use work-folder for output
```

### Pattern 3: Transform Command
```markdown
PHASE 1: Use argument-parser
PHASE 2: Read/extract input
PHASE 3: Use subagent-invoker for transformation
PHASE 4: Use work-folder for output
```

### Pattern 4: Execution Command
```markdown
PHASE 1: Use argument-parser
PHASE 2: Parse spec/input
PHASE 3: Execute tasks
PHASE 4: Validate
PHASE 5: Commit (via /schovi:commit)
```

## Dependencies

### Called By
- Developers creating new commands

### Calls
- None (template only)

## Benefits

- **80% Faster Development**: Pre-configured structure saves hours
- **Consistency**: All commands follow same patterns
- **Quality**: Built-in quality gates prevent issues
- **Best Practices**: Includes learned patterns from existing commands
- **Library Integration**: Shows how to use all shared libraries

## Example: Creating a New "Summarize" Command

```markdown
---
description: Generate code summaries from file or directory
argument-hint: [path] [--format brief|detailed]
model: sonnet
allowed-tools: ["Read", "Grep", "Glob", "Task"]
---

# Command: /schovi:summarize

## OVERVIEW
Generate intelligent code summaries for files, directories, or entire modules.

## PHASE 1: INPUT PARSING
Use lib/argument-parser.md with configuration:
- Flags: --format (brief|detailed), --output
- Required: path (file or directory)
- Types: file path, directory path

## PHASE 2: CODE READING
- If file: Read file directly
- If directory: Use Glob to list files, prioritize by importance

## PHASE 3: SUMMARY GENERATION
Use lib/subagent-invoker.md to spawn summary-generator subagent:
- Input: Code content + structure
- Output: Markdown summary

## PHASE 4: OUTPUT
Display in terminal (or use work-folder for --output flag)

## QUALITY GATES
- [ ] Path exists and is readable
- [ ] All requested files processed
- [ ] Summary is coherent and accurate
- [ ] Output formatted correctly
```

## Location

`schovi/lib/COMMAND-TEMPLATE.md`
