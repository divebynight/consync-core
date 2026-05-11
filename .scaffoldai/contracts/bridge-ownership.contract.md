# Bridge Ownership Contract

## Purpose

Define the ownership boundary between Consync, ScaffoldAI, and the Bridge
control surface after the ScaffoldAI process-state migration.

This contract does not move, rename, or restructure files. It records the
current ownership model.

Related target separation note:
`.scaffoldai/contracts/scaffoldai-consync-separation.contract.md`

## Layers

- `CONSYNC` = product/runtime.
- `SCAFFOLDAI` = process/harness.
- `BRIDGE` = shared control surface between Consync, ScaffoldAI, and
  human/AI execution state.

## Bridge Owns

- `.scaffoldai/state/**`
- `.scaffoldai/streams/**`
- Verification and control expectations that connect process and runtime
- Gatekeeper, dry-run, and state-integrity behavior
- Handoff and snapshot surfaces

## Consync Owns

- Product/runtime app code
- Electron UI
- Product CLI behavior
- Sandbox/product fixtures
- Runtime/product tests

## ScaffoldAI Owns

- Agents
- Skills
- Prompts
- Templates
- Process docs
- Packet workflow docs
- Tool adapter guidance

## Directory Map

Explicit classification of process and product directories by ownership layer.

**BRIDGE** — shared control surface; runtime code reads/writes these:
- `.scaffoldai/state/` — live execution state
- `.scaffoldai/streams/` — per-stream state files

**SCAFFOLDAI (PROCESS)** — process harness; no runtime code dependency:
- `.scaffoldai/process/` — operating procedures and workflow docs
- `.scaffoldai/agents/` — agent role and behavior definitions
- `.scaffoldai/skills/` — reusable procedures referenced by agents
- `.scaffoldai/contracts/` — enforceable rules, invariants, and boundaries (including this file)
- `.scaffoldai/templates/` — reusable fill-in templates
- `.scaffoldai/prompts/` — AI prompt files
- `.scaffoldai/verification/` — verification expectations and checklists
- `.scaffoldai/planning/` — future planning and direction notes
- `.scaffoldai/audits/` — audit reports and classification records

**CONSYNC (PRODUCT/DOCS)** — product and project documentation:
- `.consync/docs/` — reference docs and examples
- `.consync/product/` — product-scoped docs
- `.consync/examples/` — worked examples

**MIXED / HISTORICAL:**
- `.consync/archive/` — historical records; no active runtime dependency
- `.scaffoldai/packets/` — completed packet archive; Bridge-adjacent, access is manual
- `.consync/quarantine/` — held/unclassified material

## Boundary Rules

- ScaffoldAI should interact with Consync through Bridge contracts and state,
  not by depending directly on arbitrary product internals.
- Consync runtime should not depend on ScaffoldAI planning or process docs.
- Bridge must stay thin and must not become a planning or idea dump.

## Status

- Active contract.
- No files are moved or renamed by this contract.
- Future structural splits must update references and pass verify.
