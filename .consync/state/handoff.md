# Status

PASS

## Summary

Fixed the preload exposure failure by correcting the BrowserWindow preload path to point at the actual Vite-emitted preload bundle, which lives beside the main bundle in `.vite/build/preload.js` during desktop startup.

The renderer-side session/bookmark loop was left intact. This step only repaired the boundary so the existing preload bridge can become visible to the renderer.

## Files Created

- None.

## Files Modified

- `src/electron/main/window.js`
  - Replaced the source-style preload path with a build-output-aware preload path and extracted the window options into a small helper so the wiring can be tested directly.
- `src/test/desktop-scaffold.js`
  - Added a focused regression check that asserts BrowserWindow options point preload at the emitted `preload.js` bundle and preserve the sandboxed renderer settings.

## Commands to Run

- `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

## Human Verification

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Confirm the Electron window opens.
3. Confirm the visible error `Consync desktop bridge is unavailable.` no longer appears.
4. Confirm the Session panel shows a real current file, real position, and a bookmarks count instead of only `loading`.
5. Enter a note and click `Drop Bookmark`.
6. Confirm a bookmark appears in the list and the bookmarks count increments.
7. Failure case: if the bridge error is still visible, the preload script is still not reaching the renderer.
8. Failure case: if the window opens but the Session values remain `loading`, the bridge may exist but `getSessionState()` is still not resolving.

## Verification Notes

- Inspected the preload bridge, preload entry, BrowserWindow config, and renderer expectation before changing anything.
- Confirmed the bridge global name and shape already matched the renderer expectation; the actual mismatch was that BrowserWindow was still pointing preload at `../preload/preload.js` while the Vite build emits `.vite/build/preload.js`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`; observed `PASS`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run verify`; observed `[verify] PASS` and `STATUS: ON_TRACK`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`; Forge built the main and preload targets and reported `Launched Electron app` with no startup error.
- Added and exercised a focused regression check for the emitted preload bundle path and retained `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- I could verify the process-level desktop launch and the corrected preload path, but I could not directly inspect the live Electron window contents from the tool environment.

## Any known limitations intentionally deferred

- The session/bookmark loop remains in-memory only.
- No playback, persistence, hotkeys, or other product features were added in this step.