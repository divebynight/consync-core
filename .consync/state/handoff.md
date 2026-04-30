TYPE: RECOVERY
PACKAGE: closeout-recovery-clear-stale-next-action-v1

STATUS

PASS

SUMMARY

Recovery closeout for two packets that were manually committed without running the normal Consync closeout state update. Stale `ideas_foundation_from_notes_first_workflow` in-flight marker in `next-action.md` was cleared. System state is now coherent and no in-flight packet is active.

Completed packets recovered:

- `packet-state-tracking-v1` — introduced `src/lib/getInFlightPacket.js` to read real in-flight state from `next-action.md`; updated `dry-run-check` to use state rather than only a CLI flag; added tests and verify wiring
- `consync-run-command-v1` — introduced `src/commands/consync-run.js` as a soft-gate CLI command with Gatekeeper evaluation and user confirm prompt; wired into CLI index; added tests and verify wiring

Branch: `feature/split-app-from-scaffold`

FILES CREATED

- `src/lib/getInFlightPacket.js`
- `src/commands/consync-run.js`
- `src/test/unit-get-in-flight-packet.js`
- `src/test/unit-consync-run.js`

FILES MODIFIED

- `src/commands/dry-run-check.js` — reads in-flight from state; annotates source (state/cli-override)
- `src/cli/index.js` — added consync-run route
- `src/test/unit-dry-run-check.js` — added state-reading integration tests
- `src/test/verify.js` — added steps for new test suites
- `.consync/state/next-action.md` — stale PACKAGE cleared; set to `PACKAGE: NONE` (explicit closed-state marker)
- `.consync/state/handoff.md` — updated to this recovery closeout
- `.consync/state/snapshot.md` — updated to reflect current branch and cleared state
- `src/lib/stateIntegrityCheck.js` — added `NONE` as explicit closed-state value for PACKAGE; strict TYPE+PACKAGE validation preserved

COMMANDS TO RUN

- `npm run check:state-preflight`
- `npm run verify`
- `npm run check:state-postflight`

HUMAN VERIFICATION

1. Confirm `src/lib/getInFlightPacket.js` exists and reads both PACKET_ID and PACKAGE patterns.
2. Confirm `src/commands/consync-run.js` exists and prompts on ALLOW.
3. Confirm `npm run verify` passes all steps including new unit-get-in-flight-packet and unit-consync-run.
4. Confirm `.consync/state/next-action.md` has `PACKAGE: NONE` (getInFlightPacket returns null for NONE).
5. Confirm `npm run check:state-preflight` and `npm run check:state-postflight` both pass.

VERIFICATION NOTES

- All three checks (preflight, verify, postflight) passed after state update.
- Manual commit of packet-state-tracking-v1 and consync-run-command-v1 skipped state update; recovered here.
- stateIntegrityCheck.js updated to treat `PACKAGE: NONE` as the explicit closed-state marker; strict TYPE+PACKAGE validation is preserved.
