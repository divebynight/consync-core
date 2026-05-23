# .scaffoldai/runtime/mcp/

Role: bounded append-only MCP runtime artifacts

---

## Purpose

This directory stores MCP runtime append artifacts that are non-authoritative.

Current artifacts:

- signals.jsonl — bounded append-only signal records from scaffoldai_signal
- shared-memory.jsonl — bounded append-only diagnostic shared-memory records

Current readonly observations derived from runtime signals:

- scaffoldai_pending_questions — bounded advisory question/blocker visibility from signals.jsonl

Resolution lifecycle signals supported in this runtime surface:

- question_resolved
- unblocked

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

Pending-question observations are advisory runtime coordination data only. They are not authoritative state, not resolution truth, and do not imply execution permission.

Resolution records are append-only coordination observations. They do not mutate loop state, delete history, or rewrite prior question/blocker records.

Readonly pending-question views:

- unresolvedOnly=true (default) hides question/blocker entries that have detectable resolution signals
- unresolvedOnly=false preserves historical visibility, including resolved entries and detected resolution metadata

## Boundary

- Do not write authoritative state here.
- Do not move loop-state files from .scaffoldai/state/ or .scaffoldai/streams/ into this directory.
- Keep write surfaces bounded to MCP append-only runtime behavior.
- Do not treat runtime resolution signals as authoritative workflow state transitions.
