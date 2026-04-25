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
