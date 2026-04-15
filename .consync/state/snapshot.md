# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package validated the resume-state checklist with concrete examples for `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`.

CURRENT REALITY:
- `next-action.md` is now treated as the live execution slot rather than the durable historical record.
- `handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` is the durable area for executed package instructions and superseded process material.
- Closeout now requires repo reconciliation and resume-state classification before a new package is prepared.
- Resume state is classified as `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.
- `.consync/state/package_plan.md` now defines the minimal durable orchestration format, including cursor, next package, gates, pause conditions, and repair notes.
- The package plan format now includes a compact manual advancement checklist for reading `handoff.md`, checking gates, recording the next cursor, and replacing `next-action.md` in the correct order.
- The package plan format now also includes a compact resume-state checklist for determining whether advancement is allowed or repair is required.
- The resume-state rules are now backed by small worked examples so state labels can be applied without relying on chat history.

ACTIVE FOCUS:
Define the smallest repair-entry and return checklist so interruptions can rejoin the planned sequence safely.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should define the repair-entry and return checklist from this validated baseline.