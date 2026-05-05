TYPE: PROCESS
PACKAGE: stabilize_bookmark_write_read_render_loop_verification

STATUS

READY

SUMMARY

The system has successfully proven a full end-to-end bookmark loop:

- Drop Bookmark writes to the real session artifact immediately
- The renderer updates in the same running session by re-reading persisted session state
- Restarting the desktop app reloads the same persisted state correctly

This package converts that proof into a narrow, machine-checkable verification slice so the write/read/render loop is stable and resistant to regression.

No new bookmark features are introduced in this package.

FILES CREATED

- `.consync/state/history/plans/process-<timestamp>-stabilize-bookmark-write-read-render-loop-verification.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- focused verification files only as needed, likely under `src/test/`
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Add the smallest possible verification slice that proves all of the following deterministically:

1. A bookmark write updates the persisted session artifact
2. Session state derived from persisted data reflects:
   - incremented bookmark count
   - latest note
   - latest time
3. The bookmarks list reflects the new entry
4. Reloading session state from disk reproduces the same derived result
5. The verification is narrow, boring, and resistant to regression

CONSTRAINTS

- Keep this package narrow and verification-focused
- Do not introduce new bookmark features
- Do not introduce edit/delete/history/session switching
- Do not introduce a full UI testing framework
- Prefer deterministic core/model verification over DOM automation
- Reuse existing helpers and patterns where possible
- Avoid coupling tests to fragile renderer structure
- Do not broaden this into general session refresh infrastructure

TASK

1. Identify the smallest existing core surface that can verify:
   - bookmark persistence
   - derived session summary
   - bookmark list contents
   - reload consistency

2. Add one focused verification slice, either by:
   - extending an existing core/session test, or
   - adding one small new targeted test file

3. In that verification:
   - create or isolate a temporary session directory
   - perform a real bookmark write through the normal core path
   - read the persisted session artifact from disk
   - assert bookmark contents in the artifact
   - derive session state from persisted data
   - assert bookmark count, latest note, and latest time
   - re-read from disk and assert the same derived result again

4. Wire the verification into the existing repo verification flow so it is covered by:
   - `npm run verify`

5. Keep implementation minimal and aligned with current architecture:
   - Core is source of truth
   - UI is not required for correctness
   - No duplicate mutation paths

6. Update state files at the end

DO NOT

- implement edit/delete functionality
- implement session switching or history loading
- add subscriptions or generalized refresh systems
- add broad Electron or DOM automation
- refactor unrelated renderer, preload, or core code
- treat UI behavior alone as proof of correctness

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success
2. Confirm exactly one new or extended narrow verification slice exists for the bookmark loop
3. Confirm the verification asserts both:
   - persisted artifact contents
   - derived session state from persisted data
4. Confirm reload-from-disk consistency is asserted
5. Confirm no unrelated feature work was introduced
6. Confirm repo changes are limited to expected verification and state files

PASS CRITERIA

- Bookmark write/read/render loop is covered by at least one machine-checkable verification slice
- `npm run verify` passes
- Verification remains narrow and deterministic
- Persisted artifact state is asserted
- Derived session state is asserted
- Reload consistency is asserted
- No unrelated feature expansion occurs

FAIL CRITERIA

- Verification depends on manual UI inspection
- No assertion of persisted artifact state
- No assertion of derived session state
- No reload consistency check exists
- Package expands into feature work
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record this stabilization package and keep the plan focused on locking down the bookmark loop
- `snapshot.md` → reflect that the bookmark loop is now both working and machine-verified
- `next-action.md` → point to the next logical package after stabilization
- `handoff.md` → record the result of this PROCESS package

NOTES

- This package locks down behavior that is already working
- The goal is confidence and regression protection, not new capability
- Keep it boring and precise