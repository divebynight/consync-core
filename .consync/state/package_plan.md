# Package Plan

SEQUENCE GOAL:

Complete the remaining process guardrails, then prove the protocol can carry a small real feature package safely.

SEQUENCE STATUS:

ACTIVE

CURRENT CURSOR:

21

NEXT PACKAGE:

`run_mock_session_desktop_trial`

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
   - Status: PASS
   - Depends on: `refine_verification_contract_with_optional_vs_required_human_gates`
   - Stop gate: pause after this package to review repair entry and return flow before more sequencing work.
   - Human verification: required
   - Notes: was prepared before the verification-gate refinement, then temporarily superseded; now defines the minimal repair-entry and return checklist.

8. `validate_repair_entry_and_return_checklist_against_examples`
   - Status: PASS
   - Depends on: `define_repair_entry_and_return_checklist`
   - Stop gate: pause after this package to review the repair checklist against concrete examples.
   - Human verification: optional
   - Notes: worked examples now validate when repair starts, when return is allowed, and when the operator must stop instead.

9. `expose_one_more_real_session_facing_value`
   - Status: PASS
   - Depends on: `validate_repair_entry_and_return_checklist_against_examples`
   - Stop gate: pause after this package to review the first real feature slice carried by the process.
   - Human verification: optional
   - Notes: first narrow FEATURE package after the process foundation; now exposes artifact count from `sandbox/current` in renderer-readable session state.

10. `render_new_session_value_in_session_panel`
   - Status: PASS
   - Depends on: `expose_one_more_real_session_facing_value`
   - Stop gate: pause after this package to review the visible Session panel update.
   - Human verification: optional
   - Notes: now renders the already-exposed artifact count in the existing Session panel without broadening the session model.

11. `render_latest_bookmark_note_in_session_panel`
   - Status: PASS
   - Depends on: `render_new_session_value_in_session_panel`
   - Stop gate: pause after this package to review whether the Session panel can absorb one more existing session value without layout churn.
   - Human verification: optional
   - Notes: now renders the latest bookmark note from existing session state in the Session panel without changing the backend or preload path.

12. `render_latest_bookmark_time_in_session_panel`
   - Status: PASS
   - Depends on: `render_latest_bookmark_note_in_session_panel`
   - Stop gate: pause after this package to review whether one more existing bookmark detail still fits the current Session panel.
   - Human verification: optional
   - Notes: now renders the latest bookmark time from existing session state in the Session panel without changing the backend or preload path.

13. `stabilize_session_panel_copy_after_incremental_real_values`
   - Status: PASS
   - Depends on: `render_latest_bookmark_time_in_session_panel`
   - Stop gate: pause after this package to review whether the Session panel wording still matches the now-expanded real values.
   - Human verification: optional
   - Notes: tightened hero copy so the renderer text now matches the accumulated real session values shown in the Session panel.

14. `add_minimal_renderer_verification_slice_for_session_panel`
   - Status: PASS
   - Depends on: `stabilize_session_panel_copy_after_incremental_real_values`
   - Stop gate: pause after this package to review whether the renderer now has one stable machine-checkable verification foothold.
   - Human verification: optional
   - Notes: added a small deterministic Session panel verification slice without introducing a heavier UI automation framework.

15. `wire_drop_bookmark_to_real_session_write`
   - Status: PASS
   - Depends on: `add_minimal_renderer_verification_slice_for_session_panel`
   - Stop gate: pause after this package to review whether the first real desktop mutation path stays narrow and artifact-backed.
   - Human verification: optional
   - Notes: Drop Bookmark now persists a real bookmark write to the current session artifact through the existing renderer -> preload -> backend path.

16. `reflect_persisted_bookmark_in_running_desktop_state`
   - Status: PASS
   - Depends on: `wire_drop_bookmark_to_real_session_write`
   - Stop gate: pause after this package to review whether the running desktop state reflects the persisted bookmark through the real session read path.
   - Human verification: optional
   - Notes: the running desktop bookmark flow now re-reads session state after the persisted write so renderer state stays anchored to the real read path.

17. `stabilize_bookmark_write_read_render_loop_verification`
   - Status: PASS
   - Depends on: `reflect_persisted_bookmark_in_running_desktop_state`
   - Stop gate: pause after this package to review whether the full bookmark write/read/render loop now has one stable machine-checkable proof.
   - Human verification: optional
   - Notes: added one narrow deterministic verification slice that asserts persisted artifact contents, derived session state, derived renderer rows, and reload consistency.

18. `stabilize_bookmark_panel_empty_state_copy`
   - Status: PASS
   - Depends on: `stabilize_bookmark_write_read_render_loop_verification`
   - Stop gate: pause after this package to review whether the bookmark empty state still reads clearly now that the write and read loop is real.
   - Human verification: optional
   - Notes: tightened the Bookmarks empty-state wording so it refers directly to saved session bookmarks instead of proving the loop.

19. `stabilize_drop_bookmark_panel_copy`
   - Status: PASS
   - Depends on: `stabilize_bookmark_panel_empty_state_copy`
   - Stop gate: pause after this package to review whether the Drop Bookmark panel wording still matches the now-real bookmark flow.
   - Human verification: optional
   - Notes: tightened the panel wording so the action now refers directly to saving a bookmark into the current session.

20. `formalize_context_anchor_architecture`
   - Status: PASS
   - Depends on: `stabilize_drop_bookmark_panel_copy`
   - Stop gate: none
   - Human verification: optional
   - Notes: updated the active orientation docs so they describe Consync as a sparse local context-anchor system rather than a full filesystem mirror, and clarified that `sandbox/current` is only a development harness.

21. `run_mock_session_desktop_trial`
   - Status: READY
   - Depends on: `formalize_context_anchor_architecture`
   - Stop gate: pause after this package to review the first concrete trial blocker or confirm that the current desktop shell is usable for a short mock session.
   - Human verification: optional
   - Notes: should exercise the current desktop shell against a short mock session and capture the first concrete usability blocker, if any, without broadening implementation scope prematurely.

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

REPAIR ENTRY AND RETURN CHECKLIST:

1. Confirm a repair package is required because the blocked package ended `FAIL`, resume state is not `CLEAN`, or verification/closeout contradictions cannot be resolved inside the blocked package.
2. Record the repair package in `package_plan.md` and keep the blocked planned package explicitly named.
3. Set sequence status to `PAUSED_REPAIR` while repair is active.
4. Run the repair package as its own single-package loop with its own handoff and archived instruction.
5. Close the repair package `PASS` only after its verification passes and repo state returns to `CLEAN`.
6. Re-run resume-state determination before returning to planned work.
7. Return to the previously blocked planned package only if it remains clearly identified and no new stop gate or ambiguity blocks it.
8. Stop and inspect manually instead of returning if repair leaves repo state dirty, creates a new contradiction, or makes the blocked package unclear.

REPAIR VALIDATION EXAMPLES:

- Repair required: the blocked package ended `FAIL` or resume state is not `CLEAN`, so the operator records repair entry and pauses the sequence.
- Return allowed: the repair package closes `PASS`, repo status is clean, and the blocked package remains clearly identified.
- Stop instead of return: repo state stays dirty, a new contradiction appears, or the blocked package is no longer clear.

FORMAT RULE:

- Keep this file as a small operator-readable status document, not a backlog, tracker, or workflow engine.