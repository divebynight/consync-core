TYPE: PROCESS
PACKAGE: expand_integrity_checks_from_core_state_to_stream_local_state

STATUS

PASS

SUMMARY

Expanded the lightweight integrity checks from the four global live-state artifacts into active and paused stream-local state so the repo can now catch obvious drift between global ownership and per-stream truth.

The extension stayed shallow and operational. The shared evaluator now reads `stream.md`, local `next_action.md`, local `snapshot.md`, and local `handoff.md` for the globally active stream and any globally paused streams; the command output now reports a stream-local PASS/FAIL line; the narrow test covers coherent stream-local state plus obvious active/paused contradiction cases; and the active process stream’s local state was refreshed so the live repo passes the expanded checks.

FILES CREATED

- none

FILES MODIFIED

- `src/lib/stateIntegrityCheck.js` — extends the evaluator into stream-local state, adds paused-stream parsing from `active-stream.md`, checks active/paused stream-local invariants, and detects obvious global-versus-local contradictions.
- `src/commands/state-integrity-check.js` — adds a concise `stream-local state: PASS|FAIL` output line so operators can see whether failures are global or stream-local.
- `src/test/state-integrity-checks.js` — expands the narrow fixture surface to include coherent stream-local state plus failures for an active stream locally marked paused and a paused stream missing readable resume context.
- `.consync/streams/process/state/next_action.md` — refreshes the active process stream’s local next action so it matches the currently mounted package and current focus.
- `.consync/streams/process/state/snapshot.md` — refreshes the active process stream’s local snapshot so it describes the current integrity-check phase instead of the earlier definition-only phase.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current stream-local integrity-check package and the current process focus accurately.
- `.consync/docs/state-contracts-and-integrity-checks.md` — adds one small implementation note clarifying that the current lightweight integrity-check command now covers stream-local state in addition to the four global artifacts.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run check:state-preflight`
- `cd /Users/markhughes/Projects/consync-core && npm run check:state-postflight`
- `cd /Users/markhughes/Projects/consync-core && npm run test:state-integrity-checks`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

VERIFICATION

- Ran `npm run check:state-preflight` and observed `STATUS: PASS` with active stream `process`, active package `expand_integrity_checks_from_core_state_to_stream_local_state`, system state `OPEN`, stream-local state `PASS`, and the next safe action to execute the mounted package.
- Ran `npm run test:state-integrity-checks` and observed `PASS`, including failure coverage for an active stream locally marked paused and a paused stream missing readable local resume context.
- Wrote this handoff for the mounted package and then ran `npm run check:state-postflight`, observing `STATUS: PASS` with coherent global ownership, coherent stream-local state, and a next safe action to accept closeout and mount the next package intentionally.
- Ran `git status --short` and confirmed the package stayed narrow: stream-local integrity logic, the narrow fixture test update, the active process stream local-state refresh, the global snapshot refresh, the focused contracts-doc note, and the live handoff file. The mounted `next-action.md` is also present in the worktree because it carries the current package.

MANUAL VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run check:state-preflight`.
2. Confirm success behavior: the command prints `STATUS: PASS`, includes `stream-local state: PASS`, names the active stream and active package, reports `OPEN`, and ends with a readable next safe action.
3. Run `cd /Users/markhughes/Projects/consync-core && npm run check:state-postflight`.
4. Confirm success behavior: the command prints `STATUS: PASS`, includes `stream-local state: PASS`, and still answers active stream, active package, open/closed state, and next safe action clearly.
5. Run `cd /Users/markhughes/Projects/consync-core && npm run test:state-integrity-checks`.
6. Confirm success behavior: the fixture test passes and covers at least one stream-local contradiction case instead of only global snapshot mismatch.
7. Failure case: if either integrity command prints `stream-local state: FAIL`, read the named stream failure and reconcile the contradiction before continuing.
8. Failure case: if the command starts reporting broader docs outside global and stream-local state surfaces, treat that as scope creep for this package.

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changed surface is limited to the integrity-check implementation, the narrow stream-local test expansion, the active process stream’s local state files, the global snapshot refresh, the small contracts-doc note, and the live handoff. The mounted `next-action.md` may also appear as part of the live loop.
2. Open `src/lib/stateIntegrityCheck.js` and verify success behavior: the expanded checks read active and paused stream-local state files but still avoid broad `.consync/docs` scanning and broader repo validation.
3. Open `.consync/streams/process/state/next_action.md` and `.consync/streams/process/state/snapshot.md` and verify success behavior: the active stream’s local state now reads like the current package rather than a stale earlier phase.
4. Verify failure behavior: if you intentionally mark the active stream locally as paused or remove meaningful resume context from a paused stream snapshot, the test surface or live command should fail and indicate reconciliation is required.
5. Verify failure behavior: if the output becomes verbose enough to feel like a repo-wide validator rather than a smoke/contract check, the package exceeded scope.

VERIFICATION NOTES

- Actually tested: live preflight via `npm run check:state-preflight`, live postflight via `npm run check:state-postflight`, the expanded narrow fixture test via `npm run test:state-integrity-checks`, and changed-surface inspection via `git status --short`.
- Observed outcome: both live commands returned `STATUS: PASS` with `stream-local state: PASS` on coherent repo state, and the fixture test passed while also exercising two obvious stream-local contradiction cases.
- Important edge cases validated: the first expanded preflight caught a stale active-stream local snapshot until the process stream’s local state was refreshed, and the test now catches both an active stream locally marked paused and a paused stream missing readable resume context.

NEXT SUGGESTED PACKAGE

- `define_artifact_role_labels_for_state_control_governance_reference_and_history` — the next narrow package that formalizes artifact-role labeling so markdown files can be reasoned about by role instead of being treated as one undifferentiated file class.