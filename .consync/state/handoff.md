# Copilot Handoff

## Status
- PASS

## Summary
- Moved the repo workflow files from root `state/` and `artifacts/` into `.consync/state/` and `.consync/artifacts/`, preserving the existing file set and archive layout.
- Updated prompt files, workflow docs, ignore rules, and source/test path handling so the current process now reads and writes `.consync/state/...` without changing command behavior beyond the path migration.
- Verified the migrated layout is present, the root `state/` and `artifacts/` folders are gone, and the existing verification suite still passes.

## Files Created
- None.

## Files Modified
- `.github/prompts/run_next_action.prompt.md`, `.github/prompts/run_closeout.prompt.md`
  - Updated both prompts to read from `.consync/state/...` and write the handoff back to `.consync/state/handoff.md`.
- `.github/copilot-instructions.md`, `.gitignore`
  - Updated workflow guidance and ignore rules to reference `.consync/state/...`.
- `src/lib/fs.js`, `src/test/unit-new-guid.js`, `src/test/integration-new-guid-cli.js`
  - Moved event-log behavior and test expectations from `state/events.log` to `.consync/state/events.log`.
- `src/commands/system-check.js`
  - Updated required file checks to the new `.consync` locations for handoff, work log, feature map, and artifact index.
- `.consync/state/agent-handoff.md`, `.consync/state/consync_v1_spec.md`, `.consync/state/plans/v1-plan-001.md`, `.consync/state/plans/v1-plan-002.md`
  - Updated embedded path references so the state docs describe the new layout accurately.
- `.consync/artifacts/01_current-direction.md`, `.consync/artifacts/03_work-log.md`, `.consync/artifacts/05_marker-capture.md`, `.consync/artifacts/marker-capture-resume.md`
  - Updated active artifact docs to point at `.consync/state/...` and `.consync/artifacts/...` where relevant.
- `.consync/artifacts/archive/conceptual/foundations.md`, `.consync/artifacts/archive/conceptual/state-hierarchy.md`, `.consync/artifacts/archive/conceptual/trust-boundaries.md`, `.consync/artifacts/archive/legacy/next-targets.md`, `.consync/artifacts/archive/system/artifact-index.md`, `.consync/artifacts/archive/system/feature-map.md`
  - Updated archived reference docs so current-path links and examples match the migrated structure.
- `.consync/state/handoff.md`
  - Replaced the previous packet handoff with this refactor handoff.

## Commands to Run
- `ls -a`
- `find .consync/state .consync/artifacts -maxdepth 3 -type f | sort`
- `sed -n '1,40p' .github/prompts/run_next_action.prompt.md`
- `sed -n '1,60p' .github/prompts/run_closeout.prompt.md`
- `npm run verify`
- `git status --short`

## Human Verification
1. Run `ls -a` at the repo root and confirm `.consync/` exists while root `state/` and `artifacts/` do not. Failure case: if either legacy root folder still exists, treat the migration as failed.
2. Run `find .consync/state .consync/artifacts -maxdepth 3 -type f | sort` and confirm the previous state files, plans, active artifacts, and archive files are all present under `.consync/`. Failure case: if any expected file is missing from `.consync/`, stop and inspect the move before continuing.
3. Run `sed -n '1,40p' .github/prompts/run_next_action.prompt.md` and `sed -n '1,60p' .github/prompts/run_closeout.prompt.md` and confirm both prompts now reference `.consync/state/next-action.md` and `.consync/state/handoff.md`. Failure case: if either prompt still points at `state/...`, the workflow is still stale.
4. Run `npm run verify` and confirm the suite ends with `[verify] PASS`. Failure case: if verification fails, the path migration broke runtime behavior and should be fixed before further work.
5. Run `git status --short` and confirm the diff is dominated by the `.consync/` move plus the expected prompt/source/doc path updates. Failure case: if unrelated runtime files changed, review them before closing the packet.

## Verification Notes
- Confirmed the repo root now contains `.consync/` and no longer contains root `state/` or `artifacts/`.
- Confirmed `.consync/artifacts/archive/` contains `conceptual/`, `legacy/`, and `system/`, and `.consync/state/plans/` still contains both plan files.
- Ran `npm run verify`; the suite passed and `system-check` reported `STATUS: ON_TRACK` with no warnings.
- Ran `git status --short`; the output shows the expected `.consync/` move plus prompt, source, test, ignore-rule, and workflow-doc updates.
- Validated the important edge case that event logging still works after the move because both the shared FS helper and the new-guid tests now target `.consync/state/events.log`.