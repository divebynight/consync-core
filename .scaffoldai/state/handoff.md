TYPE: REFACTOR
PACKAGE: scaffoldai-bridge-migration-v1

STATUS

PASS

SUMMARY

Migrated all ScaffoldAI BRIDGE state from `.consync/` to `.scaffoldai/`. The three bridge-owned directories — `state/`, `streams/`, and `packets/` — are now co-located under `.scaffoldai/` alongside agents, skills, process, and planning. `.consync/` now contains only Consync product content: `docs/`, `product/`, `examples/`, `archive/`, `quarantine/`, and the orphaned `contracts/bridge-ownership.contract.md`.

All 27 path references across runtime source, tests, scripts, prompts, and docs were updated atomically before the directory moves. Two additional test fixture files (`unit-dry-run-check.js`, `unit-consync-run.js`) were found and corrected during post-migration verify. `npm run verify` and `npm run verify:full` both PASS. Coverage map updated: `consync_bridge_scaffoldai_split_behavior` moved from NOT_COVERED to COVERED.

Branch: `feature/product-design-electron`

FILES CREATED

- none

FILES MODIFIED

Runtime source:
- `src/lib/stateIntegrityCheck.js` — CORE_STATE_FILES and STREAMS_ROOT constants updated
- `src/lib/getInFlightPacket.js` — NEXT_ACTION_PATH constant updated
- `src/lib/gatekeeperSwitch.js` — LIVE OWNER NOTE error string and console.log path strings updated
- `src/lib/gatekeeperClose.js` — console.log path strings updated
- `src/lib/gatekeeperMount.js` — console.log path strings updated
- `src/lib/intakeClassify.js` — OUT_OF_SCOPE data string updated
- `src/commands/dry-run-check.js` — ACTIVE_CONTRACT_PATH constant updated
- `src/commands/consync-run.js` — ACTIVE_CONTRACT_PATH constant updated
- `src/commands/system-check.js` — requiredFiles path string updated
- `src/commands/reentry-check.js` — console string updated
- `src/commands/handoff-bundle.js` — console string updated
- `src/commands/reference-audit.js` — REFERENCE_CATEGORIES needle strings and expectedZones updated

Tests:
- `src/test/bridge-integrity-checks.js` — requiredStateFiles, requiredStreamFiles arrays and inline path strings updated
- `src/test/state-integrity-checks.js` — all fixture writeFile paths, readFileSync paths, and LIVE OWNER NOTE content string updated
- `src/test/unit-get-in-flight-packet.js` — writeNextAction temp-dir path updated
- `src/test/unit-dry-run-check.js` — all 4 temp-dir stateDir path joins updated
- `src/test/unit-consync-run.js` — temp-dir stateDir path join updated
- `src/test/verify.js` — coverage map: moved consync_bridge_scaffoldai_split_behavior to COVERED

Scripts:
- `scripts/check-handoff-contract.js` — nextActionPath and handoffPath joins updated

Prompts and agents:
- `.github/prompts/run_closeout.prompt.md` — all state path references updated
- `.github/prompts/run_next_action.prompt.md` — all state path references updated
- `.github/agents/consync-integrity.agent.md` — streams and state path references updated
- `.github/agents/consync-process.agent.md` — streams and state path references updated
- `.github/copilot-instructions.md` — authority boundary text updated
- `AGENTS.md` — authority boundary text updated

Directories moved (filesystem operations):
- `.consync/state/` → `.scaffoldai/state/`
- `.consync/streams/` → `.scaffoldai/streams/`
- `.consync/packets/` → `.scaffoldai/packets/`

VERIFICATION NOTES

- `npm run verify` — PASS (all CLI, bridge/state, system, renderer tests PASS)
- `npm run verify:full` — PASS (preflight, unit+integration, build, e2e, postflight all PASS)
- `npm run check:state-postflight` — PASS
- `consync_bridge_scaffoldai_split_behavior` now in COVERED section of coverage map
- No stale `.consync/state/` or `.consync/streams/` references remain in `src/`, `scripts/`, or `.github/`
- `.consync/` retains: `docs/`, `product/`, `examples/`, `archive/`, `quarantine/`, `contracts/` (orphan noted)


WHAT CHANGED

Notes panel rendering:
- Flat `filteredStandaloneNotes` list replaced with grouped render driven by `groupStandaloneNotesByIdea`
- Each idea group renders as a `<section>` with an `<h5>` heading
- "Other notes" heading only appears when at least one idea group also exists
- Empty state behavior preserved (no notes / no filter match)

Architecture:
- Pure logic extracted to `notes-panel.mjs` — no React, no browser APIs, no side effects
- App.jsx imports from `notes-panel.mjs` (consistent with `session-panel.mjs`, `mock-search-panel.mjs`, `bookmark-flow.mjs` pattern)

FILES CREATED

- `src/electron/renderer/notes-panel.mjs` — exports `groupStandaloneNotesByIdea(notes)`
- `src/test/unit-standalone-notes-grouping.js` — 8 unit test scenarios

FILES MODIFIED

- `src/electron/renderer/App.jsx` — added import from `notes-panel.mjs`; replaced flat notes render with grouped render
- `src/test/verify.js` — added `runNodeStep` for grouping test in RENDERER group; added `standalone_notes_grouping_logic` to COVERED map

VERIFICATION NOTES

- `npm run verify` — PASS (all groups: CLI, BRIDGE, SYSTEM, RENDERER including new grouping step)
- `npm run verify:full` — PASS (20/20 e2e, 42/42 Vitest renderer tests including existing idea-field test, all unit steps)
- `unit-standalone-notes-grouping.js` — PASS (8/8 scenarios: empty, null, no-idea, all-idea, mixed, same-idea order, whitespace, no mutation)

Manual UX findings (human-verified in running app):
- Grouping renders correctly: notes with the same idea appear under a shared section heading
- "Other notes" section appears only when at least one idea group is also present
- Alphabetical group ordering confirmed
- Keyword filter continues to work across grouped and ungrouped notes
- Discovery: users treat the "idea" field like a tag label rather than a category name; the current label ("Idea or category (optional)") causes ambiguity with the keyword chips already present
- Discovery: the idea field is not prominently visible on saved notes — grouping is only apparent when multiple notes share the same idea; a single-idea note looks similar to no-idea
- These are UX clarity issues, not functional defects; the feature is correct as implemented

ARCHITECTURE BOUNDARY (UNCHANGED)

  Runtime / product:   src/
  ScaffoldAI PROCESS:  .scaffoldai/
  BRIDGE state:        .consync/state/  and  .consync/streams/
  Operator docs:       .consync/docs/
  AI adapter layer:    .github/  (thin — not canonical)

KNOWN REMAINING RISKS

- UX clarity gap: "idea" label and "keywords" chips are conceptually close; users may not distinguish them without better labeling or helper text. Not a defect — candidate for a follow-up UX slice.
- Grouping benefit is only visible when 2+ notes share an idea; single-idea notes look identical to no-idea notes in the current render. Low priority cosmetic gap.
- One pre-existing e2e flake on `timeline-marker-selects-inspector.spec.js` (intermittent timeout). Not introduced by this packet.

WHAT NOT TO DO NEXT

- Do NOT change bookmark storage format to accommodate ideas as first-class entities yet.
- Do NOT redesign the Notes panel layout beyond this grouping change.
- Do NOT push to main without human review of PR #3.

COMMANDS TO RUN

- `npm run check:state-preflight`
- `npm run verify`
- `npm run check:state-postflight`

HUMAN VERIFICATION

1. Open the app on `feature/product-design-electron`.
2. Navigate to the Notes section.
3. Add two standalone notes with idea "Song 3" and one note without an idea.
4. Confirm: "Song 3" section heading appears with two notes; "Other notes" section appears with one note.
5. Add a keyword filter — confirm filtering works across both grouped and ungrouped notes.
6. Add a note with a different idea (e.g. "Chapter 4") — confirm two idea sections appear in alphabetical order.
7. Delete all notes with ideas — confirm "Other notes" heading disappears.

RECOMMENDED NEXT SAFE ACTION

Stabilization observation. Session closed cleanly. Next product slice options (small):
- `notes-panel-ux-clarity-v1` — improve label, helper text, and idea visibility to reduce keyword/idea confusion (UI-only, no storage changes)
- `note-delete-from-notes-panel-v1` — delete button on standalone notes (bridge: deleteBookmark already available)
- `audio-hotkey-marker-v1` — fast keyboard shortcut for dropping a marker (no UI redesign)

Do not push to main without human review of PR #3.
