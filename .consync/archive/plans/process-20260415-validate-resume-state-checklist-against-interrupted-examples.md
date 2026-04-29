TYPE: PROCESS
PACKAGE: validate_resume_state_checklist_against_interrupted_examples

GOAL:

Validate the resume-state determination checklist against a few concrete interrupted repo-state examples so the state labels stay practical.

This package should turn the new checklist into a small set of worked examples that show how each state label is chosen from repo files and repo status.

This remains a protocol/design package only. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` now defines the dirty-state classifications and the resume-state checklist rules.
- `.consync/state/package_plan.md` now records both the manual advancement checklist and the resume-state determination checklist.
- The remaining gap is making the checklist practical enough to apply consistently when closeout is interrupted.
- The examples must stay grounded in repo files and repo status, not chat memory.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Keep the example set small, explicit, and resume-friendly.
4. Define each example in terms of repo files and repo status, not chat memory.
5. Make the operator reasoning from signals to state label explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Add a small validation/example section for the resume-state determination checklist.
   At minimum, specify:
   - one concrete example for `CLEAN`
   - one concrete example for `DIRTY_CLOSEOUT_PENDING`
   - one concrete example for `DIRTY_NEXT_PACKAGE_STARTED`
   - one concrete example for `DIRTY_UNKNOWN`
   - which signals lead to each label
   - when the operator must stop and repair instead of advancing
   - how the labeled result feeds the manual advancement procedure

3. Keep the model grounded in the current artifacts:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - repo status plus reconcile/resume classification before advancement

4. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify`.
2. Open `.consync/state/decisions.md` and confirm the procedure still treats one package as the atomic execution unit.
3. Confirm the updated docs define a small set of concrete examples for `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`.
4. Confirm each example uses repo files and repo status rather than conversation memory.
5. Confirm the examples make it easier to tell when the operator must stop and repair instead of advancing.
6. Confirm the example set remains a small operator aid rather than automation design or workflow-engine overbuild.
7. Confirm no Electron, session, preload, IPC, renderer, or runtime code changed.
8. Failure case: if the examples still depend on conversation memory to classify repo state, the package is incomplete.
9. Failure case: if the examples leave dirty states ambiguous enough that advancement could happen from the wrong state, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs validate the resume-state determination checklist clearly enough to apply it from docs alone.
- the examples support the manual advancement procedure and keep dirty-state interpretation explicit.
- the model remains small and consistent with the existing single-package loop.
- no runtime/product code changed.

FAIL CRITERIA:

- the package introduces automation implementation
- the examples are vague about how a state label is chosen from signals
- the protocol bypasses reconcile-before-advance
- the protocol relies on chat memory or informal interpretation
- unrelated runtime/product files change

STATE UPDATES:

- `decisions.md` -> refine any durable rules needed for checklist validation examples
- `package_plan.md` -> update the plan cursor and next planned package if needed
- `snapshot.md` -> reflect that checklist validation examples are now the next likely step
- `next-action.md` -> point to the next narrow step after protocol definition
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this procedural, not architectural.
- Prefer boring worked examples over a generalized orchestration framework.
- The goal is not to automate yet; it is to make multi-package sequencing safe, legible, and resumable from docs alone.