TYPE: PROCESS
PACKAGE: define_minimal_verification_contract_for_package_execution

GOAL:

Define a minimal, durable verification contract that standardizes how every package is validated, recorded, and allowed (or blocked) from advancing.

This package should make verification:
- explicit,
- repeatable,
- easy to execute manually,
- and straightforward to automate later.

CONTEXT:

- The current system successfully handles sequencing, state, and resume logic.
- Verification is currently a mix of automated commands and manual inspection but is not yet standardized.
- Human verification steps exist but are slightly freeform and rely on interpretation.
- The system needs a consistent structure for:
  - automated checks,
  - manual checks,
  - closeout validation,
  - and advancement decisions.
- The goal is not to introduce heavy testing, but to define a **small, strict verification protocol**.

REQUIREMENTS:

1. Keep verification lightweight and procedural.
2. Do not introduce new tooling or complex test frameworks.
3. Do not modify runtime/product code.
4. Define verification as part of the package contract, not as an afterthought.
5. Ensure verification can be executed without relying on chat memory.
6. Ensure the protocol can later be automated by Copilot or MCP without redesign.

TASK:

1. Read:
   - `.consync/state/decisions.md`
   - `.consync/state/snapshot.md`
   - `.consync/state/package_plan.md`
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`

2. Define a minimal verification model in the process docs.

   The model must include three distinct sections:

   ### A. Automated Verification
   - A small set of allowed command types (e.g., `npm run verify`, targeted test scripts)
   - Rules:
     - commands must be deterministic and terminating
     - failure must block advancement
     - output is not interpreted beyond pass/fail

   ### B. Manual Verification
   - A standardized structure for human checks
   - Each check must be:
     - explicit
     - observable
     - tied to a file, command, or UI state
   - Avoid vague instructions like “looks correct”
   - Keep the list short and focused

   ### C. Closeout Validation
   - Define the required conditions for a package to be considered ready to advance:
     - automated verification passed
     - required manual checks completed
     - repo state reconciled (CLEAN or explicitly acknowledged closeout)
     - no contradictions between expected and observed results

3. Define a minimal advancement decision model.

   The docs should make it clear that a package resolves to one of:

   - `VERIFIED_ADVANCEABLE`
   - `VERIFIED_AWAITING_HUMAN`
   - `FAILED_BLOCKED`
   - `AMBIGUOUS_REVIEW_REQUIRED`

   Advancement rules:
   - only `VERIFIED_ADVANCEABLE` may proceed automatically
   - all other states must pause the sequence

4. Define how verification results are recorded.

   Update expectations for `handoff.md` so it includes:
   - outcome of automated verification
   - outcome of manual verification
   - final advancement classification
   - any notable discrepancies

   Keep this minimal and readable.

5. Normalize the “COMMANDS TO RUN” and “HUMAN VERIFICATION” sections.

   - Ensure commands are copy-paste safe
   - Ensure manual steps are consistent in tone and structure
   - Avoid requiring the operator to remember prior steps

6. Ensure compatibility with existing process:

   - Does not break current package structure
   - Works with `next-action.md`, `handoff.md`, and `package_plan.md`
   - Respects reconcile-before-advance and resume-state rules

7. Update state files at the end.

FILES TO MODIFY:

- `.consync/state/decisions.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/package_plan.md` (only if needed for consistency)

COMMANDS TO RUN:

- `cd /Users/markhughes/Projects/consync-core && npm run verify`

HUMAN VERIFICATION:

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm it exits successfully.
2. Open `.consync/state/decisions.md` and confirm verification is now split into automated, manual, and closeout sections.
3. Confirm the docs define the four advancement outcomes and their rules.
4. Confirm advancement is explicitly blocked unless verification resolves to `VERIFIED_ADVANCEABLE`.
5. Open `.consync/state/handoff.md` and confirm it now includes verification results in a consistent format.
6. Confirm manual verification steps are clear, short, and do not rely on memory or interpretation.
7. Confirm no runtime/product code changed.
8. Failure case: if verification still relies on informal judgment instead of defined checks, the package is incomplete.
9. Failure case: if the verification model feels like a testing framework instead of a small procedural contract, the package is incomplete.

PASS CRITERIA:

- `npm run verify` passes.
- verification is clearly defined, minimal, and repeatable.
- advancement decision rules are explicit and enforceable.
- handoff now includes structured verification results.
- no runtime/product code changed.

FAIL CRITERIA:

- verification remains ambiguous or informal
- advancement rules are unclear or bypassable
- verification introduces unnecessary complexity
- unrelated files change

STATE UPDATES:

- `decisions.md` -> add the minimal verification contract
- `snapshot.md` -> reflect that verification is now standardized and note the next gap
- `next-action.md` -> point to the next narrow process step after verification
- `handoff.md` -> record the completed result of this PROCESS package
- `package_plan.md` -> update only if needed for consistency

NOTES:

- Keep this small and strict.
- This is not about adding more tests; it is about making validation reliable.
- Prefer clarity and repeatability over completeness.