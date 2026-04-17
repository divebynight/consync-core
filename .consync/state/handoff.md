TYPE: FEATURE
PACKAGE: add_selected_match_detail_panel

STATUS

PASS

SUMMARY

Added a minimal read-only selected-match detail panel to the structured desktop search view so a user can inspect one result more deeply without leaving the shell.

Clicking a result row now selects it, highlights it, and fills a detail panel with the full path, note, tags, and session/anchor context for that match. The feature stays renderer-only and read-only: no navigation, linking, persistence, schema changes, or IPC changes were introduced.

Focused renderer verification now covers selection-key derivation and selected-match detail fields, while desktop scaffold and full repo verification still pass against the unchanged grouped search truth.

FILES CREATED

- `.consync/state/history/plans/feature-20260417-add-selected-match-detail-panel.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.

FILES MODIFIED

- `src/electron/renderer/mock-search-panel.mjs` — added renderer-only helpers for selected-match keys and detail rows derived from the existing grouped search data.
- `src/electron/renderer/App.jsx` — added selected-match state, clickable result rows, and a minimal read-only detail panel inside the existing search view.
- `src/electron/renderer/styles.css` — added selection styling and simple detail-panel styling for the new read-only inspection surface.
- `src/test/renderer-mock-search-panel.js` — extended the focused renderer helper test to cover selected-match detail derivation and empty-state behavior.
- `.consync/state/package_plan.md` — recorded the completed feature package and queued a narrow observational rerun.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the new selected-match detail capability.
- `.consync/state/next-action.md` — replaced the live slot with the next process package.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- Result rows can now be clicked to select one match inside the structured desktop search view.
- A selected-match detail panel now shows full path, full note text, tags, and session/anchor context using the already-available grouped search data.
- The selected row is visibly highlighted so the inspection state is clear.

BEHAVIOR PRESERVED

- The grouped desktop search still returns the same underlying matches and formatted output used by `sandbox-desktop-search`.
- The entire desktop search path remains read-only and does not add query persistence, linking, navigation, ranking, or new IPC breadth.
- Existing deterministic expectations, desktop scaffold verification, and full repo verification remain stable.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/test/renderer-mock-search-panel.js`
- `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Start the desktop shell and run one grouped mock search using `sandbox/fixtures/nested-anchor-trial` and `moss`.
3. Click one result row and confirm it becomes visually selected and that the detail panel updates immediately.
4. Confirm the detail panel shows the chosen match's full path, note, tags, and session/anchor context, and that those values still align with `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
5. Confirm the flow is still read-only: no open-file behavior, saved queries, link actions, ranking, or new session writes appear.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected renderer, verification, and state files.
7. Failure case: if clicking a row does not update the detail panel immediately, the selected-match behavior is incomplete.
8. Failure case: if the detail panel shows values that diverge from the grouped CLI baseline or adds any action-taking behavior, the package is too broad.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && node src/test/renderer-mock-search-panel.js`, `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`, `cd /Users/markhughes/Projects/consync-core && npm run verify`, and `cd /Users/markhughes/Projects/consync-core && git status --short` after adding the selected-match detail panel.
- Observed outcome: the focused renderer helper test passed, the desktop scaffold test passed, full repo verification passed, and the working tree contained only the expected renderer, verification, and state-file edits for this package.
- Validated the important edge cases that selection is derived entirely from existing grouped search data, the detail panel falls back to a simple empty state before a selection exists, and the desktop search flow remained read-only with no IPC or search-truth changes.