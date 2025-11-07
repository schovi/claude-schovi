# `/schovi:publish` Command

## Description

Create or update GitHub pull requests with automated branch pushing and smart description generation. Automatically detects existing PRs and updates them on subsequent runs.

## Purpose

Automate PR creation/updates with:
- Auto-push with upstream tracking
- Smart description generation (spec → Jira → commits priority)
- Branch validation and safety checks
- Draft by default for safer workflow
- Update support for existing PRs

## Workflow

1. **Phase 1: Input Parsing** - Parse Jira ID, spec file, flags; auto-detect from branch name
2. **Phase 2: Git State Validation** - Check branch (block main/master), validate naming, check uncommitted changes, detect existing PR
3. **Phase 3: Branch Pushing** - Auto-push with upstream tracking, verify push succeeded
4. **Phase 4: Description Source Detection** - Search for spec file → Jira issue → commit history
5. **Phase 5: PR Description Generation** - Create structured description (Problem/Solution/Changes/Quality & Impact)
6. **Phase 6: PR Title Generation** - Format with Jira ID or from commits (50-100 chars)
7. **Phase 7: PR Creation/Update & Verification** - Execute gh pr create (draft by default) or gh pr edit for updates, verify, display URL, run confetti

## Input Options

- Jira ID (EC-1234)
- Spec file path (./spec-EC-1234.md)
- Flags: `--ready`, `--base`, `--title`, `--no-push`, `--spec`

## Key Features

- **Draft by Default**: Creates draft PRs by default for safer workflow, use --ready for ready PRs
- **Update Support**: Automatically detects and updates existing PRs when called multiple times
- **Auto-Push**: Always push branch before creating/updating PR (unless --no-push)
- **Smart Description**: Auto-detects best source (spec → Jira → commits priority)
- **Concise Format**: Problem/Solution/Changes/Quality & Impact (target 150-250 words, human-readable)
- **Branch Validation**: Blocks main/master, warns on naming mismatch
- **Clean State**: Requires no uncommitted changes
- **Confetti**: Runs confetti celebration on successful PR creation or update

## Description Source Intelligence

**Priority 1: Spec file (./spec-EC-1234.md)**
- Problem: 2-3 sentences from spec Problem section
- Solution: Single paragraph from Technical Overview (no subsections)
- Changes: Grouped bullets from Implementation Tasks (no phases)
- Quality & Impact: Combined testing/breaking/rollback from Testing Strategy

**Priority 2: Jira issue (via jira-analyzer)**
- Problem: Condensed from issue description
- Changes: Simplified from acceptance criteria
- Solution: Brief approach from commits + context
- Quality & Impact: From issue comments + analysis

**Priority 3: Commit history (git log)**
- Problem: Inferred from commit summary
- Changes: Key commits as bullets
- Solution: Technical approach from analysis
- Quality & Impact: Minimal (encourages manual update)

**Brevity Principles**: Remove phase numbering, file:line details, exhaustive lists, verbose explanations. Focus on WHAT changed for human readers, not execution HOW.

## PR Creation Format

```bash
# Default: Draft PR
gh pr create --draft --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"

# With --ready flag: Ready PR
gh pr create --title "EC-1234: Description" \
             --base main \
             --body "$(cat <<'EOF' ... EOF)"
```

## PR Update Format

```bash
# Update description
gh pr edit <number> --body "$(cat <<'EOF' ... EOF)"

# Update title (if --title flag)
gh pr edit <number> --title "New title"

# Convert draft to ready (if --ready flag)
gh pr ready <number>
```

## Dependencies

### Calls
- `jira-analyzer` agent (optional, for Jira context)
- `spec-generator` agent (via reading spec file)
- GitHub CLI (`gh`) via Bash tool
- Git commands via Bash tool
- `argument-parser` library

### Called By
- User invocation (standalone manual command)
- NOT auto-executed by `/schovi:implement`

## Usage Examples

```bash
# Create PR (auto-detect context from branch/spec/commits)
/schovi:publish

# Create draft PR with custom base branch
/schovi:publish --draft --base develop

# Create ready PR for specific Jira issue
/schovi:publish EC-1234 --ready

# Create PR with custom title
/schovi:publish --title "Add OAuth 2.0 support"

# Update existing PR (automatically detected)
/schovi:publish

# Skip auto-push
/schovi:publish --no-push
```

## Integration

Standalone manual command (not auto-executed by implement).

## Location

`schovi/commands/publish.md`
