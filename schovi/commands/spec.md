---
description: Product discovery and specification generation from requirements, images, documents, or Jira issues
argument-hint: [jira-id|description] [--input FILE1 FILE2...] [--output PATH] [--no-file] [--quiet] [--post-to-jira] [--work-dir PATH]
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task", "mcp__jira__*", "mcp__jetbrains__*", "Bash", "AskUserQuestion"]
---

# Product Specification Generator

You are **creating a product specification** that defines WHAT to build, WHY it's needed, and FOR WHOM. This is the discovery phase - focusing on requirements, user needs, and product decisions (NOT technical implementation).

---

## ⚙️ PHASE 1: INPUT PROCESSING & WORK FOLDER SETUP

### Step 1.1: Parse Command Arguments

**Input Received**: $ARGUMENTS

Parse to extract:

**Primary Input** (first non-flag argument):
- **Jira Issue ID**: Pattern `[A-Z]+-\d+` (e.g., EC-1234)
- **Text Description**: Free-form product idea or requirement
- **Empty**: Interactive mode (will prompt for requirements)

**Input Files** (supporting materials):
- **`--input FILE1 FILE2...`**: Images, PDFs, documents to analyze
  - Examples: wireframes, mockups, PRD, requirements.pdf
  - Supports multiple files
  - File types: .png, .jpg, .pdf, .md, .txt, .doc, .docx

**Output Flags**:
- **`--output PATH`**: Save spec to specific file path (default: `.WIP/[identifier]/01-spec.md`)
- **`--no-file`**: Skip file output, terminal only
- **`--quiet`**: Skip terminal output, file only
- **`--post-to-jira`**: Post spec as Jira comment (requires Jira ID)
- **`--work-dir PATH`**: Use specific work folder (default: auto-generate)

**Flag Validation**:
- `--output` and `--no-file` cannot be used together → Error
- `--post-to-jira` without Jira ID → Warning, skip posting
- `--work-dir` overrides auto-generation → Use as specified

**Store parsed values** for later phases:
```
problemInput = [jira-id or description or empty]
inputFiles = [list of file paths]
outputPath = [path or null]
noFile = [boolean]
quiet = [boolean]
postToJira = [boolean]
workDir = [path or null]
jiraId = [extracted jira id or null]
```

### Step 1.2: Resolve or Create Work Folder

Use lib/work-folder.md:

```
Configuration:
  mode: "auto-detect"

  identifier: [jiraId from Step 1.1, or null]
  description: [problemInput from Step 1.1]

  workflow_type: "full"
  current_step: "spec"

  custom_work_dir: [workDir from Step 1.1, or null]

Output (store for later phases):
  work_folder: [path from library, e.g., ".WIP/EC-1234-feature"]
  metadata_file: [path from library, e.g., ".WIP/EC-1234-feature/.metadata.json"]
  output_file: [path from library, e.g., ".WIP/EC-1234-feature/01-spec.md"]
  identifier: [identifier from library]
  is_new: [true/false from library]
```

**Store the returned values for later phases.**

**Note**: The work-folder library creates `.WIP/[identifier]/` with metadata. Workflow type "full" means: spec → analyze → plan → implement.

### Step 1.3: Copy Supporting Materials to Context Folder

If `--input` files provided:

```bash
for file in $inputFiles; do
  # Copy to context folder
  cp "$file" "[work_folder from Step 1.2]/context/$(basename $file)"

  # Read file if it's readable (images, PDFs, text)
  # Use Read tool to load content for analysis
done
```

**Update metadata.files.context** with list of copied files.

---

## ⚙️ PHASE 2: GATHER REQUIREMENTS & CONTEXT

### Step 2.1: Fetch External Context (if Jira)

If Jira ID detected in Step 1.1:

**Use jira-analyzer subagent**:
```
Task tool:
  subagent_type: "schovi:jira-auto-detector:jira-analyzer"
  prompt: "Fetch and summarize Jira issue [jira-id]"
  description: "Fetching Jira context"
```

Extract from summary:
- Issue title
- Issue type (Story, Epic, Bug)
- Description (full text)
- Acceptance criteria
- Comments and discussion points

### Step 2.2: Analyze Supporting Materials

For each file in context/:

**Images (wireframes, mockups, screenshots)**:
- Use Read tool to view images
- Extract UI elements, user flows, visual design
- Identify screens, components, interactions

**Documents (PDFs, text files)**:
- Use Read tool to extract text
- Parse requirements, user stories, constraints
- Identify stakeholder needs, success metrics

**Existing markdown/text**:
- Read directly
- Extract structured requirements if present

### Step 2.3: Interactive Discovery (if needed)

If requirements are vague or incomplete, ask clarifying questions:

**Use AskUserQuestion tool** to gather:

1. **Core Requirements**:
   - What problem are we solving?
   - Who are the users?
   - What's the expected outcome?

2. **User Experience**:
   - What are the key user journeys?
   - What actions will users perform?
   - What edge cases exist?

3. **Scope & Constraints**:
   - What's IN scope vs OUT of scope?
   - Any technical constraints to be aware of?
   - Any compliance or security requirements?

4. **Success Criteria**:
   - How will we know this is successful?
   - What metrics matter?
   - What are the acceptance criteria?

**Example Questions**:
```
1. Who is the primary user for this feature? (e.g., end users, admins, developers)

2. What's the main problem this solves? (1-2 sentences)

3. What are the key user actions? (e.g., "User logs in, sees dashboard, filters data")

4. Are there any known constraints? (e.g., must work on mobile, needs to support 10k users)

5. What's explicitly OUT of scope for v1? (helps clarify boundaries)
```

**Generate identifier now** if not done in Step 1.2.3:
- Take first sentence of problem description
- Generate slug
- Update work folder name if needed

---

## ⚙️ PHASE 3: GENERATE PRODUCT SPECIFICATION

### Step 3.1: Structure Specification Outline

Create structured specification with these sections:

```markdown
# Product Specification: [Title]

## 📋 Overview
[What, Why, For Whom - 3-4 sentences]

## 👥 Target Users
[Primary, secondary users]

## 🎯 Problem Statement
[What problem we're solving, current pain points]

## 💡 Proposed Solution
[High-level solution approach, key features]

## 📖 User Stories

### Story 1: [Title]
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Edge Cases**:
- [Edge case 1]
- [Edge case 2]

[Repeat for each major user story]

## 🎨 User Experience

### User Journey 1: [Journey Name]
1. User starts at [point]
2. User performs [action]
3. System responds with [response]
4. User sees [outcome]

[Repeat for key journeys]

## ✅ Product Acceptance Criteria

### Must Have (v1)
- [ ] Criterion 1
- [ ] Criterion 2

### Should Have (v1)
- [ ] Criterion 1

### Nice to Have (Future)
- [ ] Criterion 1

## 🔍 Scope & Decisions

### In Scope ✅
- Feature A
- Feature B

### Out of Scope ❌
- Feature X (reason: future iteration)
- Feature Y (reason: complexity)

### Product Decisions Made
- **Decision 1**: [Why we chose this]
- **Decision 2**: [Why we chose this]

## 🔗 Dependencies & Constraints

### External Dependencies
- [Third-party service, API, etc.]

### User Constraints
- [Browser support, device requirements]

### Business Constraints
- [Timeline, budget, compliance]

### Known Limitations
- [Technical or product limitations to be aware of]

## 📊 Success Metrics

### Key Performance Indicators
- Metric 1: [target]
- Metric 2: [target]

### User Success Metrics
- [How users measure success]

## 🗂️ Related Resources

### Context Files
[List files in context/ folder]
- wireframe.png - [brief description]
- requirements.pdf - [brief description]

### External References
- Jira: [link]
- Design doc: [link]
- Discussion: [link]

---

**Next Steps**: Run `/schovi:analyze` to explore technical implementation options.
```

### Step 3.2: Write Specification Content

Follow the outline above, filling in content based on:
- Jira context (if available)
- Supporting materials (images, docs)
- Interactive answers (if gathered)

**Key Principles**:
1. **Non-technical** - No file:line references, no code mentions
2. **User-focused** - Describe features from user perspective
3. **Clear scope** - Explicit about what's IN vs OUT
4. **Actionable criteria** - Testable acceptance criteria
5. **Decision record** - Document why we chose this approach

**Quality Check**:
- [ ] Clear problem statement (why we're building this)
- [ ] Defined target users
- [ ] At least 2-3 user stories with acceptance criteria
- [ ] Clear scope boundaries (in/out)
- [ ] Success metrics defined
- [ ] All supporting materials referenced

---

## ⚙️ PHASE 4: OUTPUT HANDLING

### Step 4.1: Determine Output Path

**Priority**:
1. If `--output` flag: Use specified path
2. If `--no-file`: Skip file output (terminal only)
3. Default: Use `output_file` from Step 1.2 (work-folder library)

```bash
if [ -n "$outputPath" ]; then
  final_output_file="$outputPath"
elif [ "$noFile" = true ]; then
  final_output_file=""  # Skip file output
else
  final_output_file="[output_file from Step 1.2]"  # e.g., .WIP/EC-1234/01-spec.md
fi
```

### Step 4.2: Write Specification File

If file output enabled:

**Use Write tool**:
- file_path: [final_output_file from Step 4.1]
- content: [Full specification from Phase 3]

### Step 4.3: Update Metadata

**If work_folder exists and file was written:**

Read current metadata:
```bash
cat [metadata_file from Step 1.2]
```

Update fields:
```json
{
  ...existing fields,
  "workflow": {
    ...existing.workflow,
    "completed": ["spec"],
    "current": "spec"
  },
  "files": {
    "spec": "01-spec.md",
    "context": ["wireframe.png", "requirements.pdf"]
  },
  "timestamps": {
    ...existing.timestamps,
    "lastModified": "[current timestamp]"
  }
}
```

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Write updated metadata:
```
Write tool:
  file_path: [metadata_file from Step 1.2]
  content: [updated JSON]
```

### Step 4.4: Post to Jira (if requested)

If `--post-to-jira` flag AND Jira ID present:

**Use mcp__jira__add_comment**:
- issue_key: [jira-id]
- comment: [Specification markdown or link to spec file]

Format comment:
```
Product Specification Generated

Specification saved to: .WIP/[identifier]/01-spec.md

Key highlights:
- [Target user]
- [Core problem]
- [Proposed solution]

Next step: Run /schovi:analyze to explore technical implementation.
```

### Step 4.5: Display Results to User

If not `--quiet`, show terminal output:

```
✅ Product specification complete!

📁 Work folder: .WIP/[identifier]/
📄 Specification: 01-spec.md
📂 Supporting materials: [count] files in context/

📋 Specification Summary:
• Target Users: [primary user types]
• Problem: [one-sentence problem]
• Solution: [one-sentence solution]
• User Stories: [count] stories defined
• Acceptance Criteria: [count] criteria

🎯 Scope:
✅ In Scope: [count] features
❌ Out of Scope: [count] items

📊 Success Metrics:
• [Metric 1]
• [Metric 2]

---

📍 What You Have:
✓ Product specification with user stories and acceptance criteria
✓ Clear scope boundaries and product decisions
✓ Success metrics defined

🚀 Next Steps:
1. Review spec: cat .WIP/[identifier]/01-spec.md
2. Explore technical approaches: /schovi:analyze --input .WIP/[identifier]/01-spec.md
3. Or iterate on spec if requirements change

💡 Tip: The spec is non-technical - it focuses on WHAT and WHY.
        Run analyze next to explore HOW to implement it.
```

If `--post-to-jira` succeeded:
```
✅ Posted to Jira: [jira-url]
```

---

## 🔍 VALIDATION CHECKLIST

Before completing, ensure:

- [ ] Work folder created: `.WIP/[identifier]/`
- [ ] Metadata initialized with workflow.type = "full"
- [ ] Specification written to `01-spec.md`
- [ ] Supporting materials copied to `context/`
- [ ] Metadata updated with completed = ["spec"]
- [ ] Clear problem statement and target users defined
- [ ] At least 2-3 user stories with acceptance criteria
- [ ] Scope boundaries (in/out) clearly defined
- [ ] Success metrics specified
- [ ] Next steps communicated to user

---

## 💡 USAGE EXAMPLES

### Example 1: Spec from Jira Issue

```bash
/schovi:spec EC-1234

# Workflow:
# 1. Fetches Jira issue details
# 2. Creates .WIP/EC-1234-[title-slug]/
# 3. Generates spec from Jira description and acceptance criteria
# 4. Saves to 01-spec.md
# 5. Shows summary
```

### Example 2: Spec from Wireframes and Description

```bash
/schovi:spec "Build user dashboard" --input wireframe.png design-doc.pdf

# Workflow:
# 1. Creates .WIP/build-user-dashboard/
# 2. Copies wireframe.png and design-doc.pdf to context/
# 3. Analyzes images and documents
# 4. Asks clarifying questions about requirements
# 5. Generates comprehensive spec
# 6. Saves to 01-spec.md with references to context files
```

### Example 3: Interactive Spec Generation

```bash
/schovi:spec

# Workflow:
# 1. Prompts for problem description
# 2. Asks about target users
# 3. Asks about key user actions
# 4. Asks about scope and constraints
# 5. Generates spec based on interactive answers
# 6. Creates work folder with generated identifier
# 7. Saves to 01-spec.md
```

### Example 4: Spec with Custom Output

```bash
/schovi:spec EC-1234 --output ~/docs/product-specs/auth-spec.md

# Custom output location, not in .WIP/ folder
```

---

## 🚫 ERROR HANDLING

### No Requirements Found
```
❌ Cannot generate specification without requirements

No Jira ID, description, or input files provided.

Please provide ONE of:
- Jira Issue: /schovi:spec EC-1234
- Description: /schovi:spec "Build user authentication"
- Files: /schovi:spec --input requirements.pdf wireframe.png
- Interactive: /schovi:spec (will prompt for details)
```

### Invalid File Type
```
⚠️  Warning: Unsupported file type: file.xyz

Supported types: .png, .jpg, .pdf, .md, .txt, .doc, .docx

Skipping file.xyz...
```

### Jira Not Found
```
❌ Jira issue EC-9999 not found

Please check:
- Issue key is correct
- You have access to the issue
- MCP Jira server is configured

Tip: Continue without Jira using description:
/schovi:spec "Description of the feature"
```

---

## 🎯 KEY PRINCIPLES

1. **Product Focus** - This is about WHAT to build, not HOW
2. **User-Centric** - Describe features from user perspective
3. **Non-Technical** - No code, no files, no implementation details
4. **Clear Boundaries** - Explicit scope (in/out)
5. **Actionable** - Criteria should be testable
6. **Decision Record** - Document why we chose this approach
7. **Workflow Foundation** - Sets up analyze → plan → implement chain

**Remember**: This is the first step in a full workflow. The spec should be detailed enough for the analyze command to explore technical approaches.
