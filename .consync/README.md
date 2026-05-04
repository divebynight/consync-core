# .consync/

## Purpose

This folder belongs to the Consync product metadata layer.

It holds product concepts, documentation, examples, and archival records related to the Consync product — not ScaffoldAI process state, and not runtime code.

---

## What Belongs Here

- `docs/` — navigation docs and canonical entry points for the Consync product (e.g. `current-system.md`)
- `product/` — product metadata, vision, and definition artifacts
- `examples/` — reference examples and scenario illustrations for Consync behavior
- `archive/` — historical plans and records intentionally preserved for reference
- `contracts/` — product-level contracts (e.g. bridge ownership boundary); distinct from ScaffoldAI process contracts
- `quarantine/` — content held pending review or reclassification

---

## What Does NOT Belong Here

- ScaffoldAI process state — **do not reintroduce** `.consync/state/`, `.consync/streams/`, or `.consync/packets/`
- ScaffoldAI agents, skills, prompts, or process docs (belong under `.scaffoldai/`)
- Live loop state: next-action, handoff, snapshot, active-stream (belong under `.scaffoldai/state/`)
- Work packets or stream state (belong under `.scaffoldai/packets/` and `.scaffoldai/streams/`)
- Consync runtime/product code (belongs in `src/`)

---

## Important Boundaries

- `.consync/state/`, `.consync/streams/`, and `.consync/packets/` were migrated to `.scaffoldai/` during `scaffoldai-bridge-migration-v1` — do not recreate them here
- Content in `docs/` is read during re-entry and AI sessions as product orientation material, not as process state
- Content in `archive/` is historical — treat it as immutable; do not modify archived plans
- This folder may grow as the Consync product matures (e.g. user session metadata, GUID records, export artifacts), but that growth should follow the intended Consync runtime design in `src/`

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/` | ScaffoldAI process harness — all live loop state, agents, and process docs live here |
| `src/` | Consync runtime/product code — the system that reads and writes future Consync metadata |
| `sandbox/` | Development fixtures and test artifacts — not product metadata |

---

## Verification Notes

- No automated verify step targets `.consync/` content directly
- If `.consync/docs/current-system.md` or similar files are referenced by AI context prompts, ensure they remain consistent with the current system state in `.scaffoldai/state/snapshot.md`
- Run `npm run verify` after any change to confirm no runtime behavior is affected
