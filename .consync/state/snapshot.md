# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making interruption, closeout, and resume state legible for future sequential multi-package work.

LAST COMPLETED WORK:
The last completed package formalized live-vs-history state rules, added a reconcile-before-advance gate, and preserved the executed package instruction in durable history before `next-action.md` advanced.

CURRENT REALITY:
- `next-action.md` is now treated as the live execution slot rather than the durable historical record.
- `handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` is the durable area for executed package instructions and superseded process material.
- Closeout now requires repo reconciliation and resume-state classification before a new package is prepared.
- Resume state is classified as `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.
- The state docs now form a coherent closeout baseline that is ready for a commit of this process package.

ACTIVE FOCUS:
Define the smallest sequential multi-package protocol that builds on the reconciled live-state rules without introducing automation.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should define the minimal sequential multi-package protocol from this stable baseline.