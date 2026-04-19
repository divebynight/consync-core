TYPE: PROCESS
PACKAGE: define_stream_switch_and_active_owner_rules

GOAL

Define a lightweight formal mechanism for pausing one stream and activating another so the repo always has one clear current stream without adding excessive state docs.

WHY

The current process is strong enough to support multiple streams conceptually, but stream switching is still informal. That creates ambiguity around which stream owns the live loop and what is currently being iterated on.

We need a minimal stream-switch model that:
- makes one active stream explicit
- records the previous stream and switch reason
- keeps the live execution slots singular
- avoids a proliferation of state files

DO

1. Define the minimum stream statuses:
   - ACTIVE
   - PAUSED
   - SUPPORTING
   - BLOCKED

2. Define the live ownership rule:
   - only one stream may own `next-action.md` and `handoff.md` at a time

3. Define a minimal active-stream state surface, likely:
   - `.consync/state/active-stream.md`
   containing:
   - active stream
   - previous stream
   - switch reason
   - paused streams
   - supporting streams
   - live owner note for `next-action.md` and `handoff.md`

4. Define what each stream must own durably:
   - stream name
   - package plan location
   - current status
   - last completed package
   Keep this lightweight and avoid creating unnecessary per-stream live docs.

5. Define the stream-switch ritual:
   - close or pause the current stream cleanly
   - update active-stream state
   - mark the previous stream appropriately
   - mount the new stream into `next-action.md`
   - keep `handoff.md` aligned with the active stream

6. Keep this package process-only and lightweight.
   - do not build automation yet
   - do not redesign the whole repo
   - do not create a large state hierarchy

CONSTRAINTS

- Prefer one new live state doc at most
- Keep `next-action.md` and `handoff.md` global live slots
- Avoid per-stream duplication unless clearly necessary
- Optimize for quick human orientation

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- STREAM STATUS MODEL
- ACTIVE OWNER RULE
- STREAM SWITCH RITUAL
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- confirm a human can tell in one glance which stream is active
- confirm only one stream owns the live loop
- confirm the model reduces ambiguity without creating lots of new docs