# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Keep the single-package loop atomic while making the multi-package operator artifacts concrete, minimal, and resumable from repo files alone.

LAST COMPLETED WORK:
The last completed package reran the short desktop mock-session trial and confirmed that the shell is usable for one narrow search-oriented mock session at this scale.

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
- The Bookmarks empty state now describes the absence of saved bookmarks directly instead of referring to proving the loop.
- The bookmark-entry panel now describes the action in terms of saving a bookmark into the current session instead of using generic earlier wording.
- Consync is now documented as a context/memory layer over creative work rather than a tracker of full filesystem truth.
- Local `.consync` anchors are now explicitly described as sparse durable context truth where meaningful local persistence exists.
- Session is now explicitly documented as the primary captured unit, with folder context treated as supportive rather than equivalent.
- Search/discovery is now documented as downward scanning of nested anchors under a chosen root, with discovered associations kept provisional until linked deliberately.
- `sandbox/current` is now explicitly framed as a development harness rather than the long-term ontology.
- A nested sandbox fixture now models a higher-level root with two local `.consync` anchors and one unanchored sibling.
- `sandbox-discover` now finds nested local anchors beneath a chosen root without treating every folder as captured context.
- `sandbox-search` now searches bookmarked artifact metadata across discovered anchors while ignoring ambient non-bookmarked files.
- The nested-anchor trial is deterministic enough for expectation-based verification and remains read-only.
- `sandbox-desktop-search` now wraps nested anchor discovery and bookmark search into a grouped user-facing preview that feels closer to what a desktop result view would show.
- The grouped mock flow still uses the same read-only anchor truth and does not add new linking, ranking, or persistent state.
- The desktop shell now exposes one minimal root/query mock-search path through preload, IPC, shared core, and the renderer.
- The renderer can now display the same grouped mock-search truth already returned by `sandbox-desktop-search`.
- The new desktop search path remains read-only and adds no query persistence, linking, or ranking behavior.
- A short desktop trial can now complete one root-and-query grouped mock search end to end without exposing a new workflow blocker at that scale.
- The most useful next improvement is presentation-level: the grouped result still renders as preformatted text rather than structured renderer-owned rows.

ACTIVE FOCUS:
Move from baseline trial readiness to a small renderer-side presentation improvement for grouped mock-search results.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should render the grouped mock-search result as structured desktop rows while preserving the same read-only search truth.