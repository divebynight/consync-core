TYPE: FEATURE
PACKAGE: add_read_only_mock_search_match_detail_panel

SUMMARY

Add one narrow read-only detail panel for the currently selected structured mock-search result so the desktop shell can inspect a chosen match more deliberately without adding navigation, writes, or broader search behavior.

The last package confirmed that the structured grouped-result view is usable for one short search-oriented desktop trial at this scale. The next most useful improvement is a small read-only detail surface for one selected result, so the shell can inspect a match more intentionally without turning into a full search product.

FILES CREATED

- `.consync/state/history/plans/feature-<timestamp>-add-read-only-mock-search-match-detail-panel.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- desktop renderer files only as needed to support one selected-match detail surface
- focused verification files only as needed
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Add one narrow selected-result detail surface by:

1. keeping the existing root/query search path and grouped result truth unchanged
2. allowing the renderer to track one currently selected match from the structured result list
3. showing that selected match in a readable read-only detail panel
4. avoiding navigation, file opening, link actions, writes, or broader search-state expansion

CONSTRAINTS

- Keep this package narrow and renderer-facing
- Do not change the meaning of the grouped search data
- Do not add new IPC surface unless a tiny shape adjustment is absolutely necessary
- Do not add open-file behavior, saved queries, ranking, linking, or new persistent state
- Do not redesign the search panel into a full browser

TASK

1. Add the smallest renderer-side selected state needed for one mock-search result row.
2. Present a read-only detail panel for the selected row that shows the most useful already-available fields, such as session, anchor, artifact path, note, and tags.
3. Keep the empty-state behavior simple when no result is selected.
4. Add focused verification only where needed.
5. Preserve the current grouped search truth and CLI behavior.
6. Run repo verification.
7. Update state files at the end.

DO NOT

- redesign the desktop shell
- add file-opening or click-through navigation
- add write behavior or durable selection state
- broaden the package beyond one selected-match detail surface

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success.
2. Start the desktop shell and run one grouped mock search using `sandbox/fixtures/nested-anchor-trial` and `moss`.
3. Select one result row and confirm the detail panel updates to show that match's session, anchor, artifact path, note, and tags in a readable read-only way.
4. Confirm the displayed selected-match fields still align with `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
5. Confirm the panel does not introduce open-file actions, writes, saved state, or broader navigation.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected renderer, verification, and state files.

PASS CRITERIA

- One selected match can be inspected through a read-only detail panel
- The detail panel still reflects the same grouped search truth already used by the renderer and CLI
- `npm run verify` passes
- No unnecessary implementation sprawl was introduced

FAIL CRITERIA

- The package adds navigation, open actions, or write behavior
- The detail panel diverges from the grouped search truth already returned by the shell
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record completion of the selected-match detail package and set up the next narrow package from the observed outcome
- `snapshot.md` → reflect that the grouped search view now supports one deeper read-only inspection step
- `next-action.md` → point to the next logical package after this feature
- `handoff.md` → record the result of this FEATURE package

NOTES

- Keep this boring and read-only.
- The point is to improve inspection depth without broadening the shell into navigation or action-taking.
- Prefer the smallest selected-state addition that still feels useful.