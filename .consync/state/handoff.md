TYPE: FEATURE
PACKAGE: repair_runtime_renderer_preload_contract

STATUS: PASS

SUMMARY:

Repaired the live Electron renderer/preload seam by moving real backend and Consync runtime reads out of sandboxed preload code and behind main-process IPC while preserving the existing renderer-facing bridge shape.

Focused verification still passes, the Electron app launches, and the live window is now visually confirmed to populate the existing bridge-backed panels instead of showing bridge unavailability.

FILES CREATED:

* None.

FILES MODIFIED:

* `src/core/desktop-shell.js` — added shared helpers for backend summary and Consync summary so runtime reads happen in normal Node/Electron main-process context.
* `src/electron/main/ipc.js` — added IPC channels and handlers for `getBackendSummary` and `getConsyncSummary`.
* `src/electron/preload/bridge.js` — removed preload-side direct runtime reads and routed both summary methods through IPC while keeping the bridge API stable.
* `src/test/desktop-scaffold.js` — updated the focused scaffold test to validate the repaired IPC-backed contract instead of preload-local Node access.
* `.consync/state/snapshot.md` — updated current reality and active focus to reflect the runtime contract repair.
* `.consync/state/next-action.md` — pointed back to `expose_one_session_facing_value_in_renderer` after the repair.
* `.consync/state/handoff.md` — updated to record the completed result of this FEATURE package.

COMMANDS TO RUN:

* `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
* `cd /Users/markhughes/Projects/consync-core && npm run verify`
* `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Confirm the Electron window opens without a `Session Error` banner.
3. Confirm `Bridge Status` shows `ready`, `preload`, and `bridge-v1`.
4. Confirm `Backend Summary` shows a real platform and current directory.
5. Confirm `Consync Summary` shows a real session directory state and count.
6. Confirm the existing `Session` panel loads instead of staying on `loading`.
7. Failure case: if `Consync desktop bridge is unavailable.` appears, the runtime seam is still broken.
8. Failure case: if the summary panels stay on `loading`, the preload bridge is still not reaching the renderer.

VERIFY RESULT:

* `node src/test/desktop-scaffold.js` -> `PASS`
* `npm run verify` -> `[verify] PASS`
* `npm run start:desktop` -> Electron Forge built the main and preload bundles and reported `Launched Electron app`
* validated that `getBackendSummary()` and `getConsyncSummary()` now resolve through main-process IPC
* confirmed the repo-level verification still passes after the repair
* confirmed the desktop process launches cleanly in the terminal after the repair

VERIFICATION NOTES:

* Actually tested the focused scaffold path, full repo verification, and desktop startup.
* Observed outcome: the repaired preload/main split no longer blocks the live Electron window, and the app now appears to be working in the open session.
* Validated the regression edge case that preload no longer imports the main IPC module directly.

VISUAL VERIFY:
REQUIRED

CHECK:
- bridge unavailable banner gone
- Bridge Status populated
- Backend Summary populated
- Consync Summary populated

RESULT:
CONFIRMED

NOTES:
- `next-action.md` now points back to `expose_one_session_facing_value_in_renderer`.
- State files now reflect that the runtime repair is complete.