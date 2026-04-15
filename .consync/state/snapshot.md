# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package defined the manual sequence advancement procedure, including the go/no-go checks, pause conditions, and closeout order required before the next package is prepared.

CURRENT REALITY:
- `next-action.md` is now treated as the live execution slot rather than the durable historical record.
- `handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` is the durable area for executed package instructions and superseded process material.
- Closeout now requires repo reconciliation and resume-state classification before a new package is prepared.
- Resume state is classified as `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.
- `.consync/state/package_plan.md` now defines the minimal durable orchestration format, including cursor, next package, gates, pause conditions, and repair notes.
- The package plan format now includes a compact manual advancement checklist for reading `handoff.md`, checking gates, recording the next cursor, and replacing `next-action.md` in the correct order.

ACTIVE FOCUS:
Define the smallest checklist for determining resume state from repo files alone so interrupted closeout is classified consistently.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should define the resume-state determination checklist from this manual advancement baseline.