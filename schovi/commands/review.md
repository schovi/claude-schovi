---
description: Comprehensive code review with issue detection and improvement suggestions
argument-hint: [PR/Jira/issue/file] [--quick]
allowed-tools: ["Task", "Bash", "Read", "Grep", "Glob"]
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
   - Use Task tool with subagent_type: `schovi:gh-pr-analyzer:gh-pr-analyzer`
   - Prompt: "Fetch and summarize GitHub PR [input]"
   - Description: "Fetching GitHub PR summary"

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

### Phase 3: Review Analysis

#### Deep Review (Default)

**Comprehensive analysis with codebase exploration**:

1. **Code Exploration** (for PRs/code changes):
   - Use Task tool with subagent_type: `Explore`
   - Set thoroughness: `very thorough`
   - Prompt: "Analyze the following changes and codebase context:
     - Read all changed files mentioned in the context
     - Explore related files and dependencies
     - Identify patterns, anti-patterns, and code quality issues
     - Check for security vulnerabilities (SQL injection, XSS, auth issues, data leaks)
     - Analyze test coverage and edge cases
     - Review error handling and logging
     - Context: [fetched context summary]"
   - Description: "Performing deep code analysis"

2. **Multi-dimensional Analysis**:
   - **Functionality**: Does it solve the problem? Edge cases covered?
   - **Code Quality**: Readability, maintainability, patterns
   - **Security**: Vulnerabilities, data exposure, auth/authz
   - **Performance**: Inefficiencies, N+1 queries, memory leaks
   - **Testing**: Coverage, test quality, missing scenarios
   - **Architecture**: Design patterns, coupling, cohesion
   - **Documentation**: Comments, docs, clarity

#### Quick Review (--quick flag)

**Lighter analysis without codebase exploration**:

1. **Context-based Analysis**:
   - Review fetched context summary only
   - No deep file exploration
   - Focus on obvious issues and high-level patterns
   - Fast turnaround (30-60 seconds)

2. **Focus Areas**:
   - Summary of changes/content
   - Obvious code quality issues from diff
   - Critical security concerns (if visible)
   - High-level improvement suggestions

### Phase 4: Structured Output

**Generate comprehensive review output** (no file output, terminal only):

```markdown
# 🔍 Code Review: [Input Identifier]

## 📝 Summary

[2-3 sentence overview of what's being reviewed and overall assessment]

## 🔍 Key Changes/Information

[Bullet points of major changes, features, or information]

- Change/info 1 with file:line references
- Change/info 2 with file:line references
- Change/info 3 with file:line references
- ...

## ⚠️ Potential Issues

[Identified problems, bugs, security concerns - organized by severity]

### 🚨 Critical
- Issue with file:line reference and explanation
- ...

### ⚠️ Medium
- Issue with file:line reference and explanation
- ...

### 💭 Minor
- Issue with file:line reference and explanation
- ...

[If no issues found: "✅ No significant issues identified"]

## 💡 Improvement Suggestions

[2-5 actionable suggestions for improvement]

1. **Suggestion title** (file:line if applicable)
   - Explanation of improvement
   - Expected benefit

2. **Suggestion title**
   - Explanation
   - Benefit

[Continue for 2-5 suggestions]

## 🎯 Overall Assessment

[Final verdict: Approve with minor changes / Needs work / Blocked by issues]
[1-2 sentences with overall recommendation]
```

## Quality Gates

**Before presenting review, verify**:

- ✅ Context successfully fetched (or file read)
- ✅ Analysis completed (deep or quick as requested)
- ✅ At least 3 key changes/info points identified
- ✅ Issues section populated (or explicitly marked as none found)
- ✅ 2-5 improvement suggestions provided
- ✅ File references use `file:line` format when applicable
- ✅ Overall assessment with clear recommendation

## Important Rules

1. **No File Output**: This command outputs to terminal ONLY, no file creation
2. **No Work Folder Integration**: Does not use work folder system (unlike implement/debug)
3. **Context Isolation**: Always use subagents for external data fetching
4. **Security Focus**: Always check for common vulnerabilities (injection, XSS, auth issues, data leaks)
5. **Actionable Feedback**: All suggestions must be specific and actionable
6. **Severity Classification**: Issues must be categorized by severity (Critical/Medium/Minor)
7. **File References**: Use `file:line` format for all code references

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
4. For deep review: Use Explore subagent for code analysis
5. For quick review: Analyze context summary only
6. Always include security analysis
7. Provide specific file:line references
8. Categorize issues by severity
9. Give 2-5 actionable improvements
10. Check all quality gates before output
11. Output to terminal ONLY (no files)

**YOU MUST NOT**:

1. Create any files or use work folders
2. Skip context fetching phase
3. Proceed without waiting for subagent completion
4. Give vague suggestions without file references
5. Miss security vulnerability analysis
6. Provide generic feedback without specifics
7. Skip severity classification for issues

## Error Handling

- **Invalid input**: Ask user to clarify or provide valid PR/Jira/file
- **Fetch failure**: Report error and suggest checking credentials/permissions
- **Empty context**: Report that nothing was found to review
- **Analysis timeout**: Fall back to quick review and notify user
