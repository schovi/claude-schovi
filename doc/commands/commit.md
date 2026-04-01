# `/schovi:commit` Command

## Description

Create structured git commits with automatic analysis and smart auto-amend. Auto-stages all changes, analyzes diffs to determine commit type, and generates descriptive commit messages.

## Usage

```bash
/schovi:commit              # Auto-analyze diff
/schovi:commit EC-1234      # Analyze diff + Jira context
/schovi:commit #123         # Analyze diff + GitHub context
/schovi:commit "some notes" # Analyze diff + use notes as context
```

## Behavior

- Always auto-stages all changes (`git add .`)
- Auto-detects commit type from diff analysis
- Smart auto-amend for unpushed commits touching same files
- Auto-detects Jira ID from branch name if not provided
- Blocks commits on main/master

## Input Detection

Parsed in this order:

1. **Jira pattern**: `[A-Z]{2,10}-\d{1,6}` (EC-1234, PROJ-567)
2. **GitHub reference**: `#\d+`, `owner/repo#\d+`, or GitHub URL
3. **Plain text**: Everything else (used as context notes)
4. **None**: Pure diff analysis

## Commit Type Detection

Determined from diff analysis (priority order):

| Type | Triggers |
|------|----------|
| test | Files only in test directories or `*.test.*`, `*.spec.*` |
| docs | Only markdown/documentation files |
| chore | Only package.json, lockfiles, configs |
| fix | Bug keywords, error handling changes |
| feat | New files, new functions, "add"/"implement" keywords |
| refactor | Code restructuring, no behavior change |
| perf | Performance keywords (optimize, cache) |
| style | Only whitespace/formatting |

Default: `chore` if uncertain

## Auto-Amend Logic

**Amend if both conditions are true**:
1. Last commit is NOT pushed to remote
2. Current changes touch same files as last commit

**New commit if**:
- All commits are pushed, OR
- Changes touch different files

This reduces commit noise for iterative work while preventing accidental combination of unrelated changes.

## Commit Message Format

```
<type>: <title>

<Description paragraph>

- <Bullet point 1>
- <Bullet point 2>
- <Bullet point 3>

Related to: <Reference>
```

## Workflow

1. **Input Detection & Validation** - Parse input, auto-detect Jira from branch, validate git state
2. **Staging & Analysis** - Run `git add .`, analyze diff, determine type
3. **Message Generation** - Fetch external context if provided, generate message
4. **Commit Execution** - Decide amend vs new, execute, verify

## Dependencies

### Calls
- `jira-analyzer` agent (for Jira context)
- `gh-pr-reviewer` agent (for GitHub context)

### Called By
- User invocation

## Location

`schovi/commands/commit.md`
