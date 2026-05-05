TYPE: PROCESS
PACKAGE: define_minimal_package_plan_format

GOAL:

Define the smallest durable `package_plan.md` format that makes the new sequential multi-package protocol concrete and easy to resume from repo files alone.

This package should turn the provisional orchestration file into a clear, minimal operating artifact for package sequencing.

This remains a protocol/design package only. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` now defines the minimal sequential multi-package protocol.
- `.consync/state/package_plan.md` now exists as a provisional orchestration file.
- The sequence protocol depends on `package_plan.md` as long-lived orchestration truth.
- The next gap is the exact minimal shape and update rules for that file.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Keep the file format small, explicit, and resume-friendly.
4. Define orchestration in terms of repo files, not chat memory.
5. Make update rules and operator expectations explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Define the smallest durable `package_plan.md` structure that is enough to drive the protocol already recorded in `decisions.md`.
   At minimum, specify:
   - sequence goal
   - current status
   - current cursor / next package pointer
   - default run window
   - per-package fields or checklist items
   - dependency / gate representation
   - pause or stop gate representation
   - how repair interruptions are recorded

3. Define minimal update rules for `package_plan.md`.
   At minimum, make it clear:
   - who updates it
   - when it must change
   - what must be updated after `PASS`
   - what must be updated after `FAIL`
   - what changes when a repair package interrupts the sequence

4. Keep the model grounded in the current artifacts:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - reconcile/resume classification before advancement

5. Update state files at the end.

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
2. Open `.consync/state/package_plan.md` and confirm the file format is minimal but sufficient to track ordered packages, gates, cursor, and repair interruptions.
3. Confirm the update rules make it clear how the file changes after `PASS`, `FAIL`, and repair.
4. Confirm the package plan format still depends on reconciled `CLEAN` state before advancement.
5. Confirm the package plan format does not turn into a workflow engine or backlog system.
7. Confirm no Electron, session, preload, IPC, renderer, or runtime code changed.
8. Failure case: if the file format reads like workflow-engine overdesign instead of a small operating artifact, the package is incomplete.
9. Failure case: if the format still depends on conversation memory to determine what happens next, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs define a minimal `package_plan.md` format clearly enough to resume from docs alone.
- the format supports advancement, pause, failure, repair, and human verification gates already recorded in decisions.
- the model remains small and consistent with the existing single-package loop.
- no runtime/product code changed.

FAIL CRITERIA:

- the package introduces automation implementation
- the package plan format is vague about update rules or current cursor
- the protocol bypasses reconcile-before-advance
- the protocol relies on chat memory or informal interpretation
- unrelated runtime/product files change

STATE UPDATES:

- `decisions.md` -> refine any durable rules needed for the package plan format
- `package_plan.md` -> define the minimal durable orchestration format
- `snapshot.md` -> reflect that the package plan format is now defined and note the next likely step
- `next-action.md` -> point to the next narrow step after protocol definition
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this procedural, not architectural.
- Prefer a boring operator file over a generalized orchestration framework.
- The goal is not to automate yet; it is to make multi-package sequencing safe, legible, and resumable from docs alone.