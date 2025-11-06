---
name: completion-handler
description: Standard completion summaries and proactive next step suggestions
allowed-tools: ["SlashCommand", "mcp__jira__*"]
---

# Completion Handler Library

## Purpose

Provides consistent completion experience across commands:
- Standardized summary format with visual boxes
- Command-specific next step suggestions
- Proactive workflow continuation (auto-suggest next commands)
- Clear visual formatting and user interaction

## Usage Pattern

**Commands invoke this library after all output handling is complete:**

```markdown
Use lib/completion-handler.md with:

Configuration:
  command_type: "analyze" | "debug" | "plan" | "review"
  command_label: "Analyze-Problem" | "Debug-Problem" | "Create-Spec" | "Review"

Summary data:
  problem: "One-line problem summary"
  output_files: [".WIP/EC-1234/02-analysis.md"] # Paths to created files
  jira_posted: true | false
  jira_id: "EC-1234" | null
  work_folder: ".WIP/EC-1234-feature" | null
  terminal_only: false | true  # If --no-file was used

Command-specific data (for analyze):
  analysis_type: "Full" | "Quick"
  solution_options_count: 3
  recommended_option: "Option 2 - Backend service approach"

Command-specific data (for debug):
  root_cause: "Null pointer dereference in authentication flow"
  fix_location: "src/auth/validate.ts:142"
  severity: "High - Production outage risk"

Command-specific data (for plan):
  spec_title: "Add user authentication feature"
  template: "Full" | "Minimal"
  task_count: 15
  criteria_count: 8
  test_count: 6

Command-specific data (for review - not currently used by review command):
  verdict: "Approve with changes"
  issue_count: 5
```

---

## IMPLEMENTATION

### Step 1: Display Completion Summary

**Visual format** (command-specific):

#### For analyze:
```
╭─────────────────────────────────────────────╮
│ ✅ ANALYSIS COMPLETE                        │
╰─────────────────────────────────────────────╯

**Problem**: [problem]

**Analysis Type**: [analysis_type]

[If work_folder] **Work Folder**: [work_folder]

**Output**:
[If output_files] - 📄 Saved to: [first file from output_files]
[If jira_posted] - 📋 Posted to Jira: [jira_id]
[If terminal_only] - 🖥️  Terminal display only

**Solution Options**: [solution_options_count]
**Recommended**: [recommended_option]
```

#### For debug:
```
╭─────────────────────────────────────────────╮
│ ✅ DEBUGGING COMPLETE                       │
╰─────────────────────────────────────────────╯

**Problem**: [problem]

**Root Cause**: [root_cause]

**Fix Location**: [fix_location]

[If work_folder] **Work Folder**: [work_folder]

**Output**:
[If output_files] - 📄 Saved to: [first file from output_files]
[If jira_posted] - 📋 Posted to Jira: [jira_id]
[If terminal_only] - 🖥️  Terminal display only

**Severity**: [severity]
```

#### For plan:
```
╭──────────────────────────────────────────────────╮
│ ✅ SPECIFICATION CREATED                         │
╰──────────────────────────────────────────────────╯

**Spec Details**:
- Title: [spec_title]
- Jira Issue: [jira_id or "N/A"]
- Template: [template]

**Outputs**:
- 📺 Terminal: [Displayed if not terminal_only, else "Skipped"]
- 💾 File: [first file from output_files or "N/A"]
- 📎 Jira: [Posted if jira_posted, else "Skipped"]

**Spec Contents**:
- Implementation tasks: [task_count] tasks
- Acceptance criteria: [criteria_count] criteria
- Testing scenarios: [test_count] scenarios
```

---

### Step 2: Proactive Next Steps

**Behavior varies by command type:**

#### For command_type = "analyze":

**If file was created** (output_files is not empty):

```markdown
✅ **[Command-Label]** Analysis saved to: [first file from output_files]
[If work_folder] 📁 Work folder: [work_folder]

**Ready for next step?**

I can automatically generate an implementation specification from this analysis.
This will create a detailed spec with:
- Implementation tasks broken down by component
- Acceptance criteria
- Testing strategy
- Risk assessment
- Timeline estimates

[If work_folder exists]
Would you like me to run `/schovi:plan` now? [yes/no]
(Plan will auto-detect from work folder)

[If no work_folder]
Would you like me to run `/schovi:plan --input [first file]` now? [yes/no]
```

**Wait for user response:**

**If user says "yes"**:
- [If work_folder exists] Use SlashCommand tool: `/schovi:plan`
- [If no work_folder] Use SlashCommand tool: `/schovi:plan --input [first file]`
- Proceed directly to plan generation workflow

**If user says "no"** or **if terminal-only** (--no-file):

```markdown
**What would you like to do next?**

1. 📋 **Create specification** - Generate implementation spec
   [If work_folder]: Run `/schovi:plan` (auto-detects from work folder)
   [If file exists]: Run `/schovi:plan --input [file-path]`
   [If terminal-only]: Save analysis first or provide problem input
2. 💬 **Discuss solution** - Review recommended option vs alternatives
3. 🔍 **Deep dive** - Explore specific technical details further
4. 🎯 **Update Jira** - Post analysis as comment (if not already posted and jira_id exists)
5. ✅ **Nothing** - You're all set

Choose an option [1-5] or describe what you need:
```

**Handle user choice** (options 2-5):
- Option 2: Offer to discuss solution trade-offs
- Option 3: Offer to explore specific areas
- Option 4: Post to Jira if not already posted
- Option 5: Provide final encouragement

#### For command_type = "debug":

```markdown
**What would you like to do next?**

1. 🔧 **Apply the fix** - I can implement the proposed fix now
2. 🧪 **Review fix details** - Discuss the fix approach or alternatives
3. 📝 **Update Jira** - Post fix proposal as comment (if not already posted and jira_id exists)
4. ✅ **Nothing** - You're all set

Choose an option [1-4] or describe what you need:
```

**Handle user choice**:
- Option 1: Offer to implement fix (explain steps, ask for confirmation)
- Option 2: Offer to discuss fix approach
- Option 3: Post to Jira if not already posted
- Option 4: Provide final encouragement

#### For command_type = "plan":

```markdown
✨ **What's next?**

1. **Review & Edit**: Open [first file from output_files] to review/modify the spec
2. **Start Implementation**: Use `/schovi:implement` to begin work [if work_folder, else mention setup needed]
3. **Share for Review**: Share spec with team before implementation
4. **Ask Questions**: Ask me if you need clarification on any section

What would you like to do?
```

**Wait for user direction** - no automatic next command invocation for plan.

---

### Step 3: Execute User Choice (if applicable)

Based on user response from Step 2:

#### Option: "Create specification" (analyze command)

```markdown
[If file exists]:
Great! I'll generate the spec from the saved analysis file.

Use SlashCommand tool: `/schovi:plan --input [file-path]`

[If terminal-only]:
I need an analysis file to generate a spec. Options:
1. Save the terminal analysis to a file first
2. Provide the Jira ID or problem description directly to plan command

Which would you prefer?
```

#### Option: "Apply the fix" (debug command)

```markdown
Great! I'll implement the fix now.

I will:
1. Read the file at [fix_location]
2. Apply the proposed changes
3. Run any relevant tests (if applicable)
4. Create a commit with the fix (optional)

Shall I proceed? [yes/no]
```

If yes: Implement using Edit tool, test if appropriate, offer commit.

#### Option: "Discuss solution/fix" (analyze/debug)

```markdown
Let's review:

[For analyze]:
**Recommended**: [recommended_option]
**Key Pros**: [from analysis]
**Trade-offs**: [from analysis]

vs.

**Alternatives**: [list other options]

Which aspects would you like to discuss?
- Why [recommended] was chosen?
- Trade-offs between options?
- Implementation complexity?
- Something specific?

[For debug]:
**Fix Location**: [fix_location]
**Proposed Changes**: [summary]
**Testing**: [approach]

What would you like to discuss?
- Why this fix location?
- Alternative approaches?
- Testing strategy?
- Rollout considerations?
```

#### Option: "Update Jira" (all commands)

```markdown
[If jira_id exists and not already posted]:
I'll post the [content_type] as a Jira comment now.

Use mcp__jira__addCommentToJiraIssue tool to post.

[If no jira_id]:
No Jira issue was associated with this [workflow].

[If already posted]:
[Content_type] was already posted to Jira: [jira_id]
```

#### Option: "Nothing" (all commands)

```markdown
Perfect! The [content_type] is complete and saved. You can reference it anytime.

Available commands:
[For analyze]: `/schovi:plan [file]` - Generate implementation spec
[For debug]: `/schovi:implement` - Start implementation with fix
[For plan]: `/schovi:implement` - Start implementation

Good luck! 🚀
```

---

## Notes

- **Proactivity**: Only analyze command auto-suggests next command (plan). Debug and plan commands present options but don't auto-invoke.
- **Context awareness**: Use work_folder to simplify command suggestions
- **File awareness**: Adapt suggestions based on whether files were created
- **Jira awareness**: Only offer Jira posting if jira_id exists and not already posted
- **User control**: Always ask before invoking SlashCommand tool, never assume
