# Status

PASS

## Summary

Removed the renderer's leftover shell-era dependency on `getShellInfo()` and `ping()` and aligned it with the current preload contract by using only `getSessionState()` and `createBookmark()` from the exposed desktop bridge.

The renderer now loads session state on startup, updates from the existing bookmark IPC/core path, and surfaces a clear bridge error message instead of crashing on an undefined preload API shape.

## Files Created

- None.

## Files Modified

- `src/electron/renderer/App.jsx`
  - Replaced obsolete shell-info calls with a narrow bridge accessor that validates the preload API and uses only the current session methods.
  - Added renderer-side error handling so a missing or incomplete bridge shows a visible session error instead of throwing the old `getShellInfo` mismatch.

## Commands to Run

- `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

## Human Verification

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Confirm the Electron window opens without the old preload/API mismatch error such as `Cannot read properties of undefined (reading 'getShellInfo')`.
3. Confirm the Session panel shows a real current file and position instead of staying on `loading`.
4. Confirm the Bookmarks count initially shows `0`.
5. Type a note into the bookmark input and click `Drop Bookmark`.
6. Confirm the bookmark appears in the list and the Bookmarks count increments to `1`.
7. If the UI shows `Consync desktop bridge is unavailable.`, treat that as a failure case indicating the preload global did not expose the expected session methods.

## Verification Notes

- Inspected the renderer, preload bridge, IPC handlers, and shared session module before changing anything.
- Confirmed the current preload bridge already exposes `getSessionState()` and `createBookmark()` while the renderer was still calling shell-era methods.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`; observed `PASS`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run verify`; observed `[verify] PASS` and `STATUS: ON_TRACK`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`; Forge built the main, preload, and renderer targets and reported `Launched Electron app` with no startup error in the terminal.
- Validated the renderer-side edge case of a missing or incomplete bridge by replacing the previous hard crash path with an explicit visible error message.
- I could verify clean desktop process launch from terminal output, but I could not directly inspect the Electron window contents from the tool environment.

## Any known limitations intentionally deferred

- The session loop remains in-memory only.
- No playback, persistence, hotkeys, or additional desktop features were added in this step.