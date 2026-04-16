TYPE: PROCESS
PACKAGE: run_mock_session_desktop_trial

STATUS

READY

SUMMARY

Run one short mock-session trial against the current desktop shell and capture the first concrete blocker, or confirm that the current flow is usable for a basic trial without adding new implementation work yet.

The recent packages made the bookmark write/read/render loop real and tightened the nearby copy. The next step should stop polishing and check whether the current shell is actually usable for a short mock session.

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
2. identifying the first concrete blocker that makes the shell awkward for a short trial, if one appears
3. avoiding speculative fixes until that blocker is named clearly

CONSTRAINTS

- Keep this package narrow and observational first
- Do not introduce speculative implementation work just because the trial reveals multiple possible future improvements
- Do not change preload, backend, or session logic unless a tiny unblocker is clearly required and still fits the package scope
- Prefer recording the blocker over partially fixing several things at once

TASK

1. Use the current desktop shell and repo context to define a very short mock-session trial flow.
2. Identify the smallest realistic trial path a human could attempt right now using the current desktop UI and artifact-backed bookmark behavior.
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

1. Run `cd /Users/markhughes/Projects/consync-core && npm run verify` and confirm success
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