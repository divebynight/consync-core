TYPE: FEATURE
PACKAGE: render_new_session_value_in_session_panel

GOAL:

Render the newly exposed real session-facing value in the Session panel so the UI visibly reflects one more real backend signal.

This should stay narrow:
the value already exists in renderer-readable session state,
and this package should only surface it clearly in the existing Session panel.

CONTEXT:

- The current Session panel already shows one real file-backed value.
- The latest completed feature package exposed one more real value in renderer-readable session state.
- The bridge and preload path do not need to be broadened for this step.
- This package should prove the new value can be shown in the UI without widening the session model.

REQUIREMENTS:

1. Keep the change narrow and observable.
2. Do not add new backend or preload architecture unless required by a bug.
3. Render exactly one already-exposed real value.
4. Do not introduce multiple new session fields.
5. Do not broaden the session model beyond the current narrow slice.
6. Update focused tests only where needed.
7. Update state files at the end.

TASK:

1. Read the current renderer/session path and confirm which new real value is already available.
2. Render that value in the existing Session panel with minimal UI change.
3. Keep styling and wording consistent with the current panel structure.
4. Update only the minimum focused test/assertion surface needed.
5. Update state files at the end.

FILES TO MODIFY:

- renderer/session-facing files only as needed for the narrow display change
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
2. Review the changed files and confirm exactly one already-exposed real session value was rendered in the Session panel.
3. Confirm the change reuses the existing session state and panel structure instead of adding a new architecture path.
4. Confirm no unrelated UI or session-model refactor was introduced.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changes are limited to the expected renderer/test/state files.
6. Failure case: if the package renders more than one new value, the change is too broad.
7. Failure case: if the package broadens the session model instead of only displaying the existing new value, the package is incomplete.

PASS CRITERIA:

- the already-exposed real session value is rendered in the Session panel
- `npm run verify` passes
- the UI change remains narrow
- no unrelated runtime or UI changes were introduced

FAIL CRITERIA:

- the rendered value is not real or not the value exposed in the prior package
- more than one new displayed value is introduced
- the renderer path is broadened unnecessarily
- unrelated files or behaviors are changed
- `npm run verify` fails

STATE UPDATES:

- `package_plan.md` -> record the completed display step and current next package status
- `snapshot.md` -> reflect that the additional real session value is now visible in the Session panel if the package passes
- `next-action.md` -> point to the next narrow feature package after this display step
- `handoff.md` -> record the completed result of this FEATURE package

NOTES:

- Keep this boring on purpose.
- The goal is not richer UI; it is proving the process can carry one more narrow feature step safely.
- Prefer the smallest visible change that confirms the value is real.