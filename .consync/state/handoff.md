TYPE: PROCESS
PACKAGE: implement_preflight_and_postflight_doc_integrity_checks

STATUS

PASS

SUMMARY

Implemented the first lightweight integrity check surface for the live process loop by adding a repo-native preflight/postflight command, small npm scripts, and a narrow fixture test.

The new checks stay intentionally shallow. They only govern the four core live-state artifacts, return concise `STATUS: PASS|FAIL` output with short reason lines, and answer the core operational questions needed for smoke-level trust: active stream, active package, system open/closed state, obvious contradiction detection, and next safe action. The contracts doc now includes the exact operator commands and PASS/FAIL meaning for both phases.

FILES CREATED

- `src/lib/stateIntegrityCheck.js` — shared parser/evaluator for the four core live-state artifacts and the preflight/postflight PASS/FAIL decision logic.
- `src/commands/state-integrity-check.js` — CLI command that runs the new integrity checks and prints concise operational output.
- `src/test/state-integrity-checks.js` — narrow fixture test that covers a passing state and an obvious failure condition caused by conflicting snapshot state.

FILES MODIFIED

- `package.json` — adds `check:state-preflight`, `check:state-postflight`, and `test:state-integrity-checks` scripts.
- `src/cli/index.js` — wires the new `state-integrity-check` command into the existing CLI surface.
- `src/commands/system-check.js` — recognizes the new integrity-check command as part of the repo command surface.
- `src/commands/system-summary.js` — adds the new command and npm scripts to the summary output.
- `.consync/docs/state-contracts-and-integrity-checks.md` — adds the exact operator commands for preflight and postflight and explains what `STATUS: PASS` and `STATUS: FAIL` mean.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current integrity-check implementation package and current enforcement phase accurately.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run check:state-preflight`
- `cd /Users/markhughes/Projects/consync-core && npm run check:state-postflight`
- `cd /Users/markhughes/Projects/consync-core && npm run test:state-integrity-checks`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

VERIFICATION

- Ran `npm run check:state-preflight` and observed `STATUS: PASS` with the active stream `process`, the active package `implement_preflight_and_postflight_doc_integrity_checks`, system state `OPEN`, and the next safe action to execute the mounted package.
- Ran `npm run test:state-integrity-checks` and observed `PASS`, including a simulated obvious failure condition caused by a conflicting snapshot active stream.
- Wrote this handoff for the mounted package and then ran `npm run check:state-postflight`, observing `STATUS: PASS` with a coherent active stream, active package, system state, and next safe action.
- Ran `git status --short` and confirmed the package stayed narrow: one new library file, one new command, one new test, small command-surface updates, a focused doc update, the snapshot refresh, and the live handoff file. The live `next-action.md` is also present in the worktree because it mounts the current package.

MANUAL VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run check:state-preflight`.
2. Confirm success behavior: the command prints `STATUS: PASS`, names the active stream and active package, reports `OPEN`, and ends with a readable next safe action.
3. Run `cd /Users/markhughes/Projects/consync-core && npm run check:state-postflight`.
4. Confirm success behavior: the command prints `STATUS: PASS`, the handoff package matches the mounted package, and the output still answers active stream, active package, open/closed state, and next safe action clearly.
5. Run `cd /Users/markhughes/Projects/consync-core && npm run test:state-integrity-checks`.
6. Confirm success behavior: the fixture test passes and covers an obvious failure condition without scanning the whole repo.
7. Failure case: if either integrity command prints `STATUS: FAIL`, read the reason lines and reconcile the named contradiction before continuing.
8. Failure case: if the commands start reporting unrelated markdown drift outside the four core live-state artifacts, treat that as scope creep for this package.

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changed surface is limited to the new integrity-check library/command/test, the small command-surface updates, the focused contracts-doc update, the snapshot refresh, and the live handoff. The mounted `next-action.md` may also appear as part of the live loop.
2. Open `src/lib/stateIntegrityCheck.js` and verify success behavior: the checks only read the four core global live-state artifacts and do not scan broader history or reference docs.
3. Run both `npm run check:state-preflight` and `npm run check:state-postflight` and verify success behavior: both outputs stay short, operational, and readable.
4. Verify failure behavior: if you intentionally create an obvious contradiction such as a mismatched snapshot active stream or package name, the check should return `STATUS: FAIL` and indicate reconciliation is required.
5. Verify failure behavior: if the implementation feels like a generalized markdown validator rather than a smoke/contract check over core state, the package exceeded scope.

VERIFICATION NOTES

- Actually tested: live preflight via `npm run check:state-preflight`, live postflight via `npm run check:state-postflight`, the narrow fixture test via `npm run test:state-integrity-checks`, and changed-surface inspection via `git status --short`.
- Observed outcome: both live commands returned `STATUS: PASS` on coherent repo state, and the fixture test passed while also exercising an obvious contradiction case that correctly fails.
- Important edge cases validated: a stale snapshot package caused preflight failure until the snapshot was refreshed, and a conflicting snapshot active stream is now detected as a reconciliation-required failure in the fixture test.

NEXT SUGGESTED PACKAGE

- `expand_integrity_checks_from_core_state_to_stream_local_state` — the next narrow package that extends the same smoke/contract model from the four global live-state artifacts to the paused/active stream-local state surfaces without yet scanning broader reference docs.