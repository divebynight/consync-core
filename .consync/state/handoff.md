TYPE: PROCESS
PACKAGE: simplify_consync_state_and_docs_structure

STATUS

PASS

SUMMARY

Reduced `.consync/` from an over-engineered multi-surface system to a lean, deterministic structure. Removed all duplicated state surfaces, obsolete planning artifacts, and process-description docs that existed only to describe other process-description docs. The repo is now self-sufficient: four core runtime files are the only source of truth.

FILES CREATED

- none

FILES MODIFIED

- `.consync/state/next-action.md` — replaced stale mounted package with `simplify_consync_state_and_docs_structure`
- `.consync/state/snapshot.md` — rewritten to minimal format matching simplified structure
- `.consync/streams/electron_ui/stream.md` — added Pause Checkpoint section with resume context
- `.consync/streams/process/stream.md` — updated summary to reflect current package
- `.consync/docs/runbook.md` — added Stream Rules section; restored removed Trigger Level Use intro line
- `src/lib/stateIntegrityCheck.js` — removed per-stream state/ directory reads; removed unused parser functions; simplified REQUIRED_SNAPSHOT_SECTIONS to three entries
- `src/test/state-integrity-checks.js` — removed per-stream state fixture writes and the now-removed resume-context test case

FILES DELETED

- `.consync/orchestration/active_foreground_stream.txt`
- `.consync/orchestration/stream_index.md`
- `.consync/orchestration/` (folder)
- `.consync/streams/electron_ui/state/` (entire directory)
- `.consync/streams/process/state/` (entire directory)
- `.consync/state/package_plan.md`
- `.consync/state/decisions.md`
- `.consync/docs/agent-introduction-strategy.md`
- `.consync/docs/agent-routing-policy.md`
- `.consync/docs/artifact-role-model.md`
- `.consync/docs/current-system.md`
- `.consync/docs/doc-integrity-layer.md`
- `.consync/docs/human-assisted-observation-closeout-rules.md`
- `.consync/docs/integrity-agent-loop.md`
- `.consync/docs/integrity-trigger-model.md`
- `.consync/docs/next-action-handoff-automation-contract.md`
- `.consync/docs/stream-and-state-interaction.md`
- `.consync/docs/stream-lifecycle-and-promotion.md`
- `.consync/docs/stream-operating-model.md`
- `.consync/docs/stream-switch-and-active-owner-rules.md`

COMMANDS TO RUN

- `node src/test/state-integrity-checks.js`
- `npm run check:state-preflight`
- `ls .consync/docs/`
- `find .consync/streams -type f`
- `ls .consync/state/`
- `npm run check:state-postflight`
- `git status --short`

HUMAN VERIFICATION

1. Run `node src/test/state-integrity-checks.js`. Confirm output is `PASS`.
2. Run `npm run check:state-preflight`. Confirm STATUS: PASS, active stream `process`, active package `simplify_consync_state_and_docs_structure`.
3. Run `ls .consync/docs/`. Confirm exactly three files plus the examples/ folder: `runbook.md`, `state-contracts-and-integrity-checks.md`, `handoff-delivery-bridge.md`.
4. Run `find .consync/streams -type f`. Confirm only `stream.md` files remain — no `state/` subdirectory files.
5. Run `ls .consync/state/`. Confirm only: `active-stream.md`, `handoff.md`, `next-action.md`, `snapshot.md`, `history/`.
6. Run `npm run check:state-postflight`. Confirm STATUS: PASS.
7. Failure case: if postflight fails due to missing snapshot sections, the REQUIRED_SNAPSHOT_SECTIONS in `stateIntegrityCheck.js` needs to match the new simplified snapshot format — check the three expected sections are present in snapshot.md.

VERIFICATION NOTES

- Ran `npm run check:state-preflight` before starting: FAIL (stale package pointer). Reconciled `snapshot.md` and `streams/process/state/next_action.md`, reran: PASS.
- Discovered `stateIntegrityCheck.js` reads `streams/*/state/` files. Updated checker to only read `stream.md` per stream. Removed unused `parseStreamLocalNextAction`, `snapshotSuggestsPaused`, `snapshotHasResumeContext` functions. Updated `REQUIRED_SNAPSHOT_SECTIONS` to three minimal entries.
- Ran `node src/test/state-integrity-checks.js` after checker changes: PASS.
- Ran all deletions. Confirmed docs folder has three files, streams folder has two `stream.md` files only, state folder has four core files.
- Ran `npm run check:state-preflight` after snapshot rewrite: PASS.

NEXT SUGGESTED PACKAGE

- Resume `electron_ui` stream: add one additional real timeline lane (notes or session events) as the next narrow UI slice. Switch active stream from `process` to `electron_ui`, update `active-stream.md`, update both `stream.md` status fields, and update `snapshot.md`.
