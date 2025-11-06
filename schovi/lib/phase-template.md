---
name: phase-template
description: Standard command phase structure for consistency and predictability across all commands
---

# Command Phase Template

## Purpose

Defines the standard phase structure that all commands should follow for consistency, predictability, and maintainability.

**Benefits**:
- Consistent user experience across all commands
- Predictable command flow for developers
- Easier to add cross-cutting features
- Reduced development time for new commands
- Clear separation of concerns

## Standard Phase Structure

### PHASE 1: INPUT PROCESSING (Required for all commands)

**Purpose**: Parse arguments, fetch context, resolve work folder

**Standard Steps**:

1. **Argument Parsing**
   - Use: `lib/argument-parser.md`
   - Defines: input type, flags, validation
   - Output: Validated arguments and flags

2. **Context Fetching**
   - Use: `lib/input-processing.md`
   - Supports: Jira, GitHub PR, GitHub Issue, Datadog, text
   - Handles: Subagent invocation, error handling
   - Output: Fetched external context

3. **Work Folder Resolution** (optional for some commands)
   - Use: `lib/work-folder.md`
   - Modes: explicit, auto-detect, create
   - Manages: Metadata, folder structure
   - Output: Work folder path and metadata

**Output**: Validated input, fetched context, work folder path (if applicable)

**Typical Length**: 40-60 lines (with library references)

**Example Reference**:
```markdown
## PHASE 1: INPUT PROCESSING

Use lib/argument-parser.md with configuration:
- Supported inputs: [jira-id, github-pr, github-issue, text]
- Required flags: [--quick, --deep]
- Optional flags: [--output, --post-to-jira]

Use lib/input-processing.md with configuration:
- Sources: [jira, github-pr, github-issue]
- Subagents: [jira-analyzer, gh-pr-analyzer, gh-issue-analyzer]

Use lib/work-folder.md with configuration:
- Mode: auto-detect (from input or cwd)
- Create if missing: true
- Update metadata: true
```

---

### PHASE 2: EXECUTION (Command-specific)

**Purpose**: Perform the core command logic

**Variations by Command**:

**analyze.md**:
- Deep codebase exploration using Plan subagent
- User flow mapping
- Data flow analysis
- Dependency analysis
- Quality assessment

**debug.md**:
- Root cause investigation using Explore subagent
- Execution flow tracing
- Error point analysis
- Impact assessment

**plan.md**:
- Extract analysis content
- Optional context enrichment
- Chosen approach identification

**review.md**:
- Source code fetching via code-fetcher library
- Multi-dimensional analysis
- Issue detection
- Security review

**commit.md**:
- Git state validation
- Change staging and analysis
- Message generation

**publish.md**:
- Branch pushing
- Description source detection
- PR creation/update

**Output**: Command-specific analysis/investigation/action results

**Typical Length**: 200-300 lines (command-specific logic)

**Example Reference**:
```markdown
## PHASE 2: EXECUTION

### Step 1: Prepare Subagent Prompt
[Build prompt with context and requirements]

### Step 2: Spawn Subagent
Use Task tool:
- subagent_type: "schovi:plan:plan"
- prompt: [prepared prompt]
- description: "Deep codebase analysis"

### Step 3: Extract Results
[Parse subagent output and validate]
```

---

### PHASE 3: GENERATION (Optional)

**Purpose**: Transform analysis into structured output using subagent

**When Used**:
- analyze.md → (generates analysis directly, no subagent needed)
- debug.md → debug-fix-generator subagent
- plan.md → spec-generator subagent
- review.md → (generates review directly, no subagent needed)

**Standard Pattern**:

1. Prepare subagent input context
2. Invoke generator subagent
   - Use: `lib/subagent-invoker.md` (optional helper)
   - Agent: [command-specific generator]
3. Validate generated output
   - Check required sections
   - Verify quality gates

**Output**: Structured markdown document (analysis, debug report, spec)

**Typical Length**: 40-60 lines (with subagent invocation)

**Example Reference**:
```markdown
## PHASE 3: GENERATION

### Step 1: Prepare Generator Input
[Format context for generator subagent]

### Step 2: Invoke Generator
Use Task tool:
- subagent_type: "schovi:spec-generator:spec-generator"
- prompt: "Generate spec from analysis: [context]"
- description: "Generating implementation spec"

### Step 3: Validate Output
[Check sections, quality gates]
```

---

### PHASE 3.5: EXIT PLAN MODE (Conditional)

**Purpose**: Transition from plan mode to execution mode

**When Used**:
- Commands that use ExitPlanMode tool
- Commands that need file writing permissions
- Typically: analyze, debug (when writing files)

**Standard Pattern**:

1. Acknowledge transition
2. Use ExitPlanMode tool
   - Provide: summary of work done
3. Confirm execution mode enabled

**Output**: Mode change confirmation

**Typical Length**: 10-15 lines

**Example Reference**:
```markdown
## PHASE 3.5: EXIT PLAN MODE

I've completed the analysis. Now I'll exit plan mode to write the output files.

[Use ExitPlanMode tool with summary]

Execution mode enabled. Proceeding to output handling.
```

---

### PHASE 4: OUTPUT HANDLING (Required for all commands)

**Purpose**: Deliver results to user via terminal, file, and/or Jira

**Standard Steps**:

1. **Terminal Output** (unless --quiet)
   - Display results to user
   - Use structured markdown format
   - Include visual separators

2. **File Writing** (unless --no-file)
   - Write output to file
   - Default naming: `[command]-[id].md`
   - Confirm file created

3. **Jira Posting** (if --post-to-jira)
   - Post summary as Jira comment
   - Link to file if created
   - Confirm posted

4. **Metadata Update** (if work folder exists)
   - Update work folder metadata
   - Track command execution
   - Store references

**Output**: Files created, comments posted, metadata updated

**Typical Length**: 20-30 lines

**Example Reference**:
```markdown
## PHASE 4: OUTPUT HANDLING

### Terminal Output
[Display formatted results to user]

### File Writing
[Write to ./analysis-EC-1234.md]
[Confirm: "✅ Analysis written to ./analysis-EC-1234.md"]

### Jira Posting (if --post-to-jira)
[Post summary comment to Jira]
[Confirm: "✅ Posted to EC-1234"]

### Metadata Update
[Update work folder metadata if exists]
```

---

### PHASE 5: COMPLETION (Required for all commands)

**Purpose**: Provide summary and suggest next steps

**Standard Steps**:

1. **Display Completion Summary**
   - Problem/task summary (1-2 sentences)
   - Outputs created (files, comments)
   - Key results (highlights)

2. **Suggest Next Steps**
   - Primary action (command-specific)
   - Alternative actions
   - Proactive workflow continuation

3. **Handle User Choice**
   - Execute selected action (if user responds)
   - Or finish gracefully

**Output**: Summary displayed, next steps initiated (optional)

**Typical Length**: 20-30 lines

**Example Reference**:
```markdown
## PHASE 5: COMPLETION

### Summary
✅ Analysis complete for EC-1234: [problem summary]

**Outputs**:
- Analysis: ./analysis-EC-1234.md
- Posted to: Jira EC-1234

**Key Findings**:
- [Highlight 1]
- [Highlight 2]

### Next Steps
**Recommended**: `/schovi:plan --input ./analysis-EC-1234.md`
- Generate implementation spec from analysis

**Alternatives**:
- Review analysis and provide feedback
- Share with team for discussion
- Start implementation manually

Would you like me to proceed with generating the spec?
```

---

## Command Length Guidelines

With proper library usage, commands should target:

| Command Type | Target Length | Phases |
|--------------|---------------|--------|
| Simple action | 300-400 lines | 1, 2, 4, 5 |
| Analysis | 450-600 lines | 1, 2, 3.5, 4, 5 |
| Generation | 400-550 lines | 1, 2, 3, 4, 5 |
| Complex workflow | 500-700 lines | 1, 2, 3, 3.5, 4, 5 |

**Breakdown**:
- Phase 1 (libraries): 40-60 lines
- Phase 2 (command-specific): 200-300 lines
- Phase 3 (libraries): 40-60 lines
- Phase 3.5 (conditional): 10-15 lines
- Phase 4 (standard): 20-30 lines
- Phase 5 (standard): 20-30 lines
- Documentation/examples: 50-100 lines

---

## Usage for New Commands

When creating a new command, follow these steps:

### Step 1: Copy Template Structure

```markdown
## PHASE 1: INPUT PROCESSING
[Standard library references - see template above]

## PHASE 2: EXECUTION
[Your command-specific logic here]

## PHASE 3: GENERATION (if needed)
[Standard subagent invocation - see template above]

## PHASE 3.5: EXIT PLAN MODE (if needed)
[Standard exit plan mode pattern - see template above]

## PHASE 4: OUTPUT HANDLING
[Standard library references - see template above]

## PHASE 5: COMPLETION
[Standard completion pattern - see template above]
```

### Step 2: Fill in Phase 2

This is where your command's unique logic goes:
- Define command-specific steps
- Use Task tool for subagents
- Process data and generate results
- Validate against quality gates

### Step 3: Configure Libraries

For each library-based phase:
- Specify configuration parameters
- Define expected inputs/outputs
- Add command-specific customizations

### Step 4: Add Command-Specific Sections

- Quality gates checklist
- Error handling
- Examples
- Usage documentation

### Step 5: Test Thoroughly

- Test all input types
- Test all flags
- Test error cases
- Validate output quality

---

## Examples

### Example 1: analyze.md Structure

```markdown
## PHASE 1: INPUT PROCESSING (50 lines)
- lib/argument-parser.md (jira, github-pr, github-issue, text)
- lib/input-processing.md (fetch context via subagents)
- lib/work-folder.md (auto-detect or create)

## PHASE 2: DEEP CODEBASE ANALYSIS (280 lines)
- Prepare Plan subagent prompt with context
- Spawn Plan subagent for exploration
- Extract findings (user flows, data flows, dependencies)
- Validate completeness

## PHASE 3.5: EXIT PLAN MODE (15 lines)
- Acknowledge analysis complete
- Use ExitPlanMode tool with summary
- Confirm execution mode

## PHASE 4: OUTPUT HANDLING (25 lines)
- Terminal: Display formatted analysis
- File: Write to ./analysis-[id].md
- Jira: Post summary comment (if --post-to-jira)
- Metadata: Update work folder

## PHASE 5: COMPLETION (30 lines)
- Summary: Problem, outputs, key findings
- Suggest: /schovi:plan --input ./analysis-[id].md
- Handle: User response or finish

Total: ~450 lines
```

### Example 2: review.md Structure

```markdown
## PHASE 1: INPUT PROCESSING (40 lines)
- lib/argument-parser.md (github-pr, jira, file, --quick flag)
- lib/input-processing.md (fetch via gh-pr-reviewer or jira-analyzer)

## PHASE 2: SOURCE CODE FETCHING (60 lines)
- lib/code-fetcher.md (prioritize changed files)
- Fetch related dependencies (deep mode only)
- Validate files fetched

## PHASE 2.5: REVIEW ANALYSIS (220 lines)
- Multi-dimensional analysis (functionality, quality, security, performance)
- Issue detection (priority-based organization)
- Recommendations with code examples
- Verdict with merge criteria

## PHASE 4: OUTPUT HANDLING (20 lines)
- Terminal: Display formatted review
- No file writing (review is conversation-only)

Total: ~340 lines
```

### Example 3: commit.md Structure

```markdown
## PHASE 1: INPUT PROCESSING (50 lines)
- lib/argument-parser.md (jira-id, github-pr, notes, --message, --staged-only)
- lib/input-processing.md (optional, only if diff unclear)

## PHASE 2: GIT OPERATIONS (200 lines)
- Branch validation (block main/master)
- Change staging (auto or staged-only)
- Diff analysis (determine commit type)
- Optional context fetching (if diff unclear)
- Message generation (conventional format)
- Commit execution (with verification)

## PHASE 4: OUTPUT HANDLING (20 lines)
- Terminal: Display commit message and SHA
- No file writing (git operation only)

## PHASE 5: COMPLETION (30 lines)
- Summary: Commit created, branch status
- Suggest: /schovi:publish (if multiple commits ready)
- Handle: User response or finish

Total: ~300 lines
```

---

## Deviations from Template

**When to skip phases**:

- **Phase 1 (Work Folder)**: Skip for commands that don't need work folder (commit, publish)
- **Phase 3 (Generation)**: Skip for commands that generate output directly (analyze, review)
- **Phase 3.5 (Exit Plan Mode)**: Skip for commands that don't use plan mode or write files
- **Phase 4 (File Writing)**: Some commands are terminal-only (review, commit)
- **Phase 5 (Next Steps)**: All commands should have completion summary

**When to add custom phases**:

- **Phase 2.5**: For commands with special intermediate steps (review's code fetching)
- **Phase X**: For commands with unique workflows that don't fit standard structure

**Documentation**:
- Always document deviations with clear reasoning
- Update this template if patterns emerge across multiple commands

---

## Benefits of Standardization

**For Users**:
- Consistent command behavior and output format
- Predictable workflow across all commands
- Clear expectations for each command phase

**For Developers**:
- Faster command development (80% faster with libraries)
- Reduced cognitive load (familiar structure)
- Easier maintenance and debugging
- Clear extension points

**For the System**:
- Cross-cutting features can be added in one place
- Library improvements benefit all commands
- Quality gates ensure consistency
- Easier to test and validate

---

## Related Documentation

- **Library System**: `schovi/lib/README.md`
- **Command Scaffolding**: `schovi/lib/command-scaffold.md`
- **Existing Commands**: `schovi/commands/`
- **Architecture**: `CLAUDE.md`
