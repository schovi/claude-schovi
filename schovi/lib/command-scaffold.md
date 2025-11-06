---
name: command-scaffold
description: Guide for rapidly creating new commands using standardized templates and libraries
---

# Command Scaffolding Guide

## Quick Start

To create a new command in **under 4 hours**, follow these steps:

### Step 1: Copy Phase Template

```bash
# Start with the standard phase structure
cp schovi/lib/phase-template.md schovi/commands/new-command.md
```

### Step 2: Update Frontmatter

```yaml
---
description: [Brief command description, 1-2 sentences]
argument-hint: [input] [--flag1] [--flag2]
allowed-tools: ["Task", "Read", "Write", "Bash", "lib/*"]
---
```

**Examples**:
- Description: "Analyze problems deeply with codebase exploration and solution proposals"
- Argument hint: `[jira-id|github-pr|description] [--quick] [--output FILE]`

### Step 3: Define Command Type

Choose the type that best matches your command:

| Type | Purpose | Phases | Typical Length |
|------|---------|--------|----------------|
| Analysis | Explore and understand | 1, 2, 3.5, 4, 5 | 450-600 lines |
| Action | Perform operation | 1, 2, 4, 5 | 300-400 lines |
| Review | Evaluate and feedback | 1, 2, 4 | 350-450 lines |
| Generation | Create artifacts | 1, 2, 3, 4, 5 | 400-550 lines |

### Step 4: Fill in Phase 2 (Command Logic)

This is your command's unique logic:
- Define command-specific steps
- Use Task tool for subagents
- Process data and generate results
- Validate against quality gates

### Step 5: Configure Libraries

For each library-based phase:
- Specify configuration parameters
- Define expected inputs/outputs
- Add command-specific customizations

### Step 6: Add Quality Gates

Define what "done" means for your command:
- Required outputs
- Validation criteria
- Success metrics

### Step 7: Test Thoroughly

- Test all input types
- Test all flags
- Test error cases
- Validate output quality

---

## Command Type Templates

### Type 1: Analysis Command

**Purpose**: Explore and understand problems, provide insights

**Example**: `analyze.md`, `debug.md`

**Template Structure**:
```markdown
---
description: [Analyze X to understand Y]
argument-hint: [input] [--quick] [--output FILE]
allowed-tools: ["Task", "Read", "Write", "Bash", "lib/*"]
---

# [Command Name] Command

## Overview
[What this command does and when to use it]

## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [jira-id, github-pr, github-issue, text]
- Required flags: []
- Optional flags: [--quick, --output, --post-to-jira]

Use lib/input-processing.md with configuration:
- Sources: [jira, github-pr, github-issue]
- Subagents: [jira-analyzer, gh-pr-analyzer, gh-issue-analyzer]

Use lib/work-folder.md with configuration:
- Mode: auto-detect
- Create if missing: true

## PHASE 2: EXECUTION

### Step 1: Prepare Analysis Prompt
[Define what to analyze]

### Step 2: Spawn Analysis Subagent
Use Task tool:
- subagent_type: "general-purpose"  or "Explore"
- prompt: [prepared prompt]
- description: "Analyzing [topic]"

### Step 3: Extract and Validate Results
[Parse subagent output]
[Validate quality gates]

## PHASE 3.5: EXIT PLAN MODE

[If writing files needed]
Use ExitPlanMode tool with summary

## PHASE 4: OUTPUT HANDLING

### Terminal Output
[Display results]

### File Writing
Write to: ./[command]-[id].md

### Jira Posting (if --post-to-jira)
[Post summary]

### Metadata Update
[Update work folder]

## PHASE 5: COMPLETION

### Summary
[Problem summary]
[Outputs created]
[Key findings]

### Next Steps
Recommend: /schovi:[next-command]

## Quality Gates
- [ ] [Gate 1]
- [ ] [Gate 2]
- [ ] [Gate 3]

## Examples
[Usage examples]
```

**Typical Length**: 450-600 lines

---

### Type 2: Action Command

**Purpose**: Perform specific operations (git, PR management, etc.)

**Example**: `commit.md`, `publish.md`

**Template Structure**:
```markdown
---
description: [Perform X operation]
argument-hint: [input] [--flag]
allowed-tools: ["Bash", "Read", "Write", "lib/*"]
---

# [Command Name] Command

## Overview
[What this command does]

## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [jira-id, github-pr, notes]
- Required flags: []
- Optional flags: [--flag1, --flag2]

[Optional: Use lib/input-processing.md if external context needed]

## PHASE 2: EXECUTION

### Step 1: Validate Preconditions
[Check state, permissions, etc.]

### Step 2: Perform Operation
[Execute git commands, API calls, etc.]

### Step 3: Verify Success
[Check operation completed]

## PHASE 4: OUTPUT HANDLING

### Terminal Output
[Display operation result]

[Optional: File writing if needed]

## PHASE 5: COMPLETION

### Summary
[Operation performed]
[Result status]

### Next Steps
[Suggest follow-up action]

## Quality Gates
- [ ] [Gate 1]
- [ ] [Gate 2]

## Examples
[Usage examples]
```

**Typical Length**: 300-400 lines

---

### Type 3: Review Command

**Purpose**: Evaluate code/specs and provide feedback

**Example**: `review.md`

**Template Structure**:
```markdown
---
description: [Review X and provide feedback]
argument-hint: [input] [--quick]
allowed-tools: ["Task", "Read", "Bash", "lib/*"]
---

# [Command Name] Command

## Overview
[What this command reviews]

## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [github-pr, jira, file]
- Optional flags: [--quick]

Use lib/input-processing.md with configuration:
- Sources: [github-pr, jira, file]
- Subagents: [gh-pr-reviewer, jira-analyzer]

## PHASE 2: REVIEW ANALYSIS

### Step 1: Fetch Source Code (if applicable)
Use lib/code-fetcher.md with configuration:
- Files: [from context]
- Mode: [deep | quick]

### Step 2: Multi-Dimensional Analysis
[Analyze functionality, quality, security, performance]

### Step 3: Issue Detection
[Identify issues by priority]

### Step 4: Recommendations
[Provide actionable suggestions]

## PHASE 4: OUTPUT HANDLING

### Terminal Output
[Display structured review]

[No file writing - review is conversation-only]

## Quality Gates
- [ ] [Gate 1]
- [ ] [Gate 2]

## Examples
[Usage examples]
```

**Typical Length**: 350-450 lines

---

### Type 4: Generation Command

**Purpose**: Create artifacts from analysis (specs, reports, etc.)

**Example**: `plan.md`

**Template Structure**:
```markdown
---
description: [Generate X from Y]
argument-hint: [input] [--output FILE]
allowed-tools: ["Task", "Read", "Write", "lib/*"]
---

# [Command Name] Command

## Overview
[What this command generates]

## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [analysis-file, conversation]
- Optional flags: [--output, --post-to-jira]

[Extract analysis content from input]

Use lib/work-folder.md with configuration:
- Mode: auto-detect

## PHASE 2: PREPARATION

### Step 1: Validate Input
[Ensure analysis content is complete]

### Step 2: Extract Key Information
[Parse analysis sections]

## PHASE 3: GENERATION

### Step 1: Prepare Generator Input
[Format context for generator]

### Step 2: Invoke Generator Subagent
Use Task tool:
- subagent_type: "[generator-agent]"
- prompt: [context]
- description: "Generating [artifact]"

### Step 3: Validate Output
[Check sections, quality gates]

## PHASE 4: OUTPUT HANDLING

### Terminal Output
[Display generated artifact]

### File Writing
Write to: ./[artifact]-[id].md

### Jira Posting (if --post-to-jira)
[Post artifact]

## PHASE 5: COMPLETION

### Summary
[Artifact generated]
[Outputs created]

### Next Steps
[Suggest implementation or review]

## Quality Gates
- [ ] [Gate 1]
- [ ] [Gate 2]

## Examples
[Usage examples]
```

**Typical Length**: 400-550 lines

---

## Library Configuration Patterns

### Pattern 1: Full Input Processing

**Use when**: Command accepts multiple input types (Jira, GitHub, text)

```markdown
## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [jira-id, github-pr, github-issue, text]
- Required flags: []
- Optional flags: [--quick, --output FILE, --post-to-jira]

Use lib/input-processing.md with configuration:
- Sources:
  - jira: true (Jira issue ID like EC-1234)
  - github_pr: true (PR URL or owner/repo#123)
  - github_issue: true (Issue URL or owner/repo#123)
  - text: true (Free-form description)
- Subagents:
  - jira: schovi:jira-analyzer:jira-analyzer
  - github_pr: schovi:gh-pr-analyzer:gh-pr-analyzer
  - github_issue: schovi:gh-issue-analyzer:gh-issue-analyzer

Use lib/work-folder.md with configuration:
- Mode: auto-detect (from input ID or current directory)
- Create if missing: true
- Update metadata: true
```

### Pattern 2: Minimal Input Processing

**Use when**: Command has simple input (just a flag or text)

```markdown
## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [none] (command-specific logic)
- Required flags: []
- Optional flags: [--staged-only, --message TEXT]

[No lib/input-processing.md needed]
[No lib/work-folder.md needed]
```

### Pattern 3: Analysis Input Only

**Use when**: Command operates on previous analysis (like plan.md)

```markdown
## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [analysis-file]
- Required flags: []
- Optional flags: [--input FILE, --output FILE]

[Read analysis file or extract from conversation]

Use lib/work-folder.md with configuration:
- Mode: explicit (from analysis file path)
- Create if missing: false
```

---

## Testing Checklist

Before considering your command complete, test:

### Input Validation
- [ ] Valid Jira ID (if supported)
- [ ] Valid GitHub PR URL (if supported)
- [ ] Valid GitHub PR short notation (if supported)
- [ ] Valid GitHub issue (if supported)
- [ ] Valid file path (if supported)
- [ ] Free-form text (if supported)
- [ ] Invalid input (should error gracefully)

### Flag Handling
- [ ] All required flags work
- [ ] All optional flags work
- [ ] Flag combinations work correctly
- [ ] Missing required flags error appropriately

### Output Verification
- [ ] Terminal output formatted correctly
- [ ] File writing works (if applicable)
- [ ] File naming follows convention
- [ ] Jira posting works (if applicable)
- [ ] Metadata updates work (if applicable)

### Error Handling
- [ ] Invalid input handled gracefully
- [ ] Missing dependencies handled (MCP servers, etc.)
- [ ] Network errors handled (GitHub, Jira)
- [ ] File system errors handled (permissions, disk space)
- [ ] Partial failures handled (some data fetched, some failed)

### Quality Gates
- [ ] All quality gates defined
- [ ] All quality gates validated before completion
- [ ] Output meets quality standards

### Performance
- [ ] Command completes in reasonable time (<5 min for most)
- [ ] Subagents used efficiently (parallel where possible)
- [ ] Token usage optimized

---

## Documentation Template

Every command should include:

### 1. Overview Section
```markdown
# [Command Name] Command

## Overview
[2-3 sentences describing what this command does and when to use it]

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Workflow
1. Step 1
2. Step 2
3. Step 3
```

### 2. Input/Output Documentation
```markdown
## Input Options
- **Jira ID** (EC-1234): [Description]
- **GitHub PR** (URL or owner/repo#123): [Description]
- **File path** (./file.md): [Description]

## Flags
- `--quick`: [Description]
- `--output FILE`: [Description]
- `--post-to-jira`: [Description]

## Output
- **Terminal**: [Description]
- **File**: [Description and naming]
- **Jira**: [Description if applicable]
```

### 3. Examples Section
```markdown
## Examples

### Example 1: [Scenario]
```bash
/schovi:[command] [input] [flags]
```
[Description of what happens]

### Example 2: [Scenario]
```bash
/schovi:[command] [input] [flags]
```
[Description of what happens]
```

### 4. Quality Gates Section
```markdown
## Quality Gates

All of these must be met before completion:
- [ ] [Gate 1 with specific criteria]
- [ ] [Gate 2 with specific criteria]
- [ ] [Gate 3 with specific criteria]
- [ ] [Gate N with specific criteria]
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Use Libraries

**Problem**: Duplicating argument parsing, input fetching logic

**Solution**: Always check if a library exists before writing custom logic

**Check**:
- `lib/argument-parser.md` - Argument parsing
- `lib/input-processing.md` - Context fetching
- `lib/work-folder.md` - Work folder management
- `lib/code-fetcher.md` - Source code fetching
- `lib/subagent-invoker.md` - Subagent invocation

### Pitfall 2: Unclear Quality Gates

**Problem**: Command completes without clear success criteria

**Solution**: Define specific, testable quality gates

**Good Example**:
```markdown
- [ ] All affected files identified with file:line references
- [ ] At least 2 solution options provided
- [ ] Each solution has pros/cons analysis
- [ ] Implementation plan includes testing strategy
```

**Bad Example**:
```markdown
- [ ] Analysis complete
- [ ] Output generated
```

### Pitfall 3: Poor Error Handling

**Problem**: Command crashes on invalid input or network errors

**Solution**: Handle all error cases gracefully with clear user guidance

**Template**:
```markdown
If [error condition]:
1. Detect error early
2. Provide clear error message
3. Suggest remediation
4. Exit gracefully (don't crash)
```

### Pitfall 4: Token Inefficiency

**Problem**: Fetching large payloads directly instead of using subagents

**Solution**: Always use subagents for external data fetching

**Rule**: If API/CLI returns >5KB, use a subagent to condense

### Pitfall 5: Inconsistent Output Format

**Problem**: Output doesn't follow established patterns

**Solution**: Use standard markdown formatting with icons

**Template**:
```markdown
# [Title]

## [Section]
- **Key**: Value
- **Key**: Value

## [Section]
[Content with icons: ✅ ❌ ⏳ 💬]
```

---

## Development Workflow

### Week 1: Design & Prototype (Day 1-2)

**Day 1 (4 hours)**:
1. Define command purpose and scope
2. Choose command type
3. Design input/output formats
4. Define quality gates
5. Write overview documentation

**Day 2 (4 hours)**:
1. Copy phase template
2. Configure library usage
3. Write Phase 2 (command logic) outline
4. Create 2-3 test scenarios

### Week 1: Implementation (Day 3-4)

**Day 3 (6 hours)**:
1. Implement Phase 1 (input processing)
2. Implement Phase 2 (command logic)
3. Implement Phase 4 (output handling)
4. Basic testing

**Day 4 (4 hours)**:
1. Implement error handling
2. Add examples
3. Validate quality gates
4. Comprehensive testing

### Week 1: Polish & Release (Day 5)

**Day 5 (2 hours)**:
1. Code review
2. Documentation review
3. Final testing
4. Release and announce

**Total Time**: ~20 hours spread over 5 days

---

## Success Metrics

Your command is ready when:

- [ ] Follows phase template structure
- [ ] Uses libraries where applicable
- [ ] Has clear quality gates
- [ ] Handles all error cases
- [ ] Has 2-3 usage examples
- [ ] Documentation is complete
- [ ] Testing checklist complete
- [ ] Code reviewed by peer
- [ ] Token efficiency validated
- [ ] Performance acceptable (<5 min for most)

---

## Related Documentation

- **Phase Template**: `schovi/lib/phase-template.md`
- **Subagent Template**: `schovi/agents/TEMPLATE.md`
- **Library System**: `schovi/lib/README.md`
- **Existing Commands**: `schovi/commands/` (for reference)
- **Architecture**: `CLAUDE.md`
