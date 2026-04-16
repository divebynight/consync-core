TYPE: FEATURE
PACKAGE: wire_drop_bookmark_to_real_session_write

GOAL:

Prove the first real write path from the desktop app by wiring the existing Drop Bookmark action through the current renderer -> preload -> backend path so one bookmark is persisted to the real current session artifact/state.

This package should validate that Consync can mutate real session data end-to-end from the desktop shell without broadening into edit/delete/history features.

CONTEXT:

- The desktop app already reads and displays real session-facing values.
- The Session panel and Bookmarks surface are visible in the renderer.
- A minimal renderer verification slice now exists for the Session panel.
- The current biggest architectural risk is that the desktop app still behaves mostly as a read surface.
- We want to prove the write loop before adding more polish or broader session features.
- Editing bookmarks, deleting bookmarks, and loading old sessions are explicitly out of scope for this package.

REQUIREMENTS:

1. Keep this package narrow and architectural.
2. Reuse the existing renderer -> preload -> backend flow.
3. Persist exactly one bookmark write path from the Drop Bookmark action.
4. Write to the current real session artifact/state, not a mock path.
5. Do not implement edit/delete/history/session switching.
6. Prefer the smallest real mutation that proves the path.
7. Update state files at the end.

TASK:

1. Read the current bookmark flow and identify where the desktop shell currently stops short of a real write.
2. Add the narrowest backend/preload/renderer path needed so Drop Bookmark performs a real write against the current session artifact/state.
3. Keep the UI behavior minimal; the package only needs enough wiring to trigger the real write.
4. Ensure the write shape stays consistent with the current session/bookmark model wherever possible.
5. Add or update the smallest focused test surface needed to prove the real write path, without turning this into a broad mutation test suite.
6. Do not broaden into automatic UI refresh unless it is already the smallest natural consequence of the write.
7. Update state files at the end.

DO NOT:

- implement bookmark editing
- implement bookmark deletion
- implement loading or switching old sessions
- redesign the session model broadly
- add multiple mutation paths
- broaden into full end-to-end UI automation

FILES TO MODIFY:

- feature/runtime files only as needed for the narrow bookmark write path
- focused test files only as needed
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN GATE:
OPTIONAL

MANUAL VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Review the changed files and confirm exactly one real bookmark write path was added from the existing Drop Bookmark action.
3. Confirm the package reuses the renderer -> preload -> backend architecture rather than introducing a side path.
4. Confirm the write targets the current real session artifact/state rather than a mock or detached test-only path.
5. Confirm no edit/delete/history/session-switching behavior was introduced.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changes are limited to the expected feature, focused test, and state files.
7. Failure case: if the package adds more than one mutation path, the change is too broad.
8. Failure case: if the package forces a broad redesign of session identity or history handling, the package is incomplete.

PASS CRITERIA:

- the Drop Bookmark action performs one real write through the existing desktop architecture
- `npm run verify` passes
- the write targets the real current session artifact/state
- the change remains narrow
- no unrelated feature expansion was introduced

FAIL CRITERIA:

- the write path is still mock-only or detached from real session state
- multiple mutation paths are introduced
- the package expands into edit/delete/history/session loading
- unrelated renderer/runtime behavior changes
- `npm run verify` fails

STATE UPDATES:

- `package_plan.md` -> activate the minimal bookmark write-loop plan and record this package as the current step
- `snapshot.md` -> reflect that the current focus is proving the first real desktop write path
- `next-action.md` -> point to the next feature package for reflecting the persisted bookmark in the running desktop state
- `handoff.md` -> record the completed result of this FEATURE package

NOTES:

- Keep this boring on purpose.
- The goal is to prove real mutation, not complete bookmark UX.
- If this package exposes hidden assumptions about session identity, capture them narrowly rather than solving every downstream concern now.