MODE: CONTINUE

CONTEXT: PROCESS_STREAM_OPERATING_MODEL

TYPE: PROCESS
PACKAGE: define_stream_operating_model

OBJECTIVE

Define the minimal operating model for the new stream structure in a small, durable, human-readable way.

This package should make the stream model clearer without overbuilding it. It should explain how streams work now, what statuses mean, what “pause-safe” means, and how we should think about foreground focus versus future parallel-capable design.

This is a process/structure package, not an automation or code feature package.

NON-GOALS

- Do not add new streams
- Do not add agent execution logic
- Do not add orchestration code
- Do not build concurrency control
- Do not rewrite the whole process system
- Do not create a heavy framework document blob
- Do not migrate all legacy `.consync/state/` behavior yet

REQUIRED OUTCOME

Create one small process-facing document that defines the stream operating model clearly enough that a human or future agent can understand the current rules.

The document should cover these four areas:

1. TINY STREAM CORE
Define the minimum structure every real stream has:
- `stream.md`
- `state/next_action.md`
- `state/handoff.md`
- `state/snapshot.md`
- optional `history/`

Make clear that extra structure is earned, not automatic.

2. STATUS VOCABULARY
Define the current status vocabulary in a compact, practical way:
- `new`
- `ready`
- `active`
- `paused`
- `blocked`
- `complete`

Make the definitions short and operational, not philosophical.

3. PAUSE-SAFE RULE
Define the current pause-safe rule:
A stream is pause-safe when:
- `handoff.md` is complete
- `snapshot.md` is updated
- `next_action.md` is empty or clearly staged

Include the practical recovery test:
“If I came back cold later, could I continue without relying on memory alone?”

4. FOREGROUND RULE + FUTURE-FRIENDLY NOTE
Define the current operating rule:
- one foreground active stream at a time by policy

Also make clear this is a policy for now, not a hard architectural limit forever:
- the structure should remain compatible with future background/parallel agent work if streams are independent enough
- do not over-elaborate this; keep it as a simple future-facing note

DOCUMENT PLACEMENT

Prefer to add this as a small new process-facing doc in the most coherent location under `.consync/`.

Choose a location/name that fits the repo’s current process docs cleanly and does not create confusion.

Good outcome:
- a small clearly named doc that becomes the current reference for stream operating behavior

Avoid:
- scattering this across many files
- hiding it in a place that will be hard to find later

COHERENCE UPDATES

Make only very light supporting updates elsewhere if needed so the new operating-model doc is discoverable and consistent.

Examples of acceptable light updates:
- a brief note in an existing current-system/process index doc
- a small pointer from a stream snapshot or orchestration file if truly helpful

Do not do broad rewrites.

STYLE

- keep it short
- keep it readable
- keep it practical
- prefer markdown
- avoid dense abstraction
- avoid speculative agent architecture language
- make it feel like the smallest durable reference for how streams currently work

ACCEPTANCE CRITERIA

1. A small durable doc exists that defines the stream operating model.
2. The doc explains the tiny stream core, status vocabulary, pause-safe rule, and foreground-stream rule.
3. The doc makes clear that extra stream structure is earned rather than automatic.
4. The doc leaves the door open to future parallel/agent work without turning that into present complexity.
5. Any supporting doc updates remain light and conservative.

HANDOFF FORMAT

Write the result to the usual handoff location using this format:

TYPE: PROCESS
PACKAGE: define_stream_operating_model

STATUS

PASS or FAIL

SUMMARY

Concise summary of the operating-model doc created, what it defines, and any small coherence updates made.

FILES CREATED

List every new file created.

FILES MODIFIED

List every modified file and why.

COMMANDS TO RUN

List any commands the user should run for inspection. If no automated verification is appropriate, provide simple inspection commands only.

HUMAN VERIFICATION

Provide a short checklist to confirm:
- the operating-model doc exists
- it covers the required four areas
- it stays small and practical
- any supporting updates are light and coherent

VERIFICATION NOTES

State plainly whether verification was manual/inspection-based.

NOTES

Mention any cautious decisions taken to avoid overbuilding or conflicting with the legacy live loop.

FINAL INSTRUCTION

Be conservative. This package should produce the smallest credible operating-model reference, not a full framework.