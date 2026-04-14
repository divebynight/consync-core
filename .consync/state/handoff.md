# Status

PASS

## Summary

Added the first desktop UI scaffold for Consync with Electron Forge, a React-capable renderer, and a narrow preload bridge. The new layout separates shared logic into `src/core/`, keeps the CLI entry in `src/cli/`, and splits the desktop shell into `src/electron/main/`, `src/electron/preload/`, and `src/electron/renderer/`.

The renderer remains UI-only and talks to the main process through a minimal preload API. The first IPC example exposes `getShellInfo()` and `ping()`, both backed by a small shared core module instead of putting app logic directly into React components.

Docs now explain why the desktop layer is being added, how the process boundaries are separated, and that the earlier terminal capture exploration remains paused as a probe rather than the primary product direction. Real audio playback, media control, and renderer-side filesystem access remain intentionally deferred.

## Files Created

- `forge.config.js`
  - Added the Electron Forge configuration using the Vite plugin and a macOS zip maker for local desktop development.
- `vite.main.config.mjs`
  - Added the main-process Vite config placeholder needed by the Forge Vite plugin.
- `vite.preload.config.mjs`
  - Added the preload-process Vite config placeholder needed by the Forge Vite plugin.
- `vite.renderer.config.mjs`
  - Added the React-capable renderer Vite config rooted in `src/electron/renderer/`.
- `package-lock.json`
  - Added the lockfile generated from installing the Electron Forge, Vite, React, and related scaffold dependencies.
- `src/cli/index.js`
  - Added a thin CLI entry layer so the existing command surface remains separate from the desktop scaffold.
- `src/core/desktop-shell.js`
  - Added a small shared core module that supplies desktop shell metadata and a simple ping response for IPC.
- `src/electron/main/index.js`
  - Added the Electron main-process bootstrap that waits for readiness, registers IPC, and creates the main window.
- `src/electron/main/ipc.js`
  - Added the minimal IPC example that serves shared core data to the preload bridge.
- `src/electron/main/window.js`
  - Added BrowserWindow creation with `contextIsolation`, `sandbox`, and preload wiring.
- `src/electron/preload/bridge.js`
  - Added a narrow bridge factory that maps renderer calls onto specific IPC channels.
- `src/electron/preload/preload.js`
  - Added the `contextBridge` exposure for the renderer-facing desktop API.
- `src/electron/renderer/index.html`
  - Added the renderer entry HTML for the desktop shell.
- `src/electron/renderer/renderer.jsx`
  - Added the React renderer entry that mounts the placeholder app.
- `src/electron/renderer/App.jsx`
  - Added a small placeholder UI that proves the app launches and can read data through the preload bridge.
- `src/electron/renderer/styles.css`
  - Added the initial desktop shell styling for the placeholder renderer.
- `src/test/desktop-scaffold.js`
  - Added a small scaffold-stage verification script for shared core behavior, IPC registration, and preload bridge calls.

## Files Modified

- `package.json`
  - Added the Electron Forge entry point, desktop scripts, and the React/Electron/Vite dependencies needed for the scaffold.
- `.gitignore`
  - Ignored Forge and Vite build outputs so local desktop artifacts do not pollute the repo.
- `src/index.js`
  - Reduced the root CLI file to a thin delegation layer into the new `src/cli` entry.
- `src/test/verify.js`
  - Added the desktop scaffold boundary test to the repo-level verification pass.
- `src/commands/system-summary.js`
  - Added the desktop start and scaffold-test commands to the surfaced system summary.
- `src/commands/system-check.js`
  - Added desktop scaffold file checks so the new architecture appears in the on-track signals.
- `README.md`
  - Documented the new desktop layer, the source split, and that the terminal audio probe is paused as an exploratory path.
- `.consync/docs/current-system.md`
  - Updated the current-system doc to describe the CLI-first plus desktop-scaffold architecture and the paused media work.

## Commands to Run

- `npm install`
- `npm run test:desktop-scaffold`
- `npm run verify`
- `npm run start:desktop`
- `npm run package:desktop`

## Human Verification

1. Run `npm install` from the repo root. Confirm dependencies install and `package-lock.json` is present. Failure case: if install fails, the scaffold cannot be launched locally.
2. Run `npm run test:desktop-scaffold`. Confirm it prints `PASS`. Failure case: if it fails, the shared core module, IPC handler registration, or preload bridge contract is broken.
3. Run `npm run verify`. Confirm the suite ends with `[verify] PASS` and `system-check` reports the new desktop scaffold signals. Failure case: if the existing CLI verification regresses, the scaffold was not isolated cleanly enough.
4. Run `npm run start:desktop`. Confirm Forge starts, Vite serves the renderer, and an Electron window opens showing the placeholder desktop shell. Failure case: if Forge starts but the window is blank or the app crashes, the main/preload/renderer wiring is incomplete.
5. In the launched desktop window, confirm the placeholder UI shows the scaffold messaging plus bridge-derived values such as the shared core path and ping result. Failure case: if the UI renders but those values stay empty or error, the preload bridge or IPC example is not working.
6. Close the window and rerun `npm run start:desktop`. Confirm the app launches again without requiring file cleanup. Failure case: if stale build output or cached state blocks relaunch, the development scaffold is not stable enough for iteration.
7. Optionally run `npm run package:desktop` on macOS. Confirm Forge produces a packaged app under `out/`. Failure case: if packaging fails while `start:desktop` succeeds, the dev scaffold exists but the packaging path still needs work.

## Verification Notes

- Ran `npm install`; dependencies installed successfully and generated `package-lock.json`. npm reported 26 known vulnerabilities in the upstream dependency tree. Those were not addressed in this scaffold step.
- Ran `npm run test:desktop-scaffold`; observed `PASS`. The scaffold-stage check validated the shared core metadata, IPC channel registration, and preload bridge invocation without launching a real Electron window.
- Ran `npm run verify`; observed `[verify] PASS`. The existing CLI and sandbox verification still passed, and `system-check` reported the new desktop scaffold files as present with no warnings.
- Ran `npm run start:desktop`; Electron Forge completed system checks, launched the Vite renderer dev server at `http://localhost:5173/`, built the main and preload targets, and reported `Launched Electron app`.
- Did not automate deep renderer assertions inside the actual Electron window or test real audio playback, filesystem mutation from the desktop shell, packaging output from `npm run package:desktop`, or future MCP integration, because those remain outside this first scaffold stage.