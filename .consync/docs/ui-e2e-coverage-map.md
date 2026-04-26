# UI e2e Coverage Map

Audited: 2026-04-25 (updated 2026-04-26)
Suite: `src/test/e2e/` — 18 tests, 18 passing

---

## Current Test List

| File | Test Name | Category |
|---|---|---|
| `audio-hotkey-marker.spec.js` | Persists typed note text for the hotkey marker Enter flow in Electron | regression |
| `audio-empty-marker.spec.js` | Preserves empty markers and allows the next hotkey marker after Enter | regression |
| `audio-load.spec.js` | Loads the deterministic fixture audio through the Choose MP3 flow | smoke |
| `audio-marker-delete.spec.js` | Removes only the targeted middle marker with the row delete button | regression |
| `audio-marker-persist-reload.spec.js` | Marker and audio state persist after reloading the Electron window | integration |
| `audio-marker-undo.spec.js` | Removes the most recently created marker with Cmd+Z in the audio workspace | regression |
| `audio-multiple-markers.spec.js` | Creates multiple markers and renders them in stable insertion order | regression |
| `audio-playback-toggle.spec.js` | Toggles playback on and off through the visible native audio control | smoke |
| `audio-seek-to-marker.spec.js` | Clicking seek to marker positions the audio player at the marker timestamp | regression |
| `audio-file-note.spec.js` | Creates a file note that appears in the File Notes section and not in Timeline Markers | regression |
| `audio-marker-timestamp.spec.js` | Marker timestamp label matches the expected MM:SS.mmm format for the captured position | regression |
| `audio-recent-audio.spec.js` | Fixture file appears in Recent Audio list after loading via Choose MP3 | smoke |
| `search-panel-smoke.spec.js` | Search panel is reachable and primary controls are visible | smoke |
| `search-panel-input.spec.js` | Search panel input values are preserved and run search produces stable grouped results | regression |
| `inspector-empty-state.spec.js` | Inspector Panel renders empty state on initial load with no bookmarks | smoke |
| `inspector-marker-selection.spec.js` | Clicking a timeline marker updates the Inspector Panel to show Selected Marker details | regression |
| `inspector-latest-bookmark.spec.js` | Inspector Panel shows Latest Bookmark state when a bookmark exists and no marker is selected | smoke |
| `timeline-empty-state.spec.js` | Timeline View renders default state with all track lanes visible | smoke |

---

## Covered UI Surfaces

| Surface | Coverage | Notes |
|---|---|---|
| Audio load via Choose MP3 | ✅ Full | fixture seam, file name, audio element, playback clock |
| Hotkey marker creation (`B`) | ✅ Full | real keyboard, note input focus, note saved |
| Empty marker creation | ✅ Full | `Untitled marker` label, edit mode exit, next `B` creates new marker |
| Marker ordering (multiple) | ✅ Full | 3 markers in stable insertion order |
| Marker delete (× button) | ✅ Full | targeted row delete, others remain |
| Marker undo (Cmd+Z) | ✅ Full | removes most recent only |
| Marker persistence after reload | ✅ Full | bookmarks rehydrated from disk on mount |
| Audio path restoration after reload | ✅ Full | `lastAudioFile` restored from main-process memory |
| Native playback toggle | ✅ Smoke | play + pause through visible native control, DOM media state |
| Seek to marker | ✅ Full | click seek button → playback clock matches marker timestamp |
| File Notes (non-timeline bookmarks) | ✅ Full | Add Note path, `timeSeconds: null` bookmark, File Notes section, not in Timeline Markers |
| Marker timestamp label accuracy | ✅ Full | `MM:SS.mmm` format verified; captured `currentTime` matches rendered label |
| Recent audio list | ✅ Full | file appears after load, active state class set, empty-state message gone |
| Search panel navigation | ✅ Smoke | Search button click opens panel; heading, root input, query input, Run Mock Search button visible |
| Search panel input + results | ✅ Full | fill inputs, run search, assert query value, group session titles, match artifact rows; click match row, assert inspector updates |
| Inspector panel empty state | ✅ Smoke | No Selection Yet heading, empty-state copy, Hint panel — verified on cold load with empty session |
| Inspector panel marker selection | ✅ Full | Click timeline marker seek button → Inspector transitions from Latest Bookmark to Selected Marker; note text confirmed |
| Inspector panel latest bookmark | ✅ Smoke | Session with one seeded bookmark, no explicit selection → Latest Bookmark heading and note text confirmed |
| Timeline View default state | ✅ Smoke | Navigate via Open Timeline button; assert eyebrow, Session Timeline heading, all 4 track lane labels, ruler start/end |

---

## Partially Covered UI Surfaces

| Surface | Gap | Notes |
|---|---|---|
| Active marker highlight | ☐ Not asserted | `bookmark-item-active` class applied during playback; not asserted in any test |

---

## Untested UI Surfaces

| Surface | Notes |
|---|---|
| Timeline view (Session Timeline panel) | Lane content with bookmark entries is not tested |
| Search panel (Reveal in Finder) | Reveal in Finder path after selecting a match is not tested in e2e |
| Session sidebar | Current file, bookmark count, latest note — not asserted in e2e |
| Full app restart path | Audio path and bookmarks after a full cold start (not just window reload) |
| Error states | Audio load error, session error panel — no test covers failure paths |

---


## Notes

- All tests use `CONSYNC_E2E_AUDIO_FIXTURE=1` and a deterministic temp session dir.
- Preload changes require `npm run build:preload` before e2e reflects them.
- Run `npm run test:e2e` for UI_CHECK, `npm run verify:full` for FULL_VERIFY.
- See `.consync/docs/verification-ladder.md` for level definitions.
