# `/schovi:implement` Command

## Description

Autonomous implementation execution with validation, pause/resume, and work folder integration. Reads specification files and executes implementation tasks with automatic validation, retry logic, and progress tracking.

## Purpose

Execute implementation autonomously with:
- Phase-based task execution from specs
- Work folder integration (.WIP structure, metadata, progress tracking)
- Pause/resume capability at phase boundaries
- Automatic validation with retry attempts (2 max)
- Auto-fixing of validation failures
- Progress tracking with complexity estimation
- Structured commits (simple or verbose/conventional)
- Confetti celebration on completion

## Workflow

1. **Phase 1: Input Resolution** - Resolve spec from work folder, file, Jira, or conversation
2. **Phase 2: Spec Parsing** - Parse spec structure (phased or flat tasks)
3. **Phase 3: Task Execution** - Execute each phase with:
   - Progress tracking (04-progress.md)
   - Metadata synchronization
   - Git checkpoints after each phase
4. **Phase 4: Validation** - Run project-specific validation:
   - Max 2 retry attempts
   - Auto-fixing on failures
   - Clear error messages with resolution steps
5. **Phase 5: Completion** - Summary, Jira posting (optional), confetti

## Input Options

- Spec file path (`./spec-EC-1234.md`)
- Jira ID (`EC-1234`)
- Work folder with 03-plan.md (auto-detected)
- Auto-detect from conversation

## Flags

**Input:**
- `--input PATH` - Explicit spec file path
- `--work-dir PATH` - Use specific work folder

**Resume/Phase Control:**
- `--resume` - Continue from last checkpoint
- `--phase N` - Start from specific phase number

**Output:**
- `--output PATH` - Save execution log to specific file
- `--no-file` - Skip log file creation
- `--quiet` - Suppress verbose terminal output

**Integration:**
- `--post-to-jira` - Post execution summary to Jira issue

**Autonomy Control:**
- `--interactive` - Ask for confirmation after each phase
- `--no-commit` - Skip automatic commits
- `--skip-validation` - Skip linting and tests

**Commit Format:**
- `--verbose` - Use conventional commit format with type detection

## Key Features

- **Work Folder Integration**: Seamless .WIP structure, metadata sync, progress tracking
- **Pause/Resume**: Checkpoint at any phase boundary with `--resume`
- **Multi-source Input**: Work folder → Files → Jira → Conversation priority
- **Validation Retry Logic**: Max 2 attempts with auto-fix
- **Progress Visibility**: Complexity estimation, periodic updates
- **Flexible Commits**: Simplified (default) or conventional (--verbose)
- **Robust Error Handling**: 11+ error scenarios with recovery strategies
- **Multi-language**: Node.js, Python, Go, Ruby, Rust support

## Dependencies

### Uses
- `argument-parser` library
- `input-processing` library
- `work-folder` library
- Read, Write, Edit, Glob, Grep tools
- Bash tool (for validation commands)
- mcp__jira__ tools (for Jira integration)

### Called By
- User invocation
- Part of workflow: brainstorm → research → plan → implement

## Usage Examples

```bash
# Implement from work folder (auto-detect)
/schovi:implement

# Implement from spec file
/schovi:implement ./spec-EC-1234.md

# Implement with verbose conventional commits
/schovi:implement EC-1234 --verbose

# Resume from checkpoint
/schovi:implement --resume

# Start from specific phase
/schovi:implement --phase 3

# Interactive mode (ask after each phase)
/schovi:implement --interactive

# Skip validation for quick prototyping
/schovi:implement --skip-validation

# Full featured
/schovi:implement --interactive --verbose --output ./log.txt --post-to-jira
```

## Output

- Phase-based git commits (one per phase)
- Progress file (04-progress.md in work folder)
- Execution log (optional, with --output flag)
- Jira comment (optional, with --post-to-jira flag)
- Confetti celebration on success

## Validation Support

Auto-detects project type and runs appropriate validation:
- **Node.js**: `npm test`, `npm run lint`, `tsc --noEmit`
- **Python**: `pytest`, `ruff check`, `mypy`
- **Ruby**: `rspec`, `rubocop`
- **Go**: `go test ./...`, `golangci-lint run`
- **Rust**: `cargo test`, `cargo clippy`

Max 2 retry attempts with auto-fixing.

## Commit Formats

### Simple (default)
```
Phase N: [Phase Name]

- Task description
- Task description

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Verbose (--verbose flag)
```
feat: Add user authentication

Implement OAuth 2.0 authentication flow with JWT tokens

- Add authentication middleware
- Create token validation service
- Update user model with auth fields

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Integration

Part of the complete workflow: brainstorm → research → plan → implement → publish

## Location

`schovi/commands/implement.md`
