TYPE: PROCESS
PACKAGE: reconcile_package_plan_after_loop_drift

GOAL

Repair the package-loop control surfaces after the sync audit by reconciling `package_plan.md` with the actual completed packages, recording the known commit-subject mismatch, and re-establishing a clean active cursor before any new normal package work proceeds.

WHY

The sync audit established that recent package execution continued past the recorded package-plan cursor and that the loop surfaces no longer agree about the active position in the sequence.

Specifically:
- `package_plan.md` is stale relative to recent executed and committed packages
- `add_handoff_contract_checker` was completed and committed, but under an incorrect or ambiguous commit subject
- the working-tree `next-action.md` advanced to the audit package while the rest of the loop state did not fully reconcile

Before building more automation or resuming normal feature work, the stream needs one factual repair package that restores a trustworthy control state.

DO

1. Read the audit handoff and recent control surfaces:
   - `.consync/state/package_plan.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

2. Reconcile `package_plan.md` so it reflects the actual completed package sequence established by the audit. Keep this factual and minimal:
   - mark the recently completed packages appropriately
   - update the active cursor / next package position to match the true current state
   - remove or replace stale `PAUSED_FAIL` / stale next-package indicators if they no longer reflect reality

3. Record the known commit-subject mismatch for commit `d96f1bd` in the appropriate process/history surface so the repo has a durable note that:
   - `add_handoff_contract_checker` was completed and committed
   - the commit subject does not accurately describe the package contents

4. Re-establish one clean active package position across the live loop surfaces so a human can tell, without ambiguity:
   - what was last completed
   - what is currently active
   - what comes next

5. Keep this package narrow and restorative:
   - do not add new automation
   - do not redesign the process model
   - do not rewrite history
   - do not rebase or amend old commits

6. If there is still ambiguity after reconciliation, stop and report it clearly rather than smoothing it over.

CONSTRAINTS

- No history rewriting
- No new helper scripts unless absolutely required for the repair
- Prefer minimal factual updates over process redesign
- Keep the repair understandable from the docs alone

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- RECONCILED LOOP STATE
- PACKAGE PLAN REPAIR
- COMMIT-SUBJECT MISMATCH RECORD
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- confirm `package_plan.md`, `next-action.md`, and `handoff.md` agree on the stream position after the repair
- confirm the `d96f1bd` subject mismatch is durably recorded somewhere appropriate
- confirm no git history was rewritten
- run `git status --short`