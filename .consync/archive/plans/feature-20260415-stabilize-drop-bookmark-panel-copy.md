TYPE: FEATURE
PACKAGE: stabilize_drop_bookmark_panel_copy

STATUS

READY

SUMMARY

Tighten the Drop Bookmark panel copy so it accurately reflects the current bookmark behavior and the now-verified write/read/render loop without introducing any new functionality or structural UI changes.

The bookmark loop itself is now machine-verified. This package is only about making the user-facing wording match that reality cleanly and plainly.

FILES CREATED

- `.consync/state/history/plans/feature-<timestamp>-stabilize-drop-bookmark-panel-copy.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- `src/electron/renderer/App.jsx` — tighten the Drop Bookmark panel wording only as needed
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Make the Drop Bookmark panel text read clearly and accurately for the current system by:

1. describing the action in terms of saving a bookmark to the current session
2. avoiding outdated “proof loop” language or temporary implementation framing
3. keeping the wording aligned with the verified persisted bookmark flow

CONSTRAINTS

- Keep this package extremely narrow
- Change copy only
- Do not introduce new data, state, or display rows
- Do not modify bookmark behavior
- Do not change preload, backend, or verification logic
- Do not substantially restyle or restructure layout

TASK

1. Review the current Drop Bookmark panel copy in the renderer
2. Tighten the wording so it matches the current product behavior:
   - user adds a bookmark
   - bookmark is saved to the current session
   - running state reflects persisted session truth
3. Keep the wording simple and direct
4. Do not add helper text that implies future features
5. Run repo verification
6. Update state files at the end

DO NOT

- add new session values
- add new instructions or extra workflow steps
- change layout/styling substantially
- modify bookmark creation behavior
- modify session derivation logic
- add tests unless an existing copy-facing test must be updated trivially

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success
2. Review the renderer change and confirm the package only tightens Drop Bookmark panel wording
3. Confirm no backend, preload, or state-model changes were introduced
4. Confirm no unrelated layout or styling refactor was introduced
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to expected renderer and state files

PASS CRITERIA

- Drop Bookmark panel wording is clearer and more accurate
- No behavior changes were introduced
- `npm run verify` passes
- Scope remains copy-only and narrow

FAIL CRITERIA

- Package introduces new data or behavior
- Package changes layout or styling substantially
- Copy implies unimplemented functionality
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record completion of the Drop Bookmark copy pass and set up the next package toward mock-session usability
- `snapshot.md` → reflect that bookmark-panel wording now matches the verified bookmark flow
- `next-action.md` → point to the next logical package after this copy cleanup, likely a mock session trial package
- `handoff.md` → record the result of this FEATURE package

NOTES

- This package is the last small cleanup in the current bookmark-facing plan
- After this, planning should shift from loop cleanup to trial-use readiness
- Keep it boring, precise, and copy-only