You are fixing the current renderer ↔ preload contract mismatch in the Consync Electron desktop scaffold.

Context:
- The Electron app now launches successfully.
- The renderer window appears and the session/bookmark UI is visible.
- The shared architecture must be preserved:
  - `src/core/`
  - `src/cli/`
  - `src/electron/main/`
  - `src/electron/preload/`
  - `src/electron/renderer/`
- The current goal is not to add new features.
- The current goal is to make the existing UI correctly talk to the existing preload/API/core layers.
- The session/bookmark loop already exists in shared core and IPC, but the renderer is still showing broken or placeholder values.
- A visible error in the UI indicates a preload/API mismatch, for example:
  - `Cannot read properties of undefined (reading 'getShellInfo')`
- This suggests the renderer is calling an API shape that the preload bridge is not currently exposing, or is still using an outdated contract from the earlier shell placeholder step.

Goal:
Make the current renderer successfully read session state through the preload bridge and create bookmarks through the existing IPC/core path.

Scope for this step:
1. Inspect the current renderer, preload bridge, and IPC contract.
2. Identify any outdated renderer calls such as `getShellInfo()` or any mismatched API object names.
3. Align the renderer with the currently exposed preload API.
4. Ensure the renderer can:
   - load session state on startup
   - display:
     - current file
     - current position
     - bookmarks
   - create a bookmark when the user enters a note and clicks `Drop Bookmark`
   - re-render with updated session state
5. Remove or replace placeholder shell-era UI calls that are no longer valid.
6. Keep this step narrow and stabilization-focused.

Important constraints:
- Do not add playback.
- Do not add persistence.
- Do not add hotkeys.
- Do not add new product features.
- Do not move business logic into React components.
- Do not give the renderer direct Node or filesystem access.
- Keep the preload bridge narrow.
- Preserve future MCP compatibility.
- Preserve the existing shared session/bookmark logic unless a tiny fix is required to make the current loop function.

Expected outcome:
1. The Electron app launches.
2. The session panel shows real in-memory values instead of only `loading`.
3. The renderer no longer throws the old preload/API mismatch error.
4. Typing a note and pressing `Drop Bookmark` adds a bookmark to the list using the existing shared in-memory session flow.

Verification requirements:
1. Run only the checks needed for this stabilization step:
   - focused tests if relevant
   - `npm run test:desktop-scaffold`
   - `npm run verify`
   - `npm run start:desktop`
2. Confirm the desktop UI renders without the old API mismatch error.
3. Confirm current session values appear.
4. Confirm bookmark creation updates the list.
5. If something is still broken, report the exact remaining issue instead of claiming PASS.

Documentation requirements:
1. Update docs only if the current documented desktop behavior needs to be corrected from “placeholder shell” to “working session/bookmark loop”.
2. Keep documentation lightweight.
3. Do not create new bulky docs.

Before making changes:
1. Inspect the current renderer component and the preload bridge carefully.
2. Compare what the renderer expects with what preload actually exposes.
3. Make the smallest coherent fix that gets the current loop talking cleanly.

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