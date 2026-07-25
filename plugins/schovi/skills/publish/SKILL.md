---
name: publish
description: Create GitHub pull request with smart description generation. Use when the user says "/schovi:publish", asks to "create a PR", "publish", "open a pull request", or wants to push and create/update a GitHub PR. Auto-commits uncommitted changes first.
disable-model-invocation: false
---

# Publish

Owns the whole "I'm done, ship it" pipeline: commit whatever is pending, push, then create or update a draft PR with a description worth reading.

Always: draft PR, default branch as base (from `origin/HEAD`), auto-push, auto-commit pending changes first.

```bash
/schovi:publish              # from commit history
/schovi:publish EC-1234      # from a Jira issue
/schovi:publish #123         # from a GitHub issue/PR
/schovi:publish owner/repo#45
/schovi:publish ./spec.md    # or ./folder/
/schovi:publish https://...
/schovi:publish "some text"
```

## Codex

If custom subagents are unavailable, commit inline and gather context with available Codex tools. For GitHub references use the `gh` workflow in `plugins/schovi/agents/gh-pr-reviewer/AGENT.md`.

---

## 1. Parse the input

One optional positional argument. Detect its type in this order, most specific first:

1. **Jira**: `[A-Z]{2,10}-\d{1,6}`
2. **GitHub**: `#\d+`, `owner/repo#\d+`, or a GitHub URL
3. **File**: the path exists and is a file
4. **Folder**: the path exists and is a directory
5. **URL**: starts with `http`
6. **Text**: anything else
7. **None**

With no Jira ID in the input, take one from the branch name (`EC-1234-add-auth` gives `EC-1234`, `feature/IS-5678-fix-bug` gives `IS-5678`).

## 2. Check the git state

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
git rev-parse --abbrev-ref HEAD
git status --porcelain
gh auth status
gh pr list --head "$(git branch --show-current)" --json number,url,title,isDraft,state
```

Stop if you're on the default branch (they need a feature branch) or `gh` isn't authenticated. Commit any pending changes before continuing, and say that you're doing it. An existing PR for this head means UPDATE mode; nothing found means CREATE.

## 3. Push

The local branch name must always equal the remote branch name, and therefore the PR's `headRefName`. An upstream pointing somewhere else (`origin/main` left over from a merge queue) has to be cleared first, or the push creates a mismatched remote branch.

```bash
LOCAL_BRANCH=$(git branch --show-current)
UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)
if [ -n "$UPSTREAM" ] && [ "${UPSTREAM#origin/}" != "$LOCAL_BRANCH" ]; then
  git branch --unset-upstream
fi
git push -u origin "$LOCAL_BRANCH"
git ls-remote --heads origin "$LOCAL_BRANCH"
```

Never push with a `local:different-remote` refspec.

## 4. Gather context

- **Jira**: read `references/jira.md` in this skill folder and follow it
- **GitHub**: spawn `schovi:gh-pr-reviewer:gh-pr-reviewer` with the reference
- **File**: read it
- **Folder**: read the main document, preferring `spec*.md`, then `plan*.md`, then `README.md`, then the first `.md`
- **URL**: WebFetch it
- **Text**: use it as-is
- **None**: read the commits

```bash
git log origin/$DEFAULT_BRANCH..HEAD --format="%s%n%b" --reverse
git diff origin/$DEFAULT_BRANCH..HEAD --stat
```

**The Context section needs at least one real link.** Collect candidates from the input source, the `JIRA_ID` off the branch, and any links in the commits or fetched content (Datadog, Productboard, related PRs, design docs). If you come up empty, ask for one before writing the description:

```
No source link found for this change. Paste a relevant link (Jira, Datadog,
related PR, Productboard, design doc) so reviewers have context, or reply
"skip" to publish without one.
```

Never invent a link. On "skip", omit the section.

## 5. Write the description

**The reviewer reads the code.** So the description does not explain how the code works or which files changed. It carries what a reader cannot recover from the diff: what was decided, and why.

**Describe the final state, never the evolution.** "The API returns paginated results", not "changed the API to return paginated results". This matters most in UPDATE mode: rewrite the description from scratch for the code as it now stands. No "we changed X to Y", no "updated A to B".

**Describe presence, never absence.** Drop "no schema change", "no behavior change", "nothing else touched" unless you have read the diff and confirmed it. Commit messages and file stats do not prove a negative, and an unverified absence claim waves the reviewer off exactly where they should look.

**No agent-process content.** The description is about the change, not about how you produced it. Leave out TODO checklists, validation narration ("tests pass", "verified locally"), workflow narration ("first I explored the codebase"), and self-reference ("I decided", "as requested"). If validation matters to a reviewer, it belongs in Review Notes as a fact.

Classify it as Bug, New Feature, Enhancement, or Chore, then:

```markdown
## [Bug | New Feature | Enhancement | Chore]

[1-2 sentences on the problem or feature. Link to the spec/Jira/doc rather than restating it.]

## Context

[Links that give a reviewer the full picture: Jira, Datadog, related PRs, Productboard entity, design doc, Slack thread. One per line with a short label.]

## Decisions (only if applicable)

- [Decision] — [why: solves X / improves Y / forced by Z]

## Review Notes (only if applicable)

[Only what the reviewer must do or watch for that isn't in the diff and isn't said above.]

## Notes (only if applicable)

### Breaking Changes
### Migration
[What consumers of the merged code need when upgrading.]
```

Be short. Cut anything the diff already shows.

**Decisions** is the heart of it: the meaningful choices and the reason for each, one line as `decision — why`. The "why" has to add what the code can't (it solves a problem, it was forced by a constraint, it beat a specific alternative). No implementation detail. No decisions, no section.

**Review Notes** is addressed to the reviewer about reviewing and merging. Test every bullet: could they get this from the diff or the sections above? Then cut it. What survives is required actions, merge sequencing, follow-ups, the single riskiest spot, and looks-wrong-but-intentional gotchas. Upgrade steps for consumers go under Notes > Migration instead.

**Title**: `EC-1234: Description` with a Jira ID, otherwise just the description. 50-80 characters, active voice (Add, Fix, Implement, Update), no trailing period. Source it from the spec title, the Jira summary, or the theme of the commits.

## 6. Ship it

```bash
# CREATE
gh pr create --draft --title "[TITLE]" --base "$DEFAULT_BRANCH" --body "$(cat <<'EOF'
[DESCRIPTION]
EOF
)"

# UPDATE
gh pr edit [PR_NUMBER] --body "$(cat <<'EOF'
[DESCRIPTION]
EOF
)"
```

Report the URL, the branch pair, and for a new PR the follow-ups worth knowing: `gh pr edit N --add-reviewer @user`, `gh pr ready N`, `gh pr checks N --watch`.
