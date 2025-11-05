# Work Folder Management Library

This library provides a comprehensive framework for managing the `.WIP/` folder structure used by all schovi commands.

## Purpose

The work folder system enables:

1. **Persistent State** - Work survives across sessions and context switches
2. **Progressive Workflows** - Commands build on each other's outputs
3. **Traceability** - Full history tracked in metadata and git
4. **Resumability** - Pause and continue large tasks
5. **Visibility** - Clear folder structure shows progress at a glance

## Files in This Library

### Core Documentation

#### `work-folder.md` - **Main Library**
Complete reference for work folder management including:
- Constants and conventions
- Core functions (identifier generation, metadata management, file operations)
- Integration patterns
- Error handling
- Testing checklist

**Use this when:** Implementing or modifying commands

---

#### `QUICK-REFERENCE.md` - **One-Page Cheat Sheet**
Concise quick reference with:
- Essential bash commands
- Integration steps checklist
- File structure overview
- Common patterns
- Error templates

**Use this when:** You need a quick reminder while coding

---

#### `command-integration-guide.md` - **Integration Patterns**
Step-by-step guide for integrating work folders into commands:
- Phase-by-phase integration template
- Command-specific notes (analyze, plan, implement, debug, spec)
- Bash command reference
- Testing scenarios
- Migration strategy

**Use this when:** Writing new commands or updating existing ones

---

#### `EXAMPLES.md` - **Practical Examples**
Complete, real-world examples showing:
- Analyze command with Jira issue
- Plan command with auto-detect
- Implement command with resume
- Debug command with error description
- Error handling scenarios
- Copy-paste snippets

**Use this when:** You want to see working examples before implementing

---

### Utilities

#### `work-folder-helpers.sh` - **Bash Helper Functions**
Reference implementations for:
- Identifier generation (Jira, GitHub, slug)
- Work folder operations (create, find, list)
- Metadata operations (read, update, validate)
- Git operations (branch extraction, commit tracking)
- Validation functions

**Use this when:** You need bash commands for common operations

---

#### `metadata-template.json` - **Metadata Schema**
JSON schema defining `.metadata.json` structure:
- Required fields
- Field types and formats
- Property descriptions
- Example values

**Use this when:** Creating or validating metadata

---

## Quick Start

### For Command Developers

**Step 1**: Read the quick reference
```bash
cat schovi/lib/QUICK-REFERENCE.md
```

**Step 2**: Check examples for your command type
```bash
# Find your command pattern
grep -A 20 "analyze command" schovi/lib/EXAMPLES.md
```

**Step 3**: Follow integration guide
```bash
# Read command-specific integration
cat schovi/lib/command-integration-guide.md
```

**Step 4**: Test your implementation
- Use examples as test cases
- Verify metadata structure against schema
- Check bash helpers for utility functions

### For Understanding the System

Read in this order:

1. **QUICK-REFERENCE.md** - Get overview and basic concepts
2. **EXAMPLES.md** - See real-world usage
3. **work-folder.md** - Deep dive into details
4. **command-integration-guide.md** - Learn integration patterns

## Folder Structure Explained

```
.WIP/                              # Base directory for all work
├── EC-1234-add-user-auth/         # Work folder (identifier-slug)
│   ├── .metadata.json             # State tracking
│   ├── 01-spec.md                 # Product spec (spec command)
│   ├── 02-analysis.md             # Technical analysis (analyze command)
│   ├── 03-plan.md                 # Implementation plan (plan command)
│   ├── 04-progress.md             # Progress tracking (implement command)
│   └── context/                   # Supporting materials
│       ├── wireframe.png
│       └── requirements.pdf
│
├── GH-123-fix-timeout/            # Bug fix workflow
│   ├── .metadata.json
│   ├── 02-debug.md                # Debug analysis (debug command)
│   ├── 03-plan.md                 # Fix plan
│   └── 04-progress.md
│
└── add-loading-spinner/           # Simple task
    ├── .metadata.json
    ├── 03-plan.md                 # Direct to plan
    └── 04-progress.md
```

## Integration Checklist

When adding work folder support to a command:

- [ ] Parse input (Jira, GitHub, description)
- [ ] Auto-detect or create work folder
- [ ] Load/create metadata
- [ ] Validate prerequisites
- [ ] Execute command logic
- [ ] Write numbered output file
- [ ] Update metadata
- [ ] Show user-friendly results

## Testing

### Test Commands

```bash
# Test work folder creation
/schovi:analyze TEST-001
ls -la .WIP/TEST-001*/
cat .WIP/TEST-001*/.metadata.json | jq .

# Test auto-detection
/schovi:plan  # Should find TEST-001 folder

# Test explicit input
/schovi:plan --input .WIP/TEST-001/02-analysis.md

# Test error handling
/schovi:plan TEST-999  # Should show clear error
```

### Validation

Check that your command:
1. Creates valid metadata (matches schema)
2. Writes to correct numbered file
3. Updates metadata after execution
4. Auto-detects work folder correctly
5. Shows clear errors with guidance
6. Handles existing folders gracefully

## Design Principles

### 1. Auto-detection First
Commands should find work folders automatically:
- Check git branch for identifier
- Search by Jira/GitHub ID
- List recent folders

Only require explicit input when auto-detection fails.

### 2. Fail Fast with Guidance
If prerequisites missing:
- Stop immediately
- Show clear error
- Suggest exact command to run
- Don't proceed with partial work

### 3. Idempotent Operations
Commands should be re-runnable:
- Overwrite existing outputs
- Update metadata, don't append
- Warn user about re-generation
- Same input = same output

### 4. Progressive Enhancement
Handle edge cases gracefully:
- Recreate corrupted metadata
- Infer state from existing files
- Support manual file edits
- Degrade gracefully

### 5. Visibility
Users should always know:
- Where outputs are saved
- What step they're on
- What to do next
- How to resume

## Common Issues and Solutions

### Issue: Work folder not found

**Solution:**
- Check git branch matches expected pattern
- Verify identifier extraction regex
- Search with wildcard: `find .WIP -name "EC-1234*"`
- Show clear error with creation command

### Issue: Metadata corrupted

**Solution:**
- Read existing files (01-spec.md, 02-analysis.md, etc.)
- Infer workflow.completed from files present
- Recreate metadata from inference
- Warn user: "Metadata recreated"

### Issue: Wrong workflow step order

**Solution:**
- Validate prerequisites before execution
- Check workflow.completed array
- Block if prerequisite missing
- Show: "Run /schovi:analyze first"

### Issue: Multiple work folders for same identifier

**Solution:**
- Use most recent (ls -dt)
- Or ask user which to use
- Show list with timestamps
- Suggest cleanup of old folders

## Performance Considerations

### Context Management

For large tasks:
- Load only current phase from plan
- Reference previous phases by summary
- Use subagents to fetch specific past context
- Keep metadata lightweight (summaries, not full content)

### File Size

Keep output files focused:
- Metadata: ~1-2KB (summaries only)
- Spec: ~5-10KB (high-level)
- Analysis: ~10-20KB (detailed but focused)
- Plan: ~5-15KB (actionable tasks)
- Progress: ~3-10KB (status updates)

### Search Performance

Optimize folder lookups:
- Exact match first
- Wildcard search second
- Recent folders last resort
- Cache git branch extraction

## Future Enhancements

Potential improvements:

1. **Work folder cleanup**
   - Archive completed work
   - Delete abandoned folders
   - Compress old context/

2. **Cross-folder references**
   - Link related work folders
   - Track dependencies between tasks
   - Show dependency graph

3. **Enhanced metadata**
   - Estimated time remaining
   - Complexity score
   - Related tickets/PRs

4. **Workspace management**
   - List all active work
   - Show progress dashboard
   - Filter by status/type

5. **Migration tools**
   - Convert old outputs to work folders
   - Import from external sources
   - Export for sharing

## Contributing

When modifying this library:

1. Update all relevant files (not just one)
2. Add examples for new patterns
3. Update quick reference
4. Test with real commands
5. Document breaking changes

## Support

For questions or issues:
- Check EXAMPLES.md for similar scenarios
- Review command-integration-guide.md for patterns
- Refer to work-folder.md for detailed specs
- Test with bash helpers for validation

## Version History

- **v1.0** (2025-01-15) - Initial release
  - Core folder structure
  - Metadata schema
  - Integration patterns
  - Command examples
  - Helper utilities

---

**Quick Links:**
- [Quick Reference](./QUICK-REFERENCE.md) - One-page cheat sheet
- [Examples](./EXAMPLES.md) - Real-world usage
- [Integration Guide](./command-integration-guide.md) - Implementation patterns
- [Full Library](./work-folder.md) - Complete reference
- [Helpers](./work-folder-helpers.sh) - Bash utilities
- [Schema](./metadata-template.json) - Metadata structure
