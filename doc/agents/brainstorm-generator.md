# `brainstorm-generator` Agent

## Description

Context-isolated subagent that generates 2-3 solution options with comprehensive analysis. Transforms problem context and light codebase exploration into structured brainstorm output.

## Purpose

Generate 2-3 distinct solution approaches with:
- Problem summary and constraints
- 2-3 solution options (different approaches, not variations)
- Comprehensive pros/cons for each
- Comparison matrix (effort, risk, complexity, maintainability, etc.)
- Clear recommendation with reasoning
- Next steps guidance

## Input

Context from command including:
- Problem description (from Jira, GitHub, or free-form)
- Codebase exploration results (light, medium thoroughness)
- Constraints and requirements

## Output

~2000-3000 token brainstorm (max 3500 tokens) including:
- Problem summary
- 2-3 distinct solution options with:
  - Benefits (3-5 points)
  - Challenges (3-5 points)
  - Feasibility assessment
  - Effort estimate (Small/Medium/Large)
  - Risk assessment (Low/Medium/High)
- Comparison matrix
- Recommendation with clear reasoning
- Next steps

Follows structure from `templates/brainstorm/full.md`

## Token Budget

**Max 3500 tokens** (strictly enforced)

## Tools Used

- Read tool (to read brainstorm template)
- No external API calls

## Dependencies

### Called By
- `/schovi:brainstorm` command

### Calls
- Read tool only (for template)

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:brainstorm-executor:brainstorm-executor"
  prompt: "Generate 2-3 solution options for [problem context]"
  description: "Generating solution options"
```

## Quality Requirements

- Generate 2-3 DISTINCT options (different approaches, not variations)
- Each option must have benefits, challenges, feasibility, effort, risk
- Comparison matrix must have consistent criteria across options
- One option must be recommended with clear reasoning
- Follow template structure from `templates/brainstorm/full.md`
- Respect 3500 token budget strictly

## Template Integration

Reads and follows structure from:
- `schovi/templates/brainstorm/full.md` - Solution options structure

## Location

`schovi/agents/brainstorm-generator/AGENT.md`
