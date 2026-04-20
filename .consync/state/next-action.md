TYPE: FEATURE
PACKAGE: render_session_timeline_shell_with_placeholder_creative_tracks

GOAL

Create the first intentional Creative Timeline UI slice in the Electron renderer by adding a visible session timeline shell with placeholder creative tracks and markers.

WHY

The prior packages established a cleaner renderer and clearer UI behavior. Now the UI stream should visibly pivot toward the Creative Timeline direction so the app starts reflecting Consync’s creative-memory purpose rather than remaining centered on system/status surfaces.

This package should establish the new center of gravity in the UI without requiring real waveform analysis or deeper backend changes yet.

SCOPE

Keep this package narrow and renderer-first.

Expected outcome:
- a visible timeline region appears in the main UI
- the timeline includes placeholder creative tracks or lanes
- the timeline renders simple placeholder markers/items using mock or existing session-facing data
- the shell feels like the beginning of a creative session view, not a final production timeline
- existing search/detail/session surfaces continue to work

Do not implement:
- real waveform rendering
- zoom, scrub, playback, drag/drop editing, or timeline interaction complexity
- deep data-model redesign
- backend timeline persistence unless a tiny read-only adapter is needed

WORK INSTRUCTIONS

1. Inspect the current renderer layout and identify the cleanest place to introduce a new timeline region without destabilizing the existing UI.

2. Add a new timeline shell component or renderer section with explicit, boring naming. Prefer something like:
   - `Session Timeline`
   - `Creative Tracks`
   - `Markers` or `Events`

3. Render a narrow first-pass structure that may include:
   - one timeline container
   - 2–4 placeholder lanes/tracks
   - simple marker/event blocks
   - light labels for track purpose such as notes, bookmarks, audio, or session events

4. Use mock data or existing session-facing values if needed, but keep the data flow simple and local to this package. It is acceptable for this package to use placeholder timeline data as long as the UI shell is real and readable.

5. Keep the presentation grounded in real interaction:
   - the timeline should look like a session-oriented creative surface
   - it should not read like generic admin/status UI
   - avoid visual overbuild; structure matters more than polish here

6. Preserve existing renderer behavior:
   - search panel should still function
   - detail/session surfaces should still function
   - existing error surfaces should remain intact

7. Add or update focused renderer tests only if there is already a practical place for them. If test coverage is awkward for layout-only structure, keep the implementation small and ensure repo verification still passes.

DESIGN INTENT

This is the first Creative Timeline slice, so optimize for:
- visible directional clarity
- readable structure
- future extensibility

A good result is:
“the app now clearly has a creative timeline area we can build on next.”

CONSTRAINTS

- Do not implement real waveform analysis yet
- Do not add playback controls unless a static placeholder is already clearly useful
- Do not redesign the entire renderer
- Do not let this package expand into notes editing or bookmark authoring workflows
- Keep the package small enough to hand off and verify cleanly

VERIFICATION

Run the repo verification command after changes.

If practical, include manual verification steps such as:
1. launch the Electron UI
2. confirm a visible `Session Timeline` or similarly named region appears
3. confirm placeholder creative tracks/lanes render consistently
4. confirm existing search and session surfaces still render and function
5. confirm the new timeline shell does not break the current layout

HANDOFF REQUIREMENTS

Write the handoff to the global live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- VERIFICATION
- MANUAL VERIFICATION
- NEXT SUGGESTED PACKAGE

For `NEXT SUGGESTED PACKAGE`, recommend a narrow follow-up package that adds one more real creative signal to the timeline shell, such as bookmark markers or note markers, without introducing waveform complexity yet.