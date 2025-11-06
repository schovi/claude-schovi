# Maintenance Runbook

**Version**: 1.0.0
**Last Updated**: 2025-11-06
**Purpose**: Ongoing maintenance procedures for the claude-schovi plugin

---

## Overview

This runbook provides **step-by-step procedures** for maintaining the claude-schovi plugin over time. It covers regular maintenance tasks, common scenarios, troubleshooting, and quality gates.

**Target Audience**: Plugin maintainers, contributors

**Update Frequency**: Review and update this runbook quarterly

---

## 📅 Regular Maintenance Tasks

### Monthly Tasks (15-30 minutes)

**Schedule**: First week of each month
**Next Due**: 2025-12-06

#### Task 1: Code Quality Review

**Purpose**: Ensure code quality standards are maintained

**Steps**:
```bash
# 1. Check total lines of code
wc -l schovi/commands/*.md | tail -1
wc -l schovi/lib/*.md | tail -1

# 2. Check for duplication patterns
grep -r "TODO: EXTRACT" schovi/commands/
# (Should return no results or minimal)

# 3. Spot check for similar code blocks
# Manually review recent changes for copy-paste patterns
```

**Thresholds**:
- ✅ Green: Commands <2,500 lines, duplication <5%
- ⚠️ Yellow: Commands 2,500-3,000 lines, duplication 5-15%
- 🚨 Red: Commands >3,000 lines, duplication >15%

**Action if Yellow/Red**: Schedule refactoring task

---

#### Task 2: Metrics Dashboard Update

**Purpose**: Keep metrics current

**Steps**:
1. Open `metrics/DASHBOARD.md`
2. Update "Last Updated" date
3. Run line count commands (as above)
4. Update relevant sections
5. Check if any metrics moved to yellow/red
6. Document any trends

**Time**: 10 minutes

---

#### Task 3: Library Size Check

**Purpose**: Prevent library bloat

**Steps**:
```bash
# Check library sizes
wc -l schovi/lib/*.md

# Calculate token estimates (lines × 1.25)
# Alert if any library >800 tokens (~640 lines)
```

**Action if Large Library**:
- Review for optimization opportunities
- Consider splitting into smaller libraries
- Document growth in DASHBOARD.md

---

### Quarterly Tasks (1-2 hours)

**Schedule**: First week of each quarter
**Next Due**: 2026-Q1 (February 2026)

#### Task 1: Performance Review

**Purpose**: Validate token efficiency and execution performance

**Steps**:
1. Run 5-10 representative commands
2. Estimate token usage (if tooling available)
3. Time execution duration
4. Compare to baseline:
   - Token usage: ~6,000 per command
   - Duration: 2-3 minutes for full analysis
5. Document findings in `metrics/YYYY-QX-performance.md`

**Thresholds**:
- ✅ <8,000 tokens, <5 minutes
- ⚠️ 8,000-12,000 tokens, 5-7 minutes
- 🚨 >12,000 tokens, >7 minutes

---

#### Task 2: Architecture Review

**Purpose**: Ensure architecture remains appropriate

**Questions to Ask**:
1. Are libraries still providing value? (Reuse factor ≥3×)
2. Is duplication creeping back in? (<5%)
3. Are patterns being followed? (Phase structure, library usage)
4. Do we need new abstractions? (New common patterns emerging)
5. Are subagents staying within budgets? (100% compliance)

**Deliverable**: Architecture review document or update to CLAUDE.md

---

#### Task 3: Documentation Audit

**Purpose**: Keep documentation accurate and helpful

**Checklist**:
- [ ] Review CLAUDE.md for outdated information
- [ ] Update examples with current line counts
- [ ] Check all links in README.md
- [ ] Verify library documentation is complete
- [ ] Update COMMAND-TEMPLATE.md if patterns changed
- [ ] Review metrics definitions in quality-metrics-definition.md

**Time**: 30-45 minutes

---

#### Task 4: Developer Survey (if applicable)

**Purpose**: Gather feedback from developers

**Survey Questions**:
1. Confidence in making changes? (1-10)
2. Time to understand architecture? (minutes)
3. Pain points or friction?
4. Suggestions for improvement?
5. Documentation clarity? (1-10)

**Deliverable**: Survey results document

---

### Annual Tasks (2-4 hours)

**Schedule**: Anniversary of Phase 4 completion
**Next Due**: 2026-11-06

#### Task 1: Year-over-Year Analysis

**Compare**:
- Total lines of code (trend)
- Duplication percentage (trend)
- Development velocity (time savings)
- Number of commands (growth)
- Library count (growth)
- Metrics dashboard (all values)

**Deliverable**: `metrics/YYYY-annual-report.md`

---

#### Task 2: ROI Calculation

**Calculate Time Savings**:
```
New commands developed: X × 15 hours saved = Y hours
Bug fixes: X × 1.5 hours saved = Y hours
Feature additions: X × 3 hours saved = Y hours
Developer onboarding: X × 2.25 hours saved = Y hours

Total Annual Savings: Z hours
```

**Document**: Cost savings, productivity improvements

---

#### Task 3: Strategic Planning

**Plan Next Year**:
- New commands to develop?
- Libraries to add/refactor?
- Major improvements needed?
- Architecture evolution?
- Tooling investments?

**Deliverable**: Roadmap for next year

---

## 🔧 Common Maintenance Scenarios

### Scenario 1: Adding New Input Type

**Example**: Add support for Datadog trace URLs

**Steps**:

1. **Update argument-parser.md** (15 min)
   ```markdown
   # Add to input classification patterns
   - Datadog trace: https://app.datadoghq.com/apm/trace/...
   ```

2. **Update input-processing.md** (30 min)
   ```markdown
   # Add datadog case
   - datadog: true  # Detect pattern and fetch via subagent
   ```

3. **Create subagent if needed** (2-3 hours)
   - Create `schovi/agents/datadog-analyzer/AGENT.md`
   - Set token budget (max 1,000 tokens)
   - Implement fetch and summarize logic

4. **Test with commands** (30 min)
   - Test `/schovi:analyze [datadog-url]`
   - Test `/schovi:debug [datadog-url]`
   - Verify correct handling

5. **Update documentation** (15 min)
   - Update CLAUDE.md (add to input sources)
   - Update command descriptions
   - Add examples

**Total Time**: ~4-5 hours

**Quality Gates**:
- [ ] Subagent stays within token budget
- [ ] All commands handle new input type
- [ ] Documentation updated
- [ ] No regressions in existing inputs

---

### Scenario 2: Adding New Flag

**Example**: Add `--format json` for JSON output

**Steps**:

1. **Update argument-parser.md** (10 min)
   ```markdown
   flags:
     - name: "--format"
       type: "choice"
       choices: ["markdown", "json", "yaml"]
       description: "Output format"
   ```

2. **Update output-handler.md** (45 min)
   ```markdown
   # Add format detection
   if format == "json":
     Convert output to JSON
     Write with .json extension
   ```

3. **Test with all commands** (20 min)
   ```bash
   /schovi:analyze EC-1234 --format json
   /schovi:plan --input ./analysis.md --format json
   # Verify JSON is valid and complete
   ```

4. **Update documentation** (10 min)
   - Update command descriptions
   - Add usage examples
   - Update CLAUDE.md

**Total Time**: ~1.5 hours

**Quality Gates**:
- [ ] Flag available in all commands automatically
- [ ] JSON output is valid
- [ ] Backward compatible (default format unchanged)
- [ ] Documentation updated

---

### Scenario 3: Creating New Command

**Example**: Create `/schovi:estimate` for implementation time estimation

**Steps**:

1. **Copy COMMAND-TEMPLATE.md** (5 min)
   ```bash
   cp schovi/lib/COMMAND-TEMPLATE.md schovi/commands/estimate.md
   ```

2. **Update YAML frontmatter** (10 min)
   ```yaml
   description: Estimate implementation time from specification
   argument-hint: [jira-id|spec-file] [--output PATH]
   ```

3. **Configure Phase 1** (15 min)
   - Set up argument-parser.md configuration
   - Set up input-processing.md configuration

4. **Implement Phase 2 logic** (2-3 hours)
   - Parse specification
   - Analyze task complexity
   - Calculate time estimates
   - (This is the command-specific business logic)

5. **Configure Phase 3-5** (30 min)
   - output-handler.md configuration
   - completion-handler.md configuration

6. **Test thoroughly** (1 hour)
   - Test all input types
   - Test output modes
   - Test edge cases

7. **Update documentation** (15 min)
   - Update CLAUDE.md (add command to list)
   - Update plugin.json if needed

**Total Time**: 4-5 hours

**Quality Gates**:
- [ ] Follows phase-template.md structure
- [ ] Uses existing libraries (no duplication)
- [ ] Length <600 lines (excluding docs)
- [ ] All input types handled
- [ ] Documentation complete

---

### Scenario 4: Fixing Bug in Library

**Example**: Fix argument parser bug with quoted strings

**Steps**:

1. **Identify affected library** (5 min)
   - Bug is in `lib/argument-parser.md`

2. **Make fix once** (15 min)
   ```markdown
   # Fix quoted string handling
   Pattern: "([^"]+)" or '([^']+)'
   ```

3. **Test all commands that use it** (30 min)
   ```bash
   # Test with problematic inputs
   /schovi:analyze "EC-1234 with spaces"
   /schovi:debug --input "file with spaces.txt"
   # Test each command using argument-parser
   ```

4. **Document fix** (5 min)
   - Add entry to CHANGELOG.md
   - Update library version comment if needed

5. **Regression testing** (10 min)
   - Verify no new issues introduced
   - Test edge cases

**Total Time**: ~1 hour (much faster than pre-refactoring 2-hour fix)

**Quality Gates**:
- [ ] Bug fixed in single location
- [ ] All commands benefit automatically
- [ ] No regressions introduced
- [ ] Changelog updated

---

### Scenario 5: Refactoring for Duplication

**Example**: Found duplicate error handling in 2+ commands

**Steps**:

1. **Identify duplication** (15 min)
   - Review commands for similar patterns
   - Measure duplication (lines, similarity)

2. **Design library** (30 min)
   - Plan library interface
   - Define configuration format
   - Choose library name (e.g., error-handler.md)

3. **Create library** (1-2 hours)
   - Extract common pattern
   - Generalize for all use cases
   - Add configuration options
   - Document usage

4. **Update commands** (30 min per command)
   - Replace inline code with library reference
   - Test each command

5. **Validate** (20 min)
   - Verify duplication reduced
   - Check metrics (should show improvement)
   - Update DASHBOARD.md

**Total Time**: 3-5 hours (depending on complexity)

**Quality Gates**:
- [ ] Duplication reduced to <5%
- [ ] Library reused 2+ times
- [ ] All commands tested
- [ ] Documentation updated

---

## ✅ Quality Gates

### Before Merging Any Change

**Mandatory Checks**:
- [ ] All affected commands tested
- [ ] No functionality regressions
- [ ] Token usage within budgets (if measurable)
- [ ] Documentation updated
- [ ] Code duplication <15% (ideally <5%)
- [ ] Follows established patterns
- [ ] CHANGELOG.md updated (for significant changes)

**For Library Changes**:
- [ ] All commands using library tested
- [ ] No breaking changes (or version bump + migration guide)
- [ ] Library size <800 tokens (~640 lines)

**For New Commands**:
- [ ] Uses COMMAND-TEMPLATE.md
- [ ] Follows phase-template.md structure
- [ ] Uses existing libraries (no reinventing)
- [ ] Length <600 lines
- [ ] CLAUDE.md updated

---

## 🚨 Troubleshooting Guide

### Issue: Command Fails with Library Error

**Symptoms**: Command execution fails with error mentioning library

**Debugging Steps**:
1. Identify which library failed
   ```
   Error: lib/argument-parser.md failed to parse...
   ```

2. Check library syntax
   - Review library markdown
   - Look for typos, missing closures

3. Check library configuration in command
   - Verify configuration block is correct
   - Check for missing required fields

4. Test library in isolation
   - Create minimal test case
   - Run just library logic

5. Check recent changes
   ```bash
   git log -- schovi/lib/[library-name].md
   git diff HEAD~1 schovi/lib/[library-name].md
   ```

**Common Causes**:
- Missing closing backticks in code blocks
- Invalid YAML in configuration
- Breaking changes in library interface

---

### Issue: Subagent Exceeds Token Budget

**Symptoms**: Subagent returns >budget tokens, context polluted

**Debugging Steps**:
1. Measure actual output
   - Run subagent with sample input
   - Count tokens in output (lines × 1.25)

2. Identify cause
   - Is input unusually large?
   - Is compression working?
   - Are all summaries in place?

3. Fix compression
   - Reduce bullet point counts (max 5)
   - Shorten descriptions (max 500 chars)
   - Use selective data (top N items)

4. Test fix
   - Re-run with same input
   - Verify <budget

5. Update documentation
   - Document budget enforcement
   - Add notes on compression techniques

**Common Causes**:
- Input size grew (PRs with 100+ files)
- Compression logic not applied
- Token budget unrealistic

---

### Issue: Tests Failing After Refactor

**Symptoms**: Commands don't work after library change

**Debugging Steps**:
1. Identify breaking change
   ```bash
   git diff HEAD~1 schovi/lib/[library].md
   ```

2. Check interface compatibility
   - Did configuration format change?
   - Are new required fields added?

3. Update all commands
   - Search for library usage
   ```bash
   grep -r "lib/[library-name]" schovi/commands/
   ```
   - Update each usage

4. Add migration guide (if major change)
   - Document what changed
   - Provide migration steps

**Prevention**:
- Test all commands before merging library changes
- Use version comments in libraries
- Maintain backward compatibility when possible

---

### Issue: Command Performance Degraded

**Symptoms**: Command takes >5 minutes (normal: 2-3 minutes)

**Debugging Steps**:
1. Profile execution
   - Time each phase
   - Identify slowest phase

2. Check subagents
   - Are subagents slow?
   - Network issues?

3. Check token usage
   - Did token count increase?
   - More libraries loaded?

4. Check codebase size
   - Did codebase grow significantly?
   - Is Explore subagent taking longer?

5. Optimize if needed
   - Use `--quick` mode
   - Reduce exploration scope
   - Cache results (future enhancement)

**Common Causes**:
- Codebase grew (more files to explore)
- Network slowness (API calls)
- Subagent logic became complex

---

### Issue: Duplication Creeping Back In

**Symptoms**: Duplication metric >10%

**Debugging Steps**:
1. Identify duplicate patterns
   ```bash
   # Manual review of recent changes
   git log --since="1 month ago" -- schovi/commands/
   ```

2. Find similar code blocks
   - Look for 5+ line identical blocks
   - Search for copy-paste patterns

3. Plan extraction
   - Can pattern be library-ified?
   - Design library interface

4. Extract to library
   - Follow Scenario 5 above

5. Update metrics
   - Re-measure duplication
   - Verify <5%

**Prevention**:
- Code review catches duplication
- Monthly duplication checks
- Educate team on library usage

---

## 📊 Monitoring and Alerts

### Monthly Monitoring

**Automated Checks** (future enhancement):
```bash
#!/bin/bash
# scripts/monthly-check.sh

# Check lines of code
COMMAND_LINES=$(wc -l schovi/commands/*.md | tail -1 | awk '{print $1}')
if [ $COMMAND_LINES -gt 2500 ]; then
  echo "⚠️ Warning: Commands exceed 2,500 lines ($COMMAND_LINES)"
fi

# Check for duplication markers
DUPLICATES=$(grep -r "TODO: EXTRACT" schovi/commands/ | wc -l)
if [ $DUPLICATES -gt 0 ]; then
  echo "⚠️ Warning: $DUPLICATES duplication markers found"
fi

# Check library sizes
for lib in schovi/lib/*.md; do
  LINES=$(wc -l < "$lib")
  if [ $LINES -gt 640 ]; then
    echo "⚠️ Warning: $(basename $lib) is large ($LINES lines)"
  fi
done

echo "✅ Monthly check complete"
```

### Alert Thresholds

| Metric | Yellow | Red | Action |
|--------|--------|-----|--------|
| Command LOC | 2,500 | 3,000 | Review for extraction |
| Duplication | 5% | 15% | Refactor immediately |
| Library size | 640 lines | 800 lines | Split library |
| Token usage | 8,000 | 12,000 | Optimize |
| New command time | 6 hours | 10 hours | Check template usability |

---

## 🔄 Versioning and Releases

### Version Scheme

**Format**: `MAJOR.MINOR.PATCH`

**Bump Rules**:
- **MAJOR**: Breaking changes (library interfaces change)
- **MINOR**: New features (new commands, new flags)
- **PATCH**: Bug fixes (no interface changes)

**Current Version**: 1.0.0 (Post-Phase 3)

### Release Checklist

When releasing a new version:
- [ ] All tests pass
- [ ] CHANGELOG.md updated
- [ ] Version bumped in plugin.json
- [ ] Documentation updated
- [ ] Metrics validated (all green)
- [ ] Git tag created
- [ ] Release notes written

---

## 📚 Additional Resources

**Key Documents**:
- `CLAUDE.md`: Comprehensive project documentation
- `schovi/lib/README.md`: Library system guide
- `metrics/DASHBOARD.md`: Current health status
- `metrics/quality-metrics-definition.md`: Metric definitions

**Phase 4 Reports**:
- `metrics/code-reduction-report.md`
- `metrics/duplication-analysis.md`
- `metrics/complexity-analysis.md`
- `metrics/token-efficiency-report.md`
- `metrics/development-velocity-test.md`

**Templates**:
- `schovi/lib/COMMAND-TEMPLATE.md`: New command scaffold
- `schovi/lib/phase-template.md`: Phase structure guide

---

## 🤝 Getting Help

**Questions or Issues**:
1. Check this runbook first
2. Review CLAUDE.md for architecture
3. Check metrics/DASHBOARD.md for health status
4. Review relevant Phase 4 reports
5. Ask maintainer team (if applicable)

**Reporting Bugs**:
1. Create detailed issue description
2. Include reproduction steps
3. Reference affected commands/libraries
4. Include error messages
5. Suggest root cause if known

---

**Last Updated**: 2025-11-06
**Next Review**: 2026-02-06 (Q1 2026)
**Maintained By**: Plugin maintainers

---

*This runbook should be treated as a living document. Update it as patterns emerge, issues are resolved, and the architecture evolves.*
