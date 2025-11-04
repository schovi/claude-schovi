---
description: Deep analysis of bugs/features with codebase exploration, flow mapping, and solution proposals
argument-hint: [jira-id|description]
allowed-tools: ["Read", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Problem Analyzer Workflow

You are performing a **comprehensive problem analysis** for a bug or feature request. Follow this structured workflow meticulously.

---

## PHASE 1: INPUT PROCESSING & CLARIFICATION

**Input Received**: $ARGUMENTS

### Step 1.1: Parse Input

Determine input type:
- **Jira Issue ID**: Matches pattern `[A-Z]+-\d+` (e.g., EC-1234, PROJ-567)
- **Textual Description**: Free-form problem statement
- **Empty/Unclear**: Missing or ambiguous input

### Step 1.2: Smart Clarification Detection

**IMPORTANT**: Before proceeding with analysis, evaluate if the input is sufficient. Ask clarifying questions ONLY if ANY of these conditions are true:

1. **Ambiguous Scope**:
   - Problem mentions "login" but unclear which login flow (OAuth, username/password, SSO, etc.)
   - Feature request without clear success criteria
   - Bug without reproduction steps

2. **Missing Critical Context**:
   - No indication of affected system/component
   - Unclear user journey or entry point
   - Unknown environment (production, staging, specific version)

3. **Multiple Interpretations**:
   - Request could apply to multiple features/flows
   - Unclear priority or urgency
   - Ambiguous technical requirements

**If clarification is needed**, use the AskUserQuestion tool to ask focused questions:
- What is the affected component/feature?
- What is the expected behavior vs. actual behavior?
- Are there specific reproduction steps?
- Which environment is affected?
- Are there any related systems or dependencies to consider?

**If input is clear**, proceed directly to Step 1.3.

### Step 1.3: Fetch Detailed Information

**If Jira Issue ID Provided**:
```
IMPORTANT: Delegate to the jira-analyzer subagent to prevent context pollution.

1. Use the Task tool to invoke the jira-analyzer subagent:
   prompt: "Fetch and summarize Jira issue [ISSUE-KEY or URL]"
   subagent_type: "schovi:jira-analyzer:jira-analyzer"
   description: "Fetching Jira issue summary"

2. The subagent will:
   - Fetch the full Jira payload (~10k tokens) in its isolated context
   - Extract ONLY essential information
   - Return a clean summary (~800 tokens)

3. You will receive a structured summary containing:
   - Core information (key, title, type, status, priority)
   - Condensed description
   - Acceptance criteria
   - Key comments (max 3)
   - Related issues
   - Technical context

4. Use this summary as the primary source of truth for your analysis

NEVER fetch Jira directly using mcp__jira__* tools - always delegate to the subagent.
This prevents massive Jira payloads from polluting your context.
```

**If Textual Description Provided**:
```
1. Parse the problem statement carefully
2. Identify:
   - Expected behavior
   - Actual behavior (for bugs)
   - Desired outcome (for features)
   - Mentioned files, services, or components
   - User-facing vs. internal impact
3. Document assumptions made
```

**If No Input Provided**:
```
1. Ask user: "Please provide either:
   - A Jira issue ID (e.g., EC-1234)
   - A problem description with context"
2. Wait for response and restart this phase
```

---

## PHASE 2: DEEP CODEBASE ANALYSIS

**CRITICAL**: Use the **Task tool with Plan subagent type** for thorough exploration. DO NOT use direct search tools unless for targeted follow-up queries.

### Step 2.1: User Flow Mapping

**Objective**: Trace the complete user journey through the system.

**Execute**:
```
1. Identify entry points:
   - UI components (React, Vue, Angular components)
   - API endpoints (REST, GraphQL)
   - CLI commands
   - Background jobs/workers

2. Map user journey step-by-step:
   User Action → UI Component → Event Handler → API Call → Backend Service → Data Layer → Response → UI Update

3. Document touchpoints:
   - Where user interacts with the system
   - What triggers the behavior
   - Expected vs. actual flow paths
   - Error handling points

4. Note affected screens/interfaces:
   - Component file paths with line numbers
   - Route definitions
   - Navigation flows
```

**Deliverable**: Complete user flow diagram with file:line references.

### Step 2.2: Data Flow Analysis

**Objective**: Map how data moves and transforms through the system.

**Execute**:
```
1. Identify data sources:
   - Database tables/collections
   - External APIs
   - File systems
   - Cache layers (Redis, Memcached)
   - Message queues (Kafka, RabbitMQ)

2. Trace data transformations:
   Input → Validation → Business Logic → Storage → Retrieval → Formatting → Output

3. Document data structures:
   - Database schemas
   - API request/response models
   - Internal data transfer objects
   - State management structures

4. Identify data integrity points:
   - Where validation occurs
   - Transaction boundaries
   - Data consistency mechanisms
   - Rollback/compensation logic
```

**Deliverable**: Data flow diagram showing sources, transformations, and destinations with specific code locations.

### Step 2.3: Dependency Discovery

**Objective**: Map all dependencies that could be affected or impact the solution.

**A. Direct Dependencies**:
```
- Imported modules and packages
- Called functions and methods
- Database tables and indexes
- External API endpoints
- Configuration files
- Environment variables
```

**B. Indirect Dependencies**:
```
- Shared state and singletons
- Event emitters/listeners
- Kafka topics (producers/consumers)
- Background jobs and schedulers
- Cache invalidation triggers
- Feature flags
- A/B test configurations
```

**C. Integration Points**:
```
- Microservices communication (sync/async)
- Third-party integrations (payment, auth, analytics)
- Webhooks (incoming/outgoing)
- CDN and asset pipelines
- Monitoring and logging systems
```

**Deliverable**: Complete dependency graph with categorization and impact assessment.

### Step 2.4: Code Quality Assessment

**Objective**: Evaluate technical health of affected areas.

**Execute**:
```
1. Identify technical debt:
   - TODO/FIXME comments
   - Code duplication
   - Complex/nested logic
   - Missing error handling

2. Assess test coverage:
   - Unit test presence
   - Integration test gaps
   - E2E test scenarios
   - Mock/stub quality

3. Note code smells:
   - Long functions/files
   - Deep nesting
   - Magic numbers/strings
   - Tight coupling
   - God objects/classes

4. Review recent changes:
   - Recent commits in affected areas
   - Outstanding PRs
   - Known issues/bugs
```

**Deliverable**: Code quality report with specific file:line references to issues.

### Step 2.5: Historical Context

**Objective**: Understand evolution and patterns.

**Execute**:
```
1. Review git history:
   - Recent changes to affected files
   - Previous bug fixes in same area
   - Related feature implementations
   - Authors/teams involved

2. Check for patterns:
   - Recurring issues
   - Failed attempts at similar changes
   - Deprecated approaches
   - Migration history

3. Identify stakeholders:
   - Code owners
   - Frequent contributors
   - Domain experts
```

**Deliverable**: Historical context summary with relevant commits and patterns.

---

## PHASE 3: STRUCTURED OUTPUT

Present your findings in this exact format:

---

### 🎯 1. PROBLEM SUMMARY

```
[2-4 sentence executive summary]

**Core Issue**: [What is broken or needed - one clear sentence]

**Impact**:
- Users affected: [Who experiences this]
- Systems affected: [Which components/services]
- Severity: [Critical/High/Medium/Low - with justification]

**Urgency**: [Immediate/High/Medium/Low - based on Jira priority or assessment]
```

---

### 📊 2. CURRENT STATE ANALYSIS

#### Affected Components

List each component with its role and current behavior:

- **`path/to/component.ts:123`** - [Component name]
  - Role: [What it does]
  - Current behavior: [How it currently works]
  - Issue: [What's wrong or missing]

- **`path/to/service.ts:456`** - [Service name]
  - Role: [What it does]
  - Current behavior: [How it currently works]
  - Relationship: [How it connects to other components]

*(Repeat for all affected components)*

#### User Flow

```
1. User Action: [What user does]
   ↓
2. Entry Point: Component A (`path/to/componentA.ts:123`)
   ↓
3. Processing: Service B (`path/to/serviceB.ts:456`)
   ↓
4. Data Layer: Database/API (`path/to/repository.ts:789`)
   ↓
5. Response: Transform & Return (`path/to/controller.ts:234`)
   ↓
6. UI Update: Component C (`path/to/componentC.ts:567`)
```

#### Data Flow

```
Input Source: [Where data originates]
  ↓
Validation: [`path/to/validator.ts:123`]
  ↓
Transformation: [`path/to/transformer.ts:456`]
  ↓
Business Logic: [`path/to/service.ts:789`]
  ↓
Persistence: [Database table/collection]
  ↓
Retrieval: [`path/to/repository.ts:234`]
  ↓
Output Formatting: [`path/to/formatter.ts:567`]
  ↓
Destination: [Where data ends up]
```

#### Dependencies Map

**Direct Dependencies**:
- Module X - `path/to/moduleX.ts` - [Purpose]
- Service Y - `path/to/serviceY.ts` - [Purpose]
- DB Table Z - `schema/table_z.sql` - [Purpose]

**Indirect Dependencies**:
- Kafka Topic: `topic-name` - [Producer: `file:line`, Consumer: `file:line`]
- Background Job: `JobName` - [Scheduler: `file:line`, Worker: `file:line`]
- Cache Layer: Redis key pattern `pattern:*` - [Used in: `file:line`]
- Feature Flag: `flag-name` - [Checked in: `file:line`]

**External Integration Points**:
- API: External Service Name - [Called from: `file:line`]
- Webhook: Event Type - [Handler: `file:line`]
- Third-party: Service Name - [Integration: `file:line`]

#### Issues Identified

1. **Root Cause**: [Primary issue with explanation]
   - Location: `path/to/file.ts:123`
   - Impact: [What breaks or degrades]
   - Evidence: [Git commit, error logs, test failures]

2. **Secondary Issues**: [Related problems discovered]
   - Location: `path/to/file.ts:456`
   - Impact: [Potential side effects]

3. **Technical Debt**: [Existing problems that complicate solution]
   - Location: `path/to/file.ts:789`
   - Risk: [How it affects implementation]

---

### 💡 3. SOLUTION PROPOSALS

Present at least **2-3 solution options** with comprehensive analysis:

---

#### ✅ Option 1: [Solution Name]
*[Add ⭐ RECOMMENDED if this is the best option]*

**Approach**:
[2-3 sentence high-level strategy]

**Changes Required**:
1. **`path/to/file1.ts:123`** - [Specific modification needed]
   - Current: [What code does now]
   - New: [What code will do]
   - Reasoning: [Why this change]

2. **`path/to/file2.ts:456`** - [Specific modification needed]
   - Current: [What code does now]
   - New: [What code will do]
   - Reasoning: [Why this change]

*(List all affected files)*

**Pros**:
- ✅ [Advantage 1 with specific benefit]
- ✅ [Advantage 2 with specific benefit]
- ✅ [Advantage 3 with specific benefit]

**Cons**:
- ⚠️ [Trade-off 1 with impact assessment]
- ⚠️ [Trade-off 2 with impact assessment]

**Effort Estimate**: [Small/Medium/Large]
- Development: [Time estimate or story points]
- Testing: [Testing effort]
- Deployment: [Rollout complexity]

**Risk Level**: [Low/Medium/High]
- Technical risk: [What could go wrong]
- Business risk: [Impact if it fails]
- Mitigation: [How to reduce risk]

---

#### Option 2: [Alternative Solution Name]

*[Same structure as Option 1]*

---

#### Option 3: [Another Alternative]

*[Same structure as Option 1 - only if there's a genuinely different approach]*

---

### 🛠️ 4. IMPLEMENTATION GUIDANCE

#### Recommended Approach

**Selected Option**: Option [1/2/3] - [Solution Name]

**Rationale**:
[2-3 sentences explaining why this option is best, considering effort, risk, impact, and alignment with system architecture]

#### Step-by-Step Implementation Plan

**Phase 1: Preparation**
1. [Preparation step 1 - e.g., create feature flag]
2. [Preparation step 2 - e.g., update database schema]
3. [Preparation step 3 - e.g., notify stakeholders]

**Phase 2: Core Implementation**
1. **[Component A]** - `path/to/fileA.ts`
   - Task: [What to implement]
   - Dependencies: [What must be done first]
   - Validation: [How to verify]

2. **[Component B]** - `path/to/fileB.ts`
   - Task: [What to implement]
   - Dependencies: [What must be done first]
   - Validation: [How to verify]

*(Continue for all implementation steps)*

**Phase 3: Integration & Testing**
1. [Integration step 1]
2. [Integration step 2]
3. [Integration step 3]

**Phase 4: Deployment**
1. [Deployment step 1]
2. [Deployment step 2]
3. [Deployment step 3]

#### Testing Requirements

**Unit Tests**:
- Test file: `path/to/fileA.spec.ts`
  - Scenario 1: [What to test]
  - Scenario 2: [What to test]

- Test file: `path/to/fileB.spec.ts`
  - Scenario 1: [What to test]
  - Scenario 2: [What to test]

**Integration Tests**:
- Test: [Integration scenario 1]
  - Setup: [Prerequisites]
  - Execute: [What to run]
  - Assert: [Expected outcome]

- Test: [Integration scenario 2]
  - Setup: [Prerequisites]
  - Execute: [What to run]
  - Assert: [Expected outcome]

**Manual Testing Checklist**:
- [ ] [User flow 1 to verify]
- [ ] [User flow 2 to verify]
- [ ] [Edge case 1 to test]
- [ ] [Edge case 2 to test]
- [ ] [Performance/load testing if applicable]

**E2E Tests** (if applicable):
- Scenario: [End-to-end user journey]
- Steps: [Detailed test steps]
- Expected: [Final outcome]

#### Rollout Strategy

**Feature Flag** (if needed):
- Flag name: `feature-xyz-enabled`
- Location: `path/to/feature-flags.ts`
- Strategy: [Gradual rollout / Canary / A/B test]

**Staged Rollout Plan**:
1. **Stage 1**: Internal testing (0% production traffic)
   - Duration: [Time period]
   - Success criteria: [Metrics to watch]

2. **Stage 2**: Limited rollout (5-10% users)
   - Duration: [Time period]
   - Success criteria: [Metrics to watch]
   - Rollback plan: [How to revert]

3. **Stage 3**: Expanded rollout (50% users)
   - Duration: [Time period]
   - Success criteria: [Metrics to watch]

4. **Stage 4**: Full rollout (100% users)
   - Success criteria: [Final validation]

**Monitoring & Alerts**:
- Metric 1: [What to monitor] - [Alert threshold]
- Metric 2: [What to monitor] - [Alert threshold]
- Metric 3: [What to monitor] - [Alert threshold]
- Dashboard: [Link or description]

**Rollback Plan**:
- Trigger conditions: [When to rollback]
- Rollback steps: [How to revert]
- Data cleanup: [Any necessary cleanup]

---

### 📚 5. RESOURCES & REFERENCES

#### Code Locations

**Entry Points**:
- Main: `path/to/main-entry.ts:123`
- API: `path/to/api-controller.ts:456`
- UI: `path/to/ui-component.tsx:789`

**Core Logic**:
- Service: `path/to/core-service.ts:234`
- Repository: `path/to/data-repository.ts:567`
- Utils: `path/to/utility-functions.ts:890`

**Tests**:
- Unit: `path/to/unit.spec.ts`
- Integration: `path/to/integration.spec.ts`
- E2E: `path/to/e2e.spec.ts`

**Configuration**:
- Feature Flags: `path/to/feature-flags.ts`
- Environment: `path/to/config.ts`
- Database: `path/to/schema.sql`

#### Related Issues

**Jira**:
- Blocker: [PROJ-123] - [Brief description]
- Related: [PROJ-456] - [Brief description]
- Duplicate: [PROJ-789] - [Brief description]

**Previous Work**:
- PR #123 - [Brief description] - [Link]
- Commit abc1234 - [Brief description]
- Issue #456 - [Brief description]

#### Documentation

**Internal Docs**:
- [Architecture overview] - [Link or path]
- [API documentation] - [Link or path]
- [Runbook] - [Link or path]

**External References**:
- [Library documentation] - [Link]
- [Third-party API docs] - [Link]
- [Relevant blog posts/articles] - [Link]

#### Stakeholders

**Ownership**:
- Team: [Team name]
- Tech Lead: [Name]
- Product Owner: [Name]

**Review Required**:
- Code review: [Reviewer name/role]
- Architecture review: [If needed, who]
- Security review: [If needed, who]

**Dependencies on Other Teams**:
- [Team name] - [What they need to provide/approve]
- [Team name] - [What they need to provide/approve]

---

## ✅ QUALITY GATES CHECKLIST

Before presenting the analysis, verify ALL of these are complete:

- [ ] All affected files identified with specific `file:line` references
- [ ] User flow is complete, traceable, and includes all touchpoints
- [ ] Data flow shows full transformation pipeline from source to destination
- [ ] All dependencies documented (direct, indirect, and integration points)
- [ ] At least 2 distinct solution options provided
- [ ] Each solution has comprehensive pros/cons analysis
- [ ] Effort estimates and risk levels assessed for each solution
- [ ] Clear recommendation provided with rationale
- [ ] Step-by-step implementation plan is actionable
- [ ] Testing requirements cover unit, integration, and E2E scenarios
- [ ] Rollout strategy includes monitoring and rollback plans
- [ ] All code locations reference real files (not hypothetical)
- [ ] Historical context and patterns documented
- [ ] Stakeholders and ownership identified

---

## 💬 INTERACTION GUIDELINES

**Communication Style**:
- Be thorough but concise - deep analysis with clear presentation
- Use visual formatting (diagrams, flow charts, bullet points)
- Highlight critical information with emojis for quick scanning
- Always use `file:line` references for easy navigation

**Handling Uncertainty**:
- If analysis is incomplete, clearly state what's missing
- If assumptions were made, document them explicitly
- If multiple interpretations exist, present all options

**Proactive Next Steps**:
After presenting the analysis, ask:
- "Would you like me to create a Jira task for this work?"
- "Should I start implementing the recommended solution?"
- "Do you need me to explore any specific aspect in more detail?"
- "Would you like me to compare the solution options more thoroughly?"

**Acknowledge Complexity**:
- If the problem is more complex than initially assessed, say so
- If additional research is needed, specify what and why
- If external expertise is required, identify who to consult

---

## 🚀 BEGIN ANALYSIS

Start with Phase 1: Input Processing & Clarification.
