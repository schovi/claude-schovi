---
name: publish
description: Create GitHub pull request with smart description generation. Use when the user says "/schovi:publish", asks to "create a PR", "publish", "open a pull request", or wants to push and create/update a GitHub PR. Auto-commits uncommitted changes first.
disable-model-invocation: false
---

# Create Pull Request Command

Creates or updates GitHub pull requests with automatic description generation.

## Codex Compatibility

If `/schovi:commit` or Claude-style custom subagents are unavailable, perform the commit workflow from `schovi/skills/commit/SKILL.md` inline, then use available Codex tools for Jira, GitHub, file, folder, or URL context. For GitHub references, prefer the `gh` CLI workflow described in `schovi/agents/gh-pr-reviewer/AGENT.md`.

**Behavior**:
- Auto-commits uncommitted changes via `/schovi:commit` before proceeding
- Always creates draft PRs
- Always targets the default branch (detected from `origin/HEAD`)
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
# Detect default branch from origin/HEAD
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')

# Get current branch
git rev-parse --abbrev-ref HEAD

# Check working directory
git status --porcelain

# Check gh authentication
gh auth status
```

**Block if**:
- On default branch (`$DEFAULT_BRANCH`)
- gh CLI not authenticated

**Auto-commit if uncommitted changes exist**:

If `git status --porcelain` shows changes (staged, unstaged, or untracked), automatically trigger `/schovi:commit` first. Wait for the commit to complete, then continue with the publish flow.

**Display**:
```
Uncommitted changes detected, committing first...
```

Then invoke `/schovi:commit` and proceed after it completes.

**Error Display** (on default branch):
```
Cannot create PR from <DEFAULT_BRANCH> branch.

Create a feature branch first:
  git checkout -b feature/your-feature
  git checkout -b EC-1234-description
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

Ensure the local branch name and remote branch name always match. This is a critical invariant: `git branch --show-current` must equal the PR's `headRefName` on GitHub.

```bash
LOCAL_BRANCH=$(git branch --show-current)

# Check if upstream exists and where it points
UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)

if [ -n "$UPSTREAM" ]; then
  # Extract the remote branch name (strip "origin/" prefix)
  UPSTREAM_BRANCH=${UPSTREAM#origin/}

  # If upstream points to a different branch name (e.g., main, or a merge queue branch),
  # unset it so the push creates a correctly-named remote branch
  if [ "$UPSTREAM_BRANCH" != "$LOCAL_BRANCH" ]; then
    git branch --unset-upstream
  fi
fi

# Push local branch to a remote branch with the same name
git push -u origin "$LOCAL_BRANCH"
```

**Display**:
- No upstream or mismatched upstream: `Pushing branch and setting upstream...`
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
  git pull --rebase origin $DEFAULT_BRANCH
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
Spawn gh-pr-reviewer subagent:
```
prompt: "Fetch and summarize GitHub reference [INPUT_VALUE]"
subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
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
git log origin/$DEFAULT_BRANCH..HEAD --format="%s%n%b" --reverse

# Changed files
git diff origin/$DEFAULT_BRANCH..HEAD --stat
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

[1-2 sentences in spec form: the problem or feature. If a spec/Jira/doc exists, link to it instead of restating.]

## Solution

[Single paragraph focused on the technical approach: what was built/changed at an architectural level and WHY this approach was chosen over alternatives (performance, simplicity, constraints, tradeoffs).]

## Review Notes (only if applicable)

[Bullet points calling out parts that need human attention: non-obvious decisions, risky areas, things a reviewer might miss by just reading the diff, required follow-ups, deployment caveats. Skip entirely if the diff speaks for itself.]

## Notes (only if applicable)

### Breaking Changes
[If any breaking changes]

### Migration
[Steps users need when upgrading]
```

**Guidelines**:
- Target 100-180 words total
- Header: 1-2 sentences. Prefer linking to spec/Jira/design doc over re-describing. If no external spec, write in spec form (problem statement or feature statement), not narrative.
- Solution: Single paragraph, technical focus. Explain the chosen approach and why it was picked (tradeoffs, constraints, alternatives considered). Avoid restating what files changed.
- Review Notes: Do NOT enumerate changes the reviewer can see in the diff. Only call out what requires human attention: subtle correctness concerns, intentional-but-surprising choices, migration ordering, config that must land together, etc. Omit the section if nothing qualifies.
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
    --base $DEFAULT_BRANCH \
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
Branch: feature/user-auth → <DEFAULT_BRANCH>

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

Branch has no changes compared to default branch.
Make changes and commit first.
```

**Base branch doesn't exist**:
```
Base branch '<DEFAULT_BRANCH>' not found on remote.

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

4. **Push Strategy**: Always push before PR creation. Use `-u` flag to set upstream tracking. **Critical invariant**: the local branch name must always match the remote branch name (and therefore the PR's `headRefName`). Before pushing, unset any upstream that points to a different branch name (e.g., `origin/main` from a merge queue). Never push with `local:different-remote` refspec.

5. **Draft Default**: All PRs start as drafts. Use `gh pr ready` to mark ready for review.

6. **Auto-commit Flow**: Publish owns the full "changes to PR" pipeline. If there are uncommitted changes, it delegates to `/schovi:commit` first, then continues. This makes `/schovi:publish` the single command for "I'm done, ship it".
