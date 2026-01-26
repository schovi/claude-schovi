# Worktree Library

Manage git worktrees in `~/worktrees/` for isolated branch work.

## Quick Reference

| Operation | Command/Prompt |
|-----------|----------------|
| Create | `/schovi:worktree create <branch> --purpose "..."` |
| Update | `/schovi:worktree update [branch]` |
| Remove | `/schovi:worktree teardown [branch]` |
| List | `/schovi:worktree list` |

## Directory Structure

```
~/worktrees/
└── ORG/REPO/           # or PROJECT_NAME for local repos
    ├── .bare/          # bare clone (shared by all worktrees)
    ├── .meta.json      # metadata with purpose tracking
    └── BRANCH-NAME/    # worktree directories (slashes → dashes)
```

Example: `~/worktrees/productboard/core-api/feature-auth`

## Integration Usage

### From Commands (review, debug, etc.)

When a command needs isolated code access:

```markdown
## Create worktree for PR review

1. Get PR branch name from context
2. Create worktree:
   - Project path: derive from current repo's remote
   - Branch: PR head branch
   - Purpose: "review: PR #123"
3. Work in worktree path
4. Teardown when done
```

### From Prompts

```
Create a worktree for branch feature/auth with purpose "review: PR #456"
→ Follow lib/worktree.md operations

Update the worktree for current branch
→ Follow lib/worktree.md update operation

Remove all worktrees for this project
→ Follow lib/worktree.md teardown --all
```

## Operations

### Create Worktree

**Inputs**: branch name, purpose (optional)

**Steps**:
1. Detect project from current repo's remote URL → `org/repo`
2. Find existing clone in `~/work` or `~/productboard` for `--reference`
3. Sanitize branch: `feature/auth` → `feature-auth`
4. If `.bare` doesn't exist, clone it
5. Create worktree: `git worktree add`
6. Update `.meta.json`

**Output**: Path to worktree

### Update Worktree

**Inputs**: branch name (optional, auto-detect if in worktree)

**Steps**:
1. Resolve worktree path
2. `git fetch origin && git reset --hard origin/BRANCH`

**Output**: Current commit hash

### Teardown Worktree

**Inputs**: branch name (optional), `--all` flag

**Steps**:
1. `git worktree remove --force`
2. Update `.meta.json`

### List Worktrees

**Steps**:
1. Read `~/worktrees/PROJECT/.meta.json`
2. Display branch, path, purpose, created date

## Metadata Format

```json
{
  "origin": "github",
  "github_repo": "org/repo",
  "source_repo": "/Users/me/work/repo",
  "worktrees": {
    "feature/auth": {
      "created": "2024-01-15T10:30:00Z",
      "purpose": "review: PR #123"
    }
  }
}
```

**Purpose conventions**:
- `review: PR #123`
- `debug: EC-4567`
- `implement: feature X`
- `manual: testing`

## Key Commands

```bash
# Check if in worktree
git rev-parse --git-common-dir  # ends with .bare = worktree

# Get current branch
git branch --show-current

# Sanitize branch for path
echo "$branch" | tr '/' '-'

# Clone bare with reference (saves disk)
git clone --bare --reference SOURCE REMOTE ~/worktrees/PROJECT/.bare

# Create worktree
git worktree add ../BRANCH origin/BRANCH --checkout

# Remove worktree
git worktree remove --force ../BRANCH

# List worktrees
git worktree list
```
