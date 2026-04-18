TYPE: PROCESS
PACKAGE: capture_manual_observation_for_explicit_reveal_search_loop

SUMMARY

Capture one reliable manual live observation of the desktop search -> select -> explicit reveal loop so the current failed observational package can be resolved honestly.

The last attempted observational package had a clean automated baseline, and the app launched, but the actual live interaction was not durably observed end to end. This package should resolve that gap with one explicit manual observation pass rather than adding more product work.

FILES CREATED

- `.consync/state/history/plans/process-<timestamp>-capture-manual-observation-for-explicit-reveal-search-loop.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- minimal state or notes files only as needed to record the manual observation outcome
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Resolve the current observational failure by:

1. launching the desktop shell
2. running the known mock search for `sandbox/fixtures/nested-anchor-trial` and `moss`
3. selecting one result and confirming only detail changes occur
4. clicking `Reveal in Finder` and confirming reveal works on demand
5. selecting another result and confirming no automatic reveal returns
6. recording either PASS or one concrete blocker based on that direct observation

CONSTRAINTS

- Keep this package narrow and observational.
- Do not add product features.
- Do not change search ranking, grouping, persistence, or session mutation behavior.
- Prefer zero code changes unless a small regression is found and clearly inside the current package boundary.

TASK

1. Re-run the verification baseline if needed to confirm the repo remains healthy.
2. Perform one complete manual live pass of the explicit-reveal search loop.
3. If the flow is clean, update only the state docs.
4. If a small regression is found, fix only that regression and rerun the relevant verification.
5. Preserve this instruction in history before replacing the live slot.

DO NOT

- invent a PASS without a real live observation
- broaden the shell into new UX work
- add multiple new blockers or speculative follow-on ideas
- widen the search model or reveal model beyond the current loop

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && node src/test/desktop-scaffold.js`
- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`
- `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run start:desktop`.
2. Search `sandbox/fixtures/nested-anchor-trial` for `moss`.
3. Click one result row and confirm only the detail panel changes.
4. Confirm Finder does not open on selection.
5. Click `Reveal in Finder` and confirm the correct file, or its parent folder, is revealed.
6. Click a second result row and confirm the detail updates again without automatic reveal.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected state files unless a small repair was required.

PASS CRITERIA

- One complete manual live pass of the explicit-reveal loop is observed
- The flow behaves as intended without automatic reveal on selection
- `Reveal in Finder` still works on demand
- `npm run verify` passes

FAIL CRITERIA

- The live pass still cannot be observed reliably
- Selecting a row still opens Finder automatically
- `Reveal in Finder` no longer works on demand
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` -> resolve the failed observational package and record the next narrow step
- `snapshot.md` -> reflect whether the live loop is now confirmed or still blocked
- `next-action.md` -> point to the next logical package after the manual observation resolves
- `handoff.md` -> record the result of this PROCESS package

NOTES

- Keep this boring and evidence-based.
- The current gap is observational, not architectural.
- Do not claim live behavior that was not directly observed.