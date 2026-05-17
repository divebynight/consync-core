# Stream

- id: electron_ui
- title: Electron UI Behavior + Testing
- status: active
- owner: human
- mode: build
- summary: active — last package: audit-scaffoldai-stream-usage-and-authority.sdc (PASS)

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

- `ideas-grouping-in-notes-panel-v1` (2026-05-03, validated): Standalone notes in the Notes panel now render grouped by their optional `idea` field. Notes with ideas appear under named section headings (alphabetical). Notes without ideas appear under "Other notes" (heading suppressed if all notes have ideas). Pure grouping logic extracted to `notes-panel.mjs` following existing `.mjs` pattern. 8-scenario unit test wired into verify. Session storage format unchanged. No new bridge calls.

  Manual UX insight: users treat the "idea" field like a short tag label rather than a category name. The current "Idea or category (optional)" label sits next to keyword chips and causes confusion — users are uncertain which surface to use for labeling notes. The grouping feature is correct as built, but a UX clarity slice is needed to make the distinction legible.

## Next Possible Slices (small)

- `notes-panel-ux-clarity-v1` — update label text, add a helper note distinguishing idea (grouping label) from keywords (searchable tags); make idea field visible on saved note cards; UI-only, no storage changes (RECOMMENDED FIRST — addresses validated confusion)
- `note-delete-from-notes-panel-v1` — add a delete button to standalone notes in the Notes panel (requires bridge: deleteBookmark, already used for timeline markers)
- `audio-hotkey-marker-v1` — fast keyboard shortcut for dropping a marker during playback (no UI redesign)
- `idea-rename-in-notes-panel-v1` — allow editing the idea label on an existing standalone note (requires bridge: updateBookmark)

Next narrow slice: mount `notes-panel-ux-clarity-v1` or choose another candidate after stabilization observation.
