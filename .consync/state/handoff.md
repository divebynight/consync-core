TYPE: PROCESS
PACKAGE: define_artifact_role_labels_for_state_control_governance_reference_and_history

STATUS

PASS

SUMMARY

Defined a compact artifact-role model so Consync can reason about operational files by role instead of treating markdown-like files as one undifferentiated class.

The new model introduces five explicit roles: `state`, `control`, `governance`, `reference`, and `history`. It explains purpose, examples, canonical weight, change frequency, validation weight, and typical ownership for each role; identifies the process silo as the highest-governance zone; defines validation tiers by role; and adds cross-role rules so `reference` and `history` do not override live truth while `governance` defines interpretation. Supporting changes stayed minimal: one runbook pointer, one doc-integrity pointer, and a snapshot refresh.

FILES CREATED

- `.consync/docs/artifact-role-model.md` — defines the five core artifact roles, the highest-governance process silo, validation tiers by role, cross-role expectations, and a practical mapping of current Consync artifacts by role.

FILES MODIFIED

- `.consync/docs/runbook.md` — adds one small pointer to the artifact-role model in the deeper-docs list.
- `.consync/docs/doc-integrity-layer.md` — adds one small pointer to the artifact-role model so the governance/validation model and role model stay linked without duplication.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current artifact-role package and current definition-focused process phase accurately.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && sed -n '1,340p' .consync/docs/artifact-role-model.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '120,180p' .consync/docs/runbook.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '220,300p' .consync/docs/doc-integrity-layer.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/state/snapshot.md`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

VERIFICATION

- Read `.consync/docs/artifact-role-model.md` end to end and confirmed the five roles are distinct, practical, and small enough to use.
- Confirmed the doc clearly identifies the process silo as the highest-governance zone and explicitly states that process/state/governance surfaces deserve stronger validation than ordinary feature work.
- Confirmed the validation-tier section makes it clear that not every role or stream receives the same level of checking.
- Confirmed the role model states that artifact role matters more than file format and that markdown alone is not an operational classifier.
- Read the updated pointer sections in `.consync/docs/runbook.md` and `.consync/docs/doc-integrity-layer.md` and confirmed both edits stayed minimal and accurate.
- Read `.consync/state/snapshot.md` and confirmed it now reflects the current artifact-role package instead of the previous stream-local integrity-check package.
- Ran `git status --short` and confirmed the package stayed narrow: one new role-model doc, two tiny governance pointers, the snapshot refresh, and the live handoff file. The mounted `next-action.md` is also present in the worktree because it carries the current package.

MANUAL VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,340p' .consync/docs/artifact-role-model.md`.
2. Confirm success behavior: the doc clearly defines `state`, `control`, `governance`, `reference`, and `history` as distinct operational roles with useful examples and validation weight.
3. Confirm success behavior: the `Highest-Governance Zone` section clearly identifies the process silo and explains why it should carry stronger validation expectations than ordinary feature work.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/state/snapshot.md`.
5. Confirm success behavior: the snapshot names `define_artifact_role_labels_for_state_control_governance_reference_and_history` as the current package and describes the current role-model focus accurately.
6. Failure case: if the role model treats all markdown-like files as equivalent despite the new roles, treat the package as incomplete.
7. Failure case: if the doc implies every feature package should trigger the same heavy validation as process/governance changes, treat the role model as too blunt.

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the changed surface is limited to `.consync/docs/artifact-role-model.md`, the two tiny governance pointers, the snapshot refresh, and the live handoff. The mounted `next-action.md` may also appear as part of the live loop.
2. Open `.consync/docs/artifact-role-model.md` and verify success behavior: a new assistant could use it to distinguish which artifacts define live truth, which drive action, which govern interpretation, which explain, and which preserve history.
3. Open `.consync/docs/runbook.md` and `.consync/docs/doc-integrity-layer.md` and verify success behavior: the new pointers improve discoverability without duplicating the role-model doc.
4. Verify failure behavior: if `reference` or `history` appears able to override live `state` artifacts in the role model, the cross-role expectations are not strong enough.
5. Verify failure behavior: if the model feels like a taxonomy framework rather than a compact operational aid, the package exceeded scope.

VERIFICATION NOTES

- Actually tested: end-to-end reading of the new role-model doc, focused reads of the runbook and doc-integrity pointer additions, focused read of the refreshed snapshot, and `git status --short` for changed-surface scope.
- Observed outcome: the role model stays compact, the five roles are distinct in practice, the process silo is clearly treated as the highest-governance zone, and the supporting pointer edits remained minimal.
- Important edge cases validated: the doc explicitly states that artifact role matters more than file format, that markdown alone is not a meaningful operational classifier, and that `reference` and `history` must not override live truth.

NEXT SUGGESTED PACKAGE

- `scope_integrity_check_triggers_by_artifact_role_and_stream` — the next narrow package that defines when light versus heavy integrity checks should run based on artifact role, stream type, and whether process/governance surfaces were touched.