# src/commands/

## Purpose

This folder contains CLI command handlers — one file per command.

Each command file is a thin entry point: it parses arguments, validates inputs, calls `src/lib/` for logic, and prints output. Commands do not own reusable business logic.

---

## What Belongs Here

- `new-guid.js` — creates a new GUID metadata artifact
- `list-guid.js` / `show-guid.js` — list and display GUID artifacts
- `dry-run-check.js` — runs the Gatekeeper decision logic in simulation mode; prints a report without prompting
- `consync-run.js` — runs the Gatekeeper decision logic with a user approval prompt; does not execute work
- `gatekeeper.js` — Gatekeeper mount/close/switch subcommands
- `state-integrity-check.js` — preflight and postflight state integrity check
- `reentry-check.js` — checks re-entry readiness
- `system-check.js` — verifies required system files are present
- `system-summary.js` — prints a summary of the current system surface
- `handoff-bundle.js` — bundles the current handoff state for delivery
- `intake-run.js` / `preflight-run.js` / `verify-run.js` — agent execution entry points
- `reference-audit.js` — audits path references across the repo
- `portable.js` — generates a portable scaffold
- `sandbox-verify.js` / `sandbox-catalog.js` / `sandbox-describe.js` / `sandbox-discover.js` — sandbox fixture inspection commands
- `sandbox-scan.js` / `sandbox-search.js` / `sandbox-propose.js` / `sandbox-desktop-search.js` — sandbox query and proposal commands

---

## What Does NOT Belong Here

- Reusable business logic (belongs in `src/lib/`)
- Electron IPC handlers or window management (belong in `src/electron/main/`)
- React UI or renderer code (belongs in `src/electron/renderer/`)
- ScaffoldAI process state, agents, or docs (belong under `.scaffoldai/`)
- Test files (belong in `src/test/`)

---

## Important Boundaries

- **Commands call lib, not the reverse** — if logic is needed in more than one place, it belongs in `src/lib/`, not copied between command files
- **Commands stay thin** — a command file should: parse args → validate → call lib → print output; complex logic in a command file is a signal it belongs in lib
- **Commands must not own Electron-specific behavior** — if a command needs to interact with Electron, that interaction goes through `src/core/` or `src/lib/`, not directly in the command
- **Commands read `.scaffoldai/state/` through lib** — do not access state files directly in command files; use the lib functions that encapsulate those reads
- **One file per command** — keep the command surface flat and predictable; do not introduce subcommand dispatch logic in command files

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `src/lib/` | Where reusable logic extracted from commands lives; commands call lib |
| `src/cli/` | CLI argument parsing and dispatch; routes commands here |
| `src/index.js` | CLI entry point; delegates to `src/cli/` |
| `src/test/` | Integration tests that exercise commands via `node src/index.js <command>` |

---

## Verification Notes

- Commands are exercised via `npm run verify` through integration steps (e.g. `integration-new-guid-cli.js`, sandbox fixture expectation steps)
- To test a command manually: `node src/index.js <command> [flags]`
- Command output should be deterministic given the same inputs — if it is not, the non-determinism belongs in a lib function that can be seeded or mocked
