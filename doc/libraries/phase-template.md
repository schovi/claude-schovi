# `phase-template` Library

## Description

Standard command phase structure template. Provides consistent phase organization pattern for all commands.

## Purpose

Standardize command structure by providing:
- Consistent phase numbering and naming
- Standard phase types (Input, Processing, Generation, Output)
- Quality gates per phase
- Progress tracking pattern
- Error handling structure

## Size

~300 lines (includes examples and guidelines)

## Standard Phase Structure

```
PHASE 1: INPUT PARSING & VALIDATION
- Parse arguments
- Validate inputs
- Set configuration

PHASE 2: CONTEXT FETCHING (optional)
- Fetch external data via subagents
- Load files
- Gather context

PHASE 3: CORE PROCESSING
- Execute main logic
- Perform analysis/generation
- Use specialized subagents

PHASE 4: OUTPUT HANDLING
- Format results
- Write files
- Display to user
```

## Features

- **Consistent Naming**: All commands follow same phase patterns
- **Quality Gates**: Each phase has validation before proceeding
- **Progress Tracking**: Standard messages for user visibility
- **Error Handling**: Consistent error patterns
- **Modular Design**: Phases can reference libraries

## Usage Pattern

Commands reference this template when structuring workflow:

```markdown
Use lib/phase-template.md as structure guide:
- Phase 1: Use argument-parser library
- Phase 2: Use input-processing library
- Phase 3: Custom command logic
- Phase 4: Use work-folder library
```

## Common Phase Patterns

### Input Processing Commands (brainstorm, research, debug)
1. Input Parsing & Validation
2. Context Fetching
3. Codebase Exploration
4. Generation (via subagent)
5. Output Handling

### Transform Commands (plan)
1. Input Validation
2. Extract Content
3. Optional Enrichment
4. Generation (via subagent)
5. Output Handling

### Execution Commands (implement)
1. Spec Parsing
2. Project Type Detection
3. Task Execution
4. Validation
5. Commit

### Git Commands (commit, publish)
1. Input Parsing
2. Git State Validation
3. Content Analysis
4. Generation
5. Git Operation
6. Verification

## Dependencies

### Called By
- All commands (as structural guide)

### Calls
- None (template only, not executable code)

## Benefits

- **Consistency**: All commands follow same structure
- **Predictability**: Users know what to expect at each phase
- **Maintainability**: Easy to update all commands by updating template
- **Quality**: Standard quality gates prevent incomplete execution
- **Debugging**: Clear phase boundaries make issues easier to locate

## Example Usage

```markdown
# Command: /schovi:brainstorm

## PHASE 1: INPUT PARSING & VALIDATION
[Following phase-template pattern]

Use lib/argument-parser.md with configuration:
- Flags: --input, --output, --quick
- Required: input
- Types: jira-id, github-pr, github-issue, file, text

Quality Gate:
- ✅ Input classified correctly
- ✅ Flags validated
- ✅ Configuration set

## PHASE 2: CONTEXT FETCHING
[Following phase-template pattern]

Use lib/input-processing.md with configuration:
- Input type: [from Phase 1]
- Mode: compact
- Output: contextSummary

Quality Gate:
- ✅ Context fetched successfully
- ✅ Token budget respected (<1200 tokens)

## PHASE 3: CODEBASE EXPLORATION
[Custom command logic]

Use Task tool with Plan subagent (medium thoroughness)

Quality Gate:
- ✅ Exploration completed (2-4 minutes)
- ✅ Key components identified
- ✅ Dependencies mapped

## PHASE 4: SOLUTION GENERATION
[Custom command logic]

Use lib/subagent-invoker.md to spawn brainstorm-generator

Quality Gate:
- ✅ 2-3 options generated
- ✅ Each has pros/cons, effort, risk
- ✅ One recommended with reasoning

## PHASE 5: OUTPUT HANDLING
[Following phase-template pattern]

Use lib/work-folder.md with configuration:
- Type: brainstorm
- Identifier: [from Phase 1]
- Content: [from Phase 4]

Quality Gate:
- ✅ File saved (brainstorm-[id].md)
- ✅ Terminal output displayed
- ✅ Next steps guidance provided
```

## Quality Requirements

- Each phase must have clear entry conditions
- Each phase must have quality gates
- Phases must be sequential (no skipping)
- Phase failures must be handled gracefully
- Progress must be communicated to user

## Location

`schovi/lib/phase-template.md`
