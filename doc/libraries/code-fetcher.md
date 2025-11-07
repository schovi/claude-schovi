# `code-fetcher` Library

## Description

Unified source code fetching library with fallback strategies. Provides consistent approach to fetching source files from multiple sources for code review.

## Purpose

Standardize source code fetching by providing:
- Multi-source fetching (local filesystem, JetBrains MCP, GitHub API)
- Fallback strategy (local → JetBrains → GitHub)
- File prioritization (by changes and impact)
- Dependency discovery
- Token-efficient fetching

## Size

~80 lines (saves ~60 lines per command using source fetching)

## Features

- **Multi-Source Support**: Local files, JetBrains IDE, GitHub API
- **Smart Fallback**: Tries local first, then JetBrains, then GitHub
- **File Prioritization**: Fetches most relevant files based on changes
- **Dependency Discovery**: Finds related files and imports
- **Limit Control**: Respects file count limits (3 for quick, 10 for deep)
- **Report Method**: Reports to user which method was used

## Fetching Strategies

### Strategy 1: Local Filesystem (Preferred)
```
Conditions: Files exist locally in current repo
Tools: Read tool
Advantages: Fastest, no API limits, complete files
Disadvantages: Only works for local repos
```

### Strategy 2: JetBrains MCP (IDE Integration)
```
Conditions: JetBrains MCP server configured
Tools: mcp__jetbrains__* tools
Advantages: IDE integration, works for open projects
Disadvantages: Requires MCP server, project must be open
```

### Strategy 3: GitHub API (Remote Fallback)
```
Conditions: GitHub repo URL available, gh CLI authenticated
Tools: gh api via Bash
Advantages: Works for any public/accessible repo
Disadvantages: API rate limits, slower, authentication required
```

## Usage Pattern

Commands reference this library when needing source code:

```markdown
Use lib/code-fetcher.md with configuration:
- Files to fetch: [list from PR or exploration]
- Fetch limit: 10 (deep review) or 3 (quick review)
- Priority: By lines changed and file type
- Repository: owner/repo (for GitHub fallback)
- PR head SHA: abc123 (for specific commit)
- Include dependencies: true/false
```

## File Prioritization

Priority order (highest to lowest):
1. Files with most lines changed
2. Core business logic files (.ts, .js, .py, etc.)
3. Test files (if testing analysis needed)
4. Configuration files (if relevant)
5. Documentation files (lowest priority)

## Dependencies

### Called By
- `/schovi:review` command (for actual code fetching)

### Calls
- Read tool (for local files)
- JetBrains MCP tools (optional, for IDE integration)
- GitHub API via Bash (for remote files)
- Grep/Glob tools (for dependency discovery)

## Example Configuration

```markdown
Configuration:
  Source: GitHub PR #123
  Files: [
    "src/api/auth.ts" (245 lines changed),
    "src/models/user.ts" (89 lines changed),
    "tests/auth.test.ts" (56 lines changed),
    ... (20 files total)
  ]
  Fetch Limit: 10 (deep review)
  Repository: owner/repo
  PR Head SHA: abc123def456
  Include Dependencies: true

Processing:
  1. Prioritize files by lines changed
  2. Select top 10 files
  3. Try fetching via local filesystem:
     - Success: 8 files found locally
     - Not found: 2 files
  4. Fallback to GitHub API for missing 2 files:
     - Fetch via: gh api repos/owner/repo/contents/path?ref=abc123def456
     - Success: 2 files fetched
  5. Discover dependencies (imports in fetched files)
  6. Report to user: "Fetched 10 files (8 local, 2 GitHub API)"
  7. Return file contents for analysis
```

## Method Reporting

Always report to user which method was used:
```
✅ "Fetched 10 files via local filesystem"
✅ "Fetched 7 files locally, 3 via JetBrains IDE"
✅ "Fetched 5 files locally, 5 via GitHub API"
⚠️ "Could not fetch files (not in local repo, no MCP server, no GitHub access)"
```

## Token Considerations

- Typical source file: 200-500 tokens
- 10 files: 2000-5000 tokens
- Leaves room for analysis in main context
- Much better than 15000 token PR diff

## Quality Requirements

- Try local first (fastest, most reliable)
- Fall back gracefully to JetBrains then GitHub
- Prioritize files by importance
- Respect fetch limits (3 or 10)
- Report method used to user
- Handle errors gracefully (file not found, API limits)

## Location

`schovi/lib/code-fetcher.md`
