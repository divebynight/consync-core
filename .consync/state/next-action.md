TYPE: PROCESS
PACKAGE: add_handoff_contract_checker

GOAL

Add a tiny checker that validates the live `handoff.md` structure against the documented next-action/handoff automation contract and catches basic identity mismatches automatically.

WHY

The automation contract is now defined. The smallest useful next step is a lightweight checker that removes repetitive structural validation work without making package decisions or inventing outcomes.

This should help confirm that:
- required handoff sections are present
- `TYPE` and `PACKAGE` are present
- `TYPE` and `PACKAGE` match the active `next-action.md`
- the handoff is structurally usable for the next package-selection step

DO

1. Read the new contract doc and implement a very small checker that validates the live files against the documented contract.
2. The checker should inspect:
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
3. Validate at minimum:
   - required `handoff.md` sections exist
   - required `next-action.md` identity fields exist
   - `TYPE` matches between the two files
   - `PACKAGE` matches between the two files
4. Keep output simple and readable. Prefer a clear PASS/FAIL style result with specific missing fields or mismatches.
5. Keep the checker narrow. It must not:
   - infer whether STATUS is correct
   - judge whether the summary is good
   - choose the next package
   - rewrite files automatically
6. Add a small test surface if appropriate for the repo style, but keep this package tight and avoid overbuilding.
7. Add a light doc pointer only if needed for discoverability of the checker. Do not broaden the process docs.

CONSTRAINTS

- Keep this tiny and deterministic.
- Do not build a generator yet.
- Do not mutate `next-action.md` or `handoff.md`.
- Use the contract doc as the source of truth.
- Avoid creating a framework or generalized workflow engine.

OUTPUT

Return the normal handoff format with:
- STATUS
- SUMMARY
- CHECKER BEHAVIOR
- FILES CREATED
- FILES MODIFIED
- COMMANDS TO RUN
- HUMAN VERIFICATION
- VERIFICATION NOTES
- NEXT RECOMMENDED PACKAGE

VERIFICATION

At minimum:
- run the checker directly against the current live files
- confirm it passes on a valid pair of files
- if tests are added, run the relevant test command
- run the normal repo verification command if appropriate for the package