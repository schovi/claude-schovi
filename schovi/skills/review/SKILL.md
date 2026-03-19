---
name: review
description: Comprehensive code review with issue detection and improvement suggestions. Use when the user says "/schovi:review", asks to "review a PR", "review this code", "code review", or provides a PR URL/number for review. Supports GitHub PRs, Jira tickets, GitHub issues, and local files.
disable-model-invocation: false
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

### Phase 2.5: Source Code Fetching

**For GitHub PRs, fetch source code for analysis**.

#### Step 1: Identify Files to Review

**Extract file paths from PR context**:

- gh-pr-reviewer returns **ALL changed files** with stats
- Files include: additions, deletions, total changes, status
- Files are sorted by changes (descending)

**Prioritize files** (up to 10 for deep review, 3 for quick):
- Top files by total changes
- Core logic files (controllers, services, models) over config/docs
- Test files related to changes
- Exclude: package-lock.json, yarn.lock, generated files

#### Step 2: Read Source Files

**Use local filesystem when in the same repo, otherwise fetch via GitHub API**:

```bash
# For local repo - read files directly with Read tool
# For remote repos - use gh api to fetch file contents
gh api repos/OWNER/REPO/contents/PATH?ref=BRANCH
```

**For deep reviews, also fetch**:
- Related dependencies (imports/requires)
- Reverse dependencies (files importing changed files)
- Test files for changed code

#### For Non-PR Reviews (Jira, files, free-form)

- Jira/GitHub issues: Read files from current directory
- File paths: Read directly
- Free-form: Use current codebase context

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
   - Inefficient algorithms (O(n^2) when O(n) possible)
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
# Code Review: [Input Identifier]

## Summary

[2-3 sentence overview of what's being reviewed and overall assessment]

## Risk Assessment

**Risk Level:** [Low / Low-Medium / Medium / Medium-High / High]

[2-4 bullet points explaining risk factors]:
- [Technical risk factors: complexity, scope, affected systems]
- [Test coverage status: comprehensive/partial/missing]
- [Data/schema changes: yes/no and impact]
- [Dependencies: new dependencies, breaking changes, version updates]
- [Deployment risk: can be deployed independently / requires coordination]

## Security Review

[Security assessment - always include even if no concerns]:

**If concerns found**:
- [Specific security issue with file:line reference]
- [Classification: SQL injection, XSS, auth bypass, data leak, etc.]
- [Impact assessment and recommendation]

**If no concerns**:
- [Verified: appropriate auth/validation patterns]
- [Data handling: proper sanitization/escaping]
- [Access control: correct permissions/authorization]

## Performance Impact

[Performance assessment - always include]:

**If concerns found**:
- [Specific performance issue with file:line reference]
- [Classification: N+1 queries, memory leak, inefficient algorithm, etc.]
- [Expected impact and recommendation]

**If no concerns**:
- [Database queries: optimized / no new queries / properly indexed]
- [Memory handling: appropriate / no leaks detected]
- [Algorithm efficiency: acceptable complexity / optimized]

## Key Changes

[Bullet list where each item has a 2-5 word title and sub-bullets with details]

- **2-5 word title**
  - Short detail with file:line reference
  - Short detail with file:line reference
- **Another 2-5 word title**
  - Short detail
  - Short detail

## Issues Found

[Identified problems, bugs, concerns - organized by priority and severity]

### Must Fix
[Critical issues that MUST be addressed before merge]

1. **Issue title** (file:line)
   - Description of the issue with code evidence
   - Why it's critical (impact, risk, blockers)
   - **Action:** Specific fix recommendation

### Should Fix
[Important issues that SHOULD be addressed]

2. **Issue title** (file:line)
   - Description of the issue
   - Why it's important (technical debt, maintainability, bugs)
   - **Action:** Specific fix recommendation

### Consider
[Minor issues or suggestions that can be addressed later]

3. **Issue title** (file:line)
   - Description of the concern
   - Optional improvement or nice-to-have
   - **Action:** Suggestion for improvement

[If no issues found: "No significant issues identified"]

## Recommendations

[2-5 actionable suggestions for improvement, can include code examples]

1. **Recommendation title** (file:line if applicable)
   - Explanation of improvement
   - Expected benefit
   - [Optional: Code example showing before/after]

## Verdict

**[Approve with changes / Approve / Needs work / Blocked]**

[1-2 sentences explaining verdict reasoning]

**Merge Criteria:**
- [ ] [Specific requirement from Must Fix items]
- [ ] [Specific requirement from Should Fix items]
- [ ] [Optional: Additional verification or testing needed]

**Estimated Fix Time:** [X minutes/hours for addressing Must Fix + Should Fix items]
```

---

## Quality Gates

**Before presenting review, verify**:

- Context successfully fetched via subagent
- Source code fetched (deep: up to 10 files, quick: up to 3 files)
- Analysis completed on actual source code
- Summary section with 2-3 sentence overview
- Risk Assessment section with risk level and 2-4 factors
- Security Review section present (concerns found OR explicit "no concerns")
- Performance Impact section present (concerns found OR explicit "no concerns")
- At least 3 key changes/info points identified with specific code references
- Issues section organized by priority (Must Fix / Should Fix / Consider)
- Each issue includes file:line reference and Action recommendation
- 2-5 recommendations provided with benefits
- File references use `file:line` format for all code mentions
- Verdict section with approval status
- Merge Criteria checklist with specific requirements

## Important Rules

1. **No File Output**: This command outputs to terminal ONLY, no file creation
2. **Context Isolation**: Always use subagents for external data fetching
3. **Holistic Assessment**: Always include Risk, Security, and Performance sections (even if no concerns)
4. **Priority-Based Issues**: Organize issues by priority (Must Fix / Should Fix / Consider)
5. **Actionable Feedback**: All issues and recommendations must include specific Action items
6. **Clear Verdict**: Provide explicit merge decision with criteria checklist and estimated fix time
7. **Security Focus**: Always check for common vulnerabilities (injection, XSS, auth issues, data leaks)
8. **File References**: Use `file:line` format for all code references

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

## Error Handling

- **Invalid input**: Ask user to clarify or provide valid PR/Jira/file
- **Context fetch failure**: Report error and suggest checking credentials/permissions
- **File too large**: Note in review, focus on changed sections
- **Empty context**: Report that nothing was found to review
- **Analysis timeout**: Fall back to quick review and notify user