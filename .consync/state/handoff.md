TYPE: PROCESS
PACKAGE: define_resume_state_determination_checklist

STATUS

PASS

SUMMARY

Defined the smallest resume-state determination checklist for classifying `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN` from repo files and current repo status.

The docs now state which signals the operator reads first, how each dirty-state label is chosen, and that any non-`CLEAN` result must stop advancement and trigger repair before the sequence continues.

FILES CREATED

- `.consync/state/history/plans/process-20260415-define-resume-state-determination-checklist.md` — preserved the executed package instruction before replacing the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/decisions.md` — added durable rules for reading resume-state signals and for distinguishing `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`.
- `.consync/state/package_plan.md` — recorded the completed package, advanced the cursor and next package pointer, and added a compact resume-state determination checklist.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that the resume-state checklist is now defined and that worked validation examples are the next gap.
- `.consync/state/next-action.md` — advanced the live execution slot to the next narrow PROCESS package for validating the checklist against interrupted examples.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this PROCESS package.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm the checklist still treats one package as the atomic execution unit.
3. Confirm `.consync/state/decisions.md` now identifies the signals to read first: `handoff.md`, `package_plan.md`, `next-action.md`, preserved history, and current repo status.
4. Confirm the updated docs define practical conditions for `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`.
5. Open `.consync/state/package_plan.md` and confirm the resume-state checklist matches those conditions and ends by stopping advancement on any non-`CLEAN` result.
6. Open `.consync/state/history/plans/process-20260415-define-resume-state-determination-checklist.md` and confirm the executed package instruction is preserved outside the live `next-action.md` slot.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm it prints no file entries, indicating a clean closeout state.
8. Failure case: if the checklist still depends on conversation memory to classify repo state, the package is incomplete.
9. Failure case: if the checklist leaves dirty states ambiguous enough that advancement could happen from the wrong state, the package is incomplete.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the state-only updates.
- Observed outcome: `npm run verify` passed, and `git status --short` returned no file entries, consistent with a clean closeout state.
- Validated the important edge cases that incomplete closeout maps to `DIRTY_CLOSEOUT_PENDING`, premature plan advancement maps to `DIRTY_NEXT_PACKAGE_STARTED`, conflicting signals map to `DIRTY_UNKNOWN`, and only `CLEAN` allows manual advancement to proceed.