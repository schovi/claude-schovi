---
name: release
description: Cut a CI-gated GitHub release for projects distributed through Homebrew, GoReleaser, GitHub Releases, casks, formulae, or SemVer tags. Handles version selection, CI gating, release notes, optional GoReleaser automation, tag publishing, and release verification. Explicit invocation only (/homebrew:release in Claude Code, `use $release` in Codex).
disable-model-invocation: true
---

# GitHub Homebrew Release

Release only from `main`, only after the exact `main` CI run is green, and always verify that a GitHub Release exists at the end. GoReleaser is optional. Use it when the repo is configured for it.

## Hard Gates

- Release from branch `main` only.
- If the worktree has uncommitted or untracked changes, halt. Summarize the changes and ask how to proceed.
- If currently on any branch other than `main`, detached HEAD, or a worktree for another branch, halt. Explain that releases come from `main` and suggest switching, merging, or cherry-picking to `main`.
- If local `main` is behind `origin/main`, fast-forward it only when the worktree is clean. If it cannot fast-forward, halt.
- If local `main` is ahead of or diverged from `origin/main`, halt. The release commit must be on remote `main` with CI.
- Do not rely on local validation as the release gate. Local commands can provide extra confidence, but remote `main` CI is mandatory.
- Do not create or push a tag until the target commit's `main` CI run is successful.
- If any unexpected command fails, halt with the failure and concrete next steps. Do not work around failed checks.

## Preflight

Run:

```sh
git status --short --branch
git rev-parse --abbrev-ref HEAD
git fetch origin --tags --prune
git status --short --branch
```

Confirm:

- current branch is exactly `main`
- status is clean
- `main` and `origin/main` point at the same commit

Use:

```sh
release_sha="$(git rev-parse HEAD)"
remote_main_sha="$(git rev-parse origin/main)"
test "$release_sha" = "$remote_main_sha"
```

## Check Main CI

Find the latest CI run for the exact release commit on `main`, using JSON rather than table output:

```sh
gh run list --branch main --commit "$release_sha" \
  --json databaseId,status,conclusion,headSha,event,url,workflowName \
  --limit 10
```

Prefer the repo's primary CI workflow. If the repo has a workflow named `CI`, use that run. Otherwise use the required status workflow for `main` if it is clear from context.

Require:

- `headSha` equals `release_sha`
- `event` is `push`
- `status` is `completed`
- `conclusion` is `success`

If the matching run is queued or running, wait:

```sh
gh run watch <run-id> --exit-status
```

If no matching CI run exists, or the run is skipped, cancelled, failed, or timed out, halt. Suggest pushing `main`, rerunning CI, or inspecting the failed run.

## Detect Release Backend

Inspect release configuration:

```sh
find . -maxdepth 3 \( -name '.goreleaser.yml' -o -name '.goreleaser.yaml' -o -path './.github/workflows/*release*.yml' -o -path './.github/workflows/*release*.yaml' \) -print
```

Use GoReleaser when `.goreleaser.yml` or `.goreleaser.yaml` exists and the release workflow is tag-triggered. In that case, tag push should create the GitHub Release, assets, and any configured Homebrew cask/formula update.

If GoReleaser is not configured:

- still create a GitHub Release
- generate or write release notes explicitly
- handle Homebrew separately only if a tap, cask, or formula update path is discoverable
- if Homebrew publishing is expected but no update path is obvious, halt and ask for the tap/formula/cask target

## Decide Version

Find the latest reachable release tag:

```sh
latest_tag="$(git tag --merged HEAD --sort=-v:refname 'v[0-9]*' | head -1)"
test -n "$latest_tag"
```

Evaluate app-related changes first by commit:

```sh
git log --reverse --oneline "$latest_tag"..HEAD
git log --reverse --name-status --format='%h %s' "$latest_tag"..HEAD -- \
  ':!AGENTS.md' \
  ':!CLAUDE.md' \
  ':!.agents/**' \
  ':!.claude/**'
```

Primary rule: treat each commit as the first candidate release-note unit. This works best with granular commits and keeps attribution clear.

Secondary rule: if one commit clearly contains multiple unrelated user-visible changes, split it into separate release-note units based on behavior, command, config, UI surface, or package affected.

Ignore AI-agent instructions, harness-only guidance, and local skill changes when choosing a version. Do this by inspecting commit intent and touched files, not by hardcoding every possible harness path. If only ignored changes exist, halt and ask whether the user still wants a non-app release.

Choose the next SemVer version from the highest-impact app-related change:

- Major: breaking CLI behavior, incompatible config changes, output contract breaks, migration requirements, or destructive behavior changes.
- Minor: new commands, new flags, new user-visible workflows, new config capabilities, or substantial feature additions.
- Patch: bug fixes, small UI polish, docs that affect users, dependency fixes, release fixes, and narrow behavior corrections.

Do not use commit prefixes alone. Inspect the diff enough to justify the bump.

## Release Notes

Write notes for the user-visible changes, based primarily on the commit-by-commit units from `Decide Version`.

Use this structure when sections apply:

````markdown
## Breaking Changes

### <Component or command> <brief change>

<1-2 sentence summary of what changed and why>

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

Guidelines:

- Be specific. Name exact commands, flags, config keys, files, or behavior.
- Include before/after examples for breaking changes.
- Use a comparison table when it clarifies changed roles or behavior.
- Keep internal-only, AI-instruction, and harness-only changes out of public notes unless the user explicitly wants them included.

## Tag And Release

Compute `next_tag` from the selected SemVer version, including the leading `v`.

Before tagging, ensure the tag and GitHub Release do not already exist:

```sh
git tag --list "$next_tag"
git ls-remote --tags origin "$next_tag" "$next_tag^{}"
gh release view "$next_tag" 2>/dev/null
```

Create and push an annotated tag on the release commit:

```sh
git tag -a "$next_tag" "$release_sha" -m "$next_tag"
git push origin "refs/tags/$next_tag"
```

### With GoReleaser

Watch the tag-triggered release workflow:

```sh
gh run list --limit 10
gh run watch <run-id> --exit-status
```

If the release workflow fails, halt. Do not delete or recreate tags without explicit user direction.

After the workflow succeeds, edit generated release notes if needed:

```sh
gh release edit "$next_tag" --notes "$(cat <<'EOF'
<release notes>
EOF
)"
```

### Without GoReleaser

Create the GitHub Release explicitly:

```sh
gh release create "$next_tag" --target "$release_sha" --title "$next_tag" --notes "$(cat <<'EOF'
<release notes>
EOF
)"
```

If binaries or archives are expected but no build/publish process is configured, halt before publishing and ask what artifacts should be attached.

## Final Verification

Verify:

```sh
gh release view "$next_tag"
git ls-remote --tags origin "$next_tag" "$next_tag^{}"
```

Confirm:

- GitHub Release exists
- release is not draft unless the user explicitly requested a draft
- release is not prerelease unless the user explicitly requested a prerelease
- expected assets are present, or no assets are expected
- annotated tag resolves to `release_sha`

If Homebrew publishing is configured, verify the generated cask or formula version and hashes in the tap. If GoReleaser handles Homebrew, spot-check the tap after the release workflow succeeds.

## Final Response

Report:

- released version and commit
- GitHub Release URL
- CI run status and release workflow status
- version-bump reason in one sentence
- whether GoReleaser was used
- Homebrew tap/cask/formula status when applicable
- any ignored non-app changes that were present
