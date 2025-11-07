# `/schovi:implement` Command

## Description

Autonomous implementation execution with validation and phase-based commits. Reads specification files and executes implementation tasks with automatic validation, retry logic, and progress tracking.

## Purpose

Execute implementation autonomously with:
- Phase-based task execution from specs
- Automatic validation with retry attempts
- Auto-fixing of validation failures
- Progress tracking with complexity estimation
- Structured commits (simple or verbose/conventional)
- Confetti celebration on completion

## Workflow

1. **Phase 1: Spec Parsing** - Read and parse spec file (supports h1/h2 headers, flat task lists, shortened headers)
2. **Phase 2: Project Type Detection** - Detect project type for validation strategy
3. **Phase 3: Task Execution** - Execute each phase/task with:
   - Complexity estimation
   - Periodic progress updates (every 15-20s for long tasks)
   - Clear status messages
4. **Phase 4: Validation** - Run project-specific validation:
   - Max 2 retry attempts
   - Auto-fixing on failures
   - Clear error messages with resolution steps
5. **Phase 5: Commit** - Create phase-based commit:
   - Simple format (default)
   - Verbose conventional format (--verbose flag with feat/fix/chore detection)
6. **Phase 6: Completion** - Confetti celebration and summary

## Input Options

- Spec file path (./spec-EC-1234.md)
- Jira ID (auto-finds spec file)
- Auto-detect from conversation
- Flags: `--verbose`, `--input`, `--output`, `--resume` (v2.0 feature, coming soon)

## Key Features (v1.4.0+)

- **Verbose Commits**: `--verbose` flag for enhanced conventional commits with type detection (feat/fix/chore)
- **Robust Spec Parsing**: Supports h1/h2 headers, flat task lists, shortened headers
- **Validation Retry Logic**: Max 2 attempts with clear status updates
- **Progress Visibility**: Complexity estimation, periodic updates every 15-20s for long tasks
- **Improved Error Messages**: Detailed explanations and resolution steps
- **Confetti Celebration**: On successful completion
- **Auto-Fixing**: Attempts to fix validation failures automatically

## Dependencies

### Calls
- `/schovi:commit` command (for phase-based commits)
- Read tool (for spec file parsing)
- Bash tool (for validation commands)
- All standard code editing tools (Write, Edit, etc.)
- `argument-parser` library
- `input-processing` library
- `completion-handler` library

### Called By
- User invocation
- Part of workflow: brainstorm → research → plan → implement

## Usage Examples

```bash
# Implement from spec file
/schovi:implement ./spec-EC-1234.md

# Implement with verbose conventional commits
/schovi:implement EC-1234 --verbose

# Implement with custom input/output
/schovi:implement --input ./spec.md --output ./log.txt

# Auto-detect from conversation
/schovi:implement

# Resume from checkpoint (v2.0 feature, coming soon)
/schovi:implement --resume
```

## Output

- Phase-based git commits (one per phase or task group)
- Execution log (optional, with --output flag)
- Confetti celebration on success

## Validation Support

Auto-detects project type and runs appropriate validation:
- **Node.js**: `npm test`, `npm run lint`
- **Python**: `pytest`, `flake8`
- **Ruby**: `rspec`, `rubocop`
- **Java**: `mvn test`, `./gradlew test`
- **Go**: `go test ./...`
- **Rust**: `cargo test`

Max 2 retry attempts with auto-fixing.

## Commit Formats

### Simple (default)
```
Implement [task/phase description]

- Specific change
- Specific change

Related to: [Reference]

🤖 Generated with Claude Code
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

Part of the complete workflow: brainstorm → research → plan → implement.

## Location

`schovi/commands/implement.md`
