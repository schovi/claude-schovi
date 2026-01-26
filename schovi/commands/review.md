---
description: Comprehensive code review with issue detection and improvement suggestions
argument-hint: [PR/Jira/issue/file] [--quick] [--keep-worktree]
allowed-tools: ["Task", "Bash", "Read", "Write", "Grep", "Glob", "mcp__jetbrains__*"]
---

# Review Command

Perform comprehensive code review focused on GitHub PRs, Jira tickets, GitHub issues, or documents. Provides summary, key analysis, potential issues, and improvement suggestions.

## Command Arguments

**Input Types**:
- GitHub PR: URL, `owner/repo#123`, or `#123`
- Jira ID: `EC-1234`, `IS-8046`, etc.
- GitHub Issue: URL or `owner/repo#123`
- File path: `./path/to/file.md` or absolute path
- Free-form: Description text

**Flags**:
- `--quick`: Perform quick review (lighter analysis, faster results)
- `--keep-worktree`: Don't teardown worktree after review (for follow-up work)
- Default: Deep review (comprehensive analysis with codebase exploration)

## Execution Workflow

### Phase 1: Input Parsing & Classification

1. **Parse Arguments**: Extract input and flags from command line
2. **Classify Input Type**:
   - GitHub PR: Contains "github.com/.../pull/", "owner/repo#", or "#\d+"
   - Jira ID: Matches `[A-Z]{2,10}-\d{1,6}`
   - GitHub Issue: Contains "github.com/.../issues/" or "owner/repo#" (not PR)
   - File path: Starts with `.` or `/`, file exists
   - Free-form: Everything else

3. **Extract Review Mode**:
   - `--quick` flag present → Quick review
   - Default → Deep review

### Phase 2: Context Fetching

**Fetch context based on input type using appropriate subagent**:

1. **GitHub PR**:
   - Use Task tool with subagent_type: `schovi:gh-pr-reviewer:gh-pr-reviewer`
   - Prompt: "Fetch and summarize GitHub PR [input]"
   - Description: "Fetching GitHub PR review data"
   - **Important**: gh-pr-reviewer returns ALL changed files with stats and PR head SHA for code fetching

2. **Jira Issue**:
   - Use Task tool with subagent_type: `schovi:jira-auto-detector:jira-analyzer`
   - Prompt: "Fetch and summarize Jira issue [input]"
   - Description: "Fetching Jira issue summary"

3. **GitHub Issue**:
   - Use Task tool with subagent_type: `schovi:gh-issue-analyzer:gh-issue-analyzer`
   - Prompt: "Fetch and summarize GitHub issue [input]"
   - Description: "Fetching GitHub issue summary"

4. **File Path**:
   - Use Read tool to read file contents
   - Store as context for review

5. **Free-form**:
   - Use provided text as context directly

**Wait for subagent completion before proceeding**.

### Phase 2.5: Worktree Setup & Source Code Access

**For GitHub PRs, create an isolated worktree to review code without affecting current work**.

This phase ensures reviews run in parallel to any other work. The worktree provides a clean checkout of the PR branch.

#### Step 1: Create Worktree (GitHub PRs only)

**Follow lib/worktree.md to create isolated environment**:

1. **Extract PR info from context**:
   - Branch name: `headRefName` from gh-pr-reviewer
   - Repository: `owner/repo` from PR URL
   - PR number: for purpose tracking

2. **Create worktree**:
```bash
# Detect project path from current repo
remote_url=$(git remote get-url origin 2>/dev/null)
# Parse to org/repo

# Sanitize branch name
sanitized=$(echo "$branch" | tr '/' '-')
worktree_path=~/worktrees/$project_path/$sanitized

# Create worktree if it doesn't exist
if [ ! -d "$worktree_path" ]; then
  # Ensure bare repo exists
  if [ ! -d "~/worktrees/$project_path/.bare" ]; then
    # Find source repo for --reference
    source_repo=$(find ~/work ~/productboard -maxdepth 2 -name ".git" -exec dirname {} \; 2>/dev/null | while read dir; do
      if git -C "$dir" remote get-url origin 2>/dev/null | grep -q "$project_path"; then
        echo "$dir"
        break
      fi
    done)

    if [ -n "$source_repo" ]; then
      git clone --bare --reference "$source_repo" "$remote_url" ~/worktrees/$project_path/.bare
    else
      git clone --bare "$remote_url" ~/worktrees/$project_path/.bare
    fi
  fi

  # Create worktree
  cd ~/worktrees/$project_path/.bare
  git fetch origin
  git worktree add ../$sanitized origin/$branch --checkout
fi

# Update metadata
# Add entry to .meta.json with purpose "review: PR #123"
```

3. **Display worktree info**:
```
📂 Review worktree created
   Path: ~/worktrees/org/repo/feature-branch
   Branch: feature/branch
   Purpose: review: PR #123
```

**Store `worktree_path` for use in subsequent phases**.

#### Step 2: Identify Files to Review

**Extract file paths from PR context**:

- gh-pr-reviewer returns **ALL changed files** with stats
- Files include: additions, deletions, total changes, status
- Files are sorted by changes (descending)

**Prioritize files** (up to 10 for deep review, 3 for quick):
- Top files by total changes
- Core logic files (controllers, services, models) over config/docs
- Test files related to changes
- Exclude: package-lock.json, yarn.lock, generated files

#### Step 3: Read Files from Worktree

**All file access uses the worktree path**:

```bash
# Read files from worktree
cd $worktree_path

# Use Read tool with worktree-relative paths
# Example: Read $worktree_path/src/api/controller.ts
```

**For deep reviews, also fetch**:
- Related dependencies (imports/requires)
- Reverse dependencies (files importing changed files)
- Test files for changed code

Use Grep/Glob within worktree:
```bash
# Find related files in worktree
cd $worktree_path
grep -r "import.*from.*{filename}" --include="*.ts"
```

#### Step 4: Display Access Info

```
📥 Reviewing code in isolated worktree
📂 Path: ~/worktrees/org/repo/feature-branch
📄 Analyzing X files (Y lines changed)
```

#### For Non-PR Reviews (Jira, files, free-form)

**Skip worktree creation**:
- Jira/GitHub issues: Read files from current directory or JetBrains MCP
- File paths: Read directly
- Free-form: Use current codebase context

#### Error Handling

- **Worktree creation fails**: Fall back to GitHub API fetch
- **Branch not found**: Report error, suggest checking PR status
- **Disk space issues**: Report error, suggest cleanup with `/schovi:worktree teardown --all`

### Phase 3: Review Analysis

#### Deep Review (Default)

**Comprehensive analysis using fetched source code**:

1. **Direct Code Analysis** (using Phase 2.5 fetched files):

   **Analyze fetched source files directly**:
   - Review each fetched file for code quality, patterns, and issues
   - Focus on changed sections but consider full file context
   - Cross-reference between related files
   - Verify imports/exports are correct
   - Check for unused code or imports

   **Use Explore subagent for additional context** (if needed):
   - Use Task tool with subagent_type: `Explore`
   - Set thoroughness: `medium` (since we already have main files)
   - Prompt: "Explore additional context for the review:
     - Find additional related files not yet fetched
     - Locate integration points and dependencies
     - Search for similar patterns in codebase
     - Context: [fetched code summary + file list]"
   - Description: "Exploring additional codebase context"

2. **Multi-dimensional Analysis** (on fetched code):

   **Functionality**:
   - Does implementation match requirements from context?
   - Are edge cases handled (null checks, empty arrays, boundary conditions)?
   - Is error handling comprehensive?
   - Are return values consistent?

   **Code Quality**:
   - Readability: Clear variable names, function names, code organization
   - Maintainability: DRY principle, single responsibility, modularity
   - Patterns: Appropriate design patterns, consistent style
   - Complexity: Cyclomatic complexity, nesting depth

   **Security** (CRITICAL):
   - SQL injection risks (raw queries, string concatenation)
   - XSS vulnerabilities (unescaped output, innerHTML usage)
   - Authentication/Authorization issues (missing checks, hardcoded credentials)
   - Data leaks (logging sensitive data, exposing internal details)
   - Input validation (user input sanitization, type checking)
   - CSRF protection (state-changing operations)

   **Performance**:
   - N+1 query problems (loops with database calls)
   - Memory leaks (event listeners, closures, cache)
   - Inefficient algorithms (O(n²) when O(n) possible)
   - Unnecessary re-renders (React/Vue/Angular)
   - Resource handling (file handles, connections, streams)

   **Testing**:
   - Test coverage for changed code
   - Test quality (unit vs integration, assertions)
   - Missing test scenarios (edge cases, error paths)
   - Test maintainability (mocks, fixtures)

   **Architecture**:
   - Design patterns appropriate for use case
   - Coupling between modules (tight vs loose)
   - Cohesion within modules (single responsibility)
   - Separation of concerns (business logic, UI, data)

   **Documentation**:
   - Code comments for complex logic
   - JSDoc/docstrings for public APIs
   - README updates if needed
   - Inline explanations for non-obvious code

3. **Code-Specific Issue Detection**:

   **Scan fetched code for common issues**:
   - TODO/FIXME comments left in code
   - Console.log/debug statements in production code
   - Commented-out code blocks
   - Hardcoded values that should be constants/config
   - Magic numbers without explanation
   - Inconsistent naming conventions
   - Missing error handling in async code
   - Race conditions in concurrent code
   - Resource leaks (unclosed files, connections)

#### Quick Review (--quick flag)

**Lighter analysis without full source code fetching**:

**Skip Phase 2.5 or fetch minimal files only**:
- For PRs: Use `gh pr diff` to get code changes without full file fetching
- Limit to top 3 most important files if fetching
- No dependency exploration
- No related file fetching

1. **Context-based Analysis**:
   - Review fetched context summary and diffs
   - Limited file exploration (max 3 files)
   - Focus on obvious issues and high-level patterns
   - Fast turnaround (30-60 seconds)

2. **Focus Areas**:
   - Summary of changes/content
   - Obvious code quality issues from diff
   - Critical security concerns (if visible in diff)
   - High-level improvement suggestions
   - Surface-level pattern detection

### Phase 4: Structured Output

**Generate comprehensive review output** (no file output, terminal only):

```markdown
# 🔍 Code Review: [Input Identifier]

## 📝 Summary

[2-3 sentence overview of what's being reviewed and overall assessment]

## 🎯 Risk Assessment

**Risk Level:** [Low / Low-Medium / Medium / Medium-High / High]

[2-4 bullet points explaining risk factors]:
- [Technical risk factors: complexity, scope, affected systems]
- [Test coverage status: comprehensive/partial/missing]
- [Data/schema changes: yes/no and impact]
- [Dependencies: new dependencies, breaking changes, version updates]
- [Deployment risk: can be deployed independently / requires coordination]

## 🔒 Security Review

[Security assessment - always include even if no concerns]:

**If concerns found**:
⚠️ Security concerns identified:
- [Specific security issue with file:line reference]
- [Classification: SQL injection, XSS, auth bypass, data leak, etc.]
- [Impact assessment and recommendation]

**If no concerns**:
✅ No security concerns identified
- [Verified: appropriate auth/validation patterns]
- [Data handling: proper sanitization/escaping]
- [Access control: correct permissions/authorization]

## ⚡ Performance Impact

[Performance assessment - always include]:

**If concerns found**:
⚠️ Performance concerns identified:
- [Specific performance issue with file:line reference]
- [Classification: N+1 queries, memory leak, inefficient algorithm, etc.]
- [Expected impact and recommendation]

**If no concerns**:
✅ No performance concerns
- [Database queries: optimized / no new queries / properly indexed]
- [Memory handling: appropriate / no leaks detected]
- [Algorithm efficiency: acceptable complexity / optimized]
- [Processing: in-memory / batch processing / streaming where appropriate]

## 🔍 Key Changes/Information

[Bullet list where each item has a 2-5 word title and sub-bullets with details]

- **2-5 word title**
  - Short detail with file:line reference
  - Short detail with file:line reference
- **Another 2-5 word title**
  - Short detail
  - Short detail
- **Third change title**
  - Detail
  - Detail

## ⚠️ Issues Found

[Identified problems, bugs, concerns - organized by priority and severity]

### 🚨 Must Fix
[Critical issues that MUST be addressed before merge]

1. **Issue title** (file:line)
   - Description of the issue with code evidence
   - Why it's critical (impact, risk, blockers)
   - **Action:** Specific fix recommendation

### ⚠️ Should Fix
[Important issues that SHOULD be addressed, may block merge depending on severity]

2. **Issue title** (file:line)
   - Description of the issue
   - Why it's important (technical debt, maintainability, bugs)
   - **Action:** Specific fix recommendation

### 💭 Consider
[Minor issues or suggestions that can be addressed later]

3. **Issue title** (file:line)
   - Description of the concern
   - Optional improvement or nice-to-have
   - **Action:** Suggestion for improvement

[If no issues found: "✅ No significant issues identified"]

## 💡 Recommendations

[2-5 actionable suggestions for improvement, can include code examples]

1. **Recommendation title** (file:line if applicable)
   - Explanation of improvement
   - Expected benefit
   - [Optional: Code example showing before/after]

2. **Recommendation title**
   - Explanation
   - Benefit

[Continue for 2-5 recommendations]

## 🎯 Verdict

**[⚠️ Approve with changes / ✅ Approve / 🚫 Needs work / ❌ Blocked]**

[1-2 sentences explaining verdict reasoning]

**Merge Criteria:**
- [ ] [Specific requirement from Must Fix items]
- [ ] [Specific requirement from Should Fix items]
- [ ] [Optional: Additional verification or testing needed]

**Estimated Fix Time:** [X minutes/hours for addressing Must Fix + Should Fix items]
```

### Phase 5: Worktree Cleanup

**After review is complete, teardown the worktree** (unless `--keep-worktree` flag):

```bash
# Only for PR reviews with worktree
if [ -n "$worktree_path" ] && [ "$keep_worktree" != "true" ]; then
  cd ~/worktrees/$project_path/.bare
  git worktree remove ../$sanitized --force

  # Update .meta.json to remove entry
fi
```

**If `--keep-worktree` flag is set**:
```
📂 Worktree kept for follow-up work
   Path: ~/worktrees/org/repo/feature-branch

   To continue working: cd ~/worktrees/org/repo/feature-branch
   To remove later: /schovi:worktree teardown feature/branch
```

---

## Quality Gates

**Before presenting review, verify**:

- ✅ Context successfully fetched via subagent
- ✅ Worktree created for PR reviews (or reused existing)
- ✅ Source code read from worktree (deep: 10 files, quick: 3 files)
- ✅ Worktree path displayed to user
- ✅ Analysis completed on actual source code
- ✅ Summary section with 2-3 sentence overview
- ✅ Risk Assessment section with risk level and 2-4 factors
- ✅ Security Review section present (concerns found OR explicit "no concerns")
- ✅ Performance Impact section present (concerns found OR explicit "no concerns")
- ✅ At least 3 key changes/info points identified with specific code references
- ✅ Issues section organized by priority (Must Fix / Should Fix / Consider)
- ✅ Each issue includes file:line reference and Action recommendation
- ✅ 2-5 recommendations provided with benefits
- ✅ File references use `file:line` format for all code mentions
- ✅ Verdict section with approval status
- ✅ Merge Criteria checklist with specific requirements
- ✅ Worktree cleaned up (unless `--keep-worktree`)

## Important Rules

1. **Worktree Isolation**: PR reviews ALWAYS use isolated worktree (lib/worktree.md)
2. **No File Output**: This command outputs to terminal ONLY, no file creation
3. **No Work Folder Integration**: Does not use work folder system (unlike implement/debug)
4. **Context Isolation**: Always use subagents for external data fetching
5. **Holistic Assessment**: Always include Risk, Security, and Performance sections (even if no concerns)
6. **Priority-Based Issues**: Organize issues by priority (Must Fix / Should Fix / Consider), not just severity
7. **Actionable Feedback**: All issues and recommendations must include specific Action items
8. **Clear Verdict**: Provide explicit merge decision with criteria checklist and estimated fix time
9. **Security Focus**: Always check for common vulnerabilities (injection, XSS, auth issues, data leaks)
10. **File References**: Use `file:line` format for all code references
11. **Cleanup**: Always teardown worktree after review unless `--keep-worktree`

## Example Usage

```bash
# Review GitHub PR (deep) - creates isolated worktree
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123

# Quick review of PR (still uses worktree, fewer files)
/schovi:review #123 --quick

# Keep worktree for follow-up work
/schovi:review #123 --keep-worktree

# Review Jira ticket (no worktree, uses current codebase)
/schovi:review EC-1234

# Review local file
/schovi:review ./spec-EC-1234.md

# Review GitHub issue
/schovi:review https://github.com/owner/repo/issues/456
```

## Execution Instructions

**YOU MUST**:

1. Parse input and classify type correctly
2. Use appropriate subagent for context fetching (fully qualified names)
3. Wait for subagent completion before analysis
4. **For PR reviews - Create isolated worktree** (Phase 2.5):
   - Follow lib/worktree.md to create worktree
   - Use PR branch name from context
   - Purpose: "review: PR #N"
   - All file access happens in worktree path
5. Read source files from worktree (up to 10 for deep, 3 for quick)
6. Analyze **actual source code from worktree**, not just context summaries
7. For deep review: Explore dependencies within worktree
8. For quick review: Read top 3 files only
9. **Generate all required sections**:
   - Summary (2-3 sentences)
   - Risk Assessment (risk level + 2-4 factors)
   - Security Review (concerns OR explicit "no concerns")
   - Performance Impact (concerns OR explicit "no concerns")
   - Key Changes (3+ items with file:line)
   - Issues Found (organized as Must Fix / Should Fix / Consider)
   - Recommendations (2-5 actionable items)
   - Verdict (approval status + merge criteria + fix time estimate)
10. Always perform security analysis on code
11. Provide specific file:line references
12. Prioritize issues by urgency (Must/Should/Consider) with Action items
13. Give 2-5 actionable recommendations
14. Provide clear verdict with merge criteria checklist
15. **Teardown worktree after review** (unless `--keep-worktree`)
16. Output to terminal ONLY (no files)

**YOU MUST NOT**:

1. Create any files or use work folders
2. Skip context fetching phase (Phase 2)
3. Skip worktree creation for PR reviews
4. Proceed without waiting for subagent completion
5. Review PR without using worktree isolation
6. Skip Risk Assessment, Security Review, or Performance Impact sections
7. Give vague suggestions without specific file:line references
8. Miss security vulnerability analysis
9. Provide generic feedback without code-level specifics
10. Skip priority classification for issues
11. Omit Action items from issues or merge criteria from verdict
12. Base review solely on PR descriptions without examining code
13. Leave worktree behind without `--keep-worktree` flag

## Error Handling

- **Invalid input**: Ask user to clarify or provide valid PR/Jira/file
- **Context fetch failure**: Report error and suggest checking credentials/permissions
- **Worktree creation failure**:
  - Check if bare repo clone failed (network, permissions)
  - Check if branch exists on remote
  - Fall back to GitHub API if worktree fails
  - Suggest: `gh auth login` or check network
- **Branch not found on remote**: Report error, check PR is still open
- **Disk space issues**: Suggest cleanup with `/schovi:worktree teardown --all`
- **Worktree already exists**: Reuse existing worktree, run update first
- **File too large**: Note in review, focus on changed sections
- **Empty context**: Report that nothing was found to review
- **Analysis timeout**: Fall back to quick review and notify user
- **Teardown failure**: Warn user, suggest manual cleanup
