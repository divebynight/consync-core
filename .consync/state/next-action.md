TYPE: PROCESS
PACKAGE: define_minimal_sequential_multi_package_protocol

GOAL:

Define the smallest durable protocol for running more than one package in sequence while keeping the single-package loop, live state files, and reconcile gate intact.

This remains a process-only design step. Do not implement automation.

CONTEXT:

- `.consync/state/decisions.md` now separates live state from durable history.
- `next-action.md` is a live execution slot and executed package instructions must be archived before replacement.
- `handoff.md` is the live result contract for the last completed package.
- Resume state must be reconciled to `CLEAN` before advancing.
- The next gap is the exact sequence protocol for package 1 -> package 2 -> stop conditions.

REQUIREMENTS:

1. Keep this as a PROCESS package only.
2. Do not change Electron, session, preload, IPC, renderer, or core runtime code.
3. Define the minimal sequential multi-package protocol using the current state files only.
4. Preserve the single-package loop as the atomic unit.
5. Make pause and stop rules explicit for normal progress, `FAIL`, and required human verification.
6. Keep the protocol narrow enough to verify manually.
7. Update state files at the end.

TASK:

1. Read `.consync/state/decisions.md`, `.consync/state/snapshot.md`, `.consync/state/next-action.md`, and `.consync/state/handoff.md`.
2. Add the smallest durable protocol description needed to explain:
   - how a sequence starts
   - what state is written after each package
   - when the sequence must stop
   - how the operator decides whether to continue to the next package
3. Keep the protocol procedural, not automated.
4. Make sure it composes with the live-slot, history, and reconcile rules.
5. Update `.consync/state/decisions.md`, `.consync/state/snapshot.md`, `.consync/state/handoff.md`, and `.consync/state/next-action.md` at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/snapshot.md`
- `.consync/state/handoff.md`
- `.consync/state/next-action.md`

OPTIONAL FILES TO CREATE (only if genuinely useful and kept minimal):

- `.consync/state/history/README.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify`.
2. Confirm the updated docs define how a multi-package sequence starts and pauses.
3. Confirm the protocol still requires `CLEAN` before advancing and stops on `FAIL` or required human verification.
4. Confirm the protocol still treats one package as the atomic execution unit.
5. Confirm no product/runtime code changed.
6. Failure case: if the protocol implies uninterrupted automation, the package is incomplete.
7. Failure case: if the protocol bypasses package-level `handoff.md` or `snapshot.md` updates, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- process/state docs define a compact sequential multi-package protocol on top of the reconciled baseline.
- the protocol preserves package-level stop conditions and manual gates.
- no runtime/product code changed.

FAIL CRITERIA:

- the package changes app/runtime behavior
- the sequential protocol bypasses the single-package loop
- the current state is still ambiguous about when to continue or stop
- the next package after this one is unclear

STATE UPDATES:

- `snapshot.md` -> reflect the new sequential protocol and current focus after the package closes
- `next-action.md` -> point to the next narrow package after the sequential protocol is defined
- `handoff.md` -> record the completed result of this PROCESS package
- `decisions.md` -> add the durable minimal sequential multi-package protocol

NOTES:

- Keep this procedural and minimal.
- Prefer a small, explicit operator protocol over a generalized workflow design.
- Build directly on the new live-vs-history and reconcile rules rather than redefining them.