TYPE: FEATURE
PACKAGE: cover_renderer_search_input_state_invalidation

GOAL

Strengthen the Electron renderer search-flow tests around stale state invalidation when the user edits search inputs after results have been loaded or a result has been selected.

WHY

The current renderer test surface now covers grouped results, detail fidelity, explicit reveal behavior, failure handling, no-results behavior, hidden-versus-disabled reveal behavior, selection reset on rerun, and preserved detail state after reveal failure.

A remaining high-value gap is whether editing the active search inputs leaves stale result/detail state visible in ways that could confuse the user or create an incorrect action target. This is a renderer interaction-contract question and should be protected with deterministic tests before more UI behavior accumulates around it.

DO

1. Inspect the current `App.jsx` search renderer behavior and determine what the product currently does when the user edits:
   - the root input
   - the query input
   after:
   - results have loaded but nothing is selected
   - a result has been selected and detail content is visible

2. Treat this package as a contract-capture step first, not a behavior redesign. Test the current intended behavior unless a clearly unsafe stale-state bug is discovered.

3. Add focused renderer tests in `src/test/app-search-flow.test.jsx` for the highest-value stale-state cases around input editing. Prefer narrow cases such as:
   - editing query after results exist
   - editing query after selection exists
   - editing root after selection exists
   - whether reveal action visibility/enabled state stays aligned with valid current state

4. Use deterministic mocks only. Do not introduce live Electron behavior, a broader harness rewrite, or a new framework.

5. If inspection shows the current behavior is ambiguous or unsafe, capture that clearly in the handoff:
   - what the renderer currently does
   - why it may be risky
   - whether this package only added tests or also made a small renderer fix
   Keep any fix minimal and tightly scoped to stale-state correctness.

CONSTRAINTS

- Keep this package narrow and renderer-focused.
- Do not broaden into keyboard navigation, accessibility, or loading-state redesign.
- Do not rewrite the search component architecture.
- Prefer explicit assertions about results list, selected detail content, and reveal control state.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- CURRENT INPUT-EDIT CONTRACT
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum, run:
- `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx`
- `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js`
- `cd /Users/markhughes/Projects/consync-core && git status --short`