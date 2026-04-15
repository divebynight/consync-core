# Package Plan

SEQUENCE GOAL:

Define the remaining small process artifacts needed to run sequential multi-package work from repo files alone.

SEQUENCE STATUS:

PAUSED_STOP_GATE

CURRENT CURSOR:

7

NEXT PACKAGE:

`define_repair_entry_and_return_checklist`

DEFAULT RUN WINDOW:

3 packages maximum before pause and review.

PLAN OWNER:

The active operator updates this file during package closeout.

UPDATE TRIGGERS:

- Update this file when package order changes.
- Update this file when the current cursor moves.
- Update this file when a package changes status.
- Update this file when dependency gates, stop gates, or repair state changes.

ADVANCE GATES:

- Resume state must be `CLEAN`.
- Latest `handoff.md` must close the previous package as `PASS`.
- Required human verification for the previous package must be complete.
- No unresolved repair or failure blocker may remain.
- Package-specific dependencies and declared stop gates must be satisfied.

PAUSE CONDITIONS:

- Pause on `FAIL`.
- Pause when required human verification is incomplete.
- Pause when repo state is not reconciled.
- Pause when a repair package is required.
- Pause when the run window limit is reached.
- Pause when a package-specific stop gate says to stop.

PLANNED PACKAGES:

1. `define_minimal_package_plan_format`
   - Status: PASS
   - Depends on: `define_minimal_sequential_multi_package_protocol`
   - Stop gate: none
   - Human verification: complete before cursor advances
   - Notes: package plan format is now defined in this file.

2. `define_manual_sequence_advancement_procedure`
   - Status: PASS
   - Depends on: `define_minimal_package_plan_format`
   - Stop gate: none
   - Human verification: complete before cursor advances
   - Notes: manual go/no-go advancement procedure is now captured in the active process docs.

3. `define_resume_state_determination_checklist`
   - Status: PASS
   - Depends on: `define_manual_sequence_advancement_procedure`
   - Stop gate: none
   - Human verification: complete before cursor advances
   - Notes: resume-state classification checklist is now captured in the active process docs.

4. `validate_resume_state_checklist_against_interrupted_examples`
   - Status: PASS
   - Depends on: `define_resume_state_determination_checklist`
   - Stop gate: pause after this package to review the checklist against concrete interrupted-state examples.
   - Human verification: complete before cursor advances
   - Notes: worked examples now validate how each resume-state label is chosen from repo files and repo status.

5. `define_minimal_verification_contract_for_package_execution`
   - Status: PASS
   - Depends on: `validate_resume_state_checklist_against_interrupted_examples`
   - Stop gate: none
   - Human verification: required
   - Notes: standardizes automated verification, manual verification, closeout validation, and advancement classification.

6. `refine_verification_contract_with_optional_vs_required_human_gates`
   - Status: PASS
   - Depends on: `define_minimal_verification_contract_for_package_execution`
   - Stop gate: none
   - Human verification: optional
   - Notes: steering refinement that separates manual verification instructions from blocking human-gate requirements and temporarily superseded the prepared repair-entry package.

7. `define_repair_entry_and_return_checklist`
   - Status: READY
   - Depends on: `refine_verification_contract_with_optional_vs_required_human_gates`
   - Stop gate: pause after this package to review repair entry and return flow before more sequencing work.
   - Human verification: required
   - Notes: was prepared before the verification-gate refinement, then temporarily superseded; remains the next intended package after this steering correction.

REPAIR HANDLING:

- If a repair package interrupts the sequence, add a short note under the blocked planned package with the repair package name and set sequence status to `PAUSED_REPAIR`.
- Do not advance the cursor while repair is active.
- After the repair package closes `PASS` and repo state returns to `CLEAN`, restore sequence status to `ACTIVE` and keep the cursor on the first blocked planned package.

FAIL UPDATE RULE:

- If a planned package closes `FAIL`, set that package status to `FAIL`, set sequence status to `PAUSED_FAIL`, and do not point `NEXT PACKAGE` at a new normal package until a repair or human decision is recorded.

PASS UPDATE RULE:

- If a planned package closes `PASS`, mark it `PASS`, move the cursor to the next eligible package, and update `NEXT PACKAGE` only if all advance gates are satisfied.

MANUAL ADVANCEMENT CHECKLIST:

1. Read `handoff.md` and confirm the current package closed `PASS`.
2. Confirm required human verification is complete.
3. Confirm repo state is reconciled to `CLEAN`.
4. Read `package_plan.md` and confirm the current cursor, dependencies, and stop gates for the next planned package.
5. If any gate fails, pause and record the blocker here instead of advancing.
6. Archive the executed `next-action.md` instruction under `.consync/state/history/`.
7. Update this file for the completed package result, next cursor position, and next package pointer.
8. Replace `next-action.md` only after the previous steps are complete.

RESUME-STATE DETERMINATION CHECKLIST:

1. Read `handoff.md` and identify the latest completed package and its closing status.
2. Read `package_plan.md` and compare the current cursor and `NEXT PACKAGE` pointer against that latest completed package.
3. Read `next-action.md` and check whether the live slot still matches the unresolved state or has already advanced.
4. Inspect preserved instructions under `.consync/state/history/` if closeout sequencing is unclear.
5. Check current repo status to see whether state files or related work remain unreconciled.
6. Classify `CLEAN` only if these signals agree that the last package is durably closed and the repo is ready to advance.
7. Classify `DIRTY_CLOSEOUT_PENDING` if work exists but closeout, history preservation, or reconciliation is incomplete.
8. Classify `DIRTY_NEXT_PACKAGE_STARTED` if planning files advanced to a new package before the prior package was durably closed.
9. Classify `DIRTY_UNKNOWN` if the signals conflict or do not support a confident label.
10. If the result is not `CLEAN`, stop and repair before using the manual advancement checklist.

RESUME-STATE VALIDATION EXAMPLES:

- `CLEAN`: `handoff.md` closes the latest package as `PASS`, history contains the executed instruction, `package_plan.md` marks that package `PASS`, `next-action.md` points to the next package, and repo status is clean.
- `DIRTY_CLOSEOUT_PENDING`: repo status shows state-file work for the latest package but `handoff.md`, history preservation, or reconciliation is incomplete.
- `DIRTY_NEXT_PACKAGE_STARTED`: planning files already point at a new package while the previous package is not durably closed in `handoff.md` and history.
- `DIRTY_UNKNOWN`: the active files and repo status conflict so no confident label can be assigned without manual inspection.

FORMAT RULE:

- Keep this file as a small operator-readable status document, not a backlog, tracker, or workflow engine.