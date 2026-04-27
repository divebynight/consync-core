# Closeout Procedure

Use this procedure after human approval of completed work to verify closeout readiness for the current repo state.

This workflow is for final verification and commit preparation. It is not for drafting new work, broad cleanup, or bypassing failed checks.

## When To Use It

Use this workflow when:

- feature, UI, process, docs, or test work is implemented
- the human has approved the work for closeout review
- the next step is to verify tests, docs, integrity, and commit readiness

Do not use it to force a closeout when the repo is still mid-implementation.

## Inputs

Start from current repo truth:

1. `git status --short`
2. `git diff --stat`
3. changed files themselves
4. `.consync/state/snapshot.md`
5. `.consync/state/next-action.md`
6. `.consync/state/handoff.md`

## Required Workflow

1. Inspect current git diff and summarize files changed.
2. Classify the change as one of:
   - `UI`
   - `feature`
   - `process`
   - `docs`
   - `tests`
   - `mixed`
3. Identify the smallest relevant test set for the changed surfaces.
4. Run only the smallest appropriate tests.
5. If new behavior has no test, report that clearly instead of inventing coverage.
6. Check whether `.consync/docs/03_work-log.md` needs a new append-only entry.
7. Append a concise work-log entry only if user-facing feature behavior changed.
8. Run available Consync integrity checks.
9. Do not ignore or bypass failing tests or integrity checks.
10. Review changed files and confirm the intended closeout surface before staging.
11. Stage only the intended closeout changes.
12. Prepare an accurate commit message grounded in the diff, tests run, and work-log entry if present.
13. Commit only if:
    - relevant tests pass
    - integrity checks pass
    - docs and work-log are updated if needed
14. Make the git commit as the final closeout step.
15. Do not push.

## Integrity Checks

If available, run:

- `npm run check:state-preflight`
- `npm run check:state-postflight`

If a package or trigger level names additional required verification, include it in the closeout review.

## Work-Log Rule

Check `.consync/docs/03_work-log.md`.

Append a new entry only when implemented behavior changed in a way a future operator or user would care about.

Do not:

- rewrite old entries
- restructure the doc
- add an entry for code-only cleanup with no behavior change

## Commit Rule

Prepare a commit message only after verification is complete.

Successful closeout must persist the completed work with a git commit after verification and work-log/state updates are complete.

A closeout is not complete until intended changes are committed.

The message should match:

- what actually changed
- which surfaces were verified
- whether the work-log changed

If verification is incomplete or failing, stop at a closeout report and do not stage or commit.

## Output Format

Return:

- change classification
- files changed summary
- tests run
- missing coverage, if any
- integrity check results
- work-log action taken or skipped
- commit readiness: `READY` or `NOT READY`
- proposed commit message, only if `READY`

## Guardrails

- Do not invent passing results.
- Do not hide failing checks.
- Do not rewrite process docs broadly.
- Do not push.
- Do not close out work that the human has not approved.
