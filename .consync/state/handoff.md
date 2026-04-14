TYPE: FEATURE
PACKAGE: expose_one_backend_summary_value_in_renderer

STATUS: PASS

SUMMARY:

Exposed one real backend summary value through the existing preload bridge and rendered it in a new `Backend Summary` panel alongside the existing bridge proof panel.

Updated the active state files so the repo now records that the renderer shows real backend/system data and points the next package at the first narrow Consync-facing renderer value.

FILES CREATED:

* None.

FILES MODIFIED:

* `src/electron/preload/bridge.js` — added `getBackendSummary()` returning a small real backend object with `platform` and `cwd` from the preload Node context.
* `src/electron/renderer/App.jsx` — loaded the backend summary on startup, required the new bridge method in the contract check, and rendered a simple `Backend Summary` panel.
* `src/test/desktop-scaffold.js` — extended the focused preload bridge test to assert the backend summary object shape and values.
* `.consync/state/snapshot.md` — updated current reality and active focus to reflect that real backend/system data is now visible in the renderer.
* `.consync/state/next-action.md` — repointed the next package to `expose_one_consync_relevant_value_in_renderer`.
* `.consync/state/handoff.md` — updated to record the completed result of this FEATURE package.

COMMANDS TO RUN:

* `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
* `cd /Users/markhughes/Projects/consync-core && npm run verify`
* `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Confirm the Electron window opens without preload or renderer errors.
3. Confirm the existing `Bridge Status` panel still shows `ready`, `preload`, and `bridge-v1`.
4. Confirm a new `Backend Summary` panel is visible.
5. Confirm the panel displays a real platform value such as `darwin` and a real current working directory path instead of `loading`.
6. Confirm the existing session panel and bookmark form still render.
7. Failure case: if `Backend Summary` stays on `loading`, the new backend summary method is not reaching the renderer.
8. Failure case: if the UI shows `Consync desktop bridge is unavailable.`, the renderer/preload contract is still broken.

VERIFY RESULT:

* `node src/test/desktop-scaffold.js` -> `PASS`
* `npm run verify` -> `[verify] PASS`
* `npm run start:desktop` -> Electron Forge built the main and preload bundles and reported `Launched Electron app`
* warnings: none observed in the verification output; the desktop process was manually interrupted after successful launch

VERIFICATION NOTES:

* validated that `getBackendSummary()` returns a structured object with the real Node-side values `process.platform` and `process.cwd()` in the focused bridge test
* confirmed the repo-level verification still passes after the feature change
* confirmed the desktop process launches cleanly with no preload/renderer startup error in the terminal output
* the `npm run test:desktop-scaffold` script alias misfired through the terminal wrapper, so I ran the focused test directly with `node src/test/desktop-scaffold.js` instead
* I could verify process-level desktop launch and the bridge method coverage from tools, but I could not directly inspect the live Electron window contents from the tool environment

NOTES:

* `snapshot.md` and `next-action.md` were updated as part of this package
* no full filesystem scanning or broader Consync business logic was added in this package