# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package validated the repair-entry and return checklist with concrete examples for repair entry, successful return, and stop-before-return.

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
- The repair rules are now backed by small worked examples so return decisions can be applied without relying on chat history.

ACTIVE FOCUS:
Use the now-stabilized process to carry the first narrow real feature slice through the existing desktop bridge.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should expose one more real session-facing value through the existing bridge path.