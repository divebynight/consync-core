TYPE: PROCESS
PACKAGE: run_mock_session_desktop_trial

STATUS

READY

SUMMARY

Use the current desktop shell for one short mock-session trial and name the first concrete blocker, or confirm that the shell is usable at that scale without adding new implementation work yet.

The nested-anchor sandbox trial now provides a more realistic context baseline than the earlier flat sandbox fixtures. This package should use that new baseline to judge whether the current desktop shell is ready for a short trial or still missing one concrete workflow-critical step.

FILES CREATED

- `.consync/state/history/plans/process-<timestamp>-run-mock-session-desktop-trial.md` — preserve this instruction before replacing the live `next-action.md` slot

FILES MODIFIED

- minimal state or notes files only as needed to record the trial outcome
- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Determine whether the current desktop shell is ready for a short mock-session trial by:

1. exercising the visible desktop flow with the current real bookmark behavior in mind
2. using the nested-anchor trial as the more realistic comparison baseline for captured context
3. identifying the first concrete blocker that makes the shell awkward for a short trial, if one appears
4. avoiding speculative fixes until that blocker is named clearly

CONSTRAINTS

- Keep this package narrow and observational first
- Do not introduce speculative implementation work just because the trial reveals multiple possible future improvements
- Do not change preload, backend, or session logic unless a tiny unblocker is clearly required and still fits the package scope
- Prefer recording the blocker over partially fixing several things at once
- Do not broaden the desktop shell just to imitate future nested-anchor behavior prematurely

TASK

1. Define a very short mock-session trial flow that uses the current desktop UI and the new nested-anchor trial as the realism baseline.
2. Identify the smallest realistic path a human could attempt right now in the desktop shell.
3. Record the first concrete blocker or friction point that would likely matter in that trial.
4. If no blocker appears at this scale, record that the shell appears ready for a short mock trial and name the next most useful feature target.
5. Keep implementation changes at zero unless a tiny unblocker is clearly necessary and still narrower than the recorded blocker itself.
6. Run repo verification.
7. Update state files at the end.

DO NOT

- start a broad usability push
- redesign the desktop shell
- add multiple new blockers or a long backlog
- change bookmark behavior without first proving the blocker requires it
- expand the package beyond one concrete trial outcome

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && npm run verify`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success.
2. Review the trial notes and confirm the package names one concrete mock-session blocker or explicitly records that no blocker appeared at this scale.
3. Confirm the package does not sprawl into multiple speculative fixes.
4. If a tiny unblocker was implemented, confirm it is tightly tied to the named blocker and does not broaden the architecture.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm changes are limited to the expected narrow files.

PASS CRITERIA

- One concrete trial outcome is recorded clearly
- Scope remains narrow and grounded in actual trial use
- `npm run verify` passes
- No unnecessary implementation sprawl was introduced

FAIL CRITERIA

- Package produces only vague usability commentary
- Package tries to fix several possible future issues at once
- The recorded blocker does not map to a plausible short mock-session trial
- `npm run verify` fails

STATE UPDATES

- `package_plan.md` → record completion of the mock-session trial package and set up the next narrow package from the trial outcome
- `snapshot.md` → reflect the observed trial readiness or blocker
- `next-action.md` → point to the next logical package after the trial outcome is recorded
- `handoff.md` → record the result of this PROCESS package

NOTES

- This package should convert recent implementation progress into one real trial-readiness signal.
- Prefer a crisp blocker statement over a half-solution.
- Keep it boring, precise, and grounded in the current shell.