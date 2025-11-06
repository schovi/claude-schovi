# Testing Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-06
**Purpose**: Comprehensive testing procedures for the claude-schovi plugin

---

## Overview

This guide provides **testing procedures** for ensuring plugin quality across commands, libraries, and subagents. It includes test matrices, regression checklists, and validation procedures.

**Philosophy**: Test strategically, not exhaustively. Focus on high-value tests that catch real issues.

---

## 🎯 Testing Principles

### 1. Test at the Right Level

**Library Tests**: Test reusable logic once
- ✅ Test library directly (if possible)
- ✅ Test with 1-2 representative commands
- ❌ Don't test with all 7 commands (redundant)

**Command Tests**: Test command-specific logic
- ✅ Test business logic (Phase 2)
- ✅ Test output formats
- ❌ Don't re-test library logic (already tested)

**Integration Tests**: Test end-to-end workflows
- ✅ Test critical paths
- ✅ Test with real data (Jira, GitHub)
- ✅ Test error handling

### 2. Risk-Based Testing

**High Risk** (must test):
- Library changes (affect multiple commands)
- Subagent modifications (token budgets)
- Core logic changes (argument parsing, input processing)

**Medium Risk** (test sampling):
- Command-specific logic changes
- Documentation updates
- Output formatting changes

**Low Risk** (spot check):
- Comment changes
- Documentation typos
- Non-functional refactoring

### 3. Automated Where Possible

**Future Enhancements**:
- Bash scripts for smoke testing
- Token budget validation
- Duplication detection
- Line count monitoring

**Current State**: Manual testing (documented procedures below)

---

## 📋 Test Matrices

### Command Test Matrix

| Command | Jira Input | GitHub PR | GitHub Issue | File Input | Text Input | Output: File | Output: Terminal | --quick Flag |
|---------|-----------|-----------|--------------|------------|------------|--------------|------------------|--------------|
| `/schovi:analyze` | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |
| `/schovi:debug` | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ❌ N/A |
| `/schovi:plan` | ⚠️ Should reject | ⚠️ Should reject | ⚠️ Should reject | ✅ Test | ⚠️ Depends | ✅ Test | ✅ Test | ❌ N/A |
| `/schovi:review` | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test | ✅ Test |

**Legend**:
- ✅ Test: Should work, must test
- ⚠️ Should reject: Should show error, test error handling
- ❌ N/A: Not applicable

---

### Library Test Matrix

| Library | Command: analyze | Command: debug | Command: plan | Command: review | Edge Cases | Token Budget |
|---------|------------------|----------------|---------------|-----------------|------------|--------------|
| argument-parser.md | ✅ Test | ⚪ Spot check | ⚪ Spot check | ⚪ Spot check | ✅ Test (quotes, special chars) | N/A |
| input-processing.md | ✅ Test | ⚪ Spot check | ⚪ Spot check | ⚪ Spot check | ✅ Test (all input types) | ~700 tokens |
| work-folder.md | ✅ Test | ⚪ Spot check | ⚪ Spot check | ❌ N/A | ✅ Test (existing folder, permissions) | ~600 tokens |
| subagent-invoker.md | ✅ Test | ⚪ Spot check | ⚪ Spot check | ⚪ Spot check | ✅ Test (failures, timeouts) | ~530 tokens |
| output-handler.md | ✅ Test | ⚪ Spot check | ⚪ Spot check | ⚪ Spot check | ✅ Test (all formats) | ~400 tokens |

**Legend**:
- ✅ Test: Full testing required
- ⚪ Spot check: Quick validation
- ❌ N/A: Not used by this command

---

### Subagent Test Matrix

| Subagent | Valid Input | Invalid Input | Token Budget | Output Quality | Error Handling |
|----------|-------------|---------------|--------------|----------------|----------------|
| jira-analyzer | ✅ EC-1234, URL | ✅ Invalid ID | ✅ <1,000 | ✅ Summary, not raw | ✅ Graceful fail |
| gh-pr-analyzer | ✅ URL, #123 | ✅ Invalid PR | ✅ <1,200 | ✅ Summary, not raw | ✅ Graceful fail |
| gh-pr-reviewer | ✅ URL, #123 | ✅ Invalid PR | ✅ <15,000 | ✅ Diff included | ✅ Graceful fail |
| gh-issue-analyzer | ✅ URL, #123 | ✅ Invalid issue | ✅ <1,000 | ✅ Summary, not raw | ✅ Graceful fail |
| spec-generator | ✅ Analysis content | ✅ Empty input | ✅ <3,000 | ✅ Structured spec | ✅ Graceful fail |
| debug-fix-generator | ✅ Debug results | ✅ Empty input | ✅ <2,500 | ✅ Actionable fix | ✅ Graceful fail |

---

## 🧪 Test Procedures

### Procedure 1: Command Smoke Test

**Purpose**: Verify command basic functionality
**When**: After any command change
**Duration**: 5-10 minutes per command

**Steps**:
```bash
# 1. Test with Jira input (if supported)
/schovi:analyze EC-1234

# 2. Verify output
# - No errors
# - Output file created (if applicable)
# - Terminal output is formatted
# - Contains expected sections

# 3. Test with file input
/schovi:analyze --input ./test-input.txt

# 4. Test with flags
/schovi:analyze EC-1234 --no-file --quiet

# 5. Test error handling
/schovi:analyze INVALID-INPUT
# Should show helpful error message
```

**Pass Criteria**:
- [ ] Command executes without errors
- [ ] Output is well-formatted
- [ ] File created (if --no-file not used)
- [ ] Error messages are helpful

---

### Procedure 2: Library Regression Test

**Purpose**: Verify library change doesn't break commands
**When**: After any library change
**Duration**: 15-30 minutes

**Steps**:
1. **Identify affected commands**
   ```bash
   grep -r "lib/[library-name]" schovi/commands/
   ```

2. **Test primary command** (full test)
   - Run command with 2-3 input types
   - Verify all phases execute
   - Check output quality

3. **Spot check other commands** (quick test)
   - Run each with 1 input type
   - Verify no errors
   - Quick output review

4. **Test edge cases**
   - Invalid inputs
   - Special characters
   - Empty inputs
   - Missing required fields

**Pass Criteria**:
- [ ] All commands using library work
- [ ] No regressions in functionality
- [ ] Edge cases handled gracefully

---

### Procedure 3: Subagent Token Budget Validation

**Purpose**: Ensure subagent stays within token budget
**When**: After subagent changes, monthly check
**Duration**: 10-15 minutes per subagent

**Steps**:
```bash
# 1. Prepare test input
# (Use real Jira issue, GitHub PR, etc.)

# 2. Invoke subagent via command
/schovi:analyze EC-1234  # (uses jira-analyzer)

# 3. Examine subagent output
# (Check for conciseness, no raw payloads)

# 4. Estimate tokens
# - Count output lines
# - Multiply by ~1.25 (tokens per line)
# - Compare to budget

# 5. Test with large input
# (e.g., PR with 50+ files)
# Verify still within budget
```

**Pass Criteria**:
- [ ] Output < token budget
- [ ] Output is summary, not raw data
- [ ] Large inputs handled (compressed appropriately)

**Budgets**:
- jira-analyzer: 1,000 tokens
- gh-pr-analyzer: 1,200 tokens
- gh-pr-reviewer: 15,000 tokens (normal), 3,000 tokens (massive PRs)
- gh-issue-analyzer: 1,000 tokens
- spec-generator: 3,000 tokens
- debug-fix-generator: 2,500 tokens

---

### Procedure 4: Integration Test (End-to-End)

**Purpose**: Validate complete workflow
**When**: Before releases, monthly
**Duration**: 30-60 minutes

**Test Workflow: Analyze → Plan → Review**

**Steps**:
```bash
# 1. Run analyze command
/schovi:analyze EC-1234
# Verify: analysis file created

# 2. Run plan command (using analysis)
/schovi:plan --input ./analysis-EC-1234.md
# Verify: spec file created

# 3. (Hypothetically) Implement changes

# 4. Run review command
/schovi:review #123
# Verify: review output generated

# 5. Cross-check consistency
# - Does spec match analysis?
# - Does review align with spec?
```

**Pass Criteria**:
- [ ] All commands execute successfully
- [ ] Data flows correctly between steps
- [ ] Outputs are consistent
- [ ] Work folder managed correctly

---

### Procedure 5: Error Handling Test

**Purpose**: Verify graceful error handling
**When**: After error handling changes, before releases
**Duration**: 20-30 minutes

**Test Scenarios**:
```bash
# 1. Invalid Jira ID
/schovi:analyze INVALID-123
# Expected: Clear error message, guidance

# 2. Network failure (simulate)
# (Disconnect network)
/schovi:analyze EC-1234
# Expected: Timeout error, retry guidance

# 3. Missing required flag
/schovi:plan
# (No input provided)
# Expected: Error message, usage help

# 4. Invalid flag value
/schovi:analyze EC-1234 --output /invalid/path/file.md
# Expected: Error about invalid path

# 5. Conflicting flags
/schovi:analyze EC-1234 --no-file --output ./file.md
# Expected: Error about mutual exclusivity
```

**Pass Criteria**:
- [ ] All errors caught gracefully
- [ ] Error messages are helpful
- [ ] Guidance provided (next steps)
- [ ] No stack traces exposed to user

---

## 🔄 Regression Testing

### Regression Test Checklist

**Run before major releases or after significant changes**

**Core Functionality** (30 minutes):
- [ ] `/schovi:analyze` with Jira input
- [ ] `/schovi:analyze` with GitHub PR input
- [ ] `/schovi:debug` with error description
- [ ] `/schovi:plan` with analysis file
- [ ] `/schovi:review` with GitHub PR
- [ ] All commands produce expected outputs
- [ ] No error messages (except for invalid inputs)

**Input Processing** (15 minutes):
- [ ] Jira ID detection works (EC-1234, IS-8046)
- [ ] GitHub PR URL detection works
- [ ] GitHub issue URL detection works
- [ ] File input works (`--input ./file.md`)
- [ ] Text input works (free-form description)
- [ ] Input validation catches invalid inputs

**Output Handling** (15 minutes):
- [ ] File output created correctly
- [ ] Terminal output formatted
- [ ] `--no-file` flag suppresses file creation
- [ ] `--quiet` flag suppresses terminal output
- [ ] `--output` flag uses custom path
- [ ] Work folder metadata correct

**Flags and Options** (15 minutes):
- [ ] `--quick` flag works (faster output)
- [ ] `--work-dir` flag uses custom directory
- [ ] `--post-to-jira` flag posts to Jira (if tested)
- [ ] Flag validation catches conflicts
- [ ] Unknown flags show helpful error

**Edge Cases** (20 minutes):
- [ ] Very long inputs (>10k characters)
- [ ] Special characters in inputs (quotes, newlines)
- [ ] Empty inputs
- [ ] Missing Jira issue (404)
- [ ] Missing GitHub PR (404)
- [ ] Network timeout (slow connection)
- [ ] Existing work folder (overwrite handling)

**Total Time**: ~2 hours (full regression suite)

---

## 📊 Test Metrics

### Test Coverage Goals

| Component | Target Coverage | Current | Status |
|-----------|----------------|---------|--------|
| Commands | 80% (critical paths) | Manual | ⚪ Manual |
| Libraries | 90% (all reused) | Manual | ⚪ Manual |
| Subagents | 100% (budgets validated) | Manual | ⚪ Manual |
| Integration | Key workflows | Manual | ⚪ Manual |

**Future Goal**: Automate 50%+ of tests with bash scripts

---

## 🤖 Automated Testing (Future)

### Smoke Test Script (Example)

```bash
#!/bin/bash
# scripts/smoke-test.sh
# Quick smoke test for all commands

set -e

echo "🧪 Running smoke tests..."

# Test analyze
echo "Testing /schovi:analyze..."
timeout 180 claude-code "/schovi:analyze 'Test issue: EC-1234 equivalent'" || {
  echo "❌ Analyze failed"
  exit 1
}

# Test plan (from scratch)
echo "Testing /schovi:plan..."
timeout 60 claude-code "/schovi:plan --from-scratch 'Add feature X'" || {
  echo "❌ Plan failed"
  exit 1
}

# Test review (mock)
echo "Testing /schovi:review..."
timeout 60 claude-code "/schovi:review --input ./sample-spec.md" || {
  echo "❌ Review failed"
  exit 1
}

echo "✅ Smoke tests passed"
```

### Token Budget Validator (Example)

```bash
#!/bin/bash
# scripts/validate-token-budgets.sh
# Validate subagent token budgets

check_subagent() {
  local agent=$1
  local budget=$2
  local test_input=$3

  echo "Checking $agent (budget: $budget tokens)..."

  # Run command that invokes subagent
  output=$(claude-code "$test_input")

  # Estimate tokens (rough: lines × 1.25)
  lines=$(echo "$output" | wc -l)
  tokens=$((lines * 125 / 100))

  if [ $tokens -gt $budget ]; then
    echo "❌ $agent exceeded budget: $tokens > $budget"
    return 1
  else
    echo "✅ $agent within budget: $tokens ≤ $budget"
    return 0
  fi
}

# Check each subagent
check_subagent "jira-analyzer" 1000 "/schovi:analyze EC-1234"
check_subagent "gh-pr-analyzer" 1200 "/schovi:analyze owner/repo#123"
# ...

echo "✅ Token budget validation complete"
```

---

## 🎯 Test Prioritization

### P0 - Critical (Must Test)

**Frequency**: Before every release
- [ ] Command smoke tests (all commands)
- [ ] Library regression (if library changed)
- [ ] Subagent token budgets
- [ ] Error handling (invalid inputs)

###P1 - High (Should Test)

**Frequency**: Before major releases, monthly
- [ ] Integration tests (key workflows)
- [ ] Edge cases (special characters, large inputs)
- [ ] Output formatting (all modes)
- [ ] Work folder management

### P2 - Medium (Nice to Test)

**Frequency**: Before major releases, quarterly
- [ ] Performance benchmarks
- [ ] Token usage optimization
- [ ] Documentation examples
- [ ] Uncommon flag combinations

### P3 - Low (Optional)

**Frequency**: Ad-hoc
- [ ] Stress testing (100+ file PRs)
- [ ] Cross-platform testing
- [ ] Internationalization (non-English inputs)
- [ ] Browser compatibility (if web-based)

---

## 📝 Test Documentation

### Test Case Template

```markdown
## Test Case: [Name]

**ID**: TC-XXX
**Priority**: P0/P1/P2/P3
**Component**: Command/Library/Subagent

**Description**: Brief description of what is being tested

**Preconditions**:
- [ ] Condition 1
- [ ] Condition 2

**Test Steps**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
- Expected outcome 1
- Expected outcome 2

**Actual Result**:
- (Fill in after test execution)

**Status**: Pass / Fail / Blocked
**Tested By**: [Name]
**Date**: YYYY-MM-DD
```

### Bug Report Template

```markdown
## Bug: [Short Description]

**Severity**: Critical / High / Medium / Low
**Component**: [Command/Library/Subagent]
**Version**: [Plugin version]

**Description**:
Clear description of the issue

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Error Messages**:
\`\`\`
(Paste error messages here)
\`\`\`

**Environment**:
- OS: [Linux/Mac/Windows]
- Claude Code Version: [version]
- Plugin Version: [version]

**Additional Context**:
Any other relevant information
```

---

## 🏁 Test Sign-Off

### Before Release Checklist

**All must be checked before release**:

**Functionality**:
- [ ] All P0 tests passed
- [ ] All P1 tests passed
- [ ] Critical bugs resolved
- [ ] Regression tests passed

**Quality**:
- [ ] Code duplication <5%
- [ ] All libraries <800 tokens
- [ ] Subagent budgets met
- [ ] Documentation updated

**Performance**:
- [ ] Commands execute <5 minutes
- [ ] Token usage <8,000 per command
- [ ] No context pollution

**Documentation**:
- [ ] CHANGELOG.md updated
- [ ] CLAUDE.md reflects changes
- [ ] Test results documented

**Sign-Off**:
- Tested By: _______________
- Date: _______________
- Approved By: _______________

---

## 📚 Additional Resources

**Related Documents**:
- `MAINTENANCE-RUNBOOK.md`: Maintenance procedures
- `metrics/quality-metrics-definition.md`: Quality standards
- `metrics/DASHBOARD.md`: Current health status

**Test Data**:
- Sample Jira IDs (for testing)
- Sample GitHub PRs (for testing)
- Test input files (in `/test` directory, if created)

---

**Last Updated**: 2025-11-06
**Next Review**: 2026-02-06 (Q1 2026)
**Maintained By**: Plugin maintainers

---

*This guide should be updated as testing practices evolve, automation is added, and new test scenarios are discovered.*
