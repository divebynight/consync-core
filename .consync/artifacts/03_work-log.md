# Work Log

Append-only history of completed work packets.
This file records recent completed changes in a short human-readable form.

## Unified Handoff Workflow
Status: PASS

- Summary: Replaced the split handoff-up and handoff-down flow with a single evolving `.consync/state/handoff.md` file.
- Files: `.github/prompts/run_next_action.prompt.md`, `.github/prompts/run_closeout.prompt.md`, `.consync/state/handoff.md`
- Verification: Confirmed the prompt files both target `.consync/state/handoff.md` and the old handoff files were removed.

## list-guid Command
Status: PASS

- Summary: Added `list-guid` to read GUID artifacts from `sandbox/current/` and print `guid`, `created_at`, and `note` for each valid JSON artifact.
- Files: `src/commands/list-guid.js`, `src/index.js`
- Verification: Ran `node src/index.js list-guid` and confirmed existing sandbox artifacts were printed in the expected readable format.

## show-guid Command
Status: PASS

- Summary: Added `show-guid` to recursively resolve `<guid>.json` under `sandbox/current/` and pretty-print the artifact when exactly one valid match exists.
- Files: `src/commands/show-guid.js`, `src/index.js`
- Verification: Verified success, missing GUID, no match, duplicate match, and invalid JSON cases using temporary nested sandbox fixtures.

## Standardized Handoff Verification Format
Status: PASS

- Summary: Tightened the workflow prompts so every future handoff includes commands, human verification, and verification notes in a consistent structure.
- Files: `.github/prompts/run_next_action.prompt.md`, `.github/prompts/run_closeout.prompt.md`
- Verification: Ran `npm run verify` and confirmed the prompt files explicitly require the standardized sections without affecting runtime behavior.

## State Hierarchy and GUID Rules Docs
Status: PASS

- Summary: Rewrote the short system docs for state hierarchy and GUID rules as plain markdown aligned with current workflow and CLI behavior.
- Files: `.consync/artifacts/archive/conceptual/state-hierarchy.md`, `.consync/artifacts/archive/system/guid-rules.md`
- Verification: Confirmed both docs contain raw markdown only, and checked `show-guid` behavior against a nested `<guid>.json` fixture to ensure the documented rules match implementation.

## Artifact Working Set Cleanup
Status: PASS

- Summary: Reduced `.consync/artifacts/` to the numbered active working set, archived conceptual and system references, and carried forward the current guardrails and active queue into short active docs.
- Files: `.consync/artifacts/01_current-direction.md`, `.consync/artifacts/02_active-work.md`, `.consync/artifacts/03_work-log.md`, `.consync/artifacts/04_manual-test-protocol.md`, `.consync/artifacts/archive/`
- Verification: Confirmed the top-level `.consync/artifacts/` folder now contains only the numbered active docs plus `archive/`, while the existing protocol and prior work history remain available.