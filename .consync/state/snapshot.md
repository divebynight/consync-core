# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package added a narrow machine-checkable verification slice for the full bookmark write/read/render loop.

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
- Session state now includes one more real value alongside the latest artifact file: artifact count derived from `sandbox/current`.
- The Session panel now visibly renders that artifact count alongside the existing real session fields.
- The Session panel now also shows the latest bookmark note already present in renderer-readable session state.
- The Session panel now also shows the latest bookmark time already present in renderer-readable session state.
- The renderer hero copy now describes incremental real session values instead of a single real backend signal.
- `npm run verify` now includes one deterministic renderer-oriented Session panel check, reducing reliance on file review alone for recent renderer changes.
- The desktop bookmark action now persists bookmarks into the current real session artifact instead of stopping in in-memory session state.
- The running renderer bookmark flow now re-reads real session state after the write, keeping displayed state anchored to the persisted artifact path.
- The bookmark loop is now also machine-verified end-to-end at the model level: persisted artifact contents, derived session state, derived Session rows, and reload consistency.

ACTIVE FOCUS:
Carry the next narrow UI wording slice now that the bookmark write-and-read loop is both real and machine-verified.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should tighten the Bookmarks panel empty-state copy if it still reads awkwardly after the recent real bookmark loop work.