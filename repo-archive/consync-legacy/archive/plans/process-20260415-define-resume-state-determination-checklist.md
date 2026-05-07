TYPE: PROCESS
PACKAGE: define_resume_state_determination_checklist

GOAL:

Define the smallest operator checklist for determining resume state from repo files alone before a sequence advances.

This package should turn the existing dirty-state classifications into a compact practical checklist for telling whether the repo is `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, or `DIRTY_UNKNOWN`.

This remains a protocol/design package only. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` now defines the dirty-state classifications and the manual advancement procedure.
- `.consync/state/package_plan.md` now records the next planned package and the manual advancement checklist.
- The remaining gap is a compact operator checklist for classifying current repo state before any advancement decision.
- The checklist must stay grounded in repo files and current git state, not chat memory.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Keep the checklist small, explicit, and resume-friendly.
4. Define classification in terms of repo files and repo status, not chat memory.
5. Make the operator checks and resulting state labels explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Define the smallest manual resume-state determination checklist.
   At minimum, specify:
   - what files and signals the operator reads first
   - how to determine `CLEAN`
   - how to determine `DIRTY_CLOSEOUT_PENDING`
   - how to determine `DIRTY_NEXT_PACKAGE_STARTED`
   - how to determine `DIRTY_UNKNOWN`
   - when the operator must stop and repair instead of advancing
   - how the result is used by the manual advancement procedure

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
3. Confirm the updated docs define a compact manual checklist for classifying `CLEAN`, `DIRTY_CLOSEOUT_PENDING`, `DIRTY_NEXT_PACKAGE_STARTED`, and `DIRTY_UNKNOWN`.
4. Confirm the checklist uses repo files and repo status rather than conversation memory.
5. Confirm the checklist explicitly says when the operator must stop and repair instead of advancing.
6. Confirm the checklist remains a small operator aid rather than automation design or workflow-engine overbuild.
7. Confirm no Electron, session, preload, IPC, renderer, or runtime code changed.
8. Failure case: if the checklist still depends on conversation memory to classify repo state, the package is incomplete.
9. Failure case: if the checklist leaves dirty states ambiguous enough that advancement could happen from the wrong state, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs define a minimal resume-state determination checklist clearly enough to resume from docs alone.
- the checklist supports the manual advancement procedure and keeps dirty-state interpretation explicit.
- the model remains small and consistent with the existing single-package loop.
- no runtime/product code changed.

FAIL CRITERIA:

- the package introduces automation implementation
- the checklist is vague about how a state label is determined
- the protocol bypasses reconcile-before-advance
- the protocol relies on chat memory or informal interpretation
- unrelated runtime/product files change

STATE UPDATES:

- `decisions.md` -> refine any durable rules needed for the resume-state checklist
- `package_plan.md` -> update the plan cursor and next planned package if needed
- `snapshot.md` -> reflect that the resume-state checklist is now the next likely step
- `next-action.md` -> point to the next narrow step after protocol definition
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this procedural, not architectural.
- Prefer a boring state-classification checklist over a generalized orchestration framework.
- The goal is not to automate yet; it is to make multi-package sequencing safe, legible, and resumable from docs alone.