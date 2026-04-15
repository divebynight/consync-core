TYPE: PROCESS
PACKAGE: define_repair_entry_and_return_checklist

GOAL:

Define the smallest operator checklist for entering a repair package and returning to the blocked planned package safely.

This package should turn the current repair rules into a concise operator procedure for when repair interrupts the planned sequence and how the sequence resumes afterward.

CONTEXT:

- `.consync/state/decisions.md` now defines repair interruption at a rule level, validated resume-state examples, and a minimal verification contract.
- `.consync/state/package_plan.md` now records manual advancement, resume-state determination, worked state examples, and verification expectations.
- The remaining gap is a small operator checklist for entering repair and returning to the blocked planned package without ambiguity.
- The checklist must stay grounded in repo files and repo status, not chat memory.

REQUIREMENTS:

1. Preserve the single-package loop as the core execution unit.
2. Do not implement a runner, scheduler, daemon, or queue.
3. Do not modify runtime/product code.
4. Define repair entry and return in terms of repo files and repo status, not chat memory.
5. Make the operator steps and go/no-go conditions explicit.
6. Keep all changes in process/state docs only.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Define the smallest repair-entry and return checklist.
   At minimum, specify:
   - when a repair package is required
   - how the operator records repair entry in `package_plan.md`
   - how the blocked planned package is identified
   - what must be true before repair can close `PASS`
   - how the operator confirms the repo has returned to `CLEAN`
   - how and when the sequence returns to the blocked planned package
   - when the operator must stop instead of returning to planned work

3. Keep the model grounded in the current artifacts:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - repo status plus resume-state classification before return

4. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/package_plan.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm the repair checklist still treats one package as the atomic execution unit.
3. Confirm the updated docs define a compact repair-entry and return checklist.
4. Confirm the checklist uses repo files and repo status rather than conversation memory.
5. Confirm the checklist makes it clear when repair may return to the blocked planned package and when the operator must stop.
6. Confirm the checklist remains a small operator aid rather than automation design or workflow-engine overbuild.
7. Confirm no runtime/product code changed.
8. Failure case: if the repair checklist still depends on conversation memory to decide where to return, the package is incomplete.
9. Failure case: if the checklist allows return to planned work before the repo is back to `CLEAN`, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs define a minimal repair-entry and return checklist clearly enough to apply it from docs alone.
- the checklist fits the existing manual advancement, resume-state, and verification rules without widening scope.
- no runtime/product code changed.

FAIL CRITERIA:

- repair entry and return remain ambiguous or informal
- return rules are unclear or bypassable
- the checklist introduces unnecessary complexity
- unrelated files change

STATE UPDATES:

- `decisions.md` -> refine the repair entry and return rules
- `snapshot.md` -> reflect that repair entry and return is now standardized and note the next gap
- `next-action.md` -> point to the next narrow process step after repair entry/return
- `handoff.md` -> record the completed result of this PROCESS package
- `package_plan.md` -> update the plan cursor and next planned package for consistency

NOTES:

- Keep this small and strict.
- This is not about adding workflow machinery; it is about making repair handling reliable.
- Prefer clarity and repeatability over completeness.