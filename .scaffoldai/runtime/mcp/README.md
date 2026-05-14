# .scaffoldai/runtime/mcp/

Role: bounded append-only MCP runtime artifacts

---

## Purpose

This directory stores MCP runtime append artifacts that are non-authoritative.

Current artifacts:

- signals.jsonl — bounded append-only signal records from scaffoldai_signal
- shared-memory.jsonl — bounded append-only diagnostic shared-memory records

## Authority

Artifacts in this directory are:

- non-authoritative
- runtime-only
- safe to delete
- not loop-state truth

They must not be treated as:

- verification evidence
- closeout approval
- permission to execute
- commit authority

## Boundary

- Do not write authoritative state here.
- Do not move loop-state files from .scaffoldai/state/ or .scaffoldai/streams/ into this directory.
- Keep write surfaces bounded to MCP append-only runtime behavior.
