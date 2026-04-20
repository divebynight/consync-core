TYPE: PROCESS
PACKAGE: apply_integrity_trigger_model_to_live_loop_commands_and_closeout

INTEGRITY TRIGGER APPLIED

- level: `heavy`
- reason: this package changes live-loop governance guidance, state contracts, and the portable package template that future operators will follow
- required checks used: `npm run check:state-preflight` before closeout drafting and `npm run check:state-postflight` before accepting the handoff
- extra review applied: confirmed the updated loop guidance keeps ordinary feature work fast, keeps `process` packages from becoming automatically `heavy`, and keeps the process silo as the highest-governance zone

STATUS

PASS

SUMMARY

Applied the integrity trigger model to the live loop so the mounted package itself now shows the trigger level, the required preflight and postflight checks, and any extra review expectations.

The smallest practical integration points were the live `next-action.md`, the runbook, the loop-contract docs, and the portable `next-action` template. The mounted package now carries an operator-facing `INTEGRITY TRIGGER` section, the runbook explains exactly what `light`, `elevated`, and `heavy` require in practice, the contracts require trigger-guided preflight and postflight expectations, and the active `process` stream state was reconciled so the mounted package and stream-local state tell one coherent story.

FILES CREATED

- none

FILES MODIFIED

- `.consync/state/next-action.md` — adds an operator-facing `INTEGRITY TRIGGER` section for the mounted package with the trigger level, required checks, and extra review expectations.
- `.consync/docs/runbook.md` — adds a compact trigger-level operating section so an operator can tell what `light`, `elevated`, and `heavy` require without opening deeper process docs.
- `.consync/docs/next-action-handoff-automation-contract.md` — requires future packages to expose trigger level, preflight/postflight checks, and trigger-guided closeout expectations.
- `.consync/docs/state-contracts-and-integrity-checks.md` — updates the `next-action.md`, preflight, and postflight contracts so trigger guidance is part of valid live-loop state.
- `.consync/templates/portable/.consync/state/next-action.md` — adds a default `light` trigger section so future package templates naturally expose the required checks.
- `.consync/state/snapshot.md` — refreshes the global snapshot so it names the current trigger-integration package and the next likely stream-switch accurately.
- `.consync/streams/process/state/snapshot.md` — updates the active process stream snapshot so it describes the current trigger-integration phase instead of an older stream-local integrity package.
- `.consync/streams/process/state/next_action.md` — reconciles the active process stream’s local package pointer with the mounted global package.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

VERIFICATION

- Read the updated `next-action.md` and confirmed the trigger level is visible in the live package itself with explicit preflight, postflight, and extra-review guidance.
- Read the updated runbook and confirmed an operator can tell what to run for `light`, `elevated`, and `heavy` packages without reconstructing the model from multiple deeper docs.
- Read the updated automation and state-contract docs and confirmed trigger guidance is now part of the live-loop contract rather than only a deeper policy doc.
- Ran `npm run check:state-preflight`, found snapshot and process-stream local-package drift, reconciled those state artifacts, and reran `npm run check:state-preflight` to a passing result.
- Ran `npm run check:state-postflight` after writing this handoff and confirmed the completed package, handoff, and reconciled state artifacts still agree.
- Ran `git status --short` and confirmed the package stayed within the expected changed surface: the live loop docs, state reconciliations, and the portable `next-action` template.

COMMANDS TO RUN

- `npm run check:state-preflight`
- `npm run check:state-postflight`
- `git status --short`

HUMAN VERIFICATION

1. Run `npm run check:state-preflight` from the repo root.
2. Confirm success behavior: it reports `STATUS: PASS`, the active package `apply_integrity_trigger_model_to_live_loop_commands_and_closeout`, and a safe action to execute the mounted package.
3. Open `.consync/state/next-action.md` and confirm success behavior: the `INTEGRITY TRIGGER` section is visible near the top and explicitly lists the trigger level, preflight check, postflight check, and extra review expectations.
4. Open `.consync/docs/runbook.md` and confirm success behavior: the `Trigger Level Use` section explains `light`, `elevated`, and `heavy` in one place without requiring multiple deeper docs.
5. Run `npm run check:state-postflight` after reading this handoff.
6. Confirm success behavior: postflight reports `STATUS: PASS` and no live-state contradiction.
7. Failure case: if `next-action.md` has no trigger section or the runbook makes ordinary feature work feel heavy by default, treat the package as incomplete.
8. Failure case: if preflight or postflight reports snapshot or stream-local package mismatch, reconcile state before accepting closeout.

VERIFICATION NOTES

- Actually tested: focused reads of the updated live-loop surfaces and contract docs, `npm run check:state-preflight` before and after reconciling the drifted snapshot and process-stream local state, `npm run check:state-postflight` after writing the handoff, and `git status --short` on the final changed surface.
- Observed outcome: the first preflight run failed because the global snapshot and the active process stream’s local package pointer still named older packages; after reconciling those state artifacts, preflight passed, postflight passed, and the final changed surface stayed limited to the live-loop docs, reconciled state files, and portable template.
- Important edge cases validated: the live package now exposes the trigger level directly, ordinary feature work remains explicitly `light` in the runbook and template, and `process` work is not described as automatically `heavy`.

NEXT SUGGESTED PACKAGE

- `resume_electron_ui_stream_with_integrity_aware_loop` — the stream-switch package that returns the live loop to `electron_ui` while preserving the new role-aware trigger model so ordinary UI work resumes under `light` validation by default.