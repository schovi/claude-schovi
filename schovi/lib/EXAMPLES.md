# Work Folder Integration - Practical Examples

This document provides complete, copy-paste examples of how to integrate work folder management into commands.

## Example 1: Analyze Command Integration

### Input: Jira Issue

**User Command:**
```bash
/schovi:analyze EC-1234
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: "EC-1234"
Detected: Jira issue

Bash command to extract Jira ID:
```
```bash
echo "EC-1234" | grep -oE '\b[A-Z]{2,10}-[0-9]{1,6}\b'
```

Result: EC-1234

## Phase 2: Fetch External Context

Use Task tool to spawn jira-analyzer subagent:
- subagent_type: "schovi:jira-analyzer:jira-analyzer"
- prompt: "Fetch and summarize Jira issue EC-1234"

Received summary:
- Issue: EC-1234
- Title: "Add user authentication with OAuth2"
- Type: Story
- Description: [500 char summary]

## Phase 3: Generate Identifier

Jira ID: EC-1234
Title: "Add user authentication with OAuth2"

Generate slug:
```bash
echo "Add user authentication with OAuth2" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50 | sed 's/-$//'
```

Result: add-user-authentication-with-oauth2

Full identifier: EC-1234-add-user-authentication-with-oauth2

## Phase 4: Create Work Folder

Check if exists:
```bash
find .WIP -type d -name "EC-1234*" | head -1
```

Result: (empty - doesn't exist)

Create folder:
```bash
mkdir -p .WIP/EC-1234-add-user-authentication-with-oauth2/context
```

## Phase 5: Create Initial Metadata

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Result: 2025-01-15T10:30:00Z

Get current git branch:
```bash
git rev-parse --abbrev-ref HEAD
```

Result: claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED

Create metadata JSON:
```json
{
  "identifier": "EC-1234",
  "title": "Add user authentication with OAuth2",
  "slug": "add-user-authentication-with-oauth2",
  "workFolder": ".WIP/EC-1234-add-user-authentication-with-oauth2",

  "workflow": {
    "type": "technical",
    "steps": ["analyze", "plan", "implement"],
    "completed": [],
    "current": "analyze"
  },

  "files": {},

  "git": {
    "branch": "claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": "EC-1234",
    "jiraUrl": "https://company.atlassian.net/browse/EC-1234",
    "githubPR": null,
    "githubIssue": null
  },

  "timestamps": {
    "created": "2025-01-15T10:30:00Z",
    "lastModified": "2025-01-15T10:30:00Z",
    "completed": null
  }
}
```

Write to file using Write tool:
- file_path: .WIP/EC-1234-add-user-authentication-with-oauth2/.metadata.json
- content: [JSON above]

## Phase 6: Execute Analysis

[Perform deep codebase analysis using Explore subagent]
[Generate structured analysis output]

Analysis complete with:
- Problem summary
- Current state
- 3 solution options
- File references (file:line format)

## Phase 7: Write Output File

Output file path: .WIP/EC-1234-add-user-authentication-with-oauth2/02-analysis.md

Use Write tool:
- file_path: .WIP/EC-1234-add-user-authentication-with-oauth2/02-analysis.md
- content: [Full analysis markdown]

## Phase 8: Update Metadata

Read existing metadata:
```bash
cat .WIP/EC-1234-add-user-authentication-with-oauth2/.metadata.json
```

Update fields:
- workflow.completed = ["analyze"]
- files.analysis = "02-analysis.md"
- timestamps.lastModified = "2025-01-15T12:00:00Z"

Write updated metadata using Write tool.

## Phase 9: Show Results to User

Output to user:
```
✅ Analysis complete!

📁 Work folder: .WIP/EC-1234-add-user-authentication-with-oauth2/
📄 Analysis: 02-analysis.md

🔍 Found 3 solution options:
1. Implement custom JWT authentication
2. Integrate Auth0 OAuth provider
3. Use NextAuth.js library

Next steps:
- Review analysis: cat .WIP/EC-1234-add-user-authentication-with-oauth2/02-analysis.md
- Generate plan: /schovi:plan
```
```

---

## Example 2: Plan Command Integration (Auto-detect)

### Input: No arguments (auto-detect from previous analyze)

**User Command:**
```bash
/schovi:plan
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: (empty)
Mode: Auto-detect

## Phase 2: Auto-detect Work Folder

Strategy 1: Check git branch
```
```bash
git rev-parse --abbrev-ref HEAD
```

Result: claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED

Extract identifier:
```bash
echo "claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED" | grep -oE '[A-Z]{2,10}-[0-9]{1,6}'
```

Result: EC-1234

Find work folder:
```bash
find .WIP -type d -name "EC-1234*" | head -1
```

Result: .WIP/EC-1234-add-user-authentication-with-oauth2

## Phase 3: Read Metadata

```bash
cat .WIP/EC-1234-add-user-authentication-with-oauth2/.metadata.json
```

Parse JSON:
- workflow.completed: ["analyze"]
- workflow.current: "analyze"
- files.analysis: "02-analysis.md"

## Phase 4: Validate Prerequisites

Check: Is "analyze" or "spec" in workflow.completed?
Result: ✅ "analyze" is present

Proceed to next phase.

## Phase 5: Read Input File

Input file: .WIP/EC-1234-add-user-authentication-with-oauth2/02-analysis.md

Use Read tool:
- file_path: .WIP/EC-1234-add-user-authentication-with-oauth2/02-analysis.md

Content loaded: [analysis markdown]

## Phase 6: Execute Plan Generation

Use Task tool to spawn spec-generator subagent:
- subagent_type: "schovi:spec-generator:spec-generator"
- prompt: "Generate implementation plan from analysis: [analysis content]"

Received plan:
- Problem summary
- Chosen approach: Option 2 (Auth0 integration)
- Implementation tasks (4 phases)
- Acceptance criteria
- Testing strategy

## Phase 7: Write Output File

Output file path: .WIP/EC-1234-add-user-authentication-with-oauth2/03-plan.md

Use Write tool:
- file_path: .WIP/EC-1234-add-user-authentication-with-oauth2/03-plan.md
- content: [Full plan markdown]

## Phase 8: Update Metadata

Read existing metadata, update:
- workflow.completed = ["analyze", "plan"]
- workflow.current = "plan"
- files.plan = "03-plan.md"
- timestamps.lastModified = [now]
- phases.total = 4
- phases.list = [phase details]

Write updated metadata.

## Phase 9: Show Results to User

```
✅ Plan complete!

📁 Work folder: .WIP/EC-1234-add-user-authentication-with-oauth2/
📄 Plan: 03-plan.md

📊 Implementation: 4 phases identified
- Phase 1: Auth0 setup and configuration
- Phase 2: User model and database integration
- Phase 3: Login/logout flows
- Phase 4: Protected routes and middleware

Next steps:
- Review plan: cat .WIP/EC-1234-add-user-authentication-with-oauth2/03-plan.md
- Start implementation: /schovi:implement
```
```

---

## Example 3: Plan Command with Explicit Input

### Input: Explicit file path

**User Command:**
```bash
/schovi:plan --input .WIP/GH-123-fix-timeout/02-debug.md
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: --input .WIP/GH-123-fix-timeout/02-debug.md
Mode: Explicit input file

Extract work folder:
```
```bash
dirname .WIP/GH-123-fix-timeout/02-debug.md
```

Result: .WIP/GH-123-fix-timeout

## Phase 2: Validate Work Folder

Check if exists:
```bash
ls .WIP/GH-123-fix-timeout 2>/dev/null && echo "exists"
```

Result: exists ✅

## Phase 3: Read Metadata

```bash
cat .WIP/GH-123-fix-timeout/.metadata.json
```

Parse:
- identifier: GH-123
- workflow.type: "bug"
- workflow.completed: ["debug"]
- files.debug: "02-debug.md"

## Phase 4: Read Input File

Use Read tool:
- file_path: .WIP/GH-123-fix-timeout/02-debug.md

Content: [debug analysis with root cause and fix proposal]

## Phase 5: Execute Plan Generation

[Generate detailed fix plan from debug analysis]

## Phase 6: Write Output

Use Write tool:
- file_path: .WIP/GH-123-fix-timeout/03-plan.md
- content: [Fix plan]

## Phase 7: Update Metadata

Update:
- workflow.completed = ["debug", "plan"]
- files.plan = "03-plan.md"
- timestamps.lastModified = [now]

## Phase 8: Show Results

```
✅ Fix plan complete!

📁 Work folder: .WIP/GH-123-fix-timeout/
📄 Plan: 03-plan.md

🔧 Fix approach: Increase timeout threshold and add retry logic

Next steps:
- Review plan: cat .WIP/GH-123-fix-timeout/03-plan.md
- Apply fix: /schovi:implement
```
```

---

## Example 4: Implement Command with Resume

### Input: Resume from checkpoint

**User Command:**
```bash
/schovi:implement --resume
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: --resume flag
Mode: Resume from last checkpoint

## Phase 2: Auto-detect Work Folder

Check git branch:
```
```bash
git rev-parse --abbrev-ref HEAD
```

Result: claude/auth-EC-1234-011CUpGnQ1VA9GwenfMMNoED

Extract and find:
```bash
find .WIP -type d -name "EC-1234*"
```

Result: .WIP/EC-1234-add-user-authentication-with-oauth2

## Phase 3: Read Metadata and Progress

Read metadata:
```bash
cat .WIP/EC-1234-add-user-authentication-with-oauth2/.metadata.json
```

Parse phases:
- phases.total: 4
- phases.completed: 2
- phases.current: 3

Read progress file:
```bash
cat .WIP/EC-1234-add-user-authentication-with-oauth2/04-progress.md
```

Status:
- Phase 1: ✅ Completed (commit: abc123f)
- Phase 2: ✅ Completed (commit: def456a)
- Phase 3: 🚧 In progress (50% complete)
- Phase 4: ⏳ Pending

## Phase 4: Load Plan for Current Phase

Read plan:
```bash
cat .WIP/EC-1234-add-user-authentication-with-oauth2/03-plan.md
```

Extract Phase 3 tasks only (context optimization):
- Task 3.1: Implement login endpoint
- Task 3.2: Implement logout endpoint
- Task 3.3: Add session management

Phase 3.1 already done (from progress.md).
Resume from Task 3.2.

## Phase 5: Execute Current Phase

[Implement Task 3.2]
[Implement Task 3.3]
[Run tests for Phase 3]

Phase 3 complete!

## Phase 6: Commit Checkpoint

```bash
git add . && git commit -m "feat: Complete login/logout flows (Phase 3/4)

- Implemented login endpoint with Auth0 validation
- Added logout endpoint with session cleanup
- Session management with Redis store

Related to: EC-1234

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Get commit hash:
```bash
git log -1 --format='%H'
```

Result: ghi789j

## Phase 7: Update Progress

Update progress.md:
```markdown
### ✅ Phase 3: Login/logout flows (Completed 2025-01-15T15:00:00Z)
- [x] Task 3.1: Implement login endpoint
- [x] Task 3.2: Implement logout endpoint
- [x] Task 3.3: Add session management
- Commit: ghi789j

### 🚧 Phase 4: Protected routes (Next)
[Tasks listed but not started]
```

## Phase 8: Update Metadata

Update:
- phases.completed = 3
- phases.current = 4
- phases.list[2].status = "completed"
- phases.list[2].commit = "ghi789j"
- phases.list[3].status = "in_progress"
- git.commits = ["abc123f", "def456a", "ghi789j"]
- git.lastCommit = "ghi789j"
- timestamps.lastModified = [now]

## Phase 9: Show Results

```
✅ Phase 3 complete!

📁 Work folder: .WIP/EC-1234-add-user-authentication-with-oauth2/
📊 Progress: 3/4 phases (75%)
💾 Commit: ghi789j

✅ Completed:
- Phase 1: Auth0 setup
- Phase 2: User model integration
- Phase 3: Login/logout flows ← Just finished

⏳ Remaining:
- Phase 4: Protected routes and middleware

Next steps:
- Continue: /schovi:implement --resume
- Or take a break - progress saved!
```
```

---

## Example 5: Debug Command with New Work

### Input: Free-form error description

**User Command:**
```bash
/schovi:debug "Payment processing times out after 30 seconds in production"
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: "Payment processing times out after 30 seconds in production"
Type: Error description
No Jira/GitHub reference

## Phase 2: Generate Identifier

No Jira ID, no GitHub issue.
Generate from description:

```
```bash
echo "Payment processing times out after 30 seconds" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/-\+/-/g' | cut -c1-50
```

Result: payment-processing-times-out-after-30-sec

Prefix with "debug-": debug-payment-timeout

## Phase 3: Create Work Folder

```bash
mkdir -p .WIP/debug-payment-timeout/context
```

## Phase 4: Create Initial Metadata

```json
{
  "identifier": "debug-payment-timeout",
  "title": "Payment processing times out after 30 seconds",
  "slug": "payment-processing-times-out-after-30-sec",
  "workFolder": ".WIP/debug-payment-timeout",

  "workflow": {
    "type": "bug",
    "steps": ["debug", "implement"],
    "completed": [],
    "current": "debug"
  },

  "files": {},

  "git": {
    "branch": "claude/debug-payment-timeout-011CUpGnQ1VA9GwenfMMNoED",
    "commits": [],
    "lastCommit": null
  },

  "external": {
    "jiraIssue": null,
    "jiraUrl": null,
    "githubPR": null,
    "githubIssue": null
  },

  "timestamps": {
    "created": "2025-01-15T16:00:00Z",
    "lastModified": "2025-01-15T16:00:00Z",
    "completed": null
  }
}
```

Write to .WIP/debug-payment-timeout/.metadata.json

## Phase 5: Execute Debugging

[Use Explore subagent to trace payment flow]
[Identify timeout at Stripe API call]
[Root cause: No timeout configuration, uses default 60s but network cuts at 30s]

## Phase 6: Write Debug Output

Write to .WIP/debug-payment-timeout/02-debug.md:

```markdown
# Debug Analysis: Payment Timeout

## Error Point
- Location: src/payments/stripe.ts:145
- Function: processPayment()
- Immediate cause: Stripe API call hangs without response

## Execution Flow
1. User submits payment → src/api/checkout.ts:89
2. Validate payment → src/payments/validator.ts:34
3. Call Stripe API → src/payments/stripe.ts:145 ← **TIMES OUT HERE**
4. Never reaches: Payment confirmation

## Root Cause
**Category:** Configuration issue

The Stripe client is initialized without explicit timeout:
```
const stripe = new Stripe(apiKey);  // Uses default 60s timeout
```

However, production network configuration has 30s timeout, cutting connection early.

## Fix Proposal
[Detailed fix with code changes]
```

Use Write tool to save file.

## Phase 7: Update Metadata

Update:
- workflow.completed = ["debug"]
- files.debug = "02-debug.md"
- timestamps.lastModified = [now]

## Phase 8: Show Results

```
✅ Debug analysis complete!

📁 Work folder: .WIP/debug-payment-timeout/
📄 Debug report: 02-debug.md

🔍 Root cause: Missing timeout configuration in Stripe client
📍 Location: src/payments/stripe.ts:145

🛠️ Fix: Configure explicit 25s timeout to prevent network cut

Next steps:
- Review analysis: cat .WIP/debug-payment-timeout/02-debug.md
- Apply fix directly: /schovi:implement
- Or create detailed plan: /schovi:plan --input .WIP/debug-payment-timeout/02-debug.md
```
```

---

## Example 6: Error Handling - Missing Prerequisites

### Input: Plan without prior analysis

**User Command:**
```bash
/schovi:plan EC-1234
```

**Command Execution Steps:**

```markdown
## Phase 1: Parse Input

Input: EC-1234
Type: Jira issue

## Phase 2: Search for Work Folder

```
```bash
find .WIP -type d -name "EC-1234*"
```

Result: (empty - no folder found)

## Phase 3: Check if Analysis Exists

No work folder found.
No analysis file available.
Cannot proceed with plan generation.

## Phase 4: Show Error with Guidance

```
❌ Cannot generate plan - no analysis found

🔍 No work folder found for EC-1234

The plan command requires prior analysis or spec. Please run one of:
- /schovi:analyze EC-1234  (for technical analysis)
- /schovi:spec EC-1234     (for product specification)
- /schovi:debug EC-1234    (for bug investigation)

Or use --from-scratch for simple tasks:
- /schovi:plan --from-scratch "Add loading spinner to button"
```

STOP - Do not proceed further.
```

---

## Copy-Paste Snippets

### Snippet 1: Auto-detect Work Folder

```markdown
## Auto-detect work folder from git branch

```
```bash
# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Extract identifier (Jira or GitHub)
identifier=$(echo "$branch" | grep -oE '[A-Z]{2,10}-[0-9]{1,6}' | head -1)

# Find work folder
if [ -n "$identifier" ]; then
  work_folder=$(find .WIP -type d -name "${identifier}*" | head -1)
  echo "Found: $work_folder"
fi
```
```

### Snippet 2: Create Work Folder with Metadata

```markdown
## Create new work folder

```
```bash
# Variables
identifier="EC-1234-add-user-auth"
title="Add user authentication"
current_command="analyze"

# Create folder
mkdir -p ".WIP/$identifier/context"

# Create metadata
cat > ".WIP/$identifier/.metadata.json" <<'EOF'
{
  "identifier": "EC-1234",
  "title": "Add user authentication",
  "workFolder": ".WIP/EC-1234-add-user-auth",
  "workflow": {
    "type": "technical",
    "steps": ["analyze", "plan", "implement"],
    "completed": [],
    "current": "analyze"
  },
  "files": {},
  "git": {
    "branch": "$(git rev-parse --abbrev-ref HEAD)",
    "commits": []
  },
  "timestamps": {
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "lastModified": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
```
```

### Snippet 3: Update Metadata After Command

```markdown
## Update metadata after command completion

Use Read tool to load existing metadata.
Parse JSON and update fields.
Use Write tool to save updated metadata.

Key updates:
- workflow.completed: Append current command
- files.[command]: Output filename
- timestamps.lastModified: Current timestamp
- git.commits: Append new commit hashes
```

### Snippet 4: Validate Prerequisites

```markdown
## Validate workflow prerequisites

```
```bash
# Read metadata
metadata=$(cat .WIP/EC-1234/.metadata.json)

# Check if required step completed
if echo "$metadata" | jq -e '.workflow.completed[] | select(. == "analyze")' > /dev/null; then
  echo "Prerequisites met ✅"
else
  echo "Error: Analysis required first ❌"
  exit 1
fi
```
```

---

## Testing Commands

### Test New Work Folder Creation

```bash
# Test analyze with Jira
/schovi:analyze TEST-001

# Verify folder created
ls -la .WIP/TEST-001*/

# Verify metadata
cat .WIP/TEST-001*/.metadata.json | jq .

# Verify output file
cat .WIP/TEST-001*/02-analysis.md
```

### Test Auto-detection

```bash
# After analyze, test plan auto-detect
/schovi:plan

# Should find work folder automatically
# Verify it loaded correct analysis file
```

### Test Explicit Input

```bash
# Test plan with explicit input
/schovi:plan --input .WIP/TEST-001/02-analysis.md

# Verify it used correct work folder
```

### Test Error Handling

```bash
# Try plan without analysis
/schovi:plan TEST-999

# Should show clear error message with guidance
```

---

## Summary

These examples demonstrate:

✅ **Complete integration patterns** for each command type
✅ **Auto-detection** strategies for work folders
✅ **Metadata management** creation and updates
✅ **Error handling** with clear user guidance
✅ **Resume capability** for long-running tasks
✅ **Copy-paste snippets** for common operations

**Key Takeaways:**
1. Always try auto-detect first (git branch, identifier)
2. Create metadata immediately when creating work folder
3. Update metadata after every command execution
4. Validate prerequisites before proceeding
5. Show clear, actionable errors with next steps
6. Make commands idempotent (re-runnable safely)
