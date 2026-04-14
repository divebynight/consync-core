# Status

PASS

## Summary

Fixed the Electron desktop launch wiring by correcting the package `main` entry to match the Vite main-process output and by configuring the Vite main/preload builds to transform local CommonJS modules under `src/` instead of leaving runtime `require("./ipc")` and `require("./bridge")` calls unresolved.

This stayed intentionally narrow. The shared architecture remains intact, the existing session/bookmark loop was left unchanged, and the fix was limited to runtime/config wiring rather than product behavior.

## Files Created

- None.

## Files Modified

- `package.json`
  - Changed the Electron `main` entry from `.vite/build/main.js` to `.vite/build/index.js` so Electron starts from the file Vite actually emits for the main-process bundle.
- `vite.main.config.mjs`
  - Added `build.commonjsOptions.include` for `/src/` and `/node_modules/` so the Electron main-process bundle resolves local CommonJS modules during build.
- `vite.preload.config.mjs`
  - Added the same CommonJS handling so the preload bundle resolves the local bridge module during build.

## Commands to Run

- `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

## Human Verification

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Confirm Electron no longer shows the missing-main-entry popup.
3. Confirm Forge reports `Launched Electron app`.
4. Confirm the desktop window appears with the existing session/bookmark UI instead of failing during startup.
5. Optionally create a bookmark to verify the previously implemented session/bookmark flow still behaves the same after the runtime fix.

## Verification Notes

- Inspected the active scaffold/config files first to isolate whether the problem was the package `main` entry, Forge config, or Vite output path.
- Confirmed the original runtime failure included an invalid `package.json` main entry pointing to `.vite/build/main.js` while Vite emitted `.vite/build/index.js`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run test:desktop-scaffold`; observed `PASS`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run verify`; observed `[verify] PASS` and `STATUS: ON_TRACK`.
- Ran `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`; Forge completed both bundle steps and reported `Launched Electron app. Type rs in terminal to restart main process.`
- The earlier runtime failures (`Cannot find module .../.vite/build/main.js`, then unresolved local Electron helper modules) were no longer present after the config fix.
- I could verify process-level launch from Forge output, but I could not directly inspect the Electron window contents from the tool environment. The renderer code for the session/bookmark UI was not changed in this step.

## Any known limitations intentionally deferred

- No product behavior was expanded in this step.
- The session/bookmark UI remains in-memory only, with no playback integration or persistence, exactly as before.