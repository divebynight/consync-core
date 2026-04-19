TYPE: FEATURE
PACKAGE: separate_search_panel_errors_from_non_search_session_errors

GOAL

Separate search-panel errors from non-search session errors in the Electron renderer so search failures do not share one generic error surface with unrelated bookmark or session failures.

WHY

The current renderer uses a single error message surface for different failure types. That was acceptable for early slices, but it now risks blurring search failures together with unrelated session or bookmark failures.

This package should keep scope narrow by splitting the search-panel error surface from other session-level errors without redesigning the wider UI state model.

DO

1. Inspect the current renderer error handling in `App.jsx` and identify which errors currently flow through the shared session-level error surface.
2. Define a narrow split between:
   - search-panel errors
   - non-search session or bookmark errors
3. Implement the smallest renderer state change needed so search failures render in the search area rather than sharing the top-level session error panel.
4. Preserve existing behavior for non-search errors unless a tiny adjustment is required for clarity.
5. Add or update focused tests only as needed to lock in the separated error behavior.
6. Keep this package narrow:
   - no redesign of the overall error UX
   - no new framework
   - no broader renderer refactor

CONSTRAINTS

- Keep this renderer-focused and small.
- Do not redesign the whole error model.
- Avoid unrelated UI cleanup.
- Prefer deterministic tests if automated coverage changes are needed.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- CURRENT ERROR SURFACE
- ERROR SPLIT DECISION
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- run the focused renderer test command if UI behavior changes
- run `git status --short`
- confirm search errors no longer share the unrelated session-level error surface