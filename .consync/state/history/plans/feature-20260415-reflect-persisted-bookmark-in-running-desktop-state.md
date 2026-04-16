TYPE: FEATURE
PACKAGE: reflect_persisted_bookmark_in_running_desktop_state

GOAL:

Reflect the newly persisted bookmark in the running desktop state through the real session read path so the app no longer relies on write-only success to show bookmark updates.

This package should keep the write loop narrow while proving that the running desktop shell can re-read the persisted bookmark state it just wrote.

CONTEXT:

- Drop Bookmark now persists a real bookmark into the current session artifact through the existing desktop path.
- The desktop renderer already shows Session and Bookmarks state.
- The next risk is leaving the running UI dependent on optimistic local state instead of the persisted session read path.
- We still do not want to broaden into edit/delete/history/session switching.

REQUIREMENTS:

1. Keep this package narrow and architectural.
2. Reuse the existing renderer -> preload -> backend flow.
3. Reflect the persisted bookmark through the real session read path.
4. Do not introduce additional mutation paths.
5. Do not implement edit/delete/history/session switching.
6. Prefer the smallest read-after-write behavior that proves the running state stays anchored to persisted session data.
7. Update state files at the end.

TASK:

1. Read the current renderer bookmark update flow after the real write package.
2. Identify whether the running desktop state is already re-reading persisted session state or still relying on narrower assumptions.
3. Add the smallest change needed so the running state reflects the persisted bookmark through the real session read path.
4. Add or update only the minimum focused test surface needed.
5. Keep the package narrow and update state files at the end.

DO NOT:

- implement bookmark editing
- implement bookmark deletion
- implement loading or switching old sessions
- redesign the session model broadly
- add multiple mutation paths
- broaden into full end-to-end UI automation

FILES TO MODIFY:

- feature/runtime files only as needed for the narrow running-state reflection path
- focused test files only as needed
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN GATE:
OPTIONAL

MANUAL VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Review the changed files and confirm the running desktop state now reflects the persisted bookmark through the real session read path.
3. Confirm the package reuses the renderer -> preload -> backend architecture rather than introducing a side path.
4. Confirm no edit/delete/history/session-switching behavior was introduced.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changes are limited to the expected feature, focused test, and state files.
6. Failure case: if the package adds another mutation path, the change is too broad.
7. Failure case: if the package broadens into general session-refresh infrastructure, the package is incomplete.

PASS CRITERIA:

- the running desktop state reflects the persisted bookmark through the real session read path
- `npm run verify` passes
- the change remains narrow
- no unrelated feature expansion was introduced

FAIL CRITERIA:

- the running state still depends on a detached or optimistic path instead of the persisted session read path
- multiple mutation paths are introduced
- the package expands into edit/delete/history/session loading
- unrelated renderer/runtime behavior changes
- `npm run verify` fails

STATE UPDATES:

- `package_plan.md` -> record this follow-up read-path package and current next step
- `snapshot.md` -> reflect that the write loop is now proven and the current focus is persisted-state reflection
- `next-action.md` -> point to the next narrow package after persisted-state reflection
- `handoff.md` -> record the completed result of this FEATURE package

NOTES:

- Keep this boring on purpose.
- The goal is to keep the desktop state anchored to real persisted data, not to build full bookmark UX.
- Prefer one explicit persisted-state reflection step over broader refresh infrastructure.