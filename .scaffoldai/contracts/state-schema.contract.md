# ScaffoldAI State Schema Contract

Created: 2026-05-13
Status: ACTIVE CONTRACT

---

## Purpose

Define the approved contents of `.scaffoldai/state/` and the active policy contract surface to prevent unexpected schema drift.

`.scaffoldai/state/` is operational ScaffoldAI process state. Adding, removing, renaming, or changing state artifacts requires explicit approval and contract updates.

This is a **lightweight guardrail only**. It does not introduce JSON Schema, migrations, sequence numbers, locking, or orchestration.

---

## Approved State Contents

### Operational State Files

These files represent the current operational runtime state of ScaffoldAI:

- `active-runtime.json` — Current transient execution runtime fields (`in_flight_packet`, claim fields)
- `active-stream.md` — Current active stream name
- `next-action.md` — Current in-flight packet or NONE
- `handoff.md` — Current handoff document for active work
- `snapshot.md` — Current operational snapshot
- `cleanup-complete-checkpoint.md` — Cleanup completion marker

Durable process policy is tracked separately at:

- `.scaffoldai/contracts/active-policy.json` — mode + allowed/blocked packet types + policy requirements

**Mutation:** All writes to operational state must go through `src/lib/scaffoldaiState.state.scaffoldai.js` — the single approved state gateway.

### Companion Documentation Files

These files document a specific operational state artifact:

- `active-contract.md` — Companion documentation for legacy composed contract compatibility

**Pattern:** Companion markdown is allowed only when it documents a specific state artifact in the same directory. It must not contain runtime-consumed state.

**Precedent:** companion docs are allowed when they explain runtime or compatibility surfaces without becoming runtime-consumed state.

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

## Runtime-State Housekeeping Categories

Housekeeping separates transient runtime state from implementation changes using these categories:

| Housekeeping Category | Files | Default Reset Behavior |
|---|---|---|
| **active execution state** | `active-runtime.json` (`in_flight_packet`, claim fields) | reset to `null` / clear claims |
| **durable process policy** | `.scaffoldai/contracts/active-policy.json` | never reset by runtime housekeeping |
| **next-action surfaces** | `next-action.md` | reset to `PACKAGE: NONE` |
| **snapshots** | `snapshot.md` current package section | neutralize to `package: NONE` |
| **transient coordination/runtime context** | `.scaffoldai/runtime/mcp/signals.jsonl`, `.scaffoldai/runtime/mcp/shared-memory.jsonl` | preserve by default |
| **append-only runtime logs** | `history.jsonl` | preserve by default |

Runtime-state housekeeping commands:

- `scaffoldai housekeeping status`
- `scaffoldai housekeeping reset-runtime-state`
- `scaffoldai housekeeping reset-runtime-state --include-runtime-logs`

These commands are bounded to known `.scaffoldai/` surfaces and must not mutate product/runtime code or packet archives.

Legacy compatibility note:

- `.scaffoldai/state/active-contract.json` may exist as a compatibility mirror during migration, but it is no longer the primary write target for runtime in-flight state.

## Commit Hygiene Workflow

Recommended workflow before commit:

1. Run `scaffoldai housekeeping status`.
2. Review runtime vs implementation change classification.
3. If needed, run `scaffoldai housekeeping reset-runtime-state`.
4. Re-check `git status --short` and commit implementation changes intentionally.

`--include-runtime-logs` should be used only when intentionally clearing local runtime telemetry.

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
