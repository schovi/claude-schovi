# `research-generator` Agent

## Description

Context-isolated subagent that generates deep technical analysis of a specific approach. Transforms chosen solution and thorough codebase exploration into structured research output.

## Purpose

Generate comprehensive technical analysis with:
- Problem/topic summary with research focus
- Current state analysis with file:line references
- Architecture overview and component interactions
- Technical deep dive (data flow, dependencies, code quality)
- Implementation considerations (complexity, testing, risks)
- Performance and security implications
- Next steps guidance

## Input

Context from command including:
- Chosen solution approach (from brainstorm or direct input)
- Codebase exploration results (deep, thorough mode)
- Technical constraints and requirements

## Output

~4000-6000 token research (max 6500 tokens) including:
- Problem/topic summary
- Current state analysis with file:line references
- Architecture overview
- Component interactions
- Data flow mapping with file:line references
- Dependency identification (direct and indirect)
- Code quality assessment with examples
- Implementation considerations (complexity, testing, risks)
- Performance implications
- Security implications
- Next steps

Follows structure from `templates/research/full.md`

## Token Budget

**Max 6500 tokens** (strictly enforced)

## Tools Used

- Read tool (to read research template)
- No external API calls

## Dependencies

### Called By
- `/schovi:research` command

### Calls
- Read tool only (for template)

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:research-generator"
  prompt: "Generate deep technical analysis for [chosen approach]"
  description: "Generating research analysis"
```

## Quality Requirements

- Architecture must be mapped with file:line references
- Dependencies must be identified (direct and indirect)
- Data flow must be traced with file:line references
- Code quality must be assessed with specific examples
- Implementation considerations must include complexity, risks, testing
- Performance and security must be analyzed
- Follow template structure from `templates/research/full.md`
- Respect 6500 token budget strictly

## Template Integration

Reads and follows structure from:
- `schovi/templates/research/full.md` - Deep technical analysis structure

## Location

`schovi/agents/research-generator/AGENT.md`
