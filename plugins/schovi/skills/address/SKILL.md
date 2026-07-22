---
name: address
description: "Drive an open GitHub PR to green: fetch it, triage every unresolved review comment (fix it, decline it with evidence-backed reasoning when it's a false positive or low-value nit, or defer it to a human when it needs a decision) and diagnose every failing CI job, then (after you approve, or automatically with --auto) implement, push, reply to each thread with what changed or why not, and resolve the ones you addressed. Use when the user says \"/schovi:address\", \"address the PR comments\", \"resolve the review comments\", \"fix the failing CI and respond\", \"handle the review feedback on #123\", or points at a PR and asks to work through its open feedback. Previews the plan and waits for confirmation before changing code, unless --auto is given. Uses /schovi:publish to commit, push, and rewrite the PR description for the behaviour that changed."
disable-model-invocation: false
user-invocable: true
---

# Address Skill

Takes an open PR from "has feedback / red CI" to "addressed and green":

1. **Open review comments** — triage each unresolved thread (fix it, decline it with reasoning, or defer it to a human), implement fixes on approval, then reply with what changed or why not and resolve the ones you addressed.
2. **Failing CI jobs** — read the failing logs, diagnose, and fix in the same pass.
3. **Behaviour description** — once code is pushed, hand off to `/schovi:publish` to rewrite the PR description for what actually changed.

The main context stays coordination-only: exploration, log reading, and bulk edits go to subagents; the plan, the approval gate, and the thread replies stay here.

## Codex Compatibility

Subagent spawns (`Agent` tool) are Claude-native. In Codex, do the exploration and implementation inline in the current session instead, and treat `/schovi:publish` as `use $publish`. Everything else (the `gh` commands, the approval gate, the reply-and-resolve flow) is tool-neutral.

## Trigger

`/schovi:address [PR] [--auto]`

- `PR` — a PR URL, `#123`, `owner/repo#123`, or nothing (defaults to the PR for the current branch).
- `--auto` — skip the approval gate and run the whole loop unattended. Also triggered by the user saying "auto", "just do it", "no need to ask".

---

## Workflow

### Phase 1 — Resolve the PR and check out its branch

Determine `OWNER/REPO` and `NUMBER`:

```bash
# number-only input: derive repo from origin
git remote get-url origin | grep -oE 'github\.com[:/][^/]+/[^/.]+' | sed -E 's#github\.com[:/]##'
# no input: PR for the current branch
gh pr view --json number,url >/dev/null 2>&1
```

Fetch identity and state (one call):

```bash
gh pr view <PR> --json number,url,title,state,isDraft,author,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus
```

Then get onto the head branch so fixes land on the PR:

```bash
git fetch origin
git checkout <headRefName> && git pull --ff-only origin <headRefName>
git status --porcelain   # must be empty before touching code
```

Stop and ask if: the PR is closed/merged, the working tree is dirty, or you cannot check out the head branch (e.g. a fork you can't push to). Do not force anything.

### Phase 2 — Gather the work items

**Unresolved review threads** (need the thread node `id` to resolve later, and the first comment's `databaseId` to reply to):

```bash
gh api graphql -f query='
query($owner:String!,$repo:String!,$number:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$number){
      reviewThreads(first:100){
        nodes{
          id
          isResolved
          isOutdated
          comments(first:1){ nodes{ databaseId path line body author{login} } }
        }
      }
    }
  }
}' -F owner=<owner> -F repo=<repo> -F number=<number>
```

Keep threads where `isResolved == false`. Flag `isOutdated == true` ones (the code moved; the ask may be stale). Also pull change-request reviews for their summary bodies:

```bash
gh pr view <PR> --json reviews,comments
```

**Failing CI jobs:**

```bash
gh pr checks <PR> --json name,state,bucket,workflow,link
```

For each `bucket == "fail"`, read the failing logs (delegate to a subagent so the raw log never enters main context):

```bash
gh run view <run-id> --log-failed      # run-id from the check `link`, or `gh run list --branch <headRefName>`
```

If there are zero unresolved threads and zero failing checks, say so and stop. Nothing to address.

### Phase 3 — Triage, diagnose, and propose (no code changes yet)

First judge each review thread against the actual code, then decide its outcome. Don't reflexively fix — a wrong decline is worse than a fixed nit, and blindly applying a bad suggestion is worse than both.

- **FIX** — valid and actionable. Work out the concrete change.
- **DECLINE** — false positive, already handled, or a low-value nit that fights a repo convention. No code change; reply with the evidence-backed reason, then resolve. Only decline when you can point at the code or convention that proves it. If you're guessing, it's a SKIP, not a DECLINE.
- **SKIP** — needs a product/design decision, is genuinely ambiguous, or is out of scope. No code change; reply with the open question and leave it unresolved for a human.

Delegate the digging:

- **Review threads** → spawn an Explore subagent (`general-purpose`) to read the code at `path:line` and its context, then return the classification (FIX/DECLINE/SKIP), the concrete change if any, and a reply that explains the reasoning — enough that a review bot or a human learns from it, not just "done".
- **CI failures** → spawn a subagent to read `--log-failed`, find the root cause, and propose the fix. Root cause, not symptom (a shared-function guard beats N caller patches).

If a comment is a GitHub **suggested change** (```suggestion block), applying it verbatim is the fix — but still sanity-check it against the code. A wrong suggestion is a DECLINE with the reason, not a rubber-stamp.

Present a single consolidated plan and stop:

```
PR #<n> — <title>   (<X> threads, <Y> failing checks)

REVIEW COMMENTS
  FIX (change code, reply, resolve)
    1. <path>:<line>  @<author>: "<comment excerpt>"
       fix:   <one line>
       reply: "<what changed and why>"
  DECLINE (no change, reply with evidence, resolve)
    2. <path>:<line>  @<author>: "<comment excerpt>"
       reply: "<why this needs no change — cite the code/convention>"
  SKIP (no change, reply, left unresolved for a human)
    3. <path>:<line>: <why — needs a product decision / ambiguous / out of scope>
CI FAILURES
  A. <check name> (<workflow>)
     cause: <one line>
     fix:   <one line>

Description: will be regenerated via /schovi:publish after push.
```

### Phase 4 — Approval gate

If `--auto` is **not** set: wait for explicit `yes` / `edit` / `cancel`. On `edit`, revise and re-show. **Never change code in the same turn you present the plan.** If `--auto` is set, skip straight to Phase 5 and note that you're running unattended.

### Phase 5 — Implement and validate

Make the changes (batch related edits into one implementation subagent where it fits). Then run the repo's own validation, and fix what you broke before moving on:

```bash
# use whatever the repo defines; discover, don't assume
cat package.json 2>/dev/null; ls Makefile justfile 2>/dev/null
```

Never resolve a thread whose fix didn't land or whose validation failed. That item drops to SKIP with the reason.

### Phase 6 — Commit, push, and rewrite the description

Hand the whole commit → push → description step to publish (it auto-commits, pushes with `-u`, and regenerates the description in UPDATE mode):

```
/schovi:publish <PR>
```

Confirm the push landed before Phase 7 (`git ls-remote --heads origin <headRefName>` matches local `HEAD`). CI re-runs automatically on the new commit.

### Phase 7 — Reply and resolve

Reply on every triaged thread; resolve only the ones you addressed — a FIX that landed and validated, or a DECLINE with a standing evidence-backed reason. SKIP stays open.

```bash
# FIX — reply with what changed and why, citing the commit
gh api repos/<owner>/<repo>/pulls/<number>/comments/<databaseId>/replies -f body="Fixed in <sha>: <what changed and why>."

# DECLINE — reply with the reason (no sha; nothing changed)
gh api repos/<owner>/<repo>/pulls/<number>/comments/<databaseId>/replies -f body="<why no change is warranted, citing the code/convention>."

# resolve the thread (FIX and DECLINE only)
gh api graphql -f query='
mutation($threadId:ID!){
  resolveReviewThread(input:{threadId:$threadId}){ thread{ isResolved } }
}' -F threadId=<thread node id>
```

Do not resolve SKIP items — reply with the open question (e.g. "left open: needs a product decision on X") and leave them unresolved for a human. A FIX whose change didn't land or whose validation failed drops to SKIP with the reason — never resolve it.

For CI: after the push, re-check and report:

```bash
gh pr checks <PR> --json name,state,bucket --jq '[.[]|select(.bucket=="fail")]'
```

If checks are still running, say so; don't block waiting unless the user asked.

### Phase 8 — Report

Short summary: threads resolved (with links), CI status (was → now), items skipped and why, and that the description was rewritten. Nothing verbose.

## Error Handling

- **No PR for the branch / bad PR ref** → ask for an explicit PR reference.
- **Fork you can't push to** → stop; offer to output the fixes as a patch/text instead.
- **A fix is ambiguous or needs a product/design call** → don't guess; move it to SKIP with the open question.
- **Push fails** → surface publish's error; do not reply to or resolve any thread (nothing shipped).
- **CI failure is infra/flaky, not the code** → say so, re-run once (`gh run rerun <run-id> --failed`), don't invent a code fix.

## Implementation Notes

1. The plan is always printed. Planning and changing code are separate turns gated by `yes`, except under `--auto`, which runs the whole loop (triage, fix, decline, resolve) unattended.
2. Triage before fixing: FIX / DECLINE / SKIP. When you can't back a DECLINE with concrete evidence, it's a SKIP — never decline on a guess, and never fix on autopilot.
3. Resolve only what you addressed: a FIX that's pushed and validated, or a DECLINE with a standing evidence-backed reason. Otherwise it's a SKIP, left unresolved.
4. Replies teach: what changed and why, or why no change — with evidence, never "done". They're the git-visible record a human or a review bot learns from.
5. Root cause over symptom for both review comments and CI failures.
6. The description rewrite is delegated to `/schovi:publish` — this skill never edits the PR body directly.
