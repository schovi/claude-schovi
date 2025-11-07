# `/schovi:commit` Command

## Description

Create structured git commits with validation, smart analysis, and conventional format. Automatically analyzes changes, validates branch safety, and generates descriptive multi-line commit messages.

## Purpose

Automate commit creation with:
- Conventional commit format (feat, fix, chore, etc.)
- Branch validation (blocks main/master)
- Smart git diff analysis for message generation
- Optional external context (Jira/GitHub) when needed

## Workflow

1. **Phase 1: Input Parsing** - Detect Jira ID, GitHub issue/PR, custom notes, or auto-detect changes
2. **Phase 2: Git State Validation** - Check branch (block main/master), validate branch naming, check for conflicts
3. **Phase 3: Staging & Analysis** - Auto-stage changes (or use staged-only), analyze diff to determine commit type
4. **Phase 4: Optional Context Fetching** - Fetch external context (Jira/GitHub) only if diff analysis unclear
5. **Phase 5: Message Generation** - Create conventional commit with title, description, bullet points, references
6. **Phase 6: Commit & Verification** - Execute commit with HEREDOC format, verify success

## Input Options

- Jira ID (EC-1234)
- GitHub issue/PR (URL or owner/repo#123)
- Custom notes (free-form text)
- Flags: `--message`, `--staged-only`, `--type`

## Key Features

- **Conventional Commits**: Auto-detect type (feat, fix, chore, refactor, docs, test, style, perf)
- **Branch Validation**: Blocks main/master commits, warns on branch/Jira mismatch
- **Smart Analysis**: Analyzes git diff to generate descriptive multi-line messages
- **Change Intelligence**: Determines commit type from file paths, diff content, and keywords
- **Optional Context**: Fetches Jira/GitHub context only when needed (defers to diff analysis)

## Commit Message Format

```
PREFIX: Title (50-72 chars)

Description paragraph explaining problem/solution/changes

- Bullet point of specific change
- Bullet point of specific change
- Bullet point of specific change

Related to: [Reference]

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Dependencies

### Calls
- `jira-analyzer` agent (optional, for Jira context)
- `gh-issue-analyzer` agent (optional, for GitHub issue context)
- `gh-pr-analyzer` agent (optional, for GitHub PR context)
- Git commands via Bash tool
- `argument-parser` library

### Called By
- User invocation
- `/schovi:implement` command (for phase-based commits)

## Usage Examples

```bash
# Commit with Jira context
/schovi:commit EC-1234

# Commit with custom notes
/schovi:commit "Add user authentication"

# Commit staged changes only
/schovi:commit --staged-only

# Commit with specific type
/schovi:commit --type feat

# Commit with custom message
/schovi:commit --message "fix: Resolve null pointer in authentication"
```

## Integration

Can be used standalone or called from implement flow for phase-based commits.

## Location

`schovi/commands/commit.md`
