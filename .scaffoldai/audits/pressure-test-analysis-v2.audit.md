# Pressure Test Analysis v2

Date: 2026-05-04
Branch: `feature/product-design-electron`
Status: PASS

---

## Summary

Two architecture pressure tests were run back-to-back:

1. **`folder-summary-pressure-test-v1`** — validated the CLI command surface: `src/commands/` as
   thin adapter, `src/lib/` as reusable execution core, sandbox fixtures as natural test input, and
   the verify runner integration.

2. **`folder-summary-electron-ipc-v1`** — validated the Electron adapter surface: renderer →
   preload → main → lib path, IPC channel extension, bridge exposure, and the pure-function
   renderer panel pattern.

Both tests used the same underlying lib function (`summarizeFolder`) without modification. No
scanning logic was duplicated at any layer. All boundaries held as specified.

---

## Validated Architecture Rules

| Rule | Evidence | Verdict |
|---|---|---|
| `src/lib/` is the reusable execution core | `summarizeFolder` called from CLI command and Electron main with no duplication | CONFIRMED |
| `src/commands/` is a thin CLI adapter | `folder-summary.js` is ~30 lines: validate → call lib → print output | CONFIRMED |
| Electron main is a thin IPC adapter | `ipc.js` handler calls `summarizeFolder` and returns result, no business logic added | CONFIRMED |
| Renderer does not access filesystem | `App.jsx` calls `window.consyncDesktop.getFolderSummary`, never `require('fs')` | CONFIRMED |
| Preload is the only renderer bridge | `bridge.js` exposes `getFolderSummary` via `contextBridge`; renderer has no other path | CONFIRMED |
| Panel logic lives in `.mjs` pure functions | `folder-summary-panel.mjs` exports `getFolderSummaryRows` and `getFolderSummaryExtensionRows` — no React, no IPC, no state | CONFIRMED |
| Sandbox fixtures support CLI and test work | `mixed-flat-small` and `nested-mixed` used directly in lib unit tests | CONFIRMED |
| Tests land in `src/test/` and are wired into verify | `unit-folder-summary.js`, `renderer-folder-summary-panel.js` both added to `verify.js` | CONFIRMED |

---

## Exposed Pressure Points

### 1. Growing `getDesktopBridge()` validation list — MEDIUM

`getDesktopBridge()` in `App.jsx` explicitly validates that 11+ named methods exist on
`window.consyncDesktop` before returning the bridge. Adding `getFolderSummary` required adding one
more line to this check. As the bridge grows, this list becomes a maintenance surface: a method
rename or addition requires updating the validation block, bridge.js, ipc-channels.js, ipc.js, and
the test mock.

Current state is not a problem, but the pattern does not scale past ~15–20 methods without becoming
error-prone. The risk is that the validation list drifts out of sync with the actual bridge surface.

**Decision:** Monitor, do not act yet. Formalize only if the bridge reaches ~20 methods or if
sync failures appear in tests.

---

### 2. Parallel scan logic in `sandbox-scan.js` — LOW

`sandbox-scan.js` contains its own inline `collectFilePaths` and `compareText` functions. These
are semantically different from `folder-summary.js` (relative paths, files-only listing, different
extension label format). The decision in `scan-logic-consolidation-decision-v1` was Option A:
keep them separate. That decision was correct and this pressure test confirms it: both scanners
coexisted without friction.

**Decision:** Leave `sandbox-scan.js` alone. Consolidation is only warranted if a future feature
requires the same output shape from both scanners.

---

### 3. Pure `.mjs` renderer panel pattern — LOW

`folder-summary-panel.mjs` follows the same pattern as `session-panel.mjs`,
`mock-search-panel.mjs`, and `bookmark-flow.mjs`: pure functions, ESM exports, no React imports,
testable directly with Node's dynamic `import()`. This pattern is already established. The
pressure test confirms it works for new capabilities without modification.

**Decision:** Encourage this pattern for all future UI data transformation slices. Each renderer
capability should have a corresponding `.mjs` module for its pure logic, separate from its React
rendering code in `App.jsx`.

---

### 4. IPC channel definitions remain clear — LOW

`ipc-channels.js` is a flat constant object. Adding `getFolderSummary` was one line. The
channel string is namespaced (`desktop:get-folder-summary`) and readable. No clarity issues.

**Decision:** No action needed. Continue using the flat constant object pattern.

---

### 5. README docs are not stale — LOW

`src/electron/README.md` and `src/test/README.md` were not updated because no structural change
was made. The new IPC pattern, panel module, and test file follow existing listed conventions
exactly. No doc gap was created.

**Decision:** No doc update needed at this time.

---

## Decisions

1. **`src/lib/` is confirmed as the reusable Consync execution core.** CLI commands, Electron
   IPC handlers, and future MCP tools should all call `src/lib/` functions directly. Logic must
   not be duplicated across surfaces.

2. **CLI (`src/commands/`) and Electron (`src/electron/main/ipc.js`) are adapter/surface layers
   only.** Their job is to validate input, call lib, and return or print the result. They must
   not own reusable business logic.

3. **Future MCP work should call `src/lib/` directly.** It must not copy command or IPC handler
   logic. The `summarizeFolder` function is already MCP-ready: clear input, structured output, no
   side effects, no CLI or Electron dependencies.

4. **The Electron bridge API should be monitored, not formalized yet.** The current flat-object
   pattern in `bridge.js` and the explicit validation in `getDesktopBridge()` are adequate. A
   formalization (e.g., schema, interface type, or auto-validation) becomes warranted if the
   bridge exceeds ~20 methods or if a sync bug is caught.

5. **`sandbox-scan.js` should be left alone.** Its semantics (file listing, relative paths) differ
   from `folder-summary.js` (counts, absolute paths, sizes). Consolidation would require a
   parameterized walk helper that serves two diverging callers — premature abstraction.

6. **The pure `.mjs` renderer panel pattern is the preferred approach for future UI slices.** Each
   new renderer capability should extract its data transformation logic into a `.mjs` pure module
   before wiring it into `App.jsx`. This keeps `App.jsx` focused on state and event handling.

---

## Recommended Next Steps

Prioritized, one at a time:

1. **e2e smoke test for Folder Summary view** — add a Playwright test in `src/test/e2e/` covering:
   nav button render, path input, successful result display, and invalid-path error state. This is
   the only verified gap in current coverage for the new Electron surface.

2. **MCP adapter probe** — after the e2e test, implement a minimal MCP tool that calls
   `summarizeFolder` directly to validate the lib-as-adapter-target model end to end.

3. **Bridge validation review** — when the bridge reaches 15+ methods, evaluate whether a
   lightweight validation helper (e.g., `assertBridgeReady(bridge, requiredMethods)`) would
   reduce the maintenance surface in `getDesktopBridge()`.

---

## Coverage Map

| Surface | Covered | In `verify`? | Risk |
|---|---|---|---|
| `src/lib/folder-summary.util.consync.js` | `unit-folder-summary.js` | YES | LOW |
| `src/commands/folder-summary.cmd.consync.js` | CLI smoke via `unit-folder-summary.js` fixture path | YES (indirect) | LOW |
| `src/electron/main/ipc.js` (getFolderSummary) | Covered by `app-search-flow.test.jsx` mock | YES (vitest) | LOW |
| `src/electron/preload/bridge.js` (getFolderSummary) | Covered by bridge mock in vitest | YES (vitest) | LOW |
| `src/electron/renderer/folder-summary-panel.mjs` | `renderer-folder-summary-panel.js` | YES | LOW |
| `src/electron/renderer/App.jsx` folder-summary view | `app-search-flow.test.jsx` (render smoke) | YES (vitest) | LOW |
| e2e Folder Summary flow | **NOT COVERED** | NO | MEDIUM |
