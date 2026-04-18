MODE: CONTINUE

CONTEXT: ELECTRON_UI_TEST_COVERAGE_IMPROVEMENT

TYPE: FEATURE
PACKAGE: strengthen_ui_test_coverage_based_on_integrity_feedback

OBJECTIVE

Improve the automated UI test coverage for the Electron search flow based on integrity-agent findings.

Focus on closing high-signal gaps without expanding scope unnecessarily.

---

NON-GOALS

- Do not refactor UI components
- Do not introduce new test frameworks
- Do not add broad coverage
- Do not change existing behavior

---

TARGET IMPROVEMENTS

1. DETAIL FIDELITY

Add assertions for:
- session
- anchor
- tags

Ensure selected detail panel reflects full data surface.

---

2. FAILURE PATHS

Add tests for:

- runMockSearch failure
- revealSearchResult failure

Ensure UI handles these states predictably.

---

3. MINIMAL EDGE COVERAGE

Add ONE of:

- no-results state OR
- reselection behavior

Do not overbuild.

---

ACCEPTANCE CRITERIA

1. Existing tests still pass
2. New tests cover:
   - detail fidelity
   - at least one failure path
3. Coverage remains simple and readable
4. No UI behavior changes

---

HANDOFF FORMAT

TYPE: FEATURE
PACKAGE: strengthen_ui_test_coverage_based_on_integrity_feedback

STATUS

PASS or FAIL

SUMMARY

Explain what gaps were addressed and how coverage improved.

FILES MODIFIED

List updated test files.

COMMANDS TO RUN

- npm run test:ui-search
- npm run verify

HUMAN VERIFICATION

Confirm:
- new tests pass
- no regression in behavior
- test output remains clear

---

FINAL INSTRUCTION

Be conservative. Improve signal, not surface area.