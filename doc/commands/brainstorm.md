# `/schovi:brainstorm` Command

## Description

Explore 2-3 distinct solution options with broad feasibility analysis. This command helps you understand different approaches to solving a problem before diving deep into implementation.

## Purpose

Generate multiple solution approaches with comprehensive analysis of pros, cons, effort, and risks. Helps teams make informed decisions about which approach to pursue.

## Workflow

1. **Phase 1: Input Processing** - Parse Jira ID, GitHub issue, GitHub PR, or description; fetch details via appropriate subagent
2. **Phase 2: Light Codebase Exploration** - Use Task tool with Plan subagent (medium thoroughness) for broad understanding
3. **Phase 3: Generate Solution Options** - Use `brainstorm-generator` subagent to create 2-3 distinct approaches with pros/cons
4. **Phase 4: Output Handling** - Save to work folder, display summary, guide to research command

## Input Sources

- Jira issues (via `jira-analyzer` subagent)
- GitHub issues (via `gh-issue-analyzer` subagent)
- GitHub PRs (via `gh-pr-analyzer` subagent)
- Files or free-form descriptions

## Output

~2000-3000 tokens including:
- Problem summary and constraints
- 2-3 distinct solution options (not variations)
- Comparison matrix (effort, risk, complexity, etc.)
- Recommendation with reasoning
- Next steps: Guide to research command

Saved as: `brainstorm-[id].md`

## Dependencies

### Calls
- `jira-analyzer` agent (for Jira input)
- `gh-issue-analyzer` agent (for GitHub issue input)
- `gh-pr-analyzer` agent (for GitHub PR input)
- `brainstorm-generator` agent (for generating options)
- Plan subagent (via Task tool for codebase exploration)
- `argument-parser` library
- `input-processing` library
- `work-folder` library

### Called By
- User invocation
- Part of workflow: brainstorm → research → plan

## Usage Examples

```bash
# Brainstorm solutions for Jira issue
/schovi:brainstorm EC-1234

# Brainstorm from GitHub PR
/schovi:brainstorm https://github.com/owner/repo/pull/123
/schovi:brainstorm owner/repo#123

# Brainstorm from description
/schovi:brainstorm "Users report login failures after OAuth update"
```

## Quality Gates

All must be met before output:
- Light exploration completed (2-4 minutes, medium mode)
- 2-3 distinct options generated (different approaches, not variations)
- Each option has benefits, challenges, feasibility, effort, risk
- Comparison matrix with consistent criteria
- One option recommended with clear reasoning
- Output saved to work folder as `brainstorm-[id].md`

## Next Steps

After brainstorming, use `/schovi:research` to deeply analyze a specific option:

```bash
/schovi:research --input brainstorm-EC-1234.md --option 2
```

## Location

`schovi/commands/brainstorm.md`
