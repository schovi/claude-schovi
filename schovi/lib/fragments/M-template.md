# Metric M-{NUMBER}

**Type**: Metric
**Created**: {TIMESTAMP} (Research)
**Status**: ⏳ Baseline Pending | ✅ Baselined | 📊 Monitoring | ✅ Met | ❌ Missed

## Description

{METRIC_DESCRIPTION}

## Purpose

**Validates**: {A_IDS - e.g., A-2}
**Monitors**: {R_IDS - e.g., R-4}

**Why This Metric**: {EXPLANATION_OF_WHY_THIS_METRIC_MATTERS}

## Target

**Performance Goal**: {TARGET_VALUE - e.g., p95 < 200ms}
**Acceptable Range**: {MIN_VALUE} - {MAX_VALUE}
**Critical Threshold**: {THRESHOLD_VALUE} (triggers {ACTION - e.g., rollback, alert})

## Baseline

**How to Establish**:
```bash
{BASELINE_COMMAND_1}
{BASELINE_COMMAND_2}
```

**Current Baseline**: (Updated during implementation)
- Pre-change: {VALUE} ({TIMESTAMP})
- Post-change: {VALUE} ({TIMESTAMP})

**Baseline Source**: {SOURCE - e.g., APM query, load test, manual measurement}

## Ownership

**Owner**: {TEAM_OR_PERSON} (responsible for monitoring)
**Reviewer**: {TEAM_OR_PERSON} (validates measurements)
**Escalation**: {TEAM_OR_PERSON} (if threshold exceeded)

## Timeline

**When to Measure**:
- Baseline: {WHEN - e.g., Before deployment, Phase 2 pre-deploy}
- Continuous: {DURATION - e.g., During rollout, first 48 hours}
- Final: {WHEN - e.g., 1 week post-deployment}

## Decision Gates

**Success Criteria**:
- {CRITERION_1 - e.g., Metric stays < target for 7 days}
- {CRITERION_2 - e.g., No degradation > 10% from baseline}

**Rollback Triggers**:
- {TRIGGER_1 - e.g., Metric > critical threshold for > 5 minutes}
- {TRIGGER_2 - e.g., Metric > target for > 30 minutes}

## Measurement Log

**(Updated during Implement/Monitor phases)**

| Timestamp | Value | Status | Notes |
|-----------|-------|--------|-------|
| {TIMESTAMP} | {VALUE} | {STATUS} | {NOTES} |

---

**Fragment ID**: M-{NUMBER}
**Last Updated**: {TIMESTAMP}
