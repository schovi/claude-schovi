# NNN — Title

priority: 20
gate: <observable fact this waits on>
done: YYYY-MM-DD

Status is the folder this file sits in (`draft/`, `ready/`, `in-progress/`, `blocked/`, `done/`) — never a line in the file. Metadata lines directly under the title, keep only the ones the current folder needs: `priority:` in ready (sparse integers — 10, 20, 30 — lowest is next), `gate:` in blocked, `done:` added on completion. No YAML frontmatter. View the board with `./workflow/status`.

## What & why

2–6 lines: the outcome, the user-visible change, why now. Tiny tasks can stop after Acceptance criteria.

## Spec

Only what implementation needs: exact behavior, edge cases, files/areas touched. Pseudo-code welcome. Name the doc leaves that apply (see `workflow/AGENTS.md` doc routing).

## Acceptance criteria

- Observable checks, one per line. These are what "done" means. Required to leave `draft/`.

## Notes

Optional, brief: surprises, follow-ups, decisions logged (`D<N>`). Not an execution log — git history is the execution log.
