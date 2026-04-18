TYPE: FEATURE
PACKAGE: add_automated_ui_testing_for_search_flow

STATUS

PASS

SUMMARY

Added a minimal automated UI test layer for the Electron desktop search flow using Vitest with Testing Library and `jsdom`.

The new test mounts the real renderer `App` component against a mocked desktop bridge and covers grouped result rendering, selection updating the detail panel without triggering reveal, explicit reveal button behavior, and selected detail values matching the same search result truth already used elsewhere in the repo. The existing verification surface now runs this UI slice through a simple local command and through `npm run verify`.

Kept the setup narrow: no E2E runner, no UI refactor, and no broader test harness than the one needed to protect the current search -> select -> detail -> reveal flow.

FILES CREATED

- `src/test/app-search-flow.test.jsx` — mounts the renderer app with a mocked desktop bridge and verifies grouped search rendering plus selection-versus-reveal behavior.

FILES MODIFIED

- `package.json` — adds a focused `test:ui-search` command for the new renderer search-flow test.
- `package-lock.json` — records the minimal renderer test dependencies added for the new UI test layer.
- `src/electron/renderer/App.jsx` — adds an explicit React import so the renderer component runs cleanly in the new test path.
- `src/test/verify.js` — runs the new UI search-flow test as part of the existing repo verification pass.
- `.consync/streams/electron_ui/state/handoff.md` — updates the stream-local handoff to reflect that automated UI coverage now exists.
- `.consync/streams/electron_ui/state/snapshot.md` — records the new automated UI test slice as current stream reality.
- `.consync/streams/electron_ui/state/next_action.md` — updates the next likely Electron UI step so future work builds on the new test slice.
- `.consync/state/handoff.md` — records this feature package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && npm run test:ui-search`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run test:ui-search` and confirm the success case that both search-flow tests pass.
2. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm the repo verification pass includes the new renderer search-flow UI slice and still ends with `PASS`.
3. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`, use the default mock search root and query, then click a search result row. Confirm the detail panel updates and Finder does not open. If selecting a row opens Finder, treat that as a failure.
4. In the running desktop shell, click `Reveal in Finder` after selecting a result. Confirm the success case that reveal runs only from the button. If the button does nothing or reveal happens before the click, treat that as a failure.
5. Confirm the grouped search sections and selected detail values still match the rendered mock search result content. If the detail panel shows a different path, note, or tags than the selected row implies, treat that as a failure.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changed files are limited to the new test, the minimal test wiring, the explicit renderer import, the refreshed Electron UI stream state, and the updated handoff.

VERIFICATION NOTES

- Automated verification passed with `npm run test:ui-search` and with `npm run verify`, which now includes the new UI search-flow slice.
- The focused UI test exercised the real `App` component against a mocked desktop bridge and observed grouped result rendering, selection updating detail without reveal, and explicit reveal triggering only from the button.
- Manual live desktop behavior was not rerun during this package; the handoff includes concrete manual checks for the user to confirm the same selection-versus-reveal behavior in the running shell.
- Validated one edge case in the test layer: selected note text legitimately appears both in the result list and in the detail panel after selection, so the test now asserts that duplicated display intentionally rather than treating it as a regression.

NOTES

- Chose Vitest plus Testing Library because the repo already uses Vite and the new test only needed a minimal component-level DOM environment, not full E2E infrastructure.
- Kept the coverage intentionally narrow to the current search -> select -> detail -> reveal flow so future Electron UI work can extend the same pattern without inheriting a heavy test framework.