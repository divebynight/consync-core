# src/

## Purpose

This is the Consync runtime and product code.

It contains the CLI entry point, command handlers, shared logic, the Electron desktop application, and the test suite.

---

## What Belongs Here

- `index.js` — CLI entry point
- `cli/` — CLI argument parsing (thin layer, no business logic)
- `commands/` — one file per CLI command; gathers input, calls lib
- `lib/` — reusable logic callable from CLI, Electron, and future MCP surfaces
- `core/` — shared app logic (session handling, desktop shell)
- `electron/` — Electron desktop app: main process, preload bridge, React renderer
- `test/` — unit, integration, renderer slice, and e2e tests

---

## What Does NOT Belong Here

- ScaffoldAI process state (`.scaffoldai/state/`, `.scaffoldai/streams/`, `.scaffoldai/packets/`)
- ScaffoldAI agents, skills, prompts, or process docs
- Consync product metadata files (`.consync/docs/`, `.consync/product/`)
- Work packets, handoff records, or snapshot files
- Sandbox fixtures or probes (those live in `sandbox/`)

---

## Important Boundaries

- Business logic lives in `lib/` — not buried inside command or CLI files
- `commands/` files should be thin: parse input, call `lib/`, print output
- `electron/` code communicates with `lib/` through the preload bridge — not directly
- Tests in `test/` verify behavior; they do not modify `.scaffoldai/` state files except in isolated temp dirs
- `src/` must remain useful outside Electron — the CLI should work without the desktop app running

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `sandbox/` | Test fixtures, probes, and runtime dev artifacts used during development |
| `scripts/` | Project utility scripts (state checks, Playwright helpers) — not product runtime |
| `.scaffoldai/` | ScaffoldAI process harness — separate from product code |
| `.consync/` | Consync product metadata — separate from runtime code |

---

## Verification Notes

- `npm run verify` — runs the full verify suite including CLI, renderer, and bridge tests
- `npm run verify:full` — also runs unit, integration, preload build, e2e, and state checks
- All tests in `src/test/` should pass before any commit
