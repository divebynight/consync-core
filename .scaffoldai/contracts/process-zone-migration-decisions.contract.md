# Process Zone Migration Decisions

## Status

RESOLVED

Related plan:
`.scaffoldai/planning/process-zone-migration.plan.md`

Related contracts:
- `.scaffoldai/contracts/scaffoldai-consync-separation.contract.md`
- `.scaffoldai/contracts/bridge-ownership.contract.md`

---

## Summary

All three blocking open questions from the PROCESS zone migration plan have
been resolved. These decisions are recorded here as a contract so they are
available to any future migration packet and do not require re-evaluation.

No files have been moved, renamed, or restructured by this document.

---

## Decisions

### Decision 1 — Role of `.scaffoldai/`

**Question:** Should `.scaffoldai/` be treated as hidden project-local
bridge/process config, or should ScaffoldAI source eventually live in a
separate non-hidden `scaffoldai/` directory as an npm package?

**Decision:** `.scaffoldai/` is a project-local directory. It is not a
ScaffoldAI source package. It contains:

- PROCESS content (ScaffoldAI harness: agents, skills, prompts, templates,
  process docs, contracts, verification, planning, audits)
- BRIDGE content (live project state and config: `state/`, `streams/`) — once
  BRIDGE migration is executed in a later packet

A future non-hidden `scaffoldai/` directory (without the dot prefix) may
eventually house ScaffoldAI source code or an npm package. That is a separate
architectural decision and is not in scope for the PROCESS migration packet.

**Conclusion:** `.scaffoldai/` = project-local runtime config and harness
layer. It is not a source package and does not need to be non-hidden.

---

### Decision 2 — `contracts/` Migration

**Question:** Should `contracts/` move with PROCESS immediately, or should
top-level architecture contracts remain temporarily in `.scaffoldai/contracts/`
until after migration stabilises?

**Decision:** `contracts/` moves with PROCESS in the first migration packet.
There is no split between "architecture contracts" and "process contracts."
All contracts in `.scaffoldai/contracts/` are ScaffoldAI-owned PROCESS surfaces —
they define system rules, invariants, and ownership boundaries. They belong
in `.scaffoldai/contracts/` alongside the rest of the PROCESS zone.

No exception is made for architecture-level contracts
(`bridge-ownership.contract.md`, `scaffoldai-consync-separation.contract.md`,
or this file). All move together.

Reference updates for cross-links within moved contracts will be handled
atomically in the same migration packet.

**Conclusion:** `contracts/` moves with PROCESS. No split.

---

### Decision 3 — `START_HERE.md` Strategy

**Question:** Should `START_HERE.md` remain in `.consync/docs/` during
transition, or should a new `.scaffoldai/START_HERE.md` be introduced before
migration to pre-orient readers?

**Decision:** Keep a single entry point. `START_HERE.md` remains in
`.consync/docs/` throughout the PROCESS migration. No `.scaffoldai/START_HERE.md`
is created. Dual entry points create navigation ambiguity and reader confusion.

After migration is complete, a single migration note may be added to
`START_HERE.md` pointing readers toward `.scaffoldai/` for process/harness
material. That update is deferred to the post-migration closeout, not this
packet.

**Conclusion:** `START_HERE.md` stays in `.consync/docs/` during migration.
Do not create `.scaffoldai/START_HERE.md` yet.

---

## Implications

- PROCESS zone can be migrated in one atomic packet with no prerequisite
  decision blockers remaining.
- `contracts/` moves with PROCESS — no temporary split.
- `.scaffoldai/` will initially contain PROCESS content only. BRIDGE
  (`state/`, `streams/`) migrates in a separate future packet.
- `START_HERE.md` remains stable and in its current location during migration.
- Reference update scope for the migration packet is well-defined (see plan).

---

## Next Phase

All blocking decisions are resolved. The next step is preparation of an
execution SDC for the PROCESS migration packet as described in
`.scaffoldai/planning/process-zone-migration.plan.md`.

No migration has occurred yet.
