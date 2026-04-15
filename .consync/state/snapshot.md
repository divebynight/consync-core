# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package defined the minimal `package_plan.md` format, including required fields, package-level status entries, pause gates, and update rules for `PASS`, `FAIL`, and repair interruption.

CURRENT REALITY:
- `next-action.md` is now treated as the live execution slot rather than the durable historical record.
- `handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` is the durable area for executed package instructions and superseded process material.
- Closeout now requires repo reconciliation and resume-state classification before a new package is prepared.
- Resume state is classified as `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.
- `.consync/state/package_plan.md` now defines the minimal durable orchestration format, including cursor, next package, gates, pause conditions, and repair notes.
- The package plan format now explains how it changes after `PASS`, `FAIL`, and repair without depending on conversation memory.

ACTIVE FOCUS:
Define the smallest manual procedure for advancing a sequence from one package to the next using the current repo files.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should define the manual sequence advancement procedure from this package-plan baseline.