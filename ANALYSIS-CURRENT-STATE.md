# Current Implementation Analysis: Brainstorm → Research → Plan

## 1. STAGE BLEEDING PREVENTION

### Current State: PARTIAL (Brainstorm has safeguards, but not comprehensive)

#### What Exists ✅

**Brainstorm Template Validation Checklist** (`brainstorm/full.md` lines 313-329):
```markdown
- [ ] Each option stays at CONCEPTUAL level (no file paths, scripts, or specific time estimates)
- [ ] Sizing uses S/M/L for effort, Low/Med/High for risk/complexity (NO numeric estimates)
- [ ] Exploration notes document conceptual areas examined (not specific file paths)
```

**Clear guidance language**:
- "NOT included: Implementation details (file paths, scripts, specific time estimates)" (line 14)
- "Key Areas of Change" uses comment "(conceptual, not file paths)" (lines 78, 104, 130, etc.)
- "Comparison Matrix" explicitly says "(NOT numeric estimates)" (line 304)

**Token budget enforcement** (line 331-349):
- Explicit max 4500 tokens
- If over budget: "Trim exploration notes first, reduce number of options to 3"

#### What's Missing ❌

1. **No active rejection mechanism in quality gates**
   - Checklist is passive ("verify X is NOT present") 
   - Not "REJECT output if X is found"
   - No instruction to fail-stop if implementation details detected

2. **No concrete examples of what NOT to include**
   - ✅ Brainstorm says "e.g., Authentication layer" (good - conceptual)
   - ❌ But no counter-example: "e.g., DON'T say: Update `src/auth/middleware.ts:45-67`"

3. **No penalty/escalation if stage bleeds**
   - Quality gates say "verify" but don't say "reject if"
   - No: "If file paths detected, STOP and regenerate without implementation details"

4. **Sizing vocabulary not fully isolated**
   - Research template allows "Estimated Effort: [e.g., 5-7 days, 2-3 sprints]" (line 192)
   - This is MORE specific than brainstorm's S/M/L
   - Inconsistent guidance across stages

---

## 2. ASSUMPTION TRACKING

### Current State: EMERGING (Research has framework, but no linking between stages)

#### What Exists ✅

**Research Template: "Assumption Validation Matrix"** (lines 368-380):

```markdown
| Assumption | How Tested | Result | Evidence |
|------------|------------|--------|----------|
| Database supports transactions | Code review of DB adapter | ✅ Pass | `db.ts:45` - TransactionManager class |
| Frontend handles async responses | API client inspection | ✅ Pass | `api.ts:123` - Promise-based architecture |
| External API supports webhooks | Documentation review needed | ⏳ Pending | Needs vendor docs verification |
```

**Guidance for research agents** (lines 376-381):
- "List all critical assumptions made during research"
- Four columns: Assumption, How Tested, Result (✅/❌/⏳), Evidence

**Quality gates** (line 477 in research command):
```markdown
- [ ] **Assumption Validation Matrix** includes 3-8 critical assumptions
```

#### What's Missing ❌

1. **No explicit assumption capture in BRAINSTORM**
   - Brainstorm has "Assumptions & Unknowns" section (lines 58-69)
   - But it's just a list: "- [Assumption 1]"
   - No structured format or tracking mechanism
   - Example: "- [Assumption 2 - e.g., Frontend can adapt to API changes within 1 sprint]"
   - This is just text, not trackable

2. **No ID-based linking between stages**
   - Brainstorm assumptions: unnamed
   - Research assumptions: unnamed
   - Spec acceptance criteria: unnamed (just bullets)
   - No A-1, A-2, AC-1, AC-2 style IDs
   - No "Assumption A-1 (from brainstorm) validated in research via AC-3" linking

3. **No assumption propagation mechanism**
   - Research doesn't reference brainstorm assumptions
   - Spec doesn't reference research assumptions
   - No checklist like: "Research validates these brainstorm assumptions: [list]"

4. **Plan/Spec has no assumption link**
   - Spec template has "Acceptance Criteria" (spec/full.md lines 97-106)
   - Has risk links: "*(mitigates: [Risk name])*" (line 101)
   - But NO assumption validation links
   - Should show: "*(validates: Assumption A-3)*"

5. **"What We Will Measure Later" lacks assumption binding**
   - Lists metrics: "Performance Metrics", "Safety Metrics", "Rollback Metrics"
   - But doesn't say: "Metric P-1 validates Assumption A-2"
   - No traceability from "what we measure" back to "what we assumed"

---

## 3. VALIDATION RIGOR

### Current State: MODERATE (Framework exists, but gaps in rigor and specificity)

#### What Exists ✅

**Research: "What We Will Measure Later"** (lines 300-329):

Three categories:
```markdown
### Performance Metrics (measure during/after implementation)
- [Metric 1 - e.g., API response time (p50, p95, p99)]
- [Metric 2 - e.g., Database query duration]

### Safety Metrics (monitor during rollout)
- [Metric 1 - e.g., Feature flag adoption rate]
- [Metric 2 - e.g., User error reports (comparison to baseline)]

### Rollback Metrics (validate rollback safety)
- [Metric 1 - e.g., Rollback execution time]
```

**Instructions for specificity** (lines 324-329):
```markdown
- Be specific about WHAT to measure, not just "monitor performance"
- Include quantitative targets where possible (e.g., "p95 < 200ms")
- Identify measurement tools/methods (e.g., "APM dashboard", "custom SQL query")
- Note if baseline needs to be established first
```

**Spec: Exit criteria (phase gates)** (spec/full.md lines 71-73):
```markdown
**Phase Gates** (must complete before Phase 2):
- [ ] [Exit criterion 1 - proves key assumption or viability]
- [ ] [Exit criterion 2 - validates approach works]
```

**Spec: AC ↔ Risk linking** (spec/full.md line 101):
```markdown
- [ ] [Testable criterion 1 - specific and measurable] *(mitigates: [Risk name])*
```

#### What's Missing ❌

1. **"What We Will Measure Later" is incomplete in structure**
   - Has three metric categories, but MISSING:
     - **Who measures**: "DBA team will run SQL query", "DevOps will monitor CloudWatch"
     - **When measured**: "Baseline established 2025-01-15, continuous monitoring starts 2025-02-01"
     - **Success criteria**: "p95 < 200ms" is good, but most examples are vague: "[Metric 1 - e.g., ...]"
     - **Decision gates**: "If p95 > 300ms after 48h, rollback automatically"

2. **Exit criteria (phase gates) lack binary/testable definition**
   - Example: "[Exit criterion 1 - proves key assumption or viability]"
   - This is template guidance, not testable
   - SHOULD be: "API endpoint returns {id, status, data} with no null fields (verified via POST /api/feature with test data)"
   - Current examples are VAGUE ("validates approach works")

3. **No acceptance criteria → assumption validation link**
   - Spec has: "AC-1: API handles concurrent requests... *(mitigates: Race condition risk)*"
   - Missing: "AC-1: API handles concurrent requests... *(validates: Assumption A-2 that systems support async)*"

4. **"Observations vs Inferences" exists but not leveraged for validation**
   - Research template has section (lines 413-455)
   - Shows examples of good vs bad
   - But NO validation gate that checks: "Every inference has observation support"
   - Could fail validation if all inferences without code support

5. **No validation that research assumptions inform spec acceptance criteria**
   - Research lists 3-8 assumptions
   - Spec lists 3-5 acceptance criteria
   - No mapping: "These spec criteria validate research assumptions [A-1, A-4, A-7]"

---

## 4. OUTPUT STRUCTURE

### Current State: MIXED (Good separation in templates, but no explicit artifact types)

#### What Exists ✅

**Clean template structure**:
- Brainstorm: ~2000-4000 tokens (lightweight, conceptual)
- Research: ~4000-6000 tokens (detailed, file:line refs)
- Spec: ~3000 tokens (actionable tasks)

**Explicit filtering for brainstorm** (brainstorm/full.md lines 249-260):
```markdown
## 📚 Exploration Notes

**Codebase Areas Examined** *(conceptual, not file paths)*:
- [Area 1 - e.g., API layer and controllers]

**Key Patterns Identified**:
- [Pattern 1 - e.g., All controllers use middleware chain pattern]
```

**Research template has methodology section** (lines 353-367):
```markdown
## 🔍 Research Methodology

**Exploration Approach**:
- [How codebase was explored - e.g., Task tool with Plan subagent, thorough mode]
- [Time spent: e.g., ~3-5 minutes]

**Files Examined** (key files):
- `path/to/file1.ts:1-500` - [What was analyzed]
```

#### What's Missing ❌

1. **No explicit "artifact vs log" distinction**
   - Research template says "Files Examined" with file:line ranges
   - But no instruction: "What goes in main output vs what goes in appendix?"
   - All exploration details are in main output
   - Could be: "Research Artifact" (core findings) vs "Research Log" (exploration details)

2. **No filtering guidance for spec output**
   - Spec template says "Technical Overview → Data Flow → Affected Services → Key Changes"
   - But no instruction: "Omit detailed code snippets" or "Include code examples"
   - Templates don't distinguish between "what team needs" vs "what developer needs"

3. **No "noise filtering" rules**
   - Research template says "Files Examined (key files)" but no definition of "key"
   - No guidance like: "Include only files that appear in 2+ data flows" or "Only files that require changes"
   - Could include irrelevant files discovered during exploration

4. **Spec lacks clear "implementation artifact" vs "decision log"**
   - Spec has "Decision & Rationale" (good)
   - But also includes "Alternatives Considered" which is decision log, not implementation artifact
   - No guidance: "Team implementing uses Tasks section, architects review Decision section"

---

## 5. RISK/AC LINKING & TRACEABILITY

### Current State: PARTIAL (Risk→AC exists, but no systematic IDs or full traceability)

#### What Exists ✅

**Risk → AC linking in spec** (spec/full.md lines 137-146):
```markdown
## Risks & Mitigations

- **Risk**: [Description of potential risk]
  - *Mitigation*: [How to reduce or handle this risk]

## Acceptance Criteria

- [ ] [Testable criterion 1] *(mitigates: [Risk name])*
- [ ] [Testable criterion 2] *(mitigates: [Risk name])*
```

**Research: Complexity → Risk linking** (research/full.md lines 234-264):
```markdown
### Risks & Mitigation

1. **[Risk 1 - e.g., Database migration may cause downtime]**
   - Impact: [High/Medium/Low]
   - Probability: [High/Medium/Low]
   - Mitigation: [Specific steps]
   - Contingency: [Fallback plan]
```

#### What's Missing ❌

1. **No systematic ID scheme**
   - No: R-1, R-2, R-3 for risks
   - No: AC-1, AC-2, AC-3 for acceptance criteria
   - No: A-1, A-2, A-3 for assumptions
   - Makes it hard to reference: "AC-3 mitigates R-2"

2. **Brainstorm risks have no formal structure**
   - Brainstorm template has NO "Risks" section at all
   - Only in research and spec
   - But risks arise from options: "Option 1: Incremental has lower risk"
   - Missing: Brainstorm should have risk summary per option

3. **No traceability from brainstorm to research to spec**
   - Brainstorm: "Option 2: Backend service + queue" (high level)
   - Research: "Selected Approach: Option 2 - Backend service with Kafka" (detailed)
   - Spec: "Approach Selected: Option 2"
   - Each stage regenerates this info independently
   - Missing: Cross-reference chain showing "research option 2 came from brainstorm option 2"

4. **Assumption traceability is missing**
   - Research has "Assumption Validation Matrix"
   - Spec has "Acceptance Criteria"
   - But no link: "Spec AC-1 validates Research Assumption A-3"
   - And no link back: "Research A-3 originated from Brainstorm assumption about X"

5. **No risk ID propagation**
   - Research identifies: "Risk 1: Database migration may cause downtime"
   - Spec says: "*(mitigates: [Risk name])*"
   - But risk isn't numbered
   - Should be: "Risk R-2: Database migration may cause downtime"
   - Then spec can say: "*(mitigates: R-2)*"

6. **Performance metrics not linked to assumptions/risks**
   - Research says: "Rollback Metrics - [Metric 1 - e.g., Rollback execution time]"
   - But doesn't say: "This metric validates Assumption A-4 (rollback is fast enough)"
   - Missing: "Metric M-3: Rollback execution time < 5 minutes *(validates: A-4, mitigates: R-1)*"

---

## 6. SPECIFIC EXAMPLES: WHAT EXISTS vs MISSING

### Example 1: Assumption Tracking Across Stages

**Current (Disconnected)**:

Brainstorm:
```markdown
## 🔍 Assumptions & Unknowns

**Assumptions** *(explicitly labeled)*:
- Frontend can adapt to API changes within 1 sprint
```

Research:
```markdown
**Assumption Validation Matrix**:
| Assumption | How Tested | Result | Evidence |
| Frontend can adapt to API changes | Code review | ✅ Pass | api.ts:123 |
```

Spec:
```markdown
- [ ] Frontend integration tested with mock API responses *(mitigates: Integration risk)*
```

**Missing: Explicit linking**
- No ID for assumption: A-1 (Frontend adaptability)
- No reference in research: "A-1 from brainstorm validated via..."
- No reference in spec: "AC-2 validates A-1"

### Example 2: Stage Bleeding Prevention

**Current (Passive checks)**:

Brainstorm quality gates:
```markdown
- [ ] Each option stays at CONCEPTUAL level (no file paths, scripts, or specific time estimates)
- [ ] Sizing uses S/M/L for effort, Low/Med/High for risk/complexity (NO numeric estimates)
```

This is a suggestion, not a rejection.

**Missing: Active enforcement**
```markdown
REQUIREMENT: If output contains ANY of these, REJECT and regenerate:
- Specific file paths (src/auth/middleware.ts, file:line format)
- Time estimates in hours/days/sprints
- Code snippets or implementation examples
- Specific API endpoints (/api/users, GET /items)
- Database operations (INSERT, UPDATE, JOIN)
```

### Example 3: Exit Criteria Specificity

**Current (Vague)**:

Spec phase gates:
```markdown
**Phase Gates** (must complete before Phase 2):
- [ ] [Exit criterion 1 - proves key assumption or viability]
- [ ] [Exit criterion 2 - validates approach works]
```

Spec acceptance criteria:
```markdown
- [ ] [Testable criterion 1 - specific and measurable] *(mitigates: [Risk name])*
```

**Missing: Binary/testable examples**
```markdown
**Phase Gates** (must complete before Phase 2):
- [ ] Proof-of-concept deployed to staging shows response time < 200ms
  - Success: p95 response time measured via APM dashboard
  - Failure: Rollback to alternative approach
```

### Example 4: Artifact vs Log Separation

**Current (Mixed)**:

Research template:
```markdown
## 🔍 Research Methodology

**Exploration Approach**:
- [How codebase was explored]
- [Time spent: e.g., ~3-5 minutes]

**Files Examined** (key files):
- `path/to/file1.ts:1-500` - [What was analyzed]
```

This exploration log is in the main output.

**Missing: Explicit distinction**

Should have separate sections for "Research Artifact" (what you need to implement) vs "Research Log" (how we discovered it).

---

## SUMMARY TABLE

| Dimension | Current State | Examples | What's Missing |
|-----------|---------------|----------|-----------------|
| **Stage Bleeding** | Partial | "NO file paths" guideline in brainstorm | Active rejection; concrete counter-examples; fail-stop gates |
| **Assumptions** | Emerging | Assumption Validation Matrix in research | IDs (A-1, A-2); linking between stages; in brainstorm |
| **Validation Rigor** | Moderate | "What We Will Measure Later" section | Who/when/success criteria; decision gates; assumption binding |
| **Artifact Structure** | Mixed | Separate token budgets per stage | Explicit "artifact vs log" sections; noise filtering rules |
| **Traceability** | Partial | Risk → AC linking in spec | Systematic IDs (R-1, AC-1, A-1); multi-stage chains |

