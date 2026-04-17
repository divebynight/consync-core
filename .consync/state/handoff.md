TYPE: FEATURE
PACKAGE: expose_nested_anchor_search_as_desktop_mock_flow

STATUS

PASS

SUMMARY

Exposed the existing nested-anchor discovery and bookmark search behavior through one grouped desktop-style mock flow so the read-only sandbox now resembles a simple user-facing search result instead of only raw CLI output.

The new `sandbox-desktop-search` command wraps the same underlying nested-anchor truth into a grouped result view by session and anchor. It reuses the existing read-only discovery/search logic, adds one deterministic expectation file, and extends `npm run verify` so the mock flow stays stable.

The result is still explicitly read-only and provisional. It proves the system can present a more desktop-like search flow without introducing UI frameworks, schema changes, ranking, linking, or any new durable state.

FILES CREATED

- `.consync/state/history/plans/feature-20260417-expose-nested-anchor-search-as-desktop-mock-flow.md` — preserved the executed feature instruction before restoring the live `next-action.md` slot to the next planned package.
- `src/commands/sandbox-desktop-search.js` — added the read-only grouped command that simulates a desktop-style search result view over nested anchors.
- `sandbox/expectations/nested-anchor-trial-desktop-search-moss.md` — added the deterministic expected output for the grouped desktop-style mock flow.

FILES MODIFIED

- `src/lib/sandbox-anchors.js` — added a grouped desktop-style output builder that reuses the existing nested anchor search truth instead of duplicating the search logic.
- `src/cli/index.js` — wired `sandbox-desktop-search` into the CLI surface.
- `src/commands/sandbox-catalog.js` — added the new desktop-search expectation to the sandbox catalog output.
- `src/commands/system-summary.js` — added the new grouped mock-flow command and expectation to the surface summary.
- `src/commands/system-check.js` — added the new command file to the repo surface checks.
- `src/test/verify.js` — added deterministic expectation coverage for the grouped desktop-style mock flow.
- `.consync/state/package_plan.md` — recorded the grouped mock-flow package as completed and moved the desktop trial package behind it.
- `.consync/state/snapshot.md` — updated the re-entry summary to reflect the new grouped mock flow.
- `.consync/state/next-action.md` — restored the next live slot to the planned desktop mock-session package with the grouped mock flow as its new dependency.
- `.consync/state/handoff.md` — overwrote the handoff with the completed result of this feature package.

BEHAVIOR ADDED

- `sandbox-desktop-search <root> <query>` now simulates a simple desktop-style search flow by grouping matching bookmarked artifacts under their session and anchor.
- The grouped output now reads like “what the app would show me” instead of a raw debug listing, while still staying fully deterministic.
- `npm run verify` now checks the grouped desktop-style mock flow against an expectation file.

COMMANDS RUN

- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Run `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss` and confirm the output is grouped by session/anchor rather than printed as a flat raw match list.
3. Confirm the grouped result contains the same two bookmarked `moss` matches already surfaced by `sandbox-search`, with readable note/tag text and no raw JSON.
4. Inspect `sandbox/fixtures/nested-anchor-trial/2026/april/reference-shelf/moss-board.txt` and `sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/notes/ambient-research.txt`, then confirm neither ambient file appears in the grouped desktop-style output.
5. Confirm no command in this package writes links, mutates fixtures at runtime, or creates durable parent/child relationships from the grouped view.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected command, expectation, verify, and state files.
7. Failure case: if the grouped command returns different underlying matches than `sandbox-search`, the package is incomplete.
8. Failure case: if the grouped command introduces ranking, persistence, or inferred relationships beyond the existing search truth, the package is incomplete.

VERIFICATION NOTES

- Actually tested the new grouped desktop-style command, the full `npm run verify` suite, and `git status --short` after adding the wrapper flow.
- Observed outcome: the grouped command returned the same two bookmarked `moss` matches as the underlying search surface, formatted by session/anchor, and `npm run verify` passed with the new expectation check included.
- Validated the important edge cases that the grouped result does not surface the unanchored sibling file, does not surface the ambient non-bookmarked greenhouse note, and does not introduce any new write or linking behavior.