# Workflow Contract — <project>

Read by the `workflow` plugin skills (`/workflow:groom`, `/workflow:work`, `/workflow:batch-work`) before acting. This file holds repo-specific facts only; the process lives in the plugin. Keep it short and current.

## Project

<One-liner used to brief subagents: what the app is, stack, where sources and docs live.>

## Validation

```bash
# targeted, during implementation
<command, e.g. npx vitest run <file>>

# full gate, before every commit with non-trivial changes
<commands, e.g. npm run typecheck && npm run build && npm run test — as separate steps>
```

Never gate a commit on a piped test run — run each check as its own step and chain the commit on its exit status. Build green is not test green.

## Verify mapping

Extra gates `/work` runs before the completion commit, by touched paths. Repo-local skills; delete rows that don't apply.

| Paths touched | Run |
|---|---|
| <glob, e.g. src/components/**> | </repo-verify-skill> |

## Doc routing

Read the doc leaf before editing mapped paths — behavior and invariants live in docs, not code. Use code search to locate, not to learn behavior.

| If you'll edit | Read |
|---|---|
| <paths> | <doc leaf> |

- Doc style rules: <docs/style.md, or "none">
- Decision log: <docs/decisions.md with D<N> handles, or "none"> (used by `/workflow:decision`)

## Local notes

<Anything else the loop must respect: design-system skill to invoke first, balance changelog, repo agents like test-writer, autonomy limits. Delete if empty.>
