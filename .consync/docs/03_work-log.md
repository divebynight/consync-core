## 2026-04-23 — Audio Note Workspace

- Added an in-app audio review flow so a local MP3 can be opened, played, and annotated inside the workspace shell.
- Split saved context into file-level notes and time-based markers while keeping one shared bookmark system underneath.
- Added active marker highlighting, click-to-seek on markers, and a lightweight recent-audio list for faster switching between files.

Observation:
- Consync now feels more like a working review surface for audio sessions instead of a static shell. The user can reopen context, jump to moments, and switch files with much less friction.

Notes:
- Recent audio is still in-memory only, so it resets when the app restarts.

## 2026-04-24 — Closeout Workflow + Transitioned State Checks

- Added a reusable closeout-agent workflow for verifying tests, docs, integrity, and commit readiness after approved work.
- Added a runbook pointer so future operators can invoke the closeout workflow without relying on chat memory.
- Updated state integrity checks so transitioned state can be valid when the last handoff is complete and a new package is already mounted.

Observation:
- Consync closeout now behaves more like a real operating loop: completed work can stay recorded in handoff while the next package becomes live without tripping postflight unnecessarily.

Notes:
- The stricter handoff-contract checker is unchanged, so package-to-handoff matching rules outside the state integrity path still remain explicit.

## 2026-04-24 — Ingestion Gatekeeper

- Added a reusable ingestion-gatekeeper workflow for deciding whether external context belongs in Consync and where it should go.
- Added a runbook pointer so future intake can be classified before notes, plans, or discussions are written into the system.
- Established conservative placement rules for future plans, process observations, completed behavior, and off-topic material.

Observation:
- Consync can now preserve useful outside context without treating every conversation as durable truth. Intake decisions are lighter and more deliberate.

Notes:
- Raw discussion storage is still optional and should be used only when the material is worth preserving but not yet shaped enough for a durable doc.

## 2026-04-24 — Source-Of-Truth Boundaries

- Established `.consync/` as the authoritative Consync process layer for state, docs, prompts, skills, and gatekeeping workflows.
- Added `AGENTS.md` as the Codex entry point and updated `.github` guidance to behave as a thin Copilot/GitHub adapter layer.
- Repointed GitHub-facing prompts back to `.consync` so workflow authority is clearer and less duplicated.

Observation:
- Consync now has a cleaner process boundary: `.consync` defines how the system works, while tool-specific surfaces point back to it instead of competing with it.

Notes:
- Existing `.github/agents/*` files were left in place for now; the boundary is clarified first so later cleanup can be based on actual usage.

### audio_hotkey_marker_drop

SUMMARY
- Added a `B` hotkey to drop a timestamp marker at the current playback time without interrupting playback.
- The marker is set as active and the note input is focused immediately.
- The implementation reuses the existing bookmark/marker flow instead of introducing a new system.

FILES
- src/electron/renderer/App.jsx
- src/core/session.js
- src/test/app-search-flow.test.jsx
- src/test/core-session.js

TESTS
- node src/test/core-session.js → PASS
- npm run test:ui-search → PASS

FRICTION
- After pressing `B`, the note input stays focused, requiring manual blur to continue rapid marker capture.
- This behavior is logical but introduces slight friction for fast “listen + mark” workflows.

DECISION
- Keep current behavior.
- This implementation prioritizes immediate note-taking after marker creation.
- Revisit if rapid capture becomes a primary workflow or conflicts with future features.

FOLLOW-UP
- Consider allowing the focused note input to edit the just-dropped marker directly.

### bind_note_input_to_active_marker

SUMMARY
- Bound the note input to the marker created by the `B` hotkey so typing and pressing Enter updates that same marker instead of creating a duplicate at a later timestamp.
- The marker timestamp is now owned by the hotkey event, not the save action.

FILES
- src/electron/renderer/App.jsx
- src/core/session.js
- src/electron/renderer/bookmark-flow.mjs
- src/electron/shared/ipc-channels.js
- src/electron/preload/bridge.js
- src/electron/main/ipc.js
- src/test/app-search-flow.test.jsx
- src/test/core-session.js
- src/test/renderer-bookmark-flow.js
- src/test/desktop-scaffold.js

TESTS
- node src/test/core-session.js → PASS
- node src/test/renderer-bookmark-flow.js → PASS
- node src/test/desktop-scaffold.js → PASS
- npm run test:ui-search → PASS

FRICTION
- After pressing `B`, the note input remains focused.
- Pressing `B` again inserts the character `b` instead of dropping another marker.
- This is correct for text input behavior but introduces friction for rapid “listen + mark” workflows.

DECISION
- Keep current behavior.
- Prioritize safe text editing over rapid repeated marker capture while input is focused.
- Treat this as a UX tradeoff rather than a bug.

FOLLOW-UP
- Consider adding a clear “exit edit mode” action (e.g., `Esc`).
- Consider a future capture mode or alternate interaction for rapid marker dropping while editing.
- Consider a visible “editing marker” state to clarify that Enter updates an existing marker.

### audio_timing_and_hotkey_flow

SUMMARY
- Added millisecond precision to playback time and marker labels.
- Introduced a playback clock near the audio player to display precise timing.
- Refined hotkey marker flow:
  - `B` captures timestamp
  - note input focuses
  - Enter updates the same marker
  - Enter exits edit mode
- Ensured timestamps are owned by the hotkey event, not by the save action.

FILES
- src/electron/renderer/App.jsx
- src/electron/renderer/styles.css
- src/core/session.js
- src/electron/renderer/bookmark-flow.mjs
- src/electron/shared/ipc-channels.js
- src/electron/preload/bridge.js
- src/electron/main/ipc.js
- src/test/app-search-flow.test.jsx
- src/test/core-session.js
- src/test/renderer-bookmark-flow.js
- src/test/desktop-scaffold.js

TESTS
- npm run test:ui-search → PASS
- node src/test/core-session.js → PASS
- node src/test/renderer-bookmark-flow.js → PASS

FRICTION
- Native audio player displays time in whole seconds while Consync displays milliseconds.
- Duplicate time displays (player + custom clock) create slight visual redundancy.
- Pressing `B` while input is focused inserts `b`, which is correct but slightly conflicts with rapid capture expectations.

DECISION
- Keep native audio controls unchanged.
- Use Consync-owned playback clock for millisecond precision.
- Do not build a custom audio player at this stage.
- Prioritize stability and iteration speed over UI consolidation.

FOLLOW-UP
- Evaluate whether both time displays are needed or if one should become primary.
- Consider a visible “editing marker” state.
- Consider future UX improvements for rapid capture (e.g., Esc to exit edit mode, capture mode, or alternate hotkey behavior).
- Potential future features: quick delete, undo last marker.

### undo_last_marker_hotkey

SUMMARY
- Added `Cmd+Z` support to remove the most recently created marker in the audio workspace.
- Enables fast correction during rapid marker capture without requiring UI interaction.
- Preserves normal text undo behavior when the note input is focused.

FILES
- src/core/session.js
- src/electron/shared/ipc-channels.js
- src/electron/preload/bridge.js
- src/electron/main/ipc.js
- src/electron/renderer/bookmark-flow.mjs
- src/electron/renderer/App.jsx
- src/test/core-session.js
- src/test/renderer-bookmark-flow.js
- src/test/desktop-scaffold.js
- src/test/app-search-flow.test.jsx

TESTS
- npm run test:ui-search → PASS
- node src/test/core-session.js → PASS
- node src/test/renderer-bookmark-flow.js → PASS
- node src/test/desktop-scaffold.js → PASS

FRICTION
- Undo currently applies only to marker creation and not to note edits or other actions, which may create an expectation mismatch with typical undo behavior.

DECISION
- Keep undo scoped to “last marker created” only.
- Do not introduce a full undo stack at this stage.
- Prioritize speed and simplicity over completeness.

FOLLOW-UP
- Evaluate whether note edits should ever be included in undo behavior.
- Consider adding redo (`Cmd+Shift+Z`) if undo scope expands.
- Future feature: delete specific marker via UI.

### delete_specific_marker_ui

SUMMARY
- Added a per-marker delete control (`×`) to each marker row.
- Allows direct removal of individual markers without affecting others.
- Deletion operates by marker ID, not timestamp.

FILES
- src/electron/renderer/App.jsx
- src/electron/renderer/styles.css
- src/test/app-search-flow.test.jsx

TESTS
- npm run test:ui-search → PASS

FRICTION
- The delete control is small and may be harder to target as marker density increases.
- Immediate deletion (no confirmation) could lead to accidental removal if misclicked.

DECISION
- Keep deletion immediate and lightweight.
- Rely on `Cmd+Z` as the safety net.
- Avoid confirmation dialogs to preserve speed and flow.

FOLLOW-UP
- Consider enlarging or repositioning the delete control if marker density increases.
- Consider a slightly more structured row action area in the future.
- Evaluate whether visual affordances (hover state, spacing) should improve click confidence.

### ui_e2e_coverage_map

SUMMARY
- Added an authoritative UI e2e coverage map to define the intended Playwright coverage surface for Consync.
- Connects the new Playwright/Electron test harness to future UI work so features expand against a visible plan instead of ad-hoc tests.
- Establishes the current “must not break” interaction set, with the audio hotkey marker flow as the foundation path.

FILES
- .consync/docs/ui-e2e-coverage.md
- .consync/docs/03_work-log.md

TESTS
- None

FRICTION
- Coverage planning is now explicit, but most identified user flows are still intentionally uncovered and will need to be added one by one.

DECISION
- Keep the map minimal and authoritative.
- Use it to guide future Playwright additions without broadening scope or adding shallow tests.

FOLLOW-UP
- Add new e2e cases only from the listed coverage areas as future UI behavior is expanded or hardened.

### marker_undo_e2e

SUMMARY
- Added a Playwright Electron e2e test to protect `Cmd+Z` marker undo behavior in the real audio workspace.
- Uses real keyboard interaction against the live UI instead of state simulation, so the create → create → undo flow is verified end to end.
- Extends the coverage map with the next required behavior after the foundational hotkey marker flow.

FILES
- src/test/e2e/audio-marker-undo.spec.js
- .consync/docs/03_work-log.md

TESTS
- npm run test:e2e → PASS

FRICTION
- The real hotkey loop has an important nuance: creating two markers reliably requires `B → Enter → B → Enter`, because `B` focuses the note input and a second raw `B` should not create another marker while typing.

DECISION
- Keep the test aligned with the actual supported keyboard workflow rather than forcing a simplified shortcut path.
- Treat this as behavior coverage, not a UI change.

FOLLOW-UP
- Add the next e2e cases from the coverage map one user flow at a time, starting with delete or empty-marker behavior.

### marker_delete_e2e

SUMMARY
- Added a Playwright Electron e2e test to protect the per-marker delete (`×`) flow in the real audio workspace.
- Verifies deletion by targeted row action rather than timestamp assumptions, so only the clicked marker is removed.
- This extends coverage across the core marker lifecycle and helps complete create / edit / undo / delete behavior protection.

FILES
- src/test/e2e/audio-marker-delete.spec.js
- .consync/docs/03_work-log.md

TESTS
- npm run test:e2e → PASS

FRICTION
- The test relies on the supported hotkey/finalize loop to create visible markers first, which keeps it faithful to real usage but makes the setup a little longer than a direct state-driven test.

DECISION
- Keep the test scoped to one real delete flow only.
- Verify deletion through row-local UI action, not internal IDs or direct session mutation.

FOLLOW-UP
- Continue adding coverage from the map one user flow at a time, with empty-marker and fixture-load behavior as likely next candidates.

### empty_marker_e2e

SUMMARY
- Added a Playwright Electron e2e test to protect empty marker behavior in the real audio workspace.
- Verifies that empty input preserves the marker, defaults the visible label to `Untitled marker`, and exits edit mode correctly.
- Confirms the next `B -> Enter` creates a second marker instead of reusing the previous one.

FILES
- src/test/e2e/audio-empty-marker.spec.js
- .consync/docs/03_work-log.md

TESTS
- npm run test:e2e → PASS

FRICTION
- This flow is simple in the UI, but it is easy to regress because it depends on both marker persistence and clean exit from edit mode.

DECISION
- Keep this covered through real keyboard interaction only.
- Treat visible `Untitled marker` output as the authoritative user-facing assertion.

FOLLOW-UP
- Continue filling the coverage map one user flow at a time, with fixture-load and timestamp-accuracy behavior as likely next additions.

### audio_load_e2e

SUMMARY
- Added a Playwright Electron e2e test to verify the fixture-based audio load step itself.
- Confirms the real `Choose MP3` interaction loads the deterministic fixture without using the native file picker.
- Verifies the UI is ready for follow-on marker work by checking visible load-state surfaces only.

FILES
- src/test/e2e/audio-load.spec.js
- .consync/docs/03_work-log.md

TESTS
- npm run test:e2e → PASS

FRICTION
- The load flow depends on the deterministic fixture seam and Electron/Playwright harness staying aligned, so this test is as much infrastructure protection as UI coverage.

DECISION
- Keep the assertions user-facing and minimal: file name, playback UI, playback clock, and timeline markers visibility.
- Do not expand this test into marker interaction coverage.

FOLLOW-UP
- Continue from the coverage map with timestamp-accuracy behavior or other remaining uncovered flows.

### audio_playback_toggle_e2e

SUMMARY
- Added a Playwright Electron e2e test to verify that the visible native playback control can start and then pause loaded audio.
- Uses the deterministic fixture seam and real user interactions only: `Choose MP3` plus native control clicks.
- Protects the playback-toggle path even though the current UI does not expose a dedicated visible play/pause indicator.

FILES
- src/test/e2e/audio-playback-toggle.spec.js
- .consync/docs/03_work-log.md

TESTS
- npm run test:e2e → PASS

FRICTION
- The current UI does not expose a stable visible play/pause state, so the test relies on the real DOM media element state after interacting with the visible native control.

DECISION
- Keep the coverage focused on real interaction and stable behavior rather than adding test-only UI.
- Use DOM media state as the strongest available assertion until a user-facing play/pause indicator exists.

FOLLOW-UP
- If playback status becomes more important in the workspace, consider a small renderer-owned visible state near the playback clock.
