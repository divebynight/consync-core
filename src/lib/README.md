# src/lib/

## Purpose

This folder contains reusable Consync product logic shared across the CLI, Electron main process, tests, and future adapter surfaces (e.g. MCP tools).

Logic here is UI-agnostic and CLI-agnostic. It should be callable and testable without Electron running.

---

## What Belongs Here

- `guid.js` — GUID generation and formatting
- `time.shared.js` — timestamp utilities
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

### ScaffoldAI Authority Boundary (Hardened)

After extracting ScaffoldAI business logic from CLI commands to shared lib modules, the following architectural layers are enforced:

```text
Surface Layer:   src/commands/scaffoldai-*.js (CLI)
                 src/mcp/* (MCP tools)
                      ↓
Authority Layer: src/lib/*.scaffoldai.js
                      ↓
State Layer:     .scaffoldai/state/*
```

**Allowed:**
- `src/commands/scaffoldai-*.js` → `src/lib/*.scaffoldai.js`
- `src/mcp/*` → `src/lib/*.scaffoldai.js`

**Forbidden (enforced by `scaffoldai-invariants.test.js`):**
- `src/mcp/*` → `src/commands/*` (MCP must never import CLI command files)
- `src/lib/*.scaffoldai.js` → `src/commands/*` (authority layer must not depend on surface layer)

ScaffoldAI CLI commands and MCP tools should be thin wrappers that call the same shared authority functions with a `repoRoot` parameter.

### ScaffoldAI State Write Authority Boundary (Hardened)

All writes to ScaffoldAI operational state files must go through the single approved state authority module:

**Approved State Authority:** `src/lib/scaffoldaiState.scaffoldai.js`

This module provides explicit write functions for each ScaffoldAI state file:
- `writeNextAction(rootPath, content)` → `.scaffoldai/state/next-action.md`
- `writeHandoff(rootPath, content)` → `.scaffoldai/state/handoff.md`
- `writeSnapshot(rootPath, content)` → `.scaffoldai/state/snapshot.md`
- `writeActiveStream(rootPath, content)` → `.scaffoldai/state/active-stream.md`
- `writeStreamDoc(rootPath, streamName, content)` → `.scaffoldai/streams/{streamName}/stream.md`

**Architecture:**

```text
CLI / MCP / tools
       ↓
ScaffoldAI authority functions (gatekeeper*.js, etc.)
       ↓
scaffoldaiState.scaffoldai.js (single write boundary)
       ↓
.scaffoldai/state/* (operational state files)
```

**Forbidden (enforced by `scaffoldai-invariants.test.js`):**
- `src/mcp/*` must not write directly to `.scaffoldai/state/*`
- `src/commands/*` must not write directly to `.scaffoldai/state/*`
- `src/lib/gatekeeper*.js` must use `scaffoldaiState.*` functions, not direct `writeFileSync`

### ScaffoldAI State Read Authority Boundary (Hardened)

All reads from ScaffoldAI operational state files in command and MCP surface layers must go through the approved state authority module:

**Approved State Authority:** `src/lib/scaffoldaiState.scaffoldai.js`

This module provides explicit read functions for each ScaffoldAI state file:
- `readNextAction(rootPath)` → `.scaffoldai/state/next-action.md`
- `readHandoff(rootPath)` → `.scaffoldai/state/handoff.md`
- `readSnapshot(rootPath)` → `.scaffoldai/state/snapshot.md`
- `readActiveStream(rootPath)` → `.scaffoldai/state/active-stream.md`
- `readActiveContract(rootPath)` → `.scaffoldai/state/active-contract.json` (parsed)
- `readStreamDoc(rootPath, streamName)` → `.scaffoldai/streams/{streamName}/stream.md`

**Architecture:**

```text
CLI / MCP / tools
       ↓
ScaffoldAI authority functions (gatekeeper*.js, getInFlightPacket.js, scaffoldaiStatus.scaffoldai.js, etc.)
       ↓
scaffoldaiState.scaffoldai.js (single read/write boundary)
       ↓
.scaffoldai/state/* (operational state files)
```

**Allowed (exempt from read boundary enforcement):**
- `src/lib/stateIntegrityCheck.js` — diagnostic/integrity checking utilities
- `src/lib/gatekeeperMount.js` — already uses scaffoldaiState for state reads
- `src/test/*` — test files may read state directly for fixture verification

**Forbidden (enforced by `scaffoldai-invariants.test.js`):**
- `src/mcp/*` must not read directly from `.scaffoldai/state/*`
- `src/commands/*` must not read directly from `.scaffoldai/state/*`
- `src/lib/` authority modules should use `scaffoldaiState.*` read functions for operational state access
- Random helpers, scripts, or commands must not mutate state files directly

**Rationale:**
- Ensures single deterministic write path for ScaffoldAI operational state
- Makes state mutations explicit and auditable
- Prevents uncontrolled state write proliferation
- Supports future state evolution without breaking multiple write locations

Test files in `src/test/` are exempt (they legitimately write temporary state for testing).

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
