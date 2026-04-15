TYPE: PROCESS
PACKAGE: formalize_live_vs_history_state_and_reconcile_closeout

STATUS

PASS

SUMMARY

Separated live state from durable history in the active process docs, added a reconcile-before-advance gate, and preserved the executed package instruction in `.consync/state/history/` before advancing `next-action.md`.

The repo state is now legible after interruption: `handoff.md` states what just finished, `next-action.md` states what is prepared next, and resume classification is documented before any advance.

FILES CREATED

- `.consync/state/history/README.md` — defined the minimal archive convention for live state files versus durable executed package history.
- `.consync/state/history/plans/process-20260415-live-vs-history-state-and-reconcile-closeout.md` — preserved the executed package instruction before replacing the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/decisions.md` — added durable rules for live execution state, required history preservation, repo reconciliation, and resume-state classification.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the reconciled baseline and the next design focus.
- `.consync/state/next-action.md` — replaced the live execution slot with the next narrow PROCESS package for defining the minimal sequential multi-package protocol.
- `.consync/state/handoff.md` — recorded the completed result of this PROCESS package in the required closeout format.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm only `.consync/state/` files plus `last_changes.txt` are listed.
3. Open `.consync/state/decisions.md` and confirm it now defines `next-action.md` as a live execution slot, `handoff.md` as the live result contract, and a required archive step before `next-action.md` is replaced.
4. Open `.consync/state/decisions.md` and confirm it defines `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`, and says advancement only happens from `CLEAN`.
5. Open `.consync/state/history/README.md` and `.consync/state/history/plans/process-20260415-live-vs-history-state-and-reconcile-closeout.md` and confirm the just-executed package instruction is preserved outside the live `next-action.md` file.
6. Open `.consync/state/snapshot.md` and confirm it now explains what just finished, what the current baseline is, and what package is prepared next.
7. Open `.consync/state/next-action.md` and confirm the next package returns to defining the minimal sequential multi-package protocol from this stable baseline.
8. Failure case: if `next-action.md` is still the only durable record of the completed package instruction, the package is incomplete.
9. Failure case: if the decisions allow advancing from any dirty resume state, the package is incomplete.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the state-only updates.
- Observed outcome: `npm run verify` passed, and `git status --short` showed only `.consync/state/` doc changes, the new history files, and the pre-existing `last_changes.txt` file.
- Validated the important edge cases that the executed package instruction now survives `next-action.md` replacement and that dirty resume states are explicitly blocked from automatic advancement.