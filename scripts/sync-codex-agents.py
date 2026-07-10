#!/usr/bin/env python3
"""Generate Codex agent TOML twins from plugin AGENT.md files and register
them globally by symlinking into ~/.codex/agents/.

Codex plugins cannot ship registered agents yet (plugin.json has a `skills`
key but no `agents` key), so this bridges the gap: the AGENT.md stays the
single source of truth, the TOML is a generated artifact, and the global
symlink makes the agent spawnable in every Codex session. Idempotent —
rerun after adding or editing an agent.

Usage: scripts/sync-codex-agents.py [--check]
  --check  validate and report only; write nothing (for CI/pre-commit use)
"""
import re
import sys
import tomllib
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CODEX_AGENTS = Path.home() / ".codex" / "agents"
GENERATED_MARK = "# Generated from AGENT.md by scripts/sync-codex-agents.py — edit AGENT.md instead"


def parse_agent_md(path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        sys.exit(f"{path}: no YAML frontmatter")
    frontmatter, body = match.groups()

    fields = {}
    key = None
    for line in frontmatter.splitlines():
        item = re.match(r"^\s*-\s*(.+)$", line)
        if item and key:
            fields.setdefault(key, []).append(item.group(1).strip().strip('"'))
            continue
        pair = re.match(r"^([\w-]+):\s*(.*)$", line)
        if pair:
            key, value = pair.group(1), pair.group(2).strip()
            if value.startswith("["):
                fields[key] = [v.strip().strip('"\'') for v in value.strip("[]").split(",") if v.strip()]
            elif value:
                fields[key] = value
            else:
                fields[key] = []
    return fields, body.strip()


def toml_escape_single_line(value):
    return value.replace("\\", "\\\\").replace('"', '\\"')


def generate_toml(fields, body):
    tools = fields.get("allowed-tools", [])
    mcp_only = tools and all(t.startswith("mcp__") for t in tools)
    if "'''" in body:
        sys.exit(f"agent {fields['name']}: body contains ''' — cannot embed as TOML literal string")

    lines = [
        GENERATED_MARK,
        f'name = "{toml_escape_single_line(fields["name"])}"',
        f'description = "{toml_escape_single_line(fields["description"])}"',
        f'sandbox_mode = "{"read-only" if mcp_only else "workspace-write"}"',
        "",
        "developer_instructions = '''",
        body,
        "'''",
    ]
    if not mcp_only:
        # network for gh CLI and API fetches; MCP servers run outside the sandbox and need nothing.
        # Table header must come after every root-table key.
        lines += ["", "[sandbox_workspace_write]", "network_access = true"]
    return "\n".join(lines) + "\n"


def main():
    check_only = "--check" in sys.argv
    generated, linked, problems = [], [], []

    for agent_md in sorted(REPO.glob("plugins/*/agents/*/AGENT.md")):
        fields, body = parse_agent_md(agent_md)
        if "name" not in fields or "description" not in fields:
            problems.append(f"{agent_md}: frontmatter needs name and description")
            continue
        toml_path = agent_md.parent / "agent.toml"
        content = generate_toml(fields, body)
        tomllib.loads(content)

        existing = toml_path.read_text(encoding="utf-8") if toml_path.exists() else None
        if existing != content:
            if check_only:
                problems.append(f"{toml_path.relative_to(REPO)}: stale or missing (rerun without --check)")
            else:
                toml_path.write_text(content, encoding="utf-8")
                generated.append(toml_path.relative_to(REPO))

        link = CODEX_AGENTS / f"{fields['name']}.toml"
        if not check_only:
            CODEX_AGENTS.mkdir(parents=True, exist_ok=True)
            if link.is_symlink() or link.exists():
                if link.resolve() == toml_path.resolve():
                    continue
                if link.is_symlink() and REPO in link.resolve().parents:
                    link.unlink()
                else:
                    problems.append(f"{link}: exists and is not ours — resolve manually")
                    continue
            link.symlink_to(toml_path)
            linked.append(link)

    if not check_only:
        for link in CODEX_AGENTS.glob("*.toml") if CODEX_AGENTS.exists() else []:
            if link.is_symlink() and REPO in Path(str(link.readlink())).parents and not link.resolve().exists():
                link.unlink()
                print(f"pruned stale link {link}")

    for path in generated:
        print(f"generated {path}")
    for link in linked:
        print(f"linked {link} -> {link.readlink()}")
    for problem in problems:
        print(f"PROBLEM: {problem}", file=sys.stderr)
    if not (generated or linked or problems):
        print("everything up to date")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
