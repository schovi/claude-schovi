# Feature: Hybrid Quick→Deep Review Mode with Flag

## Problem

The `/schovi:review` command currently offers two modes:
- **Deep Review**: Comprehensive analysis with full source code fetching (~$0.41, 60-90s)
- **Quick Review**: Lightweight analysis with minimal fetching (~$0.07, 10-20s)

While deep review provides superior quality (catches subtle bugs like test contradictions), it costs 5-6x more than quick review. For many PRs, the extra depth isn't needed, but for complex changes, it's essential.

**Current workflow requires upfront decision**:
- User must choose `--quick` flag at start
- If quick review misses issues, must re-run full deep review
- No intelligent escalation based on PR complexity

## Proposed Solution

Implement a **two-phase hybrid mode** that automatically escalates to deep review when needed:

### Phase 1: Quick Scan (automatic, ~$0.07)
- Analyze PR diff and metadata
- Generate initial review from context only
- **Identify red flags**:
  - Complex logic changes (nested conditionals, state management)
  - Security-sensitive code (auth, data handling, SQL queries)
  - Test changes without corresponding code changes
  - Large refactorings (>10 files or >500 lines)
  - Missing test coverage for new code

### Phase 2: Deep Dive (conditional, +$0.34)
- **Trigger conditions** (any of):
  - Red flags identified in Phase 1
  - PR marked as "requires deep review" (label/tag)
  - User explicitly requests via flag
- Fetch actual source code (up to 10 files)
- Comprehensive multi-dimensional analysis
- Code-level issue detection

### Implementation Options

**Option A: Automatic Escalation** (default behavior)
```bash
/schovi:review #123
# Runs quick scan → auto-escalates if red flags found
# Output shows: "🚨 Complex changes detected, performing deep analysis..."
```

**Option B: Flag-Controlled** (user decides)
```bash
/schovi:review #123 --hybrid
# Runs quick scan → asks user before escalating
# Output: "⚠️ Red flags found. Run deep analysis? [y/n]"
```

**Option C: Threshold-Based** (configurable)
```bash
/schovi:review #123 --hybrid --threshold=medium
# Escalates if: medium+ complexity OR any security concerns
```

### Expected Outcomes

**Cost Optimization**:
- Simple PRs: $0.07 (quick only, no escalation)
- Complex PRs: $0.41 (quick → deep)
- Average across typical PR mix: ~$0.15-0.20 (50-60% cost reduction)

**Quality Maintenance**:
- Still catches complex bugs (deep dive triggered)
- Faster feedback for simple changes
- No false negatives from shallow analysis (escalation catches them)

**User Experience**:
- No upfront mode decision required
- Transparent escalation with reasoning
- Cost-aware (shows savings for quick-only reviews)

## Trade-offs & Limitations

### Acknowledged Issues

❌ **False Negatives**: Quick scan might miss subtle issues that trigger escalation
- Example: Test overlap bug might not show in diff-only review
- Mitigation: Tune red flag detection based on real-world failures

❌ **Over-Escalation**: Could trigger deep review unnecessarily
- Simple renaming might look like complex refactoring
- Mitigation: Conservative thresholds, user confirmation mode

❌ **Wasted Tokens**: Quick scan tokens not reused in deep dive
- Total: $0.41 vs. direct deep: $0.34
- Acceptable trade-off for cost savings on simple PRs

### When Hybrid Doesn't Help

- **Always-complex codebases**: If every PR triggers escalation, use `--deep` directly
- **Security-critical repos**: Should always use deep review
- **Tiny PRs (<3 files, <50 lines)**: Overhead not worth it

## Proposed Flags

```bash
# Current behavior (unchanged)
/schovi:review #123              # Deep review (default)
/schovi:review #123 --quick      # Quick review only

# New hybrid mode options
/schovi:review #123 --hybrid              # Auto-escalate if red flags
/schovi:review #123 --hybrid=ask          # Ask before escalating
/schovi:review #123 --hybrid=auto         # Auto-escalate (same as --hybrid)
/schovi:review #123 --hybrid --threshold=low|medium|high
```

## Implementation Phases

### Phase 1: Basic Hybrid (MVP)
- Implement quick scan with red flag detection
- Auto-escalate on security/complexity triggers
- Add `--hybrid` flag
- Update documentation

### Phase 2: User Control
- Add `--hybrid=ask` mode with user confirmation
- Show escalation reasoning in output
- Track escalation metrics

### Phase 3: Optimization
- Tune red flag detection from real usage
- Add threshold controls
- Implement cost reporting

## Success Metrics

- **Cost reduction**: 40-60% average across typical PR mix
- **Quality maintained**: No increase in missed critical bugs
- **User satisfaction**: Faster reviews for simple PRs, thorough for complex

## Related

- Original analysis: User comparison of `/schovi:review` vs default `/review`
- Cost breakdown: Deep $0.41 provides 2-3x value for 5-6x cost
- Key finding: Deep review caught test overlap bug that diff-only review missed

---

**Note**: As acknowledged in the proposal, the hybrid approach has a fundamental limitation: if the quick scan doesn't find problems, the deep dive won't run, potentially missing subtle issues. This is an acceptable trade-off for cost optimization on simple PRs, but critical/security-sensitive repos should still use `--deep` directly.

## Labels

`enhancement`, `review-command`, `cost-optimization`
