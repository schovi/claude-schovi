# Phase 3: Advanced Improvements

**Timeline**: Week 3 (5-7 days)
**Priority**: 🟢 Medium - Optimizations and advanced features
**Status**: 📋 Blocked (Requires Phase 2 completion)

---

## 📝 Overview

Apply advanced architectural improvements that further simplify the system, improve maintainability, and enable future extensibility. This phase focuses on quality-of-life improvements rather than core functionality.

**Core Goal**: Reduce complexity, improve clarity, and create reusable patterns for future development.

---

## 🎯 Objectives

1. **Split gh-pr-analyzer** into two simpler, purpose-specific agents
2. **Create phase template system** for standardized command structure
3. **Implement code-fetcher library** to simplify review command
4. **Optimize subagent architectures** based on actual usage patterns
5. **Create command scaffolding tools** for rapid new command development

---

## 📊 Problem Analysis

### Issue #1: gh-pr-analyzer Too Complex

**Current State**:
- Single agent: `gh-pr-analyzer/AGENT.md` (869 lines)
- Two modes: "compact" (800-1200 tokens) and "full" (2000-15000 tokens)
- Complex mode switching logic
- Different users: analyze/debug/plan (compact) vs review (full)
- Difficult to maintain: mode-specific rules scattered throughout

**Impact**:
- Hard to understand which mode to use
- Testing requires validating both modes
- Changes affect multiple use cases
- Mode logic adds cognitive overhead

**Target State**:
```
gh-pr-analyzer/AGENT.md        (compact mode only, ~350 lines)
  - Used by: analyze, debug, plan commands
  - Output: 800-1200 tokens
  - Focus: Essential PR metadata

gh-pr-reviewer/AGENT.md         (full mode only, ~500 lines)
  - Used by: review command
  - Output: 2000-15000 tokens
  - Focus: Complete diff + comprehensive data
```

**Benefits**:
- 40% reduction in agent complexity
- Clear purpose separation
- Easier to test and maintain
- No mode switching logic

---

### Issue #2: No Standardized Command Structure

**Current State**:
- Each command defines its own phase structure
- Phase numbering varies (Phase 1, 2, 3 vs Phase 1, 1.5, 2)
- Section names inconsistent
- No template for new commands

**Impact**:
- New commands start from scratch
- Inconsistent user experience
- Hard to predict command flow
- Difficult to add cross-cutting features

**Target State**:
```
schovi/lib/phase-template.md

Defines standard phases:
- PHASE 1: INPUT PROCESSING (all commands)
- PHASE 2: EXECUTION (command-specific)
- PHASE 3: GENERATION (optional)
- PHASE 3.5: EXIT PLAN MODE (if using plan mode)
- PHASE 4: OUTPUT HANDLING (all commands)
- PHASE 5: COMPLETION (all commands)

Commands reference template and fill in specifics.
```

---

### Issue #3: Review Command Source Fetching Complex

**Current State**:
- Phase 2.5 in review.md: 145 lines describing three fetching methods
- Logic mixed with documentation
- Hard to extend (e.g., add new source)
- Testing requires mocking all three methods

**Target State**:
```
schovi/lib/code-fetcher.md      (~80 lines)

Strategy pattern:
1. Try local filesystem (preferred)
2. Try JetBrains MCP (if available)
3. Try GitHub API (fallback)

Handles: method detection, file prioritization, error fallback
```

**Benefits**:
- Reusable in other commands
- Easier to test
- Clear priority logic
- Simple to add new sources

---

### Issue #4: Subagent Template Inconsistency

**Current State**:
- 7 subagents with similar structure but variations
- Visual formatting inconsistent (different box styles)
- Error templates vary
- Token budgets not always enforced

**Target State**:
- Standard subagent template
- Consistent visual formatting
- Enforced token budgets
- Quality gates checklist

---

## 🛠️ Detailed Tasks

### Task 3.1: Split gh-pr-analyzer

**Effort**: 6-8 hours
**Dependencies**: Phase 2 complete

#### Subtask 3.1.1: Create `gh-pr-reviewer/AGENT.md`

**Purpose**: Dedicated agent for comprehensive PR review (used by review command)

**Action Items**:

1. **Create directory and file** (10 min):
   ```bash
   mkdir -p schovi/agents/gh-pr-reviewer
   cp schovi/agents/gh-pr-analyzer/AGENT.md schovi/agents/gh-pr-reviewer/AGENT.md
   ```

2. **Remove compact mode logic** (60 min):
   - Remove mode parameter
   - Remove conditional logic based on mode
   - Keep only "full mode" sections
   - Simplify to single purpose

3. **Optimize for review use case** (90 min):
   - Always fetch ALL changed files
   - Always include complete diff (for normal PRs)
   - Always include PR head SHA
   - Always include all reviews (not just 3)
   - Always include all CI checks
   - Optimize file sorting for review prioritization

4. **Update frontmatter** (10 min):
   ```yaml
   ---
   name: gh-pr-reviewer
   description: Fetches comprehensive PR data for code review including complete diff, all files, all reviews, and all CI checks
   allowed-tools: ["Bash"]
   ---
   ```

5. **Update token budget** (15 min):
   - Remove compact mode budget (1200 tokens)
   - Keep full mode budgets:
     - Normal PRs (≤50 files, ≤5000 lines): Max 15000 tokens
     - Massive PRs (>50 files or >5000 lines): Max 3000 tokens

6. **Simplify examples** (30 min):
   - Remove compact mode examples
   - Add review-specific examples
   - Show file prioritization for review

7. **Test thoroughly** (90 min):
   - Test with small PR (5 files)
   - Test with medium PR (20 files)
   - Test with large PR (50 files)
   - Test with massive PR (100+ files)
   - Verify diff included for normal PRs
   - Verify diff omitted for massive PRs
   - Validate token budgets

**Deliverable**: `schovi/agents/gh-pr-reviewer/AGENT.md` (~500 lines)

#### Subtask 3.1.2: Simplify `gh-pr-analyzer/AGENT.md`

**Purpose**: Streamline original agent for compact mode only

**Action Items**:

1. **Remove full mode logic** (60 min):
   - Remove mode parameter
   - Remove conditional "if full mode" sections
   - Remove diff fetching logic
   - Remove file-level stats fetching
   - Keep only compact mode essentials

2. **Simplify output structure** (45 min):
   - Remove "Full Mode Only" sections
   - Remove PR head SHA (not needed for compact)
   - Remove detailed file stats
   - Keep top 20 files list
   - Keep condensed reviews (max 3)
   - Keep failed CI checks only

3. **Update documentation** (30 min):
   - Remove mode explanation
   - Clarify: "Used by analyze, debug, plan commands"
   - Update examples to show only compact output

4. **Enforce token budget** (15 min):
   - Target: 800-1000 tokens
   - Max: 1200 tokens
   - Add validation in footer

5. **Test thoroughly** (60 min):
   - Test with analyze command
   - Test with debug command
   - Test with plan command
   - Verify compact output
   - Validate token budget

**Deliverable**: Simplified `schovi/agents/gh-pr-analyzer/AGENT.md` (~350 lines)

#### Subtask 3.1.3: Update Commands to Use Correct Agent

**Purpose**: Route commands to appropriate agent

**Action Items**:

1. **Update review.md** (15 min):
   ```markdown
   # Before
   subagent_type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
   prompt: "Fetch and summarize GitHub PR [input] with mode: full"

   # After
   subagent_type: "schovi:gh-pr-reviewer:gh-pr-reviewer"
   prompt: "Fetch and summarize GitHub PR [input]"
   ```

2. **Verify analyze.md** (10 min):
   - Already uses gh-pr-analyzer
   - No changes needed (defaults to compact)

3. **Verify debug.md** (10 min):
   - Already uses gh-pr-analyzer
   - No changes needed

4. **Verify plan.md** (10 min):
   - Uses gh-pr-analyzer if needed
   - No changes needed

5. **Update CLAUDE.md** (20 min):
   - Document both agents
   - Explain usage distinction
   - Update architecture diagram

**Deliverable**: Updated command references and documentation

**Total Task 3.1 Effort**: 6-8 hours

---

### Task 3.2: Create Phase Template System

**Effort**: 4-5 hours
**Dependencies**: None (documentation-focused)

#### Subtask 3.2.1: Create `lib/phase-template.md`

**Purpose**: Standardize command structure across all commands

**Implementation**:

```markdown
---
name: phase-template
description: Standard command phase structure for consistency and predictability
---

# Command Phase Template

## Purpose
Defines the standard phase structure that all commands should follow for consistency, predictability, and maintainability.

## Standard Phase Structure

### PHASE 1: INPUT PROCESSING (Required for all commands)

**Purpose**: Parse arguments, fetch context, resolve work folder

**Standard Steps**:
1. Argument Parsing
   - Use: lib/argument-parser.md
   - Defines: input type, flags, validation

2. Context Fetching
   - Use: lib/input-processing.md
   - Supports: Jira, GitHub PR, GitHub Issue, Datadog, text
   - Handles: Subagent invocation, error handling

3. Work Folder Resolution
   - Use: lib/work-folder.md
   - Modes: explicit, auto-detect, create
   - Manages: Metadata, folder structure

**Output**: Validated input, fetched context, work folder path

**Typical Length**: 40-60 lines (with library references)

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

**Output**: Command-specific analysis/investigation results

**Typical Length**: 200-300 lines (command-specific logic)

---

### PHASE 3: GENERATION (Optional)

**Purpose**: Transform analysis into structured output using subagent

**When Used**:
- analyze.md → analysis-generator subagent
- debug.md → debug-fix-generator subagent
- plan.md → spec-generator subagent
- review.md → (no subagent, generates directly)

**Standard Pattern**:
1. Prepare subagent input context
2. Invoke generator subagent
   - Use: lib/subagent-invoker.md
   - Agent: [command-specific generator]
3. Validate generated output
   - Check required sections
   - Verify quality gates

**Output**: Structured markdown document (analysis, debug report, spec)

**Typical Length**: 40-60 lines (with subagent-invoker)

---

### PHASE 3.5: EXIT PLAN MODE (Conditional)

**Purpose**: Transition from plan mode to execution mode

**When Used**:
- Commands that use ExitPlanMode tool (analyze, debug)
- Commands that need file writing permissions

**Standard Pattern**:
1. Acknowledge transition
2. Use ExitPlanMode tool
   - Use: lib/exit-plan-mode.md
   - Provide: summary of work done
3. Confirm execution mode enabled

**Output**: Mode change confirmation

**Typical Length**: 10-15 lines (with library reference)

---

### PHASE 4: OUTPUT HANDLING (Required for all commands)

**Purpose**: Deliver results to user via terminal, file, and/or Jira

**Standard Steps**:
1. Terminal Output (unless --quiet)
2. File Writing (unless --no-file)
3. Jira Posting (if --post-to-jira)
4. Metadata Update (if work folder exists)

**Standard Pattern**:
Use: lib/output-handler.md with command-specific configuration

**Output**: Files created, comments posted, metadata updated

**Typical Length**: 20-30 lines (with library reference)

---

### PHASE 5: COMPLETION (Required for all commands)

**Purpose**: Provide summary and suggest next steps

**Standard Steps**:
1. Display completion summary
   - Problem/task summary
   - Outputs created
   - Key results

2. Suggest next steps
   - Primary action (command-specific)
   - Alternative actions
   - Proactive workflow continuation

3. Handle user choice
   - Execute selected action
   - Or finish gracefully

**Standard Pattern**:
Use: lib/completion-handler.md with command-specific configuration

**Output**: Summary displayed, next steps initiated (optional)

**Typical Length**: 20-30 lines (with library reference)

---

## Command Length Guidelines

With proper library usage, commands should target:

| Command Type | Target Length | Phases |
|--------------|---------------|--------|
| Simple query | 300-400 lines | 1, 2, 4, 5 |
| Analysis | 400-600 lines | 1, 2, 3, 3.5, 4, 5 |
| Generation | 350-500 lines | 1, 2, 3, 4, 5 |

**Breakdown**:
- Phase 1 (libraries): 40-60 lines
- Phase 2 (command-specific): 200-300 lines
- Phase 3 (libraries): 40-60 lines
- Phase 3.5 (libraries): 10-15 lines
- Phase 4 (libraries): 20-30 lines
- Phase 5 (libraries): 20-30 lines
- Documentation/examples: 50-100 lines

---

## Usage for New Commands

When creating a new command:

1. **Copy phase template structure**:
   ```markdown
   ## PHASE 1: INPUT PROCESSING
   [Standard library references]

   ## PHASE 2: EXECUTION
   [Your command-specific logic here]

   ## PHASE 3: GENERATION (if needed)
   [Standard subagent invocation]

   ## PHASE 4: OUTPUT HANDLING
   [Standard library references]

   ## PHASE 5: COMPLETION
   [Standard library references]
   ```

2. **Fill in Phase 2** with command-specific logic

3. **Configure libraries** with command parameters

4. **Add command-specific sections** (e.g., quality gates, examples)

---

## Examples

### Example 1: analyze.md Structure
```markdown
## PHASE 1: INPUT PROCESSING (50 lines)
- lib/argument-parser.md
- lib/input-processing.md (jira, github, datadog, text)
- lib/work-folder.md

## PHASE 2: DEEP CODEBASE ANALYSIS (280 lines)
- Prepare Plan subagent prompt
- Spawn Plan subagent for exploration
- Extract findings

## PHASE 3: ANALYSIS GENERATION (50 lines)
- Prepare analysis-generator input
- lib/subagent-invoker.md (analysis-generator)
- Validate analysis sections

## PHASE 3.5: EXIT PLAN MODE (15 lines)
- lib/exit-plan-mode.md

## PHASE 4: OUTPUT HANDLING (25 lines)
- lib/output-handler.md (terminal, file, jira, metadata)

## PHASE 5: COMPLETION (30 lines)
- lib/completion-handler.md (suggest /schovi:plan)

Total: ~450 lines
```

### Example 2: review.md Structure
```markdown
## PHASE 1: INPUT PROCESSING (40 lines)
- lib/argument-parser.md (--quick flag)
- lib/input-processing.md (github-pr, jira, file)

## PHASE 2: SOURCE CODE FETCHING (60 lines)
- lib/code-fetcher.md (prioritize files)
- Fetch related dependencies (deep mode)

## PHASE 2.5: REVIEW ANALYSIS (200 lines)
- Multi-dimensional analysis (command-specific)
- Security review
- Issue detection
- Recommendations

## PHASE 4: OUTPUT HANDLING (25 lines)
- Terminal only (no files for review)

Total: ~325 lines
```
```

**Action Items**:

1. **Create file structure** (30 min)
2. **Document standard phases** (90 min)
3. **Provide command examples** (60 min)
4. **Create new command scaffold** (45 min)
5. **Write usage guide** (45 min)

**Deliverable**: `schovi/lib/phase-template.md` (~300 lines)

#### Subtask 3.2.2: Apply Template to Existing Commands

**Purpose**: Ensure all commands follow standard phase structure

**Action Items**:

1. **Audit analyze.md** (30 min):
   - Verify phases match template
   - Add phase numbers if missing
   - Update phase descriptions

2. **Audit debug.md** (30 min):
   - Verify phases match template
   - Standardize phase naming

3. **Audit plan.md** (30 min):
   - Verify phases match template
   - Remove Phase 1.5 ambiguity

4. **Audit review.md** (20 min):
   - Verify phases match template
   - Note: Skips Phase 3 (no generator)

5. **Document deviations** (20 min):
   - When is Phase 3 skipped?
   - When is Phase 3.5 used?
   - Command-specific variations

**Deliverable**: All commands follow phase template

**Total Task 3.2 Effort**: 4-5 hours

---

### Task 3.3: Implement Code Fetcher Library

**Effort**: 3-4 hours
**Dependencies**: None

**Purpose**: Extract and standardize source code fetching logic from review.md

**Current Duplication**:
- review.md Phase 2.5: 145 lines of fetching logic
- Could be reused by other commands (e.g., targeted code analysis)

**Implementation**:

```markdown
---
name: code-fetcher
description: Unified source code fetching with strategy pattern for local, JetBrains MCP, and GitHub API sources
allowed-tools: ["Read", "Bash", "mcp__jetbrains__*"]
---

# Code Fetcher Library

## Purpose
Provides smart source code fetching with automatic fallback:
1. Local filesystem (preferred - instant, complete access)
2. JetBrains MCP (IDE integration - if available)
3. GitHub API (remote fallback - requires network)

## Usage Pattern

```
Fetch source code using code-fetcher library:

Configuration:
  files: [
    {path: "src/api/controller.ts", priority: 1},
    {path: "src/services/auth.ts", priority: 2},
    ...
  ]
  mode: "deep" | "quick"
  context: {
    repository: "owner/repo",
    branch: "main",
    commit_sha: "abc123"  # For GitHub API
  }
  limits:
    max_files: 10  # For deep mode
    max_files: 3   # For quick mode
    max_lines_per_file: 500

Output:
  {
    "files_fetched": [
      {
        "path": "src/api/controller.ts",
        "content": "[file content]",
        "lines": 245,
        "method": "local"
      },
      ...
    ],
    "method_used": "local",
    "fallback_count": 0,
    "errors": []
  }
```

## Strategy Implementation

### Strategy 1: Local Filesystem
[Detection, file reading, error handling]

### Strategy 2: JetBrains MCP
[Tool detection, file fetching, error handling]

### Strategy 3: GitHub API
[Authentication check, API requests, error handling]

## File Prioritization
[Logic for sorting files by importance]

## Error Handling
[Graceful degradation when methods fail]
```

**Action Items**:

1. **Create file structure** (20 min)
2. **Implement local filesystem strategy** (45 min)
3. **Implement JetBrains MCP strategy** (45 min)
4. **Implement GitHub API strategy** (60 min)
5. **Implement strategy selection logic** (30 min)
6. **Implement file prioritization** (30 min)
7. **Test with review command** (60 min)

**Deliverable**: `schovi/lib/code-fetcher.md` (~80 lines)

**Total Task 3.3 Effort**: 3-4 hours

---

### Task 3.4: Optimize Subagent Architectures

**Effort**: 4-5 hours
**Dependencies**: Task 3.1 (gh-pr-analyzer split)

**Purpose**: Standardize subagent structure and improve consistency

#### Subtask 3.4.1: Create Subagent Template

**Action Items**:

1. **Create `schovi/agents/TEMPLATE.md`** (90 min):
   ```markdown
   ---
   name: template-agent
   description: [One-line purpose]
   allowed-tools: ["Tool1", "Tool2"]
   ---

   # [Agent Name] Subagent

   ## Critical Mission
   [Define token reduction goal and context isolation purpose]

   ## Instructions

   ### Step 1: Parse Input
   [Standard input parsing]

   ### Step 2: Fetch Data
   [External API/tool usage]

   ### Step 3: Extract Essential Information ONLY
   [Define what to extract, what to exclude]

   ### Step 4: Format Output
   [Standard output format with visual wrappers]

   ## Critical Rules

   ### ❌ NEVER DO THESE:
   [Banned behaviors]

   ### ✅ ALWAYS DO THESE:
   [Required behaviors]

   ## Error Handling
   [Standard error templates]

   ## Quality Checks
   [Validation checklist before output]

   ## Token Budget
   [Strict token limits with enforcement]

   ## Examples
   [Input/output examples]
   ```

2. **Document template usage** (30 min)
3. **Create new agent checklist** (20 min)

**Deliverable**: `schovi/agents/TEMPLATE.md`

#### Subtask 3.4.2: Audit Existing Subagents

**Purpose**: Ensure all subagents follow template

**Action Items**:

1. **Audit jira-analyzer** (30 min):
   - Check structure matches template
   - Verify token budget enforced
   - Update if needed

2. **Audit gh-pr-analyzer** (30 min):
   - Check compact mode logic clean
   - Verify examples current

3. **Audit gh-pr-reviewer** (30 min):
   - Check full mode logic clean
   - Verify token budgets

4. **Audit gh-issue-analyzer** (20 min):
   - Check consistency

5. **Audit spec-generator** (20 min):
   - Check structure

6. **Audit debug-fix-generator** (20 min):
   - Check quality gates

7. **Audit datadog-analyzer** (20 min):
   - Check fallback logic

**Deliverable**: Audit report with recommended updates

#### Subtask 3.4.3: Standardize Visual Formatting

**Purpose**: Consistent visual wrappers across all subagents

**Standard Format**:
```markdown
╭─────────────────────────────────────────────╮
│ 🎯 [AGENT NAME]                             │
╰─────────────────────────────────────────────╯

[Content here]

╭─────────────────────────────────────────────╮
  ✅ [Status message] | ~[X] tokens | [Y] lines
╰─────────────────────────────────────────────╯
```

**Action Items**:

1. **Define standard emojis** (15 min):
   - jira-analyzer: 🔍
   - gh-pr-analyzer: 🔗
   - gh-pr-reviewer: 🔗
   - gh-issue-analyzer: 🔗
   - spec-generator: 📋
   - debug-fix-generator: 🔧
   - datadog-analyzer: 📊

2. **Update all agents** (90 min):
   - Apply standard format
   - Use consistent emojis
   - Standardize footer format

**Deliverable**: Consistent visual formatting across all subagents

**Total Task 3.4 Effort**: 4-5 hours

---

### Task 3.5: Create Command Scaffolding Tool

**Effort**: 3-4 hours
**Dependencies**: Task 3.2 (phase template)

**Purpose**: Enable rapid new command creation

**Implementation**:

Create `schovi/lib/command-scaffold.md`:

```markdown
# Command Scaffolding Guide

## Quick Start

To create a new command:

1. **Copy template**:
   ```bash
   cp schovi/lib/phase-template.md schovi/commands/new-command.md
   ```

2. **Update frontmatter**:
   ```yaml
   ---
   description: [Brief command description]
   argument-hint: [input] [--flags]
   allowed-tools: ["Task", "Read", "Write", "Bash", "lib/*"]
   ---
   ```

3. **Fill in Phase 2** (command-specific logic)

4. **Configure libraries** in Phases 1, 4, 5

5. **Add quality gates** and examples

6. **Test thoroughly**

## Command Types

### Type 1: Analysis Command
- Purpose: Explore and understand
- Phases: 1, 2 (Explore), 3 (Generator), 3.5, 4, 5
- Example: analyze.md
- Typical: 450-550 lines

### Type 2: Action Command
- Purpose: Perform operation
- Phases: 1, 2 (Execute), 4, 5
- Example: commit.md, publish.md
- Typical: 300-400 lines

### Type 3: Review Command
- Purpose: Evaluate and feedback
- Phases: 1, 2 (Analysis), 4
- Example: review.md
- Typical: 350-450 lines

## Library Configuration Patterns

[Standard library configurations for common patterns]

## Testing Checklist

[Standard tests every command should pass]

## Documentation Template

[Standard sections for command documentation]
```

**Action Items**:

1. **Create scaffold guide** (90 min)
2. **Document command types** (60 min)
3. **Create configuration templates** (45 min)
4. **Write testing checklist** (30 min)
5. **Test by creating dummy command** (60 min)

**Deliverable**: `schovi/lib/command-scaffold.md`

**Total Task 3.5 Effort**: 3-4 hours

---

### Task 3.6: Update Documentation

**Effort**: 3-4 hours
**Dependencies**: All Phase 3 tasks

**Purpose**: Document all advanced improvements

**Action Items**:

1. **Update CLAUDE.md** (90 min):
   - Document gh-pr-analyzer split
   - Add phase template section
   - Update subagent list
   - Add command scaffolding guide

2. **Update lib/README.md** (60 min):
   - Add code-fetcher documentation
   - Update library list
   - Add usage examples

3. **Create development guide** (90 min):
   - Create `docs/DEVELOPMENT.md`
   - How to create new commands
   - How to create new subagents
   - How to extend libraries
   - Testing best practices

4. **Update examples** (30 min):
   - Update command examples
   - Add new library examples
   - Refresh agent examples

**Deliverable**: Complete updated documentation

**Total Task 3.6 Effort**: 3-4 hours

---

## 📊 Success Metrics

### Quantitative Targets

**Code Simplification**:
- [ ] gh-pr-analyzer: 869 → ~350 lines (60% reduction)
- [ ] New agent (gh-pr-reviewer): ~500 lines
- [ ] review.md: Further 10% reduction with code-fetcher

**New Infrastructure**:
- [ ] phase-template.md created (~300 lines)
- [ ] code-fetcher.md created (~80 lines)
- [ ] command-scaffold.md created (~200 lines)
- [ ] Subagent template created (~150 lines)

**Consistency**:
- [ ] All commands follow phase template
- [ ] All subagents use standard visual format
- [ ] All subagents follow template structure

### Qualitative Metrics

**Developer Experience**:
- [ ] New command creation time < 4 hours
- [ ] New subagent creation time < 2 hours
- [ ] Clear patterns documented
- [ ] Scaffolding tools available

**Maintainability**:
- [ ] Single-purpose agents (no mode switching)
- [ ] Consistent structure across all components
- [ ] Easy to understand and extend

---

## 🔗 Dependencies

**Sequential Dependencies**:
- Task 3.1 (split gh-pr-analyzer) → Task 3.4 (audit subagents)
- Task 3.2 (phase template) → Task 3.5 (scaffolding)
- All tasks → Task 3.6 (documentation)

**Parallel Opportunities**:
- Tasks 3.1, 3.2, 3.3 can run in parallel
- Task 3.4 can start after 3.1
- Task 3.5 can start after 3.2

---

## 🚨 Risks & Mitigations

**Risk 1**: Splitting gh-pr-analyzer breaks existing commands
- **Mitigation**: Comprehensive testing of all commands
- **Mitigation**: Keep backups of original agent
- **Validation**: Test matrix with all command/agent combinations

**Risk 2**: Phase template too rigid for future commands
- **Mitigation**: Allow command-specific variations
- **Mitigation**: Document when to deviate from template
- **Flexibility**: Template is guidance, not enforcement

**Risk 3**: Over-engineering for current needs
- **Mitigation**: Focus on solving actual pain points
- **Validation**: Each improvement addresses measured problem
- **Principle**: YAGNI - implement only what's needed now

---

## ✅ Definition of Done

Phase 3 is complete when:

- [ ] gh-pr-analyzer split into two agents
- [ ] All commands tested with new agents
- [ ] Phase template created and applied
- [ ] Code-fetcher library implemented
- [ ] Subagent template created
- [ ] All subagents audited for consistency
- [ ] Command scaffolding guide created
- [ ] Documentation fully updated
- [ ] No functionality regressions
- [ ] Developer experience improved

---

## 📚 References

- Phase 1 libraries: `schovi/lib/`
- Phase 2 refactored commands: `schovi/commands/`
- Subagents: `schovi/agents/`
- Architecture: `CLAUDE.md`

---

## 🎯 Next Steps

After Phase 3 completion:
→ **Phase 4**: Performance optimization and monitoring
→ Gather metrics on development velocity improvements
→ Collect user feedback
→ Plan future enhancements
