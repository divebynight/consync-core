TYPE: PROCESS
PACKAGE: scope_integrity_check_triggers_by_artifact_role_and_stream

STATUS

PASS

SUMMARY

Defined a compact integrity-trigger model so Consync can choose light, elevated, or heavy validation expectations based on artifact role, stream type, and package character.

The new trigger doc defines three distinct levels: `light`, `elevated`, and `heavy`. It explains what each level requires, when artifact roles should escalate a package, how `process` differs from `electron_ui` and other future streams, and why governance/process-silo changes deserve stronger validation than ordinary feature work. It also includes a compact decision table, explicit override rules, and minimal pointers from existing governance docs. Supporting changes stayed small: one runbook pointer, one doc-integrity pointer, and a snapshot refresh.

FILES CREATED

- `.consync/docs/integrity-trigger-model.md` — defines the `light`, `elevated`, and `heavy` trigger levels; maps them to artifact role, stream type, and package character; adds a compact decision table; and defines override behavior for risky cross-boundary packages.

FILES MODIFIED

- `.consync/docs/runbook.md` — adds one small pointer to the trigger model in the deeper-docs list.
- `.consync/docs/doc-integrity-layer.md` — adds one small pointer to the trigger model so the governed-surface model and trigger rules stay linked without duplication.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current trigger-model package and current definition-focused process phase accurately.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

VERIFICATION

- Read `.consync/docs/integrity-trigger-model.md` end to end and confirmed the three validation levels are distinct, easy to explain, and practical to apply.
- Confirmed the doc explicitly keeps ordinary UI or stream-local feature work at `light` by default.
- Confirmed the doc escalates packages that touch `state` or `control` artifacts to at least `elevated`.
- Confirmed the doc treats governance and process-silo changes as `heavy` by default without implying that every `process` stream package is automatically heavy.
- Read the updated pointer sections in `.consync/docs/runbook.md` and `.consync/docs/doc-integrity-layer.md` and confirmed both edits stayed minimal and accurate.
- Read `.consync/state/snapshot.md` and confirmed it now reflects the current trigger-model package instead of the prior artifact-role package.

MANUAL VERIFICATION

1. Open `.consync/docs/integrity-trigger-model.md` and read it end to end.
2. Confirm success behavior: the doc clearly distinguishes `light`, `elevated`, and `heavy` and explains what each level requires.
3. Confirm success behavior: ordinary UI or stream-local feature work remains `light` by default, while packages that touch `state` or `control` surfaces escalate to `elevated` and packages that touch governance/process-silo surfaces default to `heavy`.
4. Confirm success behavior: the stream-type section states that `process` packages are not automatically `heavy`, only more likely to escalate because of the surfaces they touch.
5. Open `.consync/state/snapshot.md` and confirm it names `scope_integrity_check_triggers_by_artifact_role_and_stream` as the current package and describes the trigger-model focus accurately.
6. Failure case: if the trigger model implies every package should run heavy validation, treat the package as too blunt.
7. Failure case: if a non-process stream touching governance/process surfaces does not clearly escalate, treat the package as incomplete.

HUMAN VERIFICATION

1. Open `.consync/docs/integrity-trigger-model.md` and read it end to end.
2. Confirm success behavior: the doc clearly distinguishes `light`, `elevated`, and `heavy` and shows when each should be used.
3. Confirm success behavior: ordinary UI or stream-local feature work remains `light` by default, while packages that touch `state` or `control` surfaces escalate to `elevated` and packages that touch governance/process-silo surfaces default to `heavy`.
4. Confirm success behavior: the stream-type section states that `process` packages are not automatically `heavy`, only more likely to escalate because of the surfaces they touch.
5. Open `.consync/state/snapshot.md` and confirm it names `scope_integrity_check_triggers_by_artifact_role_and_stream` as the current package and describes the trigger-model focus accurately.
6. Failure case: if the trigger model implies every package should run heavy validation, treat the package as too blunt.
7. Failure case: if a non-process stream touching governance/process surfaces does not clearly escalate, treat the package as incomplete.

NEXT SUGGESTED PACKAGE

- `apply_integrity_trigger_model_to_live_loop_commands_and_closeout` — the next narrow package that wires the defined trigger levels into practical loop operation so operators know which checks to run during ordinary feature work versus process/governance changes.