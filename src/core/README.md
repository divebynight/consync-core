# src/core/

## Purpose

This folder contains Consync product runtime logic shared across multiple execution surfaces: Electron main process, CLI, and tests.

Code here is **product runtime** — not developer utilities, not test helpers, not ScaffoldAI process logic.

---

## What Belongs Here

- **Session management** — `session.js` reads/writes session artifacts, tracks session state
- **Desktop shell coordination** — `desktop-shell.js` provides desktop scaffold info, ping responses, and mock search for the Electron UI

---

## What Does NOT Belong Here

- CLI argument parsing (belongs in `src/cli/`)
- Command handlers (belong in `src/commands/`)
- Electron IPC handlers or window management (belong in `src/electron/main/`)
- React UI components (belong in `src/electron/renderer/`)
- Generic reusable logic that doesn't need shared state (belongs in `src/lib/`)
- Test files (belong in `src/test/`)

---

## `src/core/` vs `src/lib/`

### Use `src/core/` when:
- The logic manages **shared runtime state** across CLI and Electron (e.g., session artifact tracking)
- The logic coordinates **product-level behavior** that multiple surfaces need (e.g., desktop shell info)

### Use `src/lib/` when:
- The logic is a **pure function** or utility (e.g., GUID generation, timestamp formatting)
- The logic is **stateless** and can be called independently (e.g., folder summary, clipboard access)
- The logic belongs to ScaffoldAI process/BRIDGE (e.g., gatekeeper, state integrity)

**Rule of thumb:** If it could be tested without needing global state or a running app, it probably belongs in `lib/` rather than `core/`.

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/lib/` | Stateless utilities and ScaffoldAI logic; called by `core/`, commands, and Electron |
| `src/electron/` | Electron-specific surfaces (main/preload/renderer); calls into `core/` for shared product logic |
| `src/commands/` | CLI command handlers; call `core/` for session management, `lib/` for utilities |
| `src/test/` | Tests for `core/` logic (e.g., `core-session.js`) |

---

## Verification Notes

- `core/` logic is tested via `src/test/core-session.js` and `src/test/desktop-scaffold.js`
- Changes to `core/` may affect both CLI and Electron behavior — verify both surfaces
