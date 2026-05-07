# Bridge Migration Path Contract

## Status

PLANNED ONLY

No files have been moved, renamed, or restructured by this document.

Related audit:
`.scaffoldai/audits/scaffoldai-bridge-migration-preflight.audit.md`

Related identity anchor:
`.scaffoldai/contracts/system-identity.contract.md`

---

## Purpose

Define the exact source-to-target path map and atomic update list for moving
ScaffoldAI-owned bridge state out of `.consync/` into `.scaffoldai/`.

The system-identity contract establishes:
- `.consync/` is for Consync product metadata only
- `.scaffoldai/` holds ScaffoldAI project-local bridge/state/config
- ScaffoldAI development state must not live in `.consync/`

This contract converts the preflight audit findings into an execution-ready
migration map for the `scaffoldai-bridge-migration-v1` packet.

---

## Source to Target Map

### Files / Directories to Move

| Source | Target | Notes |
|---|---|---|
| `.consync/state/active-stream.md` | `.scaffoldai/state/active-stream.md` | BRIDGE — ScaffoldAI stream ownership state |
| `.consync/state/next-action.md` | `.scaffoldai/state/next-action.md` | BRIDGE — live in-flight packet descriptor |
| `.consync/state/handoff.md` | `.scaffoldai/state/handoff.md` | BRIDGE — completed packet closeout state |
| `.consync/state/snapshot.md` | `.scaffoldai/state/snapshot.md` | BRIDGE — loop state summary |
| `.consync/state/active-contract.json` | `.scaffoldai/state/active-contract.json` | BRIDGE — Gatekeeper contract for current SDC |
| `.consync/state/active-contract.md` | `.scaffoldai/state/active-contract.md` | BRIDGE — companion markdown; no runtime dependency |
| `.consync/state/history/` | `.scaffoldai/state/history/` | BRIDGE — historical state snapshots |
| `.consync/streams/process/` | `.scaffoldai/streams/process/` | BRIDGE — process stream state |
| `.consync/streams/electron_ui/` | `.scaffoldai/streams/electron_ui/` | BRIDGE — electron_ui stream state |
| `.consync/packets/` | `.scaffoldai/packets/` | BRIDGE-ADJACENT — timestamped packet files |

### What Remains in `.consync/`

These surfaces are Consync product metadata and must NOT be moved:

| Path | Role | Reason to Remain |
|---|---|---|
| `.consync/product/` | CONSYNC_PRODUCT_METADATA | True Consync product content (product-model.md, current-system.md) |
| `.consync/examples/` | CONSYNC_PRODUCT_METADATA | Product feature examples and usage references |
| `.consync/docs/` | DOCS_ORIENTATION | Navigation index; transitional surface pointing to `.scaffoldai/`; shrinks as `.scaffoldai/` matures |
| `.consync/archive/` | ARCHIVE_HISTORY | Historical conceptual/legacy material; no live references |
| `.consync/quarantine/` | UNKNOWN | Scratch/parking files; classify or archive in a separate cleanup packet |

---

## Atomic Update List

The following files MUST ALL be updated in a single migration commit.
No partial migration should be committed at any point.

### Runtime Source Files

| # | File | Change Required |
|---|---|---|
| 1 | `src/lib/stateIntegrityCheck.js` | Update 5 path constants: `CORE_STATE_FILES.activeStream`, `.nextAction`, `.handoff`, `.snapshot` → `.scaffoldai/state/`; `STREAMS_ROOT` → `.scaffoldai/streams` |
| 2 | `src/lib/getInFlightPacket.js` | Update `NEXT_ACTION_PATH` constant: `.consync/state/next-action.md` → `.scaffoldai/state/next-action.md` |
| 3 | `src/commands/dry-run-check.js` | Update `ACTIVE_CONTRACT_PATH` constant: `.consync/state/active-contract.json` → `.scaffoldai/state/active-contract.json` |
| 4 | `src/commands/consync-run.js` | Update `ACTIVE_CONTRACT_PATH` constant: `.consync/state/active-contract.json` → `.scaffoldai/state/active-contract.json` |
| 5 | `src/commands/system-check.js` | Update path string in `requiredFiles`: `.consync/state/handoff.md` → `.scaffoldai/state/handoff.md` |
| 6 | `src/lib/gatekeeperSwitch.js` | Update error message string (line ~180) and all console.log path strings (lines ~379–385): `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` |
| 7 | `src/lib/gatekeeperClose.js` | Update all console.log path strings (lines ~270–339): `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` |
| 8 | `src/lib/gatekeeperMount.js` | Update all console.log path strings (lines ~577–579): `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` |
| 9 | `src/commands/reentry-check.js` | Update console.log instruction string (line ~263): `.consync/state/` → `.scaffoldai/state/` |
| 10 | `src/commands/reference-audit.js` | Update `REFERENCE_CATEGORIES` needle strings and `expectedZones` arrays: `needle: ".consync/state/"` → `".scaffoldai/state/"`, `needle: ".consync/streams/"` → `".scaffoldai/streams/"`, remove `.consync/` from expectedZones for state/streams, add `.scaffoldai/` |
| 11 | `src/lib/intakeClassify.js` | Update classification data strings (lines 13, 22, 24): `.consync/state/` → `.scaffoldai/state/`, `.consync/docs/` reference does not need to change (`.consync/docs/` is staying) |
| 12 | `src/commands/handoff-bundle.js` | Update console.log string (line ~66): `.consync/` → `.scaffoldai/` where referring to bridge state |

### Test Files

| # | File | Change Required |
|---|---|---|
| 13 | `src/test/bridge-integrity-checks.js` | Update all path strings in `requiredStateFiles` and `requiredStreamFiles` arrays and all inline path strings: `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` |
| 14 | `src/test/state-integrity-checks.js` | Update all path strings passed to `writeFile()` in `createBaseFixture()` and all `readFileSync` calls: `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` (must match stateIntegrityCheck.js constants atomically) |
| 15 | `src/test/unit-get-in-flight-packet.js` | Update temp-dir path `writeNextAction()` creates: `.consync/state/` → `.scaffoldai/state/` (must match getInFlightPacket.js constant) |

### Scripts

| # | File | Change Required |
|---|---|---|
| 16 | `scripts/check-handoff-contract.js` | Update `nextActionPath` and `handoffPath` constants (lines 5–6): `.consync/state/` → `.scaffoldai/state/` |

### Verify Coverage Map

| # | File | Change Required |
|---|---|---|
| 17 | `src/test/verify.js` | Move `future_consync_bridge_scaffoldai_split_behavior` from `NOT_COVERED` to `COVERED` in `printCoverageMap()` |

### Prompts and AI Adapter Docs

| # | File | Change Required |
|---|---|---|
| 18 | `.github/prompts/run_closeout.prompt.md` | Update `.consync/state/handoff.md` path reference → `.scaffoldai/state/handoff.md` |
| 19 | `.github/prompts/run_next_action.prompt.md` | Update all `.consync/state/*` path references → `.scaffoldai/state/*` |
| 20 | `.github/agents/consync-integrity.agent.md` | Update orientation text: `.consync/streams/` → `.scaffoldai/streams/`, `.consync/state/active-stream.md` → `.scaffoldai/state/active-stream.md` |
| 21 | `.github/agents/consync-process.agent.md` | Update orientation text: `.consync/state/active-stream.md` → `.scaffoldai/state/active-stream.md` |
| 22 | `.github/copilot-instructions.md` | Update authority boundary declarations: `.consync/state/` → `.scaffoldai/state/`, `.consync/streams/` → `.scaffoldai/streams/` |

### Docs

| # | File | Change Required |
|---|---|---|
| 23 | `AGENTS.md` | Update `.consync/state/` and `.consync/streams/` references → `.scaffoldai/state/`, `.scaffoldai/streams/` |
| 24 | `README.md` | Review and update any references to `.consync/state/` or `.consync/streams/` |

### File System Operations

| # | Operation | Notes |
|---|---|---|
| 25 | Create `.scaffoldai/state/` directory and move contents from `.consync/state/` | Move all files; remove empty `.consync/state/` directory after |
| 26 | Create `.scaffoldai/streams/` directory and move contents from `.consync/streams/` | Move all stream dirs; remove empty `.consync/streams/` directory after |
| 27 | Create `.scaffoldai/packets/` directory and move contents from `.consync/packets/` | Move all packet files; remove empty `.consync/packets/` directory after |

---

## Required Coupled Updates

These updates are interdependent and MUST be applied together or not at all.

### Coupled Update A — Error message string + test assertion

**Problem:** `gatekeeperSwitch.js` line ~180 produces an error message string
containing hardcoded paths. `state-integrity-checks.js` line 44 asserts the
EXACT TEXT of that string in a test.

```
// gatekeeperSwitch.js (current)
`Only \`${toStream}\` currently owns \`.consync/state/next-action.md\` and \`.consync/state/handoff.md\`.`

// state-integrity-checks.js (current assertion)
"Only `process` currently owns `.consync/state/next-action.md` and `.consync/state/handoff.md`."
```

Both files must be updated to use `.scaffoldai/state/` in the same commit.
If only one is updated, the test FAILS.

### Coupled Update B — `stateIntegrityCheck.js` constants + `state-integrity-checks.js` fixture paths

**Problem:** `state-integrity-checks.js` writes fixture files to temp dirs
using hardcoded `.consync/state/` and `.consync/streams/` paths. These paths
must exactly match the constants in `stateIntegrityCheck.js` or the logic
under test will look for files in a different location than the fixture creates.

Both files must be updated to use `.scaffoldai/state/` and `.scaffoldai/streams/`
in the same commit.

### Coupled Update C — `getInFlightPacket.js` constant + `unit-get-in-flight-packet.js` fixture

**Problem:** `unit-get-in-flight-packet.js` creates a temp-dir fixture at
`.consync/state/next-action.md` to test `getInFlightPacket.js`. The test
fixture path must match the constant in `getInFlightPacket.js`.

Both files must be updated to use `.scaffoldai/state/next-action.md` in the
same commit.

### Coupled Update D — `reference-audit.js` expectedZones

**Problem:** `src/commands/reference-audit.js` lists `expectedZones` for the
`state` and `streams` categories as including `.consync/`. After migration,
references to `.scaffoldai/state/` and `.scaffoldai/streams/` from `src/`
files will be flagged as unexpected unless `expectedZones` is updated.

`reference-audit.js` must be updated to replace `.consync/` with `.scaffoldai/`
in the state and streams expectedZones arrays, and update the needle strings to
`.scaffoldai/state/` and `.scaffoldai/streams/`.

---

## Test Expectations

### Tests that FAIL immediately if migration is incomplete

| Test | Trigger | Failure Mode |
|---|---|---|
| `[verify] Bridge integrity checks` (`bridge-integrity-checks.js`) | Reads live `.consync/state/` and `.consync/streams/` files | Hard failure — files no longer exist at old paths |
| `[verify] State integrity checks` (via `check:state-preflight`) | `stateIntegrityCheck.js` looks for files at new `.scaffoldai/state/` paths; fixtures create files at old `.consync/state/` paths | Hard failure — path mismatch |
| `scripts/check-handoff-contract.js` (via `check:state-preflight`) | Reads `.consync/state/next-action.md` and `handoff.md` | Hard failure — files no longer exist at old paths |
| `[verify] In-flight packet state reader` (`unit-get-in-flight-packet.js`) | Creates fixture at `.consync/state/` but getInFlightPacket.js looks at `.scaffoldai/state/` | Logic failure — file not found |
| `npm run verify:full` | Runs `check:state-preflight` which runs state integrity and handoff contract checks | Full pipeline failure |

### Tests that indicate migration is COMPLETE and correct

| Test | What it confirms |
|---|---|
| `[verify] Bridge integrity checks` PASS | All required state and stream files exist at `.scaffoldai/` paths |
| `[verify] State integrity checks` PASS | `stateIntegrityCheck.js` correctly reads from `.scaffoldai/state/` |
| `check:state-preflight` PASS | `scripts/check-handoff-contract.js` reads from `.scaffoldai/state/` |
| `check:state-postflight` PASS | State integrity validates the migrated state structure |
| `[verify] In-flight packet state reader` PASS | `getInFlightPacket.js` reads from `.scaffoldai/state/next-action.md` |
| `npm run verify` PASS | Full verify pipeline green |
| `npm run verify:full` PASS | All 20 e2e + 42 UI + bridge checks + preflight/postflight green |

---

## Stale Path Checks

Run these grep checks AFTER migration to confirm no live runtime references
to old ScaffoldAI bridge paths remain.

### Check 1 — `.consync/state` references in runtime/test code

```bash
grep -rn "\.consync/state" src/ scripts/ \
  --exclude-dir=node_modules \
  | grep -v "Binary file"
```

Expected result: **zero matches**

Any match indicates a file was missed in the atomic update list.

### Check 2 — `.consync/streams` references in runtime/test code

```bash
grep -rn "\.consync/streams" src/ scripts/ \
  --exclude-dir=node_modules \
  | grep -v "Binary file"
```

Expected result: **zero matches**

Any match indicates a file was missed in the atomic update list.

### Check 3 — `.consync/packets` references in runtime/test code

```bash
grep -rn "\.consync/packets" src/ scripts/ \
  --exclude-dir=node_modules \
  | grep -v "Binary file"
```

Expected result: **zero matches** (no runtime code currently references packets)

### Check 4 — Full `.consync/state` cross-repo scan (including docs)

```bash
grep -rn "\.consync/state" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  | grep -v "Binary file"
```

Expected result: references only in:
- `.consync/` itself (remaining product docs that mention history)
- `.scaffoldai/audits/` (these audit files reference old paths as historical record)
- `.scaffoldai/contracts/` (this contract references old paths as migration source)

Any reference in `src/`, `scripts/`, or `.github/` indicates an incomplete update.

---

## Non-Goals

This contract explicitly defers the following:

- Do NOT move `.consync/product/` — Consync product metadata, stays
- Do NOT move `.consync/examples/` — product examples, stays
- Do NOT move `.consync/archive/` — historical archive, stays
- Do NOT move `.consync/docs/` — navigation/orientation layer, stays (review in a later packet)
- Do NOT move `.consync/quarantine/` — classify or archive in a separate cleanup packet
- Do NOT create `scaffoldai/` (no-dot) package directory — separate future architectural decision, requires its own decision record
- Do NOT begin ScaffoldAI source/process package separation — out of scope

---

## Recommended Execution Packet

**Name:** `scaffoldai-bridge-migration-v1`

**Type:** PROCESS / MIGRATION

**Execution rules:**
- This is ONE atomic migration commit. Do not commit partial updates.
- Execute ALL 27 atomic update items in the same commit.
- Apply all four coupled updates (A, B, C, D) before committing.
- Move actual files LAST, after all path constant updates are written.
- Verify after the commit using both `npm run verify` and `npm run verify:full`.

**Required verification:**

```bash
npm run verify
```

Expected: `[verify] PASS`

```bash
npm run verify:full
```

Expected: all checks PASS including `check:state-preflight`, `check:state-postflight`,
bridge integrity checks, 20/20 e2e tests, 42/42 UI tests.

**Stale path verification:**

```bash
grep -rn "\.consync/state\|\.consync/streams\|\.consync/packets" src/ scripts/ \
  --exclude-dir=node_modules | grep -v "Binary file"
```

Expected: zero matches.
