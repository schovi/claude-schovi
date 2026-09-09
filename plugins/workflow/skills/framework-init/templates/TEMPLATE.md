# NNN — Title

priority: 20
depends: 041, 043
tags: api, ui-polish
model: sonnet
gate: <observable fact this waits on>
done: YYYY-MM-DD

Status is the folder this file sits in (`draft/`, `ready/`, `in-progress/`, `blocked/`, `done/`), never a line in the file. Metadata lines sit directly under the title; keep only the ones the current folder needs. No YAML frontmatter. Board: `./workflow/status`.

- `priority:` in `ready/` only. Sparse integers (10, 20, 30), lowest is next.
- `depends: NNN[, NNN]` optional, any folder. Task ids that should ship first. Most tasks have none.
- `tags: a, b` optional, any folder. Lowercase slugs for grouping and search; reuse the vocabulary `./workflow/status --tags` lists.
- `model: haiku|sonnet|opus` optional. The tier `/workflow:run` uses for this task's isolated worker. Set it only for mechanical work.
- `gate:` in `blocked/` only. The external fact this waits on.
- `done:` added on completion.

## What & why

2–6 lines: the outcome, the user-visible change, why now.

## Spec

Only what implementation needs: behavior, edge cases, the surfaces it touches, explicit exclusions.

## Acceptance criteria

- Observable checks, one per line. This is what done means.

## Open questions

Draft only: what must be answered before this can move to `ready/`. Delete when it moves.

## Notes

Optional, brief: surprises, follow-ups, decisions logged (`D<N>`). Not an execution log; git history is.
