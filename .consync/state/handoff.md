TYPE: FEATURE
PACKAGE: separate_search_panel_errors_from_non_search_session_errors

STATUS

PASS

SUMMARY

Separated search-panel errors from non-search session errors in the Electron renderer with a small state split instead of a broader error-model redesign.

Search failures now render inside the Mock Search panel under their own `Search Error` heading, while non-search failures continue to use the top-level `Session Error` surface. This keeps search-specific failures next to the search workflow without changing the overall renderer structure.

CURRENT ERROR SURFACE

- Before this package, `runMockSearch` failures and search-result reveal failures used the same top-level `Session Error` panel as unrelated session or bookmark failures.
- That meant search problems were rendered away from the search workflow and shared one generic error surface with non-search failures.

ERROR SPLIT DECISION

- Introduced a dedicated `searchErrorMessage` state for search-panel failures.
- Kept `sessionErrorMessage` for non-search failures such as desktop/session load or bookmark write problems.
- Search failures from `runMockSearch` and search-result reveal failures now render under a `Search Error` heading inside the Mock Search panel.
- Non-search failures still render in the existing top-level `Session Error` panel.
- Input changes and new search interactions clear only the search-panel error state, preserving the narrower split.

FILES CREATED

- none

FILES MODIFIED

- `src/electron/renderer/App.jsx` — splits renderer error state into search-panel errors and non-search session errors, and renders search failures inside the Mock Search panel.
- `src/test/app-search-flow.test.jsx` — updates focused renderer tests to confirm search failures use `Search Error` while non-search failures continue using `Session Error`.
- `.consync/state/handoff.md` — records this feature package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and confirm all 13 renderer search-flow tests pass.
2. Trigger a mock search failure path and confirm the error appears under `Search Error` inside the Mock Search panel instead of the top-level `Session Error` panel.
3. Trigger a reveal failure from the search detail flow and confirm it also appears under `Search Error`.
4. Trigger a non-search failure such as a bookmark write error and confirm it still appears under `Session Error` rather than `Search Error`.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the change stayed limited to the renderer file, the focused search-flow test file, and the live handoff. If search failures still share the generic session-level error panel, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based.
- Ran `node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and observed 13 of 13 focused renderer tests passing.
- Confirmed `runMockSearch` failures and search-result reveal failures now use the search-panel error surface, while a non-search bookmark failure still uses the top-level session error surface.
- Confirmed the split stayed narrow: the renderer still uses the existing overall structure, with only one additional search-specific error channel.
- Ran `git status --short` and observed only `src/electron/renderer/App.jsx` and `src/test/app-search-flow.test.jsx` modified before writing this closeout.

NEXT RECOMMENDED PACKAGE

- Add one narrow renderer package that decides whether successful search actions should clear existing session-level errors, so the two error surfaces have an explicit interaction contract.