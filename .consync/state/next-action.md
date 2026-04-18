MODE: CONTINUE

CONTEXT: CONSYNC_STREAM_MODEL_BOOTSTRAP

OBJECTIVE

Set up the first minimal phase of the new stream structure inside the repo.

This is a conservative structural/process change only. Do not overbuild it.

The purpose of this step is to support one real current situation:

- `process` stream is the current foreground stream
- `electron_ui` stream is paused but preserved
- the structure should let us return to `electron_ui` later without relying on memory alone

Do not introduce speculative extra streams, agent logic, orchestration code, or concurrency mechanisms.

---

REQUIRED IMPLEMENTATION

1. CREATE THE MINIMAL STREAM/ORCHESTRATION FOLDER STRUCTURE

Under `.consync/`, create this structure:

.consync/
  orchestration/
    active_foreground_stream.txt
    stream_index.md
  streams/
    process/
      stream.md
      state/
        next_action.md
        handoff.md
        snapshot.md
      history/
    electron_ui/
      stream.md
      state/
        next_action.md
        handoff.md
        snapshot.md
      history/

Do not create additional stream folders.

Do not create package plans for both streams by default.

Do not add extra process docs unless a very small update to an existing doc is needed for coherence.

---

2. POPULATE THE NEW ORCHESTRATION FILES

Create `.consync/orchestration/active_foreground_stream.txt` with exactly:

process

Create `.consync/orchestration/stream_index.md` as a short human-readable file with content equivalent to:

## Streams

### process
- status: active
- owner: human
- purpose: define stream-based workflow

### electron_ui
- status: paused
- owner: human
- purpose: continue Electron UI work, next step likely automated UI testing

You may tighten wording slightly, but keep it short and practical.

---

3. CREATE THE TWO INITIAL STREAMS WITH MINIMAL STREAM METADATA + STATE

Create `.consync/streams/process/stream.md` with these required fields:

- id: process
- title: Stream Model + Process Evolution
- status: active
- owner: human
- mode: system
- summary: define and implement the stream-based workflow for Consync without breaking existing work

Create `.consync/streams/electron_ui/stream.md` with these required fields:

- id: electron_ui
- title: Electron UI Behavior + Testing
- status: paused
- owner: human
- mode: build
- summary: continue Electron UI development; next likely step is automated UI testing after recent issue discovery

Use a compact readable markdown format, not a complicated schema.

For each stream, ensure these files exist:

- state/next_action.md
- state/handoff.md
- state/snapshot.md

Important: if there is relevant existing current-state content elsewhere in `.consync/state/`, reuse or adapt it carefully instead of inventing fake state. Preserve continuity. Do not silently destroy useful existing state. If a direct move seems risky, copy/adapt the minimum needed and leave legacy files intact for now.

For the new `snapshot.md` files, ensure they are concise re-entry docs that answer:

- what just happened
- current state
- what matters next

For `process`, note that this stream is actively defining the stream-based workflow and light orchestration structure.

For `electron_ui`, note that the stream is paused at a clean stopping point and that automated UI testing is the likely next chapter based on the recently exposed need.

---

4. KEEP THE MODEL MINIMAL AND CONSISTENT

Use this status vocabulary consistently if statuses appear anywhere in the new files:

- new
- ready
- active
- paused
- blocked
- complete

For this step, only `active` and `paused` need to be used unless something else is clearly required.

Reflect this pause-safe idea in the structure and wording where natural, but do not create a new heavyweight framework doc just for it:

A stream is pause-safe when:
- `handoff.md` is complete
- `snapshot.md` is updated
- `next_action.md` is empty or clearly staged

If an existing process-facing doc should receive a very small update to acknowledge the new stream/orchestration layout, that is acceptable. Do not rewrite major docs in this step.

Acceptance criteria:
- the new `.consync/orchestration/` and `.consync/streams/` structure exists
- `process` is the active foreground stream
- `electron_ui` is represented as paused with preserved resume intent
- each stream has `stream.md`, `state/next_action.md`, `state/handoff.md`, and `state/snapshot.md`
- the implementation stays minimal and does not introduce speculative extra machinery
- enough state is preserved that returning to the Electron UI work later will not require reconstructing context from memory alone

---

HANDOFF FORMAT

Write the result to the usual handoff location using this format:

TYPE: PROCESS
PACKAGE: bootstrap_minimal_stream_model

STATUS

PASS or FAIL

SUMMARY

Concise summary of what was implemented and how the two current streams were represented.

FILES CREATED

List every new file created.

FILES MODIFIED

List every modified file and why.

VERIFICATION

List exact verification performed. If no automated verification is appropriate, say so plainly and describe what was checked manually.

NOTES

Mention any cautious decisions taken to preserve existing state or avoid overbuilding.

FINAL INSTRUCTION

Be conservative. This should feel like the smallest credible version of the stream model, not a grand redesign.