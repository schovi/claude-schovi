# Codex agent parity

Repo-local subagents need paired vendor definitions — Claude Code reads Markdown with YAML frontmatter, Codex reads standalone TOML, and a symlink cannot bridge the formats. (Skills don't have this problem: they're shared via a `.codex/skills` or `.agents/skills` symlink to `.claude/skills`.)

| Behavior | Claude Code | Codex |
|---|---|---|
| Location | `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` |
| Agent name | YAML `name` | TOML `name` |
| Delegation description | YAML `description` | TOML `description` |
| Behavioral prompt | Markdown body | TOML `developer_instructions` |
| Read/write boundary | YAML `tools` / `disallowedTools` | TOML `sandbox_mode` |
| Model choice | YAML `model` | omit — inherit |

Rules for generating or updating a twin:

- Keep `name`, `description`, and the behavioral prompt semantically identical; copy the prompt verbatim into `developer_instructions` (triple-quoted string). `@path` is NOT expanded by Codex — inline any content the Claude version pulls in by reference.
- Read-only Claude tool set (Read/Glob/Grep) → `sandbox_mode = "read-only"`. Agent that writes repo files → `sandbox_mode = "workspace-write"`. Sandbox modes are filesystem boundaries, not tool allowlists — go broader only for a concrete need.
- Omit Claude model aliases (`haiku`, `sonnet`) from the TOML.
- Create or update both files in the same change; deleting an agent deletes both.

Example pair (`test-writer`):

```toml
name = "test-writer"
description = "Writes or extends test classes in batch. The dispatch prompt must name the code under test, the pattern to follow, and any relevant doc leaf."
sandbox_mode = "workspace-write"
developer_instructions = """
<the Claude agent's Markdown body, copied verbatim>
"""
```

Validate after changes:

```bash
python3 -c 'import pathlib, tomllib; [tomllib.loads(p.read_text()) for p in pathlib.Path(".codex/agents").glob("*.toml")]'
```

Codex picks up `.codex/agents/` changes on a new task/restart; Claude Code loads agent definitions at session start.
