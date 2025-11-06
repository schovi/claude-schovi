---
name: code-fetcher
description: Unified source code fetching with strategy pattern for local, JetBrains MCP, and GitHub API sources
---

# Code Fetcher Library

## Purpose

Provides smart source code fetching with automatic fallback strategy:
1. **Local filesystem** (preferred - instant, complete access)
2. **JetBrains MCP** (IDE integration - if available)
3. **GitHub API** (remote fallback - requires network)

**Key Features**:
- Automatic method detection and fallback
- File prioritization by importance
- Graceful error handling
- Reusable across commands

---

## Usage Pattern

Commands should invoke this library with configuration:

```markdown
Use lib/code-fetcher.md with configuration:

**Files to Fetch**:
[List of file paths with priorities, from highest to lowest]
- priority 1: src/api/controller.ts
- priority 2: src/services/auth.ts
- priority 3: tests/controller.test.ts

**Mode**: [deep | quick]
- deep: Fetch up to 10 files, include dependencies
- quick: Fetch up to 3 most important files only

**Context** (for GitHub API fallback):
- repository: owner/repo
- branch: main
- commit_sha: abc123 (for exact version)

**Limits**:
- max_files: [10 for deep, 3 for quick]
- max_lines_per_file: 500 (optional truncation)

**Expected Output**:
```json
{
  "files_fetched": [
    {
      "path": "src/api/controller.ts",
      "content": "[file content]",
      "lines": 245,
      "method": "local"
    },
    ...
  ],
  "method_used": "local",
  "fallback_count": 0,
  "errors": []
}
```
```

---

## Implementation Strategy

### Strategy 1: Local Filesystem (Preferred)

**Detection**:
- Check if file exists locally
- Verify read permissions
- Fastest method (instant access)

**Execution**:
```bash
# For each file in priority order:
if [ -f "/path/to/file" ]; then
  cat "/path/to/file"
fi
```

**Advantages**:
- ✅ Instant access (no network latency)
- ✅ Complete file contents
- ✅ No API rate limits
- ✅ Works offline

**When to Use**:
- File exists in current working directory
- File path is accessible from current context
- Default method for most scenarios

**Error Handling**:
- File not found → Try next strategy
- Permission denied → Try next strategy
- File too large (>10MB) → Warn and skip

---

### Strategy 2: JetBrains MCP (IDE Integration)

**Detection**:
```bash
# Check if JetBrains MCP tools available
# Look for mcp__jetbrains__* tools in allowed-tools
```

**Execution**:
```
Use mcp__jetbrains__read_file tool:
- file_path: [path]
- repository: [repo context]
```

**Advantages**:
- ✅ IDE-aware file access
- ✅ Respects project structure
- ✅ May include IDE metadata
- ✅ Fast access

**When to Use**:
- Local filesystem failed
- JetBrains MCP server is configured
- Working within IDE project

**Error Handling**:
- Tool not available → Try next strategy
- File not found → Try next strategy
- MCP error → Try next strategy

---

### Strategy 3: GitHub API (Remote Fallback)

**Detection**:
```bash
# Check if gh CLI is authenticated
gh auth status 2>/dev/null
```

**Execution**:
```bash
# For each file in priority order:
gh api repos/{owner}/{repo}/contents/{file_path}?ref={commit_sha} \
  --jq '.content' | base64 -d
```

**Advantages**:
- ✅ Works for remote repositories
- ✅ Exact version via commit SHA
- ✅ No local clone needed

**Disadvantages**:
- ⚠️ Network latency
- ⚠️ Rate limits (5000 req/hour)
- ⚠️ Requires authentication
- ⚠️ Slower than local access

**When to Use**:
- Local and JetBrains strategies failed
- Reviewing remote PR without local checkout
- Context includes repository and commit SHA

**Error Handling**:
- Not authenticated → Warn and skip
- File not found → Skip and note
- Rate limit → Stop fetching, warn user
- Network error → Skip and note

---

## File Prioritization Logic

**How to prioritize files**:

1. **Changed files in PR** (highest priority):
   - Files with most changes first
   - Modified > Added > Removed
   - Core logic files > Tests > Docs

2. **Referenced files in description**:
   - Files mentioned in issue/PR description
   - Files with specific line references

3. **Related dependencies**:
   - Files imported by changed files
   - Files that import changed files

4. **Test files**:
   - Tests covering changed code
   - Integration tests

**Sorting Rules**:
```
Priority Score = (changes * 10) + (file_type_weight)

File Type Weights:
- Core logic (.ts, .js, .py, .go): +50
- Services/API: +40
- Tests: +30
- Config: +20
- Docs: +10
```

**Example**:
```
Files to fetch (sorted by priority):
1. src/api/controller.ts (+68 changes, core logic) → Score: 730
2. src/services/auth.ts (+47 changes, service) → Score: 510
3. tests/controller.test.ts (+23 changes, test) → Score: 260
4. src/utils/helper.ts (+28 changes, core) → Score: 330
```

---

## Method Selection Flow

```
START
  ↓
Check file exists locally?
  YES → Use LOCAL FILESYSTEM → SUCCESS
  NO → ↓

Check JetBrains MCP available?
  YES → Try JetBrains MCP
    SUCCESS → Done
    FAIL → ↓
  NO → ↓

Check GitHub API available?
  YES → Try GitHub API
    SUCCESS → Done
    FAIL → Skip file, log error
  NO → Skip file, log error

END
```

**Optimization**:
- Detect method once at start
- Use same method for all files (unless it fails)
- Only fallback on per-file errors

---

## Error Handling Strategy

**Graceful Degradation**:
- Continue fetching other files if one fails
- Report which files were skipped
- Note which method was used
- Track fallback attempts

**Error Types**:

1. **File Not Found** (any method):
   - Log: "⚠️ File not found: {path}"
   - Continue with next file
   - Include in errors array

2. **Permission Denied** (local):
   - Log: "⚠️ Permission denied: {path}"
   - Try next strategy
   - Include in errors array

3. **Rate Limit** (GitHub API):
   - Log: "⚠️ Rate limit reached, skipping remaining files"
   - Stop fetching
   - Report partial results

4. **Network Error** (GitHub API):
   - Log: "⚠️ Network error for {path}"
   - Try next file
   - Include in errors array

5. **Authentication Error** (GitHub API):
   - Log: "❌ GitHub authentication required"
   - Skip GitHub method entirely
   - Try JetBrains or report no method available

---

## Output Format

**Success Response**:
```json
{
  "files_fetched": [
    {
      "path": "src/api/controller.ts",
      "content": "[full file content]",
      "lines": 245,
      "size_bytes": 8192,
      "method": "local"
    },
    {
      "path": "src/services/auth.ts",
      "content": "[full file content]",
      "lines": 180,
      "size_bytes": 6400,
      "method": "local"
    }
  ],
  "method_used": "local",
  "fallback_count": 0,
  "files_requested": 5,
  "files_fetched": 5,
  "files_skipped": 0,
  "errors": []
}
```

**Partial Success Response**:
```json
{
  "files_fetched": [
    {
      "path": "src/api/controller.ts",
      "content": "[full file content]",
      "lines": 245,
      "method": "github_api"
    }
  ],
  "method_used": "github_api",
  "fallback_count": 2,
  "files_requested": 3,
  "files_fetched": 1,
  "files_skipped": 2,
  "errors": [
    "File not found: src/missing.ts",
    "Permission denied: /restricted/file.ts"
  ]
}
```

**Failure Response**:
```json
{
  "files_fetched": [],
  "method_used": "none",
  "fallback_count": 3,
  "files_requested": 5,
  "files_fetched": 0,
  "files_skipped": 5,
  "errors": [
    "Local filesystem: files not found",
    "JetBrains MCP: not available",
    "GitHub API: not authenticated"
  ]
}
```

---

## Usage Examples

### Example 1: Deep Review Mode (fetch 10 files)

```markdown
Use lib/code-fetcher.md with configuration:

**Files to Fetch** (sorted by changes descending):
- priority 1: src/api/controller.ts (+68 changes)
- priority 2: src/services/auth.ts (+47 changes)
- priority 3: src/utils/helper.ts (+28 changes)
- priority 4: tests/controller.test.ts (+23 changes)
- priority 5: src/models/user.ts (+15 changes)
- priority 6: src/middleware/auth.ts (+12 changes)
- priority 7: tests/auth.test.ts (+10 changes)
- priority 8: src/config/database.ts (+8 changes)
- priority 9: docs/API.md (+5 changes)
- priority 10: README.md (+3 changes)

**Mode**: deep

**Context** (for GitHub API fallback):
- repository: owner/repo
- branch: feature/auth-refactor
- commit_sha: abc123def456

**Limits**:
- max_files: 10
- max_lines_per_file: 500

**Expected**: 10 files fetched via local filesystem
```

### Example 2: Quick Review Mode (fetch 3 files)

```markdown
Use lib/code-fetcher.md with configuration:

**Files to Fetch** (top 3 only):
- priority 1: src/api/controller.ts (+68 changes)
- priority 2: src/services/auth.ts (+47 changes)
- priority 3: src/utils/helper.ts (+28 changes)

**Mode**: quick

**Context**:
- repository: owner/repo
- commit_sha: abc123def456

**Limits**:
- max_files: 3

**Expected**: 3 files fetched, fastest method
```

### Example 3: Remote PR Review (GitHub API)

```markdown
Use lib/code-fetcher.md with configuration:

**Files to Fetch**:
- priority 1: src/api/controller.ts
- priority 2: src/services/auth.ts

**Mode**: quick

**Context** (GitHub API required):
- repository: external/public-repo
- branch: main
- commit_sha: def789abc123

**Note**: Local files not available, will use GitHub API

**Expected**: 2 files fetched via GitHub API
```

---

## Implementation Notes

**For Command Developers**:

1. **Always provide file priorities**: Sort files by importance before calling library
2. **Include repository context**: Even if using local, include for fallback
3. **Handle partial results**: Library may fetch fewer files than requested
4. **Report method used**: Inform user which method was used (transparency)
5. **Respect limits**: Don't request more files than specified in mode

**Performance Considerations**:

- Local filesystem: ~10ms per file
- JetBrains MCP: ~50ms per file
- GitHub API: ~200-500ms per file

**For deep mode (10 files)**:
- Local: ~100ms total
- GitHub API: ~2-5 seconds total

**Token Efficiency**:
- This library is ~80 lines (documentation)
- Replaces ~145 lines in review.md
- 45% reduction in duplicated code
- Reusable across other commands (future)

---

## Related Documentation

- **Review Command**: `schovi/commands/review.md` (primary user)
- **Phase Template**: `schovi/lib/phase-template.md`
- **Library System**: `schovi/lib/README.md`
