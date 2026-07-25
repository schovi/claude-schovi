---
name: release
description: Cut a CI-gated GitHub release for projects distributed through Homebrew, GoReleaser, GitHub Releases, casks, formulae, or SemVer tags. Handles version selection, CI gating, release notes, optional GoReleaser automation, tag publishing, release verification, and a follow-up documentation-sync pull request. Explicit invocation only (/homebrew:release in Claude Code, `use $release` in Codex).
disable-model-invocation: true
---

# GitHub Homebrew Release

Release only from `main`, only after that exact commit's CI is green, only after the user approves the version, and always verify the release exists afterwards.

**Pushing a tag is the point of no return.** It fires the release workflow, publishes a GitHub Release, and can update a Homebrew tap that users are already pointed at. Everything before the tag push is reversible. Nothing after it is, without a visible retraction. So the gates below are not ceremony, and none of them get skipped because the change looks small.

## Invariants

These hold for the whole run. Later sections don't restate them.

- The release commit is the tip of `main`, and it is the same commit on `origin/main`.
- Remote CI on that exact commit is the gate. Local test runs are extra confidence, never a substitute.
- No tag is created or pushed before CI is green **and** the user has approved the version and notes.
- Any unexpected command failure halts the run. Report the failure and the concrete next step. Never work around a failed check, and never delete or force a tag to retry without explicit direction.

## 1. Preflight

```sh
gh auth status
git fetch origin --tags --prune
git status --short --branch
git rev-parse --abbrev-ref HEAD
```

Halt, with the reason, if:

- `gh` is not authenticated.
- The worktree has uncommitted or untracked changes. Summarize what's dirty and ask how to proceed.
- HEAD is not exactly `main`: another branch, a detached HEAD, or a worktree for a different branch. Explain that releases come from `main` and suggest switching, merging, or cherry-picking.
- `main` is ahead of or diverged from `origin/main`. The release commit has to be on remote `main` where CI can see it.

If `main` is merely behind `origin/main` and the worktree is clean, fast-forward it. If it will not fast-forward, halt.

Then pin the commit and confirm it matches the remote:

```sh
release_sha="$(git rev-parse HEAD)"
test "$release_sha" = "$(git rev-parse origin/main)"
```

## 2. Require green CI on the release commit

Ask GitHub for every check that ran on this exact commit, rather than guessing which workflow is the important one:

```sh
gh api "repos/{owner}/{repo}/commits/$release_sha/check-runs" \
  --jq '.check_runs[] | {name, status, conclusion}'
```

To proceed, every check run on the commit must be `completed`, and every conclusion must be `success`. Additionally there must be at least one: a commit with zero checks has not been validated, and is a halt.

Handle the other outcomes deliberately:

- **`queued` or `in_progress`**: wait for it, then re-check.

  ```sh
  gh run list --branch main --commit "$release_sha" \
    --json databaseId,status,conclusion,headSha,event,url,workflowName --limit 20
  gh run watch <run-id> --exit-status
  ```

- **`failure`, `cancelled`, `timed_out`, `action_required`**: halt. Link the run and suggest fixing or re-running it.
- **`neutral` or `skipped`**: do not decide this yourself. A path-filtered workflow skipping is fine; a required check skipping is not, and you cannot tell which without repo admin. Name the skipped checks and ask whether to proceed.

If branch protection is readable, it settles the ambiguity, so it's worth trying:

```sh
gh api "repos/{owner}/{repo}/branches/main/protection/required_status_checks" --jq '.contexts[]' 2>/dev/null
```

A 403 here is normal without admin rights. Fall back to the rule above.

## 3. Detect the release backend

```sh
find . -maxdepth 3 \( -name '.goreleaser.yml' -o -name '.goreleaser.yaml' \
  -o -path './.github/workflows/*release*.yml' -o -path './.github/workflows/*release*.yaml' \) -print
```

**GoReleaser** applies when a `.goreleaser.y[a]ml` exists and the release workflow is tag-triggered. The tag push then produces the GitHub Release, the assets, and any configured Homebrew cask or formula update.

**Otherwise** you create the GitHub Release yourself with explicit notes. Handle Homebrew separately only if a tap, cask, or formula update path is actually discoverable in the repo. If Homebrew publishing is expected and no update path is obvious, halt and ask for the target rather than shipping a release that leaves the tap stale.

## 4. Decide the version

Find the latest reachable release tag:

```sh
latest_tag="$(git tag --merged HEAD --sort=-v:refname 'v[0-9]*' | head -1)"
```

**No tags yet** means this is the project's first release. Don't halt: propose a starting version (`v0.1.0` for something still finding its shape, `v1.0.0` if the user considers the interface stable) and let them pick. Use the full history as the change set.

Otherwise, read what changed:

```sh
git log --reverse --oneline "$latest_tag"..HEAD
git log --reverse --name-status --format='%h %s' "$latest_tag"..HEAD -- \
  ':!AGENTS.md' ':!CLAUDE.md' ':!.agents/**' ':!.claude/**'
```

**Each commit is one candidate release-note unit.** That keeps attribution clear and works with granular commits. Split a commit into several units when it plainly carries unrelated user-visible changes (different behavior, command, config, UI surface, or package). These units feed section 5.

**Ignore agent instructions, harness guidance, and local skill changes** when sizing the bump. Judge that from commit intent and the files touched, not from a hardcoded path list, since the second pathspec above catches the common cases but not all of them. If the only changes are ignored ones, halt and ask whether a non-app release is really wanted.

Pick the bump from the highest-impact app-related change:

- **Major**: breaking CLI behavior, incompatible config, a broken output contract, a required migration, or newly destructive behavior.
- **Minor**: new commands, new flags, new user-visible workflows, new config capability, substantial features.
- **Patch**: bug fixes, small polish, user-affecting docs, dependency and release fixes, narrow behavior corrections.

Read enough of the diff to justify the choice. A commit prefix is a hint, not evidence.

## 5. Write the release notes

Cover the user-visible changes, built from the units in section 4. Use the sections that apply:

````markdown
## Breaking Changes

### <Component or command> <brief change>

<1-2 sentences: what changed and why>

### Migration

```bash
# Before
<old command or config>

# After
<new command or config>
```

## New Features

### <Feature name>

<Short description>

```bash
<example command when useful>
```

## Bug Fixes

- Fixed <specific user-visible problem>

## Documentation

- Updated <specific user-facing docs>
````

Be specific: name the actual commands, flags, config keys, files, and behavior. Every breaking change gets a before/after. A comparison table is worth it when roles or behavior shifted. Keep internal-only, agent-instruction, and harness-only changes out unless the user asks for them.

## 6. Approval gate

Show the user, and wait for an explicit yes:

```
Release <next_tag>  (<major|minor|patch> from <latest_tag>)
Commit:  <release_sha short>  "<subject>"
CI:      <N> checks, all green
Backend: GoReleaser | plain GitHub Release
Homebrew: <tap/cask/formula that will update, or "none configured">

Bump reason: <one sentence tied to the specific change that forced it>

<the release notes, in full>

Ignored as non-app: <commits, or "none">

Push tag <next_tag>? This publishes the release. (yes / edit / cancel)
```

Never push the tag in the same turn as presenting this. On `edit`, revise and show it again. Only a clear yes proceeds.

The version and the notes are both up for revision here: the user knows things about impact that the diff doesn't show.

## 7. Tag and release

`next_tag` is the approved version with its leading `v`.

Confirm neither the tag nor the release already exists. **Each of these should fail or come back empty**, which is the pass condition, not an error:

```sh
git tag --list "$next_tag"
git ls-remote --tags origin "$next_tag" "$next_tag^{}"
gh release view "$next_tag"
```

If any of them finds something, halt: this version already shipped.

```sh
git tag -a "$next_tag" "$release_sha" -m "$next_tag"
git push origin "refs/tags/$next_tag"
```

**With GoReleaser**, watch the workflow the tag just triggered, then adjust its generated notes if needed:

```sh
gh run list --limit 10
gh run watch <run-id> --exit-status

gh release edit "$next_tag" --notes "$(cat <<'EOF'
<release notes>
EOF
)"
```

A failed release workflow is a halt. The tag is already public, so do not delete or recreate it without explicit direction; say what failed and what the options are.

**Without GoReleaser**, create the release:

```sh
gh release create "$next_tag" --target "$release_sha" --title "$next_tag" --notes "$(cat <<'EOF'
<release notes>
EOF
)"
```

If binaries or archives are expected and nothing is configured to build them, halt before publishing and ask what should be attached.

## 8. Verify

```sh
gh release view "$next_tag"
git ls-remote --tags origin "$next_tag" "$next_tag^{}"
```

Confirm the release exists, is neither draft nor prerelease (unless the user asked for that), carries the expected assets or none are expected, and that the annotated tag resolves to `release_sha`.

If Homebrew publishing is configured, check the generated cask or formula in the tap for the right version and hashes. When GoReleaser owns that step, spot-check the tap once its workflow is green.

## 9. Documentation sync

Only after verification passes. **This never gates the release**, which is already published; it is a best-effort follow-up.

1. Find the docs that could be stale: `README.md` first, then whatever the changed code maps to (a `docs/` tree, `CHANGELOG.md`, usage or man pages, `--help` fixtures, config references, files the release commits already touched).
2. Check each user-visible change from sections 4 and 5 against them. A `CHANGELOG.md`, if present, expects a `$next_tag` entry.
3. Already accurate? Skip ahead and say so in the final response.
4. Otherwise branch off the release commit. **Never commit docs straight to `main`.**

   ```sh
   docs_branch="docs/release-$next_tag"
   git switch -c "$docs_branch" "$release_sha"
   ```

   Documentation edits only, scoped to what this release shipped. No unrelated doc refactors unless asked.

5. Push and open the PR:

   ```sh
   git add -A
   git commit -m "docs: update for $next_tag"
   git push -u origin "$docs_branch"
   gh pr create --base main --head "$docs_branch" \
     --title "docs: update for $next_tag" \
     --body "$(cat <<'EOF'
   Documentation updates for release <next_tag>.

   <bullet list of what changed and why, mapped to the release notes>
   EOF
   )"
   ```

6. `git switch main` so the worktree is left clean.
7. Don't merge it. Surface the URL, list exactly which docs changed and how, and ask the user to review.

Nothing discoverable, or the release was purely internal? Skip this and say so.

## Final response

- Version released, and the commit it points at
- GitHub Release URL
- CI status and, with GoReleaser, the release workflow status
- The bump reason, one sentence
- Whether GoReleaser was used
- Homebrew tap / cask / formula status, when applicable
- Any non-app changes that were present and ignored
- Documentation outcome: the doc PR URL with a request to review it, or that no changes were needed
