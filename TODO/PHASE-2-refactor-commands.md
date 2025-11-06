# Phase 2: Refactor Commands

**Timeline**: Week 2 (5-7 days)
**Priority**: 🟡 High - Applies foundation to all commands
**Status**: 📋 Blocked (Requires Phase 1 completion)

---

## 📝 Overview

Apply the shared library system created in Phase 1 to all four major commands (review, plan, debug, analyze). This eliminates the remaining code duplication and standardizes all command implementations.

**Core Goal**: Reduce average command length from 1,185 lines to ~425 lines (64% reduction).

---

## 🎯 Objectives

1. **Refactor all commands** to use shared libraries
2. **Eliminate remaining duplication** in Phase 4/5 (output handling)
3. **Standardize command structure** using common phase pattern
4. **Maintain functionality** - zero regressions, identical outputs
5. **Document patterns** for future command development

---

## 📊 Problem Analysis

### Current State After Phase 1

**Libraries Created** (Phase 1):
- ✅ `lib/argument-parser.md` (~80 lines)
- ✅ `lib/input-processing.md` (~200 lines)
- ✅ `lib/work-folder.md` (~100 lines)
- ✅ `lib/subagent-invoker.md` (~70 lines)

**Commands to Refactor**:

| Command | Current Lines | Target Lines | Reduction | Priority |
|---------|--------------|--------------|-----------|----------|
| review.md | 567 | ~350 | 38% | ✅ Done in Phase 1 |
| plan.md | 988 | ~400 | 59% | 🔴 High |
| debug.md | 1,391 | ~450 | 68% | 🔴 High |
| analyze.md | 1,797 | ~500 | 72% | 🔴 High |

**Total Impact**: 4,743 lines → ~1,700 lines (64% reduction)

### Remaining Duplication Patterns

**Pattern #1: Phase 4 Output Handling (duplicated 3×)**
- Location: analyze.md (lines 1419-1600), debug.md (lines 1058-1235), plan.md (lines 736-872)
- Functions: Terminal output, file writing, Jira posting
- Lines: ~180 lines × 3 = 540 lines duplicated

**Pattern #2: Phase 5 Completion & Next Steps (duplicated 3×)**
- Location: analyze.md (lines 1602-1797), debug.md (lines 1237-1391), plan.md (lines 874-988)
- Functions: Summary display, next step suggestions, proactive offers
- Lines: ~100 lines × 3 = 300 lines duplicated

**Pattern #3: ExitPlanMode Invocation (duplicated 2×)**
- Location: analyze.md (lines 1370-1413), debug.md (lines 1012-1051)
- Functions: Transition from plan to execution mode
- Lines: ~40 lines × 2 = 80 lines duplicated

### New Libraries Needed

**Lib 5: `output-handler.md`** (~120 lines)
- Terminal output (unless --quiet)
- File writing (unless --no-file)
- Jira posting (if --post-to-jira)
- Metadata updating (if work folder exists)

**Lib 6: `exit-plan-mode.md`** (~30 lines)
- Standard summary format
- Transition acknowledgment
- Consistent messaging

**Lib 7: `completion-handler.md`** (~80 lines)
- Summary display
- Next step suggestions
- Proactive workflow continuation
- Command-specific templates

---

## 🛠️ Detailed Tasks

### Task 2.1: Create Additional Libraries

**Effort**: 4-5 hours
**Dependencies**: Phase 1 complete

#### Subtask 2.1.1: Create `lib/output-handler.md`

**Purpose**: Standardize all output operations across commands

**Analysis of Current Duplication**:

From analyze.md (lines 1419-1600):
```markdown
## PHASE 4: OUTPUT HANDLING

### Step 4.1: Terminal Output
**If `terminal_output == true`**:
1. Display analysis to terminal
2. Use visual separator

### Step 4.2: File Output & Metadata Update
**If `output_path != null`**:
1. Determine filename (default or --output)
2. Resolve and validate output path
3. Write content to file
4. Update metadata if work folder exists

### Step 4.3: Jira Posting (Optional)
**If `jira_posting == true`**:
1. Check if Jira ID exists
2. Format content for Jira
3. Post using mcp__jira__addCommentToJiraIssue
```

This same logic appears in debug.md and plan.md with only minor variations.

**Implementation Design**:

```markdown
---
name: output-handler
description: Unified output handling for terminal, file, Jira, and metadata updates
allowed-tools: ["Write", "Bash", "mcp__jira__*"]
---

# Output Handler Library

## Purpose
Centralizes all output operations:
- Terminal display (with --quiet support)
- File writing (with --output and --no-file support)
- Jira comment posting (with --post-to-jira support)
- Metadata updates (for work folder tracking)

## Usage Pattern

Commands invoke after content generation:

```
Handle output using output-handler library:

Configuration:
  content: "[Generated markdown content]"
  content_type: "analysis" | "debug" | "plan" | "review"

  flags:
    terminal_output: true  # From --quiet flag
    file_output: true      # From --no-file flag
    jira_posting: false    # From --post-to-jira flag

  file_config:
    output_path: null  # From --output flag
    default_filename: "analysis-EC-1234.md"
    work_folder: ".WIP/EC-1234-feature"  # From work-folder library

  jira_config:
    jira_id: "EC-1234"
    cloud_id: "productboard.atlassian.net"

  metadata_config:
    work_folder: ".WIP/EC-1234-feature"
    file_key: "analysis"  # or "debug", "plan"
    workflow_step: "analyze"  # Current step to mark complete

Output:
  {
    "terminal": {
      "displayed": true,
      "skipped_reason": null
    },
    "file": {
      "created": true,
      "path": ".WIP/EC-1234-feature/02-analysis.md",
      "error": null
    },
    "jira": {
      "posted": true,
      "comment_url": "https://...",
      "error": null
    },
    "metadata": {
      "updated": true,
      "fields_changed": ["workflow.completed", "files.analysis"],
      "error": null
    }
  }
```

## Implementation Sections

### Section 1: Terminal Output
[Logic for displaying content with visual separators]

### Section 2: File Output
[Logic for path resolution, file writing, error handling]

### Section 3: Jira Posting
[Logic for formatting and posting to Jira]

### Section 4: Metadata Updates
[Logic for updating work folder metadata]
```

**Deliverable**: `schovi/lib/output-handler.md`

#### Subtask 2.1.2: Create `lib/exit-plan-mode.md`

**Purpose**: Standardize ExitPlanMode tool usage

**Implementation Design**:

```markdown
---
name: exit-plan-mode
description: Standard transition from plan mode to execution mode
allowed-tools: ["ExitPlanMode"]
---

# Exit Plan Mode Library

## Purpose
Provides consistent ExitPlanMode invocation with standardized summaries.

## Usage Pattern

```
Exit plan mode using exit-plan-mode library:

Configuration:
  command_type: "analyze" | "debug"

  summary:
    problem: "One-line problem summary"
    key_findings: ["Finding 1", "Finding 2", "Finding 3"]
    output_type: "analysis" | "debug report"
    recommended: "Option 2 - Backend service approach"  # For analyze
    root_cause: "Null pointer dereference"  # For debug
    fix_location: "file:line"  # For debug

  next_steps: [
    "Save to file (if not --no-file)",
    "Display to terminal (if not --quiet)",
    "Post to Jira (if --post-to-jira)"
  ]

Generates appropriate ExitPlanMode summary based on command type.
```
```

**Deliverable**: `schovi/lib/exit-plan-mode.md`

#### Subtask 2.1.3: Create `lib/completion-handler.md`

**Purpose**: Standardize completion summaries and next step suggestions

**Implementation Design**:

```markdown
---
name: completion-handler
description: Standard completion summaries and proactive next step suggestions
allowed-tools: ["AskUserQuestion", "SlashCommand"]
---

# Completion Handler Library

## Purpose
Provides consistent completion experience:
- Standardized summary format
- Command-specific next step suggestions
- Proactive workflow continuation
- Clear visual formatting

## Usage Pattern

```
Present completion using completion-handler library:

Configuration:
  command_type: "analyze" | "debug" | "plan"

  summary:
    problem: "Brief problem"
    output_files: [".WIP/EC-1234/02-analysis.md"]
    jira_posted: true
    work_folder: ".WIP/EC-1234-feature"

  next_steps:
    primary_action: "create_spec"  # or "apply_fix", "start_implementation"
    primary_command: "/schovi:plan"
    alternative_actions: [
      {label: "Discuss solution", action: "discuss"},
      {label: "Deep dive", action: "explore"},
      {label: "Update Jira", action: "jira_post"}
    ]

  proactive:
    auto_suggest: true  # Ask user if they want to run next command
    auto_detect_context: true  # Use work folder for command detection

Displays summary and handles next step selection.
```
```

**Deliverable**: `schovi/lib/completion-handler.md`

**Total Subtask 2.1 Effort**: 4-5 hours
**Total Lines Created**: ~230 lines (replaces ~920 lines duplicated)

---

### Task 2.2: Refactor `plan.md`

**Effort**: 4-6 hours
**Dependencies**: Task 2.1

**Current State**: 988 lines
**Target State**: ~400 lines (59% reduction)

**Refactoring Strategy**:

#### Section 1: Input Validation (lines 14-144) → 20 lines

**Before** (130 lines of validation and error messages):
```markdown
## PHASE 1: INPUT VALIDATION & RESOLUTION

### Step 1.1: Parse Arguments and Classify Input Type
[30 lines of input type classification]

### Step 1.2: Validate Input and Enforce Analysis-First Workflow
[100 lines of error messages and validation]
```

**After**:
```markdown
## PHASE 1: INPUT VALIDATION

Use lib/argument-parser.md with:
- positional: [input]
- flags: [--input, --output, --no-file, --quiet, --post-to-jira, --from-scratch, --work-dir]
- validation: enforce-analysis-first (unless --from-scratch)

If validation fails:
  Use error-template: "analysis-required-error.md"
  HALT
```

**Action Items**:
1. Create `schovi/lib/error-templates/analysis-required.md` (30 min)
2. Update plan.md to use argument-parser (20 min)
3. Add analysis-first validation to argument-parser (30 min)
4. Test validation with various inputs (20 min)

#### Section 2: Extract Analysis Content (lines 159-309) → 30 lines

**Before** (150 lines for three input types):
```markdown
### Step 1.4: Extract Analysis Content

#### Option A: Analysis File (--input flag)
[50 lines of file reading and parsing]

#### Option B: Conversation Analysis
[70 lines of conversation searching]

#### Option C: From Scratch
[30 lines of interactive prompts]
```

**After**:
```markdown
## PHASE 1.5: EXTRACT ANALYSIS

Use analysis-extractor pattern:
- Option A: Read file from --input PATH
- Option B: Search conversation for recent /schovi:analyze output
- Option C: Interactive prompts for --from-scratch mode

Validate has file:line references (flag for enrichment if missing).
```

**Action Items**:
1. Simplify file reading logic (15 min)
2. Simplify conversation search (15 min)
3. Keep from-scratch interactive prompts (no change needed)

#### Section 3: Context Enrichment (lines 424-622) → 40 lines

**Before** (198 lines of enrichment logic):
```markdown
## PHASE 1.5: CONTEXT ENRICHMENT (Optional)
[Detailed enrichment detection and execution]
```

**After**:
```markdown
## PHASE 1.5: CONTEXT ENRICHMENT

If analysis lacks file:line references:
  Ask user: "Enrich with Explore subagent?" [yes/no/manual]

If yes:
  Use Task tool with Explore subagent (quick mode)
  Merge results with analysis
```

**Action Items**:
1. Simplify gap detection (10 min)
2. Keep user prompt (no change)
3. Simplify Explore invocation (10 min)

#### Section 4: Work Folder Resolution (lines 346-421) → 10 lines

**Before** (76 lines):
```markdown
### Step 1.6: Work Folder Resolution & Metadata Setup
[Full inline bash scripts for folder detection and metadata]
```

**After**:
```markdown
## PHASE 1.6: WORK FOLDER

Use lib/work-folder.md with:
- mode: auto-detect
- identifier: [from Jira ID or analysis]
- workflow_type: "full" | "technical" | "simple"
```

**Action Items**:
1. Replace with library reference (10 min)
2. Remove inline bash (5 min)

#### Section 5: Spec Generation (lines 625-728) → 30 lines

**Before** (104 lines):
```markdown
## PHASE 2: SPEC GENERATION

### Step 2.1: Prepare Subagent Context
[Detailed context preparation]

### Step 2.2: Spawn Spec-Generator Subagent
[Subagent invocation]

### Step 2.3: Receive and Validate Spec
[Validation logic]
```

**After**:
```markdown
## PHASE 2: SPEC GENERATION

Use lib/subagent-invoker.md with:
- subagent: spec-generator
- input: [analysis content + chosen approach]
- context: "plan"

Validate spec has required sections.
```

**Action Items**:
1. Use subagent-invoker library (10 min)
2. Simplify validation (10 min)

#### Section 6: Output Handling (lines 736-872) → 20 lines

**Before** (137 lines):
```markdown
## PHASE 3: OUTPUT HANDLING

### Step 3.1: Terminal Output
[Terminal display logic]

### Step 3.2: File Writer & Metadata Update
[File writing and metadata logic]

### Step 3.3: Jira Poster
[Jira posting logic]
```

**After**:
```markdown
## PHASE 3: OUTPUT HANDLING

Use lib/output-handler.md with:
- content: [generated spec]
- content_type: "plan"
- flags: [from argument parser]
- work_folder: [from work-folder library]
```

**Action Items**:
1. Replace with library reference (10 min)

#### Section 7: Completion (lines 874-988) → 20 lines

**Before** (115 lines):
```markdown
## PHASE 4: COMPLETION & NEXT STEPS

### Step 4.1: Summary
[Summary display]

### Step 4.2: Proactive Next Steps
[Next step suggestions and automation]
```

**After**:
```markdown
## PHASE 4: COMPLETION

Use lib/completion-handler.md with:
- command_type: "plan"
- primary_action: "start_implementation"
- work_folder: [from work-folder library]
```

**Action Items**:
1. Replace with library reference (10 min)

**Total Task 2.2 Effort**: 4-6 hours
**Result**: plan.md: 988 lines → ~400 lines (59% reduction)

---

### Task 2.3: Refactor `debug.md`

**Effort**: 6-8 hours
**Dependencies**: Task 2.1

**Current State**: 1,391 lines
**Target State**: ~450 lines (68% reduction)

**Refactoring Strategy**:

#### Section 1: Argument Parsing (lines 40-102) → 10 lines

Use lib/argument-parser.md

#### Section 2: Input Processing (lines 105-379) → 20 lines

Use lib/input-processing.md with:
- Supports: jira, github-pr, github-issue, datadog, text
- command_context: "debug"

**Major Savings**: 275 lines → 20 lines (93% reduction)

#### Section 3: Work Folder Resolution (lines 381-555) → 10 lines

Use lib/work-folder.md with:
- workflow_type: "bug"
- steps: ["debug", "implement"]

**Savings**: 175 lines → 10 lines (94% reduction)

#### Section 4: Deep Debugging (lines 561-810) → Keep as-is (250 lines)

This is command-specific logic using Explore subagent.
- No duplication
- Already uses Task tool properly
- Keep detailed debugging instructions

#### Section 5: Fix Proposal Generation (lines 813-1009) → 40 lines

**Before** (197 lines):
```markdown
## PHASE 3: FIX PROPOSAL GENERATION

### Step 3.1: Prepare Subagent Input Context
[Detailed context preparation - 80 lines]

### Step 3.2: Spawn Debug-Fix-Generator Subagent
[Subagent invocation - 30 lines]

### Step 3.3: Receive and Store Fix Proposal
[Validation - 87 lines]
```

**After**:
```markdown
## PHASE 3: FIX PROPOSAL GENERATION

Use lib/subagent-invoker.md with:
- subagent: debug-fix-generator
- input: [debugging results from Phase 2]
- context: "debug"
- validation: check required sections
```

**Savings**: 197 lines → 40 lines (80% reduction)

#### Section 6: Exit Plan Mode (lines 1012-1051) → 10 lines

Use lib/exit-plan-mode.md

**Savings**: 40 lines → 10 lines (75% reduction)

#### Section 7: Output Handling (lines 1058-1235) → 20 lines

Use lib/output-handler.md

**Savings**: 178 lines → 20 lines (89% reduction)

#### Section 8: Completion (lines 1237-1391) → 20 lines

Use lib/completion-handler.md with:
- primary_action: "apply_fix"

**Savings**: 155 lines → 20 lines (87% reduction)

**Action Items**:
1. Replace argument parsing (30 min)
2. Replace input processing (30 min)
3. Replace work folder (20 min)
4. Keep debugging logic (no change)
5. Refactor fix generation (60 min)
6. Replace exit plan mode (15 min)
7. Replace output handling (20 min)
8. Replace completion (20 min)
9. Test all scenarios (90 min)
10. Validate outputs identical (45 min)

**Total Task 2.3 Effort**: 6-8 hours
**Result**: debug.md: 1,391 lines → ~450 lines (68% reduction)

---

### Task 2.4: Refactor `analyze.md`

**Effort**: 8-10 hours
**Dependencies**: Task 2.1

**Current State**: 1,797 lines (largest command)
**Target State**: ~500 lines (72% reduction)

**Refactoring Strategy**:

#### Section 1: Argument Parsing (lines 40-114) → 10 lines

Use lib/argument-parser.md

**Savings**: 75 lines → 10 lines (87% reduction)

#### Section 2: Input Processing (lines 117-636) → 20 lines

Use lib/input-processing.md

**MAJOR SAVINGS**: 520 lines → 20 lines (96% reduction!)
This is the biggest duplication in the entire codebase.

#### Section 3: Work Folder Resolution (lines 736-912) → 10 lines

Use lib/work-folder.md

**Savings**: 177 lines → 10 lines (94% reduction)

#### Section 4: Deep Codebase Analysis (lines 915-1136) → Keep as-is (222 lines)

This is command-specific using Plan subagent.
- No duplication
- Already uses Task tool
- Keep detailed analysis requirements

#### Section 5: Analysis Generation (lines 1139-1368) → 40 lines

**Before** (230 lines):
```markdown
## PHASE 3: ANALYSIS GENERATION

### Step 3.1: Prepare Subagent Input Context
[85 lines of context preparation]

### Step 3.2: Spawn Analysis-Generator Subagent
[35 lines]

### Step 3.3: Receive and Store Analysis
[110 lines of validation]
```

**After**:
```markdown
## PHASE 3: ANALYSIS GENERATION

Use lib/subagent-invoker.md with:
- subagent: analysis-generator
- input: [exploration results from Phase 2]
- template_type: "full" | "quick"
- validation: check quality gates
```

**Savings**: 230 lines → 40 lines (83% reduction)

#### Section 6: Exit Plan Mode (lines 1370-1413) → 10 lines

Use lib/exit-plan-mode.md

**Savings**: 44 lines → 10 lines (77% reduction)

#### Section 7: Output Handling (lines 1419-1600) → 20 lines

Use lib/output-handler.md

**Savings**: 182 lines → 20 lines (89% reduction)

#### Section 8: Completion (lines 1602-1797) → 30 lines

Use lib/completion-handler.md with:
- primary_action: "create_spec"
- auto_suggest: true (ask to run /schovi:plan)

**Savings**: 196 lines → 30 lines (85% reduction)

**Action Items**:
1. Replace argument parsing (30 min)
2. Replace input processing (45 min) - test thoroughly, largest change
3. Replace work folder (20 min)
4. Keep codebase analysis (no change)
5. Refactor analysis generation (90 min)
6. Replace exit plan mode (15 min)
7. Replace output handling (20 min)
8. Replace completion (30 min)
9. Comprehensive testing (120 min) - all input types, all flags
10. Validate quality gates (60 min)
11. Compare outputs (45 min)

**Total Task 2.4 Effort**: 8-10 hours
**Result**: analyze.md: 1,797 lines → ~500 lines (72% reduction!)

---

### Task 2.5: Create Error Template System

**Effort**: 2-3 hours
**Dependencies**: None (can run in parallel)

**Purpose**: Centralize all error message templates for consistency

**Action Items**:

1. **Create directory** (5 min):
   ```bash
   mkdir -p schovi/lib/error-templates
   ```

2. **Create templates** (2 hours):

   **Template 1**: `analysis-required.md`
   - Used by: plan.md validation
   - Content: "Analysis required before spec" error
   - Lines: ~60 lines

   **Template 2**: `subagent-fetch-failed.md`
   - Used by: All commands via input-processing.md
   - Content: Generic subagent fetch failure
   - Variables: {agent_type, error_message, input_reference}
   - Lines: ~40 lines

   **Template 3**: `file-write-failed.md`
   - Used by: output-handler.md
   - Content: File write errors with retry options
   - Lines: ~30 lines

   **Template 4**: `work-folder-not-found.md`
   - Used by: work-folder.md
   - Content: Work folder errors
   - Lines: ~30 lines

   **Template 5**: `invalid-input.md`
   - Used by: argument-parser.md
   - Content: Invalid arguments, conflicts, etc.
   - Lines: ~40 lines

3. **Update libraries to use templates** (45 min):
   - argument-parser.md → invalid-input.md
   - input-processing.md → subagent-fetch-failed.md
   - work-folder.md → work-folder-not-found.md
   - output-handler.md → file-write-failed.md

4. **Document template system** (30 min):
   - Create error-templates/README.md
   - Usage guide
   - Variable substitution guide

**Deliverable**: Error template system with 5 templates

---

### Task 2.6: Update Documentation

**Effort**: 3-4 hours
**Dependencies**: Tasks 2.2, 2.3, 2.4

**Purpose**: Update all documentation to reflect new library-based architecture

**Action Items**:

1. **Update `CLAUDE.md`** (90 min):
   - Update "Plugin Structure" section with library references
   - Update each command description to mention libraries
   - Add "Shared Libraries" section with:
     - Library overview
     - When to use each library
     - Integration patterns
   - Update "Extending the Plugin" section:
     - How to use libraries in new commands
     - How to extend libraries
     - When to create new libraries

2. **Update command README files** (60 min):
   - Update analyze.md documentation header
   - Update debug.md documentation header
   - Update plan.md documentation header
   - Update review.md documentation header
   - Add "Uses Libraries" section to each

3. **Create migration guide** (60 min):
   - Create `docs/MIGRATION-TO-LIBRARIES.md`
   - Before/after examples
   - Step-by-step refactoring process
   - Common pitfalls and solutions
   - Testing checklist

4. **Update `schovi/README.md`** (30 min):
   - Add library system overview
   - Link to library documentation
   - Update architecture diagram

**Deliverable**: Updated documentation across all files

---

### Task 2.7: Comprehensive Testing

**Effort**: 4-5 hours
**Dependencies**: Tasks 2.2, 2.3, 2.4

**Purpose**: Validate all refactored commands work identically to originals

**Test Matrix**:

#### Analyze Command Tests

| Test Case | Input | Flags | Expected Result |
|-----------|-------|-------|----------------|
| Jira basic | EC-1234 | none | Full analysis with Jira context |
| Jira + output | EC-1234 | --output ./test.md | Analysis saved to custom path |
| Jira + quick | EC-1234 | --quick | Quick analysis template |
| Jira + quiet | EC-1234 | --quiet | File only, no terminal |
| Jira + no-file | EC-1234 | --no-file | Terminal only |
| GitHub PR | #123 | none | Full analysis with PR context |
| GitHub Issue | owner/repo#456 | none | Full analysis with issue context |
| Text input | "Bug description" | none | Analysis from description |
| Stack trace | [Python error] | none | Analysis with parsed stack |
| Invalid Jira | FAKE-999 | none | Error with retry options |

#### Debug Command Tests

| Test Case | Input | Flags | Expected Result |
|-----------|-------|-------|----------------|
| Jira debug | EC-1234 | none | Debug report with root cause |
| PR debug | #123 | none | Debug CI failures |
| Stack trace | [Error log] | none | Debug with execution flow |
| Datadog trace | [URL] | none | Debug from trace data |
| Invalid input | FAKE-999 | none | Error with options |

#### Plan Command Tests

| Test Case | Input | Flags | Expected Result |
|-----------|-------|-------|----------------|
| From analysis file | --input ./analysis.md | none | Spec from file |
| From conversation | none | none | Spec from recent analyze |
| From scratch | --from-scratch "Add feature" | none | Minimal spec |
| Invalid raw input | EC-1234 | none | Error: "analyze first" |
| With enrichment | --input ./vague-analysis.md | none | Prompts for enrichment |

#### Review Command Tests

| Test Case | Input | Flags | Expected Result |
|-----------|-------|-------|----------------|
| PR deep review | #123 | none | Comprehensive review |
| PR quick review | #123 | --quick | Quick review |
| Jira review | EC-1234 | none | Review ticket |
| File review | ./spec.md | none | Review document |

**Test Execution**:

1. **Functional testing** (2 hours):
   - Run all 30+ test cases
   - Verify outputs identical to originals
   - Check error handling works

2. **Integration testing** (1 hour):
   - Test command chains (analyze → plan → implement)
   - Test work folder continuity
   - Test metadata updates

3. **Edge case testing** (1 hour):
   - Empty inputs
   - Conflicting flags
   - Network failures
   - Missing dependencies

4. **Regression testing** (30 min):
   - Compare outputs to saved .backup versions
   - Verify no functionality lost
   - Check token usage hasn't increased

**Success Criteria**:
- [ ] All test cases pass
- [ ] Outputs identical to originals
- [ ] Error handling preserved
- [ ] No functionality regressions

**Deliverable**: Test results documentation

---

## 📊 Success Metrics

### Quantitative Targets

**Code Reduction**:
- [ ] plan.md: 988 → ~400 lines (59% reduction)
- [ ] debug.md: 1,391 → ~450 lines (68% reduction)
- [ ] analyze.md: 1,797 → ~500 lines (72% reduction)
- [ ] Overall: 4,743 → ~1,700 lines (64% reduction)

**Additional Libraries**:
- [ ] 3 new libraries created (~230 lines)
- [ ] 5 error templates created (~200 lines)
- [ ] Total new code: ~430 lines
- [ ] Net reduction: 3,043 lines eliminated

**Consistency**:
- [ ] 100% of commands use libraries
- [ ] 0% inline code duplication
- [ ] Standardized error handling
- [ ] Consistent user experience

### Qualitative Metrics

**Maintainability**:
- [ ] Bug fixes apply once
- [ ] New features added to libraries
- [ ] Commands are readable
- [ ] Clear separation of concerns

**Documentation**:
- [ ] All libraries documented
- [ ] Migration guide complete
- [ ] Examples for all patterns
- [ ] Architecture updated

---

## 🔗 Dependencies

**Sequential Dependencies**:
- Task 2.1 → Tasks 2.2, 2.3, 2.4 (libraries needed first)
- Tasks 2.2, 2.3, 2.4 → Task 2.6 (docs after refactoring)
- Tasks 2.2, 2.3, 2.4 → Task 2.7 (testing after refactoring)

**Parallel Opportunities**:
- Task 2.5 (error templates) can run anytime
- Tasks 2.2, 2.3, 2.4 can run in parallel if multiple developers

---

## 🚨 Risks & Mitigations

**Risk 1**: Functionality regression in refactored commands
- **Mitigation**: Comprehensive test matrix (30+ test cases)
- **Mitigation**: Keep .backup files for rollback
- **Validation**: Output comparison with originals

**Risk 2**: Libraries don't cover all edge cases
- **Mitigation**: Thorough edge case testing
- **Fallback**: Allow command-specific overrides

**Risk 3**: Time estimates too optimistic
- **Mitigation**: Start with plan.md (smallest refactor)
- **Mitigation**: Learn from first refactor, adjust estimates

**Risk 4**: Breaking existing workflows
- **Mitigation**: Beta test with real usage
- **Mitigation**: Documentation of any behavior changes

---

## ✅ Definition of Done

Phase 2 is complete when:

- [ ] All 3 new libraries created and tested
- [ ] All 3 commands refactored successfully
- [ ] All 5 error templates created
- [ ] 30+ test cases passing
- [ ] Code reduction targets met (64%+)
- [ ] Documentation fully updated
- [ ] No functionality regressions
- [ ] User experience consistent across commands

---

## 📚 References

- Phase 1 libraries: `schovi/lib/`
- Original commands (backups): `schovi/commands/*.backup`
- Test matrix: See Task 2.7
- Architecture: Updated `CLAUDE.md`

---

## 🎯 Next Steps

After Phase 2 completion:
→ **Phase 3**: Advanced improvements (gh-pr-analyzer split, phase templates)
→ Measure development velocity gains
→ Gather user feedback
