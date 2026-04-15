TYPE: PROCESS
PACKAGE: refine_verification_contract_with_optional_vs_required_human_gates

GOAL:

Refine the verification contract so manual verification instructions can exist without always blocking advancement.

This package should separate:
- how a human may verify a package,
- from whether a human gate is actually required before advancement.

The result should keep verification strict and automatable while reducing unnecessary pauses for low-risk packages.

CONTEXT:

- The minimal verification contract is now defined.
- In practice, the current model treats incomplete human verification as a blocking condition too often.
- We need a clearer distinction between:
  - human-verifiable packages,
  - and packages that actually require a blocking human gate.
- The current prepared next action for repair entry/return has not been run and should remain paused until this refinement is complete.
- This is a steering refinement to the current contract, not a rejection of the prior package.

REQUIREMENTS:

1. Keep this as a PROCESS package only.
2. Do not change runtime/product code.
3. Preserve the existing verification model structure:
   - automated verification
   - manual verification
   - closeout validation
   - advancement classification
4. Add a small, explicit way to declare whether human verification is:
   - `REQUIRED`
   - `OPTIONAL`
   - `NONE`
5. Ensure the result is easy for a human to follow now and easy to automate later.
6. Do not overbuild this into a general policy framework.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

2. Refine the verification contract so each package may declare a small human-gate mode.

   Add a durable rule such as:

   - `HUMAN_GATE: REQUIRED`
   - `HUMAN_GATE: OPTIONAL`
   - `HUMAN_GATE: NONE`

3. Define how the human-gate mode affects advancement classification.

   The docs should make clear:

   - if automated verification fails -> `FAILED_BLOCKED`
   - if results conflict -> `AMBIGUOUS_REVIEW_REQUIRED`
   - if automated verification passes and `HUMAN_GATE: REQUIRED` is incomplete -> `VERIFIED_AWAITING_HUMAN`
   - if automated verification passes and `HUMAN_GATE: OPTIONAL` is incomplete -> package may still resolve to `VERIFIED_ADVANCEABLE`
   - if automated verification passes and `HUMAN_GATE: NONE` -> package may resolve to `VERIFIED_ADVANCEABLE`
   - only `VERIFIED_ADVANCEABLE` may proceed automatically

4. Keep manual verification instructions as a separate concept from the human gate.

   The docs should explicitly distinguish:

   - manual verification instructions = how a human can inspect the work
   - human gate = whether that inspection is required before advancement

5. Update the process docs so future packages can declare human-gate mode consistently and without ambiguity.

6. Reconcile the currently prepared next action state.

   The docs should make it clear that:
   - the previously prepared repair-entry package was paused before execution
   - this steering package supersedes it temporarily
   - after this package completes, the next prepared package should return to the repair-entry and return step unless the updated contract clearly requires a different next step

7. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

OPTIONAL FILES TO CREATE (only if genuinely useful and minimal):

- `.consync/state/history/plans/process-20260415-refine-verification-contract-with-optional-vs-required-human-gates.md` (if your current closeout/archive pattern expects it during completion)

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN GATE:
OPTIONAL

MANUAL VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm manual verification instructions are now distinct from blocking human-gate requirements.
3. Confirm the docs define `HUMAN_GATE: REQUIRED`, `OPTIONAL`, and `NONE` in a small, practical way.
4. Confirm the advancement classifications now behave differently for `OPTIONAL` versus `REQUIRED` human gates.
5. Confirm the docs still say only `VERIFIED_ADVANCEABLE` may proceed automatically.
6. Confirm the paused repair-entry package is treated as temporarily superseded rather than silently discarded.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm only `.consync/state/` process docs are changed.
8. Failure case: if manual verification instructions still imply a blocking gate by default, the package is incomplete.
9. Failure case: if the refinement adds too much ceremony or reads like a policy engine, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- the verification contract now distinguishes manual instructions from required human gates.
- the docs define `REQUIRED`, `OPTIONAL`, and `NONE` clearly.
- advancement rules remain explicit and small.
- the paused repair-entry next step is accounted for cleanly.
- no runtime/product code changed.

FAIL CRITERIA:

- human verification remains implicitly blocking in all cases
- advancement rules become more ambiguous
- the refinement introduces unnecessary complexity
- the paused next action becomes unclear or lost
- unrelated files change

STATE UPDATES:

- `decisions.md` -> refine the verification contract with explicit human-gate modes
- `package_plan.md` -> record this steering package and keep the repair-entry package legible as the next intended step after refinement
- `snapshot.md` -> reflect that verification gating was refined and note what is prepared next
- `next-action.md` -> after completion, point back to the repair-entry and return package unless a stronger reason emerges to change it
- `handoff.md` -> record the completed result of this PROCESS package

NOTES:

- Keep this refinement small.
- This package is a steering correction to improve the usability of the verification contract.
- Do not silently erase the previously prepared next step; account for it explicitly in the state docs.