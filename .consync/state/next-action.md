You are fixing the current Electron preload exposure failure in the Consync desktop app.

Context:
- The Electron app launches.
- The renderer window is visible.
- The session/bookmark UI renders.
- The UI currently shows a visible error:
  - `Consync desktop bridge is unavailable.`
- That means the renderer cannot access the expected preload bridge.
- This is a boundary/integration issue between renderer and preload, not a new feature request.
- The shared architecture must be preserved:
  - `src/core/`
  - `src/cli/`
  - `src/electron/main/`
  - `src/electron/preload/`
  - `src/electron/renderer/`
- The current goal is to make the existing UI talk to the existing preload/API/core layers.
- Do not add new product features in this step.

Goal:
Make the preload bridge actually available to the renderer so the existing session/bookmark UI can read session state and create bookmarks.

What to inspect first:
1. `src/electron/preload/bridge.js`
2. `src/electron/preload/preload.js`
3. `src/electron/main/window.js`
4. `src/electron/renderer/App.jsx`

What to determine:
1. What global name is being exposed by `contextBridge.exposeInMainWorld(...)`
2. What global name and shape the renderer is expecting
3. Whether the preload file is actually being loaded by the BrowserWindow config
4. Whether `contextIsolation`, `sandbox`, and preload wiring are preventing the renderer from seeing the bridge
5. Whether the renderer is validating the bridge correctly but the preload object shape does not match

Scope for this step:
1. Inspect the current preload exposure and renderer expectation.
2. Align the renderer and preload contract so the renderer can access the exposed bridge.
3. Confirm the preload file is actually wired in `BrowserWindow`.
4. Make the smallest coherent fix needed to ensure:
   - session state loads on startup
   - current file shows real in-memory value
   - current position shows real in-memory value
   - bookmarks count shows real in-memory value
   - creating a bookmark updates the UI
5. Keep the session/bookmark logic in shared core and IPC.
6. Keep the preload bridge narrow.
7. Keep the renderer UI-only.

Important constraints:
- Do not add playback.
- Do not add persistence.
- Do not add hotkeys.
- Do not redesign the UI.
- Do not move business logic into React components.
- Do not give the renderer direct Node or filesystem access.
- Do not refactor unrelated areas.
- Preserve future MCP compatibility.

Expected outcome:
1. The Electron app launches.
2. The renderer no longer shows `Consync desktop bridge is unavailable.`
3. The Session panel shows real values instead of `loading`.
4. Typing a note and pressing `Drop Bookmark` updates the bookmark list using the existing preload -> IPC -> core path.

Verification requirements:
1. Run the smallest set of checks needed for this fix:
   - any focused test updates if needed
   - `npm run test:desktop-scaffold`
   - `npm run verify`
   - `npm run start:desktop`
2. Confirm the Electron window opens.
3. Confirm the bridge error disappears.
4. Confirm session values load.
5. Confirm bookmark creation works.
6. If anything still fails, report the exact remaining issue instead of claiming PASS.

Documentation requirements:
1. Update docs only if the documented desktop behavior needs to be corrected.
2. Keep documentation lightweight.
3. Do not create bulky new docs.

Before making changes:
1. Inspect the preload exposure and renderer expectation carefully.
2. Confirm whether the issue is:
   - wrong global name
   - wrong bridge shape
   - preload not loading
   - BrowserWindow config mismatch
3. Make the smallest coherent fix that gets the current loop talking.

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