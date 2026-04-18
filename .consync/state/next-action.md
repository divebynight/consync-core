TYPE: FEATURE
PACKAGE: strengthen_electron_ui_action_flow_tests

GOAL

Audit and strengthen the current Electron UI testing layer by extending coverage from search-state rendering into explicit action-flow behavior around selection and the detail panel.

WHY

The current Electron UI testing surface appears to cover the main search path, detail fidelity, failure handling, and no-results behavior. The highest-value next gap is likely interaction-contract coverage for how the user moves from search results into explicit actions.

This package should reduce dependence on manual app-open verification for routine UI behavior and make the search/detail workflow safer to change in small packages.

DO

1. Inspect the existing Electron UI testing setup and identify:
   - which test files currently exercise the search flow
   - whether tests run at renderer level, desktop-scaffold level, or both
   - what bridge/preload/backend mocks already exist
   - which user interactions are already covered versus only manually verified

2. Write a short audit summary into the handoff that lists:
   - current test entry points
   - current covered behaviors
   - current uncovered behaviors
   - the specific gap this package closes

3. Add or extend tests for the highest-value action-flow behavior around the current search/detail UI. Prefer behavior that is already implemented in the product but not yet protected by tests. Focus on things like:
   - selecting a result updates the detail panel without triggering side effects
   - explicit action buttons remain disabled or hidden when no valid selection exists
   - explicit action buttons trigger the intended bridge call when a valid selection exists
   - action failures are surfaced cleanly without corrupting selection/detail state

4. Keep the package small. Do not broaden into new UI features, visual redesign, or a larger test framework rewrite. Strengthen the existing testing layer using the current architecture.

5. Preserve the usual next_action/handoff discipline. If you discover a larger testing gap that should become its own package, note it in the handoff rather than expanding scope here.

CONSTRAINTS

- Do not introduce a new heavyweight testing framework unless it is already present and clearly intended.
- Do not require manual app-open verification for this package unless there is no stable automated seam.
- Prefer deterministic mocks over live Electron behavior when asserting renderer workflow.
- Keep changes aligned with the current stream/process/integrity model.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- AUDIT OF CURRENT UI TEST SETUP
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum, run the relevant Electron/UI test command(s) plus the normal repo verification command if appropriate for this package.