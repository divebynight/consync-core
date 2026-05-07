# src/lib/

## Purpose

This folder contains reusable Consync product logic shared across the CLI, Electron main process, tests, and future adapter surfaces (e.g. MCP tools).

Logic here is UI-agnostic and CLI-agnostic. It should be callable and testable without Electron running.

---

## What Belongs Here

- `guid.js` — GUID generation and formatting
- `time.js` — timestamp utilities
- `fs.js` — filesystem helpers used across CLI and Electron
- `clipboard.js` — clipboard access utility
- `newGuidTool.js` — new-guid workflow logic (called by the `new-guid` command)
- `sandbox-anchors.js` — anchor resolution logic for sandbox discovery and search
- `portableScaffold.js` — portable scaffold generation logic
- `gatekeeperDecision.js` — Gatekeeper gate decision logic (pure function, no side effects)
- `gatekeeperMount.js` / `gatekeeperClose.js` / `gatekeeperSwitch.js` — Gatekeeper state transition helpers
- `getInFlightPacket.js` — reads `.scaffoldai/state/next-action.md` to determine in-flight packet state
- `stateIntegrityCheck.js` — preflight/postflight state integrity checks
- `handoffContractChecker.js` — verifies required fields in handoff and next-action state files
- `intakeClassify.js` — intake classification logic

---

## What Does NOT Belong Here

- CLI argument parsing (belongs in `src/cli/`)
- Command handler entry points (belong in `src/commands/`)
- Electron IPC handlers or window management (belong in `src/electron/main/`)
- React UI components or renderer logic (belong in `src/electron/renderer/`)
- ScaffoldAI process state, agents, or docs (belong under `.scaffoldai/`)
- Test files (belong in `src/test/`)

---

## Important Boundaries

- **Commands call lib, not the reverse** — `src/commands/` files should be thin: parse input, call a lib function, print output
- **Electron main calls lib through explicit imports** — do not put reusable logic in `electron/main/` when it belongs here
- **Lib functions should have clear inputs and outputs** — no implicit globals, no hidden filesystem side effects beyond what is documented
- **State file reads are allowed** — `lib/` may read `.scaffoldai/state/` files as part of its contracts (e.g. `getInFlightPacket.js`, `stateIntegrityCheck.js`)
- **State file writes should be intentional** — document any function that writes state; do not write state files silently
- **Future MCP tools should call lib directly** — keep this layer portable; avoid coupling it to Electron or CLI internals

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/commands/` | Thin command handlers that call lib functions; should not own complex reusable logic |
| `src/core/` | Shared app-level logic (session, desktop shell) that may coordinate lib calls |
| `src/electron/main/` | IPC handlers that call lib functions for system operations |
| `src/test/` | Tests that exercise lib functions directly (unit tests, integration tests) |

---

## Verification Notes

- Unit tests for lib functions live in `src/test/` (e.g. `unit-new-guid.js`, `unit-dry-run-check.js`, `unit-get-in-flight-packet.js`)
- `npm run verify` exercises lib functions through CLI commands and direct unit tests
- Lib functions should be testable via `node src/test/<test-file>.js` without any Electron process running
