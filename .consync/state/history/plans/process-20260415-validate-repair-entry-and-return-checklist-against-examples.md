TYPE: PROCESS
PACKAGE: validate_repair_entry_and_return_checklist_against_examples

GOAL:

Validate the repair-entry and return checklist against a few concrete blocked-package examples so the return rules stay practical.

This package should turn the new repair checklist into a small set of worked examples showing when repair starts, when return is allowed, and when the operator must stop instead.

CONTEXT:

- `.consync/state/decisions.md` now defines repair entry and return rules at a checklist level.
- `.consync/state/package_plan.md` now records the repair-entry checklist alongside manual advancement, resume-state determination, and verification rules.
- The remaining gap is validating the repair checklist against explicit blocked-package scenarios.
- The examples must stay grounded in repo files and repo status, not chat memory.

REQUIREMENTS:

1. Keep this as a PROCESS package only.
2. Do not change runtime/product code.
3. Preserve the single-package loop as the core execution unit.
4. Define each example in terms of repo files and repo status, not chat memory.
5. Make the operator reasoning from signals to repair/return decision explicit.
6. Do not overbuild this into a general policy framework.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - `.consync/state/history/README.md`

2. Add a small validation/example section for the repair-entry and return checklist.
   At minimum, specify:
   - one concrete example where repair is required
   - one concrete example where return to the blocked package is allowed
   - one concrete example where the operator must stop instead of returning
   - which signals identify the blocked planned package
   - which signals show repair closed cleanly
   - how the result feeds the manual advancement procedure

3. Keep the model grounded in the current artifacts:
   - `package_plan.md` as orchestration truth
   - `handoff.md` as latest result
   - `next-action.md` as live runnable slot
   - `.consync/state/history/` as durable record
   - repo status plus resume-state classification before return

4. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm the repair checklist still treats one package as the atomic execution unit.
3. Confirm the updated docs define a small set of concrete examples for repair entry, successful return, and stop-before-return.
4. Confirm each example uses repo files and repo status rather than conversation memory.
5. Confirm the examples make it easier to tell when repair may return to the blocked planned package and when the operator must stop.
6. Confirm the example set remains a small operator aid rather than automation design or workflow-engine overbuild.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm only `.consync/state/` process docs are changed.
8. Failure case: if the examples still depend on conversation memory to decide where to return, the package is incomplete.
9. Failure case: if the examples allow return to planned work before the repo is back to `CLEAN`, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- active docs validate the repair-entry and return checklist clearly enough to apply it from docs alone.
- the examples fit the existing manual advancement, resume-state, verification, and human-gate rules without widening scope.
- no runtime/product code changed.

FAIL CRITERIA:

- repair entry and return remain ambiguous or informal
- return rules become more ambiguous
- the example set introduces unnecessary complexity
- the paused next action becomes unclear or lost
- unrelated files change

STATE UPDATES:

- `decisions.md` -> add repair-entry validation examples
- `package_plan.md` -> record the completed repair-entry checklist and the next planned validation step
- `snapshot.md` -> reflect that repair entry/return is defined and that validation examples are prepared next
- `next-action.md` -> after completion, point to the next narrow step after repair validation
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this refinement small.
- Prefer boring worked examples over a generalized orchestration framework.
- The goal is to make repair handling reliable without widening scope.