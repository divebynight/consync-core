TYPE: FEATURE
PACKAGE: render_structured_grouped_search_results_in_desktop_shell

GOAL

Replace the current preformatted grouped mock-search result block in the desktop shell with a renderer-owned structured presentation, while keeping the underlying search truth, read-only behavior, and package scope unchanged.

This package is a presentation refinement, not a search or architecture expansion.

PRIMARY OUTCOME

When the desktop shell runs the existing grouped mock search, the renderer should display results as structured desktop-owned UI sections/rows rather than a single preformatted text block.

The grouped result should still reflect the same underlying truth already returned by:
- the existing desktop mock-search path
- `sandbox-desktop-search`
- the nested-anchor fixture expectations

No new search logic, persistence, linking, ranking, or session behavior should be introduced.

SCOPE

Use the current desktop grouped mock-search path and change only how the renderer presents the result.

A good outcome looks like:

- one result panel in the renderer
- grouped by anchor/session
- each group clearly labeled
- bookmarked artifact matches displayed as individual rows/items
- associated note/tag text shown in a readable way
- empty/no-result state stays simple and readable

Keep the styling minimal and clean. Do not overdesign the UI.

DESIGN GUARDRAILS

- Do not change the meaning of the grouped search data
- Do not add new IPC surface beyond what already exists unless a tiny shape adjustment is absolutely necessary
- Prefer returning structured data from the existing desktop core/search path if needed rather than parsing preformatted text in the renderer
- Do not add linking actions, click actions, saved queries, ranking, filters, or navigation
- Do not broaden scope into “real desktop search product” work
- Keep everything read-only
- Keep deterministic verification intact

PREFERRED IMPLEMENTATION SHAPE

If the current desktop path returns a formatted string, refactor the shared desktop/core search path just enough to expose structured grouped data plus, if useful, a formatter for CLI expectations.

The renderer should render from structured grouped data it owns, not from parsing a formatted block.

The CLI/sandbox command behavior should remain stable unless a small internal refactor is needed to preserve shared truth cleanly.

TESTING

Add or update focused verification so the new renderer-owned presentation is covered at the desktop scaffold level.

Preserve the current verify surface and expectation stability where appropriate.

If a screenshot-style UI test does not exist, keep tests focused on:
- the shape of data flowing through the desktop path
- renderer/scaffold expectations for the structured grouped result path
- existing verify still passing

SUCCESS CRITERIA

This package is successful if:

- desktop grouped search still returns the same underlying matches as before
- renderer now displays grouped results as structured UI sections/rows
- the package remains read-only
- no new product commitments are introduced
- `npm run verify` still passes

HANDOFF FORMAT

Return a handoff in this exact structure:

TYPE: FEATURE
PACKAGE: render_structured_grouped_search_results_in_desktop_shell

STATUS

PASS or FAIL

SUMMARY

A concise summary of how the renderer presentation changed and what behavior stayed the same.

FILES CREATED

- path — short reason
- path — short reason

FILES MODIFIED

- path — what changed
- path — what changed

BEHAVIOR ADDED

- bullet list of user-visible presentation improvements

BEHAVIOR PRESERVED

- bullet list of the important behaviors that did not change

COMMANDS RUN

- exact command
- exact command

COMMANDS TO RUN

- exact command
- exact command

HUMAN VERIFICATION

1. step
2. step
3. step

VERIFICATION NOTES

- explain how you verified that the renderer now owns structured presentation without changing the underlying grouped search truth