---
name: review
description: "Code review and GitHub PR context. Two modes: (1) Explicit /schovi:review for structured code review of PRs, Jira tickets, or local files. (2) Auto-detection: when user mentions GitHub PRs (URLs, #123, owner/repo#123, 'PR #123') and needs context (asking questions, checking CI, requesting review), automatically fetches PR summary via gh-pr-reviewer subagent. Skips auto-fetch for past tense mentions, passive listings, or already-fetched PRs."
disable-model-invocation: false
user-invocable: true
---

# Review Skill

Unified skill for GitHub PR context fetching and structured code review.

## Two Modes

### Mode 1: Explicit Review (`/review <arg>`)

Full structured code review with Risk, Security, Performance, Issues, and Verdict sections.

### Mode 2: Auto-Detection (PR mentions in conversation)

When user mentions a PR and needs context, fetch PR summary and integrate into response. No formal review output, just natural context integration.

---

## Mode Selection

**Explicit review** when:
- User invokes `/schovi:review <arg>`
- User says "review this PR", "review #123", "code review"

**Auto-detection** when:
- User asks about a PR: "What is #123 about?", "What's in owner/repo#456?"
- User checks status: "Did CI pass on #123?", "Is #456 approved?"
- User needs context: "Apply changes from #123", "Why did #123 fail?"
- User compares: "Compare #123 and #456"

**Skip auto-detection** when:
- Past tense: "I merged #123 yesterday", "Fixed in #456"
- Passive listing: "Released with #123, #124, #125"
- Technical identifier: "The PR-123 endpoint", "Variable pr_456_result"
- Already fetched this session (check transcript for previous gh-pr-reviewer calls)

---

## PR Pattern Recognition

Detect these patterns in user messages:

- **Full URL**: `https://github.com/owner/repo/pull/123`
- **Short form**: `owner/repo#123`
- **Hash-only**: `#123` (resolve repo from `git remote get-url origin`)
- **Explicit**: "PR #123", "pull request 123"

**Repository resolution for #number only:**
1. Check conversation history for previous repo context
2. Check cwd: `git remote get-url origin` → parse owner/repo
3. If neither works, ask user to clarify

---

## Mode 2: Auto-Detection Workflow

### Step 1: Detect & Evaluate

Scan message for PR patterns. For each match, evaluate whether context is genuinely needed (see selection rules above).

### Step 2: Fetch PR Context

Spawn gh-pr-reviewer subagent:

```
Tool: Agent
Parameters:
  subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
  prompt: "Fetch and summarize GitHub PR: [owner/repo#number or URL]"
  description: "Fetching GitHub PR context"
```

### Step 3: Integrate Naturally

Use the summary to answer the user's question. Don't regurgitate the full summary, extract the relevant parts.

**Multiple PRs:** Fetch max 3 per response. Launch in parallel when independent.

**Session memory:** Don't re-fetch PRs already fetched in this conversation. Reuse previous context. Re-fetch only if user explicitly requests fresh data or needs different aspects.

---

## Mode 1: Explicit Review Workflow

### Phase 1: Input Parsing & Classification

**Input Types**:
- GitHub PR: URL, `owner/repo#123`, or `#123`
- Jira ID: `EC-1234`, `IS-8046`, etc.
- File path: `./path/to/file.md` or absolute path
- `this branch` / no arg: local diff review against base branch
- Free-form: description text

**Flags**:
- `--quick`: Lighter analysis, faster results
- Default: Deep review

### Phase 2: Context Fetching

**GitHub PR**:
- Spawn `schovi:gh-pr-reviewer:gh-pr-reviewer` via Agent tool
- Returns all changed files with stats, diff, reviews, CI checks

**Jira Issue**:
- Spawn `schovi:jira-auto-detector:jira-analyzer` via Agent tool

**Local branch** (`this branch` or no arg):
- Run `git diff` against base branch
- List changed files

**File Path**:
- Read file directly

### Phase 2.5: Source Code Fetching (PRs only)

**Prioritize files** (up to 10 for deep, 3 for quick):
- Top files by total changes
- Core logic files over config/docs
- Related test files
- Exclude: lock files, generated files

**Fetch strategy:**
- Local filesystem when in same repo (preferred)
- GitHub API for remote repos: `gh api repos/OWNER/REPO/contents/PATH?ref=BRANCH`

**Deep review also fetches:**
- Related dependencies (imports)
- Reverse dependencies (files importing changed files)

### Phase 3: Review Analysis

#### Deep Review (Default)

**Direct code analysis on fetched files:**
- Review changed sections with full file context
- Cross-reference between related files
- Verify imports/exports

**Multi-dimensional analysis:**

- **Functionality**: Edge cases, error handling, return values
- **Code Quality**: Readability, DRY, single responsibility, complexity
- **Security** (CRITICAL): SQL injection, XSS, auth issues, data leaks, input validation, CSRF
- **Performance**: N+1 queries, memory leaks, inefficient algorithms, unnecessary re-renders
- **Testing**: Coverage for changed code, missing scenarios, test quality
- **Architecture**: Design patterns, coupling, cohesion, separation of concerns

**Common issue scan:**
- TODO/FIXME comments, console.log in production, commented-out code
- Hardcoded values, magic numbers, inconsistent naming
- Missing error handling in async code, race conditions, resource leaks

#### Quick Review (--quick)

- Use diff only, limit to 3 most important files
- No dependency exploration
- Focus on obvious issues and high-level patterns

### Phase 4: Structured Output

Terminal only, no file creation.

```markdown
# Code Review: [Input Identifier]

## Summary

[2-3 sentence overview and overall assessment]

## Risk Assessment

**Risk Level:** [Low / Low-Medium / Medium / Medium-High / High]

- [Technical risk factors]
- [Test coverage status]
- [Data/schema changes]
- [Dependencies / deployment risk]

## Security Review

[Security assessment, always include even if no concerns]

**If concerns:** Specific issue with file:line, classification, impact, recommendation
**If none:** Verified auth/validation patterns, proper sanitization, correct permissions

## Performance Impact

[Performance assessment, always include]

**If concerns:** Specific issue with file:line, classification, expected impact
**If none:** Queries optimized, no leaks, acceptable complexity

## Key Changes

- **2-5 word title**
  - Detail with file:line reference
- **Another title**
  - Detail with file:line reference

## Issues Found

### Must Fix
[Critical issues that block merge]

1. **Issue title** (file:line)
   - Description with code evidence
   - Why it's critical
   - **Action:** Specific fix

### Should Fix
[Important but not blocking]

### Consider
[Minor suggestions for later]

## Recommendations

1. **Title** (file:line if applicable)
   - Explanation and expected benefit

## Verdict

**[Approve / Approve with changes / Needs work / Blocked]**

[1-2 sentences reasoning]

**Merge Criteria:**
- [ ] [From Must Fix items]
- [ ] [From Should Fix items]
```

---

## Error Handling

- **PR not found**: Report error, suggest checking PR number and repository
- **Auth failure**: Suggest `gh auth login`
- **Missing repo context**: Ask user to specify as `owner/repo#123`
- **Fetch timeout**: Fall back to quick review, notify user
- **Empty context**: Report nothing found to review

## Example Usage

```bash
# Explicit review
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123
/schovi:review #123 --quick
/schovi:review EC-1234
/schovi:review ./spec.md
/schovi:review this branch

# Auto-detection (no /review needed)
"What is #123 about?"          → fetches PR context
"Did CI pass on #456?"         → fetches CI status
"Compare #123 and #456"        → fetches both PRs
"I merged #123 yesterday"      → skips (past tense)
```
