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

Current direction: preserve the Notes-first workflow and add Ideas only as an optional layer that can attach to existing notes later.

Next narrow slice: define the smallest Ideas surface that works with current standalone notes without redesigning the UI or refactoring bookmark/session storage.
