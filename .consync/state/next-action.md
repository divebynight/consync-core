TYPE: FEATURE
PACKAGE: restyle_timeline_shell_and_panel_hierarchy_toward_creative_mode

GOAL

Push the current Electron renderer visually toward the Creative Mode direction by improving hierarchy, spacing, grouping, and overall tone, while keeping the existing functionality and layout structure intact.

WHY

The first timeline shell package established the correct product direction, but the renderer still likely reads more like a developer/admin tool than a creative session workspace. Before adding more real timeline data, we want the UI to better communicate that the timeline is the primary surface and the surrounding panels are supporting context.

This package should make the current UI feel more intentional, more readable, and more aligned with the earlier Creative Timeline design direction without turning into a full redesign.

SCOPE

Keep this package renderer- and style-focused.

Expected outcome:
- the Session Timeline region feels visually primary
- the surrounding panels feel secondary and better grouped
- spacing, typography, panel hierarchy, and proportions move toward a more creative workspace feel
- the UI becomes less generic/dev-tool-like
- existing behavior remains intact

Do not implement:
- waveform rendering
- playback controls
- timeline interaction complexity
- new persistence or backend data flow
- major component architecture changes
- broad behavioral changes

WORK INSTRUCTIONS

1. Inspect the current renderer and identify the most important visual hierarchy issues, especially:
   - whether the timeline is visually dominant enough
   - whether panel spacing and grouping feel cramped or overly uniform
   - whether headers, labels, and supporting text create a clear reading order
   - whether the UI still feels too much like a generic utility/admin panel

2. Restyle the existing renderer so the timeline becomes the visual anchor of the page. Examples of acceptable changes:
   - increase separation around the timeline shell
   - strengthen timeline panel framing and internal spacing
   - make timeline headings and lane labels clearer and calmer
   - soften or reduce the visual weight of secondary panels below it
   - improve the panel grid so the search/session/detail areas feel like support surfaces, not equal competitors

3. Move the UI toward the earlier Creative Mode direction using layout and style choices such as:
   - stronger spacing rhythm
   - cleaner panel hierarchy
   - more intentional header/subheader treatment
   - improved contrast and grouping
   - calmer, more studio-like visual structure

4. Keep naming explicit and boring. This package is about presentation, not renaming concepts.

5. Prefer CSS and light renderer markup adjustments over heavy refactors. Small structural changes are acceptable if they directly improve hierarchy or grouping.

6. Preserve current renderer behavior:
   - Mock Search still works
   - Session and Bookmark panels still work
   - existing error surfaces remain intact
   - timeline shell remains present and readable

DESIGN INTENT

Target feel:
- less “tooling dashboard”
- more “creative session workspace”

The renderer should begin to suggest:
- a primary timeline/story of the session
- supporting context panels underneath
- a calmer and more intentional composition

Good result:
“The current UI is still simple, but it clearly feels like the beginning of a creative workspace instead of a generic status panel.”

CONSTRAINTS

- Do not redesign the whole app from scratch
- Do not add new product concepts unless a tiny static label adjustment is clearly useful
- Do not introduce waveform visuals yet
- Do not mix this with bookmark-to-timeline data binding
- Keep the package small enough to verify and hand off cleanly

VERIFICATION

Run the repo verification command after changes.

If practical, include manual verification steps such as:
1. launch the Electron UI
2. confirm the Session Timeline is visually more prominent than the surrounding panels
3. confirm the lower panels still render and function without layout breakage
4. confirm spacing, grouping, and typography feel more intentional and readable
5. confirm the UI still behaves like the same app, only with a clearer Creative Mode direction

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

For `NEXT SUGGESTED PACKAGE`, recommend:

`bind_bookmark_markers_into_session_timeline`

and describe it as the first narrow package that replaces one placeholder lane with real current-session bookmark markers while keeping waveform rendering and deeper timeline interaction out of scope.