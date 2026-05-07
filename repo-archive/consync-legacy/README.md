# consync-legacy

This folder contains legacy/reference material formerly stored at repo-root `.consync/`.

## Why it moved

`.consync/` at the repo root is reserved for real Consync app-created product and session metadata — the kind the running application generates during actual usage (state, streams, session anchors, etc.).

The material in this folder is legacy planning, archive, and reference content from earlier phases of Consync development. It is not active runtime data. Its presence at repo-root `.consync/` was misleading because it could be confused with live product metadata.

## What is here

- `archive/` — historical plans and process documents from earlier development
- `contracts/` — earlier contract/spec material
- `docs/` — reference docs from pre-`.scaffoldai/` era
- `examples/` — earlier feature examples
- `product/` — product planning material
- `quarantine/` — previously quarantined content

## Rules

- Do not restore this folder to repo-root `.consync/` unless Consync itself creates it during real usage.
- If the Consync app writes a `.consync/` folder at repo root as part of normal operation, that is correct and expected — it will contain real runtime data, not this content.
- Contents here may be reorganized later into proper `docs/`, `examples/`, or permanent archive locations.
- Active process and agent state belongs in `.scaffoldai/`.

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
