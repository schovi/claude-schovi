---
description: Create structured git commits with context from Jira, GitHub, or change analysis
argument-hint: [jira-id|github-issue|github-pr|notes|--message "text"]
allowed-tools: ["Bash", "Grep", "Read", "Task", "AskUserQuestion"]
---

# 🚀 Git Commit Command

╭─────────────────────────────────────────────╮
│ /schovi:commit - Structured Commit Creation │
╰─────────────────────────────────────────────╯

Creates well-structured git commits with conventional format, automatic change analysis, and optional external context fetching.

## Command Overview

This command creates git commits following these principles:
- **Conventional commit format**: `PREFIX: Title` with detailed description
- **Smart validation**: Prevents commits on main/master, validates branch naming
- **Change analysis**: Analyzes diffs to determine commit type and generate description
- **Optional context**: Fetches Jira/GitHub context when diff analysis is unclear
- **Claude Code footer**: Includes automation signature and co-authorship

## Usage Patterns

```bash
# Auto-analyze changes and create commit
/schovi:commit

# With Jira context
/schovi:commit EC-1234

# With GitHub issue context
/schovi:commit https://github.com/owner/repo/issues/123
/schovi:commit owner/repo#123

# With GitHub PR context
/schovi:commit https://github.com/owner/repo/pull/456
/schovi:commit owner/repo#456

# With custom notes for commit message
/schovi:commit "Add user authentication with JWT tokens"

# Override commit message completely
/schovi:commit --message "feat: Custom commit message"

# Only commit staged changes (don't auto-stage)
/schovi:commit --staged-only
```

---

# EXECUTION FLOW

## PHASE 1: Input Parsing & Context Detection

### Step 1.1: Parse Arguments

```
Parse the user's input to detect:
1. Jira issue ID pattern: [A-Z]{2,10}-\d{1,6} (e.g., EC-1234, PROJ-567)
2. GitHub issue URL: https://github.com/[owner]/[repo]/issues/\d+
3. GitHub issue shorthand: [owner]/[repo]#\d+
4. GitHub PR URL: https://github.com/[owner]/[repo]/pull/\d+
5. GitHub PR shorthand: [owner]/[repo]#\d+ or #\d+
6. Custom notes: Free-form text
7. Flags: --message "text", --staged-only, --type prefix
```

### Step 1.2: Display Detection

Display what was detected:

```markdown
╭─────────────────────────────────────────────╮
│ 📝 COMMIT COMMAND                           │
╰─────────────────────────────────────────────╯

**Detected Input**:
- Type: [Jira Issue | GitHub Issue | GitHub PR | Custom Notes | Auto-detect]
- Reference: [ID/URL if applicable]
- Flags: [List any flags provided]
```

### Step 1.3: Work Folder Detection (Optional Enhancement)

**Objective**: Auto-detect work folder to enrich commit context automatically.

**Try to find work folder** (non-blocking):

```bash
# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Extract identifier (Jira ID)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]+' | head -1)

# Find work folder
if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)

  # Read metadata if folder exists
  if [ -f "$work_folder/.metadata.json" ]; then
    cat "$work_folder/.metadata.json"
  fi
fi
```

**If work folder found, extract**:
- `work_folder_path`: .WIP/[identifier]
- `work_identifier`: From metadata.identifier
- `work_title`: From metadata.title
- `work_external`: From metadata.external (Jira/GitHub URLs)
- `work_progress`: Read 04-progress.md if exists (for phase-based commits)

**If no work folder found**:
- Continue with user-provided context only
- No error - work folder is optional

**Benefits of work folder context**:
- Auto-fills Jira ID if not provided by user
- Uses title from metadata for better commit messages
- Can reference phase number for multi-phase implementations
- Links commits to work folder in metadata

### Step 1.4: Store Context

Store the detected context in variables for later phases:
- `context_type`: jira | github_issue | github_pr | custom | auto
- `context_ref`: The ID/URL/notes
- `flag_message`: Custom message if --message provided
- `flag_staged_only`: Boolean for --staged-only
- `flag_commit_type`: Explicit commit type if --type provided
- `work_folder`: Path to work folder (or null if not found)
- `work_metadata`: Parsed metadata object (or null)
- `work_progress`: Progress info (or null)

---

## PHASE 2: Git State Validation

### Step 2.1: Get Current Branch

```bash
git rev-parse --abbrev-ref HEAD
```

**Validation**:
- ❌ **ERROR if on main/master**: Cannot commit directly to main/master branch
- ✅ **Continue**: If on feature/bugfix/chore branch

**Error Display** (if on main/master):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ COMMIT BLOCKED                           │
╰─────────────────────────────────────────────╯

**Reason**: Direct commits to main/master are not allowed.

**Current branch**: main

**Suggested Actions**:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Create from Jira: `git checkout -b EC-1234-description`
3. Switch to existing branch: `git checkout <branch-name>`

Commit cancelled.
```

### Step 2.2: Validate Branch Name (if Jira context)

If context_type is "jira":

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
**Suggestion**: Consider renaming branch to EC-1234-user-auth

Continue with commit? [Proceeding...]
```

### Step 2.3: Check Git Status

```bash
git status --porcelain
```

**Analyze output**:
- **Staged changes**: Lines starting with M, A, D, R, C in first column
- **Unstaged changes**: Lines with modifications in second column
- **Untracked files**: Lines starting with ??
- **Merge conflicts**: Lines starting with U

**Validation**:
- ❌ **ERROR if merge conflicts**: Resolve conflicts before committing
- ⚠️  **WARN if no changes**: No staged or unstaged changes detected
- ✅ **Continue**: Changes detected

**Error Display** (if conflicts):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ MERGE CONFLICTS DETECTED                 │
╰─────────────────────────────────────────────╯

**Files with conflicts**:
- src/api/controller.ts
- src/models/user.ts

**Action Required**: Resolve merge conflicts before committing.

1. Edit conflicted files
2. Mark as resolved: `git add <file>`
3. Run commit command again

Commit cancelled.
```

**Empty Changes Display**:
```markdown
╭─────────────────────────────────────────────╮
│ ⚠️  NO CHANGES DETECTED                     │
╰─────────────────────────────────────────────╯

**Git Status**: Working directory clean
**Staged**: 0 files
**Unstaged**: 0 files

Nothing to commit.
```

### Step 2.4: Summary Display

```markdown
╭─────────────────────────────────────────────╮
│ ✅ GIT STATE VALIDATION PASSED              │
╰─────────────────────────────────────────────╯

**Branch**: feature/user-authentication
**Branch Status**: Valid feature branch
**Jira Validation**: ✅ Branch matches EC-1234 [if applicable]
**Changes Detected**: Yes

**Summary**:
- Staged: 3 files
- Unstaged: 5 files
- Untracked: 2 files

Proceeding to staging phase...
```

---

## PHASE 3: Staging & Change Analysis

### Step 3.1: Determine Staging Strategy

**Default behavior** (when `--staged-only` NOT provided):
```bash
git add .
```
Display: `🔄 Auto-staging all changes (git add .)`

**Staged-only behavior** (when `--staged-only` provided or called from implement flow):
- Skip auto-staging
- Only commit what's already staged
- Display: `📋 Using only staged changes`

**Validation after staging**:
```bash
git diff --cached --name-only
```

If no files staged:
```markdown
❌ **No staged changes**

No files are staged for commit. Cannot proceed.

**Suggestions**:
1. Stage specific files: `git add <files>`
2. Stage all changes: `git add .`
3. Check working directory: `git status`
```

### Step 3.2: Analyze Staged Changes

```bash
# Get summary statistics
git diff --cached --stat

# Get detailed diff for analysis
git diff --cached
```

**Display**:
```markdown
╭─────────────────────────────────────────────╮
│ 🔍 ANALYZING STAGED CHANGES                 │
╰─────────────────────────────────────────────╯

**Files Changed**: 5 files
**Insertions**: +234 lines
**Deletions**: -45 lines

**Affected Files**:
- src/api/auth-controller.ts (+156, -12)
- src/models/user.ts (+45, -8)
- src/services/jwt-service.ts (+28, -0)
- tests/auth.test.ts (+5, -25)
- README.md (+0, -0)

Analyzing changes to determine commit type...
```

### Step 3.3: Determine Commit Type

Analyze the diff to determine the appropriate conventional commit prefix.

**Logic**:
1. **feat**: New features, new files with substantial code, new API endpoints
   - Keywords: "new", "add", "implement", "create"
   - Indicators: New files, new functions/classes, new routes

2. **fix**: Bug fixes, error handling, corrections
   - Keywords: "fix", "bug", "error", "issue", "resolve"
   - Indicators: Changes in error handling, conditional logic fixes

3. **chore**: Maintenance, dependencies, configs, build changes
   - Keywords: "update", "upgrade", "maintain", "cleanup"
   - Indicators: package.json, lockfiles, config files, build scripts

4. **refactor**: Code restructuring without changing behavior
   - Keywords: "refactor", "restructure", "reorganize", "simplify"
   - Indicators: Moving code, renaming, extracting functions

5. **test**: Test additions or updates
   - Keywords: "test", "spec"
   - Indicators: Files in test/ directories, *.test.*, *.spec.*

6. **docs**: Documentation changes only
   - Keywords: "doc", "readme", "comment"
   - Indicators: .md files, comment changes, no code changes

7. **style**: Code style/formatting (no logic change)
   - Keywords: "format", "style", "lint"
   - Indicators: Whitespace, formatting, linting fixes

8. **perf**: Performance improvements
   - Keywords: "performance", "optimize", "faster", "cache"
   - Indicators: Algorithm changes, caching additions

**Override**: If `--type` flag provided, use that instead.

**Display**:
```markdown
🎯 **Commit Type Determined**: feat
**Reasoning**: New authentication controller and JWT service implementation detected
```

### Step 3.4: Extract Change Summary

Analyze the diff to extract:
1. **Primary change**: What's the main thing being changed?
2. **Affected components**: Which parts of the system are touched?
3. **Key changes**: 2-4 bullet points describing specific changes

**Store for commit message generation**:
- `commit_type`: The determined prefix (feat/fix/chore/etc.)
- `primary_change`: One-line description
- `affected_files`: List of changed files
- `key_changes`: Array of bullet points

---

## PHASE 4: Optional Context Fetching

### Step 4.1: Evaluate Need for External Context

**Decision logic**:

```
IF context_type is "jira" OR "github_issue" OR "github_pr":
    IF primary_change is clear AND key_changes are substantial:
        SKIP context fetching
        Display: "📊 Change analysis is clear, skipping external context fetch"
    ELSE:
        FETCH external context
        Display: "🔍 Fetching external context to enrich commit message..."
ELSE:
    SKIP context fetching
```

**Indicators that analysis is "clear"**:
- 3+ key changes identified
- Primary change is descriptive (>15 chars)
- Commit type confidence is high

### Step 4.2: Fetch Context (if needed)

#### For Jira Issues:

```markdown
🔍 **Fetching Jira Context**
⏳ Fetching issue EC-1234 via jira-analyzer...
```

Use Task tool:
```
prompt: "Fetch and summarize Jira issue [JIRA-KEY]"
subagent_type: "schovi:jira-analyzer:jira-analyzer"
description: "Fetching Jira issue summary"
```

#### For GitHub Issues:

```markdown
🔍 **Fetching GitHub Issue Context**
⏳ Fetching issue via gh-issue-analyzer...
```

Use Task tool:
```
prompt: "Fetch and summarize GitHub issue [URL or owner/repo#123]"
subagent_type: "schovi:gh-issue-analyzer:gh-issue-analyzer"
description: "Fetching GitHub issue summary"
```

#### For GitHub PRs:

```markdown
🔍 **Fetching GitHub PR Context**
⏳ Fetching PR via gh-pr-analyzer...
```

Use Task tool:
```
prompt: "Fetch and summarize GitHub pull request [URL or owner/repo#123]"
subagent_type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
description: "Fetching GitHub PR summary"
```

### Step 4.3: Merge Context with Analysis

Combine external context with diff analysis:
- Use external context to clarify "why" (problem being solved)
- Use diff analysis to describe "what" (specific changes made)
- Prioritize diff analysis for technical accuracy

---

## PHASE 5: Commit Message Generation

### Step 5.1: Generate Message Components

**Context Priority**:
1. **Work folder context** (if available from Step 1.3)
   - Use metadata.title for description context
   - Use metadata.identifier for Related reference
   - Use work_progress for phase-based commit titles
2. **User-provided context** (Jira, GitHub, notes from Step 1.1-1.2)
3. **Diff analysis** (from Phase 3-4)

**Title Line** (50-72 chars):
```
<commit_type>: <brief description of primary change>
```

**If work_progress exists** (multi-phase implementation):
```
<commit_type>: Complete <phase title> (Phase N/Total)
```

Examples:
- `feat: Add JWT authentication to user login`
- `fix: Resolve token expiration handling bug`
- `feat: Complete authentication core (Phase 1/4)` [from work_progress]
- `chore: Update dependencies to latest versions`

**Description Paragraph** (2-3 sentences):
Explain the problem, solution, or context. Answer:
- What problem does this solve? (if fix/feat)
- Why was this change needed?
- What approach was taken?

**If work_metadata exists**: Reference work title
- "Implements Phase N of [work_title]"
- "Part of [work_title] implementation"

**Bullet Points** (2-5 items):
List specific changes:
- Technical changes (new functions, modified logic)
- File-level changes (new files, removed files)
- Integration changes (API changes, database changes)

**Related Reference** (if applicable):
```
Related to: EC-1234
```
or
```
Related to: owner/repo#123
```

**Footer**:
```
🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 5.2: Assemble Complete Message

**Format**:
```
<TYPE>: <Title>

<Description paragraph explaining problem/solution/changes>

- <Bullet point 1>
- <Bullet point 2>
- <Bullet point 3>
- <Bullet point 4>

Related to: <JIRA-KEY or GitHub reference>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 5.3: Display Preview

```markdown
╭─────────────────────────────────────────────╮
│ 📝 COMMIT MESSAGE PREVIEW                   │
╰─────────────────────────────────────────────╯

```
feat: Add JWT authentication to user login

Implements JSON Web Token based authentication system to replace
session-based auth. Adds token generation, verification, and refresh
functionality with configurable expiration times.

- Add AuthController with login/logout endpoints
- Implement JwtService for token operations
- Create User model with password hashing
- Add authentication middleware for protected routes
- Update tests to cover new auth flow

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

Proceeding with commit...
```

---

## PHASE 6: Commit Execution & Verification

### Step 6.1: Execute Commit

```
IMPORTANT: Use HEREDOC format for multi-line commit messages to ensure proper formatting.
```

Execute commit:
```bash
git commit -m "$(cat <<'EOF'
feat: Add JWT authentication to user login

Implements JSON Web Token based authentication system to replace
session-based auth. Adds token generation, verification, and refresh
functionality with configurable expiration times.

- Add AuthController with login/logout endpoints
- Implement JwtService for token operations
- Create User model with password hashing
- Add authentication middleware for protected routes
- Update tests to cover new auth flow

Related to: EC-1234

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 6.2: Verify Commit Created

```bash
git log -1 --oneline
```

**Success indicators**:
- Command exit code 0
- Log shows new commit hash

**Failure indicators**:
- Non-zero exit code
- Errors about hooks, conflicts, etc.

### Step 6.2.5: Update Work Folder Metadata (if applicable)

**If work_folder exists** (from Step 1.3):

1. Get commit hash:
```bash
git log -1 --format='%H'
```

2. Read existing metadata:
```bash
cat "$work_folder/.metadata.json"
```

3. Update fields:
```json
{
  ...existing,
  "git": {
    "branch": "[current branch]",
    "commits": [...existing.commits, "[new commit hash]"],
    "lastCommit": "[new commit hash]"
  },
  "timestamps": {
    ...existing.timestamps,
    "lastModified": "[now from date -u]"
  }
}
```

4. If work_progress exists (phase-based implementation):
   - Update metadata.phases.list[current_phase].commit with new hash
   - Update 04-progress.md with commit reference

5. Use Write tool to save updated metadata to `$work_folder/.metadata.json`.

**If no work folder**:
- Skip metadata update (not an error)

### Step 6.3: Display Result

**Success Display**:
```markdown
╭─────────────────────────────────────────────╮
│ ✅ COMMIT CREATED SUCCESSFULLY              │
╰─────────────────────────────────────────────╯

📝 **Commit Hash**: a3b2c1d
📋 **Type**: feat
📌 **Title**: Add JWT authentication to user login
🔗 **Related**: EC-1234

**Commit Details**:
```
git log -1 --stat
```

**Next Steps**:
1. Review commit: `git show`
2. Continue development and commit more changes
3. Create pull request when ready: `git push` and use GitHub UI
4. Or amend if needed: `git commit --amend`
```

**Error Display** (if commit failed):
```markdown
╭─────────────────────────────────────────────╮
│ ❌ COMMIT FAILED                            │
╰─────────────────────────────────────────────╯

**Error Output**:
```
[Git error message]
```

**Possible Causes**:
1. Pre-commit hooks failed (linting, tests)
2. Commit message validation failed
3. File permissions issues

**Suggested Actions**:
1. Check hook output above for specific errors
2. Fix issues and run `/schovi:commit` again
3. Override hooks if necessary: `git commit --no-verify -m "message"`
4. Check git configuration: `git config --list`

Run `/schovi:commit --message "..."` to retry with specific message.
```

---

## SPECIAL CASES

### Case 1: Called from Implement Flow

When this command is called from `/schovi:implement` or other workflows:

**Detection**: Check if called with special context variable or flag `--from-implement`

**Modified Behavior**:
1. **Staging**: Use `--staged-only` behavior (don't auto-stage all changes)
2. **Validation**: Skip branch name validation (implement handles it)
3. **Message**: Use phase-specific message format if provided
4. **Display**: Minimal output (just commit hash and title)

**Integration Pattern**:
```markdown
Within implement command:

1. Make changes for Phase 1
2. Stage only Phase 1 files: `git add file1.ts file2.ts`
3. Call commit logic with:
   - context: "Phase 1: Backend Service"
   - type: "feat"
   - staged_only: true
4. Repeat for each phase
```

### Case 2: Override with --message Flag

If user provides `--message "custom message"`:

**Behavior**:
1. Skip all analysis phases
2. Use provided message verbatim
3. Still add Claude Code footer
4. Still perform git state validation

**Display**:
```markdown
╭─────────────────────────────────────────────╮
│ 📝 USING CUSTOM MESSAGE                     │
╰─────────────────────────────────────────────╯

**User-provided message**:
```
feat: Custom commit message
```

Skipping analysis, using provided message...
```

### Case 3: Amending Last Commit

If user provides `--amend` flag:

**Validation**:
1. Check last commit author: `git log -1 --format='%an %ae'`
2. Check if commit is pushed: `git branch -r --contains HEAD`
3. Only allow if:
   - Last commit author is "Claude" or user
   - Commit is not pushed to remote
   - No merge commits involved

**Behavior**:
- Run same analysis
- Generate new message or use existing
- Execute: `git commit --amend -m "$(cat <<'EOF' ... EOF)"`

---

## ERROR HANDLING

### Common Errors

**Error 1: Not a Git Repository**
```markdown
❌ **Not a Git Repository**

Current directory is not a git repository.

**Initialize**: `git init`
**Or navigate**: `cd <git-repo-path>`
```

**Error 2: No Remote Repository**
```markdown
⚠️  **No Remote Repository**

No git remote configured. Commits will be local only.

**Add remote**: `git remote add origin <url>`
```

**Error 3: Detached HEAD State**
```markdown
❌ **Detached HEAD State**

You are not on a branch. Commits may be lost.

**Create branch**: `git checkout -b <branch-name>`
```

**Error 4: GPG Signing Required but Not Configured**
```markdown
❌ **GPG Signing Error**

Repository requires GPG signing but GPG is not configured.

**Configure**: `git config user.signingkey <key-id>`
**Disable**: `git config commit.gpgsign false`
```

---

## COMPLETION

### Success Summary

```markdown
╭─────────────────────────────────────────────╮
│ 🎉 COMMIT COMPLETE                          │
╰─────────────────────────────────────────────╯

**Summary**:
- ✅ Commit created: a3b2c1d
- ✅ Type: feat
- ✅ Files changed: 5
- ✅ Lines: +234, -45

**Commit Message**:
feat: Add JWT authentication to user login

**What's Next?**:
1. Continue development: Make more changes and commit again
2. Review your changes: `git show` or `git log --stat`
3. Push to remote: `git push` (or `git push -u origin <branch>` for first push)
4. Create PR: Use `/schovi:analyze` for PR analysis

Keep up the great work! 🚀
```

---

## IMPLEMENTATION NOTES

**For Claude Code**:

1. **Diff Analysis Intelligence**:
   - Parse `git diff` to identify file types (controllers, models, tests, configs)
   - Look for keywords in diff content (class, function, export, import, test, describe)
   - Count additions vs deletions to gauge change magnitude

2. **Commit Type Detection**:
   - Use file paths first (test/ = test, docs/ = docs)
   - Check changed files (package.json = chore)
   - Parse diff content for semantic keywords
   - Default to "chore" if uncertain

3. **Message Quality**:
   - Title: Clear, active voice, no period at end
   - Description: Context-rich, explains "why" not just "what"
   - Bullets: Specific, technical, file/function-level details
   - Avoid vague terms like "update", "change", "modify" without specifics

4. **Validation Strictness**:
   - BLOCK: main/master commits, merge conflicts
   - WARN: Branch name mismatch, no remote, GPG issues
   - ALLOW: Everything else with appropriate messaging

5. **Context Fetching Decision**:
   - Prefer diff analysis (faster, no external dependencies)
   - Fetch external context only when:
     - Diff shows minimal changes (<20 lines)
     - Changed files are unclear (generic names)
     - Multiple unrelated changes detected
     - User explicitly provided Jira/GitHub reference

6. **Integration with Implement**:
   - When called from implement, expect `--from-implement` flag
   - Respect phase boundaries (only commit phase-specific changes)
   - Use provided phase name in commit title
   - Minimal output (implement will summarize)

