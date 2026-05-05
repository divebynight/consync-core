TYPE: PROCESS
PACKAGE: define_minimal_sequential_multi_package_protocol

GOAL:

Define the smallest safe sequential multi-package protocol that can run multiple normal Consync packages in order without replacing the existing single-package loop.

This package should turn the already-recorded constraints into a compact operational model for:
- starting a sequence,
- determining whether the next package is eligible,
- pausing safely,
- handling `FAIL`,
- handling required human verification,
- and returning from repair.

This remains a protocol/design package only. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` already records:
  - the single-package loop as the atomic unit,
  - live-vs-history rules,
  - archive requirements,
  - reconcile-before-advance,
  - and dirty-state classifications.
- `.consync/state/next-action.md` is now a live execution slot, not the durable historical record.
- `.consync/state/handoff.md` is the live result contract for the most recently completed package.
- `.consync/state/history/` now preserves executed package instructions outside the live slot.
- The next step is to define the smallest sequential protocol that can later be driven by docs first and MCP transport later.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Keep the protocol small, procedural, and resume-friendly.
4. Define sequencing in terms of existing docs, not chat memory.
5. Make stop conditions and gating explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Add a minimal sequential protocol to the active process docs.
   This protocol should define:
   - what a sequence is
   - how a sequence starts
   - what inputs are required to choose the next package
   - when the next package is eligible
   - when the sequence must pause
   - how `FAIL` stops the sequence
   - how required human verification blocks advancement
   - how repair packages interrupt and return to the planned flow
   - the default maximum number of packages to run before pausing

3. Keep the model grounded in the current artifacts.
   The protocol should rely primarily on:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - reconcile/resume classification before advancement

4. Define a small eligibility/advance model.
   At minimum, the docs should make it clear that advancement requires:
   - reconciled repo state (`CLEAN`)
   - previous package closed as `PASS`
   - required human verification completed
   - no unresolved blocker from repair or failure
   - dependencies/gates satisfied in `package_plan.md`

5. Define a small pause model.
   At minimum, the docs should make it clear that the sequence pauses when:
   - a package ends `FAIL`
   - required human verification is incomplete
   - repo state is not reconciled
   - a repair package is required
   - the sequence reaches the default package-count limit
   - a declared stop gate is reached

6. Recommend a default run window.
   Prefer a conservative default such as 3 packages maximum before pause, unless the docs strongly justify another number.

7. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

OPTIONAL FILES TO CREATE (only if genuinely useful and kept minimal):

- `.consync/state/package_plan.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify`.
2. Open `.consync/state/decisions.md` and confirm the protocol still treats one package as the atomic execution unit.
3. Confirm the protocol defines sequence start, advance, pause, failure, and repair in a compact procedural way.
4. Confirm the protocol says advancement only happens from reconciled `CLEAN` state.
5. Confirm the protocol explicitly blocks advancement on `FAIL` or incomplete required human verification.
6. Confirm the protocol defines a conservative default package-count limit before pause.
7. Confirm no Electron, session, preload, IPC, renderer, or runtime code changed.
8. Failure case: if the protocol reads like workflow-engine overdesign instead of a small operating rule set, the package is incomplete.
9. Failure case: if the protocol still depends on conversation memory to determine what happens next, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs define a minimal sequential multi-package protocol clearly enough to resume from docs alone.
- advancement, pause, failure, repair, and human verification gates are explicit.
- the model remains small and consistent with the existing single-package loop.
- no runtime/product code changed.

FAIL CRITERIA:

- the package introduces automation implementation
- the protocol is vague about stop/advance conditions
- the protocol bypasses reconcile-before-advance
- the protocol relies on chat memory or informal interpretation
- unrelated runtime/product files change

STATE UPDATES:

- `decisions.md` -> add the minimal sequential multi-package protocol
- `snapshot.md` -> reflect that the sequential protocol is now defined and note the next likely step
- `next-action.md` -> point to the next narrow step after protocol definition
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this procedural, not architectural.
- Prefer a boring stop/go protocol over a generalized orchestration framework.
- The goal is not to automate yet; it is to make multi-package sequencing safe, legible, and resumable from docs alone.