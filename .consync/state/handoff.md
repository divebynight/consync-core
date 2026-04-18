TYPE: FEATURE
PACKAGE: cover_renderer_search_input_state_invalidation

STATUS

PASS

SUMMARY

Inspected the renderer search-input behavior and found a real stale-state bug: after results loaded or a result was selected, editing the root or query inputs left the old results, detail panel, and reveal target visible under the new input values.

Applied a minimal renderer fix so editing either search input now clears loaded search results and selection immediately, then added focused renderer tests that lock in that corrected contract. This keeps the search/detail panel aligned with the current input state and removes a misleading reveal target.

CURRENT INPUT-EDIT CONTRACT

Before this package, the renderer behaved as follows:

- editing the root input after results loaded left the old results visible
- editing the query input after results loaded left the old results visible
- editing either input after a result was selected left the old detail content and reveal target active

That was risky because the visible result/detail state no longer matched the active root and query inputs.

Current contract after this package:

- editing the root input clears loaded search results
- editing the query input clears loaded search results
- editing either input clears any selected detail state
- the reveal action disappears with the cleared results, so no stale action target remains available

FILES CREATED

- none

FILES MODIFIED

- `src/electron/renderer/App.jsx` — clears search results and selection when the root or query input changes, fixing stale renderer state with a minimal local change.
- `src/test/app-search-flow.test.jsx` — adds focused renderer tests for query/root edits after results or selection so stale list/detail state cannot quietly regress.
- `.consync/state/handoff.md` — records this feature package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx`
- `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and confirm all 10 renderer search-flow tests pass.
2. Open `src/electron/renderer/App.jsx` and confirm editing either search input now clears search results and selection immediately.
3. Open `src/test/app-search-flow.test.jsx` and confirm there is explicit coverage for: query edit after results, query edit after selection, and root edit after selection.
4. Run `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js` and confirm the repo verification ends with `[verify] PASS`.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the worktree shows the renderer file, the test file, and the live next-action file. If stale result or detail state survives input edits, treat that as a failure.

VERIFICATION NOTES

- Ran `node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and observed 10 of 10 tests passing.
- Ran `node src/test/verify.js` and observed the full verification suite pass, including the renderer search-flow UI slice.
- Ran `git status --short` and observed only `.consync/state/next-action.md`, `src/electron/renderer/App.jsx`, and `src/test/app-search-flow.test.jsx` as modified.
- Validated the main edge case directly: after results or selection exist, editing either search input clears the stale list/detail state and removes the reveal action instead of leaving an incorrect action target behind.

NEXT RECOMMENDED PACKAGE

- Add one narrow renderer test for how search-error state should behave when the user edits root or query after a failed search, so the error-clearing contract is explicit before more UI state accumulates.