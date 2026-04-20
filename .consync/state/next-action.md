TYPE: FEATURE
PACKAGE: bind_bookmark_markers_into_session_timeline

INTEGRITY TRIGGER

- level: `light`
- reason: this package is ordinary `electron_ui` feature work inside the expected renderer surface and does not intentionally touch `state`, `control`, or `governance` artifacts
- preflight checks:
   - `npm run check:state-preflight`
- postflight checks:
   - `npm run check:state-postflight`
- extra review required:
   - none beyond normal closeout unless the implementation crosses into live-loop or governance surfaces

GOAL

Replace one placeholder bookmark lane in the Creative Timeline shell with real current-session bookmark markers so the timeline starts reflecting actual session data without broadening into waveform rendering or deeper interaction.

WHY

The live loop is back on `electron_ui`, and the first resumed UI package should prove that ordinary product work still feels lightweight under the new integrity-aware model.

The timeline shell already has a bookmarks lane, but it still behaves like a placeholder. There is already real session bookmark data available in renderer state, so the next narrow move is to bind that one lane to real current-session markers.

This package should make the timeline more truthful without widening scope into waveform rendering, playback, or richer timeline interaction.

SCOPE

Keep this package narrow and renderer-focused.

Expected outcome:
- the bookmarks lane in the Creative Timeline uses real current-session bookmark data
- placeholder bookmark copy is reduced or removed when real bookmarks exist
- the rest of the timeline shell remains intentionally shallow
- non-timeline behavior such as search flow stays protected by the existing UI tests

Do not:
- add waveform rendering
- add playback controls
- add richer timeline interaction or editing
- redesign unrelated renderer panels
- touch process/governance surfaces unless required for closeout only

WORK INSTRUCTIONS

1. Inspect the current timeline shell and current session bookmark data path in the renderer.

2. Replace the placeholder bookmark-lane behavior with real markers derived from current-session bookmark data.

3. Keep the lane shallow and display-only:
    - no waveform math
    - no drag behavior
    - no playback coupling

4. Keep the other timeline lanes as they are unless a tiny adjacent adjustment is required for clarity.

5. Add or update a focused UI test if needed so the bookmark lane behavior is verified without destabilizing the existing search-flow coverage.

6. Keep the package grounded in real current-session bookmark data, not new mock-only structures.

CONSTRAINTS

- keep the package small
- ordinary `electron_ui` work should remain under `light` validation here
- avoid unrelated styling churn
- do not broaden timeline scope beyond real bookmark markers
- do not mix this with process cleanup

VERIFICATION

1. Run `npm run check:state-preflight` before implementation if needed.
2. Confirm the bookmarks lane reflects real bookmark data from the current session state.
3. Confirm the other timeline lanes remain intentionally shallow.
4. Run the focused UI test coverage that protects this change.
5. Run `npm run check:state-postflight` before accepting closeout.
6. Confirm the package stays `light` and does not require broader process/governance review.

HANDOFF REQUIREMENTS

Write the handoff to the live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES

For `NEXT SUGGESTED PACKAGE`, recommend the next narrow UI slice only if a clear follow-up appears after the bookmark-marker lane is working.