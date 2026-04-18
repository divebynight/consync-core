MODE: CONTINUE

CONTEXT: PROCESS_STREAM_LIFECYCLE

TYPE: PROCESS
PACKAGE: define_stream_lifecycle_and_promotion

OBJECTIVE

Define the minimal lifecycle and promotion rules for streams in a small, durable, human-readable way.

This package should explain when something becomes a real stream, when a stream earns more structure, how streams move through practical states over time, and how low-gravity streams should be handled without turning the system into a hoard.

This is a process/structure package, not an automation or feature package.

NON-GOALS

- Do not add new real streams
- Do not build decay automation
- Do not build orchestrator logic
- Do not add agent execution behavior
- Do not create heavy archival machinery
- Do not rewrite the full process system
- Do not migrate legacy `.consync/state/` behavior yet

REQUIRED OUTCOME

Create one small process-facing document that defines the current stream lifecycle and promotion model clearly enough that a human or future agent can understand how streams should be created, deepened, paused, completed, or allowed to decay.

The document should cover these five areas:

1. STREAM PROMOTION RULE
Define when an idea/note/thread earns promotion into a real stream.

Keep it practical. A stream should become real only when at least one of these is true:
- it has its own active or paused work packet
- it has a distinct goal that can continue independently
- losing its current state would be costly
- it needs its own handoff/resume loop

Make clear that not every idea becomes a stream.

2. EARNED STRUCTURE RULE
Define that every stream begins with the tiny core and earns additional structure only when needed.

Include a practical rule such as:
extra files like `package_plan.md` should appear only when the stream has enough iterations, branching, coordination, or consequence to justify them.

Make clear that more gravity = more structure, not more speculation.

3. LIFECYCLE STATES IN PRACTICE
Define how the existing status vocabulary is used over time in a practical way:
- `new`
- `ready`
- `active`
- `paused`
- `blocked`
- `complete`

You may also describe archival/decay behavior in prose, but do not add new required status words unless clearly necessary.

4. LOW-GRAVITY / DECAY HANDLING
Define the current philosophy for things that stall:
- not everything should live forever as active structure
- stalled streams should eventually be reviewed
- the user can keep, merge, archive, or let them decay

Keep this lightweight and practical. Do not turn it into a retention policy framework.

5. CONSISTENCY ACROSS SCALES
Add a short section explaining that Consync prefers repeating patterns across scales:
- projects
- streams
- packages
- sessions

The point is not identical structure everywhere, but recognizable recurring patterns that reduce cognitive switching.

Keep this short and grounded.

DOCUMENT PLACEMENT

Prefer to add this as a small new process-facing doc in the most coherent location under `.consync/docs/`.

Choose a location/name that fits cleanly beside the stream operating model doc and keeps the system easy to navigate.

Good outcome:
- a clearly named companion doc to the operating-model reference

Avoid:
- scattering this material across many files
- hiding it in a place that will be hard to find later
- creating a giant theory doc

COHERENCE UPDATES

Make only very light supporting updates elsewhere if needed so the new lifecycle/promotion doc is discoverable and consistent.

Examples of acceptable light updates:
- a short pointer from `.consync/docs/current-system.md`
- a short pointer from `.consync/docs/stream-operating-model.md` if that helps navigation
- a small note in stream index only if genuinely useful

Do not do broad rewrites.

STYLE

- keep it short
- keep it readable
- keep it practical
- prefer markdown
- avoid abstraction for its own sake
- avoid overusing future-agent language
- do not turn “earned gravity” into poetic branding unless it genuinely helps clarity
- make it feel like the smallest durable reference for stream lifecycle behavior

ACCEPTANCE CRITERIA

1. A small durable doc exists that defines stream promotion and lifecycle behavior.
2. The doc explains when something becomes a real stream.
3. The doc explains that extra stream structure is earned, not automatic.
4. The doc explains how low-gravity streams should be reviewed rather than preserved forever as active structure.
5. The doc includes a short note about repeating patterns across scales.
6. Any supporting updates remain light and conservative.

HANDOFF FORMAT

Write the result to the usual handoff location using this format:

TYPE: PROCESS
PACKAGE: define_stream_lifecycle_and_promotion

STATUS

PASS or FAIL

SUMMARY

Concise summary of the lifecycle/promotion doc created and any light coherence updates made.

FILES CREATED

List every new file created.

FILES MODIFIED

List every modified file and why.

COMMANDS TO RUN

List any commands the user should run for inspection. If no automated verification is appropriate, provide simple inspection commands only.

HUMAN VERIFICATION

Provide a short checklist to confirm:
- the lifecycle/promotion doc exists
- it covers the required five areas
- it stays small and practical
- any supporting updates are light and coherent

VERIFICATION NOTES

State plainly whether verification was manual/inspection-based.

NOTES

Mention any cautious decisions taken to avoid overbuilding or conflicting with the legacy live loop.

FINAL INSTRUCTION

Be conservative. This package should produce the smallest credible lifecycle/promotion reference, not a framework.