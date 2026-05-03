# Process Zone Migration Plan

## Status

PLANNED ONLY

No files have been moved, renamed, or restructured by this document.

Related contracts:
- `.consync/contracts/scaffoldai-consync-separation.contract.md`
- `.consync/contracts/bridge-ownership.contract.md`
- `.consync/audits/consync-reference-audit.process.md`

---

## Purpose

The `.consync/` directory currently contains a mix of runtime Bridge state,
ScaffoldAI process harness material, and product/project documentation. This
conflation makes ownership ambiguous and complicates the intended
Consync/ScaffoldAI/Bridge architecture separation.

This plan prepares the future separation of ScaffoldAI-owned PROCESS surfaces
from the overloaded `.consync/` directory. The migration target is a new
`.scaffoldai/` directory at the repo root that clearly owns all process harness
content.

This is a planning document only. No structural changes occur here.

---

## Source Zones

PROCESS zones currently under `.consync/`:

- `.consync/process/`
- `.consync/agents/`
- `.consync/skills/`
- `.consync/contracts/`
- `.consync/templates/`
- `.consync/prompts/`
- `.consync/verification/`
- `.consync/planning/`
- `.consync/audits/`

All of these have **zero runtime code dependency**. The reference audit
confirmed no Node.js command, lib, or test reads from any of these paths.

---

## Target Structure

Intended future structure after migration:

```text
.scaffoldai/
  process/
  agents/
  skills/
  contracts/
  templates/
  prompts/
  verification/
  planning/
  audits/
```

`.consync/` would retain only:

```text
.consync/
  state/          <- BRIDGE, unchanged
  streams/        <- BRIDGE, unchanged
  docs/           <- PRODUCT/DOCS, unchanged
  product/        <- PRODUCT, unchanged
  examples/       <- PRODUCT/DOCS, unchanged
  archive/        <- HISTORICAL, unchanged
  packets/        <- BRIDGE-adjacent, unchanged
  quarantine/     <- MISC, unchanged
```

---

## Explicit Non-Goals

This plan does not cover and must not trigger:

- Moving `.consync/state/` — BRIDGE, high runtime dependency
- Moving `.consync/streams/` — BRIDGE, high runtime dependency
- Migrating any PRODUCT or DOCS metadata (`docs/`, `product/`, `examples/`)
- Changing any runtime behavior in `src/`
- Updating any runtime code constants or paths
- Creating `.scaffoldai/` before the migration packet is explicitly executed

---

## Audit-Based Impact Summary

From `.consync/audits/consync-reference-audit.process.md`:

**Runtime dependency on PROCESS zones:** NONE

No file in `src/`, `scripts/`, or test code reads from `.consync/process/`,
`.consync/agents/`, `.consync/skills/`, `.consync/contracts/`,
`.consync/templates/`, `.consync/prompts/`, `.consync/verification/`,
`.consync/planning/`, or `.consync/audits/` at runtime.

**Runtime dependency on BRIDGE zones:** HIGH

`src/commands/`, `src/lib/`, `src/test/`, and `scripts/` all hardcode
`.consync/state/` and `.consync/streams/` paths. These must not move.

**Expected impact from PROCESS migration:**

| Surface | Impact | Notes |
|---|---|---|
| `.github/prompts/run_closeout.prompt.md` | Path update required | References `.consync/skills/closeout-agent.md` (PROCESS) and `.consync/state/handoff.md` (BRIDGE — unchanged) |
| `.github/prompts/run_next_action.prompt.md` | Path update required | References `.consync/process/runbook.process.md` (PROCESS) |
| `src/lib/intakeClassify.js` | String update required | `.consync/process/`, `.consync/agents/`, `.consync/docs/` appear as classification pattern strings — not file reads |
| `src/commands/reference-audit.js` | String update required | `REFERENCE_CATEGORIES` lists `.consync/` zone paths as search needles |
| Internal `.consync/` doc cross-links | Path update required | Many process docs link to other process docs by relative or `.consync/` path |
| `README.md`, `AGENTS.md`, `.github/copilot-instructions.md` | Orientation text update | Navigation links and authority boundary text reference `.consync/` paths |
| `src/commands/handoff-bundle.js` | Path update required | Contains `RUNBOOK_PATH = path.join(".consync", "process", "runbook.process.md")` — PROCESS pointer stored as a constant |

**Verification impact:** Expected to be manageable if all path updates are made
atomically in a single packet. `npm run verify` and `npm run verify:full` must
pass before commit.

---

## Proposed Migration Strategy

The following is a single future atomic packet. Do not execute any step
partially.

1. Create `.scaffoldai/` at repo root.
2. Move all PROCESS zone directories together:
   - `.consync/process/` → `.scaffoldai/process/`
   - `.consync/agents/` → `.scaffoldai/agents/`
   - `.consync/skills/` → `.scaffoldai/skills/`
   - `.consync/contracts/` → `.scaffoldai/contracts/`
   - `.consync/templates/` → `.scaffoldai/templates/`
   - `.consync/prompts/` → `.scaffoldai/prompts/`
   - `.consync/verification/` → `.scaffoldai/verification/`
   - `.consync/planning/` → `.scaffoldai/planning/`
   - `.consync/audits/` → `.scaffoldai/audits/`
3. Update all path references in the same commit:
   - `.github/prompts/run_closeout.prompt.md`
   - `.github/prompts/run_next_action.prompt.md`
   - `src/lib/intakeClassify.js` (classification strings)
   - `src/commands/reference-audit.js` (zone needle strings)
   - `src/commands/handoff-bundle.js` (`RUNBOOK_PATH` constant)
   - All internal doc cross-links inside the moved directories
   - `README.md`, `AGENTS.md`, `.github/copilot-instructions.md` orientation text
   - `.github/` agent instruction files referencing `.consync/` PROCESS paths
4. Leave `.consync/state/` and `.consync/streams/` completely untouched.
5. Run `npm run verify` — must PASS before commit.
6. Run `npm run verify:full` — must PASS before commit.
7. Commit as a single migration packet with a clear commit message.

---

## Risks

| Risk | Severity | Notes |
|---|---|---|
| Broken AI prompt paths | MEDIUM | `.github/prompts/` read `.consync/skills/` and `.consync/process/` paths at prompt execution time; broken paths degrade AI behavior without crashing Node.js commands |
| Stale `reference-audit.js` categories | LOW–MEDIUM | `REFERENCE_CATEGORIES` uses zone path strings as search needles; they become stale but do not break runtime unless the audit command is used |
| Stale `intakeClassify.js` patterns | LOW | Classification strings are not filesystem reads; stale patterns produce wrong classification labels but do not crash |
| Internal doc links pointing to old `.consync/` paths | LOW | Cross-links inside moved docs break navigation for human and AI readers but have no code impact |
| Human confusion if `.consync/` and `.scaffoldai/` coexist without guidance | MEDIUM | `START_HERE.md` and `AGENTS.md` must clearly direct readers to `.scaffoldai/` before migration is published |
| Partial migration committed by mistake | HIGH | Any partial state (some dirs moved, others not) creates a broken mixed reference state. The rollback plan must be followed immediately if verify fails. |

---

## Rollback Plan

- The migration must be a single commit. No intermediate partial states should
  be committed.
- If `npm run verify` fails after migration, revert the migration commit
  immediately: `git revert <migration-commit>` or `git reset --hard HEAD~1`.
- If `npm run verify:full` fails, the same revert applies.
- No partial migration should remain in the branch. Partial states create
  reference confusion that is harder to untangle than a clean revert.

---

## Suggested First Migration Packet

When ready to execute:

**PROCESS zone migration packet**

- Scope: Move all PROCESS zones from `.consync/*` to `.scaffoldai/*`
- Include in the same packet: all reference and path updates identified above
- Exclude from this packet: all BRIDGE zone changes (`state/`, `streams/`)
- Exclude from this packet: all runtime code constant changes for BRIDGE paths
- Verification gate: `npm run verify` AND `npm run verify:full` must pass
- Commit as one atomic commit

BRIDGE zone migration is a separate future packet with significantly higher
risk and broader scope. It must not be bundled with PROCESS migration.

---

## Open Questions

1. **ScaffoldAI source separation**: Should `.scaffoldai/` be treated as
   hidden project-local bridge/process config (like `.consync/` currently is),
   or should ScaffoldAI source eventually live in a separate non-hidden
   `scaffoldai/` directory — potentially as an npm package? This affects whether
   `.scaffoldai/` is a permanent home or a transitional one.

2. **Contracts during transition**: Should `contracts/` move with the rest of
   PROCESS immediately, or should top-level architecture contracts
   (e.g., `scaffoldai-consync-separation.contract.md`,
   `bridge-ownership.contract.md`) remain temporarily in `.consync/contracts/`
   until after migration stabilises? These contracts are heavily cross-referenced
   and moving them first could create ambiguity.

3. **START_HERE.md placement**: Should `START_HERE.md` remain in
   `.consync/docs/` during transition (and continue to orient readers toward the
   old structure), or should a new `.scaffoldai/START_HERE.md` be introduced
   before migration to pre-orient readers toward the target structure?
