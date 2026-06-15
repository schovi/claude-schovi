---
name: feedback
description: "Post feedback to a GitHub PR in either direction: as a reviewer (inline + general comments, optional Approve / Comment / Request-changes verdict), or as the author replying to change-request threads with what you changed. Use when the user says \"/schovi:feedback\", asks to \"post these comments to the PR\", \"send this review back\", \"reply to the review threads\", or \"I made the requested changes, respond on the PR\" — usually after /schovi:review or after pushing fixes. Always previews and waits for confirmation before posting; it replies to threads but never resolves them. With no PR link, writes the comments as text output instead."
disable-model-invocation: false
user-invocable: true
---

# Feedback Skill

Writes feedback to a GitHub PR in a short, human voice, previews it, and posts it. It works in two directions:

- **Reviewer mode** — you reviewed someone's PR. Turn findings (or comments you dictate) into inline + general comments, optionally bundled into one review with an Approve / Comment / Request-changes verdict. Pairs with `/schovi:review`: review lists findings, you pick which to send and how.
- **Author mode** — someone requested changes on *your* PR and you pushed the fixes. Reply to each open thread describing what you changed, drawn from the commits since that review. Replies only — it never resolves threads (you do that in the UI).

Both modes share the same machinery: thread/comment posting, the short voice, and the mandatory preview-then-confirm. The skill picks the mode from how you invoke it.

Casual PR mentions ("what is #123 about?") belong to `gh-pr-auto-detector`, not this skill. Reviewing a PR belongs to `review`. This skill only writes feedback back.

## Codex Compatibility

No custom subagent is required. All posting uses the `gh` CLI directly. If anchoring needs the PR diff or existing comments and a Claude subagent is unavailable, fetch them inline with the `gh` commands below (the same ones `plugins/schovi/agents/gh-pr-reviewer/AGENT.md` documents).

## Trigger

- User invokes `/schovi:feedback [PR]`
- Reviewer mode: "post these comments to the PR", "send this review back" — usually follows a `/schovi:review` whose findings are still in context
- Author mode: "reply to the review threads", "I made the requested changes, respond on the PR", "reply to that thread with what we did"

---

## Workflow

### Phase 1: Parse Input

First settle the **mode**, then the **target PR**, then the **instructions**.

**Mode:**
- **Author mode** when the user is responding to feedback on their own PR — "reply to the review threads", "I made the requested changes, respond", "answer the comments". Signal also: the PR's author is the user (`gh pr view <PR> --json author` vs `gh api user -q .login`) and it has open change-request threads. Go to *Author mode* below.
- **Reviewer mode** otherwise — findings to post, comments to leave. Continue with Phases 2–5 as written.

When it's genuinely ambiguous (e.g. "reply to that thread" with no other signal), ask which one.

Reviewer mode reads two things from the invocation: the **target PR** and the **instructions** (which findings, free-form comments, tone, delivery, verdict).

**Target PR** (first positional, optional):
- GitHub PR URL, `owner/repo#123`, or `#123`
- For bare `#123`: resolve repo from (1) conversation history, (2) `git remote get-url origin` in cwd, (3) ask the user
- **None given** → `OUTPUT_ONLY` mode (Phase 5b). Draft the comments and print them; do not post.

**Instructions** (free text, the way the user normally writes them):
- A selection of findings from the prior review: "do it for findings 1) 2) 4), skip 3)". Map numbers to the most recent review output in context.
- Free-form comments the user dictates directly: "add a comment on auth.ts:42 saying X" — treated the same as a finding, no review required.
- Tone / emphasis hints: "flag the optional ones", "5 is super important".
- Delivery override: default is a single batched review; honor "post them individually" / "just separate comments" → `INDIVIDUAL` mode.
- Verdict hint: "request changes", "approve", or none → see Phase 3.

Findings can come from any review output in context, not only `/schovi:review`. If there is no review in context and no dictated comments, ask what to post.

### Phase 2: Build the Comment Set

For each selected finding or dictated comment, classify it:

- **Inline** — it points at a specific `file:line` (or line range). Needs `path`, `line` (and `start_line` for a range), `side`.
- **General** — repo-wide, cross-file, or summary feedback. Goes in the review body (batched) or as a PR conversation comment (individual).
- **Thread reply** — the user is responding to an existing review comment ("reply to that thread about caching"). Needs the existing comment's `id`.

### Phase 2.5: Anchor Inline Comments

**Context first.** If the review output already gives a precise `file:line`, use it directly. No fetch.

**Fetch only if ambiguous or missing.** When a line is vague ("somewhere in the auth handler"), the file changed since review, or you are replying to a thread, fetch:

```bash
# PR identity and latest head commit (required for individual inline comments)
gh pr view <PR> --json number,headRefOid,headRepository,headRepositoryOwner

# The diff, to confirm a finding's line is actually part of the changeset
gh pr diff <PR>

# Existing review comments, to find the id to reply to
gh api repos/<owner>/<repo>/pulls/<number>/comments --paginate \
  -q '.[] | {id, path, line, user: .user.login, body: .body[0:80]}'
```

Inline comments can only land on lines that appear in the PR diff. If a finding targets a line outside the diff, downgrade it to a general comment and say so in the preview.

`side` is `RIGHT` for added/changed lines (the common case) and `LEFT` for removed lines.

### Phase 3: Draft and Decide Delivery

**Voice** (this is the point of the skill — match how the user writes):
- Short, plain, human. One thought per comment. No preamble, no "Great work, however...".
- Write as a peer leaving a quick note, not a report. Contractions are fine.
- **Optional / non-blocking** suggestions: say so in the sentence, naturally — "Not blocking, but you could..." / "Minor: ...". No rigid `nit:` prefix unless the user wants one.
- **Concrete code changes**: where the fix is a specific small edit, add a GitHub suggestion block so the author can apply it in one click:

  ````markdown
  Not blocking, but this reads cleaner as a guard clause:

  ```suggestion
  if (!user) return null;
  ```
  ````

  Only use a suggestion block when you know the exact replacement for those lines. Don't guess.

**Delivery mode** (default `BATCHED`, unless the user asked for individual):
- `BATCHED` — all inline + general feedback in one review object, one notification, carries the verdict. Preferred.
- `INDIVIDUAL` — each comment posted on its own. A verdict, if any, still goes through a final review submission (GitHub attaches verdicts only to reviews).

**Verdict** (only for the review object):
- `COMMENT` — default. Neutral feedback, no approval state.
- `REQUEST_CHANGES` — when the user flags it ("request changes") or the findings clearly block merge.
- `APPROVE` — when the user says the PR is good and these are just minor notes.

Never pick `APPROVE` or `REQUEST_CHANGES` on your own; default to `COMMENT` unless the user signals otherwise.

### Phase 4: Preview and Confirm (always)

Posting to a PR is outward-facing and hard to undo. Always show the full draft and wait for an explicit go-ahead. Never post in the same turn as drafting.

```
Feedback for owner/repo#123  ·  mode: batched  ·  verdict: REQUEST_CHANGES

Inline (3)
  src/auth.ts:42        Token isn't checked for expiry before use.
  src/auth.ts:88        Minor: this branch is unreachable, drop it. [suggestion]
  src/api/users.ts:15   Reply → thread "n+1 query" (replying to @alice)

General (1)
  Overall solid. Two auth gaps below block merge; the rest are optional.

Skipped: finding 3 (out of diff, can't inline) → folded into general comment.

Post this? (yes / edit / cancel)
```

If the user edits, revise and show the preview again. Only proceed on a clear yes.

### Phase 5: Post

Resolve `<owner>`, `<repo>`, `<number>` from the PR target.

**Batched review** (inline + body + verdict in one call):

```bash
gh api repos/<owner>/<repo>/pulls/<number>/reviews --input - <<'EOF'
{
  "event": "REQUEST_CHANGES",
  "body": "Overall solid. Two auth gaps below block merge; the rest are optional.",
  "comments": [
    { "path": "src/auth.ts", "line": 42, "side": "RIGHT",
      "body": "Token isn't checked for expiry before use." },
    { "path": "src/auth.ts", "start_line": 85, "line": 88, "side": "RIGHT",
      "body": "Minor: this branch is unreachable.\n\n```suggestion\n  return null;\n```" }
  ]
}
EOF
```

`event` is `COMMENT`, `REQUEST_CHANGES`, or `APPROVE`. Omit `comments` for a body-only review. A range uses `start_line` + `line`.

**Individual mode** — post each comment on its own, then submit the verdict (if any) as a final body-only review:

```bash
# One inline comment (needs the head commit SHA)
gh api repos/<owner>/<repo>/pulls/<number>/comments --input - <<'EOF'
{ "path": "src/auth.ts", "line": 42, "side": "RIGHT",
  "commit_id": "<headRefOid>", "body": "Token isn't checked for expiry before use." }
EOF

# A general conversation comment (no verdict)
gh pr comment <PR> --body "Overall solid. See inline notes."

# The verdict, when requested
gh api repos/<owner>/<repo>/pulls/<number>/reviews --input - <<'EOF'
{ "event": "REQUEST_CHANGES", "body": "Auth gaps below block merge." }
EOF
```

**Reply to an existing thread:**

```bash
gh api repos/<owner>/<repo>/pulls/<number>/comments/<comment_id>/replies \
  -f body="Good call — switched to a single batched query."
```

After posting, show what landed:

```
Posted to owner/repo#123 — REQUEST_CHANGES, 2 inline + 1 general.
https://github.com/owner/repo/pull/123
```

### Phase 5b: Output-only (no PR given)

Print the drafted comments grouped by inline / general / replies, each with its `file:line` and optional/blocking flag, in the same voice they'd be posted in. The user can paste them or re-run with a PR link. Nothing is sent.

---

## Author Mode: Reply to Change Requests

Use when someone requested changes on the user's PR, the user pushed fixes, and now wants to reply per thread with what changed. Joins the reviewer path at **Phase 4 (preview)** and posts via the **reply** command in Phase 5. It never resolves threads.

### A1: Fetch open threads

Get unresolved review threads and the comment to reply to. GraphQL is the reliable source for resolution state and the repliable comment id:

```bash
gh api graphql -f query='
query($owner:String!,$repo:String!,$number:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$number){
      reviewThreads(first:100){
        nodes{
          isResolved
          isOutdated
          comments(first:1){ nodes{ databaseId path line body author{login} } }
        }
      }
    }
  }
}' -F owner=<owner> -F repo=<repo> -F number=<number>
```

Keep threads where `isResolved` is false. The first comment's `databaseId` is what you reply to (REST `pulls/<number>/comments/<databaseId>/replies`). Note `isOutdated` — an outdated thread usually means the line already changed, a useful signal that it was addressed.

### A2: Find what changed

Gather the work done since the review so replies are grounded in fact, not guessed:

```bash
gh pr view <PR> --json commits -q '.commits[].messageHeadline'   # commits on the PR
git log --oneline <base>..HEAD                                   # if working locally
git log -L:<line>,<line>:<path> <base>..HEAD                     # history of a specific span
git diff <base>..HEAD -- <path>                                  # what the file looks like now
```

For each open thread, look for a commit/diff touching that file (and ideally that area) that plausibly addresses it.

### A3: Draft a reply per thread (evidence-gated)

This is the part that must not bluff. Draft from real evidence only:

- **Clear evidence the change was made** → short, concrete reply with the proof: `Done — extracted this into a guard clause in abc1234.` Reference the commit and what actually changed.
- **Thread is outdated / file changed but the link to this comment is fuzzy** → describe what changed without overclaiming: `Reworked this block in abc1234 — the validation now runs before the write. Let me know if that covers it.`
- **No evidence found** → do not write "Done". Either leave a neutral reply (`Looking into this — haven't addressed it yet.`) or, better, ask the user what to say for that thread. Never assert a fix that isn't in the diff.

Voice rules from Phase 3 apply: short, human, peer-level.

### A4: Preview, confirm, post

Show the same preview as Phase 4 — each open thread, the drafted reply, and the evidence (commit / "outdated" / "no evidence, needs your input"). Wait for the go-ahead, then post each with the reply command from Phase 5. Report what landed. Resolving is left to the user; say so in the closing summary.

```
Replies for owner/repo#123 (you are the author) · 3 open threads

  src/auth.ts:42   @alice "check token expiry"
    → Done — added an expiry check before use in abc1234.   [commit abc1234]
  src/api/users.ts:15  @bob "n+1 query here"
    → Batched these into one query in def5678.               [commit def5678, thread outdated]
  src/config.ts:8  @alice "magic number"
    → (no change found — what should I say?)                  [needs your input]

Post replies to the first two? Threads stay unresolved (resolve them yourself). (yes / edit / cancel)
```

---

## Error Handling

- **PR not found**: report it, suggest checking the number and repo (`owner/repo#123`).
- **gh not authenticated**: `gh auth login`.
- **Inline target outside the diff**: GitHub rejects it. Downgrade to a general comment and note it in the preview, don't silently drop it.
- **No findings and no dictated comments**: ask what to post; don't invent feedback.
- **Reply target not found**: list the existing threads and ask which one.

## Example Usage

```bash
/schovi:feedback https://github.com/owner/repo/pull/123
/schovi:feedback #123                 # repo from cwd or context
/schovi:feedback owner/repo#45
/schovi:feedback                      # no PR → print comments as text
```

Reviewer flow, in the user's own words after a review:

```
/schovi:feedback #123
Inline where it maps to a line, general otherwise. Short, human, flag the
optional ones. Do findings 1) 2) 4) — 5 is super important — and request changes.
```

Author flow, after pushing fixes for a change request:

```
/schovi:feedback #123
I implemented the review feedback and pushed it. Reply to each open thread
with what we changed. Keep it short.
```

## Implementation Notes

1. **Always preview, never same-turn post.** Drafting and posting are separate turns gated by the user's yes. This is the safety net for an irreversible, outward-facing action.
2. **Context first, fetch only when needed.** Reuse the `file:line` from the review in context. Only hit `gh pr diff` / the comments API when anchoring is ambiguous, the file moved, or replying to a thread.
3. **Voice over completeness.** The value is short, human, peer-level comments with optional vs blocking made obvious in the sentence. Suggestion blocks only when the exact replacement is known.
4. **Verdicts are conservative.** Default `COMMENT`. `APPROVE` / `REQUEST_CHANGES` only on a clear user signal.
5. **Verdicts ride on reviews.** Even in individual mode, a verdict is a final body-only review submission — GitHub has no other place to attach one.
6. **Author replies are evidence-gated.** In author mode, never claim a thread is "Done" without a commit/diff that backs it. No evidence → neutral reply or ask. This is the difference between a useful response and a confidently wrong one.
7. **Never resolve threads.** Author mode posts replies only; the user resolves threads themselves. Don't call the resolve mutation.
