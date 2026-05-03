# Stream

- id: electron_ui
- title: Electron UI Behavior + Testing
- status: active
- owner: human
- mode: build
- summary: active — Notes-first product workflow completed; next mounted package: ideas_foundation_from_notes_first_workflow

## Active Checkpoint

Current branch: `feature/product-design-electron`

Recent completed product slices:

- standalone note creation
- local keyword suggestions from note content
- accepted keyword persistence
- keyword-based note filtering
- explicit `kind: "standalone-note"` marker with legacy filePath fallback

Current direction: Notes-first workflow is stable. Ideas layer is now present as an optional grouping surface on the Notes panel.

## Completed Slices

- `ideas-grouping-in-notes-panel-v1` (2026-05-02): Standalone notes in the Notes panel now render grouped by their optional `idea` field. Notes with ideas appear under named section headings (alphabetical). Notes without ideas appear under "Other notes" (heading suppressed if all notes have ideas). Pure grouping logic extracted to `notes-panel.mjs` following existing `.mjs` pattern. 8-scenario unit test wired into verify. Session storage format unchanged. No new bridge calls.

## Next Possible Slices (small)

- `note-delete-from-notes-panel-v1` — add a delete button to standalone notes in the Notes panel (requires bridge: deleteBookmark, already used for timeline markers)
- `idea-rename-in-notes-panel-v1` — allow editing the idea label on an existing standalone note (requires bridge: updateBookmark)
- `audio-hotkey-marker-v1` — fast keyboard shortcut for dropping a marker during playback (no UI redesign)

Next narrow slice: choose one of the above after stabilization observation.
