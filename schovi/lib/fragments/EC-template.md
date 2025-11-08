# Exit Criterion EC-{NUMBER}

**Type**: Exit Criterion
**Created**: {TIMESTAMP} (Plan)
**Phase**: {PHASE_NAME}
**Status**: ⏳ Pending | ✅ Pass | ❌ Fail

## Statement

{EXIT_CRITERION_STATEMENT}

## Validates

**Acceptance Criteria**:
- {AC_IDS - e.g., AC-1, AC-3}

**Phase Gate**: Must pass to proceed to {NEXT_PHASE}

## Verification Method

**Command**:
```bash
{VERIFICATION_COMMAND}
```

**Success Criteria** (binary):
- {CRITERION_1}: YES/NO
- {CRITERION_2}: YES/NO
- {CRITERION_3}: YES/NO

**Expected Exit Code**: {EXIT_CODE - e.g., 0}
**Verification Log**: {LOG_FILE_PATH}

## Dependencies

**Requires**:
- {EC_IDS - Other exit criteria that must pass first}
- {AC_IDS - Acceptance criteria that must be met}

**Blocks**:
- {EC_IDS - Exit criteria that depend on this one}

## Implementation Status

**(Updated during Implement phase)**

**Executed**: {TIMESTAMP}
**Result**: {STATUS - ✅ Pass | ❌ Fail}
**Attempt**: {ATTEMPT_NUMBER} (if retried)

**Evidence**:
- Command output: {OUTPUT_SUMMARY}
- Log file: {LOG_FILE_PATH}
- Exit code: {EXIT_CODE}
- {METRIC_RESULTS - e.g., Tests passed: 859/859, Coverage: 84.2%}

**Verified By**: {WHO_VERIFIED - e.g., Claude Code Implement Command}
**Reviewed By**: {WHO_REVIEWED - e.g., Manual review, TBD}

## Failure Handling

**(If status is ❌ Fail)**

**Root Cause**: {FAILURE_REASON}
**Resolution**: {HOW_FIXED}
**Retried**: {TIMESTAMP}
**Final Status**: {STATUS_AFTER_RETRY}

---

**Fragment ID**: EC-{NUMBER}
**Last Updated**: {TIMESTAMP}
