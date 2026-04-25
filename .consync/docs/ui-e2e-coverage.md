# Consync UI e2e Coverage Map

## Principles

- Cover user flows, not implementation details
- Prefer one strong test per behavior over many shallow tests
- Every interactive feature should have at least one e2e path
- Tests should mirror real usage (keyboard + minimal mouse)

---

## Coverage Areas

### 1. Audio Marker Flow (FOUNDATION)

STATUS: ✅ COVERED

Flow:
- Load audio fixture
- Press `B`
- Type note
- Press Enter
- Assert:
  - marker exists
  - timestamp is preserved
  - note text is persisted
  - no duplicate marker

File:
- `src/test/e2e/audio-hotkey-marker.spec.js`

---

### 2. Marker Undo (Cmd+Z)

STATUS: ☐ NOT COVERED

Flow:
- Create 2 markers
- Press Cmd+Z
- Assert:
  - last marker removed
  - previous marker still exists

---

### 3. Marker Delete (× button)

STATUS: ☐ NOT COVERED

Flow:
- Create multiple markers
- Click delete on middle marker
- Assert:
  - only that marker is removed
  - others remain

---

### 4. Empty Marker Behavior

STATUS: ☐ NOT COVERED

Flow:
- Press `B`
- Press Enter without typing
- Assert:
  - marker exists
  - label is "Untitled marker"
  - edit mode exits

---

### 5. Playback + Timestamp Accuracy

STATUS: ☐ NOT COVERED

Flow:
- Start playback
- Press `B` at known moment
- Assert:
  - timestamp format is MM:SS.mmm
  - marker timestamp is close to playback clock

---

### 6. File Notes

STATUS: ☐ NOT COVERED

Flow:
- Add file note
- Assert:
  - appears in File Notes section
  - not added as timeline marker

---

### 7. Editing State Indicator

STATUS: ☐ NOT COVERED

Flow:
- Press `B`
- Assert:
  - "Editing marker" indicator appears on correct row
- Press Enter
- Assert:
  - indicator disappears

---

### 8. Audio Load (Fixture Path)

STATUS: ☐ PARTIAL

Flow:
- Click "Choose MP3"
- Assert:
  - fixture file name appears
  - playback controls enabled

---

## Notes

- All tests must run with:
  `CONSYNC_E2E_AUDIO_FIXTURE=1`
- Avoid native dialogs in tests
- Prefer keyboard-driven flows where possible
