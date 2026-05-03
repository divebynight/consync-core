# Target Structure Reconciliation Audit

- date: 2026-05-03
- auditor: Copilot (read-only pass)
- trigger: user concern that filesystem does not match intended architecture after partial migration
- branch: feature/product-design-electron

---

## Status

PASS

The repository is structurally sound and coherent. No critical conflicts require
immediate action. One orphaned duplicate file exists and represents the only
concrete CONFLICT found. The broader architectural question about whether
`.scaffoldai/` should eventually split into process-source (`scaffoldai/`) and
bridge-state (`.scaffoldai/`) is an open design decision, not a current defect.

---

## Summary

The PROCESS zone migration has already been executed: all ScaffoldAI harness
files (agents, skills, prompts, contracts, templates, process, verification,
planning, audits) now live in `.scaffoldai/` and are absent from `.consync/`.
`.consync/` retains only BRIDGE state (state/, streams/) and Consync product
material (docs/, product/, examples/, archive/, packets/, quarantine/).

The BRIDGE migration has NOT been executed: `.consync/state/` and
`.consync/streams/` still live under `.consync/`, not `.scaffoldai/`. This is
intentional and expected per the current plan.

`scaffoldai/` (no dot prefix) does not exist. Whether it should exist is an
open architectural decision explicitly deferred by the decisions contract.

One concrete CONFLICT exists: `.consync/contracts/bridge-ownership.contract.md`
is an orphaned original-location copy of a file that now lives canonically at
`.scaffoldai/contracts/bridge-ownership.contract.md`. It was not cleaned up
during the PROCESS migration.

---

## Intended Target Model — Evaluation

The user's target model describes three potential states for `.scaffoldai/`:

> `.scaffoldai/` — project-local ScaffoldAI bridge/state/config only  
> `scaffoldai/` — ScaffoldAI main process/source/package files

**This model has NOT been decided yet.** The decisions contract
(`.scaffoldai/contracts/process-zone-migration-decisions.contract.md`,
Decision 1) explicitly resolved this question and reached a DIFFERENT
conclusion:

> `.scaffoldai/` is a project-local directory. It contains both PROCESS
> content and BRIDGE content. A future non-hidden `scaffoldai/` directory may
> eventually house ScaffoldAI source code. That is a separate architectural
> decision and is not in scope for the PROCESS migration packet.

The user's model is a valid future target but is not the currently-decided
architecture. Acting on it would require a new explicit decision record before
any migration.

---

## Current Directory Ownership Map

### `.scaffoldai/` — current contents

| Path | Current Role | Target Role (per decisions contract) | Status | Notes |
|---|---|---|---|---|
| `.scaffoldai/agents/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | Canonical agent role definitions; 8 files including 00_agent-system.md |
| `.scaffoldai/skills/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | Reusable procedures; 2 files |
| `.scaffoldai/prompts/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 2 files; generate-packet and run-integrity-agent |
| `.scaffoldai/contracts/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 7 contracts; all ScaffoldAI-owned rules and boundaries |
| `.scaffoldai/templates/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | Work packet templates and portable/ scaffold |
| `.scaffoldai/process/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 8 process/runbook docs; no runtime code dependency |
| `.scaffoldai/verification/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 6 verification docs including ladder and coverage maps |
| `.scaffoldai/planning/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 1 file: process-zone-migration.plan.md |
| `.scaffoldai/audits/` | SCAFFOLDAI_SOURCE | SCAFFOLDAI_SOURCE (project-local) | ALIGNED | 4 audit files including this one |

### `.consync/` — current contents

| Path | Current Role | Target Role (per decisions contract) | Status | Notes |
|---|---|---|---|---|
| `.consync/state/` | BRIDGE | BRIDGE (→ `.scaffoldai/state/` in future bridge migration) | TRANSITIONAL | Live execution state; HIGH runtime dependency; hardcoded in src/commands/, src/lib/, src/test/, scripts/ |
| `.consync/streams/` | BRIDGE | BRIDGE (→ `.scaffoldai/streams/` in future bridge migration) | TRANSITIONAL | Per-stream state; HIGH runtime dependency; hardcoded in tests and state-integrity checks |
| `.consync/docs/` | DOCS_ORIENTATION | DOCS_ORIENTATION | ALIGNED | Navigation index + reference docs; now mostly points to `.scaffoldai/` for active process surfaces |
| `.consync/product/` | CONSYNC_PRODUCT_METADATA | CONSYNC_PRODUCT_METADATA | ALIGNED | 2 files: current-system.md, product-model.md |
| `.consync/examples/` | CONSYNC_PRODUCT_METADATA | CONSYNC_PRODUCT_METADATA | ALIGNED | current-system/ example + feature example file |
| `.consync/archive/` | ARCHIVE_HISTORY | ARCHIVE_HISTORY | ALIGNED | History of conceptual/legacy/plans/system material; no live references |
| `.consync/packets/` | BRIDGE_ADJACENT | BRIDGE_ADJACENT | TRANSITIONAL | 2 timestamped packet files; low runtime dependency |
| `.consync/quarantine/` | UNKNOWN | UNKNOWN | UNKNOWN | 2 files: ideas parking lot and scratch planning; no current system role |
| `.consync/contracts/` | **DUPLICATE (CONFLICT)** | Should be empty or removed | **CONFLICT** | Contains 1 orphaned file (`bridge-ownership.contract.md`) — the original pre-migration copy; canonical version now lives in `.scaffoldai/contracts/` |

### `.github/` — current contents

| Path | Current Role | Target Role | Status | Notes |
|---|---|---|---|---|
| `.github/copilot-instructions.md` | TOOL_ADAPTER | TOOL_ADAPTER | ALIGNED | Correctly declares `.github/` as adapter layer; references `.scaffoldai/` as authoritative |
| `.github/prompts/` | TOOL_ADAPTER | TOOL_ADAPTER | ALIGNED | 2 thin adapter prompts; both have explicit authority boundary notices |
| `.github/agents/` | MIXED | TOOL_ADAPTER | TRANSITIONAL | 2 self-contained Copilot inspection agents; functionally adapter-only but do not declare themselves as such; covered in github-adapter-boundary.audit.md |

### `src/` — current contents

| Path | Current Role | Target Role | Status | Notes |
|---|---|---|---|---|
| `src/` | CONSYNC_PRODUCT | CONSYNC_PRODUCT | ALIGNED | Runtime code, CLI, Electron app, tests; no changes required |

### `scaffoldai/` (no dot prefix)

| Path | Current Role | Target Role | Status | Notes |
|---|---|---|---|---|
| `scaffoldai/` | DOES NOT EXIST | FUTURE OPTIONAL (separate architectural decision) | DEFERRED | Decisions contract (Decision 1) explicitly defers this to a future packet |

---

## Key Findings

1. **PROCESS migration is complete.** All `.scaffoldai/` process harness zones
   (agents, skills, prompts, contracts, templates, process, verification,
   planning, audits) exist and are populated. None of these paths exist in
   `.consync/` (except the orphaned contracts file — see #2).

2. **One orphaned duplicate exists.** `.consync/contracts/bridge-ownership.contract.md`
   is the original pre-migration copy of a file now canonical at
   `.scaffoldai/contracts/bridge-ownership.contract.md`. The `.consync/`
   version still cross-references `.consync/contracts/scaffoldai-consync-separation.contract.md`
   (old path) while the `.scaffoldai/` version references the new path. They
   diverged. The `.scaffoldai/` copy is authoritative. The `.consync/` copy
   is obsolete.

3. **BRIDGE migration is deferred and correct.** `.consync/state/` and
   `.consync/streams/` remain under `.consync/`. This is intentional and
   per-plan. No bridge migration packet has been executed. High runtime
   dependency confirmed by the reference audit.

4. **The `scaffoldai/` (no-dot) question is open.** The user's target model
   assumes a future split between `.scaffoldai/` (bridge/state only) and
   `scaffoldai/` (process/source). The decisions contract explicitly deferred
   this. No implementation work should begin without a new decision record.

5. **`.consync/quarantine/` has no defined system role.** Two scratch/parking
   files exist there with no process ownership. Not blocking; just unclassified.

6. **`.consync/docs/` is transitional but correct.** START_HERE.md now
   forwards readers to `.scaffoldai/process/` for active surfaces. It
   correctly identifies itself as navigation-only, not authoritative. The
   surface map and reference docs there are still valid orientation material.

---

## Conflicts / Drift Risks

| Risk | Severity | Source |
|---|---|---|
| `.consync/contracts/bridge-ownership.contract.md` is obsolete but still present — diverged from canonical `.scaffoldai/` copy | LOW | Cleanup was missed during PROCESS migration |
| `.github/agents/` files are self-contained behavioral prompts that do not declare adapter status | LOW | Covered in github-adapter-boundary.audit.md |
| `src/lib/intakeClassify.js` and `src/commands/reference-audit.js` contain hardcoded zone path strings | LOW | Strings only, no file reads; will need updates if zone names change |
| `.consync/quarantine/` is unclassified | INFO | No operational impact; just unclear ownership |
| If `scaffoldai/` (no-dot) is created before a decision is recorded, `.scaffoldai/` zone ownership becomes ambiguous | MEDIUM | Preempt with a decision record before any move |

---

## Runtime and Verify Dependencies

**HIGH risk (must not move without a dedicated bridge migration packet):**
- `.consync/state/` — hardcoded in `src/commands/system-check.js`, `dry-run-check.js`, `consync-run.js`, `handoff-bundle.js`, `src/lib/getInFlightPacket.js`, `src/lib/gatekeeperSwitch.js`, `scripts/check-handoff-contract.js`, `src/test/state-integrity-checks.js`
- `.consync/streams/` — hardcoded in test assertions and state integrity checks

**ZERO runtime dependency (safe to reorganize with no src/ changes):**
- All of `.scaffoldai/` — confirmed by reference audit; no Node.js code reads these paths at runtime
- `.consync/docs/`, `.consync/product/`, `.consync/examples/`, `.consync/archive/`, `.consync/quarantine/`

**LOW runtime dependency (AI prompts only — not runtime code):**
- `.github/prompts/` files reference `.scaffoldai/` and `.consync/state/` paths; path updates required if those move

---

## Specific Questions Answered

**Should `.scaffoldai/agents`, `.scaffoldai/skills`, `.scaffoldai/prompts`, `.scaffoldai/contracts`, `.scaffoldai/templates`, `.scaffoldai/process`, `.scaffoldai/verification`, `.scaffoldai/planning`, `.scaffoldai/audits` eventually move to `scaffoldai/`?**

Per the decisions contract: this is an open future architectural decision that
has NOT been made. The current `.scaffoldai/` is the project-local harness
layer and is the intended long-term home for these surfaces unless a new
decision explicitly resolves the `scaffoldai/` (no-dot) split. Do not move
these without a decision record.

**What should remain in `.scaffoldai/`?**

At minimum: all current PROCESS content. After the bridge migration (future
packet): also state/ and streams/. `.scaffoldai/` is the intended home for
ALL ScaffoldAI-facing content in this repo.

**What should remain in `.consync/`?**

After bridge migration: only Consync product metadata.
- `.consync/docs/` — orientation/navigation (should shrink or redirect as `.scaffoldai/` matures)
- `.consync/product/` — product model and current-system metadata
- `.consync/examples/` — product examples
- `.consync/archive/` — historical material
- `.consync/packets/` — bridge-adjacent (decision needed: move to `.scaffoldai/packets/` in bridge migration or keep here)
- `.consync/quarantine/` — classify or archive

Before bridge migration: also state/ and streams/ (as today).

**Is `.consync/state` ScaffoldAI bridge state, Consync product state, or transitional mixed state?**

It is ScaffoldAI BRIDGE state — the live execution surface for the Consync
development loop. It is not Consync product output. It is transitional in the
sense that it still lives under `.consync/` but belongs under `.scaffoldai/`
in the target model. The bridge-ownership contract classifies it as BRIDGE.

**Is `.consync/docs` product documentation, operator documentation, or transitional navigation?**

Transitional navigation. It is an orientation layer that now primarily forwards
readers to `.scaffoldai/` surfaces. It is not authoritative for process rules.
It self-declares as navigation-only (`START_HERE.md`). It will likely shrink
after bridge migration as `.scaffoldai/` becomes the single front door.

**Should `.consync/product` remain?**

Yes. It contains genuine Consync product metadata (product-model.md,
current-system.md) that is not ScaffoldAI-owned. It belongs under `.consync/`
in the target model.

---

## Recommended Migration Sequence

**Step 0 (current state): PROCESS migration is done. Bridge migration is deferred.**

**Step 1 — Orphan cleanup (next safe packet)**
Remove `.consync/contracts/bridge-ownership.contract.md`.
The canonical copy is in `.scaffoldai/contracts/`. The `.consync/contracts/`
directory can be removed if empty. Zero runtime dependencies. Zero test
dependencies. No path updates required.
Risk: None.
Verification: `npm run verify` passes.

**Step 2 — Architectural decision record (before any `scaffoldai/` work)**
If the user intends to create `scaffoldai/` (no-dot) as a process source
package, record a new decision in the decisions contract BEFORE creating
the directory or moving files. This decision should answer:
- Which `.scaffoldai/` subdirectories move to `scaffoldai/`?
- What remains in `.scaffoldai/` (bridge/state only)?
- Is `scaffoldai/` a future npm package, or just a non-hidden sibling?
Risk: None (doc-only step).

**Step 3 — Bridge migration (separate future packet)**
Move `.consync/state/` and `.consync/streams/` to `.scaffoldai/state/` and
`.scaffoldai/streams/`.
Requires: updating all hardcoded paths in src/, scripts/, tests/.
Requires: `npm run verify:full` PASS with 20/20 e2e, 42/42 UI tests.
Risk: HIGH. All BRIDGE-dependent runtime code must be updated atomically.
Do not start this until Step 1 is clean and Step 2 decision is recorded.

**Step 4 — Decide `.consync/` remainder (after bridge migration)**
Once bridge state is moved, `.consync/` holds only product metadata,
navigation docs, examples, archive, and quarantine. Decide whether `.consync/`
should be kept as the Consync product layer, merged into `src/`, or phased out.

---

## Recommended Next Safe Packet

**`orphan-contract-cleanup-v1`**

- Type: CLEANUP
- Scope: Delete `.consync/contracts/bridge-ownership.contract.md` and remove the
  now-empty `.consync/contracts/` directory
- Why safe: Zero runtime dependencies; no tests reference this path; no
  `.github/` prompts reference this path; canonical copy exists in `.scaffoldai/contracts/`
- Risk: None
- Verification: `npm run verify` passes

This is the only concrete CONFLICT in the current structure. Everything else
is either aligned, acceptably transitional, or deferred by explicit decision.

---

## Non-Goals

- No files moved in this audit.
- No bridge migration started.
- No deletion of `.consync/state/` or `.consync/streams/`.
- No creation of `scaffoldai/` (no-dot).
- No runtime code changes.
