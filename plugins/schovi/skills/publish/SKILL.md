---
name: publish
description: Create GitHub pull request with smart description generation. Use when the user says "/schovi:publish", asks to "create a PR", "publish", "open a pull request", or wants to push and create/update a GitHub PR. Takes the change's source from a ticket key, a GitHub reference, any source URL, a local spec file or folder, plain text, or the commit history. Auto-commits uncommitted changes first.
disable-model-invocation: false
---

# Publish

Owns the whole "I'm done, ship it" pipeline: commit whatever is pending, push, then create or update a draft PR with a description worth reading.

Always: draft PR, auto-push, auto-commit pending changes first. The base is the default branch (from `origin/HEAD`), or the parent branch when the branch sits in a `gh stack`.

```bash
/schovi:publish                 # from commit history
/schovi:publish PROJ-123        # from a tracker ticket key
/schovi:publish #123            # from a GitHub issue/PR
/schovi:publish owner/repo#45
/schovi:publish ./spec.md       # or ./folder/
/schovi:publish https://any/source/url
/schovi:publish "some text"
```

Any link is a valid source: a ticket, a doc, a dashboard, a spec page. The plugin's shared `references/sources.md` (`../../references/sources.md` from this skill folder) resolves it, whatever the host.

## Codex

If custom subagents are unavailable, commit inline and gather context with available Codex tools. For GitHub references use the `gh` workflow in `plugins/schovi/agents/gh-pr-reviewer/AGENT.md`.

---

## 1. Parse the input

One optional positional argument. Detect its type in this order, most specific first:

1. **GitHub**: `#\d+`, `owner/repo#\d+`, or a GitHub URL
2. **File**: the path exists and is a file
3. **Folder**: the path exists and is a directory
4. **Ticket**: `[A-Z][A-Z0-9]{1,9}-\d{1,6}`
5. **URL**: anything else starting with `http`
6. **Text**: anything else
7. **None**

With no ticket key in the input, take one from the branch name (`PROJ-123-add-auth` gives `PROJ-123`, `feature/ABC-456-fix-bug` gives `ABC-456`). Store it as `TICKET_KEY`.

## 2. Check the git state

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
git rev-parse --abbrev-ref HEAD
git status --porcelain
gh auth status
gh pr list --head "$(git branch --show-current)" --json number,url,title,isDraft,state
```

Stop if you're on the default branch (they need a feature branch) or `gh` isn't authenticated. Commit any pending changes before continuing, and say that you're doing it. An existing PR for this head means UPDATE mode; nothing found means CREATE.

Find the base. A branch in a `gh stack` targets the branch below it (the trunk for the bottom one). `STACK_POSITION` reads as "N of M". Outside a stack, or without the `gh stack` extension, the output is empty and the base stays the default branch:

```bash
read -r STACK_PARENT STACK_INDEX STACK_SIZE < <(gh stack view --json 2>/dev/null | jq -r --arg branch "$(git branch --show-current)" \
  '.trunk as $trunk | (.branches | map(.name)) as $names | ($names | index($branch)) as $i
   | if $i == null then empty else "\(if $i == 0 then $trunk else $names[$i-1] end) \($i+1) \($names|length)" end')
BASE_BRANCH=${STACK_PARENT:-$DEFAULT_BRANCH}
```

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

## 4. Check the diff

A small, single-purpose PR is fast to review and can be approved by an automated reviewer. Check the diff against the base and **warn, never block or edit**:

```bash
git diff origin/$BASE_BRANCH...HEAD --numstat
git diff origin/$BASE_BRANCH...HEAD
```

- **Size**: sum the added and deleted lines. Skip lockfiles, generated code, snapshots, and vendored files. Above 400 lines, or the limit the repo's instructions set, say so and suggest a split into a `gh stack`
- **Mixed concerns**: a refactor, a behavior change, and a migration in one PR. Name each part and suggest one PR per part
- **Noise**: debug output, commented-out code, unrelated formatting or renames. List each with `file:line`

Report the warnings in one short block and continue. The user decides whether to split or clean up.

## 5. Gather context

- **Any source type except `None`**: read `../../references/sources.md` and follow it. It picks the fetcher (ticket tracker, GitHub, observability vendor, doc tool, plain web page, local file) and hands back a canonical URL, a title, the what and why, and any acceptance criteria
- **None**: read the commits

A `TICKET_KEY` off the branch is also a source. Resolve it the same way when the input itself gave nothing, and keep publishing if it can't be resolved.

```bash
git log origin/$BASE_BRANCH..HEAD --format="%s%n%b" --reverse
git diff origin/$BASE_BRANCH..HEAD --stat
```

**Collect links for the Context section** from the input source, the `TICKET_KEY` off the branch, and any links in the commits or fetched content (dashboards, related PRs, specs, design docs). In a stack, the PR for `STACK_PARENT` is one of them. None found: omit the section. Never invent a link.

When the repo's instructions (`AGENTS.md`, `CLAUDE.md`) make a link mandatory and none was found, ask before writing the description:

```
No source link found for this change. Paste a relevant link (ticket, dashboard,
related PR, spec, design doc) so reviewers have context.
```

## 6. Write the description

**The reviewer reads the code.** So the description does not explain how the code works or which files changed. It carries what a reader cannot recover from the diff: what was decided, and why.

**Describe the final state, never the evolution.** "The API returns paginated results", not "changed the API to return paginated results". This matters most in UPDATE mode: rewrite the description from scratch for the code as it now stands. No "we changed X to Y", no "updated A to B".

**Describe presence, never absence.** Drop "no schema change", "no behavior change", "nothing else touched" unless you have read the diff and confirmed it. Commit messages and file stats do not prove a negative, and an unverified absence claim waves the reviewer off exactly where they should look.

**Settled wording.** "Moves the read path to X", not "tries to move" or "should fix". Every claim stays one you can back with the diff or a source.

**No agent-process content.** The description is about the change, not about how you produced it. Leave out TODO checklists, validation narration ("tests pass", "verified locally"), workflow narration ("first I explored the codebase"), and self-reference ("I decided", "as requested"). If validation matters to a reviewer, it belongs in Review Notes as a fact.

Classify it as Bug, New Feature, Enhancement, or Chore, then:

```markdown
## [Bug | New Feature | Enhancement | Chore]

[In a stack, start with "Part N of M." Then 1-2 sentences: the decision this change follows, or the problem or feature. Link to the spec/ticket/doc rather than restating it.]

## Context

[Links that give a reviewer the full picture: the ticket, a dashboard, related PRs, the product spec, a design doc, a Slack thread. One per line with a short label.]

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

A decision needs no outside record. The author's call counts when the reason is real: `X over Y — Z` with Z taken from the source, the code, or the user. Never invent a decision or a reason. When the reason is unclear, ask.

**Review Notes** is addressed to the reviewer about reviewing and merging. Test every bullet: could they get this from the diff or the sections above? Then cut it. What survives is required actions, merge sequencing, follow-ups, the single riskiest spot, and looks-wrong-but-intentional gotchas. Upgrade steps for consumers go under Notes > Migration instead.

**Title**: `PROJ-123: Description` with a ticket key, otherwise just the description. 50-80 characters, active voice (Add, Fix, Implement, Update), no trailing period. Source it from the spec title, the source's own title, or the theme of the commits.

## 7. Ship it

```bash
# CREATE
gh pr create --draft --title "[TITLE]" --base "$BASE_BRANCH" --body "$(cat <<'EOF'
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
