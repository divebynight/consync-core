TYPE: PROCESS
PACKAGE: expand_integrity_checks_from_core_state_to_stream_local_state

GOAL

Extend the existing lightweight integrity-check surface from the four global live-state artifacts into the active/paused stream-local state surfaces so the system can verify that stream-specific truth and global truth do not drift apart.

WHY

The current integrity checks now protect the global live loop well enough to answer the core smoke-level questions about active stream, active package, and open/closed state. The next risk surface is stream-local state.

With multiple streams, the system also depends on stream-local artifacts staying coherent:
- active streams should read as active locally
- paused streams should read as paused locally
- stream-local snapshots should preserve usable resume context
- stream-local next actions should not contradict the global owner model

This package should extend the same smoke/contract approach into stream-local state without expanding into broad repo-wide validation or reference-doc scanning.

SCOPE

Keep this package narrow and incremental.

Expected outcome:
- the integrity-check surface reads relevant stream-local state artifacts
- it verifies a small set of stream-local invariants
- it reports PASS/FAIL with concise operational output
- it detects obvious contradictions between global state and stream-local state
- it still avoids broader documentation scanning

Do not:
- validate all docs under `.consync/docs`
- introduce a full repo graph validator
- create a separate integrity agent yet
- add policy enforcement beyond the stream-local smoke/contract layer
- mix this with UI work

WORK INSTRUCTIONS

1. Inspect the existing integrity-check implementation and extend it in the smallest natural way.

2. Limit this package to stream-local state surfaces under:
   - `.consync/streams/*/stream.md`
   - `.consync/streams/*/state/next_action.md`
   - `.consync/streams/*/state/handoff.md`
   - `.consync/streams/*/state/snapshot.md`

3. Define and implement a small set of stream-local checks.

   At minimum, verify:

   - the globally active stream exists locally and does not read as paused
   - any globally paused stream exists locally and does read as paused
   - the active stream has a readable local next action or equivalent active-phase context
   - paused streams preserve readable local resume context rather than appearing abandoned
   - stream-local snapshot/package context does not obviously contradict stream role
   - the global next-action owner and the active stream’s local state do not obviously conflict

4. Keep the checks shallow and operational.
   This is still a smoke/contract layer, not deep semantic validation.

5. Update the command output minimally so the operator can understand:
   - whether stream-local integrity passed
   - which stream failed, if any
   - whether reconciliation is required

6. Add a narrow test surface that covers:
   - one passing case with coherent stream-local state
   - at least one obvious failure case involving active/paused contradiction or missing local resume state

7. If needed, update the existing contracts/integrity docs with a small note explaining that the integrity-check surface now includes stream-local state in addition to the four global live-state artifacts.

8. Keep naming explicit and boring.

CHECK MODEL

The expanded checks should remain equivalent to:
- smoke checks
- contract checks

They should not yet become full integration checks across the entire documentation corpus.

CONSTRAINTS

- keep the implementation small
- no broad markdown scanning
- no reference-doc validation
- no agent framework work yet
- do not require a new action-plan system
- avoid inventing new artifact categories unless strictly necessary

VERIFICATION

1. Run the updated preflight integrity check and confirm it returns PASS on coherent global + stream-local state.
2. Run the updated postflight integrity check and confirm it returns PASS on coherent global + stream-local state.
3. Run the narrow integrity test surface and confirm it covers at least one stream-local failure mode.
4. If practical, simulate an obvious contradiction such as:
   - active stream locally marked paused
   - paused stream missing local resume snapshot
   - stream-local next action contradicting global mounted ownership
5. Confirm the output remains concise and operational rather than verbose.

HANDOFF REQUIREMENTS

Write the handoff to the live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- VERIFICATION
- MANUAL VERIFICATION
- NEXT SUGGESTED PACKAGE

For `NEXT SUGGESTED PACKAGE`, recommend:

`define_artifact_role_labels_for_state_control_governance_reference_and_history`

and describe it as the next narrow package that formalizes artifact-role labeling so markdown files can be reasoned about by role instead of being treated as one undifferentiated file class.