# `/schovi:research` Command

## Description

Deep technical analysis of ONE specific approach with detailed file:line references. This command provides comprehensive understanding of how to implement a specific solution.

## Purpose

Transform a chosen solution approach from brainstorming into a detailed technical analysis with architecture mapping, dependency identification, and implementation considerations.

## Workflow

1. **Phase 1: Input Classification** - Parse `--input` (brainstorm file, Jira ID, GitHub URL, file, text) and extract research target
2. **Phase 1 (cont): Option Selection** - If brainstorm file, extract option via `--option N` flag or ask user interactively
3. **Phase 2: Deep Codebase Exploration** - Use Task tool with Plan subagent (thorough mode) for comprehensive analysis
4. **Phase 3: Generate Deep Research** - Use `research-generator` subagent to create detailed technical analysis
5. **Phase 4: Output Handling** - Save to work folder, display summary, guide to plan command

## Input Sources

- Brainstorm files with `--option N` flag (e.g., `--input brainstorm-EC-1234.md --option 2`)
- Jira issues (via `jira-analyzer` subagent)
- GitHub issues/PRs (via respective subagents)
- Files or direct descriptions

## Output

~4000-6000 tokens including:
- Problem/topic summary with research focus
- Current state analysis with file:line references
- Architecture overview and component interactions
- Technical deep dive (data flow, dependencies, code quality)
- Implementation considerations (complexity, testing, risks)
- Performance and security implications
- Next steps: Guide to plan command

Saved as: `research-[id].md` or `research-[id]-option[N].md`

## Dependencies

### Calls
- `jira-analyzer` agent (for Jira input)
- `gh-issue-analyzer` agent (for GitHub issue input)
- `gh-pr-analyzer` agent (for GitHub PR input)
- `research-generator` agent (for generating analysis)
- Plan subagent (via Task tool for deep codebase exploration)
- `argument-parser` library
- `input-processing` library
- `work-folder` library

### Called By
- User invocation
- Part of workflow: brainstorm → research → plan

## Usage Examples

```bash
# Research specific option from brainstorm
/schovi:research --input brainstorm-EC-1234.md --option 2

# Research directly from Jira
/schovi:research --input EC-1234

# Research from GitHub PR
/schovi:research --input https://github.com/owner/repo/pull/123

# Research from description
/schovi:research --input "Implement OAuth 2.0 refresh token flow"
```

## Quality Gates

All must be met before output:
- Deep exploration completed (4-6 minutes, thorough mode)
- Architecture mapped with file:line references
- Dependencies identified (direct and indirect)
- Data flow traced with file:line references
- Code quality assessed with specific examples
- Implementation considerations provided (complexity, risks, testing)
- Performance and security analyzed
- Output saved to work folder as `research-[id].md` or `research-[id]-option[N].md`

## Next Steps

After research, use `/schovi:plan` to generate implementation specification:

```bash
/schovi:plan --input research-EC-1234-option2.md
```

## Location

`schovi/commands/research.md`
