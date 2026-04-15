# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while defining the smallest doc-driven protocol for safe sequential multi-package work.

LAST COMPLETED WORK:
The last completed package defined the minimal sequential multi-package protocol, including sequence start inputs, advance eligibility, pause conditions, repair return rules, and a conservative default run window.

CURRENT REALITY:
- `next-action.md` is now treated as the live execution slot rather than the durable historical record.
- `handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` is the durable area for executed package instructions and superseded process material.
- Closeout now requires repo reconciliation and resume-state classification before a new package is prepared.
- Resume state is classified as `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.
- `.consync/state/package_plan.md` now exists as the long-lived orchestration truth for ordered package sequences.
- The sequential protocol now defines start, advance, pause, `FAIL`, repair, and the default 3-package run window from repo files alone.

ACTIVE FOCUS:
Define the smallest durable `package_plan.md` format so the new sequence protocol has a stable orchestration artifact.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should formalize the minimal `package_plan.md` structure and update rules.