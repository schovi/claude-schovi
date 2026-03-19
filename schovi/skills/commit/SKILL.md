---
name: commit
description: Create structured git commits with automatic analysis. Use when the user says "/schovi:commit", asks to "commit changes", "commit my work", or wants to create a git commit with auto-detected type and smart amend logic.
disable-model-invocation: false
---

# Git Commit Command

Creates well-structured git commits with conventional format and automatic change analysis. Focused purely on curating real changes into clean commits.

**Behavior**:
- Always auto-stages all changes (`git add .`)
- Auto-detects commit type from diff
- Smart auto-amend for unpushed commits touching same files
- Auto-creates feature branch when on main/master

## Usage

```bash
/schovi:commit              # Auto-analyze diff
/schovi:commit "some notes" # Analyze diff + use notes as context
```

---

# EXECUTION FLOW

## Phase 1: Validation & Branch Setup

### Step 1.1: Parse Input

Optional plain text argument used as additional context for the commit message. No Jira/GitHub fetching (that's handled by `/schovi:publish`).

### Step 1.2: Validate Git State

Run these checks:

```bash
# Get current branch
git rev-parse --abbrev-ref HEAD

# Check for merge conflicts
git status --porcelain | grep -E '^(U|.U)'

# Check for any changes
git status --porcelain
```

**Block if**:
- Merge conflicts exist
- No changes to commit (staged, unstaged, or untracked)

**Error Display** (merge conflicts):
```
Merge conflicts detected.

Files with conflicts:
[list conflicted files]

Resolve conflicts before committing:
1. Edit conflicted files
2. git add <file>
3. Run /schovi:commit again
```

**Error Display** (no changes):
```
No changes to commit.

Working directory is clean.
```

### Step 1.3: Auto-create Branch (if on main/master)

If on main/master, auto-create a feature branch:

```bash
git rev-parse --abbrev-ref HEAD
```

If result is `main` or `master`:

1. Analyze the staged changes (peek at `git diff` or `git status --porcelain`) to generate a short branch name
2. Create and switch to the branch:

```bash
git checkout -b <generated-branch-name>
```

**Branch name rules**:
- Lowercase, kebab-case
- 2-4 words describing the change
- Examples: `fix-token-expiration`, `add-user-auth`, `update-dependencies`

**Display**:
```
On main branch, creating feature branch: <branch-name>
```

---

## Phase 2: Staging & Analysis

### Step 2.1: Auto-stage All Changes

```bash
git add .
```

Display: `Staging all changes...`

### Step 2.2: Verify Staged Files

```bash
git diff --cached --name-only
```

**Error if no staged files** (shouldn't happen after add .):
```
No files staged for commit.

Check: git status
```

### Step 2.3: Analyze Diff

```bash
# Get summary statistics
git diff --cached --stat

# Get detailed diff for analysis
git diff --cached
```

**Display**:
```
Analyzing X files (+Y, -Z lines)...
```

### Step 2.4: Determine Commit Type

Analyze the diff to determine conventional commit prefix:

**Detection rules** (in priority order):

1. **test**: Files only in `test/`, `tests/`, `__tests__/`, or `*.test.*`, `*.spec.*`
2. **docs**: Only markdown/documentation files, no code changes
3. **chore**: Only `package.json`, lockfiles, configs, build scripts
4. **fix**: Error handling changes, bug keywords (fix, bug, error, resolve), conditional logic fixes
5. **feat**: New files with substantial code, new functions/classes, new API endpoints, "add", "implement"
6. **refactor**: Code restructuring, moving code, renaming, extracting functions (no behavior change)
7. **perf**: Performance keywords (optimize, cache, faster)
8. **style**: Only whitespace/formatting changes

**Default**: `chore` if uncertain

Store: `COMMIT_TYPE`

### Step 2.5: Extract Key Changes

From diff analysis, extract:
- **Primary change**: One-line description of main change
- **Key changes**: 2-5 bullet points of specific changes

Store: `PRIMARY_CHANGE`, `KEY_CHANGES`

---

## Phase 3: Message Generation

### Step 3.1: Generate Commit Message

Use only the diff analysis and optional plain text context from the user.

**Title** (50-72 chars):
```
<COMMIT_TYPE>: <PRIMARY_CHANGE>
```

Examples:
- `feat: Add JWT authentication to user login`
- `fix: Resolve token expiration handling`
- `chore: Update dependencies to latest versions`

**Description** (2-3 sentences):
Explain what changed and why. Use context from:
- User-provided notes (if any)
- Diff analysis for technical details

**Bullet Points** (2-5 items):
List specific changes from `KEY_CHANGES`.

### Step 3.2: Assemble Complete Message

**Format**:
```
<TYPE>: <Title>

<Description paragraph>

- <Bullet point 1>
- <Bullet point 2>
- <Bullet point 3>
```

**Display preview**:
```
Commit message:
───────────────
<full message>
───────────────
```

---

## Phase 4: Commit Execution

### Step 4.1: Determine Amend vs New Commit

**Check if last commit is unpushed**:
```bash
git log @{u}..HEAD --oneline 2>/dev/null | head -1
```

- If error (no upstream) → unpushed commits exist
- If has output → unpushed commits exist
- If no output → all pushed, create new commit

**If unpushed commits exist, check file overlap**:
```bash
# Files in last commit
git diff-tree --no-commit-id --name-only -r HEAD

# Files currently staged
git diff --cached --name-only
```

Compare the two lists. If any files appear in both → candidate for amend.

**Decision**:
- **AMEND** if: unpushed commits AND file overlap exists
- **NEW** if: all pushed OR no file overlap

**Display**:
- Amend: `Amending previous commit (same files, not pushed)`
- New: `Creating new commit`

### Step 4.2: Execute Commit

**IMPORTANT**: Use HEREDOC format for multi-line commit messages.

**New commit**:
```bash
git commit -m "$(cat <<'EOF'
<COMMIT_MESSAGE>
EOF
)"
```

**Amend**:
```bash
git commit --amend -m "$(cat <<'EOF'
<COMMIT_MESSAGE>
EOF
)"
```

### Step 4.3: Verify and Display Result

```bash
git log -1 --oneline
git log -1 --stat
```

**Success Display**:
```
Commit created: <hash>

<TYPE>: <Title>

Files: X changed, +Y, -Z

Next steps:
  git show           # review commit
  git push           # push to remote
  /schovi:publish    # create PR
```

**Error Display**:
```
Commit failed.

Error: [git error message]

Possible causes:
- Pre-commit hooks failed
- File permissions issues

Try:
  git status
  git commit --no-verify -m "..."  # skip hooks
```

---

## Error Handling

**Not a git repository**:
```
Not a git repository.

Initialize: git init
Or navigate: cd <git-repo-path>
```

**Detached HEAD**:
```
Detached HEAD state.

Create branch: git checkout -b <branch-name>
```

---

## Implementation Notes

1. **Diff Analysis**: Parse `git diff` to identify file types (controllers, models, tests, configs). Look for keywords to determine type.

2. **Type Detection Priority**: Use file paths first (test/ = test, docs/ = docs), then changed files (package.json = chore), then diff content keywords.

3. **Message Quality**: Title uses active voice, no period. Description explains "why" not just "what". Bullets are specific and technical.

4. **Auto-Amend Safety**: Only amends unpushed commits. Never amends pushed commits. Requires file overlap to prevent unrelated commits from being combined.

5. **No External Context**: Commit focuses purely on diff curation. Jira/GitHub context fetching happens in `/schovi:publish`.