TYPE: FEATURE
PACKAGE: stabilize_bookmark_panel_empty_state_copy

GOAL:

Tighten the Bookmarks panel empty-state copy so it still reads clearly now that the bookmark write-and-read loop is real.

This should stay narrow:
do not add new data,
do not change the backend or preload path,
and only adjust wording that now reads awkwardly or underspecified in the empty Bookmarks state.

CONTEXT:

- The desktop bookmark flow now performs a real write and then re-reads persisted session state.
- The bookmark loop is machine-verified at the model level.
- The Bookmarks panel still uses the empty-state line `No bookmarks yet. Drop one to prove the loop.`
- That wording may now read slightly off relative to the more concrete state of the desktop shell.
- This package should remain display-only and should not broaden the session model.

REQUIREMENTS:

1. Keep the change narrow and observable.
2. Do not add new backend or preload architecture.
3. Do not introduce new session values.
4. Adjust only the empty-state wording if it improves accuracy or readability.
5. Do not refactor unrelated layout or styling.
6. Update focused tests only where needed.
7. Update state files at the end.

TASK:

1. Read the current Bookmarks panel empty-state copy in the renderer.
2. Decide whether a wording-only adjustment is needed to better match the current real bookmark loop.
3. Make the smallest wording adjustment needed, if any.
4. Update only the minimum focused test/assertion surface needed.
5. Update state files at the end.

FILES TO MODIFY:

- renderer/session-facing files only as needed for the narrow copy change
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
2. Review the changed files and confirm the package only tightens the Bookmarks empty-state wording if needed.
3. Confirm no new session values, backend logic, or preload changes were introduced.
4. Confirm no unrelated layout or styling refactor was introduced.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changes are limited to the expected renderer/test/state files.
6. Failure case: if the package adds new data or new display rows, the change is too broad.
7. Failure case: if the package changes layout/styling substantially instead of only tightening copy, the package is incomplete.

PASS CRITERIA:

- Bookmarks empty-state wording is now accurate and readable for the current UI
- `npm run verify` passes
- the UI change remains narrow
- no unrelated runtime or UI changes were introduced

FAIL CRITERIA:

- the updated wording still reads awkwardly or misleadingly for the current UI
- new data or display rows are introduced
- the renderer path is broadened unnecessarily
- unrelated files or behaviors are changed
- `npm run verify` fails

STATE UPDATES:

- `package_plan.md` -> record the completed copy-tightening step and current next package status
- `snapshot.md` -> reflect that the nearby renderer copy now better matches the visible values if the package passes
- `next-action.md` -> point to the next narrow feature package after this copy step
- `handoff.md` -> record the completed result of this FEATURE package

NOTES:

- Keep this boring on purpose.
- The goal is not polish for its own sake; it is keeping the UI accurate as small real values accumulate.
- Prefer the fewest wording changes needed.