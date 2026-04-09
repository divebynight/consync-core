# Current Direction

Consync remains local-first, offline, deterministic, and filesystem-first.

## Stable Surface
- The filesystem is the source of truth.
- `.consync/state/handoff.md` is the active execution record.
- `sandbox/current/` is the runtime artifact area.
- Current commands cover artifact creation, inspection, and the sandbox read-only loop.

## Guardrails
- Keep proposal behavior read-only, deterministic, and explicit.
- Keep GUID artifacts as `<guid>.json` under `sandbox/current/`, resolved recursively with no central index.
- Record machine verification and human verification as separate states.
- Treat validation-only packets as valid when they reduce risk without adding code.