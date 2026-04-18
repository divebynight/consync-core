TYPE: PROCESS
PACKAGE: audit_package_loop_sync_state

GOAL

Audit the current stream/package loop state and identify exactly what package work, if any, is out of sync between `package_plan.md`, `next-action.md`, `handoff.md`, and recent git history.

WHY

Recent package execution and commit history suggest that at least one package may have been completed, partially completed, committed under the wrong message, or skipped in visible git history. We need a narrow audit that establishes the current truth before promoting more packages or building more automation on top of the loop.

DO

1. Inspect the current stream control surfaces:
   - `.consync/state/package_plan.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

2. Inspect recent git history and compare it against recent package execution. Focus on:
   - recent package names in handoff / plan
   - recent commit subjects
   - whether each recent completed package has a corresponding commit
   - whether any commit appears to use the wrong subject for the underlying package

3. Produce a small reconciliation summary that identifies:
   - packages that are clearly completed and committed
   - packages that are clearly completed but not committed
   - packages that appear committed under an incorrect or ambiguous commit message
   - packages that appear planned but not yet executed
   - the current active package

4. Specifically check whether the `add_handoff_contract_checker` package:
   - was completed
   - was committed
   - was folded into another commit
   - or was skipped

5. Do not change behavior or add automation in this package. This is a state-reconciliation audit only.

6. If a repair action is needed, recommend the smallest next repair package rather than performing it here.

CONSTRAINTS

- Do not rewrite plan docs beyond minimal factual corrections if absolutely necessary.
- Do not change package ordering unless the audit proves the plan is wrong.
- Do not commit anything in this package.
- Keep the output factual and reconciliation-focused.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- CURRENT PACKAGE LOOP STATE
- RECENT PACKAGE ↔ COMMIT RECONCILIATION
- OUT-OF-SYNC FINDINGS
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- inspect recent git history
- inspect package plan / next-action / handoff
- confirm whether recent completed packages map cleanly to recent commits
- explicitly resolve the status of `add_handoff_contract_checker`