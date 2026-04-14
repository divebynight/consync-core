You are fixing the current Electron desktop runtime launch failure in the Consync project.

Context:
- The shared architecture is intentional and must be preserved:
  - `src/core/`
  - `src/cli/`
  - `src/electron/main/`
  - `src/electron/preload/`
  - `src/electron/renderer/`
- The session + bookmark loop work should remain intact.
- Do not refactor unrelated feature code.
- Do not change the session/bookmark behavior unless required for the runtime fix.
- The current problem appears to be Electron/Forge/Vite runtime wiring, not product logic.

Observed runtime error:
- When running the desktop app, Electron shows a popup error similar to:
  - `Error launching app`
  - `Unable to find Electron app at /Users/markhughes/Projects/consync-core`
  - `Cannot find module '/Users/markhughes/Projects/consync-core/vite/build/main.js'`
  - `Please verify that the package.json has a valid "main" entry`

Goal:
Diagnose and fix the desktop launch configuration so `npm run start:desktop` launches the Electron app successfully with the current scaffold and session/bookmark UI.

Scope for this step:
1. Inspect the current Electron/Forge/Vite wiring.
2. Check `package.json` for the `main` field and determine whether it points to an invalid path.
3. Check `forge.config.js` and the Vite-related config files for the expected main/preload/renderer entry setup.
4. Fix the runtime configuration so the Electron main process launches from the correct built entry.
5. Preserve the existing project architecture and current session/bookmark implementation.
6. Do not introduce new product features in this step.

Important constraints:
- Make the smallest coherent config/runtime fix.
- Do not rewrite the scaffold.
- Do not move core logic into renderer code.
- Do not give renderer direct Node or filesystem access.
- Do not add playback, persistence, or other new features.
- Keep the preload bridge narrow.
- Preserve future MCP compatibility.

Verification requirements:
1. Run the smallest set of checks needed to prove the runtime fix:
   - inspect or correct `package.json`
   - inspect or correct Forge/Vite config
   - run the focused tests if needed
   - run `npm run start:desktop`
2. Confirm that the desktop window launches instead of showing the missing-main-entry popup.
3. Confirm that the existing session/bookmark UI appears.
4. If any runtime issue remains, capture the exact remaining error instead of claiming PASS.

Documentation requirements:
1. Update docs only if the runtime fix changes the documented startup path or architecture assumptions.
2. Keep documentation lightweight.
3. Do not create bulky new docs.

Required handoff format:
Return a concise handoff that includes:
- Status
- Summary
- Files Created
- Files Modified
- Commands to Run
- Human Verification
- Verification Notes
- Any known limitations intentionally deferred

Before making changes:
1. Inspect the existing scaffold files first.
2. Confirm whether the issue is the `main` entry, Forge config, Vite output path, or a mismatch between them.
3. Make only the smallest fix needed to get desktop launch working.