TYPE: PROCESS
PACKAGE: define_minimal_sequential_multi_package_protocol

STATUS

PASS

SUMMARY

Added a compact sequential multi-package protocol to the state docs, defining sequence start inputs, advance eligibility, pause conditions, `FAIL` handling, repair return, and a default maximum run window of 3 packages.

The protocol now runs from repo files alone: `package_plan.md` holds orchestration truth, `handoff.md` records the latest result, `next-action.md` remains the live runnable slot, and preserved history holds executed package instructions.

FILES CREATED

- `.consync/state/package_plan.md` — seeded a minimal orchestration file with current sequence status, default run window, and the next planned package.
- `.consync/state/history/plans/process-20260415-define-minimal-sequential-multi-package-protocol.md` — preserved the executed package instruction before replacing the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/decisions.md` — added the durable sequence protocol for start inputs, eligibility gates, pause rules, `FAIL`, repair return, and the default 3-package run window.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that the sequential protocol is now defined and that `package_plan.md` exists as orchestration truth.
- `.consync/state/next-action.md` — advanced the live execution slot to the next narrow PROCESS package for defining the minimal `package_plan.md` format.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this PROCESS package.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm the protocol still treats one package as the atomic execution unit.
3. Confirm `.consync/state/decisions.md` now defines sequence start inputs, advance eligibility, pause conditions, `FAIL`, repair return, and the default 3-package run window in a compact procedural form.
4. Open `.consync/state/package_plan.md` and confirm it exists as orchestration truth with a sequence goal, current status, current cursor, run window, and at least one planned package entry.
5. Confirm the protocol says advancement only happens from reconciled `CLEAN` state and only after `PASS`, completed required human verification, and satisfied package gates.
6. Open `.consync/state/history/plans/process-20260415-define-minimal-sequential-multi-package-protocol.md` and confirm the executed package instruction is preserved outside the live `next-action.md` slot.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm only `.consync/state/` process docs are changed.
8. Failure case: if the protocol reads like a workflow engine instead of a small operating rule set, the package is incomplete.
9. Failure case: if the docs still depend on conversation memory to determine whether the next package is eligible, the package is incomplete.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the state-only updates.
- Observed outcome: `npm run verify` passed, and `git status --short` showed only `.consync/state/` doc changes after the protocol and package plan updates.
- Validated the important edge cases that `FAIL`, incomplete required human verification, unreconciled repo state, repair interruptions, and the 3-package run window all now force a documented pause before advancement.