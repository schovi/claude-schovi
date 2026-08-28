---
name: review
description: "Structured code review with risk, security, and performance assessment. Use when the user says \"/schovi:review\", \"review this PR\", \"review #123\", \"code review\", or asks for a review of a GitHub PR, a tracker ticket, any source URL, a branch, or local files."
disable-model-invocation: false
user-invocable: true
---

# Review

Structured code review: risk, security, performance, issues, verdict.

Casual PR mentions ("what is #123 about?") belong to `gh-pr-auto-detector`, not here. Posting the findings back to GitHub belongs to `/schovi:feedback`.

**Report every issue you find, then rank it.** Don't pre-filter to what feels important enough to mention. The Must Fix / Should Fix / Consider split is the filter, and it happens after the search, not during it.

```bash
/schovi:review https://github.com/owner/repo/pull/123
/schovi:review owner/repo#123
/schovi:review #123
/schovi:review PROJ-123
/schovi:review https://any/source/url
/schovi:review ./spec.md
/schovi:review this branch
```

For a faster, shallower pass, lower the session effort rather than asking for a lighter review.

## Codex

If custom subagents are unavailable, run the fetch inline with the `gh` commands in `plugins/schovi/agents/gh-pr-reviewer/AGENT.md`, then review as written below.

---

## 1. Get the code

**GitHub PR** (URL, `owner/repo#123`, or `#123`). For a bare number, resolve the repo from conversation history, then `git remote get-url origin`, then ask.

- **PR is in the current repo**: read it directly. `gh pr diff <N>` plus `gh pr view <N> --json title,body,reviews,comments` and `gh pr checks <N>`. Faster than a subagent round-trip and you keep full fidelity
- **PR is in another repo, or is very large**: spawn `schovi:gh-pr-reviewer:gh-pr-reviewer`

**Ticket key or any other source URL**: read the plugin's `../../references/sources.md` and follow it. It resolves the reference against whatever tracker, doc tool, or vendor owns the host, and returns the criteria to review against.

**Local branch** (`this branch` or no argument): `git diff` against the base branch.

**File path**: read it.

## 2. Read enough to be right

The diff alone hides most real bugs. Open the files it touches in full, so you can see the function the changed line sits in and the invariants around it. Then follow what the change actually depends on: what the changed code imports, and what imports the changed code. A caller that now gets a different return shape is the bug the diff can't show you.

Read what the change warrants. A one-line config edit needs its call sites; a refactor across a service needs the surface it touches. Skip lock files and generated output. If you stopped short of something relevant, say so in the review rather than reviewing it blind.

## 3. Analyze

Across every dimension:

- **Functionality**: edge cases, error handling, return values, does it do what the PR says it does
- **Security**: injection, XSS, auth and authorization gaps, data leaks, missing input validation, CSRF
- **Performance**: N+1 queries, leaks, wrong complexity, unnecessary re-renders
- **Testing**: is the changed behavior covered, which scenarios are missing, are the tests meaningful
- **Architecture**: coupling, cohesion, separation of concerns, whether this fits how the repo already works
- **Quality**: readability, duplication, single responsibility, complexity

And scan for the recurring ones: TODO/FIXME left behind, debug logging, commented-out code, hardcoded values and magic numbers, inconsistent naming, unhandled async errors, race conditions, leaked resources.

Every finding carries `file:line` and the evidence that makes it a finding. If you're unsure whether something is real, say it's uncertain and what would settle it. Don't drop it, and don't state it as fact.

## 4. Output

Terminal only. No files.

```markdown
# Code Review: [identifier]

## Summary

[2-3 sentences: what this does and where it stands.]

## Risk Assessment

**Risk Level:** [Low / Low-Medium / Medium / Medium-High / High]

- [Technical risk, test coverage, data/schema changes, deployment risk]

## Security Review

[Always present. Concerns get file:line, classification, impact, recommendation.
Nothing found: say what you actually verified, don't just say "no issues".]

## Performance Impact

[Always present. Same shape.]

## Key Changes

- **[2-5 word title]**
  - [detail with file:line]

## Issues Found

### Must Fix
1. **[Title]** (file:line)
   - [What's wrong, with the code as evidence]
   - [Why it blocks]
   - **Action:** [the fix]

### Should Fix
### Consider

## Recommendations

1. **[Title]** (file:line)
   - [Explanation and expected benefit]

## Verdict

**[Approve / Approve with changes / Needs work / Blocked]**

[1-2 sentences of reasoning.]

**Merge Criteria:**
- [ ] [from Must Fix and Should Fix]
```

Omit sections with nothing in them, except Security and Performance, which always get an answer.

## Failure modes

PR not found: check the number and repo. Auth failure: `gh auth login`. Bare `#123` with no resolvable repo: ask for `owner/repo#123`. Nothing to review: say so rather than reviewing an empty diff.
