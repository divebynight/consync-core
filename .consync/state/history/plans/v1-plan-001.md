# Consync V1 Plan — 001

---

## Goal

Implement only the V1 `new-guid` CLI described in `agent-handoff.md`, using:

- Current working directory as the base for artifacts and logs
- Minimal macOS clipboard support via `pbcopy`

Keep the shape small and focused:
- Thin CLI entry point
- One `new-guid` command module
- A few reusable helpers under `lib`

Follow the reusable-function requirement from `consync_v1_spec.md`.

---

## Implementation Plan

### CLI Entry Point

- Add a thin entry point under `src`
- Accept only the `new-guid` command
- Immediately delegate to the command module
- Keep argument parsing, exit codes, and error handling out of business logic

---

### Command Module

- Add a new module under `commands`
- Prompt for:
  - project
  - type
  - note
  - tags
- Normalize tags into a trimmed array
- Call a reusable `newGuidTool(input)` function
- Print:
  - created file path
  - GUID

---

### Helpers (lib)

Add small, focused helpers under `lib`:

- UUID v4 generation
- Timestamp formatting
- File write + append-only event logging
- Clipboard copy via `pbcopy`

---

### Paths & Storage

- All paths rooted at `process.cwd()`
- Artifact path logged as:

```
./timestamp.json
```

- `.consync/state/events.log` created if missing
- No repo-root assumptions

---

### Reusable Function Contract

The reusable function must return:

```
{
  "guid": "...",
  "created_at": "...",
  "filePath": "...",
  "json": { ... }
}
```

---

## Manual Verification

Run the command twice and verify:

- Timestamped JSON file is created
- JSON structure is correct
- UUID format is valid
- Timestamp is ISO format
- Clipboard contains JSON
- Console output shows file path + GUID
- `.consync/state/events.log` appends correctly (no overwrite)

---

## Relevant References

- `agent-handoff.md` — feature contract and scope boundaries
- `consync_v1_spec.md` — cwd behavior, logging expectations, reusable contract
- `src/` — CLI entry point
- `commands/` — new-guid module
- `lib/` — reusable helpers
- `server.js` — reference for thin interface + factored logic

---

## Decisions

- Use current working directory (not repo root)
- Use macOS `pbcopy` (no dependencies)
- Keep implementation minimal

---

## Explicitly Excluded

- Package setup
- Additional commands
- Cross-platform clipboard support
- README updates
- Extra validation
- Any features beyond the handoff scope