TYPE: FEATURE
PACKAGE: separate_selection_and_reveal_actions

STATUS

PASS

SUMMARY

Separated result-row selection from reveal behavior so clicking a search result now inspects only, and reveal happens through an explicit button in the detail panel.

Clicking a result row now selects it and updates the detail panel without opening Finder automatically. The new `Reveal in Finder` button reuses the existing preload, IPC, and main-process reveal flow, so inspect and act are separated without changing search truth, session state, or persistence behavior.

Desktop scaffold and full repo verification still pass after the behavior split, confirming that reveal remains available while selection no longer triggers it as a side effect.

FILES CREATED

- `.consync/state/history/plans/feature-20260417-separate-selection-and-reveal-actions.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.

FILES MODIFIED

- `src/electron/renderer/App.jsx` — removed automatic reveal from row selection and added an explicit reveal button in the detail panel.
- `src/electron/renderer/styles.css` — added a small layout rule for the new explicit detail-panel action row.
- `.consync/state/package_plan.md` — recorded the completed feature package and queued a narrow observational rerun.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the explicit reveal-button flow.
- `.consync/state/next-action.md` — replaced the live slot with the next process package.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- Result rows now select only, so inspection state updates without triggering Finder.
- The detail panel now includes an explicit `Reveal in Finder` button that triggers the existing reveal flow on demand.
- The search flow now has a cleaner inspect-then-act sequence.

BEHAVIOR PRESERVED

- The grouped desktop search still returns the same underlying matches and formatted output used by `sandbox-desktop-search`.
- The reveal capability still works through the existing read-only bridge, IPC, and main-process path.
- The desktop search flow remains read-only and does not add session mutation, saved queries, ranking changes, or durable history.

COMMANDS RUN

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
3. Click one result row and confirm it updates the detail panel without opening Finder automatically.
4. Click the `Reveal in Finder` button and confirm Finder reveals the correct file, or opens the parent folder if the direct file reveal is unavailable.
5. Confirm the grouped result and selected-match detail still align with `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected renderer, verification, and state files.
7. Failure case: if selecting a row still opens Finder automatically, the behavior split is incomplete.
8. Failure case: if the explicit reveal button no longer opens Finder or the fallback folder, the reveal path regressed.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`, `cd /Users/markhughes/Projects/consync-core && npm run verify`, and `cd /Users/markhughes/Projects/consync-core && git status --short` after separating selection from reveal.
- Observed outcome: the desktop scaffold test passed, full repo verification passed, and the working tree contained only the expected renderer, verification, and state-file edits for this package.
- Validated the important edge cases that selection now updates state without invoking the reveal side effect, the explicit reveal button still reuses the existing reveal path, and the desktop search flow remained read-only with no search-truth or session-state changes.