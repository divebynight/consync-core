TYPE: FEATURE
PACKAGE: add_reveal_in_finder_for_search_results

STATUS

PASS

SUMMARY

Added one minimal reveal-in-Finder action to the desktop search results so a user can reveal a result's location without leaving the shell.

Clicking a result row now still selects it, but also sends the resolved path through preload, IPC, and the main process so Finder can reveal the file or, when needed, its parent folder. The feature stays read-only: no session mutation, ranking, history, or schema changes were introduced.

Desktop scaffold verification now covers the new preload-to-main reveal path, while full repo verification still passes against the unchanged grouped search truth.

FILES CREATED

- `.consync/state/history/plans/feature-20260417-add-reveal-in-finder-for-search-results.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.

FILES MODIFIED

- `src/electron/shared/ipc-channels.js` — added one IPC channel for the read-only reveal action.
- `src/electron/preload/bridge.js` — exposed one reveal method through the desktop bridge.
- `src/core/desktop-shell.js` — added a small reusable helper that resolves target paths and falls back to the parent folder when direct reveal is unavailable.
- `src/electron/main/ipc.js` — registered the main-process reveal handler and passed it through the shared desktop helper.
- `src/electron/renderer/App.jsx` — extended result-row clicks to trigger the reveal action while preserving selection and detail behavior.
- `src/test/desktop-scaffold.js` — extended the desktop scaffold verification to cover the new reveal handler and bridge call.
- `.consync/state/package_plan.md` — recorded the completed feature package and queued a narrow observational rerun.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the new reveal action.
- `.consync/state/next-action.md` — replaced the live slot with the next process package.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- Result rows can now trigger a reveal action that opens Finder at the matching file location.
- The reveal flow falls back to the parent folder when a direct file reveal is unavailable.
- The existing selected-row inspection path remains available while the reveal action runs.

BEHAVIOR PRESERVED

- The grouped desktop search still returns the same underlying matches and formatted output used by `sandbox-desktop-search`.
- The desktop search flow remains read-only and does not add session mutation, saved queries, ranking changes, or durable history.
- Existing deterministic expectations and full repo verification remain stable.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Start the desktop shell and run one grouped mock search using `sandbox/fixtures/nested-anchor-trial` and `moss`.
3. Click one result row and confirm Finder reveals the correct file, or opens the parent folder if the direct file reveal is unavailable.
4. Confirm the grouped result and selected-match detail still align with `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
5. Confirm the flow is still read-only: no session writes, ranking changes, saved queries, or broader navigation system appear.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected desktop, verification, and state files.
7. Failure case: if clicking a row does not trigger a reveal or fallback folder open, the reveal action is incomplete.
8. Failure case: if the reveal action changes search truth, session state, or adds broader behavior, the package is too broad.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`, `cd /Users/markhughes/Projects/consync-core && npm run verify`, and `cd /Users/markhughes/Projects/consync-core && git status --short` after adding the reveal action.
- Observed outcome: the desktop scaffold test passed, full repo verification passed, and the working tree contained only the expected desktop, verification, and state-file edits for this package.
- Validated the important edge cases that the reveal path is derived from the existing grouped search data, the main-process helper falls back to the parent folder when direct file reveal is unavailable, and the desktop search flow remained read-only with no search-truth or session-state changes.