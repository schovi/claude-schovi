#!/usr/bin/env python3
"""Deterministic validator for the workflow plugin's folder-based framework.

Layout: workflow/{draft,ready,in-progress,blocked,done}/NNN-slug.md — the
folder IS the status. Task file: first line `# NNN — Title`, then optional
`priority:` / `gate:` / `done:` metadata lines.

Usage: validate_workflow.py [repo-root]
Exit codes: 0 = valid, 1 = structural issues (one per line on stderr),
2 = framework missing or legacy layout detected (migration needed).
"""
import re
import sys
from pathlib import Path

SECTIONS = ["draft", "ready", "in-progress", "blocked", "done"]
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)[^)]*\)")


def pad(task_id):
    return str(task_id).zfill(3)


def parse_meta(lines):
    meta = {}
    for line in lines[1:10]:
        match = re.match(r"^(priority|depends|gate|done):\s*(.+?)\s*$", line.strip())
        if match:
            meta[match.group(1)] = match.group(2)
    return meta


def parse_depends(value):
    """Return (ids, ok): comma-separated integer task IDs, ok=False on bad format."""
    ids = []
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if not part.isdigit():
            return [], False
        ids.append(int(part))
    return ids, True


def has_acceptance(text):
    match = re.search(r"^##\s+Acceptance criteria\s*$", text, re.M)
    if not match:
        return False
    rest = text[match.end():]
    cut = re.search(r"^##\s+", rest, re.M)
    return bool((rest[: cut.start()] if cut else rest).strip())


def observable_gate(gate):
    gate = (gate or "").strip().lower()
    return len(gate) > 3 and gate[0] not in "<[" and gate not in {"tbd", "todo", "none", "unknown"}


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    workflow = root / "workflow"

    if not all((workflow / s).is_dir() for s in SECTIONS):
        if (workflow / "board.md").exists():
            print("LEGACY: workflow/board.md layout found — run the framework-check migration to status folders", file=sys.stderr)
        elif (root / "docs" / "board.md").exists():
            print("LEGACY: docs/board.md exists — run the framework-check migration", file=sys.stderr)
        else:
            print("MISSING: no workflow/ status folders — run /workflow:framework-init", file=sys.stderr)
        sys.exit(2)

    issues = []
    if not (workflow / "AGENTS.md").exists():
        issues.append("workflow/AGENTS.md: repo contract is missing")
    status_script = workflow / "status"
    if not status_script.exists():
        issues.append("workflow/status: board view script is missing")
    elif not (status_script.stat().st_mode & 0o111):
        issues.append("workflow/status: not executable (chmod +x)")

    seen = {}
    depends_edges = []
    for section in SECTIONS:
        for path in sorted((workflow / section).glob("*")):
            rel = path.relative_to(root)
            if path.name == ".gitkeep":
                continue
            if path.suffix != ".md" or path.is_dir():
                issues.append(f"{rel}: only NNN-slug.md task files belong in status folders")
                continue
            match = re.match(r"^(\d+)-[a-z0-9][a-z0-9-]*\.md$", path.name)
            if not match:
                issues.append(f"{rel}: task filename must be NNN-slug.md")
                continue
            task_id = int(match.group(1))
            if task_id in seen:
                issues.append(f"{rel}: duplicate task {pad(task_id)} (also in {seen[task_id]})")
            seen.setdefault(task_id, section)

            text = path.read_text(encoding="utf-8")
            lines = text.splitlines()
            if not lines or not re.match(rf"^#\s+{pad(task_id)}\s+[—-]\s+\S", lines[0]):
                issues.append(f"{rel}: first line must be '# {pad(task_id)} — Title'")
            if text.startswith("---"):
                issues.append(f"{rel}: task files must not use YAML frontmatter")
            if re.search(r"^status\s*:", text, re.I | re.M):
                issues.append(f"{rel}: status is the folder, never a line in the file")

            meta = parse_meta(lines)
            if section == "ready":
                if not meta.get("priority", "").isdigit():
                    issues.append(f"{rel}: ready task needs an integer 'priority:' line (sparse, lowest = next)")
            if section in ("ready", "in-progress") and not has_acceptance(text):
                issues.append(f"{rel}: {section} task needs a non-empty '## Acceptance criteria' section")
            if section == "blocked" and not observable_gate(meta.get("gate")):
                issues.append(f"{rel}: blocked task needs an observable 'gate:' line")
            if "depends" in meta:
                dep_ids, ok = parse_depends(meta["depends"])
                if not ok:
                    issues.append(f"{rel}: 'depends:' must be comma-separated task IDs (e.g. depends: 041, 043)")
                elif task_id in dep_ids:
                    issues.append(f"{rel}: task cannot depend on itself")
                else:
                    depends_edges.append((rel, task_id, dep_ids))
            if section == "done" and not DATE.match(meta.get("done", "")):
                issues.append(f"{rel}: done task needs a 'done: YYYY-MM-DD' line")

            body = re.sub(r"```.*?```", "", text, flags=re.S)
            for _, target in LINK.findall(body):
                if target.startswith(("#", "/")) or re.match(r"^[a-z][a-z\d+.-]*:", target, re.I):
                    continue
                local = target.split("#")[0].split("?")[0]
                if local and not (path.parent / local).exists():
                    issues.append(f"{rel}: broken local link {target}")

    # ponytail: unknown-ID + self-ref only; dependency cycles left to /work's gate, which just refuses to start
    for rel, _, dep_ids in depends_edges:
        for dep in dep_ids:
            if dep not in seen:
                issues.append(f"{rel}: 'depends:' references unknown task {pad(dep)}")

    highest = max(seen, default=0)
    counter = workflow / "next-task-id"
    if not counter.exists():
        issues.append("workflow/next-task-id: required task ID counter is missing")
    else:
        raw = counter.read_text(encoding="utf-8").strip()
        if not raw.isdigit():
            issues.append("workflow/next-task-id: must contain one integer")
        elif int(raw) <= highest:
            issues.append(f"workflow/next-task-id: {int(raw)} must be greater than highest known task ID {highest}")

    if issues:
        print(f"Workflow validation failed with {len(issues)} issue(s):", file=sys.stderr)
        for issue in issues:
            print(f"- {issue}", file=sys.stderr)
        sys.exit(1)
    print("Workflow validation passed.")


if __name__ == "__main__":
    main()
