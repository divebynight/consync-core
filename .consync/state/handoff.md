TYPE: PROCESS
PACKAGE: define_minimal_package_plan_format

STATUS

PASS

SUMMARY

Defined the minimal durable `package_plan.md` format, including required fields for sequence status, cursor, next package, gates, pause conditions, and package-level entries.

The plan file now states how it is updated after `PASS`, `FAIL`, and repair interruption, so sequence orchestration remains legible from repo files alone.

FILES CREATED

- `.consync/state/history/plans/process-20260415-define-minimal-package-plan-format.md` — preserved the executed package instruction before replacing the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/decisions.md` — refined the durable rules so `package_plan.md` is explicitly operator-maintained and records the minimum orchestration fields.
- `.consync/state/package_plan.md` — defined the minimal orchestration format, added package-level entries and pause conditions, and recorded the update rules for `PASS`, `FAIL`, and repair.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that the package plan format is now defined and that the next gap is manual advancement procedure.
- `.consync/state/next-action.md` — advanced the live execution slot to the next narrow PROCESS package for defining manual sequence advancement.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this PROCESS package.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/package_plan.md` and confirm the file now contains a minimal but sufficient format for sequence goal, status, cursor, next package, run window, gates, pause conditions, package entries, and repair handling.
3. Confirm `.consync/state/package_plan.md` states who updates it and when it must change.
4. Confirm `.consync/state/package_plan.md` now defines separate update rules for `PASS`, `FAIL`, and repair interruption.
5. Confirm `.consync/state/decisions.md` still requires reconciled `CLEAN` state before any advancement.
6. Open `.consync/state/history/plans/process-20260415-define-minimal-package-plan-format.md` and confirm the executed package instruction is preserved outside the live `next-action.md` slot.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm it prints no file entries, indicating a clean closeout state.
8. Failure case: if the plan format reads like a workflow engine or backlog system instead of a small operating artifact, the package is incomplete.
9. Failure case: if the plan format still depends on conversation memory to determine the next package or cursor state, the package is incomplete.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && npm run verify` and `cd /Users/markhughes/Projects/consync-core && git status --short` after the state-only updates.
- Observed outcome: `npm run verify` passed, and `git status --short` returned no file entries, consistent with a clean closeout state.
- Validated the important edge cases that package advancement remains blocked on unreconciled state, that `FAIL` pauses the plan instead of silently moving the cursor, and that repair interruption keeps the cursor on the blocked planned package until repair closes `PASS`.