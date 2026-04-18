TYPE: FEATURE
PACKAGE: cover_renderer_error_state_invalidation

STATUS

PASS

SUMMARY

Inspected the renderer behavior after a failed search and found that editing the root or query inputs did not clear the stale error message. That left an outdated failure visible even after the user had started expressing a new search intent.

Applied a minimal renderer fix so search-input edits now clear search error state along with stale search results and selection, then added focused renderer tests to lock in that contract. This keeps the search panel consistent: new input intent no longer shares space with an old failed-search message.

CURRENT ERROR-STATE CONTRACT

Before this package, the renderer behaved as follows after `runMockSearch` failed:

- the error message became visible
- editing the query input did not clear that stale error
- editing the root input did not clear that stale error
- reveal controls were not available because no results were present

That was inconsistent with the newer stale-success invalidation behavior and kept outdated error feedback visible while inputs changed.

Current contract after this package:

- a failed-search error is shown after `runMockSearch` returns `ok: false`
- editing the query input clears the stale failed-search error immediately
- editing the root input clears the stale failed-search error immediately
- reveal controls remain unavailable during failed-search state and after error invalidation until results are loaded again

FILES CREATED

- none

FILES MODIFIED

- `src/electron/renderer/App.jsx` — clears stale error state when the search root or query changes, keeping search feedback aligned with current input intent.
- `src/test/app-search-flow.test.jsx` — adds focused renderer tests for query/root edits after a failed search and confirms no reveal controls are exposed during error state.
- `.consync/state/handoff.md` — records this feature package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx`
- `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and confirm all 12 renderer search-flow tests pass.
2. Open `src/electron/renderer/App.jsx` and confirm search input edits now clear error state through the shared search-state invalidation path.
3. Open `src/test/app-search-flow.test.jsx` and confirm there is explicit coverage for query edits after a failed search and root edits after a failed search.
4. Run `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js` and confirm the repo verification ends with `[verify] PASS`.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the worktree shows the renderer file, the test file, and the live next-action file. If a failed-search error remains visible after editing root or query, treat that as a failure.

VERIFICATION NOTES

- Ran `node ./node_modules/vitest/vitest.mjs run --environment jsdom src/test/app-search-flow.test.jsx` and observed 12 of 12 tests passing.
- Ran `node src/test/verify.js` and observed the full verification suite pass, including the renderer search-flow UI slice.
- Ran `git status --short` and observed only `.consync/state/next-action.md`, `src/electron/renderer/App.jsx`, and `src/test/app-search-flow.test.jsx` as modified.
- Validated the key edge case directly: after a failed search, editing either root or query removes the stale error immediately and does not expose a reveal control or stale action target.

NEXT RECOMMENDED PACKAGE

- Add one narrow renderer package to separate search-panel errors from non-search session errors, so future reveal or bookmark failures can be scoped more precisely without broadening the current single-error-message model by accident.