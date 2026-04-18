MODE: CONTINUE

CONTEXT: STREAM_AND_LEGACY_STATE_BRIDGE

TYPE: PROCESS
PACKAGE: define_stream_and_legacy_state_interaction

OBJECTIVE

Define how the new stream-based structure interacts with the existing `.consync/state/` live loop.

This package should resolve any ambiguity about where execution state lives, how the foreground stream maps to the live loop, and how we avoid duplicate or conflicting sources of truth.

This is a critical bridge step that connects the new stream model to real execution.

NON-GOALS

- Do not migrate all state into streams yet
- Do not delete legacy `.consync/state/`
- Do not introduce orchestration code
- Do not introduce agents or concurrency
- Do not redesign the next_action/handoff loop
- Do not create a heavy system diagram or framework doc

REQUIRED OUTCOME

Create one small process-facing document that defines the relationship between:

- `.consync/state/` (live loop)
- `.consync/streams/*/state/` (per-stream state)

The document should clearly answer these four areas:

---

1. SOURCE OF TRUTH DURING EXECUTION

Define that:

- the existing `.consync/state/next_action.md` and `handoff.md` remain the active execution surface for now
- this is the "live loop"

Clarify that:

- the foreground stream *drives* what appears in the live loop
- but the loop itself is still global during this phase

---

2. FOREGROUND STREAM MAPPING

Define that:

- the foreground stream is identified via `.consync/orchestration/active_foreground_stream.txt`
- the live loop should always reflect the current foreground stream’s work

Explain conceptually:

- the live loop acts as a working surface
- the stream acts as the container of long-term state

---

3. PER-STREAM STATE ROLE

Define that per-stream state files:

- are the durable, recoverable state of each stream
- are used for pause/resume
- should not compete with the live loop

Clarify:

- no duplication of active state across multiple places
- per-stream state is authoritative for that stream’s history and recovery

---

4. TRANSITION MODEL (IMPORTANT)

Define how we operate during this hybrid phase:

- legacy loop remains active
- streams are being introduced alongside it
- no forced migration yet

Clarify the intent:

- eventually, the live loop may become stream-scoped
- but for now, it is a shared execution surface

---

DOCUMENT PLACEMENT

Create a new doc under:

.consync/docs/

Choose a clear name such as:

stream-and-state-interaction.md

It should sit alongside:
- stream-operating-model.md
- stream-lifecycle-and-promotion.md

---

COHERENCE UPDATES

Make only light updates if helpful:

- add a pointer from `current-system.md`
- optionally add a short note in the stream operating model doc

Do not rewrite large docs.

---

STYLE

- keep it short
- keep it practical
- avoid abstract system language
- avoid diagrams unless extremely simple
- write like a working rulebook, not a theory paper

---

ACCEPTANCE CRITERIA

1. A clear doc exists defining how streams and the live loop interact.
2. It clearly states that `.consync/state/` is still the execution surface.
3. It defines how the foreground stream maps to the live loop.
4. It clarifies the role of per-stream state vs live state.
5. It avoids introducing a second active source of truth.
6. It keeps the system understandable and minimal.

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: define_stream_and_legacy_state_interaction

STATUS

PASS or FAIL

SUMMARY

Explain how the interaction between streams and the live loop is now defined.

FILES CREATED

List new doc.

FILES MODIFIED

List any small pointer updates.

COMMANDS TO RUN

Provide simple inspection commands.

HUMAN VERIFICATION

Confirm:
- doc exists
- rules are clear
- no ambiguity about source of truth
- system still feels simple

VERIFICATION NOTES

State manual inspection.

NOTES

Mention any decisions made to avoid duplication or over-migration.

FINAL INSTRUCTION

Be conservative. This should clarify reality, not invent a new system.