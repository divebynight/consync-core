TYPE: REFACTOR
PACKAGE: NONE

No active in-flight packet. Refactor `scaffoldai-bridge-migration-v1` completed and verified on 2026-05-03. ScaffoldAI bridge state (state/, streams/, packets/) now lives under `.scaffoldai/`. `.consync/` retains product content only.

Completed work on `feature/product-design-electron`:
- `process-zone-migration-v1` — moved 9 PROCESS dirs from `.consync/` to `.scaffoldai/`; all references updated; verification PASS
- `wire-handoff-bundle-into-verify-v1` — handoff bundle integration test wired; path-boundary regression added; verification PASS
- `ideas-grouping-in-notes-panel-v1` — standalone notes now group by idea in Notes panel; pure logic extracted to notes-panel.mjs; 8-scenario unit test wired into verify; manual UX validation done
- `scaffoldai-bridge-migration-v1` — `.consync/state/`, `.consync/streams/`, `.consync/packets/` moved to `.scaffoldai/`; 27 path references updated across runtime, tests, scripts, and docs; verification PASS

System is stable. Next work package will be mounted intentionally by human decision.

Candidate next slices:
- `notes-panel-ux-clarity-v1` — label + helper text improvements for idea vs keyword clarity
- `note-delete-from-notes-panel-v1` — delete button on standalone notes
- `audio-hotkey-marker-v1` — fast keyboard shortcut for dropping a playback marker
