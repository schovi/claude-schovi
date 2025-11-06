---
description: Comprehensive code review with issue detection and improvement suggestions
argument-hint: [PR/Jira/issue/file] [--quick]
allowed-tools: ["Task", "Bash", "Read", "Grep", "Glob", "mcp__jetbrains__*"]
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
   - Use Task tool with subagent_type: `schovi:jira-analyzer:jira-analyzer`
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

### Phase 2.5: Source Code Fetching

**For GitHub PRs and issues with code references, fetch actual source code for deeper analysis**.

This phase is **CRITICAL** for providing accurate, code-aware reviews. Skip only for quick reviews or non-code content.

#### Step 1: Identify Files to Fetch

**Extract file paths from fetched context**:

1. **For GitHub PRs**:
   - gh-pr-reviewer returns **ALL changed files** with individual stats
   - Files already include: additions, deletions, total changes, status (added/modified/removed)
   - Files are sorted by changes (descending) for easy prioritization
   - PR head SHA included for fetching

2. **For Jira/GitHub Issues**:
   - Extract file:line references from description/comments
   - May need to search for files if not explicitly mentioned

3. **For file inputs**:
   - Already have content from Phase 2

**Prioritize files for fetching** (up to 10 most relevant for deep review):
- **From PR context**: Top 10 files by total changes (already sorted)
- Files mentioned in PR description or review comments
- Core logic files (controllers, services, models) over config/docs
- Test files related to changes
- Exclude: package-lock.json, yarn.lock, large generated files

#### Step 2: Determine Source Code Access Method

**Check available methods in priority order**:

1. **Local Repository Access** (PREFERRED):
   - Check if current working directory is the target repository
   - For PRs: Use `git remote -v` to verify repo matches PR repository
   - If branch exists locally: Check out the PR branch or use current branch
   - Direct file access via Read tool

2. **JetBrains MCP Integration** (if available):
   - Check if `mcp__jetbrains__*` tools are available
   - Use `mcp__jetbrains__get_file_content` for file reading
   - Use `mcp__jetbrains__search_everywhere` for finding related files
   - Provides IDE-aware context (usages, definitions)

3. **GitHub API Fetch** (fallback):
   - For external repositories or when local access unavailable
   - Use `gh api` to fetch file contents from GitHub
   - Fetch from the PR branch/commit SHA
   - Example: `gh api repos/{owner}/{repo}/contents/{path}?ref={sha}`

#### Step 3: Fetch Source Files

**Execute fetching based on determined method**:

**Local Repository Method**:
```bash
# Verify we're in correct repo
git remote -v | grep -q "owner/repo"

# For PR review: Optionally fetch and checkout PR branch
gh pr checkout <PR_NUMBER>  # or use existing branch

# Read files directly
# Use Read tool for each file path identified in Step 1
```

**JetBrains MCP Method** (if available):
```
# Use mcp__jetbrains__get_file_content for each file
# This provides IDE context like imports, usages, etc.

# Example:
mcp__jetbrains__get_file_content(file_path: "src/api/controller.ts")
```

**GitHub API Method**:
```bash
# Use PR head SHA from gh-pr-reviewer output
# Extract owner, repo, and headRefOid from PR summary

# For each file path:
gh api repos/{owner}/{repo}/contents/{file_path}?ref={headRefOid} \
  --jq '.content' | base64 -d

# Alternative: Use gh pr diff for changed files
gh pr diff <PR_NUMBER>

# Note: headRefOid (commit SHA) from full mode summary ensures exact version
```

#### Step 4: Store Fetched Content

**Organize fetched code for analysis**:

1. **Create in-memory file map**:
   - Key: file path (e.g., "src/api/controller.ts")
   - Value: file content or relevant excerpt
   - Include line numbers for changed sections

2. **Handle large files**:
   - For files >500 lines, fetch only changed sections ±50 lines of context
   - Use `git diff` with context lines: `gh pr diff <PR> --patch`
   - Store full path + line ranges

3. **Capture metadata**:
   - File size, lines changed (additions/deletions)
   - File type/language
   - Related test files

#### Step 5: Fetch Related Dependencies (Deep Review Only)

**For deep reviews, explore related code**:

1. **Identify dependencies**:
   - Parse imports/requires from fetched files
   - Find files that import changed files (reverse dependencies)
   - Locate test files for changed code

2. **Fetch related files**:
   - Use Grep tool to find related code: `import.*from.*{filename}`
   - Use Glob tool to find test files: `**/*{filename}.test.*`
   - Read up to 5 most relevant related files

3. **Build call graph context**:
   - Identify functions/methods changed
   - Find callers of those functions
   - Track data flow through changed code

#### Error Handling

**Handle fetching failures gracefully**:

- **Local repo not available**: Fall back to GitHub API or proceed with context summary only
- **GitHub API rate limit**: Use available context, note limitation in review
- **File too large**: Fetch diff sections only, note in review
- **Branch/commit not found**: Use main/master branch, add warning
- **Authentication failure**: Proceed with summary context, suggest `gh auth login`

**Always notify user of fetching method used**:
```
📥 Fetching source code via [local repository / JetBrains MCP / GitHub API]
📄 Retrieved X files (Y lines total)
```

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

## Quality Gates

**Before presenting review, verify**:

- ✅ Context successfully fetched (or file read)
- ✅ Source code fetched (deep review) or diff retrieved (quick review)
- ✅ Fetching method reported to user (local/JetBrains/GitHub)
- ✅ Analysis completed on actual source code (deep or quick as requested)
- ✅ Summary section with 2-3 sentence overview
- ✅ Risk Assessment section with risk level and 2-4 factors
- ✅ Security Review section present (concerns found OR explicit "no concerns")
- ✅ Performance Impact section present (concerns found OR explicit "no concerns")
- ✅ At least 3 key changes/info points identified with specific code references
- ✅ Issues section organized by priority (Must Fix / Should Fix / Consider)
- ✅ Each issue includes file:line reference and Action recommendation
- ✅ 2-5 recommendations provided with benefits and optional code examples
- ✅ File references use `file:line` format for all code mentions
- ✅ Verdict section with approval status (Approve/Approve with changes/Needs work/Blocked)
- ✅ Merge Criteria checklist with specific requirements from Must Fix and Should Fix
- ✅ Estimated Fix Time provided

## Important Rules

1. **No File Output**: This command outputs to terminal ONLY, no file creation
2. **No Work Folder Integration**: Does not use work folder system (unlike implement/debug)
3. **Context Isolation**: Always use subagents for external data fetching
4. **Holistic Assessment**: Always include Risk, Security, and Performance sections (even if no concerns)
5. **Priority-Based Issues**: Organize issues by priority (Must Fix / Should Fix / Consider), not just severity
6. **Actionable Feedback**: All issues and recommendations must include specific Action items
7. **Clear Verdict**: Provide explicit merge decision with criteria checklist and estimated fix time
8. **Security Focus**: Always check for common vulnerabilities (injection, XSS, auth issues, data leaks)
9. **File References**: Use `file:line` format for all code references

## Example Usage

```bash
# Review GitHub PR (deep)
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123

# Quick review of PR
/schovi:review #123 --quick

# Review Jira ticket
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
4. **Execute Phase 2.5: Source Code Fetching** (critical for accurate reviews):
   - Identify files to fetch from context
   - Determine access method (local > JetBrains > GitHub)
   - Fetch source files (up to 10 for deep, up to 3 for quick)
   - Notify user of fetching method and file count
   - Handle errors gracefully, fall back when needed
5. Analyze **actual fetched source code**, not just context summaries
6. For deep review: Fetch dependencies and use Explore for additional context
7. For quick review: Fetch minimal files (top 3) or use diff only
8. **Generate all required sections**:
   - Summary (2-3 sentences)
   - Risk Assessment (risk level + 2-4 factors)
   - Security Review (concerns OR explicit "no concerns")
   - Performance Impact (concerns OR explicit "no concerns")
   - Key Changes (3+ items with file:line)
   - Issues Found (organized as Must Fix / Should Fix / Consider)
   - Recommendations (2-5 actionable items)
   - Verdict (approval status + merge criteria + fix time estimate)
9. Always perform security analysis on fetched code
10. Provide specific file:line references from actual code
11. Prioritize issues by urgency (Must/Should/Consider) with Action items
12. Give 2-5 actionable recommendations with benefits and optional code examples
13. Provide clear verdict with merge criteria checklist and estimated fix time
14. Check all quality gates before output
15. Output to terminal ONLY (no files)

**YOU MUST NOT**:

1. Create any files or use work folders
2. Skip context fetching phase (Phase 2)
3. Skip source code fetching phase (Phase 2.5) without valid reason
4. Proceed without waiting for subagent completion
5. Review without fetching actual source code (except quick mode fallback)
6. Skip Risk Assessment, Security Review, or Performance Impact sections
7. Give vague suggestions without specific file:line references from fetched code
8. Miss security vulnerability analysis on actual code
9. Provide generic feedback without code-level specifics
10. Skip priority classification for issues (Must Fix / Should Fix / Consider)
11. Omit Action items from issues or merge criteria from verdict
12. Base review solely on PR descriptions without examining code

## Error Handling

- **Invalid input**: Ask user to clarify or provide valid PR/Jira/file
- **Context fetch failure**: Report error and suggest checking credentials/permissions
- **Source code fetch failure**:
  - Try alternate methods (local → JetBrains → GitHub)
  - Fall back to diff-based review if all methods fail
  - Notify user of limitation and suggest fixes
- **Repository mismatch**: Notify user if reviewing external repo from different local repo
- **Branch not found**: Fall back to main/master branch with warning
- **File too large**: Fetch diff sections only, note in review
- **GitHub API rate limit**: Use local/JetBrains if available, or note limitation
- **Empty context**: Report that nothing was found to review
- **Analysis timeout**: Fall back to quick review and notify user
