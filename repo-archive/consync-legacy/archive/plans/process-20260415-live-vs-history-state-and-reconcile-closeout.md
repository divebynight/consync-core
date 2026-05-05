TYPE: PROCESS
PACKAGE: formalize_live_vs_history_state_and_reconcile_closeout

GOAL:

Strengthen the Consync state protocol so interrupted or partially committed package transitions are easy to understand and resume safely.

This package should:
1. define `next_action.md` as a live execution slot rather than a historical record,
2. introduce an explicit archive/history rule for executed package artifacts,
3. add a resume/reconcile gate before advancing to a new package, and
4. reconcile the current state files so the repo can be committed cleanly as the new baseline.

CONTEXT:

- The current process updates `handoff.md`, `snapshot.md`, and `next_action.md` as part of closeout.
- In practice, this can leave the repo in a confusing state when files are staged/unstaged or a commit is interrupted.
- A recent real example showed that `next_action.md` had already been advanced, which made it harder to tell what had just run versus what was merely prepared next.
- We want to preserve the current copy/paste loop while making it safer and more MCP-ready.
- The agreed direction is:
  - `package_plan.md` will be long-lived orchestration truth.
  - `next_action.md` should be treated as the live execution slot.
  - durable history should not depend on the current contents of `next_action.md`.
  - repo state must be reconciled before advancing.

REQUIREMENTS:

1. Keep this as a PROCESS package only.
2. Do not change Electron, session, preload, IPC, renderer, or core runtime code.
3. Update the state/process docs so the new rules are explicit and durable.
4. Make the current repo state legible and internally consistent.
5. Leave the repo in a clean closeout state that is ready to commit.
6. Prepare the system so the next package can begin the actual multi-package iteration design from a stable baseline.

TASK:

1. Read these files first:
   - `.consync/state/decisions.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

2. Update the process/state docs to capture these rules clearly:
   - `next_action.md` is the live execution slot, not the historical record of completed work.
   - before `next_action.md` is replaced, the executed package instruction must be preserved in history or otherwise durably represented so prior execution state is reconstructible without chat memory.
   - `handoff.md` is the live result contract for the most recently completed package.
   - package closeout must include a repo reconciliation step before advancing.
   - the system must classify resume state before starting a new package using a small set such as:
     - `CLEAN`
     - `DIRTY_CLOSEOUT_PENDING`
     - `DIRTY_NEXT_PACKAGE_STARTED`
     - `DIRTY_UNKNOWN`
   - do not advance automatically unless the state is reconciled.
   - preserve the current atomic single-package loop while making room for later multi-package orchestration.

3. Add or update active docs as needed so this is easy to resume later.
   Preferred scope:
   - `.consync/state/decisions.md` for durable rules
   - `.consync/state/snapshot.md` for current reality/focus
   - `.consync/state/handoff.md` for package result
   - `.consync/state/next-action.md` for the next narrow package after this one

4. If a small history/archive convention should be declared now, define it at the process level without overengineering implementation details.
   Example: state history lives under `.consync/state/history/` and executed package artifacts should be preserved there during closeout.
   Do not build automation for this yet; just make the rule and structure clear.

5. Reconcile the current docs so they reflect one coherent baseline:
   - this package closes the live-vs-history ambiguity
   - the next package should return to defining the minimal sequential multi-package protocol
   - the repo should be understandable even if work stops before the next package starts

6. Update state files at the end.

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
2. Open `.consync/state/decisions.md` and confirm it now distinguishes live state from historical state.
3. Confirm the decisions explicitly define `next_action.md` as a live execution slot.
4. Confirm the decisions add a required reconcile/resume gate before advancing to a new package.
5. Confirm the decisions define the dirty-state classifications in a simple, practical way.
6. Confirm the updated docs make it clear how to tell:
   - what just finished,
   - what is prepared next,
   - and whether the repo is actually ready to advance.
7. Confirm no product/runtime code changed.
8. Failure case: if the updated rules still allow `next_action.md` to be the only record of prior execution, the package is incomplete.
9. Failure case: if the docs still make it easy to confuse closeout state with next-package preparation, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- process/state docs clearly separate live execution state from historical record.
- repo reconciliation is now part of the documented closeout/advance protocol.
- the next package is still the minimal sequential multi-package protocol step.
- no runtime/product code changed.

FAIL CRITERIA:

- the package changes app/runtime behavior
- the process rules remain ambiguous about overwritten `next_action.md`
- the current state is still hard to resume after interruption
- the next package after this one is unclear

STATE UPDATES:

- `snapshot.md` -> reflect that the process now distinguishes live execution state from historical record and requires reconciliation before advance
- `next-action.md` -> point to the next PROCESS package for defining the minimal sequential multi-package protocol from this new baseline
- `handoff.md` -> record the completed result of this PROCESS package
- `decisions.md` -> add the durable live-vs-history and reconcile/resume rules

NOTES:

- Keep this procedural and minimal.
- Prefer a small, explicit protocol over a generalized workflow design.
- The purpose of this package is to make interruption, partial commit, and resume behavior legible before expanding into multi-package sequencing.