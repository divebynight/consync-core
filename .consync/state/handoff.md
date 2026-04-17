TYPE: FEATURE
PACKAGE: expose_grouped_mock_search_in_desktop_shell

STATUS

PASS

SUMMARY

Exposed the existing grouped mock search flow through one minimal desktop read-only path so the shell can now attempt the same root-and-query search that the sandbox mock flow already supports.

The desktop shell now accepts a root and query, routes that request through preload, IPC, and shared core, and displays the grouped mock-search result directly in the renderer. The output stays tied to the existing grouped mock-search truth instead of creating a second search implementation.

The package stayed narrow and read-only: no links, saved queries, ranking, or new durable state were introduced. It fixes only the previously recorded blocker and sets the next package up to rerun the short desktop trial against this updated shell.

FILES CREATED

- `.consync/state/history/plans/feature-20260417-expose-grouped-mock-search-in-desktop-shell.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.
- `src/commands/sandbox-desktop-search.js` — added the read-only grouped command that simulates a desktop-style search result view over nested anchors.
- `sandbox/expectations/nested-anchor-trial-desktop-search-moss.md` — added the deterministic expected output for the grouped desktop-style mock flow.

FILES MODIFIED

- `src/core/desktop-shell.js` — added the shared core wrapper that returns the existing grouped mock-search result for a root/query pair.
- `src/electron/shared/ipc-channels.js` — added one IPC channel for the desktop mock-search request.
- `src/electron/main/ipc.js` — registered the new read-only desktop mock-search handler.
- `src/electron/preload/bridge.js` — exposed the new desktop mock-search method through the preload bridge.
- `src/electron/renderer/App.jsx` — added the smallest renderer surface needed to enter a root/query pair and display the grouped mock-search result.
- `src/electron/renderer/styles.css` — added minimal styling for the new desktop mock-search form and result block.
- `src/test/desktop-scaffold.js` — extended the focused desktop scaffold verification to cover the new core, IPC, and preload search path.
- `.consync/state/package_plan.md` — recorded the completed desktop-search exposure package and moved the next package to a rerun of the short desktop trial.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect that the desktop shell now exposes the grouped mock-search path directly.
- `.consync/state/next-action.md` — replaced the live slot with the next process package for rerunning the short desktop trial.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- The desktop shell can now accept a root and query and run one grouped mock search directly through the existing bridge/main/core path.
- The renderer now shows the grouped mock-search result in one readable desktop panel instead of requiring the CLI-only `sandbox-desktop-search` path.
- The desktop result reuses the same grouped mock-search truth already verified in the sandbox surface, keeping the feature deterministic and read-only.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Start the desktop shell and confirm you can enter `sandbox/fixtures/nested-anchor-trial` as the root and `moss` as the query through one narrow read-only path.
3. Confirm the displayed grouped result matches the same underlying truth already returned by `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
4. Confirm the desktop flow does not write links, save query history, or introduce new durable state.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected desktop, verification, and state files.
6. Failure case: if the desktop result differs from the grouped sandbox mock-search result for the same root/query, the package is incomplete.
7. Failure case: if the desktop flow persists query history, writes links, or broadens search behavior beyond the existing grouped mock-search truth, the package is too broad.

VERIFICATION NOTES

- Actually tested `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`, `cd /Users/markhughes/Projects/consync-core && npm run verify`, and `cd /Users/markhughes/Projects/consync-core && git status --short` after exposing the desktop mock-search path.
- Observed outcome: the focused desktop scaffold test passed, `npm run verify` passed, and the working tree matched the expected desktop, verification, and state-file edits.
- Validated the important edge cases that the new desktop flow stays read-only, reuses the existing grouped mock-search truth rather than duplicating search logic, and does not introduce saved queries, linking, or ranking behavior.