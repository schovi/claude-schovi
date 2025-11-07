# `/schovi:review` Command

## Description

Comprehensive code review with issue detection and improvement suggestions. Fetches actual source code and performs deep analysis with security, performance, and quality checks. Focused on GitHub PRs but supports Jira tickets, GitHub issues, and documents.

## Purpose

Provide thorough code review with:
- Actual source code fetching (not just PR descriptions)
- Multi-dimensional analysis (functionality, quality, security, performance, testing, architecture)
- Priority-based issues (Must Fix / Should Fix / Consider)
- Clear verdict with merge criteria
- Actionable feedback with specific file:line references

## Workflow

1. **Phase 1: Input Parsing & Classification** - Parse and classify input (PR, Jira, issue, file, free-form)
2. **Phase 2: Context Fetching** - Use appropriate subagent to fetch context (gh-pr-reviewer, jira-analyzer, gh-issue-analyzer)
3. **Phase 2.5: Source Code Fetching** - Fetch actual source files for code-level analysis (local filesystem, JetBrains MCP, or GitHub API)
4. **Phase 3: Review Analysis** - Direct code analysis on fetched files with deep exploration (default) or quick review (--quick flag)
5. **Phase 4: Structured Output** - Terminal-only output with summary, key changes, issues, improvements

## Input Sources

- GitHub PRs (via `gh-pr-reviewer` subagent for full diff)
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- File paths (via Read tool)
- Free-form descriptions

## Review Modes

### Deep Review (default)
Comprehensive analysis with actual source code fetching and exploration:
- Fetches up to 10 source files via local filesystem, JetBrains MCP, or GitHub API
- Direct code analysis on fetched files (not just summaries)
- Fetches related dependencies and test files
- Multi-dimensional analysis (functionality, quality, security, performance, testing, architecture)
- Code-specific issue detection (TODO comments, console.log, hardcoded values, etc.)
- Security focus with actual code inspection (SQL injection, XSS, auth issues, data leaks)
- Optional Explore subagent for additional context
- Takes 2-5 minutes

### Quick Review (--quick)
Lighter analysis with minimal file fetching:
- Fetches up to 3 most important files or uses diff only
- No dependency exploration
- Context-based analysis with limited code inspection
- Focus on obvious issues and high-level patterns
- Takes 30-60 seconds

## Key Features

- **Actual Source Code Analysis**: Fetches and reviews real source files (not just PR descriptions)
- **Multi-source Fetching**: Local filesystem (preferred), JetBrains MCP, or GitHub API fallback
- **Smart File Prioritization**: Fetches most relevant files based on changes and impact
- **Dependency Exploration**: Discovers and analyzes related files and test coverage
- **Holistic Assessment**: Risk, Security, and Performance sections always included
- **Priority-Based Issues**: Organizes by urgency (Must Fix / Should Fix / Consider) with Action items
- **Clear Verdict**: Explicit merge decision with criteria checklist and estimated fix time
- **Terminal Output Only**: No file creation, no work folder integration
- **Security Focus**: Code-level vulnerability detection (SQL injection, XSS, auth issues)
- **Code-Specific Issues**: Detects TODO comments, debug statements, hardcoded values
- **Actionable Feedback**: Specific file:line references with Action recommendations

## Output Structure

```
# 🔍 Code Review: [Input Identifier]

## 📝 Summary
[2-3 sentence overview and overall assessment]

## 🎯 Risk Assessment
**Risk Level:** Low/Medium/High
- Technical risk factors, test coverage, deployment risk

## 🔒 Security Review
✅ No concerns / ⚠️ Concerns identified
- Verified security patterns or specific issues

## ⚡ Performance Impact
✅ No concerns / ⚠️ Concerns identified
- Database queries, memory handling, algorithm efficiency

## 🔍 Key Changes/Information
- **2-5 word title**
  - Short detail with file:line reference

## ⚠️ Issues Found
### 🚨 Must Fix
1. **Issue** (file:line) - **Action:** Fix recommendation

### ⚠️ Should Fix
2. **Issue** (file:line) - **Action:** Fix recommendation

### 💭 Consider
3. **Issue** (file:line) - **Action:** Suggestion

## 💡 Recommendations
1-5 actionable suggestions with benefits and optional code examples

## 🎯 Verdict
**⚠️ Approve with changes / ✅ Approve / 🚫 Needs work / ❌ Blocked**

**Merge Criteria:**
- [ ] Specific requirements from Must Fix items

**Estimated Fix Time:** X minutes/hours
```

## Dependencies

### Calls
- `gh-pr-reviewer` agent (for GitHub PR input with full diff)
- `jira-analyzer` agent (for Jira input)
- `gh-issue-analyzer` agent (for GitHub issue input)
- Explore subagent (optional, for additional context)
- Read tool (for local file fetching)
- JetBrains MCP tools (optional, for IDE integration)
- GitHub API via Bash (for remote file fetching)
- `code-fetcher` library (for source code fetching strategies)

### Called By
- User invocation (standalone command)

## Usage Examples

```bash
# Deep review of GitHub PR
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123

# Quick review
/schovi:review #123 --quick

# Review Jira ticket
/schovi:review EC-1234

# Review local file
/schovi:review ./spec-EC-1234.md
```

## Quality Gates

All must be met before output:
- Context successfully fetched from external sources
- Source code fetched via local/JetBrains/GitHub (with method reported to user)
- Analysis completed on actual code (deep or quick mode)
- Summary with 2-3 sentence overview
- Risk Assessment with risk level and 2-4 factors
- Security Review section present (concerns found OR explicit "no concerns")
- Performance Impact section present (concerns found OR explicit "no concerns")
- At least 3 key changes/info points identified with specific code references
- Issues organized by priority (Must Fix / Should Fix / Consider) with Action items
- 2-5 recommendations with benefits and optional code examples
- All file references use `file:line` format
- Verdict with approval status, merge criteria checklist, and estimated fix time

## Integration

Standalone command (not integrated with implement/debug workflows).

## Location

`schovi/commands/review.md`
