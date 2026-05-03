TYPE: FEATURE
PACKAGE: ideas-grouping-in-notes-panel-v1

STATUS

PASS

SUMMARY

Implemented grouped rendering of standalone notes by idea in the Notes panel. Pure grouping logic extracted to a new `notes-panel.mjs` module following the existing renderer `.mjs` pattern. Notes with ideas render under named section headings (alphabetical). Notes without ideas render under "Other notes" (heading suppressed when all notes have ideas). Filter-then-group order preserved. No storage format changes. No new bridge calls.

Branch: `feature/product-design-electron`

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
