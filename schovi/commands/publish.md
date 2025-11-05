---
description: Create GitHub pull request with smart description generation and validation
argument-hint: [jira-id|spec-file] [--input PATH] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--ready] [--base branch] [--title "text"] [--no-push]
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Task", "AskUserQuestion", "Write", "mcp__jira__*"]
---

# 🚀 Create Pull Request Command

╭─────────────────────────────────────────────╮
│ /schovi:publish - GitHub PR Creation      │
╰─────────────────────────────────────────────╯

Creates GitHub pull requests with automatic branch pushing, smart description generation from specs/Jira/commits, and comprehensive validation. PRs are created as drafts by default for safer workflows, with option to create as ready for review.

## Command Overview

This command creates or updates GitHub pull requests following these principles:
- **Draft by default**: Creates draft PRs by default, use --ready for ready PRs
- **Update support**: Detects and updates existing PRs when called multiple times
- **Manual workflow**: Standalone command, not auto-executed by implement
- **Smart description**: Auto-detects best source (spec → Jira → commits)
- **Auto-push**: Automatically pushes branch before creating PR
- **Validation**: Ensures clean state, proper branch, no conflicts
- **Confetti completion**: Celebrates successful PR creation or update

## Usage Patterns

```bash
# Auto-detect everything (spec, Jira, commits) - creates DRAFT PR
/schovi:publish

# With Jira context - creates DRAFT PR
/schovi:publish EC-1234

# With specific spec file - creates DRAFT PR
/schovi:publish ./spec-EC-1234.md

# Create as READY PR (ready for review)
/schovi:publish --ready

# Update existing PR (regenerates description)
/schovi:publish

# Update existing PR and mark as ready
/schovi:publish --ready

# Specify base branch
/schovi:publish --base develop

# Override title
/schovi:publish --title "feat: Add user authentication"

# Skip auto-push (branch must already be pushed)
/schovi:publish --no-push

# Combine flags
/schovi:publish EC-1234 --ready --base develop
```

---

# EXECUTION FLOW

## PHASE 1: Input Parsing & Context Detection

### Step 1.1: Parse Arguments

```
Parse the user's input to detect:
1. Jira issue ID pattern: [A-Z]{2,10}-\d{1,6} (e.g., EC-1234, PROJ-567)
2. Spec file path: ./spec-*.md or any .md file path
3. Flags:
   Input flags:
   - --input <path>: Explicitly specify spec file (overrides positional argument)

   Output flags:
   - --output <path>: Save PR description to file
   - --no-file: Skip saving PR description to file
   - --quiet: Suppress verbose terminal output
   - --post-to-jira: Post PR link as Jira comment (requires Jira ID)

   PR flags:
   - --ready: Create as ready for review (default: draft)
   - --base <branch>: Specify base branch (default: main)
   - --title "text": Override auto-generated title
   - --no-push: Skip automatic branch pushing
```

### Step 1.2: Auto-detect Jira ID from Branch

If no Jira ID provided in arguments, attempt to extract from current branch name:

```bash
# Get current branch
git rev-parse --abbrev-ref HEAD

# Extract Jira ID pattern from branch name
# Examples:
#   EC-1234-add-auth -> EC-1234
#   feature/IS-5678-fix-bug -> IS-5678
#   PROJ-999 -> PROJ-999
```

Use regex pattern: `[A-Z]{2,10}-\d{1,6}`

### Step 1.3: Display Detection Summary

```markdown
╭─────────────────────────────────────────────╮
│ 📝 CREATE PULL REQUEST                      │
╰─────────────────────────────────────────────╯

**Detected Context**:
- Jira ID: EC-1234 [detected from branch | provided by user | not detected]
- Spec file: [path if found | not specified]
- Flags: [list any flags provided]
- Base branch: main [or custom if --base provided]

Proceeding with PR creation...
```

---

## PHASE 2: Git State Validation

### Step 2.1: Validate Current Branch

```bash
git rev-parse --abbrev-ref HEAD
```

**Validation**:
- ❌ **ERROR if on main/master**: Cannot create PR from main/master branch
- ✅ **Continue**: If on feature/bugfix/chore branch

**Error Display** (if on main/master):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ PR CREATION BLOCKED                      │
╰─────────────────────────────────────────────╯

**Reason**: Cannot create pull request from main/master branch.

**Current branch**: main

**Suggested Actions**:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Create from Jira: `git checkout -b EC-1234-description`
3. Switch to existing branch: `git checkout <branch-name>`

PR creation cancelled.
```

### Step 2.2: Validate Branch Naming (if Jira context)

If Jira ID was detected or provided:

```bash
git rev-parse --abbrev-ref HEAD
```

Check if branch name contains the Jira issue key (case-insensitive).

**Validation**:
- ⚠️  **WARN if mismatch**: Branch name doesn't contain Jira issue key
- ✅ **OK**: Branch name matches (e.g., EC-1234-feature for EC-1234)

**Warning Display** (if mismatch):
```markdown
⚠️  **Branch Naming Warning**

**Expected**: Branch name should contain issue key "EC-1234"
**Current branch**: feature/user-auth
**Suggestion**: Consider renaming branch to EC-1234-user-auth for clarity

Continuing with PR creation...
```

### Step 2.3: Check Working Directory State

```bash
git status --porcelain
```

**Analyze output**:
- **Uncommitted changes**: Any staged or unstaged modifications
- **Untracked files**: New files not added to git

**Validation**:
- ❌ **ERROR if uncommitted changes**: Working directory must be clean
- ✅ **Continue**: Clean working directory

**Error Display** (if uncommitted changes):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ UNCOMMITTED CHANGES DETECTED             │
╰─────────────────────────────────────────────╯

**Files with uncommitted changes**:
- M src/api/controller.ts (modified)
- A src/models/user.ts (staged)
- ?? src/utils/helper.ts (untracked)

**Action Required**: Commit or stash changes before creating PR.

**Suggestions**:
1. Commit changes: `/schovi:commit` or `git commit -am "message"`
2. Stash changes: `git stash`
3. Reset changes: `git reset --hard` (WARNING: loses changes)

PR creation cancelled.
```

### Step 2.4: Check Remote Configuration

```bash
# Check if remote exists
git remote -v

# Check GitHub authentication
gh auth status
```

**Validation**:
- ❌ **ERROR if no remote**: Repository has no remote configured
- ❌ **ERROR if gh not authenticated**: GitHub CLI not authenticated
- ✅ **Continue**: Remote configured and gh authenticated

**Error Display** (if no remote):
```markdown
❌ **No Remote Repository**

No git remote configured. Cannot push or create PR.

**Add remote**: `git remote add origin <github-url>`
```

**Error Display** (if gh not authenticated):
```markdown
❌ **GitHub CLI Not Authenticated**

GitHub CLI is not authenticated. Cannot create PR.

**Authenticate**: `gh auth login`
```

### Step 2.5: Check for Unpushed Commits

```bash
# Check if branch has upstream
git rev-parse --abbrev-ref @{u} 2>/dev/null

# If upstream exists, check for unpushed commits
git log @{u}..HEAD --oneline
```

**Display status**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ GIT STATE VALIDATION PASSED              │
╰─────────────────────────────────────────────╯

**Branch**: feature/user-authentication
**Branch Status**: Valid feature branch
**Jira Validation**: ✅ Branch matches EC-1234 [if applicable]
**Working Directory**: Clean (no uncommitted changes)
**Remote**: Configured (origin)
**GitHub CLI**: Authenticated

**Commit Status**:
- Local commits: 5
- Unpushed commits: 3 [or "All pushed" if 0]

Proceeding to push branch...
```

### Step 2.6: Check for Existing PR

Query GitHub to determine if a PR already exists for the current branch:

```bash
# Check for existing PR on current branch
gh pr list --head $(git branch --show-current) --json number,url,title,isDraft,state
```

**Analyze output**:
- **Empty array []**: No existing PR → **CREATE mode**
- **PR data returned**: Existing PR found → **UPDATE mode**

**Set mode for subsequent phases**:
- Store PR number, URL, title, isDraft status if found
- Flag: `MODE=CREATE` or `MODE=UPDATE`

**Display (if UPDATE mode detected)**:
```markdown
╭─────────────────────────────────────────────╮
│ 🔄 EXISTING PR DETECTED - UPDATE MODE       │
╰─────────────────────────────────────────────╯

**Existing PR**: #123
**Title**: EC-1234: Add JWT authentication to user login
**URL**: https://github.com/owner/repo/pull/123
**Status**: Draft [or "Ready for review"]
**State**: Open

This command will UPDATE the existing PR instead of creating a new one.

**What will be updated**:
- ✅ PR description (regenerated from spec/Jira/commits)
- ✅ PR title (only if --title flag provided)
- ✅ Draft/Ready state (only if --ready flag provided and currently draft)

Proceeding with PR update...
```

**Display (if CREATE mode)**:
```markdown
✅ **No existing PR found** - Will create new PR

Proceeding to push branch...
```

---

## PHASE 3: Branch Pushing

### Step 3.1: Determine Push Strategy

**Check upstream tracking**:
```bash
git rev-parse --abbrev-ref @{u} 2>/dev/null
```

**If --no-push flag provided**:
- Skip pushing entirely
- Verify branch is already pushed
- Error if branch not on remote

**Otherwise (default auto-push)**:

**Case A: No upstream tracking branch**
```bash
# Push and set upstream
git push -u origin $(git branch --show-current)
```

Display: `🔄 Pushing branch and setting upstream tracking...`

**Case B: Upstream exists, has unpushed commits**
```bash
# Check for unpushed commits
if [ -n "$(git log @{u}..HEAD)" ]; then
    git push
fi
```

Display: `🔄 Pushing 3 new commits to origin...`

**Case C: Already pushed and up-to-date**

Display: `✅ Branch already pushed and up-to-date (no push needed)`

### Step 3.2: Execute Push

```bash
git push -u origin $(git branch --show-current)
```

**Success Indicators**:
- Exit code 0
- No error messages
- Branch appears on remote

**Failure Indicators**:
- Non-zero exit code
- Authentication errors
- Push rejected errors

### Step 3.3: Verify Push Success

```bash
# Verify branch exists on remote
git ls-remote --heads origin $(git branch --show-current)

# Verify local and remote are in sync
git rev-parse HEAD
git rev-parse origin/$(git branch --show-current)
```

**Display**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ BRANCH PUSHED SUCCESSFULLY               │
╰─────────────────────────────────────────────╯

**Branch**: feature/user-authentication
**Remote**: origin
**Commits Pushed**: 3 new commits
**Status**: ✅ Local and remote in sync

**Latest Commit**: a3b2c1d feat: Add JWT authentication

Proceeding to description generation...
```

**Error Display** (if push fails):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ PUSH FAILED                              │
╰─────────────────────────────────────────────╯

**Error Output**:
```
[Git error message]
```

**Possible Causes**:
1. Remote branch protection rules
2. Force push required (branch diverged)
3. Network/authentication issues
4. Repository permissions

**Suggested Actions**:
1. Check branch protection: Review GitHub repository settings
2. Force push if safe: `git push --force-with-lease`
3. Pull and rebase: `git pull --rebase origin main`
4. Check permissions: Ensure write access to repository

PR creation cancelled.
```

---

## PHASE 4: Description Source Detection & Fetching

### Step 4.1: Search for Description Sources

```
Priority order for description generation:
1. Spec file (most detailed)
2. Jira issue (structured context)
3. Commit history (fallback)
```

#### Source Priority 1: Spec File

**Search strategies**:

A. If Jira ID known, look for `spec-[JIRA-ID].md`:
```bash
# Check current directory
ls spec-EC-1234.md 2>/dev/null

# Check common locations
ls ./spec-EC-1234.md ../spec-EC-1234.md ~/spec-EC-1234.md 2>/dev/null
```

B. If spec file path provided via --input flag or positional argument:
```bash
# Verify file exists
test -f ./path/to/spec.md
```

C. Search for any spec files in current directory:
```bash
# Find spec-*.md files
find . -maxdepth 1 -name "spec-*.md" -type f
```

D. Search conversation history:
- Look for recent `/schovi:plan` command output
- Search last 30 messages for spec markdown structure
- Look for YAML frontmatter with spec metadata

**If spec file found**:
```markdown
🔍 **Description Source Detected**: Spec File

**File**: ./spec-EC-1234.md
**Source**: Specification from plan command

Reading spec file for PR description...
```

Use Read tool to load spec file.

#### Source Priority 2: Jira Issue

**If spec not found AND Jira ID available**:

```markdown
🔍 **Description Source Detected**: Jira Issue

**Issue**: EC-1234
**Source**: Jira issue fetching

⏳ Fetching issue details via jira-analyzer...
```

Use Task tool to invoke jira-analyzer subagent:
```
prompt: "Fetch and summarize Jira issue EC-1234"
subagent_type: "schovi:jira-analyzer:jira-analyzer"
description: "Fetching Jira issue summary"
```

#### Source Priority 3: Commit History

**If no spec and no Jira**:

```markdown
🔍 **Description Source Detected**: Commit History

**Source**: Git log analysis (no spec or Jira found)

Analyzing commits since branch diverged from base...
```

Analyze commits:
```bash
# Get commits since divergence from base branch
git log origin/main..HEAD --format="%H|%s|%b" --reverse

# Get changed files summary
git diff origin/main..HEAD --stat

# Get detailed diff for context
git diff origin/main..HEAD --name-only
```

### Step 4.2: Display Source Detection

```markdown
╭─────────────────────────────────────────────╮
│ 📊 DESCRIPTION SOURCE ANALYSIS              │
╰─────────────────────────────────────────────╯

**Search Results**:
- ✅ Spec file: Found (./spec-EC-1234.md)
- ⬜ Jira issue: Available but not needed (spec takes priority)
- ⬜ Commit history: Available as fallback

**Selected Source**: Spec file (highest priority)

Generating PR description from spec...
```

---

## PHASE 5: PR Description Generation

### Step 5.1: Extract Content from Source

#### From Spec File:

Parse spec markdown structure:
```markdown
# Extract these sections:
- ## Problem / Problem Statement -> PR Problem section
- ## Decision & Rationale / Solution -> PR Solution section
- ## Technical Overview -> PR Solution section (append)
- ## Implementation Tasks -> PR Changes section (bullet points)
- ## Testing Strategy -> PR Other section
- ## Risks & Mitigations -> PR Other section (append)
- Jira ID from YAML frontmatter -> Related to line
```

#### From Jira Issue:

Use jira-analyzer subagent output:
```markdown
# Map Jira fields to PR sections:
- Issue Description -> PR Problem section
- Acceptance Criteria -> PR Changes section (as checklist)
- Issue Type (Bug/Story/Task) -> Problem context
- Comments (key insights) -> PR Other section
```

#### From Commit History:

Analyze git log:
```markdown
# Generate from commits:
- Summarize commit messages -> PR Problem section (what was being solved)
- List commit subjects -> PR Changes section (bullet points)
- Extract technical details from commit bodies -> PR Solution section
- Note affected files/areas -> PR Other section
```

### Step 5.2: Construct PR Description

**Description Generation Principles**:

**Target Length**: 150-250 words (concise, human-readable)

**Brevity Guidelines**:
1. **Problem**: 2-3 sentences max - what's wrong and why it matters, no verbose context
2. **Solution**: Single paragraph - what we're doing and how, NO subsections (no "Approach:", "Columns:", etc.)
3. **Changes**: Group by logical area (code/tests/impact), simple bullets, no "Phase 1/2/3" ceremony
4. **Quality & Impact**: One combined section for testing + breaking changes + rollback (not separate "Other" subsections)
5. **Remove**: Phase numbering, detailed file:line paths, exhaustive lists, future work, redundant explanations

**Formatting for Human Consumption**:
- Use ⚠️ for breaking changes (inline, not separate subsection)
- Use ✅ for testing status (one line summary)
- Use 🔄 for rollback info (one line if non-trivial)
- Group bullets under **bold area headers** (e.g., **Application Code**, **Tests**), NOT execution phases
- Focus on WHAT changed, not step-by-step HOW it was changed
- Inline code with backticks (e.g., `ignored_columns`) for clarity

**Template Structure**:
```markdown
## Problem

[2-3 sentences: What's broken/needed and why it matters. No exhaustive background.]

## Solution

[Single paragraph: What we're doing and how. No subsections, no detailed lists, no redundancy with "Approach".]

## Changes

**[Logical Group 1]**:
- Bullet describing change (no file:line unless critical)
- Bullet describing change

**[Logical Group 2]**:
- Bullet describing change

⚠️ **Breaking change**: [Inline warning if applicable]

## Quality & Impact

✅ [One-line testing summary]

⚠️ **Breaking**: [If applicable]
🔄 **Rollback**: [If non-trivial]

[Brief context or key impact notes, 1-2 lines max]

---

Related to: [JIRA-ID if available]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 5.3: Display Generated Description

```markdown
╭─────────────────────────────────────────────╮
│ 📝 PR DESCRIPTION GENERATED                 │
╰─────────────────────────────────────────────╯

**Source**: Spec file (./spec-EC-1234.md)
**Sections**: Problem, Solution, Changes, Quality & Impact
**Length**: ~180 words

**Preview**:
```
## Problem

Current session-based authentication doesn't scale in distributed environments. Server-side sessions create bottlenecks and don't support stateless API architecture needed for microservices migration.

## Solution

Implement JWT-based authentication with token generation, verification, and refresh capabilities. Tokens are signed with RS256 algorithm and include user claims for authorization.

## Changes

**Application Code**:
- Add AuthController with login/logout endpoints
- Implement JwtService for token operations
- Add authentication middleware

**Data Model**:
- Create User model with bcrypt password hashing

**Tests**: Update test suite for new auth flow

⚠️ **Breaking change**: Session-based endpoints deprecated

## Quality & Impact

✅ Unit and integration tests passing, manual testing guide in TESTING.md

⚠️ **Breaking**: Legacy session endpoints will return 401
🔄 **Rollback**: Trivial - revert commits (database unchanged)

---

Related to: EC-1234

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Proceeding with PR creation...
```

---

## PHASE 6: PR Title Generation

### Step 6.1: Determine Title Strategy

**Priority order**:
1. If `--title` flag provided: Use that exactly
2. If Jira ID available: Format as "EC-1234: [Description]"
3. Otherwise: "[Description]" (no prefix)

### Step 6.2: Generate Description Part

**From spec file**:
- Use spec title from YAML frontmatter
- Or use first heading (# Title)
- Limit to 50-80 characters

**From Jira issue**:
- Use issue summary/title from Jira
- Limit to 50-80 characters

**From commits**:
- Use most recent commit subject
- Or summarize overall change theme
- Limit to 50-80 characters

### Step 6.3: Format Title

**With Jira ID**:
```
EC-1234: Add JWT authentication to user login
```

**Without Jira ID**:
```
Add JWT authentication to user login
```

**Validation**:
- Length: 50-100 characters (optimal for GitHub)
- No period at end
- Clear and descriptive
- Active voice (Add, Implement, Fix, Update, etc.)

### Step 6.4: Display Title

```markdown
📌 **PR Title**: EC-1234: Add JWT authentication to user login

**Format**: [JIRA-ID]: [Description]
**Length**: 52 characters ✅
```

---

## PHASE 7: PR Creation & Verification

### Step 7.1: Determine Base Branch

**Default**: `main`

**Override**: Use `--base` flag value if provided

**Validation**:
```bash
# Verify base branch exists on remote
git ls-remote --heads origin <base-branch>
```

**Error if base branch doesn't exist**:
```markdown
❌ **Base Branch Not Found**

**Specified base**: develop
**Remote**: origin

The specified base branch does not exist on remote.

**Available branches**:
```
git branch -r
```

**Suggestion**: Use `--base main` or check branch name spelling
```

### Step 7.2: Execute PR Creation (CREATE mode only)

```
IMPORTANT: Use HEREDOC format for multi-line PR description.
IMPORTANT: This step only runs in CREATE mode (no existing PR).
           For UPDATE mode, skip to Step 7.2b.
```

**Default behavior (draft PR)**:
```bash
gh pr create --draft \
    --title "EC-1234: Add JWT authentication to user login" \
    --base main \
    --body "$(cat <<'EOF'
## Problem

Implements JSON Web Token based authentication system...

## Solution

Add JWT-based authentication with token generation...

## Changes

- Add AuthController with login/logout endpoints
- Implement JwtService for token operations
- Create User model with password hashing

## Other

**Testing**: Unit tests added for all new services.

---

Related to: EC-1234

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**If --ready flag provided**:
```bash
gh pr create \
    --title "..." \
    --base main \
    --body "$(cat <<'EOF' ... EOF)"
```

Note: Without --ready flag, --draft is added by default.

### Step 7.2b: Execute PR Update (UPDATE mode only)

```
IMPORTANT: This step only runs in UPDATE mode (existing PR detected).
           For CREATE mode, use Step 7.2 instead.
```

**When existing PR detected in Phase 2.6**:

1. **Update PR description** (always):
```bash
gh pr edit <PR_NUMBER> --body "$(cat <<'EOF'
## Problem

[Full regenerated PR description from spec/Jira/commits]

## Solution

...

## Changes

...

## Other

...

---

Related to: EC-1234

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

2. **Update PR title** (only if --title flag provided):
```bash
gh pr edit <PR_NUMBER> --title "New custom title"
```

3. **Convert draft to ready** (only if --ready flag AND PR is currently draft):
```bash
# First check if PR is draft
if [ "$IS_DRAFT" = "true" ]; then
    gh pr ready <PR_NUMBER>
fi
```

**Display (UPDATE mode)**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ PULL REQUEST UPDATED SUCCESSFULLY        │
╰─────────────────────────────────────────────╯

🔄 **PR #123**: EC-1234: Add JWT authentication to user login
🔗 **URL**: https://github.com/owner/repo/pull/123
🌿 **Branch**: feature/user-auth → main
💬 **Status**: Draft [or "Ready for review (converted from draft)" if --ready used]

**What was updated**:
- ✅ PR description regenerated from: [spec file | Jira issue | commit history]
- ✅ PR title updated [only if --title flag provided]
- ✅ Marked as ready for review [only if --ready flag provided and was draft]

**Next Steps**:
1. 👀 Review changes: Open URL above
2. 👥 Request reviewers: `gh pr edit 123 --add-reviewer @username`
3. 🏷️  Add labels: `gh pr edit 123 --add-label "enhancement"`
4. ✅ Monitor CI checks: `gh pr checks 123`

PR successfully updated! 🎉
```

### Step 7.3: Capture PR Output

The `gh pr create` command outputs the PR URL on success:
```
https://github.com/owner/repo/pull/123
```

Capture this output for verification and display.

### Step 7.4: Verify PR Created

```bash
# Get PR details to verify
gh pr view --json number,url,title,state,isDraft

# Alternative: Parse PR number from URL
PR_NUMBER=$(echo $PR_URL | grep -oE '[0-9]+$')
gh pr view $PR_NUMBER --json number,url,title,state
```

**Success indicators**:
- Exit code 0
- Valid JSON output
- PR number returned
- PR URL returned

### Step 7.5: Display PR Creation Success

```markdown
╭─────────────────────────────────────────────╮
│ 🎉 PULL REQUEST CREATED SUCCESSFULLY        │
╰─────────────────────────────────────────────╯

📝 **PR #123**: EC-1234: Add JWT authentication to user login
🔗 **URL**: https://github.com/owner/repo/pull/123
🌿 **Branch**: feature/user-auth → main
💬 **Status**: Open [or "Draft" if --draft used]
📊 **Description**: Generated from spec file

**PR Details**:
- Commits: 5
- Files changed: 12
- Additions: +456 lines
- Deletions: -78 lines

**Next Steps**:
1. 👀 View PR in browser: Open URL above
2. 👥 Request reviewers: `gh pr edit 123 --add-reviewer @username`
3. 🏷️  Add labels: `gh pr edit 123 --add-label "enhancement"`
4. ✅ Monitor CI checks: `gh pr checks 123`
5. 🔀 Merge when ready: `gh pr merge 123`

**Additional Commands**:
- View diff: `gh pr diff 123`
- View checks: `gh pr checks 123 --watch`
- Comment: `gh pr comment 123 --body "message"`
- Mark ready: `gh pr ready 123` [if created as draft]

Great work! 🚀
```

### Step 7.6: Output Handling

Handle PR description and context output based on flags:

**If `--output PATH` flag provided**:

1. Write PR description to file:
   ```markdown
   # GitHub Pull Request Description
   **Created**: [Current timestamp]
   **PR**: #123
   **URL**: https://github.com/owner/repo/pull/123
   **Branch**: feature/user-auth → main
   **Status**: Open / Draft

   ---

   [Full PR description that was used]

   ## Problem
   ...

   ## Solution
   ...

   ## Changes
   ...

   ## Other
   ...

   ---
   Related to: EC-1234
   🤖 Generated with Claude Code
   ```

2. Use Write tool to save to specified path

3. Acknowledge:
   ```
   📄 **[Publish]** PR description saved to: [path]
   ```

**If `--post-to-jira` flag provided AND Jira ID available**:

1. Format PR link for Jira comment:
   ```markdown
   **Pull Request Created**

   🔗 **PR #123**: EC-1234: Add JWT authentication to user login

   **URL**: https://github.com/owner/repo/pull/123

   **Branch**: feature/user-auth → main

   **Status**: Open [or Draft]

   **Description**: Generated from spec file

   **Next Steps**: Review PR, request reviewers, monitor CI checks

   Created by Claude Code
   ```

2. Post to Jira using mcp__jira__addCommentToJiraIssue:
   ```
   cloudId: "productboard.atlassian.net"
   issueIdOrKey: [Jira ID from context]
   commentBody: [formatted PR link]
   ```

3. On success:
   ```
   ✅ **[Publish]** PR link posted to Jira: [JIRA-ID]
   ```

4. On failure:
   ```
   ⚠️ **[Publish]** Failed to post to Jira: [error message]
   ```
   Continue anyway (don't halt)

**If no Jira ID available for --post-to-jira**:
```
⚠️ **[Publish]** Cannot post to Jira: No Jira ID detected
```

### Step 7.7: Run Confetti Command

```
Per CLAUDE.md workflow requirements, always run confetti at end of work.
```

Execute:
```bash
open "raycast://extensions/raycast/raycast/confetti"
```

Display: `🎉 **Confetti time!** 🎉`

---

## ERROR HANDLING

### Common Errors

**Error 1: Base Branch Doesn't Exist**
```markdown
❌ **Base Branch Not Found**

The specified base branch does not exist on remote.

**Specified**: develop
**Available branches**:
- main
- staging
- production

**Suggested Actions**:
1. Use main: `/schovi:publish --base main`
2. Check spelling: Verify branch name
3. Create base branch first: `git push origin HEAD:develop`
```

**Error 2: GitHub CLI Not Authenticated**
```markdown
❌ **GitHub CLI Authentication Required**

GitHub CLI is not authenticated. Cannot create PR.

**Authenticate Now**: `gh auth login`

Follow the prompts to authenticate with GitHub.
```

**Error 3: No Commits on Branch**
```markdown
❌ **No Commits to Create PR**

The current branch has no commits different from base branch.

**Branch**: feature/empty
**Base**: main
**Commits**: 0

**Suggested Actions**:
1. Make changes and commit: Add your implementation
2. Check if on wrong branch: `git branch -a`
3. Switch to correct branch: `git checkout <branch-with-commits>`
```

**Error 4: Repository Not Found**
```markdown
❌ **Repository Not Found on GitHub**

The remote repository does not exist on GitHub or is not accessible.

**Remote URL**: git@github.com:owner/repo.git

**Possible Causes**:
1. Repository doesn't exist
2. No access permissions
3. Wrong remote URL

**Suggested Actions**:
1. Verify repository exists: Visit GitHub URL
2. Check permissions: Ensure you have write access
3. Update remote: `git remote set-url origin <correct-url>`
```

**Error 5: Network/API Errors**
```markdown
❌ **GitHub API Error**

Failed to communicate with GitHub API.

**Error**: [Error message from gh CLI]

**Suggested Actions**:
1. Check internet connection
2. Retry: Run command again
3. Check GitHub status: https://www.githubstatus.com/
4. Update gh CLI: `gh --version` and `brew upgrade gh`
```

---

## SPECIAL CASES

### Case 1: Ready PR Creation

When `--ready` flag is provided:

**Behavior**:
- Create PR as ready for review (not draft)
- Review requests can be sent immediately
- PR can be merged when approved
- Use when changes are complete and ready for team review

**Command**:
```bash
gh pr create --title "..." --body "..." --base main
```

**Display**:
```markdown
✅ **Pull Request Created (Ready for Review)**

📝 **PR #123**: EC-1234: Add JWT authentication
🔗 **URL**: https://github.com/owner/repo/pull/123

**Status**: Ready for review
- Can request reviewers immediately
- Can be merged when approved
- Not in draft state

**Note**: Without --ready flag, PRs are created as drafts by default
**Mark as draft later**: `gh pr ready 123 --undo`
```

### Case 2: Custom Base Branch

When `--base <branch>` flag is provided:

**Behavior**:
- Create PR targeting custom base branch
- Useful for hotfixes (target: production/staging)
- Useful for feature branches (target: develop)

**Validation**:
- Verify base branch exists on remote
- Warn if base is not typical (main/master/develop)

**Display**:
```markdown
⚠️  **Custom Base Branch**

**Target base**: develop (not default 'main')

Ensure this is intentional. PR will merge into: develop
```

### Case 3: No Push Mode

When `--no-push` flag is provided:

**Behavior**:
- Skip automatic branch pushing
- Verify branch is already pushed
- Error if branch not on remote or out of sync

**Validation**:
```bash
# Check if branch exists on remote
git ls-remote --heads origin $(git branch --show-current)

# Check if in sync
git rev-parse HEAD
git rev-parse origin/$(git branch --show-current)
```

**Error if not pushed**:
```markdown
❌ **Branch Not Pushed (--no-push mode)**

Branch must be pushed to remote before creating PR.

**Current branch**: feature/user-auth
**Status**: Not pushed to remote

**Push branch**: `git push -u origin feature/user-auth`

Then run this command again with `--no-push` flag.
```

### Case 4: Override Title

When `--title "custom title"` flag is provided:

**Behavior**:
- Skip automatic title generation
- Use provided title exactly
- Still validate title length (warn if >100 chars)

**Display**:
```markdown
📌 **PR Title (Custom)**:  Custom PR title from flag

**Source**: User-provided via --title flag
**Format**: Free-form (no Jira prefix)
**Length**: 42 characters ✅
```

### Case 5: No Description Source Found

When no spec, no Jira, and minimal commits:

**Behavior**:
- Generate minimal description from commits
- Include prominent note about manual description update
- Provide instructions for editing PR

**Description Template**:
```markdown
## Problem

[TODO: Describe what problem this PR solves - 2-3 sentences]

## Solution

[TODO: Describe the approach taken - single paragraph]

## Changes

- [Commit 1 subject line]
- [Commit 2 subject line]

## Quality & Impact

✅ [TODO: Add testing status]

[TODO: Add breaking changes, rollback notes if applicable]

---

⚠️ **Note**: This description was auto-generated from commits.
Please update with problem context and solution details.

Edit PR: `gh pr edit <number> --body-file <file>`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Display**:
```markdown
⚠️  **Minimal Description Generated**

**Source**: Commit history only (no spec or Jira found)
**Quality**: Basic - manual updates recommended

Consider updating PR description with:
1. Problem context and motivation
2. Technical approach and decisions
3. Testing and deployment notes

**Update PR**: `gh pr edit 123 --body-file description.md`
```

---

## IMPLEMENTATION NOTES

**For Claude Code**:

1. **Description Source Intelligence**:
   - Always prefer spec file (most comprehensive)
   - Jira provides structured context (problem + acceptance criteria)
   - Commits are fallback (least context but always available)
   - Search multiple locations for spec files

2. **PR Title Best Practices**:
   - Include Jira ID when available for traceability
   - Use clear, active voice (Add, Implement, Fix, Update)
   - Keep concise (50-80 chars ideal, max 100)
   - No period at end (GitHub convention)

3. **Description Quality**:
   - Problem section: "Why" (motivation, context)
   - Solution section: "How" (approach, technical decisions)
   - Changes section: "What" (specific modifications)
   - Other section: Testing, deployment, breaking changes

4. **Push Strategy**:
   - Always auto-push unless --no-push specified
   - Use `git push -u origin <branch>` to set upstream
   - Verify push succeeded before creating PR
   - Handle push failures gracefully

5. **Validation Thoroughness**:
   - Block: main/master branches, uncommitted changes
   - Warn: branch name mismatches, unusual base branches
   - Verify: gh authentication, remote existence, base branch

6. **Error Recovery**:
   - Provide clear, actionable error messages
   - Suggest specific commands to resolve issues
   - Link to documentation when helpful
   - Allow retry after fixing issues

7. **Integration with Workflow**:
   - Standalone command (not auto-executed)
   - User decides when to create or update PR
   - Works with existing commit/implement commands
   - Celebrates completion with confetti

8. **CREATE vs UPDATE Mode**:
   - Automatically detect existing PR in Phase 2.6
   - CREATE mode: Use `gh pr create --draft` (default) or without --draft (if --ready)
   - UPDATE mode: Use `gh pr edit` for description/title, `gh pr ready` for draft→ready
   - Always regenerate description in both modes for consistency
   - Preserve PR state unless --ready flag explicitly changes it

9. **Draft by Default Philosophy**:
   - Safer workflow: Draft PRs allow review before requesting reviewers
   - Prevents accidental review notifications
   - User must explicitly opt-in to ready state with --ready flag
   - Can convert draft→ready anytime with `gh pr ready`
   - Can convert ready→draft with `gh pr ready --undo`

