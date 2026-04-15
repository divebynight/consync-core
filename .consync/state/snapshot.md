# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package defined the repair-entry and return checklist, including how repair is entered, how blocked work is preserved, and what must be true before planned work resumes.

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
- Verification is now standardized as automated checks, manual checks, closeout validation, and an explicit advancement classification.
- Verification now also distinguishes manual verification instructions from the blocking human-gate mode that controls whether advancement must wait.
- Repair handling is now documented as an explicit operator checklist that preserves the blocked package, requires a `CLEAN` return, and stops on new ambiguity.

ACTIVE FOCUS:
Validate the repair-entry and return checklist against concrete examples so the return rules stay practical and unambiguous.

NEXT ACTION:
Run the next PROCESS package in `.consync/state/next-action.md`, which should validate the repair-entry and return checklist against concrete examples.