# Copilot Handoff

## Status
- PASS

## Summary
- Added a curated portable scaffold source under `.consync/templates/portable/` containing only the minimal workflow starter: two state files, one orientation doc, and two prompt adapters.
- Added a new `portable` CLI command that copies that curated template into an existing target directory, skips existing files by default, supports `--force`, and reports created, skipped, and overwritten files clearly.
- Updated light discovery surfaces so the new command is visible in `README.md`, `.consync/docs/current-system.md`, `system-summary`, and `system-check`.

## Files Created
- `.consync/templates/portable/.consync/state/handoff.md`
  - Added a curated starter handoff file with the expected handoff sections as placeholders.
- `.consync/templates/portable/.consync/state/next-action.md`
  - Added a minimal starter packet file for defining the next small unit of work in a target repo.
- `.consync/templates/portable/.consync/docs/current-system.md`
  - Added a scaffold-specific orientation doc explaining what the portable starter provides and what it intentionally does not provide.
- `.consync/templates/portable/.github/prompts/run_next_action.prompt.md`
  - Added a self-contained portable next-action prompt adapter that writes to `.consync/state/handoff.md`.
- `.consync/templates/portable/.github/prompts/run_closeout.prompt.md`
  - Added a self-contained portable closeout prompt adapter that does not depend on extra prompt files outside the scaffold subset.
- `src/lib/portableScaffold.js`
  - Added the small recursive copy helper that copies only the curated portable template tree into a target repo.
- `src/commands/portable.js`
  - Added the conservative CLI command that validates the target, performs the copy, and prints the result summary.

## Files Modified
- `src/index.js`
  - Registered the new `portable` command and added minimal `--target` and `--force` option parsing.
- `src/commands/system-summary.js`
  - Added `portable` to the reported command surface so the summary matches the implemented CLI.
- `src/commands/system-check.js`
  - Added `portable.js` to the required command checks so `STATUS: ON_TRACK` includes the new command surface.
- `README.md`
  - Added a brief portable-scaffold mention and a concrete `portable --target` example so the feature is discoverable.
- `.consync/docs/current-system.md`
  - Added the portable scaffold capability to the current behavior summary and command surface list.
- `.consync/state/handoff.md`
  - Replaced the previous handoff with this portable scaffold packet summary.

## Commands to Run
- `find .consync/templates/portable -type f | sort`
- `mkdir -p /tmp/consync-portable-scratch`
- `node src/index.js portable --target /tmp/consync-portable-scratch`
- `node src/index.js portable --target /tmp/consync-portable-scratch`
- `node src/index.js portable --target /tmp/consync-portable-scratch --force`
- `node src/index.js portable`
- `node src/index.js portable --target /tmp/consync-portable-does-not-exist`
- `npm run verify`
- `git status --short`

## Human Verification
1. Run `find .consync/templates/portable -type f | sort` and confirm the template contains only the five scaffold files under `.consync/` and `.github/prompts/`. Failure case: if the template includes artifacts, plans, logs, sandbox files, or other repo state, the scaffold is not curated enough.
2. Create a scratch target with `mkdir -p /tmp/consync-portable-scratch`, then run `node src/index.js portable --target /tmp/consync-portable-scratch`. Confirm the target now contains `.consync/state/handoff.md`, `.consync/state/next-action.md`, `.consync/docs/current-system.md`, `.github/prompts/run_next_action.prompt.md`, and `.github/prompts/run_closeout.prompt.md`. Failure case: if any file is missing or placed elsewhere, treat the scaffold as failed.
3. Run the same command again without `--force` and confirm it reports the scaffold files under `Skipped:` instead of overwriting them. Failure case: if existing scaffold files are overwritten without force, the command is too aggressive.
4. Change one scaffolded file in the scratch target, then run `node src/index.js portable --target /tmp/consync-portable-scratch --force` and confirm only the scaffolded files are reported under `Overwritten:`. Failure case: if unrelated files are touched or deleted, the command is unsafe.
5. Run `node src/index.js portable` and `node src/index.js portable --target /tmp/consync-portable-does-not-exist` and confirm both fail with clear messages for missing and invalid targets. Failure case: if either call succeeds or fails ambiguously, error handling is incomplete.
6. Run `npm run verify` and confirm the suite ends with `[verify] PASS`, then run `git status --short` and confirm the diff is limited to the new portable scaffold files, related command wiring, and light doc updates. Failure case: if verification fails or unrelated surfaces changed, review before closing the packet.

## Verification Notes
- Verified the curated template tree exists under `.consync/templates/portable/` and contains only the intended minimal scaffold subset.
- Ran `node src/index.js portable --target /tmp/consync-portable-OfPSDS`; observed all five scaffold files created in the scratch target and an unrelated `unrelated.txt` file left untouched.
- Ran the command again without `--force`; observed all scaffold files reported under `Skipped:` and confirmed a manual change to the scratch `handoff.md` remained in place.
- Ran the command with `--force`; observed all scaffold files reported under `Overwritten:` and confirmed the scratch `handoff.md` reverted from `USER CHANGE` back to `# Copilot Handoff`.
- Ran failure-path checks for `node src/index.js portable` and `node src/index.js portable --target /tmp/consync-portable-does-not-exist`; observed clear exit-code `1` errors for missing and invalid targets.
- Ran `npm run verify`; the suite passed and `system-check` reported `STATUS: ON_TRACK`, including `portable command present` with no warnings.