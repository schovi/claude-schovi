# `/schovi:publish` Command

## Description

Create or update GitHub pull requests with automatic description generation. Always creates draft PRs targeting main branch.

## Purpose

Automate PR creation/updates with:
- Auto-push with upstream tracking
- Smart description generation from various input sources
- Branch validation and safety checks
- Always draft for safer workflow
- Update support for existing PRs

## Workflow

1. **Phase 1: Input Detection & Validation** - Detect input type, validate git state, check for existing PR
2. **Phase 2: Git Operations** - Push branch with upstream tracking
3. **Phase 3: Description Generation** - Fetch/read content, generate description
4. **Phase 4: PR Creation/Update** - Create draft PR or update existing PR

## Input Options

Single positional argument (or none). Detection order:

1. **Jira pattern**: `EC-1234`, `PROJ-567` (matches `[A-Z]{2,10}-\d{1,6}`)
2. **File path**: `./spec.md`, `./docs/plan.md`
3. **Folder path**: `./docs/` (finds main doc inside)
4. **URL**: `https://...`
5. **Plain text**: Any other string used as context
6. **None**: Uses commit history

## Key Features

- **Always Draft**: All PRs created as drafts
- **Always Main**: Base branch is always `main`
- **Always Push**: Branch is always pushed before PR creation
- **Update Support**: Automatically detects and updates existing PRs
- **Smart Description**: Auto-generates from input source
- **Final State Language**: Describes what code does now, not how it evolved

## Description Source by Input Type

**Jira ID** (via jira-analyzer subagent):
- Fetches issue summary and context
- Extracts problem statement and acceptance criteria

**File/Folder**:
- Reads spec or plan file content
- Extracts problem/solution/changes sections

**URL**:
- Fetches and extracts relevant content

**Text**:
- Uses provided text as context

**None** (commit history):
- Analyzes commits since divergence from main
- Generates description from commit messages and diff stats

## PR Format

```bash
# Create (always draft)
gh pr create --draft --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"

# Update existing
gh pr edit <number> --body "$(cat <<'EOF' ... EOF)"
```

## Description Template

```markdown
## [Bug | New Feature | Enhancement | Chore]

[2-3 sentences: What problem this solves and why it matters]

## Solution

[Single paragraph: How the code now works]

## Changes

**[Area 1]**:
- Change description

**[Area 2]**:
- Change description

## Notes (only if applicable)

### Breaking Changes
[If any]

### Migration
[If needed]
```

## Dependencies

### Calls
- `jira-analyzer` agent (for Jira input)
- GitHub CLI (`gh`) via Bash tool
- Git commands via Bash tool

### Called By
- User invocation (standalone manual command)

## Usage Examples

```bash
# Use commit history (no input)
/schovi:publish

# With Jira context
/schovi:publish EC-1234

# With spec file
/schovi:publish ./spec-EC-1234.md

# With folder (finds main doc)
/schovi:publish ./docs/

# With URL
/schovi:publish https://example.com/spec

# Update existing PR (run again on same branch)
/schovi:publish
```

## Post-Creation

After creating a draft PR:

```bash
# Add reviewers
gh pr edit 123 --add-reviewer @username

# Mark ready for review
gh pr ready 123

# Watch CI checks
gh pr checks 123 --watch
```

## Location

`schovi/commands/publish.md`
