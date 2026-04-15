TYPE: PROCESS
PACKAGE: define_manual_sequence_advancement_procedure

GOAL:

Define the smallest manual procedure for advancing a sequence from one package to the next using only the current state files.

This package should turn the protocol and package plan format into a concise operator procedure for selecting the next package, confirming eligibility, and advancing or pausing safely.

This remains a protocol/design package only. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` now defines the minimal sequence protocol and the required package-plan fields.
- `.consync/state/package_plan.md` now defines the minimal durable orchestration format.
- The remaining gap is the exact operator procedure for moving from completed package A to eligible package B without ambiguity.
- The procedure must remain grounded in the current files and stop gates.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Keep the procedure small, explicit, and resume-friendly.
4. Define advancement in terms of repo files, not chat memory.
5. Make go/no-go checks and operator expectations explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Define the smallest manual advancement procedure for a planned sequence.
   At minimum, specify:
   - how the operator determines the current package is closed
   - how the operator checks whether the next package is eligible
   - how the operator reads `package_plan.md`, `handoff.md`, and resume state together
   - when the operator must pause instead of advancing
   - how the operator prepares the next `next-action.md`
   - how the operator records advancement in `package_plan.md`
   - what happens when a repair package interrupts the plan

3. Keep the model grounded in the current artifacts:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - reconcile/resume classification before advancement

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
2. Open `.consync/state/decisions.md` and confirm the procedure still treats one package as the atomic unit.
3. Confirm the updated docs define a compact manual go/no-go procedure for selecting and advancing the next package.
4. Confirm the procedure still depends on reconciled `CLEAN` state, `PASS`, completed required human verification, and satisfied package gates before advancement.
5. Confirm the procedure defines when to pause instead of advancing, including repair interruption and declared stop gates.
6. Confirm the procedure does not turn into automation design or workflow-engine overbuild.
7. Confirm no Electron, session, preload, IPC, renderer, or runtime code changed.
8. Failure case: if the procedure still depends on conversation memory to determine what happens next, the package is incomplete.
9. Failure case: if the procedure implies the operator may skip reconcile or verification gates, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs define a minimal manual advancement procedure clearly enough to resume from docs alone.
- the procedure uses the package plan format and supports advancement, pause, failure, repair, and human verification gates already recorded in decisions.
- the model remains small and consistent with the existing single-package loop.
- no runtime/product code changed.

FAIL CRITERIA:

- the package introduces automation implementation
- the procedure is vague about go/no-go checks or update steps
- the protocol bypasses reconcile-before-advance
- the protocol relies on chat memory or informal interpretation
- unrelated runtime/product files change

STATE UPDATES:

- `decisions.md` -> refine any durable rules needed for the manual advancement procedure
- `package_plan.md` -> update the plan cursor and next planned package if needed
- `snapshot.md` -> reflect that the manual advancement procedure is now the next likely step
- `next-action.md` -> point to the next narrow step after protocol definition
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this procedural, not architectural.
- Prefer a boring operator checklist over a generalized orchestration framework.
- The goal is not to automate yet; it is to make multi-package sequencing safe, legible, and resumable from docs alone.