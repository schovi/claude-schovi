---
description: Create GitHub pull request with smart description generation
argument-hint: [context]
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# Create Pull Request Command

Creates or updates GitHub pull requests with automatic description generation.

**Behavior**:
- Always creates draft PRs
- Always targets `main` branch
- Always auto-pushes before creating PR
- Auto-generates title from Jira ID or content

## Usage

```bash
/schovi:publish              # Use commit history
/schovi:publish EC-1234      # Fetch Jira issue
/schovi:publish #123         # Fetch GitHub issue/PR
/schovi:publish owner/repo#45 # Fetch from specific repo
/schovi:publish ./spec.md    # Read file
/schovi:publish ./folder/    # Read folder (find main doc)
/schovi:publish https://...  # Fetch URL
/schovi:publish "some text"  # Use as context
```

---

# EXECUTION FLOW

## Phase 1: Input Detection & Validation

### Step 1.1: Parse Input

Parse single positional argument (or none). Detect input type in this order:

1. **Jira pattern**: Matches `[A-Z]{2,10}-\d{1,6}` (e.g., EC-1234, PROJ-567)
2. **GitHub reference**: Matches `#\d+`, `owner/repo#\d+`, or GitHub URL
3. **File path**: Path exists and is a file
4. **Folder path**: Path exists and is a directory
5. **URL**: Starts with `http://` or `https://`
6. **Plain text**: Everything else
7. **None**: No argument provided

Store: `INPUT_TYPE` (jira|github|file|folder|url|text|none) and `INPUT_VALUE`

### Step 1.2: Auto-detect Jira ID from Branch

If no Jira ID from input, extract from branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Extract pattern: `[A-Z]{2,10}-\d{1,6}` from branch name.

Examples:
- `EC-1234-add-auth` → EC-1234
- `feature/IS-5678-fix-bug` → IS-5678

Store: `JIRA_ID` (from input or branch, may be empty)

### Step 1.3: Validate Git State

Run these checks:

```bash
# Get current branch
git rev-parse --abbrev-ref HEAD

# Check working directory
git status --porcelain

# Check gh authentication
gh auth status
```

**Block if**:
- On main/master branch
- Uncommitted changes exist
- gh CLI not authenticated

**Error Display** (on main/master):
```
Cannot create PR from main/master branch.

Create a feature branch first:
  git checkout -b feature/your-feature
  git checkout -b EC-1234-description
```

**Error Display** (uncommitted changes):
```
Uncommitted changes detected. Commit or stash before creating PR.

Files:
[list from git status]

Options:
  /schovi:commit
  git stash
```

**Error Display** (gh not authenticated):
```
GitHub CLI not authenticated.

Run: gh auth login
```

### Step 1.4: Check for Existing PR

```bash
gh pr list --head $(git branch --show-current) --json number,url,title,isDraft,state
```

**Set mode**:
- Empty result → `MODE=CREATE`
- PR found → `MODE=UPDATE`, store PR number and URL

**Display (UPDATE mode)**:
```
Existing PR detected - will update PR #123
URL: https://github.com/owner/repo/pull/123
```

---

## Phase 2: Git Operations

### Step 2.1: Push Branch

Check upstream and push if needed:

```bash
# Check upstream
git rev-parse --abbrev-ref @{u} 2>/dev/null

# Push with upstream tracking
git push -u origin $(git branch --show-current)
```

**Display**:
- No upstream: `Pushing branch and setting upstream...`
- Has unpushed commits: `Pushing N commits to origin...`
- Already synced: `Branch already pushed`

### Step 2.2: Verify Push

```bash
git ls-remote --heads origin $(git branch --show-current)
```

**Error if push failed**:
```
Push failed.

Error: [git error message]

Try:
  git pull --rebase origin main
  git push --force-with-lease
```

---

## Phase 3: Description Generation

### Step 3.1: Fetch/Read Content

Based on `INPUT_TYPE`:

**Jira** (`INPUT_TYPE=jira`):
Spawn jira-analyzer subagent:
```
prompt: "Fetch and summarize Jira issue [INPUT_VALUE]"
subagent_type: "schovi:jira-auto-detector:jira-analyzer"
description: "Fetching Jira issue"
```

**GitHub** (`INPUT_TYPE=github`):
Spawn gh-pr-analyzer subagent:
```
prompt: "Fetch and summarize GitHub reference [INPUT_VALUE]"
subagent_type: "schovi:gh-pr-auto-detector:gh-pr-analyzer"
description: "Fetching GitHub context"
```

**File** (`INPUT_TYPE=file`):
Read file content with Read tool.

**Folder** (`INPUT_TYPE=folder`):
Find main document in folder (priority order):
1. `spec*.md`
2. `plan*.md`
3. `README.md`
4. First `.md` file

Read the found file.

**URL** (`INPUT_TYPE=url`):
Use WebFetch to get content.

**Text** (`INPUT_TYPE=text`):
Use `INPUT_VALUE` directly as context.

**None** (`INPUT_TYPE=none`):
Analyze commit history:
```bash
# Commits since divergence
git log origin/main..HEAD --format="%s%n%b" --reverse

# Changed files
git diff origin/main..HEAD --stat
```

### Step 3.2: Generate Description

**CRITICAL**: When updating an existing PR, completely rewrite the description to describe the FINAL state of the code.

NEVER use phrases like:
- "We changed X to Y"
- "Updated A to B"
- "Modified from... to..."

ALWAYS describe what the code DOES NOW, not how it evolved.

**Determine PR type** from context:
- **Bug**: Fix words, error context, debug files
- **New Feature**: New functionality, "add", "implement"
- **Enhancement**: Improvements, performance, refactoring
- **Chore**: Dependencies, CI/CD, tooling, docs

**Generate using template**:

```markdown
## [Bug | New Feature | Enhancement | Chore]

[2-3 sentences: What problem this solves and why it matters]

## Solution

[Single paragraph: How the code now works]

## Changes

**[Area 1]** (e.g., API, Core Logic, Configuration):
- Change description
- Change description

**[Area 2]**:
- Change description

## Notes (only if applicable)

### Breaking Changes
[If any breaking changes]

### Migration
[Steps users need when upgrading]
```

**Guidelines**:
- Target 150-250 words
- Header: 2-3 sentences max
- Solution: Single paragraph, no subsections
- Changes: Group by logical area, simple bullets
- Notes: Only include subsections with actual content

### Step 3.3: Generate Title

**Format**:
- With Jira ID: `EC-1234: [Description]`
- Without Jira ID: `[Description]`

**Source for description part**:
- From spec/plan file title
- From Jira issue summary
- From commit messages (summarize theme)

**Rules**:
- 50-80 characters ideal
- No period at end
- Active voice (Add, Fix, Implement, Update)

---

## Phase 4: PR Creation/Update

### Step 4.1: Create PR (CREATE mode)

```bash
gh pr create --draft \
    --title "[TITLE]" \
    --base main \
    --body "$(cat <<'EOF'
[DESCRIPTION]
EOF
)"
```

### Step 4.2: Update PR (UPDATE mode)

```bash
gh pr edit [PR_NUMBER] --body "$(cat <<'EOF'
[DESCRIPTION]
EOF
)"
```

### Step 4.3: Display Success

**CREATE mode**:
```
PR #123 created (draft)

URL: https://github.com/owner/repo/pull/123
Branch: feature/user-auth → main

Next steps:
  gh pr edit 123 --add-reviewer @username
  gh pr ready 123  # mark ready for review
  gh pr checks 123 --watch
```

**UPDATE mode**:
```
PR #123 updated

URL: https://github.com/owner/repo/pull/123

Description regenerated from: [source]
```

---

## Error Handling

**No commits on branch**:
```
No commits to create PR.

Branch has no changes compared to main.
Make changes and commit first.
```

**Base branch doesn't exist**:
```
Base branch 'main' not found on remote.

Available branches:
[list from git branch -r]
```

**Network/API errors**:
```
GitHub API error: [message]

Check:
  - Internet connection
  - GitHub status: https://www.githubstatus.com/
  - gh CLI version: gh --version
```

---

## Implementation Notes

1. **Input Detection Order**: Jira pattern first (most specific), then GitHub reference, then file existence, then folder, then URL prefix, then plain text, finally none.

2. **Description Quality**: Focus on WHAT and WHY, not implementation details. Readers should understand the change without reading code.

3. **Final State Language**: Always describe current behavior. "The API returns paginated results" not "Changed the API to return paginated results".

4. **Push Strategy**: Always push before PR creation. Use `-u` flag to set upstream tracking.

5. **Draft Default**: All PRs start as drafts. Use `gh pr ready` to mark ready for review.
