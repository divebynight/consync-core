# Copilot Handoff

## Status
- PASS

## Summary
- Added a read-only `sandbox-propose` command that builds on the existing scan and description layers to print a conservative, deterministic grouping proposal for a directory.
- Kept the proposal surface narrow: it suggests obvious media-type grouping for mixed flat directories, recommends no additional grouping when a directory already has a simple nested structure, and does not mutate anything.

## Files Created
- `src/commands/sandbox-propose.js`
  - Added the new proposal command that prints `PATH`, `PROPOSED GROUPS`, and `NOTES` using explicit heuristics only.
- `sandbox/expectations/basic-mixed-propose.md`
  - Added the exact expected proposal output for the flat mixed fixture.
- `sandbox/expectations/nested-mixed-propose.md`
  - Added the exact expected proposal output for the nested mixed fixture.

## Files Modified
- `src/commands/sandbox-describe.js`
  - Refactored the describe command to expose a reusable summary builder so the proposal layer can reuse existing classification and note logic.
- `src/index.js`
  - Registered the new `sandbox-propose` command in the CLI entrypoint.
- `src/test/verify.js`
  - Added expectation-backed proposal coverage for both current fixtures in the explicit verify flow.
- `state/handoff.md`
  - Updated the handoff to record the current packet outcome.

## Commands to Run
- `node src/index.js sandbox-propose sandbox/fixtures/basic-mixed`
- `node src/index.js sandbox-propose sandbox/fixtures/nested-mixed`
- `npm run verify`

## Human Verification
- Run `node src/index.js sandbox-propose sandbox/fixtures/basic-mixed` and confirm it suggests simple media-based groups with stable counts and includes notes for mixed media plus non-standard filename patterns.
- Run `node src/index.js sandbox-propose sandbox/fixtures/nested-mixed` and confirm it recommends no additional grouping and notes that the directory already has a simple nested structure.
- Confirm the command remains read-only and does not move, rename, create, or update files.
- Run `npm run verify` and confirm the proposal layer appears as explicit expectation-backed steps for both fixtures.
- Failure case: if the command starts making speculative suggestions, mutates files, or produces output that drifts from the exact expectation files, treat the packet as failed.

## Verification Notes
- Verified `sandbox-propose` against both fixtures and observed deterministic, conservative output aligned with the intended narrow heuristics.
- Observed exact proposal coverage in `npm run verify`, with both `basic-mixed` and `nested-mixed` proposal checks returning `PASS`.
- Ran `npm run verify`; the full verification flow passed and now includes proposal-layer checks alongside the existing core CLI, fixture verification, descriptive layer, and system-check stages.

## Open Questions
- None.