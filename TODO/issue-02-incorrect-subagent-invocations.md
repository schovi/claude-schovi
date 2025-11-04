# Issue: Incorrect subagent invocations in skills

**Labels**: `bug`, `critical`, `skills`

---

## Problem

Skills use `"general-purpose"` instead of fully qualified subagent names when spawning subagents. This violates the plugin architecture and may prevent context isolation from working properly.

## Current Behavior (Incorrect)

**Location**: `skills/jira-auto-detector/SKILL.md:134`

```markdown
Tool: Task
Parameters:
  prompt: "Fetch and summarize https://productboard.atlassian.net/browse/[ISSUE-KEY]"
  subagent_type: "general-purpose"  # ❌ WRONG!
  description: "Fetching Jira issue context"
```

## Expected Behavior (Correct)

According to `CLAUDE.md`, should use fully qualified names:

```markdown
Tool: Task
Parameters:
  prompt: "Fetch and summarize https://productboard.atlassian.net/browse/[ISSUE-KEY]"
  subagent_type: "schovi:jira-analyzer:jira-analyzer"  # ✅ CORRECT
  description: "Fetching Jira issue context"
```

## From CLAUDE.md Documentation

```markdown
### Spawning Subagents

**From commands or skills**, use Task tool with fully qualified name:

Task tool:
  subagent_type: "schovi:jira-analyzer:jira-analyzer"
  prompt: "Fetch and summarize Jira issue EC-1234"
  description: "Fetching Jira issue summary"

**Important**: Use fully qualified format `plugin:skill:agent`
(e.g., `schovi:jira-analyzer:jira-analyzer`), NOT just `jira-analyzer`.
```

## Files Affected

Need to verify and fix:

1. **`skills/jira-auto-detector/SKILL.md`** - Line 134
   - Current: `"general-purpose"`
   - Should be: `"schovi:jira-analyzer:jira-analyzer"`

2. **`skills/gh-pr-auto-detector/SKILL.md`** - Line 230 (verify)
   - Current: Likely `"general-purpose"`
   - Should be: `"schovi:gh-pr-analyzer:gh-pr-analyzer"`

3. **`skills/datadog-auto-detector/SKILL.md`** - (verify)
   - Current: Possibly `"general-purpose"`
   - Should be: `"schovi:datadog-analyzer:datadog-analyzer"`

## Impact

- **Context isolation may fail**: Using wrong subagent type bypasses context isolation architecture
- **Token savings compromised**: May load full payloads into main context instead of isolated context
- **Subagent selection incorrect**: May not use optimized, specialized subagents
- **Violates plugin architecture**: Breaks the three-tier pattern (Skills → Commands → Subagents)

## Root Cause

Skills were written before fully qualified naming convention was established, or documentation wasn't followed during skill creation.

## Solution

### Step 1: Search and Identify

Search all skill files for incorrect subagent invocations:

```bash
cd schovi/skills/
grep -r '"general-purpose"' .
grep -r 'subagent_type' . | grep -v 'schovi:'
```

### Step 2: Fix Each Occurrence

For each skill file, update the `subagent_type` parameter:

**jira-auto-detector/SKILL.md:134**:
```diff
- subagent_type: "general-purpose"
+ subagent_type: "schovi:jira-analyzer:jira-analyzer"
```

**gh-pr-auto-detector/SKILL.md:230**:
```diff
- subagent_type: "general-purpose"
+ subagent_type: "schovi:gh-pr-analyzer:gh-pr-analyzer"
```

**datadog-auto-detector/SKILL.md** (if applicable):
```diff
- subagent_type: "general-purpose"
+ subagent_type: "schovi:datadog-analyzer:datadog-analyzer"
```

### Step 3: Verify Subagent Exists

Ensure each referenced subagent actually exists:
- ✅ `agents/jira-analyzer/AGENT.md` - exists
- ✅ `agents/gh-pr-analyzer/AGENT.md` - exists
- ✅ `agents/gh-issue-analyzer/AGENT.md` - exists
- ✅ `agents/datadog-analyzer/AGENT.md` - exists

### Step 4: Test

Test each skill with real data:
```bash
# Test jira-auto-detector with real Jira issue
# Verify it calls jira-analyzer subagent correctly
# Check that context isolation works (token count is low)

# Test gh-pr-auto-detector with real GitHub PR
# Verify it calls gh-pr-analyzer subagent correctly
# Check that context isolation works
```

## Testing Strategy

**Manual Testing**:
1. Trigger skill auto-detection (mention EC-1234 in conversation)
2. Verify skill spawns correct subagent (check Task tool call)
3. Verify subagent returns condensed summary (~800-1000 tokens)
4. Verify main context doesn't receive full payload

**Integration Testing**:
1. Test with real Jira issues
2. Test with real GitHub PRs
3. Test with real GitHub issues
4. Test with Datadog resources
5. Measure token usage before/after

**Regression Testing**:
1. Ensure skills still auto-detect patterns correctly
2. Ensure summaries are generated properly
3. Ensure commands can still use skills

## Acceptance Criteria

- [ ] All occurrences of `"general-purpose"` in skills replaced with fully qualified names
- [ ] Each skill uses correct subagent format: `"schovi:<skill>:<agent>"`
- [ ] All referenced subagents exist in `agents/` directory
- [ ] Skills tested with real data (Jira, GitHub, Datadog)
- [ ] Context isolation verified (token counts remain low)
- [ ] No regression in skill auto-detection behavior
- [ ] Documentation updated if needed

## Implementation Checklist

- [ ] Search all skill files for incorrect invocations
- [ ] Fix `skills/jira-auto-detector/SKILL.md:134`
- [ ] Fix `skills/gh-pr-auto-detector/SKILL.md:230` (if needed)
- [ ] Fix `skills/datadog-auto-detector/SKILL.md` (if needed)
- [ ] Verify all subagent paths are correct
- [ ] Test jira-auto-detector with real Jira issue
- [ ] Test gh-pr-auto-detector with real GitHub PR
- [ ] Test datadog-auto-detector (if applicable)
- [ ] Measure token usage to verify isolation works
- [ ] Update CLAUDE.md if clarification needed
- [ ] Commit changes with clear message

## Related

- See `workflow-analysis.md` Section 2.2 for detailed problem description
- Related to architecture documentation in `CLAUDE.md`
- Blocks proper context isolation functionality

## Priority

**Critical** - This is a bug that violates core architecture and should be fixed immediately.

## Estimated Effort

**Low** - Simple find-and-replace operation, ~30 minutes including testing.
