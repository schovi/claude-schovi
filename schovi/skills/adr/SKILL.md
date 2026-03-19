---
name: adr
description: Write or review an Architecture Decision Record (ADR). Use when the user says "/schovi:adr", asks to "write an ADR", "create an ADR", "document this decision", "review this ADR", or wants to record an architectural decision.
disable-model-invocation: false
---

# ADR Command

Writes or reviews Architecture Decision Records using a consistent structure extracted from real-world ADRs.

**Behavior**:
- Auto-detects mode: write (from description) or review (from pasted draft)
- Asks clarifying questions before writing when context is insufficient
- Saves the ADR as a `.md` file when a target path is provided

## Usage

```
/schovi:adr                          # Asks what decision to document
/schovi:adr [describe the decision]  # Write ADR from description
/schovi:adr [paste existing ADR]     # Review and improve existing draft
```

---

# EXECUTION FLOW

## Phase 1: Parse Input & Detect Mode

### Step 1.1: Detect Mode

Analyze `$ARGUMENTS`:

- **No input** → `MODE=INTERACTIVE`: ask what decision to document
- **Contains ADR structure keywords** (e.g., "## Decision", "## Context", "## Alternatives", "👍", "🖼") → `MODE=REVIEW`
- **Descriptive text without ADR structure** → `MODE=WRITE`

### Step 1.2: Gather Missing Context (WRITE mode)

Before writing, check if these are answerable from the input. If 2+ are missing, ask them all at once — never one at a time:

1. **Problem**: What's the current state and why is it a problem?
2. **Trigger**: What's forcing this decision now? (deadline, blocker, tech debt threshold)
3. **Alternatives**: What other approaches were considered?
4. **Affected teams/systems**: Who needs to implement this?
5. **Reversibility**: How hard would it be to undo this?

Display as a single bundled question:

```
A few things I need to write a solid ADR:

1. What's the current state and why is it a problem?
2. What triggered this decision now?
3. What alternatives were considered?
4. Which teams or systems are affected?
5. How reversible is this decision?

Answer what you know — I'll mark the rest as [TBD].
```

---

## Phase 2: Write ADR (WRITE mode)

### Step 2.1: Determine ADR ID

Check the current directory for existing ADRs:

```bash
ls *.md 2>/dev/null | grep -oE 'ADR-[0-9]+' | sort -t- -k2 -n | tail -1
```

If found, increment by 1. Otherwise use `ADR-XXX`.

### Step 2.2: Generate Each Section

Write each section following these rules:

**Metadata header**:
```
ID: ADR-[number]
State: Draft
Driver: [from input, or @[ask]]
Collaborators: [from input, or omit]
Lifespan: 1 year
Last edited: [today's date]
Tags: [infer: backend | frontend | infrastructure | data | api | cross-team]
```

**👍 Decision**:
- 1-3 sentences max
- Specific and testable — a reader can verify if it was followed
- States WHAT was decided, not WHY
- Uses active voice: "X is identified by Y" not "We decided to use Y for X"
- Bad: "We'll use a simpler approach for now"
- Good: "Member entities are identified by `space_memberships.uuid` in API V2 responses, replacing the previously exposed `users.uuid`"

**🖼 Context**:
- Problem subsection: current state + why it's broken/blocking. Be concrete
- Why Now subsection: what triggered this (deadline, customer requirement, scaling limit)
- Constraints & Assumptions: bulleted list of known limits and explicit assumptions
- Never include the solution here

**⚖️ Options Considered**:
- Minimum 2 real options — no strawmen
- Mark chosen option with ✅
- Each option gets: Description, Pros (bullets), Cons (bullets), Why chosen / Why not chosen
- "Why not chosen" must be specific — never "no apparent reason" or vague dismissal
- If only one option was ever considered, note that explicitly and explain why no alternatives existed

**☄️ Consequences**:
- Split into "What becomes easier" and "What becomes harder / tradeoffs accepted"
- Reversibility field: Easy | Partial | Hard + one sentence why
- Affected systems/teams table: list each affected service or team and what changes for them
- Be honest about downsides — don't bury them

**🗺 Implementation Notes** (only if decision is complex or involves migration):
- Rollout sequence, migration steps, or phased approach
- Not a full spec — enough to unblock the first PR
- Omit section if decision is straightforward

**📝 Notes**:
- Related ADRs, Jira/Linear tickets, discovery docs, Slack threads
- Open questions as a checklist
- Out of scope items
- Omit subsections that have no content

**🙋 Feedback**:
- Omit entirely if no reviewer feedback was provided

### Step 2.3: Output ADR

Output the complete ADR as a markdown code block, then add:

```
---
Review checklist (verify before marking Active):

[ ] Decision statement is specific enough to verify in code
[ ] At least 2 genuine alternatives with real pros/cons
[ ] "Why now" is explicit in Context
[ ] Consequences honestly lists downsides, not just upsides
[ ] Reversibility is stated
[ ] All acronyms explained on first use
[ ] Open questions captured in Notes
[ ] Driver and reviewer names filled in
```

---

## Phase 3: Review ADR (REVIEW mode)

### Step 3.1: Check Each Failure Mode

Scan the ADR for these issues. Quote the exact problematic text for each one found.

| Issue | How to detect |
|---|---|
| **Vague decision** | Can't verify from the statement alone if it was followed; uses "we'll try", "probably", "for now" without scope |
| **Strawman alternatives** | Option dismissed with "no apparent reason", "obviously wrong", or less than 2 sentences of reasoning |
| **Missing "why now"** | Context doesn't explain what triggered the decision (no deadline, blocker, or driver mentioned) |
| **Buried downsides** | Consequences only lists upsides, or cons are all minor while pros are major |
| **Unexplained acronyms** | Jargon used without definition for cross-team readers |
| **Unaddressed feedback** | Reviewer comment raises a concern with no response or resolution |
| **Open sub-decisions** | Decision contains nested choices that are left unresolved or deferred without a follow-up ADR |
| **Incomplete rollout** | Migration or breaking change mentioned but no steps or sequencing given |
| **Weak alternatives** | Only one real option, others padded; or chosen option's "why" is vague |

### Step 3.2: Rate Overall Quality

**Strong** — Decision is testable, alternatives are genuine, consequences are honest, context is complete.

**Acceptable** — Minor gaps that don't affect usability. Small improvements would help.

**Needs work** — 2+ critical issues (vague decision, strawman alternatives, missing context). Significant revision needed.

### Step 3.3: Output Review

Format:

```
## ADR Review

**Rating**: Strong | Acceptable | Needs work

### Issues Found

**[Section name]** — [Issue type]
> "[quoted text from ADR]"
Problem: [What's wrong]
Fix: [Concrete suggestion]

---

### Top 3 Improvements

1. [Highest impact fix]
2. [Second most important]
3. [Third]

---

### What Works Well

- [Genuine strength worth keeping]
- [Another strength]
```

Then offer: "Want me to rewrite any specific sections?"

---

## Phase 4: Save File (optional)

If the user provides a file path, or after writing ask:

```
Save as file? (provide path or press Enter to skip)
```

If saving, write the ADR content (without the review checklist) to the specified path. Use the ADR ID as default filename: `ADR-XXX-[kebab-case-title].md`.

---

## Style Rules

Apply throughout all output:

- Short sentences. Plain language. No filler.
- Lead every section with the key point. Details follow, not the other way around.
- Use bullet points and tables over paragraphs. Readers scan, they don't read linearly.
- Every sentence must earn its place. If removing it loses no information, remove it.
- Name concrete things: specific tools, exact tradeoffs, real constraints. No vague "this provides flexibility" or "enables better alignment".
- No corporate jargon ("synergies", "leverage", "align stakeholders")
- No passive-aggressive or sycophantic tone
- Explain every acronym on first use
- Don't use "clearly", "obviously", "simply" — if it were obvious, no ADR needed
- Decisions use active voice: "X does Y" not "it was decided that Y would be done by X"
- Honest about tradeoffs — decisions that have no downsides are either trivial or incomplete

### Section-specific density rules

- **👍 Decision**: what we're doing and why, 2-3 sentences max.
- **⚖️ Options**: one sentence per pro/con. No narrative between bullets.
- **☄️ Consequences**: explicit tradeoffs. What we gain, what we sacrifice, what we defer.

---

## ADR Template Reference

See template: `schovi/templates/adr/full.md`
