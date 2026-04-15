TYPE: PROCESS
PACKAGE: define_manual_sequence_advancement_procedure

STATUS

PASS

SUMMARY

Defined the smallest manual advancement procedure for moving from one planned package to the next using `handoff.md`, `package_plan.md`, repo status, and the live `next-action.md` slot in a fixed order.

The docs now state exactly when the operator may advance, when the operator must pause, and how closeout, history preservation, and next-package preparation fit together without relying on chat memory.

FILES CREATED

- `.consync/state/history/plans/process-20260415-define-manual-sequence-advancement-procedure.md` — preserved the executed package instruction before replacing the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/decisions.md` — added durable rules for the manual advancement order, go/no-go checks, and the required pause conditions.
- `.consync/state/package_plan.md` — recorded the completed package, advanced the cursor and next package pointer, and added a compact manual advancement checklist.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that the manual advancement procedure is now defined and that resume-state determination is the next gap.
- `.consync/state/next-action.md` — advanced the live execution slot to the next narrow PROCESS package for defining the resume-state determination checklist.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this PROCESS package.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm the procedure still treats one package as the atomic execution unit.
3. Confirm `.consync/state/decisions.md` now defines the manual advancement order as: close current package, confirm `CLEAN`, confirm plan gates, archive the executed instruction, update `package_plan.md`, then replace `next-action.md`.
4. Open `.consync/state/package_plan.md` and confirm the manual advancement checklist matches that order and records the next cursor and next package.
5. Confirm the updated docs require the operator to pause instead of advancing when `handoff.md` is not `PASS`, required human verification is incomplete, repo state is not `CLEAN`, a stop gate is reached, or repair is active.
6. Open `.consync/state/history/plans/process-20260415-define-manual-sequence-advancement-procedure.md` and confirm the executed package instruction is preserved outside the live `next-action.md` slot.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm only `.consync/state/` process docs are changed.
8. Failure case: if the procedure still depends on conversation memory to determine whether the next package is eligible, the package is incomplete.
9. Failure case: if the procedure implies the operator may skip reconcile or verification gates, the package is incomplete.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the state-only updates.
- Observed outcome: `npm run verify` passed, and the observed repo changes were limited to the expected `.consync/state/` process-doc updates for this package.
- Validated the important edge cases that advancement pauses on non-`PASS` results, on incomplete human verification, on non-`CLEAN` state, and on active repair before `next-action.md` is replaced.