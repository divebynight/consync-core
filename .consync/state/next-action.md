TYPE: FEATURE
PACKAGE: bind_bookmark_markers_into_session_timeline

GOAL

Replace one placeholder timeline lane with real current-session bookmark markers so the Session Timeline begins reflecting actual session data instead of only local placeholder content.

WHY

The Electron UI now has:
- a visible timeline shell
- improved creative hierarchy
- a stable integrity-aware loop
- a clean stream resume back into `electron_ui`

The next meaningful product step is to make one part of the timeline real. Bookmark markers are the best first data-binding slice because they are already session-facing, visually legible, and narrow enough to add without dragging in waveform rendering or deeper timeline interaction.

This package should make the timeline feel more alive while preserving the current simple structure.

INTEGRITY TRIGGER

- level: `light`
- reason: this is ordinary `electron_ui` feature work and should stay within the renderer/session-facing UI surface without modifying process/governance artifacts
- required checks:
  - `npm run check:state-preflight` before closeout drafting
  - `npm run check:state-postflight` before accepting the handoff
- extra review:
  - confirm the package stays within ordinary UI scope
  - confirm it does not expand into waveform rendering, playback controls, or process-surface changes
  - confirm the timeline still reads clearly after replacing one placeholder lane with real markers

SCOPE

Keep this package narrow and renderer-focused.

Expected outcome:
- one timeline lane uses real bookmark/session data instead of placeholder marker data
- bookmark markers render in the timeline in a readable and stable way
- the rest of the timeline can remain placeholder-based for now
- existing bookmark/session/search behavior remains intact

Do not implement:
- waveform rendering
- playback controls
- drag/drop marker editing
- timeline zoom/scrub behavior
- multi-lane real-data binding
- backend redesign
- process/governance changes

WORK INSTRUCTIONS

1. Inspect the current renderer timeline shell and identify the best single lane to replace with real bookmark markers.
   Prefer the existing `Bookmarks` lane if present.

2. Inspect the current session-facing bookmark data already available to the renderer.
   Reuse existing session/bookmark surfaces if possible.
   Avoid introducing a large new data model.

3. Bind the chosen timeline lane to real bookmark data from the current session.

4. Render bookmark markers in a simple and readable way.
   At minimum:
   - each bookmark marker should visibly represent one real bookmark
   - marker placement should be stable and grounded in available session/bookmark context
   - labels may be minimal if space is limited
   - if exact timing is not available, use a simple deterministic placement strategy that is honest and easy to refine later

5. Keep the implementation honest.
   If the current data does not support true timeline placement, do not fake precision.
   It is acceptable to use a clearly limited first-pass mapping as long as:
   - the markers are real session bookmarks
   - the mapping is deterministic
   - the UI remains understandable
   - the handoff explains the limitation clearly

6. Preserve current behavior:
   - bookmark capture still works
   - bookmark/session panels still work
   - search flow still works
   - the timeline shell still renders cleanly
   - existing error surfaces remain intact

7. Add or update focused tests in the most practical existing test surface.
   At minimum, cover that:
   - real bookmark markers render in the timeline
   - the lane is no longer purely placeholder-driven
   - existing renderer behavior does not regress in the focused UI slice

8. Keep naming explicit and boring.
   Optimize for clarity over abstraction.

DESIGN INTENT

The result should feel like:

- the timeline has begun to connect to real creative session data
- the app is becoming a real session workspace
- one lane is now truthful, even if still simple

Good result:
“The bookmark lane clearly reflects real session bookmarks, and the UI still feels clean and early-stage rather than overbuilt.”

CONSTRAINTS

- keep the package small
- only make one lane real in this package
- do not overstate precision if bookmark timing is limited
- do not expand into a general timeline engine
- do not touch process/governance surfaces unless the loop artifacts naturally update

VERIFICATION

1. Run `npm run check:state-preflight` before closeout drafting.
2. Launch the Electron UI and confirm:
   - the timeline still renders cleanly
   - the bookmark lane now reflects real current-session bookmarks
   - existing bookmark/session/search surfaces still function
3. Add or inspect at least one session bookmark and confirm it appears in the timeline lane.
4. Run focused renderer tests if updated.
5. Run `npm run check:state-postflight` after writing the handoff.
6. Confirm the package stayed under `light` validation and did not drift into process/governance work.

HANDOFF REQUIREMENTS

Write the handoff to the live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- INTEGRITY TRIGGER APPLIED
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- VERIFICATION
- MANUAL VERIFICATION
- NEXT SUGGESTED PACKAGE

For `NEXT SUGGESTED PACKAGE`, recommend:

`add_note_or_session_event_markers_to_timeline`

and describe it as the next narrow UI package that makes one additional lane real—either note-like session events or another simple session-derived marker class—while keeping waveform rendering and deeper timeline interaction out of scope.