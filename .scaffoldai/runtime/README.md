# .scaffoldai/runtime/

Role: non-authoritative runtime append and generated artifacts

---

## Purpose

.scaffoldai/runtime/ is for runtime-generated artifacts that are not authoritative loop state.

This surface is distinct from:

- .scaffoldai/state/ (authoritative loop state)
- .scaffoldai/streams/ (authoritative stream docs)
- .scaffoldai/packets/ (work packet archive)
- .scaffoldai/tmp/ (scratch/debug/transient output)

## Rules

- Runtime artifacts here are non-authoritative.
- Runtime artifacts here do not grant execution, verification, closeout, or commit authority.
- Runtime artifacts here are gitignored by default unless explicitly allowlisted placeholders/docs are tracked.

## Subdirectories

- mcp/ — bounded append-only MCP runtime coordination artifacts

## Related

- .scaffoldai/runtime/mcp/README.md
- .scaffoldai/reference/state-write-surfaces.reference.md
