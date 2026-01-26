---
description: Manage git worktrees in ~/worktrees/ for isolated work
argument-hint: create|update|teardown|list [branch] [--purpose "..."] [--all]
allowed-tools: ["Bash", "Read", "Write", "Glob"]
---

# Worktree Command

Manage git worktrees using the directory structure: `~/worktrees/ORG/REPO/BRANCH/`

## Command Arguments

**Subcommands**:
- `create <branch>`: Create a new worktree for the specified branch
- `update [branch]`: Sync worktree with latest remote changes
- `teardown [branch]`: Remove a worktree
- `list`: List all worktrees for current project

**Flags**:
- `--purpose "..."`: Description of why this worktree exists (create only)
- `--all`: Remove all worktrees for current project (teardown only)

## Execution Workflow

### Phase 1: Argument Parsing

**Parse subcommand and arguments**:

1. Extract first positional argument as subcommand: `create | update | teardown | list`
2. Extract second positional argument as branch (if applicable)
3. Extract `--purpose` value if present
4. Check for `--all` flag

**Validation**:
- `create` requires a branch argument
- `--all` is only valid with `teardown`
- `--purpose` is only valid with `create`

**Error on invalid input**:
```
❌ Invalid usage

Usage:
  /schovi:worktree create <branch> [--purpose "..."]
  /schovi:worktree update [branch]
  /schovi:worktree teardown [branch] [--all]
  /schovi:worktree list

Examples:
  /schovi:worktree create feature/auth --purpose "review: PR #123"
  /schovi:worktree update
  /schovi:worktree teardown feature/auth
  /schovi:worktree list
```

### Phase 2: Project Detection

**Follow lib/worktree.md Section 1: Detect Project Origin**

1. Verify current directory is a git repository:
```bash
git rev-parse --git-dir 2>/dev/null
```

2. Get remote URL:
```bash
git remote get-url origin 2>/dev/null
```

3. Parse remote URL to extract project identifier:
   - `git@github.com:org/repo.git` → `org/repo`
   - `https://github.com/org/repo.git` → `org/repo`
   - No remote or non-GitHub → use directory name

4. Store values:
   - `origin`: "github" or "local"
   - `github_repo`: "org/repo" (if GitHub)
   - `project_path`: "ORG/REPO" or "PROJECT_NAME"

**Error if not in git repo**:
```
❌ Not a git repository

Run this command from inside a git repository.
```

### Phase 3: Execute Subcommand

---

#### Subcommand: create

**Follow lib/worktree.md Sections 2-4**

**Step 1: Find source repository (Section 2)**

Search for existing clone to use as reference:
```bash
for dir in ~/work/*/ ~/productboard/*/; do
  if [ -d "$dir/.git" ]; then
    remote=$(git -C "$dir" remote get-url origin 2>/dev/null)
    if [ "$remote" = "TARGET_REMOTE" ]; then
      echo "$dir"
      break
    fi
  fi
done
```

**Step 2: Resolve worktree path (Section 3)**

Sanitize branch name and compute path:
```bash
sanitized=$(echo "BRANCH" | tr '/' '-')
worktree_path=~/worktrees/$project_path/$sanitized
```

**Step 3: Check if worktree already exists**

```bash
if [ -d "$worktree_path" ]; then
  # Error: already exists
fi
```

**Step 4: Initialize worktree (Section 4)**

1. Ensure project directory exists:
```bash
mkdir -p ~/worktrees/$project_path
```

2. Initialize bare repo if `.bare` doesn't exist:

With source repo (preferred):
```bash
git clone --bare --reference $source_repo $remote_url ~/worktrees/$project_path/.bare
```

Without source repo:
```bash
git clone --bare $remote_url ~/worktrees/$project_path/.bare
```

3. Create the worktree:
```bash
cd ~/worktrees/$project_path/.bare
git fetch origin
git worktree add ../$sanitized origin/$branch --checkout
```

4. Update metadata file (`.meta.json`):

Read existing or create new metadata, add worktree entry with:
- `created`: ISO timestamp
- `purpose`: From `--purpose` flag or default "manual"

**Output on success**:
```
✅ Worktree created

Path: ~/worktrees/org/repo/feature-branch
Branch: feature/branch
Purpose: review: PR #123

To start working:
  cd ~/worktrees/org/repo/feature-branch
```

**Errors**:
- Branch doesn't exist on remote: `❌ Branch 'X' not found on remote`
- Worktree already exists: `❌ Worktree already exists at PATH`

---

#### Subcommand: update

**Follow lib/worktree.md Section 5**

**Step 1: Determine target worktree**

If branch specified:
- Sanitize and resolve path: `~/worktrees/$project_path/$sanitized`

If no branch specified:
- Check if current directory is inside a worktree
- Use current worktree's branch

```bash
# Check if in worktree
git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
if [[ "$git_common_dir" == *".bare"* ]]; then
  # We're in a worktree
  branch=$(git branch --show-current)
fi
```

**Step 2: Update worktree**

```bash
cd $worktree_path
git fetch origin
git reset --hard origin/$branch
```

**Step 3: Get current commit info**

```bash
commit_hash=$(git rev-parse --short HEAD)
```

**Output on success**:
```
✅ Worktree updated

Path: ~/worktrees/org/repo/feature-branch
Branch: feature/branch
Commit: abc1234

Synced with origin/feature/branch
```

**Errors**:
- Not in worktree and no branch specified: `❌ Specify a branch or run from inside a worktree`
- Worktree doesn't exist: `❌ No worktree found for branch 'X'`

---

#### Subcommand: teardown

**Follow lib/worktree.md Section 6**

**If `--all` flag**:

1. List all worktrees:
```bash
cd ~/worktrees/$project_path/.bare
git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2
```

2. Remove each worktree (except .bare):
```bash
git worktree remove "$wt" --force
```

3. Clear metadata worktrees object

**If single worktree**:

1. Determine target (from argument or current directory)
2. Remove worktree:
```bash
cd ~/worktrees/$project_path/.bare
git worktree remove ../$sanitized --force
```

3. Remove entry from metadata

**Output on success**:
```
✅ Worktree removed

Removed: ~/worktrees/org/repo/feature-branch
```

Or for `--all`:
```
✅ All worktrees removed

Removed 3 worktree(s) for org/repo:
- feature-branch
- fix-bug
- main
```

**Errors**:
- No worktrees to remove: `❌ No worktrees found for this project`

---

#### Subcommand: list

**Follow lib/worktree.md Section 7**

**Step 1: Check if project has worktrees**

```bash
meta_file=~/worktrees/$project_path/.meta.json
bare_dir=~/worktrees/$project_path/.bare

if [ ! -d "$bare_dir" ]; then
  # No worktrees for this project
fi
```

**Step 2: Query worktrees**

```bash
cd ~/worktrees/$project_path/.bare
git worktree list
```

**Step 3: Read metadata for purpose info**

```bash
jq -r '.worktrees' $meta_file
```

**Step 4: Display table**

```
📂 Worktrees for org/repo

| Branch          | Path                                    | Purpose           | Created    |
|-----------------|-----------------------------------------|-------------------|------------|
| feature/auth    | ~/worktrees/org/repo/feature-auth       | review: PR #123   | 2024-01-15 |
| fix/bug         | ~/worktrees/org/repo/fix-bug            | debug: EC-4567    | 2024-01-14 |

Total: 2 worktree(s)
```

**If no worktrees**:
```
📂 No worktrees for org/repo

Create one with:
  /schovi:worktree create <branch> [--purpose "..."]
```

---

## Error Handling

| Condition | Error Message |
|-----------|---------------|
| Not in git repo | `❌ Not a git repository. Run from inside a git repository.` |
| Missing subcommand | `❌ Missing subcommand. Usage: /schovi:worktree <create\|update\|teardown\|list>` |
| `create` without branch | `❌ Missing branch. Usage: /schovi:worktree create <branch>` |
| Branch not found | `❌ Branch 'X' not found on remote. Check spelling or fetch first.` |
| Worktree already exists | `❌ Worktree already exists at PATH. Use 'update' to sync or 'teardown' to remove.` |
| Worktree not found | `❌ No worktree found for branch 'X'.` |
| `--all` with wrong subcommand | `❌ --all flag is only valid with 'teardown' subcommand.` |
| `--purpose` with wrong subcommand | `❌ --purpose flag is only valid with 'create' subcommand.` |

## Implementation Notes

**For Claude Code**:

1. **Metadata Management**:
   - Always update `.meta.json` on create/teardown
   - Use `jq` for JSON manipulation when available
   - Fall back to manual JSON construction if jq not available

2. **Path Handling**:
   - Always use `~` expansion in display, absolute paths in execution
   - Sanitize branch names: replace `/` with `-`
   - Handle nested org/repo paths correctly

3. **Reference Clone**:
   - Search `~/work` and `~/productboard` for existing clones
   - Using `--reference` saves significant disk space
   - If no reference found, clone bare directly

4. **Git Worktree Commands**:
   - `git worktree add` - creates new worktree
   - `git worktree remove` - removes worktree
   - `git worktree list` - lists all worktrees
   - Always `--force` on remove to handle dirty state

5. **Output Style**:
   - Use checkmark (✅) for success
   - Use cross (❌) for errors
   - Use folder emoji (📂) for list
   - Keep output concise and actionable
