#!/usr/bin/env python3
"""Reject workflow skill trigger text that can capture unrelated requests."""

import re
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
SKILL_PATHS = {
    name: REPOSITORY_ROOT / "plugins" / "workflow" / "skills" / name / "SKILL.md"
    for name in ("framework-init", "work", "groom", "status")
}
FRAMEWORK_INIT_CODEX_CONFIG_PATH = (
    REPOSITORY_ROOT / "plugins" / "workflow" / "skills" / "framework-init" / "agents" / "openai.yaml"
)

FORBIDDEN_PHRASES = {
    "asks for the next task",
    "any small ad-hoc ask",
    "hands an implementation task",
    "hands a fuzzy ask",
    "refine this task",
    "status across my projects",
    "what should i work on",
    "what's blocked",
    "another workflow skill finds no workflow/agents.md",
}
FORBIDDEN_AUTO_INIT_PATTERN = re.compile(
    r"\b(?:automatically\s+)?(?:route|dispatch|hand\s+off|handoff|continue|switch)\b"
    r".{0,60}/workflow:framework-init",
    re.DOTALL,
)


def parse_frontmatter(path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---(?:\n|$)", text, re.DOTALL)
    if not match:
        raise ValueError("missing YAML frontmatter")

    fields = {}
    current_key = None
    for line in match.group(1).splitlines():
        field = re.match(r"^([\w-]+):\s*(.*)$", line)
        if field:
            current_key, value = field.groups()
            fields[current_key] = (
                "" if re.fullmatch(r"[>|][+-]?", value) else value.strip().strip("\"'")
            )
        elif current_key and line[:1].isspace():
            fields[current_key] = f"{fields[current_key]} {line.strip()}".strip()

    return fields, text


def parse_nested_yaml_scalars(path):
    fields = {}
    current_section = None

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        field = re.match(r"^(\s*)([\w-]+):\s*(.*?)\s*$", line)
        if not field:
            raise ValueError(f"unsupported YAML line: {line}")

        indentation, key, value = field.groups()
        if not indentation:
            current_section = key if not value else None
            if value:
                fields[key] = value.strip().strip("\"'")
        elif current_section and value:
            fields[f"{current_section}.{key}"] = value.strip().strip("\"'")

    return fields


def has_exclusion_word(description):
    return any(marker in description for marker in ("do not", "don't", "not use", "exclude", "skip"))


def has_initialized_repository_constraint(description):
    has_contract = "workflow/agents.md" in description
    requires_initialized = re.search(r"\binitialized\b", description) is not None
    requires_existing_contract = "workflow/agents.md exists" in description
    return has_contract and (requires_initialized or requires_existing_contract)


def main():
    problems = []
    parsed = {}

    try:
        codex_config = parse_nested_yaml_scalars(FRAMEWORK_INIT_CODEX_CONFIG_PATH)
    except (OSError, ValueError) as error:
        problems.append(
            f"{FRAMEWORK_INIT_CODEX_CONFIG_PATH.relative_to(REPOSITORY_ROOT)}: {error}"
        )
    else:
        if codex_config.get("policy.allow_implicit_invocation", "").lower() != "false":
            problems.append(
                "framework-init: Codex policy must set policy.allow_implicit_invocation: false"
            )

    for name, path in SKILL_PATHS.items():
        try:
            fields, text = parse_frontmatter(path)
        except (OSError, ValueError) as error:
            problems.append(f"{path.relative_to(REPOSITORY_ROOT)}: {error}")
            continue
        parsed[name] = (fields, text)

    if "framework-init" in parsed:
        fields, _ = parsed["framework-init"]
        description = fields.get("description", "").lower()
        if "explicit" not in description or "only" not in description:
            problems.append("framework-init: description must say that invocation is explicit-only")

    for name in ("work", "groom", "status"):
        if name not in parsed:
            continue
        fields, _ = parsed[name]
        description = fields.get("description", "").lower()
        if not has_initialized_repository_constraint(description):
            problems.append(
                f"{name}: description must require an initialized repo with workflow/AGENTS.md"
            )
        if "generic" not in description or not has_exclusion_word(description):
            problems.append(f"{name}: description must exclude generic requests")

    for name, (_, text) in parsed.items():
        normalized_text = text.lower().replace("`", "")
        for phrase in sorted(FORBIDDEN_PHRASES):
            if phrase in normalized_text:
                problems.append(f'{name}: remove broad or auto-init trigger text "{phrase}"')
        if name != "framework-init" and FORBIDDEN_AUTO_INIT_PATTERN.search(normalized_text):
            problems.append(f"{name}: missing framework state must not dispatch to framework-init")

    for problem in problems:
        print(f"PROBLEM: {problem}", file=sys.stderr)
    if problems:
        return 1

    print("workflow skill trigger policy is valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
