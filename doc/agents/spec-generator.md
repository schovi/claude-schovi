# `spec-generator` Agent

## Description

Context-isolated subagent that generates implementation specifications from research analysis. Transforms research into actionable spec with tasks, criteria, and testing strategy.

## Purpose

Generate implementation specification with:
- Problem summary and chosen approach
- Technical overview (data flows, affected services, key changes)
- Implementation tasks (broken into phases with checkboxes)
- Acceptance criteria (testable, specific success conditions)
- Testing strategy (unit, integration, manual scenarios)
- Risks and mitigations
- References (analysis, Jira, docs)

## Input

Context from command including:
- Research content (problem, approach, technical details)
- File:line references from research
- Constraints and requirements

## Output

~1500-2500 token spec (max 3000 tokens) including:
- YAML frontmatter (metadata)
- Problem summary
- Decision & Rationale
- Technical Overview
- Implementation Tasks (phased with checkboxes)
- Acceptance Criteria (testable)
- Testing Strategy
- Risks & Mitigations
- References

Follows structure from `templates/spec/full.md`

## Token Budget

**Max 3000 tokens** (strictly enforced)

## Tools Used

- Read tool (to read spec template)
- No external API calls

## Dependencies

### Called By
- `/schovi:plan` command

### Calls
- Read tool only (for template)

## Usage Pattern

Invoked via Task tool with fully qualified name:

```
Task tool:
  subagent_type: "schovi:spec-generator"
  prompt: "Generate implementation spec from research: [research content]"
  description: "Generating implementation spec"
```

## Quality Requirements

- Implementation tasks must be specific and actionable
- Acceptance criteria must be testable
- File references must use `file:line` format
- Testing strategy must cover unit, integration, manual scenarios
- Risks must have mitigations
- Follow template structure from `templates/spec/full.md`
- Respect 3000 token budget strictly

## Template Integration

Reads and follows structure from:
- `schovi/templates/spec/full.md` - Implementation spec structure

## Location

`schovi/agents/spec-generator/AGENT.md`
