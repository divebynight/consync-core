TYPE: FEATURE
PACKAGE: expose_one_more_real_session_facing_value

GOAL:

Expose one additional real session-facing value through the existing Consync desktop bridge so the Session panel can continue moving away from placeholder-only state.

This should be a narrow end-to-end slice:
artifact/session source -> main/backend surface -> preload/bridge -> renderer-readable state.

The value does not need a large new interaction model. It just needs to be real, small, and observable.

CONTEXT:

- Electron app is running.
- The bridge path is already working.
- The Session panel already shows one real file-backed value instead of only placeholder data.
- The current process, package plan, handoff, resume, and verification contracts have been defined through PROCESS packages.
- This is the first real FEATURE sequence using that process.
- We want a small feature slice that proves the process can carry real code changes.

REQUIREMENTS:

1. Keep the change narrow and observable.
2. Do not introduce full session lifecycle, playback, timers, or streaming updates.
3. Reuse the existing main -> preload -> renderer path.
4. Expose exactly one additional real session-facing value.
5. Prefer a value already cheaply derivable from the current artifact/session source.
6. Update focused tests only where needed.
7. Update state files at the end.

ACCEPTABLE VALUE TYPES (pick one practical option):

- latest artifact timestamp
- derived session id
- latest artifact path
TYPE: FEATURE
PACKAGE: expose_one_more_real_session_facing_value

GOAL:

Expose one additional real session-facing value through the existing Consync desktop bridge so the Session panel can continue moving away from placeholder-only state.

This should be a narrow end-to-end slice:
artifact/session source -> main/backend surface -> preload/bridge -> renderer-readable state.

The value does not need a large new interaction model. It just needs to be real, small, and observable.

CONTEXT:

- Electron app is running.
- The bridge path is already working.
- The Session panel already shows one real file-backed value instead of only placeholder data.
- The current process, package plan, handoff, resume, repair, and verification contracts have been defined through PROCESS packages.
- This is the first real FEATURE sequence using that process.
- We want a small feature slice that proves the process can carry real code changes.

REQUIREMENTS:

1. Keep the change narrow and observable.
2. Do not introduce full session lifecycle, playback, timers, or streaming updates.
3. Reuse the existing main -> preload -> renderer path.
4. Expose exactly one additional real session-facing value.
5. Prefer a value already cheaply derivable from the current artifact/session source.
6. Update focused tests only where needed.
7. Update state files at the end.

ACCEPTABLE VALUE TYPES (pick one practical option):

- latest artifact timestamp
- derived session id
- latest artifact path
- artifact count in `sandbox/current`
- another small real value already available from the current artifact set

DO NOT:

- implement playback
- add polling or timers
- broaden the session model
- refactor unrelated UI
- introduce multiple new values in one package

TASK:

1. Read the current relevant files and trace the existing session-facing path.
2. Choose one small real value that is already available or easily derived from the current artifact/session source.
3. Source that value through the existing backend/main layer.
4. Pass it through the existing bridge/preload path.
5. Make it available to the renderer/session state surface.
6. Update only the minimum focused test/assertion surface needed.
7. Update state files at the end.

FILES TO MODIFY:

- feature/runtime files only as needed for the narrow session value path
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
2. Review the changed files and confirm exactly one new real session-facing value was added.
3. Confirm the change reuses the existing bridge path instead of introducing a new architecture path.
4. Confirm no unrelated UI or session-model refactor was introduced.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changes are limited to the expected feature/test/state files.
6. Failure case: if the package introduces more than one new real value, the change is too broad.
7. Failure case: if the package starts broadening the session model beyond a single observable value, the package is incomplete.

PASS CRITERIA:

- one additional real session-facing value is exposed end-to-end
- `npm run verify` passes
- the change remains narrow
- the value is available to the renderer/session surface
- no unrelated runtime or UI changes were introduced

FAIL CRITERIA:

- the new value is mock/static instead of real
- more than one new value is introduced
- the bridge/runtime path is broadened unnecessarily
- unrelated files or behaviors are changed
- `npm run verify` fails

STATE UPDATES:

- `package_plan.md` -> record this feature sequence and current package status
- `snapshot.md` -> reflect the new real session-facing value if the package passes
- `next-action.md` -> point to the next feature package for rendering the new value in the Session panel
- `handoff.md` -> record the completed result of this FEATURE package

NOTES:

- Keep this boring on purpose.
- The goal is not feature richness; it is proving that the process can carry real feature work safely.
- Prefer the simplest real signal over the most impressive one.