# ScaffoldAI State Schema Contract

Created: 2026-05-13
Status: ACTIVE CONTRACT

---

## Purpose

Define the approved contents of `.scaffoldai/state/` to prevent unexpected schema drift.

`.scaffoldai/state/` is operational ScaffoldAI process state. Adding, removing, renaming, or changing state artifacts requires explicit approval and contract updates.

This is a **lightweight guardrail only**. It does not introduce JSON Schema, migrations, sequence numbers, locking, or orchestration.

---

## Approved State Contents

### Operational State Files

These files represent the current operational state of ScaffoldAI:

- `active-contract.json` — Current work packet metadata (PACKET_ID, PACKAGE, etc.)
- `active-stream.md` — Current active stream name
- `next-action.md` — Current in-flight packet or NONE
- `handoff.md` — Current handoff document for active work
- `snapshot.md` — Current operational snapshot
- `cleanup-complete-checkpoint.md` — Cleanup completion marker

**Mutation:** All writes to operational state must go through `src/lib/scaffoldaiState.state.scaffoldai.js` — the single approved state gateway.

### Companion Documentation Files

These files document a specific operational state artifact:

- `active-contract.md` — Companion documentation for `active-contract.json`

**Pattern:** Companion markdown is allowed only when it documents a specific state artifact in the same directory. It must not contain runtime-consumed state.

**Precedent:** `active-contract.json` + `active-contract.md` established this pattern.

### Append-Only Observational History

These files provide non-authoritative audit trails:

- `history.jsonl` — Append-only state transition history (created on first append)
- `history.md` — Companion documentation for `history.jsonl`

**Mutation:** History appends must go through `scaffoldaiState.appendHistory()` after successful state writes. History does not participate in decision-making or become source of truth.

### Intentional Subdirectories

These subdirectories are approved for specific purposes:

- `history/` — Observational history artifacts (not authoritative state)
  - `events.log` — Event log (if exists)
  - `plans/` — Planning artifacts (if exists, may be empty)

**Note:** `history/` contents are observational only. They must not contain authoritative operational state.

---

## State Categories

| Category | Description | Examples | Write Pattern |
|----------|-------------|----------|---------------|
| **Operational State** | Current active work state | `next-action.md`, `handoff.md` | Via `scaffoldaiState` gateway only |
| **Companion Docs** | Documents a specific state artifact | `active-contract.md`, `history.md` | Created alongside the artifact it documents |
| **Append-Only History** | Non-authoritative audit trail | `history.jsonl` | Via `scaffoldaiState.appendHistory()` only |
| **Observational Subdirs** | Non-authoritative diagnostic data | `history/` | Not source of truth, may be diagnostic only |

---

## Adding New State Artifacts

When adding a new state file:

1. **Require explicit architectural approval** — Do not add state files without discussion
2. **Update this contract** — Add the new file to the approved list
3. **Choose a category** — Operational state, companion docs, or history?
4. **Define write pattern** — Must go through `scaffoldaiState` gateway or explicit helper
5. **Add invariant coverage** — Update `checkStateSchemaInvariant()` in `scaffoldai-invariants.test.js`
6. **Document purpose** — Explain what the file represents and when it's created

**Default answer: NO.** Adding state files should be rare and deliberate.

---

## Removing or Renaming State Artifacts

When removing or renaming a state file:

1. **Update this contract** — Remove from approved list or update name
2. **Update invariant test** — Modify `checkStateSchemaInvariant()` expectations
3. **Update all readers/writers** — Search codebase for references
4. **Update `scaffoldaiState` gateway** — Remove or rename exported functions
5. **Verify no regressions** — Run full verification suite

---

## Forbidden Patterns

Do NOT:

- Add state files without updating this contract
- Create temporary files in `.scaffoldai/state/` (use `.scaffoldai/tmp/` instead)
- Add database files, indexes, or caches in `.scaffoldai/state/`
- Add generated artifacts or build outputs in `.scaffoldai/state/`
- Create nested state directories without explicit approval
- Treat `.scaffoldai/state/` as a general-purpose drop zone
- Add sequence numbers, locking files, or coordination primitives
- Create migration scripts or schema versioning systems
- Add JSON Schema validation or complex state machinery

---

## Verification

The invariant test `checkStateSchemaInvariant()` in `src/test/scaffoldai-invariants.test.js` enforces this contract by:

1. Listing all files and directories in `.scaffoldai/state/`
2. Comparing against the approved list in this contract
3. Failing if unexpected files or directories appear
4. Allowing `history.jsonl` to be absent (created on first append)
5. Failing if required operational state files are missing

Run verification:

```bash
npm run verify:scaffoldai
```

---

## Rationale

**Why this contract exists:**

1. `.scaffoldai/state/` should not become an open drop zone
2. State schema changes should be deliberate and reviewed
3. Adding files without coordination leads to confusion
4. A lightweight check prevents accidental drift
5. Explicit approval ensures architectural consistency

**What this is NOT:**

- NOT a JSON Schema validation system
- NOT a migration framework
- NOT a versioning system
- NOT a locking or coordination mechanism
- NOT heavy process overhead

This is a **simple file list check** to catch unexpected additions before they become problems.

---

## Related Contracts

- `.scaffoldai/contracts/bridge-ownership.contract.md` — Bridge state ownership model
- `.scaffoldai/contracts/state-contracts-and-integrity-checks.contract.md` — State integrity checking
- `.scaffoldai/state/history.md` — Append-only history format and constraints
