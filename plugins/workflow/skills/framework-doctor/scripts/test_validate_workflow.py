#!/usr/bin/env python3
"""Fixture tests for validate_workflow.py. Run: python3 test_validate_workflow.py

Builds throwaway repos, runs the validator against each, and asserts the exit
code (0 valid, 1 structural issue, 2 missing/legacy). No framework, no fixtures
dir — each case mutates a minimal valid board.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "validate_workflow.py"
SCAFFOLD_DIRS = ["draft", "ready", "in-progress", "blocked", "done", "reports"]
READY_OK = "# 010 — A\n\npriority: 10\n\n## Acceptance criteria\n- x\n"


def scaffold(tmp):
    root = Path(tmp)
    wf = root / "workflow"
    for name in SCAFFOLD_DIRS:
        (wf / name).mkdir(parents=True)
    (wf / "AGENTS.md").write_text("contract\n")
    status = wf / "status"
    status.write_text("#!/usr/bin/env python3\n")
    status.chmod(0o755)
    (wf / "TEMPLATE.md").write_text("# NNN — Title\n")
    (wf / "next-task-id").write_text("100\n")
    return root, wf


def task(wf, section, name, body):
    (wf / section / name).write_text(body)


def case(label, mutate, expect):
    with tempfile.TemporaryDirectory() as tmp:
        root, wf = scaffold(tmp)
        mutate(wf)
        proc = subprocess.run([sys.executable, str(SCRIPT), str(root)], capture_output=True, text=True)
        ok = proc.returncode == expect
        print(f"{'PASS' if ok else 'FAIL'}: {label} (exit {proc.returncode}, want {expect})")
        if not ok and proc.stderr:
            print("  " + proc.stderr.strip().replace("\n", "\n  "))
        return ok


def ready(name, body):
    return lambda wf: task(wf, "ready", name, body)


def main():
    def cycle(wf):
        task(wf, "ready", "010-a.md", "# 010 — A\n\npriority: 10\ndepends: 020\n\n## Acceptance criteria\n- x\n")
        task(wf, "ready", "020-b.md", "# 020 — B\n\npriority: 20\ndepends: 010\n\n## Acceptance criteria\n- x\n")

    results = [
        case("empty board is valid", lambda wf: None, 0),
        case("valid ready task", ready("010-a.md", READY_OK), 0),
        case("ready without priority fails", ready("010-a.md", "# 010 — A\n\n## Acceptance criteria\n- x\n"), 1),
        case("ready without acceptance fails", ready("010-a.md", "# 010 — A\n\npriority: 10\n"), 1),
        case("frontmatter fails", ready("010-a.md", "---\nx: 1\n---\n# 010 — A\n\npriority: 10\n\n## Acceptance criteria\n- x\n"), 1),
        case("status line fails", ready("010-a.md", "# 010 — A\n\npriority: 10\nstatus: ready\n\n## Acceptance criteria\n- x\n"), 1),
        case("bad filename fails", ready("ready-a.md", READY_OK), 1),
        case("self-dependency fails", ready("010-a.md", "# 010 — A\n\npriority: 10\ndepends: 010\n\n## Acceptance criteria\n- x\n"), 1),
        case("unknown dependency fails", ready("010-a.md", "# 010 — A\n\npriority: 10\ndepends: 999\n\n## Acceptance criteria\n- x\n"), 1),
        case("dependency cycle fails", cycle, 1),
        case("legacy-named done task passes", lambda wf: task(wf, "done", "M12-legacy.md", "# M12: Legacy thing\n\ndone: 2026-01-02\n"), 0),
        case("done without date fails", lambda wf: task(wf, "done", "009-old.md", "# 009 — Old\n"), 1),
        case("missing TEMPLATE.md fails", lambda wf: (wf / "TEMPLATE.md").unlink(), 1),
        case("missing reports/ fails", lambda wf: (wf / "reports").rmdir(), 1),
        case("missing status folder is missing/legacy (exit 2)", lambda wf: shutil.rmtree(wf / "ready"), 2),
    ]

    print(f"\n{sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
