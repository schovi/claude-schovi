---
description: Create GitHub pull request with smart description generation and validation
argument-hint: [jira-id|spec-file] [--draft] [--base branch] [--title "text"]
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Task", "AskUserQuestion"]
---

# 🚀 Create Pull Request Command

╭─────────────────────────────────────────────╮
│ /schovi:create-pr - GitHub PR Creation      │
╰─────────────────────────────────────────────╯

Creates GitHub pull requests with automatic branch pushing, smart description generation from specs/Jira/commits, and comprehensive validation.

## Command Overview

This command creates GitHub pull requests following these principles:
- **Manual workflow**: Standalone command, not auto-executed by implement
- **Smart description**: Auto-detects best source (spec → Jira → commits)
- **Auto-push**: Automatically pushes branch before creating PR
- **Validation**: Ensures clean state, proper branch, no conflicts
- **Confetti completion**: Celebrates successful PR creation

## Usage Patterns

```bash
# Auto-detect everything (spec, Jira, commits)
/schovi:create-pr

# With Jira context
/schovi:create-pr EC-1234

# With specific spec file
/schovi:create-pr ./spec-EC-1234.md

# Create as draft PR
/schovi:create-pr --draft

# Specify base branch
/schovi:create-pr --base develop

# Override title
/schovi:create-pr --title "feat: Add user authentication"

# Skip auto-push (branch must already be pushed)
/schovi:create-pr --no-push

# Combine flags
/schovi:create-pr EC-1234 --draft --base develop
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
   - --draft: Create as draft PR
   - --base <branch>: Specify base branch (default: main)
   - --title "text": Override auto-generated title
   - --no-push: Skip automatic branch pushing
   - --spec <path>: Explicitly specify spec file
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

B. If spec file path provided via --spec flag:
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
- Look for recent `/schovi:create-spec` command output
- Search last 30 messages for spec markdown structure
- Look for YAML frontmatter with spec metadata

**If spec file found**:
```markdown
🔍 **Description Source Detected**: Spec File

**File**: ./spec-EC-1234.md
**Source**: Specification from create-spec command

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

**Template Structure**:
```markdown
## Problem

[Describe what problem this PR solves]
[Extracted from spec/Jira description/commit summary]

## Solution

[Describe the approach taken to solve the problem]
[Extracted from spec technical overview/Jira comments/commit analysis]

## Changes

- [Bullet point describing specific change]
- [Bullet point describing specific change]
- [Bullet point describing specific change]
- [Bullet point describing specific change]

[Extracted from spec tasks/Jira acceptance criteria/commit list]

## Other

[Additional context: testing notes, deployment steps, breaking changes, etc.]
[Extracted from spec testing strategy/Jira comments/commit notes]

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
**Sections**: Problem, Solution, Changes, Other
**Length**: ~500 words

**Preview**:
```
## Problem

Implements JSON Web Token based authentication system to replace
session-based auth. Current system uses server-side sessions which
don't scale well in distributed environments.

## Solution

Add JWT-based authentication with token generation, verification,
and refresh capabilities. Tokens are signed with RS256 algorithm
and include user claims for authorization.

## Changes

- Add AuthController with login/logout endpoints
- Implement JwtService for token operations
- Create User model with password hashing
- Add authentication middleware
- Update tests for new auth flow

## Other

**Testing**: Unit tests added for all new services. Integration
tests cover full auth flow. Manual testing guide in TESTING.md.

**Breaking Changes**: Session-based endpoints deprecated.

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

### Step 7.2: Execute PR Creation

```
IMPORTANT: Use HEREDOC format for multi-line PR description.
```

**Command structure**:
```bash
gh pr create \
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

**If --draft flag provided**:
```bash
gh pr create --draft \
    --title "..." \
    --base main \
    --body "$(cat <<'EOF' ... EOF)"
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

### Step 7.6: Run Confetti Command

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

**Error 1: PR Already Exists**
```markdown
❌ **Pull Request Already Exists**

A pull request already exists for this branch:
- PR #100: EC-1234: Previous PR
- URL: https://github.com/owner/repo/pull/100

**Suggested Actions**:
1. View existing PR: `gh pr view 100`
2. Update existing PR: Make new commits and push
3. Close existing PR: `gh pr close 100` (then run this command again)
4. Create from different branch: Switch branches and try again
```

**Error 2: Base Branch Doesn't Exist**
```markdown
❌ **Base Branch Not Found**

The specified base branch does not exist on remote.

**Specified**: develop
**Available branches**:
- main
- staging
- production

**Suggested Actions**:
1. Use main: `/schovi:create-pr --base main`
2. Check spelling: Verify branch name
3. Create base branch first: `git push origin HEAD:develop`
```

**Error 3: GitHub CLI Not Authenticated**
```markdown
❌ **GitHub CLI Authentication Required**

GitHub CLI is not authenticated. Cannot create PR.

**Authenticate Now**: `gh auth login`

Follow the prompts to authenticate with GitHub.
```

**Error 4: No Commits on Branch**
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

**Error 5: Repository Not Found**
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

**Error 6: Network/API Errors**
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

### Case 1: Draft PR Creation

When `--draft` flag is provided:

**Behavior**:
- Create PR in draft state
- Draft PRs don't trigger review requests
- Draft PRs don't allow merging until marked ready
- Useful for work-in-progress or early feedback

**Command**:
```bash
gh pr create --draft --title "..." --body "..." --base main
```

**Display**:
```markdown
✅ **Pull Request Created as Draft**

📝 **PR #123** (DRAFT): EC-1234: Add JWT authentication
🔗 **URL**: https://github.com/owner/repo/pull/123

**Draft Status**: PR is in draft mode
- No review requests sent yet
- Cannot be merged until marked ready

**When ready**: `gh pr ready 123` to mark as ready for review
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

[TODO: Describe what problem this PR solves]

## Solution

[TODO: Describe the approach taken]

## Changes

- [Commit 1 subject line]
- [Commit 2 subject line]

## Other

[TODO: Add testing notes, deployment instructions, etc.]

---

⚠️ **Note**: This description was auto-generated from commits.
Please update it with more details about the problem and solution.

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
   - User decides when to create PR
   - Works with existing commit/implement commands
   - Celebrates completion with confetti

