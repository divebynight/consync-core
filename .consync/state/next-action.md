TYPE: FEATURE
PACKAGE: cover_renderer_error_state_invalidation

GOAL

Define and protect the renderer contract for how search error state behaves when the user edits search inputs after a failed search.

WHY

The renderer now correctly invalidates stale success state (results and selection) when inputs change. However, the behavior for error state after a failed search is not yet explicitly tested or guaranteed.

Without this, the UI may:
- continue showing an outdated error after inputs change
- mix error state with new input intent
- create inconsistent feedback loops for the user

This package ensures error state follows the same clear invalidation rules as success state.

DO

1. Inspect current renderer behavior when:
   - a search fails (error visible)
   - the user edits:
     - query input
     - root input

2. Capture the current behavior as a contract:
   - does error clear immediately on input change?
   - does it persist until next search?
   - does it interfere with reveal/action state?

3. Add focused renderer tests in `src/test/app-search-flow.test.jsx` for:
   - editing query after error
   - editing root after error
   - ensuring no stale error is shown alongside new input intent
   - ensuring no action controls are incorrectly available during error state

4. If behavior is unsafe or inconsistent:
   - apply a minimal renderer fix (same philosophy as previous package)
   - keep scope strictly limited to error-state correctness

CONSTRAINTS

- Keep this renderer-only and test-focused
- Do not redesign error UX or messaging
- Do not introduce new frameworks or async complexity
- Prefer deterministic mocks

OUTPUT

Return normal handoff with:
- STATUS
- SUMMARY
- CURRENT ERROR-STATE CONTRACT
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

- `vitest` renderer test file
- full `verify.js`
- ensure no stale error persists incorrectly after input edits