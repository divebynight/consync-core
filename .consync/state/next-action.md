TYPE: PROCESS
PACKAGE: rerun_mock_session_desktop_trial_with_explicit_reveal_action

SUMMARY

Rerun the short desktop mock-session trial now that selection and reveal are separated, and record the next concrete blocker or confirm that the desktop shell is usable at this scale.

The last package removed the coupling between inspect and act by making row clicks selection-only and moving Finder reveal to an explicit button in the detail panel. This package should now test that updated shell again and identify the next concrete blocker, if one still appears.

FILES CREATED

- `.consync/state/history/plans/process-<timestamp>-rerun-mock-session-desktop-trial-with-explicit-reveal-action.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- minimal state or notes files only as needed to record the trial outcome
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Determine whether the updated desktop shell is now ready for a short search-oriented mock session by:

1. exercising the visible desktop flow with the explicit reveal button now in place
2. identifying the next concrete blocker that makes a short mock session awkward, if one appears
3. avoiding speculative fixes until that blocker is named clearly
4. confirming trial readiness explicitly if no blocker appears at this scale

CONSTRAINTS

- Keep this package narrow and observational first
- Do not introduce speculative implementation work just because the trial reveals multiple possible future improvements
- Do not broaden the desktop shell or search path further unless a tiny unblocker is clearly required and still fits the package scope
- Prefer recording the blocker over partially fixing several things at once

TASK

1. Define a very short mock-session trial flow that uses the desktop shell with the explicit reveal button available.
2. Identify the smallest realistic path a human can now attempt in the updated shell.
3. Record the next concrete blocker or friction point that would likely matter in that trial.
4. If no blocker appears at this scale, record that the shell appears ready for one short search-oriented mock session and name the next most useful feature target.
5. Keep implementation changes at zero unless a tiny unblocker is clearly necessary and still narrower than the recorded blocker itself.
6. Run repo verification.
7. Update state files at the end.

DO NOT

- start a broad usability push
- redesign the desktop shell
- add multiple new blockers or a long backlog
- expand the package beyond one concrete trial outcome
- broaden the grouped search behavior unless the new blocker clearly requires it

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success.
2. Start the desktop shell and run one grouped mock search using `sandbox/fixtures/nested-anchor-trial` and `moss`.
3. Click one result row and confirm it updates the detail panel without opening Finder automatically.
4. Click the `Reveal in Finder` button and confirm Finder reveals the correct file, or opens the parent folder if the direct file reveal is unavailable.
5. Confirm the grouped result and selected-match detail still align with `node src/index.js sandbox-desktop-search sandbox/fixtures/nested-anchor-trial moss`.
6. Confirm the package records one next blocker clearly, or explicitly records that no blocker appeared at this scale.
7. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected narrow files.

PASS CRITERIA

- One concrete next trial outcome is recorded clearly
- Scope remains narrow and grounded in actual trial use
- `npm run verify` passes
- No unnecessary implementation sprawl was introduced

FAIL CRITERIA

- The package produces only vague usability commentary
- The package tries to fix several possible future issues at once
- The recorded blocker does not map to a plausible short mock session through the updated shell
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record completion of the rerun trial package and set up the next narrow package from the observed outcome
- `snapshot.md` → reflect the observed trial readiness or blocker after the explicit reveal button was introduced
- `next-action.md` → point to the next logical package after this retry
- `handoff.md` → record the result of this PROCESS package

NOTES

- Keep this boring and observational.
- The purpose is to see what the next real blocker is now that inspect and reveal are separated cleanly.
- Prefer one crisp outcome over partial follow-on fixes.