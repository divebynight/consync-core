# ScaffoldAI Bridge Migration Preflight Audit

- date: 2026-05-03
- auditor: Copilot (read-only pass)
- anchor: `.scaffoldai/contracts/system-identity.contract.md`
- branch: feature/product-design-electron
- trigger: readiness check before moving ScaffoldAI-owned state out of `.consync/`

---

## Status

PASS — with gaps declared

Migration is technically feasible. Tests are dense and cover the runtime logic
for all bridge-path-dependent behavior. No critical paths are untested.
However, three declared gaps exist that must be resolved BEFORE migration
begins:

1. `future_consync_bridge_scaffoldai_split_behavior` is listed as NOT_COVERED
   in the verify coverage map. This is an explicit declaration that migration
   path consistency is not verified.
2. `src/commands/reference-audit.js` hardcodes `.consync/` as the expected
   zone for state and stream references. After migration, this command will
   produce false positives unless updated atomically.
3. No test validates PATH CONSTANT consistency across all migration-affected
   files. A partial migration (e.g., stateIntegrityCheck.js updated but
   gatekeeperSwitch.js not updated) would only be caught at runtime, not by a
   dedicated cross-file consistency check.

These gaps do not block migration planning. They define what must be done in
the migration packet itself before tests can validate the new state.

---

## Summary

The system-identity contract defines a clear target:
- `.consync/` = Consync product metadata only (sessions, bookmarks, notes)
- `.scaffoldai/` = ScaffoldAI bridge/state/config (next-action, handoff,
  snapshot, streams, packets, process runtime data)

Currently, `.consync/state/` and `.consync/streams/` hold ScaffoldAI bridge
state that belongs in `.scaffoldai/state/` and `.scaffoldai/streams/` under
the target model. This migration has a HIGH but bounded blast radius:
6 source files, 3 test files, 1 script, and 1 runtime command have hardcoded
paths. All of them are already covered by tests that use either temp-dir
fixtures (testing logic) or live-file reads (validating current state).

The migration must be executed atomically — all path constants updated in the
same commit, with `npm run verify:full` confirming success.

---

## Current `.consync/` Ownership Map

| Path | Current Role | Target Location (system-identity model) | Migration Risk | Notes |
|---|---|---|---|---|
| `.consync/state/active-stream.md` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/active-stream.md` | HIGH | Read by stateIntegrityCheck.js, gatekeeperSwitch.js; checked by bridge-integrity-checks.js |
| `.consync/state/next-action.md` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/next-action.md` | HIGH | Read by getInFlightPacket.js, stateIntegrityCheck.js, scripts/check-handoff-contract.js |
| `.consync/state/handoff.md` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/handoff.md` | HIGH | Read by system-check.js, stateIntegrityCheck.js, scripts/check-handoff-contract.js; checked by bridge-integrity-checks.js |
| `.consync/state/snapshot.md` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/snapshot.md` | HIGH | Read by stateIntegrityCheck.js; checked by bridge-integrity-checks.js |
| `.consync/state/active-contract.json` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/active-contract.json` | HIGH | Read by dry-run-check.js, consync-run.js; checked by bridge-integrity-checks.js |
| `.consync/state/active-contract.md` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/state/active-contract.md` | LOW | Companion markdown; not read by runtime code |
| `.consync/streams/process/` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/streams/process/` | HIGH | Read/written by gatekeeperSwitch.js; checked by bridge-integrity-checks.js, state-integrity-checks.js |
| `.consync/streams/electron_ui/` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/streams/electron_ui/` | HIGH | Read/written by gatekeeperSwitch.js; checked by bridge-integrity-checks.js, state-integrity-checks.js |
| `.consync/packets/` | SCAFFOLDAI_BRIDGE_STATE | `.scaffoldai/packets/` | LOW | 2 timestamped packet files; not referenced by runtime code |
| `.consync/docs/` | DOCS_ORIENTATION | Uncertain — see notes | LOW | Navigation index; now primarily forwards to `.scaffoldai/`; may remain in `.consync/` or move to `.scaffoldai/docs/` |
| `.consync/product/` | CONSYNC_PRODUCT_METADATA | REMAINS in `.consync/` | NONE | product-model.md, current-system.md; true Consync product content |
| `.consync/examples/` | CONSYNC_PRODUCT_METADATA | REMAINS in `.consync/` | NONE | Product examples; no runtime dependency |
| `.consync/archive/` | ARCHIVE_HISTORY | REMAINS in `.consync/` | NONE | Historical material; no live references |
| `.consync/quarantine/` | UNKNOWN | Classify or archive; remains in `.consync/` | NONE | 2 scratch files; no system role |
| `.consync/contracts/` | DUPLICATE (CONFLICT) | Remove after orphan cleanup | NONE | See orphan-contract-cleanup-v1 recommendation from previous audit |

---

## Live `.consync/` Reference Map

### Runtime Code

| File | Reference | Classification | Covered by Test? | Required Action |
|---|---|---|---|---|
| `src/lib/stateIntegrityCheck.js:5–10` | `.consync/state/active-stream.md`, `next-action.md`, `handoff.md`, `snapshot.md` as path constants; `.consync/streams` as root | SCAFFOLDAI_BRIDGE | YES — `state-integrity-checks.js` (temp-dir; tests logic) | Update path constants to `.scaffoldai/state/` and `.scaffoldai/streams` |
| `src/lib/getInFlightPacket.js:4` | `NEXT_ACTION_PATH = ".consync/state/next-action.md"` | SCAFFOLDAI_BRIDGE | YES — `unit-get-in-flight-packet.js` (temp-dir; tests logic) | Update constant to `.scaffoldai/state/next-action.md` |
| `src/commands/dry-run-check.js:6` | `ACTIVE_CONTRACT_PATH = ".consync/state/active-contract.json"` | SCAFFOLDAI_BRIDGE | PARTIAL — `bridge-integrity-checks.js` checks file exists; `unit-dry-run-check.js` tests logic without file read | Update constant to `.scaffoldai/state/active-contract.json` |
| `src/commands/consync-run.js:7` | `ACTIVE_CONTRACT_PATH = ".consync/state/active-contract.json"` | SCAFFOLDAI_BRIDGE | PARTIAL — `unit-consync-run.js` in verify pipeline; depends on whether it uses temp dirs | Update constant to `.scaffoldai/state/active-contract.json` |
| `src/commands/system-check.js:24` | `.consync/state/handoff.md` as file existence string | SCAFFOLDAI_BRIDGE | YES — `system-check` command run directly in verify pipeline | Update path string |
| `src/lib/gatekeeperSwitch.js:379–385` | `.consync/streams/` and `.consync/state/` in console.log output strings | SCAFFOLDAI_BRIDGE (console-only) | LOW — `gatekeeper-checks.js` tests switch logic with in-memory state; output strings not asserted | Update console strings (low risk — not asserted) |
| `src/lib/gatekeeperSwitch.js:180` | `.consync/state/next-action.md` and `handoff.md` in error message string | SCAFFOLDAI_BRIDGE (string) | LOW — assertion text in `state-integrity-checks.js` hardcodes this exact string | Update message string AND update `state-integrity-checks.js` assertion |
| `src/lib/gatekeeperClose.js:270–339` | `.consync/state/` and `.consync/streams/` in console.log output strings | SCAFFOLDAI_BRIDGE (console-only) | LOW — `gatekeeper-checks.js` tests logic; console strings not asserted | Update console strings |
| `src/lib/gatekeeperMount.js:577–579` | `.consync/state/` and `.consync/streams/` in console.log output strings | SCAFFOLDAI_BRIDGE (console-only) | LOW — `gatekeeper-checks.js` tests logic; console strings not asserted | Update console strings |
| `src/commands/reentry-check.agent.scaffoldai.js:263` | `.consync/state/` in console.log instruction string | SCAFFOLDAI_BRIDGE (console-only) | LOW — string is user-facing instruction; not asserted in tests | Update console string |
| `src/commands/handoff-bundle.process.scaffoldai.js:66` | `.consync/` in console.log string | DOCS reference (string) | LOW — integration test runs the command; string not asserted | Update console string |
| `src/lib/intakeClassify.agent.scaffoldai.js:13,22,24` | `.consync/docs/`, `.consync/state/` as classification pattern strings | CLASSIFICATION DATA | LOW — `unit-intake-run.js` tests classification logic; these are data strings, not file reads | Update string values to new paths |
| `src/commands/reference-audit.js:32–38` | `.consync/state/` and `.consync/streams/` as needle strings; `.consync/` in expectedZones | AUDIT CONFIG | NO dedicated test — run as `reference-audit` npm script; NOT in verify pipeline | Update needle strings and expectedZones to `.scaffoldai/state/`, `.scaffoldai/streams/` |

### Scripts

| File | Reference | Classification | Covered by Test? | Required Action |
|---|---|---|---|---|
| `scripts/check-handoff-contract.js:5–6` | `.consync/state/next-action.md`, `.consync/state/handoff.md` as path constants | SCAFFOLDAI_BRIDGE | PARTIAL — `test:handoff-contract` runs this script; not in `npm run verify` but in `check:state-preflight` chain? NO — not in verify:full directly | Update path constants to `.scaffoldai/state/` |

### Tests (live-file reads — must update during migration)

| File | Reference | Classification | What breaks if paths move? | Required Action |
|---|---|---|---|---|
| `src/test/bridge-integrity-checks.js:9–18` | All `.consync/state/` and `.consync/streams/` paths as file read targets | SCAFFOLDAI_BRIDGE | THIS TEST FAILS immediately — it reads live files | Update all path strings to `.scaffoldai/state/` and `.scaffoldai/streams/` |
| `src/test/state-integrity-checks.js:16,44,51,77,124,140,162,206,251,297,343–383` | `.consync/state/` and `.consync/streams/` paths written to temp dirs | TEST FIXTURE PATHS | Test fails because stateIntegrityCheck.js path constants won't match temp paths | Update all path strings atomically with stateIntegrityCheck.js constants |

### Tests (temp-dir logic tests — need updating but won't fail from path move alone)

| File | Reference | Classification | What breaks if paths move? | Required Action |
|---|---|---|---|---|
| `src/test/unit-get-in-flight-packet.js` | Creates `.consync/state/` in temp dir to test getInFlightPacket.js | TEST FIXTURE | Fails only if getInFlightPacket.js constant changes without test update | Update temp-dir path to match new constant |

### Prompts and Docs (AI-only, not runtime)

| File | Reference | Classification | Covered by Test? | Required Action |
|---|---|---|---|---|
| `.github/prompts/run_closeout.prompt.md` | `.consync/state/handoff.md` | DOCS / AI PROMPT | No | Update path reference |
| `.github/prompts/run_next_action.prompt.md` | `.consync/state/*` | DOCS / AI PROMPT | No | Update path references |
| `.github/agents/consync-integrity.agent.md` | `.consync/streams/`, `.consync/state/active-stream.md` (orientation text) | DOCS / AI AGENT | No | Update orientation text |
| `.github/agents/consync-process.agent.md` | `.consync/state/active-stream.md` (orientation text) | DOCS / AI AGENT | No | Update orientation text |
| `.github/copilot-instructions.md` | `.consync/state/`, `.consync/streams/` (authority boundary declarations) | DOCS / AI ADAPTER | No | Update authority boundary text |
| `AGENTS.md` | `.consync/state/`, `.consync/streams/` | DOCS | No | Update references |
| `README.md` | `.consync/` (general product description) | DOCS | No | Review and update as needed |

---

## Test Coverage Assessment

### Tests that WILL FAIL immediately if paths move (must update in same commit)

1. **`src/test/bridge-integrity-checks.js`** — reads live repo files at
   `.consync/state/` and `.consync/streams/`. Hard failure on path move.
   Runs as `[verify] Bridge integrity checks` in `npm run verify`.

2. **`src/test/state-integrity-checks.js`** — writes `.consync/state/` and
   `.consync/streams/` paths into temp dirs to test `stateIntegrityCheck.js`
   logic. If the path constants in `stateIntegrityCheck.js` change, the temp
   fixtures must change to match. Hard failure if out of sync.
   Runs as `[verify] State integrity checks` in `check:state-preflight` and
   `check:state-postflight` (which run as part of `verify:full`).

3. **`scripts/check-handoff-contract.js`** — reads live `.consync/state/`
   files. Hard failure on path move.
   Runs as `check:state-preflight` → `state-integrity-check preflight` which
   calls `stateIntegrityCheck.js`. The script itself is standalone but is
   invoked by `test:handoff-contract`. NOT in `npm run verify` directly, but
   in `verify:full` via `check:state-preflight`.

### Tests that test LOGIC via temp dirs (need update but won't fail from file move)

4. **`src/test/unit-get-in-flight-packet.js`** — creates a `.consync/state/`
   temp directory to test getInFlightPacket.js. If the constant in
   getInFlightPacket.js changes, this test's fixture must match.
   Runs in `npm run verify` via `[verify] In-flight packet state reader`.

### Tests that have PARTIAL coverage of path constants

5. **`src/test/unit-dry-run-check.js`** — tests Gatekeeper decision logic;
   may not test the file-read path through `ACTIVE_CONTRACT_PATH`. The
   `bridge-integrity-checks.js` only asserts the file exists, not that
   `dry-run-check.js` reads it correctly at the new path.

6. **`src/test/unit-consync-run.js`** — tests consync-run behavior. Path
   constant coverage depends on whether it exercises the file-read code path.
   Not fully confirmed from this audit.

### Declared gap in coverage map

7. **`future_consync_bridge_scaffoldai_split_behavior`** is explicitly listed
   as `NOT_COVERED` in `verify.js` coverage map. This confirms that no test
   validates that all bridge path constants are consistent with each other
   post-migration.

---

## Gaps Before Migration

| Gap | Severity | Description |
|---|---|---|
| No cross-file path-constant consistency check | MEDIUM | If any one of the 6+ files with `.consync/state/` constants is updated without the others, the inconsistency is only caught at runtime or by bridge-integrity-checks.js failing (which reads live files, not constants) |
| `reference-audit.js` expectedZones not updated | MEDIUM | After migration, `src/commands/reference-audit.js` will flag `.scaffoldai/state/` references from `src/` as being in unexpected zones, since its `expectedZones` currently lists `.consync/` for state and streams. The `reference-audit` npm script is not in the verify pipeline but operators run it manually |
| `gatekeeperSwitch.js` error message string asserted in test | LOW-MEDIUM | `state-integrity-checks.js` hardcodes the string `"Only \`process\` currently owns \`.consync/state/next-action.md\` and \`.consync/state/handoff.md\`."` as an assertion. Must update this string in both `gatekeeperSwitch.js` and `state-integrity-checks.js` atomically |
| `unit-consync-run.js` and `unit-dry-run-check.js` coverage of file-read paths | LOW | Not confirmed whether these tests exercise the `ACTIVE_CONTRACT_PATH` file-read code path. Need to inspect before declaring full coverage |
| `.github/` and docs path references | LOW | AI prompts, AGENTS.md, README.md all reference `.consync/state/` and `.consync/streams/`. Not tested; will produce operator confusion after migration if not updated |
| `scripts/check-handoff-contract.js` path constants | LOW | Not in `npm run verify` directly; easy to miss in migration |

---

## Recommended Migration Sequence

This is a planning record only. No files are moved.

**Step 0 (precondition): Orphan cleanup**
Remove `.consync/contracts/bridge-ownership.contract.md` (already identified
in target-structure-reconciliation.audit.md). Zero risk, zero path dependencies.

**Step 1 (decision record)**
Create `.scaffoldai/contracts/bridge-migration-path.contract.md` declaring:
- Exact source → target path mapping for all bridge files
- That `.consync/state/` → `.scaffoldai/state/` and `.consync/streams/` → `.scaffoldai/streams/`
- That `.consync/packets/` → `.scaffoldai/packets/`
- Migration execution will be one atomic commit
- All path constants, test fixtures, scripts, docs, and prompts update in the same commit

**Step 2 (atomic migration commit)**
In a single commit, update ALL of the following:
1. `src/lib/stateIntegrityCheck.js` — update 5 path constants
2. `src/lib/getInFlightPacket.js` — update 1 path constant
3. `src/commands/dry-run-check.js` — update 1 path constant
4. `src/commands/consync-run.js` — update 1 path constant
5. `src/commands/system-check.js` — update 1 path string
6. `src/lib/gatekeeperSwitch.js` — update console strings + error message string
7. `src/lib/gatekeeperClose.js` — update console strings
8. `src/lib/gatekeeperMount.js` — update console strings
9. `src/commands/reentry-check.agent.scaffoldai.js` — update console string
10. `src/commands/reference-audit.js` — update needle strings and expectedZones
11. `src/lib/intakeClassify.agent.scaffoldai.js` — update classification data strings
12. `src/commands/handoff-bundle.process.scaffoldai.js` — update console string
13. `scripts/check-handoff-contract.js` — update 2 path constants
14. `src/test/bridge-integrity-checks.js` — update all path strings
15. `src/test/state-integrity-checks.js` — update all path strings (must match step 1 constants)
16. `src/test/unit-get-in-flight-packet.js` — update temp-dir path to match step 2 constant
17. `.github/prompts/run_closeout.prompt.md` — update path reference
18. `.github/prompts/run_next_action.prompt.md` — update path references
19. `.github/agents/consync-integrity.agent.md` — update orientation text
20. `.github/agents/consync-process.agent.md` — update orientation text
21. `.github/copilot-instructions.md` — update authority boundary text
22. `AGENTS.md` — update path references
23. `README.md` — review and update as needed
24. Move actual files/dirs: `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/`, `.consync/packets/` → `.scaffoldai/packets/`
25. Update `verify.js` coverage map: replace `future_consync_bridge_scaffoldai_split_behavior` from NOT_COVERED to COVERED

Verification after this commit: `npm run verify:full` must pass (20/20 e2e,
42/42 UI, all bridge integrity checks).

**Step 3 (post-migration cleanup)**
Evaluate what remains in `.consync/`:
- `.consync/docs/` — decide: shrink to pure navigation or remove as `.scaffoldai/` matures
- `.consync/product/` — keep; true Consync product metadata
- `.consync/examples/` — keep; product examples
- `.consync/archive/` — keep; historical material
- `.consync/quarantine/` — classify or archive

---

## Recommended Next Safe Packet

**`bridge-migration-path-inventory-v1`**

- Type: PROCESS / DOCUMENTATION
- Scope: Create `.scaffoldai/contracts/bridge-migration-path.contract.md`
  containing the exact path migration map, atomic update list, and migration
  decision record
- What it produces: A single authoritative reference that any future migration
  session can use to execute Step 2 without re-auditing
- Why this is safe: Documentation only; zero runtime changes; zero file moves;
  zero test changes; `npm run verify` passes trivially
- Risk: None
- Verification: `npm run verify` passes

This packet transforms the findings from this audit into an actionable, compact
migration contract so Step 2 can be executed in a future session without
repeating this research.

---

## Non-Goals

- No files moved in this audit.
- No path constants updated.
- No bridge migration started.
- No runtime code changes.
- No deletion of `.consync/state/` or `.consync/streams/`.
