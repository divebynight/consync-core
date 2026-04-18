TYPE: PROCESS
PACKAGE: rerun_observational_search_loop_after_selection_reveal_split

STATUS

FAIL

SUMMARY

The automated baseline remained healthy after the selection/reveal split, but this observational rerun could not close PASS because the live desktop interaction was not durably observed end to end.

`node src/test/desktop-scaffold.js` passed, `npm run verify` passed, and the CLI truth source for `sandbox/fixtures/nested-anchor-trial` with `moss` still reported two sessions and two matches. The desktop app was launched and then manually closed, but the actual search -> select -> explicit reveal -> reselection behavior was not captured reliably enough to confirm that the live loop behaved cleanly.

No product code changed in this package. This remained a pure observational and state-update package, and it closes FAIL only because the required live-shell observation was incomplete rather than because a concrete regression was proven.

FILES CREATED

- `.consync/state/history/plans/process-20260417-rerun-observational-search-loop-after-selection-reveal-split.md` — preserved the executed observational instruction before restoring the live `next-action.md` slot.

FILES MODIFIED

- `.consync/state/package_plan.md` — marked the observational rerun FAIL, paused normal advancement, and queued a narrow manual-observation repair-style package.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that automated checks passed but live-loop confirmation is still missing.
- `.consync/state/next-action.md` — replaced the live slot with a manual-observation package to resolve the failed evidence gap.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this observational package.

BEHAVIOR OBSERVED

- The automated desktop scaffold path remained healthy.
- The CLI grouped-search truth remained stable at two sessions and two matches for the `moss` query.
- The desktop app launched successfully and was manually closed.

BEHAVIOR PRESERVED

- The grouped desktop search still returns the same underlying matches and formatted output used by `sandbox-desktop-search`.
- The desktop search flow remains read-only and does not add session mutation, saved queries, ranking changes, or durable history.

BEHAVIOR CHANGED

- No product behavior changed in this package.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
3. Search `sandbox/fixtures/nested-anchor-trial` for `moss` and confirm grouped results appear.
4. Click one result row and confirm only the detail panel changes.
5. Confirm Finder does not open on selection.
6. Click `Reveal in Finder` and confirm Finder reveals the correct file, or its parent folder, on demand.
7. Confirm the selected detail still matches `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
8. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected state files unless a small repair was required.
9. Failure case: if the live interaction still cannot be observed clearly, the observational gap remains unresolved.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`, `cd /Users/markhughes/Projects/consync-core && npm run verify`, `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`, and `cd /Users/markhughes/Projects/consync-core && git status --short` during this package.
- A desktop-shell launch was also actually performed via `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`, and the app was manually closed.
- Observed outcome: the automated baseline passed and the app launched, but no trustworthy full live observation of search -> select -> explicit reveal -> reselection was captured, so no product code was changed and the package closes FAIL.
- Validated the important edge cases that the grouped search truth remained stable and that this package introduced no new product changes while resolving the observational status honestly.