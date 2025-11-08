# Research Output Template

This template defines the structure for research command output. The research-generator subagent reads this template to generate consistent, well-structured deep technical analysis of a single specific approach.

## Purpose

Research provides **deep technical analysis** of ONE specific approach with:
- Detailed file:line references and code architecture
- Complete dependency mapping (direct, indirect, integrations)
- Data flow and component interaction diagrams
- Complexity assessment and risk analysis
- Actionable implementation considerations

**NOT included**: Multiple solution options (use brainstorm for that), implementation steps (use plan for that).

---

## Template Structure

```markdown
# 🔬 Research: [Topic Title]

**Context ID**: [Jira ID, GitHub Issue/PR, Brainstorm Option, or "Custom"]
**Generated**: [Timestamp]
**Work Folder**: [Path to WIP folder]
**Source**: [Where this research target came from - e.g., "Brainstorm Option 2", "Jira EC-1234", "Manual input"]

---

## 📋 Problem/Topic Summary

[2-4 paragraphs providing context:]
- What specific approach/topic is being researched
- Why this approach was chosen (if from brainstorm, reference that)
- What problem it solves or what area it explores
- Key requirements or constraints driving the approach

**Research Focus**: [Specific aspect being analyzed - e.g., "Incremental migration with feature flags", "Performance optimization of query layer"]

---

## 🏗️ Current State Analysis

### Architecture Overview

[High-level architecture diagram using markdown or ASCII art showing:]
- Major components involved
- Current data flow
- Integration points
- System boundaries

**Key Components**:
- **[Component 1 Name]** (`path/to/folder/`)
  - Purpose: [Brief description]
  - Key files: `file1.ts:123`, `file2.ts:456`
  - Responsibilities: [What it does]

- **[Component 2 Name]** (`path/to/folder/`)
  - Purpose: [Brief description]
  - Key files: `file1.ts:789`, `file2.ts:234`
  - Responsibilities: [What it does]

- **[Component 3 Name]** (`path/to/folder/`)
  - Purpose: [Brief description]
  - Key files: `file1.ts:567`, `file2.ts:890`
  - Responsibilities: [What it does]

### Related Systems

**Direct Dependencies**:
- System/Module 1: [How it's used, key integration points with file:line]
- System/Module 2: [How it's used, key integration points with file:line]

**Indirect Dependencies**:
- System/Module 3: [Transitive dependency, impact level]
- System/Module 4: [Transitive dependency, impact level]

**Integration Points**:
- External API 1: [Where called from, file:line references]
- Database tables: [Which tables, where accessed, file:line references]
- Message queues: [Which queues, publishers/subscribers, file:line references]

---

## 🔍 Technical Deep Dive

### Architecture Details

**Component Interactions**:
```
[Sequence diagram or flow showing how components interact]

Example:
Controller (controller.ts:45)
    → Service (service.ts:123)
        → Repository (repo.ts:234)
            → Database
        → Cache (cache.ts:567)
    → Response Formatter (formatter.ts:89)
```

**Design Patterns In Use**:
- [Pattern 1 - e.g., Repository pattern in `src/repositories/`]
- [Pattern 2 - e.g., Factory pattern for service creation in `src/factories/`]
- [Pattern 3 - e.g., Observer pattern for event handling in `src/events/`]

**Technology Stack**:
- Languages: [e.g., TypeScript, Python]
- Frameworks: [e.g., Express.js, React]
- Libraries: [Key libraries used in this area]
- Infrastructure: [Database, cache, message queue, etc.]

### Data Flow Analysis

**Request Flow** (for user-facing features):
1. **Entry Point**: `file.ts:line` - [What happens]
2. **Validation**: `file.ts:line` - [What's validated]
3. **Processing**: `file.ts:line` - [Core logic]
4. **Data Access**: `file.ts:line` - [DB/API calls]
5. **Response**: `file.ts:line` - [Return format]

**Data Transformations**:
- Input format → [Transform 1 at `file.ts:line`] → Intermediate format
- Intermediate format → [Transform 2 at `file.ts:line`] → Output format

**State Management**:
- Where state is stored: [file:line references]
- State lifecycle: [Creation, updates, cleanup]
- Concurrency concerns: [Race conditions, locking mechanisms]

### Dependencies Map

**Direct Dependencies** (must modify):
- `path/to/file1.ts:123` - [Function/class name, why it's affected]
- `path/to/file2.ts:456` - [Function/class name, why it's affected]
- `path/to/file3.ts:789` - [Function/class name, why it's affected]

**Indirect Dependencies** (may need updates):
- `path/to/file4.ts:234` - [Function/class name, why it might be affected]
- `path/to/file5.ts:567` - [Function/class name, why it might be affected]

**Test Coverage**:
- Existing tests: `test/path/file.test.ts:89` [Coverage level]
- Missing test areas: [What's not tested]
- Test dependencies: [Mocks, fixtures needed]

**Integration Impact**:
- Frontend components: [Which components need updates, file:line]
- API contracts: [Changes to request/response format]
- Database schema: [Changes needed or none]
- External services: [Third-party APIs affected]

### Code Quality Assessment

**Current Code Health**:
- Code complexity: [e.g., High cyclomatic complexity in `file.ts:123-234`]
- Technical debt: [Known issues, TODOs, deprecations]
- Code duplication: [DRY violations, shared logic]
- Error handling: [Quality of error handling, gaps]

**Testing Status**:
- Unit test coverage: [Percentage or level]
- Integration test coverage: [Percentage or level]
- E2E test coverage: [Percentage or level]
- Test quality: [Are tests meaningful or brittle?]

**Documentation**:
- Code comments: [Adequate or lacking]
- API documentation: [Available or missing]
- Architecture docs: [Up-to-date or stale]

---

## 🛠️ Implementation Considerations

### Approach Details

**High-Level Strategy**:
[2-3 paragraphs explaining the implementation approach for this specific option]
- What will be built/changed
- How it fits into existing architecture
- Why this approach over alternatives

**Implementation Phases** (if applicable):
1. **Phase 1**: [Preparatory work - e.g., Refactor existing code]
2. **Phase 2**: [Core implementation - e.g., Build new service]
3. **Phase 3**: [Integration - e.g., Wire up endpoints]
4. **Phase 4**: [Testing & rollout - e.g., Feature flag, gradual rollout]

### Complexity Analysis

**Estimated Effort**: [e.g., 5-7 days, 2-3 sprints]

**Complexity Factors**:
- **High Complexity Areas**:
  - [Area 1 with file:line] - [Why complex, what makes it hard]
  - [Area 2 with file:line] - [Why complex, what makes it hard]

- **Medium Complexity Areas**:
  - [Area 3 with file:line] - [What needs care]
  - [Area 4 with file:line] - [What needs care]

- **Low Complexity Areas**:
  - [Area 5 with file:line] - [Straightforward changes]

**Unknowns**:
- [Unknown 1 - e.g., Performance impact of new algorithm - needs benchmarking]
- [Unknown 2 - e.g., Third-party API rate limits - needs investigation]

### Testing Strategy

**Unit Testing**:
- New tests needed: [Functions/classes to test]
- Existing tests to update: [file:line references]
- Test scenarios: [Key cases to cover]

**Integration Testing**:
- Integration points to test: [APIs, database, services]
- Test data requirements: [Fixtures, mocks needed]
- Test scenarios: [Happy path, error cases, edge cases]

**E2E Testing**:
- User flows to test: [Critical paths]
- Test environment needs: [Dependencies, data setup]

**Performance Testing** (if applicable):
- Benchmarks to establish: [Response time, throughput, resource usage]
- Load testing scenarios: [Concurrent users, peak load]

**Regression Testing**:
- Existing functionality to verify: [What might break]
- Critical paths to re-test: [High-impact areas]

### Risks & Mitigation

**Technical Risks**:

1. **[Risk 1 - e.g., Database migration may cause downtime]**
   - Impact: [High/Medium/Low]
   - Probability: [High/Medium/Low]
   - Mitigation: [Specific steps to reduce risk]
   - Contingency: [Fallback plan if risk materializes]

2. **[Risk 2 - e.g., New caching layer may have consistency issues]**
   - Impact: [High/Medium/Low]
   - Probability: [High/Medium/Low]
   - Mitigation: [Specific steps to reduce risk]
   - Contingency: [Fallback plan if risk materializes]

**Business Risks**:

1. **[Risk 3 - e.g., Feature may confuse existing users]**
   - Impact: [High/Medium/Low]
   - Probability: [High/Medium/Low]
   - Mitigation: [Specific steps to reduce risk]
   - Contingency: [Fallback plan if risk materializes]

**Operational Risks**:

1. **[Risk 4 - e.g., Rollout may require off-hours deployment]**
   - Impact: [High/Medium/Low]
   - Probability: [High/Medium/Low]
   - Mitigation: [Specific steps to reduce risk]
   - Contingency: [Fallback plan if risk materializes]

### Performance Implications

**Expected Performance Impact**:
- Response time: [e.g., +50ms per request, -20% latency]
- Memory usage: [e.g., +10MB per instance]
- CPU usage: [e.g., Negligible change]
- Database load: [e.g., +5% query volume]

**Scalability Considerations**:
- [How approach scales with load]
- [Bottlenecks to watch]
- [Horizontal vs vertical scaling needs]

**Optimization Opportunities**:
- [Potential optimization 1]
- [Potential optimization 2]

### Security Implications

**Security Changes**:
- Authentication: [Any auth changes]
- Authorization: [Any permission changes]
- Data validation: [Input validation approach]
- Data encryption: [Encryption at rest/in transit]

**Security Risks**:
- [Potential vulnerability 1 and mitigation]
- [Potential vulnerability 2 and mitigation]

**Compliance**:
- [GDPR, HIPAA, or other compliance considerations]
- [Data retention policies]
- [Audit logging needs]

### What We Will Measure Later

**Performance Metrics** (measure during/after implementation):
- [Metric 1 - e.g., API response time (p50, p95, p99)]
- [Metric 2 - e.g., Database query duration]
- [Metric 3 - e.g., Memory consumption per request]
- [Metric 4 - e.g., Error rate and type distribution]

**Safety Metrics** (monitor during rollout):
- [Metric 1 - e.g., Feature flag adoption rate]
- [Metric 2 - e.g., User error reports (comparison to baseline)]
- [Metric 3 - e.g., Data consistency checks (audit queries)]
- [Metric 4 - e.g., Rollback trigger conditions (error thresholds)]

**Rollback Metrics** (validate rollback safety):
- [Metric 1 - e.g., Rollback execution time]
- [Metric 2 - e.g., Data integrity post-rollback (validation queries)]
- [Metric 3 - e.g., Service recovery time after rollback]

**Baseline Establishment**:
- [What current metrics to capture before implementation]
- [How to establish baseline (duration, sample size)]
- [Where to store baseline data for comparison]

**Instructions**:
- Be specific about WHAT to measure, not just "monitor performance"
- Include quantitative targets where possible (e.g., "p95 < 200ms")
- Identify measurement tools/methods (e.g., "APM dashboard", "custom SQL query", "CloudWatch metrics")
- Note if baseline needs to be established first

---

## 📚 Next Steps

**Immediate Actions**:
1. [Action 1 - e.g., Validate database schema changes with DBA team]
2. [Action 2 - e.g., Set up feature flag configuration]
3. [Action 3 - e.g., Create proof-of-concept for caching layer]

**Ready for Planning**:
Once the above actions are complete, proceed with:
```bash
/schovi:plan --input research-[ID].md
```

This will generate detailed implementation specification with tasks, acceptance criteria, and rollout plan.

**Open Questions** (resolve before implementation):
- [Question 1 - e.g., Should we use Redis or Memcached for caching?]
- [Question 2 - e.g., What's the exact rollout percentage schedule?]

---

## 🔍 Research Methodology

**Exploration Approach**:
- [How codebase was explored - e.g., Task tool with Plan subagent, thorough mode]
- [Time spent: e.g., ~3-5 minutes]

**Files Examined** (key files):
- `path/to/file1.ts:1-500` - [What was analyzed]
- `path/to/file2.ts:1-300` - [What was analyzed]
- `path/to/file3.ts:1-400` - [What was analyzed]

**Patterns Discovered**:
- [Pattern 1 - e.g., All services use dependency injection via constructor]
- [Pattern 2 - e.g., Error handling uses custom exception classes]

**Assumption Validation Matrix**:

| Assumption | How Tested | Result | Evidence |
|------------|------------|--------|----------|
| Database supports transactions | Code review of DB adapter | ✅ Pass | `db.ts:45` - TransactionManager class |
| Frontend handles async responses | API client inspection | ✅ Pass | `api.ts:123` - Promise-based architecture |
| External API supports webhooks | Documentation review needed | ⏳ Pending | Needs vendor docs verification |

**Instructions**: List all critical assumptions made during research. For each:
- **Assumption**: Clear statement of what we assume to be true
- **How Tested**: Method used (code review, docs, testing, POC, etc.)
- **Result**: ✅ Pass (validated), ❌ Fail (invalidated), ⏳ Pending (needs verification)
- **Evidence**: Specific file:line reference, doc link, or test result
```

---

## Guidelines for Subagent

### Content Generation

**Problem/Topic Summary**:
- If from brainstorm: Reference the option chosen and why
- If from Jira/GitHub: Extract specific approach from issue description
- If from file: Summarize the research target
- Keep focused on ONE specific approach, not multiple options

**Current State Analysis**:
- Use ACTUAL file:line references from codebase exploration
- Map real components, not hypothetical ones
- Show actual data flow based on code reading
- Identify real dependencies and integration points

**Technical Deep Dive**:
- Provide specific file:line references for ALL claims
- Show actual code patterns found in codebase
- Map real data flows by tracing through functions
- Identify actual dependencies by reading imports and call chains

**Implementation Considerations**:
- Be realistic about complexity based on code structure
- Identify actual risks based on code quality and dependencies
- Suggest testing strategy based on existing test patterns
- Consider actual performance implications from code analysis

### Separating Observations from Inferences

**Critical Distinction**:
- **Observations** = Objective facts from code/docs (WHAT exists)
- **Inferences** = Subjective interpretations/conclusions (WHAT it means)

**Examples**:

✅ **Good - Observation then Inference**:
```
Observation: `UserController.ts:45-67` uses bcrypt for password hashing with salt rounds hardcoded to 10.
Inference: This may be insufficient for high-security contexts; OWASP recommends 12+ rounds for 2024.
```

❌ **Bad - Mixed without distinction**:
```
The password hashing in `UserController.ts:45` is weak because it uses only 10 rounds.
```

**When Writing Research**:

1. **State observations first** (file:line evidence):
   - "The code does X at `file.ts:123`"
   - "Function Y calls Z with parameters A, B at `file.ts:456`"
   - "Test coverage includes scenarios 1, 2, 3 at `test.ts:789`"

2. **Then provide inferences** (analysis/interpretation):
   - "This suggests the system handles..."
   - "This pattern indicates..."
   - "This gap implies we need to..."

3. **Keep them visually distinct**:
   - Use "Observation:" / "Inference:" labels when clarity needed
   - Or structure as: fact sentence → interpretation sentence
   - Or use formatting: **Fact** (code ref) - Analysis follows

**Apply this throughout**:
- Current State Analysis: Map components (observations), then explain interactions (inferences)
- Code Quality Assessment: List specific issues (observations), then assess severity (inferences)
- Complexity Analysis: Identify affected areas (observations), then estimate effort (inferences)
- Risk Analysis: Document actual constraints (observations), then predict impact (inferences)

**Goal**: Readers should clearly distinguish between "what the code actually does" (verifiable) and "what we think it means" (interpretation).

### Validation Checklist

Before returning output, verify:

**Core Content**:
- [ ] Problem/topic summary clearly states research focus
- [ ] Current state analysis has file:line references for key components
- [ ] Architecture overview shows actual component interactions
- [ ] Dependencies map includes specific file:line references
- [ ] Data flow analysis traces through actual code paths
- [ ] Code quality assessment cites specific examples from codebase
- [ ] Complexity analysis identifies specific high/medium/low areas
- [ ] Testing strategy aligns with existing test patterns in codebase
- [ ] Risks are specific and actionable (not generic)
- [ ] Performance implications are based on code analysis
- [ ] Security implications consider actual implementation details
- [ ] Next steps are concrete and actionable
- [ ] All file references use `file:line` format

**New Quality Gates** (Phase 3 improvements):
- [ ] **Assumption Validation Matrix** includes 3-8 critical assumptions with:
  - Clear assumption statement
  - Testing method (code review, docs, POC, etc.)
  - Result (✅ Pass, ❌ Fail, ⏳ Pending)
  - Evidence (file:line reference, doc link, test result)
- [ ] **Observations vs Inferences** are clearly separated:
  - Observations state facts with file:line references
  - Inferences provide interpretation/analysis
  - Visual distinction maintained (labels, formatting, or structure)
- [ ] **What We Will Measure Later** section includes:
  - Performance metrics with specific measurement targets
  - Safety metrics for rollout monitoring
  - Rollback metrics for validation
  - Baseline establishment approach
  - Specific tools/methods for measurement

**Format**:
- [ ] Output adheres to markdown structure exactly
- [ ] Total output is ~4000-6000 tokens (deep and detailed)

### Token Budget

**Maximum**: 6500 tokens for entire output

**Target Distribution**:
- Problem/Topic Summary: ~400 tokens
- Current State Analysis: ~800 tokens
- Technical Deep Dive: ~2000 tokens
- Implementation Considerations: ~1500 tokens
  - Including "What We Will Measure Later": ~200 tokens
- Next Steps: ~200 tokens
- Research Methodology: ~300 tokens
  - Including "Assumption Validation Matrix": ~150 tokens

**If over budget**: Compress research methodology first (except Assumption Validation Matrix), then implementation considerations, while keeping all file:line references and new quality gates intact.

---

## Example Output

See `schovi/templates/research/example.md` for a full example (to be created if needed).

---

**Version**: 1.1 (Phase 3 - Enhanced Validation)
**Last Updated**: 2025-11-08
**Related Templates**: `templates/brainstorm/full.md`, `templates/spec/full.md`

**Changelog**:
- v1.1 (2025-11-08): Added Assumption Validation Matrix, Observations vs Inferences guidance, "What We Will Measure Later" section
- v1.0 (2025-11-07): Initial release
