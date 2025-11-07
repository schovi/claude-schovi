# `/schovi:plan` Command

## Description

Generate implementation specifications from research analysis. Transforms research into actionable implementation specs with specific tasks and acceptance criteria.

## Purpose

**Does NOT perform research** - transforms existing research into actionable specs. Enforces research-first workflow to ensure specs have specific file:line references and technical context.

## Workflow

1. **Phase 1: Input Validation** - Classify input type; STOP if brainstorm/raw input detected, direct user to research first
2. **Phase 1 (cont): Extract Research** - Read from file or conversation; validate has file:line refs
3. **Phase 1.5: Optional Enrichment** - Ask user if they want to enrich vague component references via Explore subagent
4. **Phase 2: Spec Generation** - Use `spec-generator` subagent to transform research into structured spec
5. **Phase 3: Output Handling** - Terminal, file, optional Jira posting

## Critical Requirements

**Research-First Enforcement:**
- ✅ Accepts: Research files, conversation research, or from-scratch mode
- ❌ REJECTS: Brainstorm files (must run research first)
- ❌ REJECTS: Raw inputs like Jira IDs, GitHub URLs (must research first)

## Valid Input Sources

- Research file via `--input ./research-EC-1234.md`
- Analysis file via `--input ./analysis-EC-1234.md` (legacy compatibility)
- Conversation output from recent `/schovi:research` command
- From-scratch via `--from-scratch "description"` (bypasses research, creates minimal spec)

## Invalid Input Sources

Will STOP with guidance:
- Brainstorm files (brainstorm-*.md) - **Must run** `/schovi:research --input brainstorm-*.md --option N` **first**
- Jira IDs (EC-1234) - **Must run** `/schovi:research --input EC-1234` **first**
- GitHub issue/PR URLs - **Must research first**
- Free-form descriptions without `--from-scratch` flag

## Dependencies

### Calls
- `spec-generator` agent (for generating specs)
- Explore subagent (optional, for enrichment)
- `argument-parser` library
- `input-processing` library
- `work-folder` library

### Called By
- User invocation
- Part of workflow: brainstorm → research → plan → implement

## Usage Examples

```bash
# ❌ Wrong: Brainstorm file (will STOP with guidance)
/schovi:plan --input brainstorm-EC-1234.md

# ❌ Wrong: Raw Jira ID (will STOP with guidance)
/schovi:plan EC-1234

# ✅ Right: Full workflow
/schovi:brainstorm EC-1234
/schovi:research --input brainstorm-EC-1234.md --option 2
/schovi:plan --input research-EC-1234-option2.md

# ✅ Or skip brainstorm, go direct to research
/schovi:research --input EC-1234
/schovi:plan --input research-EC-1234.md

# ✅ Or use conversation
/schovi:research --input EC-1234
/schovi:plan  # auto-detects from conversation

# ✅ Or from-scratch for simple tasks
/schovi:plan --from-scratch "Add loading spinner"
```

## Output Modes

- **Terminal**: Display spec in console
- **File**: Save to `./spec-[id].md` (default)
- **Jira**: Optional posting to Jira issue comment (--post-to-jira)

## Quality Gates

All must be met before output:
- Input validated as research (not brainstorm or raw)
- Research content successfully extracted
- Chosen approach identified (if multiple options in research)
- Spec generated via spec-generator subagent
- Implementation tasks are specific and actionable
- Acceptance criteria are testable
- File references use `file:line` format

## Next Steps

After planning, use `/schovi:implement` to execute the spec:

```bash
/schovi:implement ./spec-EC-1234.md
```

## Location

`schovi/commands/plan.md`
