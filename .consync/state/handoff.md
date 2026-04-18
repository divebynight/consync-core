TYPE: PROCESS
PACKAGE: add_handoff_contract_checker

STATUS

PASS

SUMMARY

Added a tiny deterministic checker that validates the live `next-action.md` and `handoff.md` files against the documented automation contract and reports a simple PASS or FAIL result with specific mismatches.

The checker stays intentionally narrow. It verifies required identity fields, required handoff sections, and `TYPE` and `PACKAGE` matching between the live files, but it does not judge whether a package deserves its status, choose the next package, or rewrite any files. A focused node test covers the validator logic, and package scripts now expose both the live checker and the narrow test directly.

CHECKER BEHAVIOR

The checker reads:

- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

It validates:

- `TYPE` exists in `next-action.md`
- `PACKAGE` exists in `next-action.md`
- required handoff sections exist
- `TYPE` exists in `handoff.md`
- `PACKAGE` exists in `handoff.md`
- `TYPE` matches between the live files
- `PACKAGE` matches between the live files

It also enforces one small contract detail from the automation contract doc:

- if `NEXT RECOMMENDED PACKAGE` is present, it must be the final handoff section

On success it prints `STATUS: PASS` with a short checklist.

On failure it prints `STATUS: FAIL` plus each missing field or mismatch.

FILES CREATED

- `scripts/check-handoff-contract.js` — runs the live next-action/handoff contract checker against `.consync/state/next-action.md` and `.consync/state/handoff.md`.
- `src/lib/handoffContractChecker.js` — shared deterministic validator for required identity fields, required handoff sections, and basic contract mismatches.
- `src/test/handoff-contract-checker.js` — focused node test covering both a valid contract pair and a failure case with a missing section and mismatched package.

FILES MODIFIED

- `package.json` — adds small script entries for running the live handoff checker and the focused validator test.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run check:handoff-contract`
- `cd /Users/markhughes/Projects/consync-core && npm run test:handoff-contract`
- `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run check:handoff-contract` and confirm it reports `STATUS: PASS` against the current live files.
2. Run `cd /Users/markhughes/Projects/consync-core && npm run test:handoff-contract` and confirm the focused validator test prints `PASS`.
3. Open `src/lib/handoffContractChecker.js` and confirm it only validates structure and identity matching, without judging status quality or rewriting files.
4. Confirm the checker reports `STATUS: FAIL` if `TYPE`, `PACKAGE`, or a required handoff section is removed or mismatched. If it silently passes those cases, treat that as a failure.
5. Run `cd /Users/markhughes/Projects/consync-core && node src/test/verify.js` and confirm the normal repo verification still ends with `[verify] PASS`.

VERIFICATION NOTES

- Ran `npm run test:handoff-contract` and observed `PASS` after fixing one validator bug in the `NEXT RECOMMENDED PACKAGE` final-section check.
- Ran `node src/test/verify.js` and observed the normal repo verification suite still ending with `[verify] PASS`.
- Ran `npm run check:handoff-contract` against the updated `.consync/state/next-action.md` and `.consync/state/handoff.md` pair and observed `STATUS: PASS` with matching `TYPE` and `PACKAGE`.
- Ran `git status --short` and observed the expected worktree changes: `.consync/state/handoff.md`, `.consync/state/next-action.md`, `package.json`, `scripts/`, `src/lib/handoffContractChecker.js`, and `src/test/handoff-contract-checker.js`.
- Validated one extra contract edge case in code: if `NEXT RECOMMENDED PACKAGE` exists, the checker requires it to be the final handoff section.

NEXT RECOMMENDED PACKAGE

- Add one small draft-generator helper that can produce an empty handoff shell from the current `next-action.md` without filling any judgment-based content.