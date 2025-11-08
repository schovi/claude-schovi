# Fragment Loader Library

This library provides standardized operations for working with the fragment system: reading registries, loading specific fragments, creating new fragments, and updating fragment status.

## Overview

The fragment system stores workflow assumptions, risks, metrics, and criteria in a structured format:

```
.WIP/{identifier}/
├── fragments.md          # Registry (index of all fragments)
└── fragments/            # Individual fragment files
    ├── A-1.md           # Assumption 1
    ├── A-2.md           # Assumption 2
    ├── U-1.md           # Unknown 1
    ├── R-1.md           # Risk 1
    ├── M-1.md           # Metric 1
    ├── AC-1.md          # Acceptance Criterion 1
    └── EC-1.md          # Exit Criterion 1
```

**Fragment Types**:
- **A-#**: Assumptions (created in Brainstorm)
- **U-#**: Unknowns (created in Brainstorm)
- **R-#**: Risks (created in Research)
- **M-#**: Metrics (created in Research)
- **AC-#**: Acceptance Criteria (created in Plan)
- **EC-#**: Exit Criteria (created in Plan)

---

## Operation 1: Check Fragment System Exists

**Purpose**: Determine if a work folder has fragment system initialized.

**Input**:
```
work_folder: Path to work folder (e.g., ".WIP/EC-1234")
```

**Steps**:
1. Check if `{work_folder}/fragments.md` exists
2. Check if `{work_folder}/fragments/` directory exists

**Output**:
```
fragments_exist: true/false
registry_path: {work_folder}/fragments.md (if exists)
fragments_dir: {work_folder}/fragments/ (if exists)
```

**Example**:
```bash
# Check if fragments exist
[ -f ".WIP/EC-1234/fragments.md" ] && echo "Registry exists"
[ -d ".WIP/EC-1234/fragments/" ] && echo "Fragments directory exists"
```

---

## Operation 2: Load Fragment Registry

**Purpose**: Read the fragment registry to get an overview of all fragments.

**Input**:
```
work_folder: Path to work folder
```

**Steps**:
1. Read `{work_folder}/fragments.md`
2. Parse the registry to extract fragment list
3. Return structured data

**Output**:
```
registry_content: Full markdown content
fragment_counts: {
  assumptions: N,
  unknowns: N,
  risks: N,
  metrics: N,
  acceptance_criteria: N,
  exit_criteria: N
}
fragment_list: [
  {id: "A-1", description: "...", status: "pending", stage: "brainstorm"},
  {id: "A-2", description: "...", status: "validated", stage: "research"},
  ...
]
```

**Token Efficiency**: Registry typically 200-500 tokens (lightweight overview)

**Example**:
```bash
# Read registry
cat .WIP/EC-1234/fragments.md
```

---

## Operation 3: Load Specific Fragment

**Purpose**: Load detailed information about a specific fragment.

**Input**:
```
work_folder: Path to work folder
fragment_id: Fragment ID (e.g., "A-1", "R-3", "M-2")
```

**Steps**:
1. Construct path: `{work_folder}/fragments/{fragment_id}.md`
2. Read file
3. Return content

**Output**:
```
fragment_content: Full markdown content
fragment_path: Path to fragment file
exists: true/false
```

**Token Efficiency**: Individual fragment typically 300-500 tokens

**Example**:
```bash
# Load specific fragment
cat .WIP/EC-1234/fragments/A-1.md
```

---

## Operation 4: Load Fragments by Type

**Purpose**: Load all fragments of a specific type (e.g., all assumptions).

**Input**:
```
work_folder: Path to work folder
fragment_type: "A" | "U" | "R" | "M" | "AC" | "EC"
```

**Steps**:
1. List all files in `{work_folder}/fragments/` matching pattern `{type}-*.md`
2. Read each file
3. Return array of fragments

**Output**:
```
fragments: [
  {id: "A-1", content: "...", path: "..."},
  {id: "A-2", content: "...", path: "..."},
  ...
]
count: N
```

**Example**:
```bash
# Load all assumptions
ls .WIP/EC-1234/fragments/A-*.md
```

---

## Operation 5: Load Fragments by Status

**Purpose**: Load fragments filtered by status (e.g., all pending assumptions).

**Input**:
```
work_folder: Path to work folder
fragment_type: "A" | "U" | "R" | "M" | "AC" | "EC"
status: Status to filter (e.g., "pending", "validated", "pass", "fail")
```

**Steps**:
1. Load fragment registry
2. Filter fragment_list by type and status
3. Load full content for matching fragments

**Output**:
```
fragments: [
  {id: "A-2", description: "...", status: "pending", content: "..."},
  {id: "A-4", description: "...", status: "pending", content: "..."}
]
count: N
```

---

## Operation 6: Create Fragment Directory Structure

**Purpose**: Initialize fragment system for a new work folder.

**Input**:
```
work_folder: Path to work folder
identifier: Workflow identifier (e.g., "EC-1234")
```

**Steps**:
1. Create `{work_folder}/fragments/` directory
2. Create empty registry: `{work_folder}/fragments.md`
3. Initialize registry with header

**Output**:
```
registry_created: true/false
fragments_dir_created: true/false
registry_path: {work_folder}/fragments.md
fragments_dir: {work_folder}/fragments/
```

**Registry Initial Content**:
```markdown
# Fragment Registry: {identifier}

**Work Folder**: `{work_folder}`
**Last Updated**: {timestamp}

## Summary

| Type | Count | Status |
|------|-------|--------|
| Assumptions (A) | 0 | - |
| Unknowns (U) | 0 | - |
| Risks (R) | 0 | - |
| Metrics (M) | 0 | - |
| Acceptance Criteria (AC) | 0 | - |
| Exit Criteria (EC) | 0 | - |

## Fragments

### Assumptions (A)

| ID | Description | Status | Stage |
|----|-------------|--------|-------|
(none yet)

### Unknowns (U)

| ID | Description | Status | Stage |
|----|-------------|--------|-------|
(none yet)

---

**Note**: For detailed information about any fragment, see `fragments/{ID}.md`
```

**Example**:
```bash
# Create fragment structure
mkdir -p .WIP/EC-1234/fragments
# Initialize registry with Write tool
```

---

## Operation 7: Create New Fragment

**Purpose**: Create a new fragment file from template.

**Input**:
```
work_folder: Path to work folder
fragment_type: "A" | "U" | "R" | "M" | "AC" | "EC"
fragment_number: Number (1, 2, 3, ...)
fragment_data: {
  statement: "...",
  source: "...",
  stage: "brainstorm|research|plan",
  timestamp: "...",
  ... (type-specific fields)
}
```

**Steps**:
1. Read template: `schovi/lib/fragments/{type}-template.md`
2. Replace placeholders with fragment_data
3. Write to `{work_folder}/fragments/{type}-{number}.md`

**Template Placeholders** (common):
- `{NUMBER}`: Fragment number
- `{TIMESTAMP}`: Current timestamp
- `{STAGE}`: Creating stage (brainstorm, research, plan)
- `{STATUS}`: Initial status (usually ⏳ Pending)

**Type-Specific Placeholders**:

**Assumption (A)**:
- `{ASSUMPTION_STATEMENT}`: Statement text
- `{ADDITIONAL_CONTEXT}`: Source context

**Unknown (U)**:
- `{UNKNOWN_QUESTION}`: Question text
- `{EXPLANATION_OF_IMPORTANCE}`: Why it matters

**Risk (R)**:
- `{RISK_DESCRIPTION}`: Risk description
- `{WHAT_HAPPENS_IF_RISK_OCCURS}`: Impact description
- `{WHY_THIS_PROBABILITY}`: Probability rationale

**Metric (M)**:
- `{METRIC_DESCRIPTION}`: Metric description
- `{TARGET_VALUE}`: Target value
- `{BASELINE_COMMAND_1}`: How to measure

**Acceptance Criterion (AC)**:
- `{ACCEPTANCE_CRITERION_STATEMENT}`: Criterion statement
- `{REQUIREMENT_1}`, `{REQUIREMENT_2}`, ...
- `{VERIFICATION_COMMAND}`: Verification method

**Exit Criterion (EC)**:
- `{EXIT_CRITERION_STATEMENT}`: Criterion statement
- `{PHASE_NAME}`: Which phase
- `{VERIFICATION_COMMAND}`: Verification method

**Output**:
```
fragment_created: true/false
fragment_path: {work_folder}/fragments/{type}-{number}.md
fragment_id: {type}-{number}
```

**Example**:
```bash
# Read template
cat schovi/lib/fragments/A-template.md

# Replace placeholders and write
# (Using Write tool with replaced content)
```

---

## Operation 8: Update Fragment

**Purpose**: Update an existing fragment (e.g., change status, add validation result).

**Input**:
```
work_folder: Path to work folder
fragment_id: Fragment ID (e.g., "A-1")
updates: {
  status: "validated" | "failed" | "pass" | "answered", (optional)
  validation_method: "...", (for assumptions)
  validation_result: "pass" | "fail", (for assumptions)
  evidence: ["...", "..."], (for assumptions, unknowns)
  answer: "...", (for unknowns)
  ... (type-specific fields)
}
```

**Steps**:
1. Read existing fragment: `{work_folder}/fragments/{fragment_id}.md`
2. Parse and update relevant sections
3. Update "Last Updated" timestamp
4. Write updated content

**Common Updates**:

**Assumption Validation** (Research phase):
```
- Update Status: ⏳ Pending → ✅ Validated | ❌ Failed
- Fill "Validation" section:
  - Method
  - Result
  - Evidence
  - Tested By + timestamp
```

**Unknown Answer** (Research phase):
```
- Update Status: ⏳ Pending → ✅ Answered
- Fill "Answer" section:
  - Finding
  - Evidence
  - Decision
```

**Exit Criterion Execution** (Implement phase):
```
- Update Status: ⏳ Pending → ✅ Pass | ❌ Fail
- Fill "Implementation Status" section:
  - Executed timestamp
  - Result
  - Evidence
  - Verified By
```

**Output**:
```
fragment_updated: true/false
fragment_path: {work_folder}/fragments/{fragment_id}.md
changes_made: ["status: pending → validated", "added evidence", ...]
```

**Example**:
```bash
# Read existing fragment
cat .WIP/EC-1234/fragments/A-1.md

# Modify content (using Read + Edit tools)
# Update status line: **Status**: ⏳ Pending → ✅ Validated
# Fill validation section
```

---

## Operation 9: Update Fragment Registry

**Purpose**: Update the registry after creating/updating fragments.

**Input**:
```
work_folder: Path to work folder
identifier: Workflow identifier
updates: {
  fragment_id: "A-1",
  description: "One-sentence description",
  status: "pending" | "validated" | "pass" | ...,
  stage: "brainstorm" | "research" | "plan" | "implement",
  ... (type-specific fields for table columns)
}
```

**Steps**:
1. Read existing registry: `{work_folder}/fragments.md`
2. Update "Last Updated" timestamp
3. Update Summary counts
4. Add/update row in appropriate table section
5. Write updated registry

**Table Row Formats**:

**Assumptions**:
```
| A-1 | {description} | {status} | {stage} |
```

**Unknowns**:
```
| U-1 | {description} | {status} | {stage} |
```

**Risks**:
```
| R-1 | {description} | {impact} | {probability} | {stage} |
```

**Metrics**:
```
| M-1 | {description} | {target} | {owner} | {stage} |
```

**Acceptance Criteria**:
```
| AC-1 | {description} | {validates} | {mitigates} | {stage} |
```

**Exit Criteria**:
```
| EC-1 | {description} | {phase} | {validates} | {stage} |
```

**Output**:
```
registry_updated: true/false
registry_path: {work_folder}/fragments.md
```

**Example**:
```bash
# Read registry
cat .WIP/EC-1234/fragments.md

# Edit to add new row (using Edit tool)
```

---

## Operation 10: Batch Create Fragments

**Purpose**: Create multiple fragments at once (e.g., all assumptions from brainstorm).

**Input**:
```
work_folder: Path to work folder
identifier: Workflow identifier
fragments: [
  {
    type: "A",
    number: 1,
    statement: "...",
    source: "...",
    stage: "brainstorm",
    timestamp: "..."
  },
  {
    type: "A",
    number: 2,
    ...
  },
  {
    type: "U",
    number: 1,
    ...
  }
]
```

**Steps**:
1. Ensure fragments directory exists (create if needed)
2. For each fragment:
   - Create fragment file using Operation 7
   - Add entry to registry using Operation 9
3. Update registry summary counts

**Output**:
```
fragments_created: [
  {id: "A-1", path: "...", success: true},
  {id: "A-2", path: "...", success: true},
  {id: "U-1", path: "...", success: true}
]
total_created: N
registry_updated: true/false
```

---

## Operation 11: Get Next Fragment Number

**Purpose**: Determine the next available number for a fragment type.

**Input**:
```
work_folder: Path to work folder
fragment_type: "A" | "U" | "R" | "M" | "AC" | "EC"
```

**Steps**:
1. List all fragments of type: `{work_folder}/fragments/{type}-*.md`
2. Extract numbers from filenames
3. Return max + 1

**Output**:
```
next_number: N (e.g., if A-1.md, A-2.md exist, return 3)
existing_count: N
```

**Example**:
```bash
# List existing assumptions
ls .WIP/EC-1234/fragments/A-*.md | wc -l
# If output is 2, next number is 3
```

---

## Usage Examples

### Example 1: Brainstorm Command Creating Fragments

```markdown
## PHASE 4.5: CREATE FRAGMENTS (after brainstorm output)

Use lib/fragment-loader.md:

Step 1: Initialize fragment system (Operation 6)
```
work_folder: .WIP/EC-1234
identifier: EC-1234
```

Step 2: Parse brainstorm output for assumptions and unknowns
- Extract assumptions from "Assumptions & Unknowns" section
- Extract unknowns from same section

Step 3: Batch create fragments (Operation 10)
```
work_folder: .WIP/EC-1234
identifier: EC-1234
fragments: [
  {type: "A", number: 1, statement: "Database migration tools available", ...},
  {type: "A", number: 2, statement: "Frontend can adapt within 1 sprint", ...},
  {type: "U", number: 1, question: "Performance impact of caching", ...}
]
```

Result: Created A-1.md, A-2.md, U-1.md, fragments.md
```

### Example 2: Research Command Using Fragments

```markdown
## PHASE 2.5: LOAD FRAGMENT CONTEXT

Use lib/fragment-loader.md:

Step 1: Check if fragments exist (Operation 1)
```
work_folder: .WIP/EC-1234
```

Step 2: Load fragment registry (Operation 2)
- Get overview of all assumptions and unknowns

Step 3: Load all assumptions (Operation 4)
```
work_folder: .WIP/EC-1234
fragment_type: "A"
```

Step 4: Load all unknowns (Operation 4)
```
work_folder: .WIP/EC-1234
fragment_type: "U"
```

Step 5: Pass to research-executor
```
ASSUMPTIONS TO VALIDATE:
A-1: {content from A-1.md}
A-2: {content from A-2.md}

UNKNOWNS TO INVESTIGATE:
U-1: {content from U-1.md}
```

## PHASE 3.5: UPDATE FRAGMENTS (after research executor returns)

Step 1: Parse research output for validation results

Step 2: Update each assumption (Operation 8)
```
fragment_id: A-1
updates: {
  status: "validated",
  validation_method: "Code review",
  validation_result: "pass",
  evidence: ["db/migrations/001.sql:1-50"],
  tested_by: "Research phase (2025-11-08T12:30:00Z)"
}
```

Step 3: Update registry (Operation 9)

Step 4: Create new risk fragments (Operation 7)

Step 5: Create new metric fragments (Operation 7)
```

### Example 3: Plan Command Using Fragments

```markdown
## PHASE 2.5: LOAD FRAGMENT CONTEXT

Use lib/fragment-loader.md:

Step 1: Load assumptions (Operation 4)
```
fragment_type: "A"
```

Step 2: Load risks (Operation 4)
```
fragment_type: "R"
```

Step 3: Load metrics (Operation 4)
```
fragment_type: "M"
```

Step 4: Pass to spec-generator
```
VALIDATED ASSUMPTIONS:
A-1: {statement} - Status: ✅ Validated
A-2: {statement} - Status: ⏳ Pending

RISKS TO MITIGATE:
R-1: {description} - Impact: High, Probability: Medium
R-2: {description} - Impact: Medium, Probability: High

METRICS TO MEET:
M-1: {description} - Target: p95 < 200ms
M-2: {description} - Target: Error rate < 0.1%

Your task: Create acceptance criteria that validate assumptions and mitigate risks.
```

## PHASE 3.5: CREATE AC/EC FRAGMENTS (after spec generator returns)

Step 1: Parse spec output for acceptance criteria

Step 2: Create AC fragments (Operation 7)

Step 3: Parse spec output for exit criteria

Step 4: Create EC fragments (Operation 7)

Step 5: Update registry (Operation 9)
```

---

## Error Handling

### Fragments Directory Missing
**Problem**: Work folder exists but no fragments/ directory
**Solution**: Use Operation 6 to initialize, then proceed

### Fragment File Missing
**Problem**: Registry references A-1 but A-1.md doesn't exist
**Solution**: Log warning, skip that fragment, continue with others

### Registry Corrupted
**Problem**: fragments.md has invalid format
**Solution**: Recreate registry from existing fragment files

### Duplicate Fragment IDs
**Problem**: A-1.md exists when trying to create A-1
**Solution**: Use Operation 11 to get next number, or update existing

---

## Design Principles

1. **Token Efficiency**: Load registry first (lightweight), then load specific fragments on-demand
2. **Backward Compatibility**: Check if fragments exist before using; work folders without fragments continue working
3. **Fail Gracefully**: Missing fragment files don't block workflow
4. **Human-Readable**: All files are markdown, easy to review and edit
5. **Git-Friendly**: Text files, clear diffs, no binary formats
6. **Consistent Structure**: Templates ensure uniform format across all fragments

---

**Library Version**: 1.0
**Last Updated**: 2025-11-08
**Dependencies**:
- `schovi/lib/fragments/*-template.md`
- Read, Write, Edit tools
- Bash for file operations
