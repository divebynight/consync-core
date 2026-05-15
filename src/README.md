# src/

## Purpose

This is the Consync runtime and product code.

It contains the CLI entry point, command handlers, shared logic, the Electron desktop application, and the test suite.

---

## File Naming Conventions (Current / Provisional)

**Status:** Observational taxonomy — documents current patterns, not enforced as final architecture.

Source files in `src/lib/`, `src/commands/`, and `src/scaffoldai/commands/` use suffixes to indicate ownership and role. This taxonomy is **provisional** and subject to refinement during future reorganization.

### Ownership Suffixes

| Suffix | Owner | Purpose | Examples |
|--------|-------|---------|----------|
| `.consync.js` | Consync Product | Product utilities, runtime logic | `guid.util.consync.js`, `newGuidTool.product.consync.js` |
| `.scaffoldai.js` | ScaffoldAI Process/Bridge | Process logic, bridge control, runtime commands | `scaffoldaiState.state.scaffoldai.js`, `gatekeeperMount.auth.scaffoldai.js` |
| `.shared.js` | Shared | Used by both Consync and ScaffoldAI; domain-neutral | `gitStatus.util.shared.js`, `clipboard.util.shared.js` |
| `.system.js` | System | System-level checks (rare) | `system-check.check.system.js` |

### Role Suffixes (Combined with Ownership)

#### ScaffoldAI Roles

| Suffix | Purpose | Examples |
|--------|---------|----------|
| `.state.scaffoldai.js` | State gateway (read/write boundary) | `scaffoldaiState.state.scaffoldai.js` |
| `.auth.scaffoldai.js` | Authority/gatekeeper modules | `gatekeeperMount.auth.scaffoldai.js`, `scaffoldaiPreflight.auth.scaffoldai.js` |
| `.query.scaffoldai.js` | Query/read-only operations | `scaffoldaiStatus.query.scaffoldai.js`, `getInFlightPacket.query.scaffoldai.js` |
| `.check.scaffoldai.js` | Validation/integrity checks | `stateIntegrityCheck.check.scaffoldai.js`, `dry-run-check.check.scaffoldai.js` |
| `.agent.scaffoldai.js` | Agent logic or entry points | `intakeClassify.agent.scaffoldai.js`, `src/scaffoldai/commands/intake-run.agent.scaffoldai.js` |
| `.process.scaffoldai.js` | Process automation | `portableScaffold.process.scaffoldai.js`, `handoff-bundle.process.scaffoldai.js` |
| `.cmd.scaffoldai.js` | ScaffoldAI runtime commands | `scaffoldai-status.cmd.scaffoldai.js`, `consync-run.cmd.scaffoldai.js` |

#### Consync Roles

| Suffix | Purpose | Examples |
|--------|---------|----------|
| `.util.consync.js` | Product utility functions | `guid.util.consync.js`, `fs.util.consync.js` |
| `.product.consync.js` | Product-specific logic | `newGuidTool.product.consync.js`, `sandbox-anchors.product.consync.js` |
| `.cmd.consync.js` | Product CLI commands | `new-guid.cmd.consync.js`, `sandbox-scan.cmd.consync.js` |

#### Shared Roles

| Suffix | Purpose | Examples |
|--------|---------|----------|
| `.util.shared.js` | Domain-neutral utilities | `gitStatus.util.shared.js`, `time.util.shared.js` |

### Command Files (`src/commands/`, `src/scaffoldai/commands/`)

Command files follow the pattern: `<name>.<role>.<ownership>.js`

**Examples:**
- `sandbox-scan.cmd.consync.js` — Consync product command
- `src/scaffoldai/commands/scaffoldai-status.cmd.scaffoldai.js` — ScaffoldAI runtime command
- `src/scaffoldai/commands/intake-run.agent.scaffoldai.js` — ScaffoldAI agent entry point
- `dry-run-check.check.scaffoldai.js` — ScaffoldAI validation command
- `system-check.check.system.js` — System-level check

### Library Files (`src/lib/`)

Library files follow the pattern: `<name>.<role>.<ownership>.js`

**Examples:**
- `scaffoldaiState.state.scaffoldai.js` — ScaffoldAI state gateway
- `gatekeeperMount.auth.scaffoldai.js` — ScaffoldAI authority module
- `guid.util.consync.js` — Consync product utility
- `gitStatus.util.shared.js` — Shared utility

### Test Files (`src/test/`)

Test files generally use descriptive names without ownership suffixes:
- `unit-<feature>.js` — Unit tests
- `integration-<feature>-cli.js` — Integration tests
- `renderer-<feature>-panel.js` — Renderer slice tests
- `mcp-<variant>-<type>.js` — MCP tests
- Exception: `scaffoldai-invariants.test.js` uses `.test.js` suffix

### Known Taxonomy Gaps (Not Failures)

These are documented as current blurry boundaries, not defects:

1. **No consistent test suffix pattern** — Most tests use descriptive names; only `scaffoldai-invariants.test.js` uses `.test.js`
2. **Mixed granularity** — Some files combine ownership + role in single suffix (e.g., `.util.shared.js`), others separate them
3. **Historical naming** — Some older files may not follow current patterns perfectly
4. **Ambiguous boundaries** — Files at process/product boundary may be harder to classify

### Why Provisional?

- The repo has not completed final reorganization
- Suffixes indicate current ownership intent, not permanent package layout
- Future refactoring may consolidate, split, or reorganize modules
- This documentation captures observed patterns to aid human/AI understanding during interim state

### Enforcement

- **NOT enforced** — No automated tests validate naming conventions yet
- **Soft boundary** — Invariant tests check for `.consync.js` vs `.scaffoldai.js` presence but don't validate naming consistency
- **Guidance only** — Use as reference when adding new files, not as rigid schema

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
- Work packets, handoff records, or snapshot files
- Sandbox fixtures or probes (those live in `sandbox/`)

---

## Important Boundaries

- Business logic lives in `lib/` — not buried inside command or CLI files
- `commands/` files should be thin: parse input, call `lib/`, print output
- `electron/` code communicates with `lib/` through the preload bridge — not directly
- Tests in `test/` verify behavior; they do not modify `.scaffoldai/` state files except in isolated temp dirs
- `src/` must remain useful outside Electron — the CLI should work without the desktop app running
- Strict ScaffoldAI packet intake is local CLI only and file-based only; intake validates formal SDC structure, but intake does not imply activation or execution approval
- Preferred intake source path is `.scaffoldai/inbox/*.sdc.md`; valid sources outside inbox are accepted with an explicit warning for migration compatibility
- Intake artifact cleanup is explicit via `scaffoldai housekeeping clean-intake-artifacts`; this cleanup removes transient intake metadata/candidates only and preserves accepted packets and append-only logs

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `sandbox/` | Test fixtures, probes, and runtime dev artifacts used during development |
| `scripts/` | Project utility scripts (state checks, Playwright helpers) — not product runtime |
| `.scaffoldai/` | ScaffoldAI process harness — separate from product code |

---

## Verification Notes

- `npm run verify` — runs the full verify suite including CLI, renderer, and bridge tests
- `npm run verify:full` — also runs unit, integration, preload build, e2e, and state checks
- All tests in `src/test/` should pass before any commit
