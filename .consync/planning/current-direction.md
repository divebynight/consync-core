# Current Direction

Consync remains local-first, offline, deterministic, and filesystem-first.

It is a context and re-entry layer over creative work, not a full mirror of filesystem truth.

## Stable Surface
- The filesystem remains the base persistence layer, but Consync captures only the context that matters.
- Session is the primary unit of captured context.
- Folder context matters locally, but folder != session.
- Local `.consync` anchors are the durable source of truth where meaningful local persistence exists.
- Those anchors should stay sparse, intentional, and locally legible.
- `.consync/state/handoff.md` is the active execution record.
- `sandbox/current/` is the current development harness, not the long-term ontology.
- Current commands cover artifact creation, inspection, and the sandbox read-only loop.

## Guardrails
- Default scope is selective capture: only explicitly interacted-with artifacts belong to active session scope unless that scope is widened deliberately.
- Consync is not responsible for mirroring ambient nearby files or repairing renamed user structures.
- Parent or higher-level context may link child context later, but child anchors should remain portable on their own.
- Search and discovery may scan nested `.consync` anchors under a chosen root, but discovered associations are not durable structural links by default.
- Rebuildable indexes/caches, gravity, decay, and self-cleaning-hoard behavior remain horizon ideas rather than foundation rules.
- Keep proposal behavior read-only, deterministic, and explicit.
- Keep GUID artifacts as `<guid>.json` under `sandbox/current/`, resolved recursively with no central index.
- Record machine verification and human verification as separate states.
- Treat validation-only packets as valid when they reduce risk without adding code.