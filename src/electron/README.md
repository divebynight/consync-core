# src/electron/

## Purpose

This folder contains the Electron desktop application — the product/runtime layer that delivers Consync as a desktop app.

It is organized into four strict layers: main process, preload bridge, renderer UI, and shared constants. Each layer has a specific role and must not bleed into another.

---

## What Belongs Here

### `main/` — Electron main process
Runs in the Node.js process with full system access.

- `index.js` — app entry point; creates the BrowserWindow and sets up IPC handlers
- `ipc.js` — IPC handler registrations; the main-side of the bridge contract
- `window.js` — BrowserWindow creation and configuration
- `diagnostics.js` — local diagnostics and support bundle logic

### `preload/` — Preload bridge (context bridge)
Runs in a sandboxed context between main and renderer. This is the only safe channel between them.

- `preload.js` — registers the `contextBridge` exposure; defines what the renderer can call
- `bridge.js` — typed bridge contract; the shape of `window.consyncDesktop`

### `renderer/` — React UI (renderer process)
Runs in the browser/renderer context. Has no direct Node.js or Electron API access — everything goes through the preload bridge.

- `renderer.jsx` — renderer entry point; mounts the React app
- `App.jsx` — root React component; owns top-level UI state and panel routing
- `session-panel.mjs` — session state display logic
- `bookmark-flow.mjs` — bookmark create/read/display logic
- `mock-search-panel.mjs` / `mock-waveform-panel.mjs` / `notes-panel.mjs` — UI panel slices
- `styles.css` — app styles
- `index.html` — renderer HTML shell

### `shared/` — Shared constants only
Safe to import from both main and preload. Must not import from either.

- `ipc-channels.js` — IPC channel name constants; single source of truth for channel strings used in both main and preload

---

## What Does NOT Belong Here

- Business logic that is not Electron-specific (belongs in `src/lib/`)
- CLI command handlers (belong in `src/commands/`)
- ScaffoldAI process state or docs (belong under `.scaffoldai/`)
- Consync product metadata (belongs under `.consync/`)
- Test files (belong in `src/test/`)

---

## Important Boundaries

- **Renderer must not call Node.js APIs directly** — all system access goes through `window.consyncDesktop` (the preload bridge)
- **Main must not import renderer modules** — the boundary is one-way
- **Preload must not import from `main/`** — it may only use `contextBridge` and `ipcRenderer`
- **`shared/` must stay free of side effects** — constants only; safe to import from any layer
- **IPC channel names must be defined in `shared/ipc-channels.js`** — never hardcode channel strings in two places
- **Logic that can be tested outside Electron belongs in `src/lib/`** — keep `electron/` thin; keep `lib/` reusable

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/lib/` | Reusable logic called by main-process handlers; not Electron-specific |
| `src/test/` | Test files for renderer slices (`renderer-*.js`, `app-search-flow.test.jsx`) and e2e tests |
| `src/core/` | Shared app logic (session, desktop shell) used by main |
| `sandbox/` | Test fixtures and expectations used by e2e and verify |

---

## Verification Notes

- Renderer slice tests run via `npm run verify` (e.g. `renderer-session-panel.js`, `renderer-mock-search-panel.js`)
- Full UI test suite runs via `npm run test:ui-search` (vitest + jsdom)
- E2e tests run via `npm run test:e2e` (Playwright against a live Vite renderer dev server)
- Preload build is verified via `npm run build:preload`; this is part of `npm run verify:full`
