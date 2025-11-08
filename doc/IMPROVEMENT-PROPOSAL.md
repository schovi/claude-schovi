# Tooling Process Improvements Proposal

**Based on**: User feedback analysis
**Date**: 2025-11-08
**Status**: Draft for Review

## Executive Summary

This proposal addresses five critical process-level weaknesses identified in user feedback:
1. Stage bleeding (brainstorm/research doing planning/implementation work too early)
2. Assumption hygiene (weak tracking and validation)
3. Validation rigor (static checks, no behavioral tests)
4. Signal vs. noise (operational chatter polluting outputs)
5. Quantification discipline (claims without measurement)

**Guiding Principle**: Keep it simple. Add structure and enforcement, not complexity.

---

## Priority 1: Traceability System (High Impact, Medium Effort)

### Problem
Currently, assumptions in brainstorm disappear by the time we reach plan. Risks aren't linked to acceptance criteria. Metrics don't reference what they validate.

### Solution: Systematic ID Scheme

Add consistent IDs across all stages for assumptions, risks, acceptance criteria, metrics, and exit criteria.

**ID Scheme**:
- `A-1, A-2, ...` = Assumptions (from brainstorm)
- `U-1, U-2, ...` = Unknowns (from brainstorm)
- `R-1, R-2, ...` = Risks (from research)
- `M-1, M-2, ...` = Metrics (from research)
- `AC-1, AC-2, ...` = Acceptance Criteria (from plan)
- `EC-1, EC-2, ...` = Exit Criteria per phase (from plan)

**Cross-Stage Linking**:
- Research validates assumptions: `A-1 (from brainstorm)`
- Risks reference assumptions: `R-1 validates A-3, A-5`
- Metrics validate assumptions and monitor risks: `M-1 (validates: A-2, monitors: R-1)`
- ACs reference assumptions and risks: `AC-1 (validates: A-1, mitigates: R-2)`
- Exit criteria reference ACs: `EC-1 (validates: AC-1, AC-3)`

### Template Changes

#### Brainstorm Template: `schovi/templates/brainstorm/full.md`

**Current** (line 58-68):
```markdown
## 🔍 Assumptions & Unknowns

**Assumptions** *(explicitly labeled)*:
- [Assumption 1 - e.g., Database migration tools are available]
- [Assumption 2 - e.g., Frontend can adapt to API changes within 1 sprint]
- [Assumption 3 - e.g., Current auth middleware is compatible with new approach]

**Unknowns** *(need investigation)*:
- [Unknown 1 - e.g., Exact performance impact of caching strategy]
- [Unknown 2 - e.g., Third-party API rate limits for this use case]
- [Unknown 3 - e.g., Compatibility with legacy client versions]
```

**Proposed**:
```markdown
## 🔍 Assumptions & Unknowns

**Assumptions** *(explicitly labeled, ID for traceability)*:
- **A-1**: [Assumption statement - e.g., Database migration tools are available]
- **A-2**: [Assumption statement - e.g., Frontend can adapt to API changes within 1 sprint]
- **A-3**: [Assumption statement - e.g., Current auth middleware is compatible with new approach]

**Unknowns** *(need investigation in research phase)*:
- **U-1**: [Unknown question - e.g., Exact performance impact of caching strategy]
- **U-2**: [Unknown question - e.g., Third-party API rate limits for this use case]
- **U-3**: [Unknown question - e.g., Compatibility with legacy client versions]

**For Research**: These IDs will be referenced in the assumption validation matrix and risk analysis.
```

#### Research Template: `schovi/templates/research/full.md`

**Current** (assumption validation matrix):
```markdown
| Assumption | How We Tested | Result | Evidence |
|------------|---------------|--------|----------|
| [Statement] | [Method] | ✅/❌/⏳ | file:line |
```

**Proposed**:
```markdown
| ID | Assumption (from brainstorm) | How We Tested | Result | Evidence |
|----|------------------------------|---------------|--------|----------|
| A-1 | [Statement from brainstorm] | [Method - e.g., Code review, spike test, docs check] | ✅/❌/⏳ | file:line |
| A-2 | [Statement from brainstorm] | [Method] | ✅/❌/⏳ | file:line |
```

**Add Risks Section** (currently minimal):
```markdown
## 🚨 Risks & Mitigation

### Technical Risks
- **R-1** (High Impact, Medium Probability): [Risk description]
  - **Validates**: A-3, A-5 (which assumptions this risk relates to)
  - **Mitigation**: [Specific approach]
  - **Contingency**: [Fallback plan if mitigation fails]

### Business/Operational Risks
- **R-2** (Medium Impact, Low Probability): [Risk description]
  - **Validates**: A-7
  - **Mitigation**: [Specific approach]
  - **Contingency**: [Fallback plan]
```

**Update Metrics Section** (currently "What We Will Measure Later"):
```markdown
## 📊 What We Will Measure Later

**Performance Metrics**:
- **M-1**: [Metric name] (validates: A-2, monitors: R-1)
  - **Target**: [Specific value - e.g., p95 < 200ms]
  - **Baseline**: [How to establish - e.g., APM query, load test]
  - **Owner**: [Team/Person responsible]
  - **When**: [Timeline - e.g., Week 1 post-deploy, continuous monitoring]

**Safety Metrics**:
- **M-2**: [Metric name] (validates: A-4, monitors: R-3)
  - **Target**: [Specific value]
  - **Baseline**: [How to establish]
  - **Owner**: [Team/Person]
  - **When**: [Timeline]

**Rollback Metrics**:
- **M-3**: Rollback time (monitors: R-2)
  - **Target**: < 5 minutes to previous version
  - **Baseline**: Test rollback procedure in staging
  - **Owner**: DevOps team
  - **When**: Pre-deployment verification
```

#### Plan Template: `schovi/templates/spec/full.md`

**Update Acceptance Criteria** (currently has risk linking):
```markdown
## ✅ Acceptance Criteria

Core requirements that must be met:

- **AC-1**: [Criterion] *(validates: A-1, mitigates: R-2)*
- **AC-2**: [Criterion] *(validates: A-4, mitigates: R-1, R-3)*
- **AC-3**: [Criterion] *(validates: A-6, mitigates: R-4)*

[Continue for all criteria...]
```

**Add Exit Criteria per Phase** (currently missing):
```markdown
## 🚪 Exit Criteria by Phase

### Phase 1: [Phase Name]
- **EC-1**: [Binary testable criterion] *(validates: AC-1)* - YES/NO
- **EC-2**: [Binary testable criterion] *(validates: AC-2, AC-3)* - YES/NO

**Verification Method**: [How to verify - e.g., integration test suite passes, manual checklist, deployment succeeds]

### Phase 2: [Phase Name]
- **EC-3**: [Binary testable criterion] *(validates: AC-4)* - YES/NO
- **EC-4**: [Binary testable criterion] *(validates: AC-5, AC-6)* - YES/NO

**Verification Method**: [How to verify]
```

**Update Rollback Plan**:
```markdown
## 🔄 Rollback Plan

**Rollback Triggers** (monitoring M-3, M-1, M-2):
1. If M-1 target missed by >20% for >30 minutes → Auto-rollback
2. If error rate > 1% for >5 minutes → Manual review, rollback if confirmed
3. If M-2 fails validation → Immediate rollback

**Rollback Procedure**:
1. [Step 1 - e.g., Revert feature flag to 0%]
2. [Step 2 - e.g., Deploy previous container tag]
3. [Step 3 - e.g., Verify M-3 < 5 minutes]

**Verification**: Must meet EC-X (rollback completion) within M-3 timeframe
```

### Benefits
- ✅ **Audit trail**: Trace any AC back to original assumption
- ✅ **Validation chains**: See which metrics validate which assumptions
- ✅ **Risk management**: Clear linkage between risks and mitigations
- ✅ **Accountability**: Owners assigned to each metric
- ✅ **Decision support**: "Why did we choose this?" → "To validate A-3"

### Implementation Effort
- **Template updates**: 3 files, ~30 lines of changes
- **Command updates**: Update quality gates to check for IDs
- **Documentation**: Update examples in command docs
- **Estimated time**: 2-3 hours

---

## Priority 2: Active Stage Bleeding Prevention (High Impact, Low Effort)

### Problem
Brainstorm quality gates are passive checklists. Executors don't actively reject outputs that contain implementation details.

### Solution: Rejection Rules

Transform validation checklists into **rejection rules** with concrete examples.

#### Brainstorm Template: `schovi/templates/brainstorm/full.md`

**Current** (line 321):
```markdown
- [ ] Each option stays at CONCEPTUAL level (no file paths, scripts, or specific time estimates)
```

**Proposed** (add new section before Validation Checklist):
```markdown
## 🚫 REJECTION RULES - Active Stage Bleeding Prevention

**Before generating output, verify it does NOT contain ANY of the following. If found, REJECT and regenerate:**

### ❌ Implementation Details (belongs in plan/implement)
- Specific file paths: `src/auth/middleware.ts`, `file:line` format
- Code snippets or function signatures
- Specific API endpoints: `/api/users`, `GET /items`
- Database schema changes: `ALTER TABLE`, column names
- npm package versions: `react@18.2.0`

### ❌ Numeric Time Estimates (use S/M/L sizing only)
- Hours/days/weeks: "5 days", "2 weeks", "40 hours"
- Sprint counts: "2-3 sprints", "half a sprint"
- Percentage estimates: "80% complete by..."
- Calendar dates: "ready by Nov 15"

### ❌ Detailed Implementation Steps (belongs in plan)
- Step-by-step procedures
- Deployment instructions
- Configuration file changes
- Test case details

### ✅ What IS Allowed (conceptual level)
- Component names: "authentication layer", "API gateway"
- Technology choices: "Redis cache", "PostgreSQL"
- Architecture patterns: "event-driven", "microservices"
- Relative sizing: S/M/L effort, Low/Med/High risk
- General areas: "frontend", "backend", "infrastructure"

**Enforcement**: If executor output violates ANY rejection rule, regenerate with stricter abstraction level.
```

**Update Validation Checklist**:
```markdown
### Validation Checklist

Before returning output, verify:

- [ ] Output passes ALL rejection rules (no file paths, no time estimates, no implementation details)
- [ ] Problem summary is clear and complete (2-4 paragraphs)
- [ ] Constraints are specific, not generic
- [ ] Assumptions section has A-1, A-2, ... IDs for traceability
- [ ] Unknowns section has U-1, U-2, ... IDs for research phase
- [ ] 3-5 distinct options provided (not variations)
- [ ] Each option stays at CONCEPTUAL level (component names, not file paths)
- [ ] Each option has overview + key areas + benefits + challenges
- [ ] Sizing uses S/M/L for effort, Low/Med/High for risk/complexity (NO numeric estimates)
- [ ] Comparison matrix completed with consistent S/M/L sizing
- [ ] Questions for Research section present (critical + nice-to-know)
- [ ] One option recommended with clear reasoning
- [ ] Exploration notes document conceptual areas examined (not specific file paths)
- [ ] Output adheres to markdown structure exactly

**If any checklist item fails, STOP and fix before returning.**
```

#### Research Template: Similar Rejection Rules

Add rejection rules for research to prevent it from doing planning:

```markdown
## 🚫 REJECTION RULES - Research Scope

**Research focuses on UNDERSTANDING, not PLANNING. Reject if output contains:**

### ❌ Planning Details (belongs in plan command)
- Implementation phases: "Phase 1: Do X, Phase 2: Do Y"
- Task breakdowns: "Task 1.1, Task 1.2"
- Acceptance criteria: "AC-1: Must support..."
- Deployment procedures
- Rollout percentages: "Deploy to 10%, then 50%"

### ✅ What IS Allowed (technical analysis)
- File:line references for evidence
- Architecture diagrams and component interactions
- Code quality assessment with examples
- Performance analysis with measurements
- Risk identification with impact/probability
- Assumption validation with test results
- Dependency mapping with file paths
- Security/scalability considerations

**Enforcement**: If output crosses into planning, STOP and remove planning content.
```

### Benefits
- ✅ **Clear boundaries**: Each stage knows what NOT to do
- ✅ **Concrete examples**: "file:line format" is more specific than "implementation details"
- ✅ **Active enforcement**: REJECT and regenerate, not just verify
- ✅ **User education**: Examples help users understand stage purposes

### Implementation Effort
- **Template updates**: 2 files, ~50 lines of additions
- **No command changes**: Templates are read by executors
- **Estimated time**: 1 hour

---

## Priority 3: Evidence Bundle Structure (Medium Impact, Medium Effort)

### Problem
Research makes claims ("performance is adequate", "compatible with legacy") without capturing evidence. Implement stage doesn't record what was tested.

### Solution: Evidence Bundle

Add structured evidence capture to research and implement stages.

#### Research Template: Evidence Sections

**Enhance Assumption Validation Matrix**:
```markdown
| ID | Assumption | How We Tested | Result | Evidence | Evidence Type |
|----|------------|---------------|--------|----------|---------------|
| A-1 | [Statement] | Code review | ✅ Pass | auth.ts:45-67 | Source code |
| A-2 | [Statement] | Load test | ⏳ Pending | load-test-results.json | Test output |
| A-3 | [Statement] | Docs review | ❌ Fail | https://docs.example.com | Documentation |
```

**Add Evidence Types**:
- **Source code**: file:line references
- **Test output**: Command output, test results, screenshots
- **Documentation**: URLs, internal docs, API specs
- **Measurements**: Timing data, memory usage, query counts
- **Expert consultation**: Name, date, summary

**Create Evidence Bundle File** (implement stage):

During implementation, create `.WIP/[identifier]/evidence-bundle.json`:

```json
{
  "identifier": "EC-1234",
  "workflow": "brainstorm → research → plan → implement",
  "timestamp": "2025-11-08T10:30:00Z",
  "stages": {
    "brainstorm": {
      "file": "brainstorm-EC-1234.md",
      "assumptions": ["A-1", "A-2", "A-3"],
      "unknowns": ["U-1", "U-2"],
      "options": [
        {"id": "Option-1", "name": "Incremental Refactor", "recommended": false},
        {"id": "Option-2", "name": "Event-Driven", "recommended": true}
      ]
    },
    "research": {
      "file": "research-EC-1234-option2.md",
      "assumptions_validated": [
        {"id": "A-1", "result": "pass", "evidence": "auth.ts:45"},
        {"id": "A-2", "result": "pending", "evidence": "load-test-needed"},
        {"id": "A-3", "result": "fail", "evidence": "docs/api.md"}
      ],
      "risks": ["R-1", "R-2", "R-3"],
      "metrics": ["M-1", "M-2", "M-3"]
    },
    "plan": {
      "file": "spec-EC-1234.md",
      "acceptance_criteria": ["AC-1", "AC-2", "AC-3", "AC-4"],
      "exit_criteria": {
        "Phase-1": ["EC-1", "EC-2"],
        "Phase-2": ["EC-3", "EC-4"]
      }
    },
    "implement": {
      "phases": [
        {
          "name": "Phase-1",
          "commits": ["abc123", "def456"],
          "exit_criteria": [
            {"id": "EC-1", "met": true, "evidence": "test-output.log"},
            {"id": "EC-2", "met": true, "evidence": "integration-test passed"}
          ],
          "timestamp": "2025-11-08T12:00:00Z"
        }
      ],
      "metrics_baseline": [
        {"id": "M-1", "baseline": "180ms", "command": "curl /api/perf", "timestamp": "2025-11-08T11:00:00Z"},
        {"id": "M-2", "baseline": "0.01% error rate", "command": "datadog query", "timestamp": "2025-11-08T11:05:00Z"}
      ],
      "acceptance_criteria": [
        {"id": "AC-1", "met": true, "evidence": "PR review approved"},
        {"id": "AC-2", "met": true, "evidence": "All tests pass"},
        {"id": "AC-3", "met": false, "reason": "Performance target missed, needs optimization"}
      ]
    }
  }
}
```

**Benefits**:
- ✅ **Traceability**: Every claim has evidence
- ✅ **Audit trail**: Complete workflow history in one file
- ✅ **Accountability**: Track which ACs were met, which weren't
- ✅ **Learning**: Future tasks can reference evidence bundles

### Implementation Effort
- **Research template**: Add Evidence Type column (~5 lines)
- **Implement command**: Generate evidence bundle (~50 lines)
- **Library**: Create evidence-bundle.md library (~100 lines)
- **Estimated time**: 3-4 hours

---

## Priority 4: Noise Filtering (Low Impact, Medium Effort)

### Problem
Operational chatter (git commands, retries, confetti, subagent spawn messages) pollutes saved artifacts.

### Solution: Separate Artifact from Log

**Two-file output**:
1. **Artifact** (clean, human-readable, what you need)
2. **Log** (detailed, operational, how we got there)

#### Example: Research Command

**Current**: Single file `research-EC-1234.md` with everything mixed

**Proposed**: Two files

**1. `research-EC-1234.md` (Artifact - CLEAN)**
```markdown
# 🔬 Research: [Topic]

## Problem Summary
[Clean content only]

## Assumption Validation Matrix
[Results only, no "spawning jira-analyzer" messages]

## Architecture Analysis
[Findings only, no "running grep" messages]

...
```

**2. `.WIP/EC-1234/logs/research-EC-1234.log` (Detailed Log)**
```
[2025-11-08 10:30:15] Starting research command
[2025-11-08 10:30:16] Parsing arguments: --input brainstorm-EC-1234.md --option 2
[2025-11-08 10:30:17] Spawning research-executor subagent
[2025-11-08 10:30:18] Executor: Fetching Jira issue EC-1234
[2025-11-08 10:30:19] Executor: Spawning jira-analyzer subagent
[2025-11-08 10:30:25] Executor: Jira context received (823 tokens)
[2025-11-08 10:30:26] Executor: Starting deep exploration
[2025-11-08 10:30:27] Executor: Spawning Plan subagent (thorough mode)
[2025-11-08 10:32:14] Executor: Exploration complete (examined 47 files)
[2025-11-08 10:32:15] Executor: Reading research template
[2025-11-08 10:32:16] Executor: Generating structured output
[2025-11-08 10:32:45] Executor: Output generated (5,234 tokens)
[2025-11-08 10:32:46] Research complete, saving to work folder
[2025-11-08 10:32:47] File written: .WIP/EC-1234/research-EC-1234-option2.md
[2025-11-08 10:32:48] Metadata updated
[2025-11-08 10:32:49] Terminal output displayed
[2025-11-08 10:32:50] Command complete
```

**Implementation**:
- Commands write to both artifact and log
- Artifact: Clean markdown, no operational details
- Log: Timestamped entries with all details
- User sees artifact by default, log available for debugging

### Benefits
- ✅ **Clean outputs**: Artifacts are presentation-ready
- ✅ **Debugging**: Detailed logs for troubleshooting
- ✅ **Transparency**: Full operational history preserved
- ✅ **User choice**: Show artifact, hide noise

### Implementation Effort
- **Library**: Create log-writer.md library (~80 lines)
- **Commands**: Update all commands to use dual output (~20 lines each, 8 commands = 160 lines)
- **Estimated time**: 4-5 hours

---

## Priority 5: Binary Exit Criteria (Low Impact, Low Effort)

### Problem
Plan template has exit criteria guidance, but they're not strictly binary (YES/NO testable).

### Solution: Enforce Binary Format

#### Plan Template: Exit Criteria Section

**Current** (loosely defined):
```markdown
Exit criteria mentioned in deployment plan
```

**Proposed** (strict binary format):
```markdown
## 🚪 Exit Criteria by Phase

**Format Requirements**:
- Each criterion must be YES/NO testable
- Must specify verification method
- Must reference which AC it validates

### Phase 1: [Phase Name]

**Exit Criteria**:
- **EC-1**: All unit tests pass (validates: AC-1)
  - **Verification**: `npm test` exits with code 0
  - **Pass/Fail**: YES/NO

- **EC-2**: Integration tests pass (validates: AC-2, AC-3)
  - **Verification**: `npm run test:integration` passes
  - **Pass/Fail**: YES/NO

- **EC-3**: Code review approved (validates: AC-4)
  - **Verification**: GitHub PR has "Approved" status
  - **Pass/Fail**: YES/NO

**Phase Gate**: ALL exit criteria must be YES to proceed to Phase 2.

### Phase 2: [Phase Name]

[Same format...]

**Final Gate**: ALL exit criteria from ALL phases must be YES before deployment.
```

**Validation Rule**:
```markdown
## Exit Criteria Validation

Before finalizing spec, check each exit criterion:
- [ ] Phrased as binary question (can answer YES or NO)
- [ ] Has specific verification method (command, manual check, etc.)
- [ ] References which AC it validates
- [ ] No ambiguous terms ("mostly done", "should work", "appears to")

**Examples**:
- ❌ "Feature is mostly complete" (not binary)
- ❌ "Performance looks good" (not testable)
- ✅ "API response time p95 < 200ms" (binary, testable)
- ✅ "All 12 acceptance tests pass" (binary, testable)
```

### Benefits
- ✅ **Clarity**: No ambiguity about phase completion
- ✅ **Accountability**: Can't fudge "mostly done"
- ✅ **Automation**: Binary criteria can be scripted
- ✅ **Quality gates**: Forces rigorous phase gates

### Implementation Effort
- **Template update**: spec/full.md, ~40 lines
- **Examples**: Add 5-6 examples of good/bad criteria
- **Estimated time**: 1 hour

---

## Summary: Prioritized Roadmap

| Priority | Improvement | Impact | Effort | Time | Dependencies |
|----------|-------------|--------|--------|------|--------------|
| **P1** | Traceability System | **High** | Medium | 2-3h | None |
| **P2** | Stage Bleeding Prevention | **High** | Low | 1h | None |
| **P5** | Binary Exit Criteria | **Low** | Low | 1h | P1 (for AC refs) |
| **P3** | Evidence Bundle | **Medium** | Medium | 3-4h | P1 (for IDs) |
| **P4** | Noise Filtering | **Low** | Medium | 4-5h | None |

**Recommended Implementation Order**:
1. P1 (Traceability) - Foundational, unblocks P3 and P5
2. P2 (Stage Bleeding) - Quick win, high impact
3. P5 (Binary Exit Criteria) - Quick win, builds on P1
4. P3 (Evidence Bundle) - Depends on P1, medium effort
5. P4 (Noise Filtering) - Independent, lower priority

**Total Estimated Time**: 11-14 hours

**Phased Rollout**:
- **Phase 1** (3-4h): P1 + P2 (traceability + stage bleeding) - Core process improvements
- **Phase 2** (1h): P5 (binary exit criteria) - Quality gates
- **Phase 3** (3-4h): P3 (evidence bundle) - Validation rigor
- **Phase 4** (4-5h): P4 (noise filtering) - User experience polish

---

## Validation: Does This Address Feedback?

| Feedback Issue | Our Solution | Status |
|----------------|--------------|--------|
| Stage bleeding | Rejection rules with concrete examples | ✅ Addressed |
| Assumption hygiene | ID-based tracking (A-1, A-2) + validation matrix | ✅ Addressed |
| Validation rigor | Evidence bundle + binary exit criteria | ✅ Addressed |
| Signal vs. noise | Artifact/log separation | ✅ Addressed |
| Quantification discipline | Metric baseline (owner, when, target) + measurement plan | ✅ Addressed |

| Good Output Expectation | Our Solution | Status |
|--------------------------|--------------|--------|
| Brainstorm (1-2 pages) | Rejection rules enforce conceptual level | ✅ Addressed |
| Research assumption validation | ID-based matrix with evidence type | ✅ Addressed |
| Plan exit criteria | Binary format with verification method | ✅ Addressed |
| Implement verification | Evidence bundle with AC status | ✅ Addressed |

| Governance Suggestion | Our Solution | Status |
|-----------------------|--------------|--------|
| Stage linter/checker | Rejection rules + validation checklists | ✅ Addressed (manual) |
| Risk/AC linking | Systematic IDs (R-1, AC-1) | ✅ Addressed |
| Evidence bundle | JSON evidence bundle with traceability | ✅ Addressed |
| Noise filter | Artifact/log separation | ✅ Addressed |
| Metric hooks | Metrics with owner/when/baseline | ✅ Addressed |

**Coverage**: 100% of feedback addressed

---

## Next Steps

1. **Review this proposal**: Does it align with your vision? Any concerns about complexity?

2. **Choose rollout phase**: Start with Phase 1 (P1 + P2) for quick wins?

3. **Pilot on one workflow**: Test traceability + rejection rules on brainstorm → research → plan

4. **Iterate based on feedback**: Adjust before rolling out to all commands

5. **Document patterns**: Create examples showing good/bad usage

**Question for you**: Should we proceed with Phase 1 (P1 + P2: Traceability + Stage Bleeding Prevention), or do you want to adjust priorities?
