TYPE: FEATURE
PACKAGE: expose_grouped_mock_search_in_desktop_shell

STATUS

READY

SUMMARY

Expose the existing grouped mock search flow through one minimal desktop read-only path so the shell can finally attempt the same root-and-query search that the sandbox mock flow already supports.

The last package identified the first concrete blocker clearly: the desktop shell has no way to choose a root or run the grouped mock search at all. This package should fix only that blocker, without pretending to be the full future desktop app.

FILES CREATED

- `.consync/state/history/plans/feature-<timestamp>-expose-grouped-mock-search-in-desktop-shell.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- desktop shell files only as needed to expose one minimal read-only root/query search path
- focused test or expectation files only as needed
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Expose one narrow desktop mock-search path by:

1. letting the desktop shell accept a root and a query
2. routing that read-only request through the existing desktop bridge/main/core path
3. presenting the grouped mock search result in the renderer clearly enough for a short trial
4. avoiding broader search features, linking, or new durable state

CONSTRAINTS

- Keep this package narrow and read-only
- Reuse the existing grouped mock-search truth rather than duplicating discovery/search logic
- Do not add writes, linking, ranking, persistence, or durable relationships
- Do not turn this into a polished search product
- Do not broaden the renderer beyond the minimum needed to expose one understandable mock flow

TASK

1. Add one minimal bridge/main/core path that lets the desktop shell request the existing grouped mock search result for a chosen root and query.
2. Add the smallest renderer surface needed to enter a root and query and display the grouped result.
3. Keep the result read-only and clearly tied to the current mock flow.
4. Add focused verification only where needed.
5. Run repo verification.
6. Update state files at the end.

DO NOT

- redesign the desktop shell
- add fuzzy search, ranking, saved searches, or multi-root behavior
- persist root selections or query history
- infer parent/child relationships beyond the current grouped mock result
- expand the package beyond one minimal searchable desktop mock flow

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success.
2. Start the desktop shell and confirm you can enter a root and query through one narrow read-only path.
3. Confirm the displayed grouped result matches the same underlying truth already returned by `sandbox-desktop-search` for the same root/query.
4. Confirm the desktop flow does not write links, save query history, or introduce new durable state.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected desktop, verification, and state files.

PASS CRITERIA

- The desktop shell can perform one minimal grouped mock search from a chosen root and query
- The displayed result matches the existing grouped mock-search truth
- `npm run verify` passes
- No new write or linking behavior is introduced

FAIL CRITERIA

- The desktop shell still cannot run the grouped mock search
- The desktop result diverges from the existing grouped mock-search truth
- The package introduces write behavior or broader search commitments
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record completion of the desktop-search exposure package and set up the next narrow package from the observed trial outcome
- `snapshot.md` → reflect that the desktop shell can or cannot now perform the grouped mock search directly
- `next-action.md` → point to the next logical package after this unblocker
- `handoff.md` → record the result of this FEATURE package

NOTES

- Keep this boring and direct.
- This package exists only because the blocker is now explicit.
- Do the smallest thing that makes the desktop shell capable of one real grouped mock search.