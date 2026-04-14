# Consync V1 Plan — 002

Status: reviewed  
Supersedes: v1-plan-001.md

---

## Goal

Implement only the V1 `new-guid` CLI described in `agent-handoff.md`, using:

- Current working directory as the base for artifacts and logs
- Minimal macOS clipboard support via `pbcopy`

Keep the implementation extremely small, explicit, and testable.

---

## Scope (Strict)

This step includes ONLY:

- One CLI command: `new-guid`
- One JSON artifact per run
- One append-only log entry per run
- Clipboard copy (non-blocking)

Do NOT implement:
- Additional commands
- Config systems
- Cross-platform support
- Metadata schemas beyond what is required
- Any future-facing abstractions

---

## Implementation Plan

### CLI Entry Point (`src/index.js`)

- Accept a single command: `new-guid`
- Delegate immediately to the command module
- Handle:
  - unknown command → print message and exit
  - top-level errors → print and exit
- Do NOT include business logic here

---

### Command Module (`commands/new-guid.js`)

- Prompt for a single optional input:
  - `note` (allow empty input)

- Call a reusable function:

```
newGuidTool({ note })
```

- Print to console:
  - file path
  - GUID

---

### Reusable Function (`lib/newGuidTool.js`)

This function performs all core logic:

1. Generate UUID v4
2. Generate ISO timestamp
3. Construct JSON object:

```
{
  "guid": "...",
  "created_at": "...",
  "note": "..."
}
```

4. Determine file paths using `process.cwd()`:
   - Artifact: `./<timestamp>.json`
  - Log: `./.consync/state/events.log`

5. Ensure `.consync/state/` directory exists
6. Write JSON file
7. Append to `.consync/state/events.log` (one line per event)
8. Copy JSON to clipboard via `pbcopy` (non-blocking)

9. Return:

```
{
  guid,
  created_at,
  filePath,
  json
}
```

---

### Helpers (`lib/`)

Small, focused utilities only:

- UUID generation
- Timestamp formatting (filesystem-safe if needed)
- File write + append log
- Clipboard copy via `pbcopy`

No abstraction beyond what is necessary.

---

## Paths & Behavior

- All paths are rooted at `process.cwd()`
- Example output:

```
./20260405T123456789Z.json
./.consync/state/events.log
```

- Log entry format (single line):

```
<timestamp> new-guid <guid> ./<timestamp>.json
```

---

## Clipboard Behavior

- Use `pbcopy`
- If clipboard fails:
  - do NOT throw
  - print a warning
  - continue execution

---

## Manual Verification

Run twice:

```
node src/index.js new-guid
```

Verify:

- Two distinct JSON files created
- Valid UUID format
- Valid ISO timestamps
- JSON structure matches spec
- Clipboard contains JSON (if available)
- Console prints GUID + file path
- `.consync/state/events.log` appends (no overwrite)

---

## Relevant References

- `agent-handoff.md` — feature contract and scope boundaries
- `consync_v1_spec.md` — cwd behavior and tool contract

---

## Decisions

- Use current working directory (not repo root)
- Use macOS `pbcopy` (no dependencies)
- Use timestamp-based filenames
- Keep metadata minimal (`note` only)

---

## Explicitly Excluded

- project / type / tags fields
- cross-platform clipboard support
- config or environment systems
- additional commands
- README updates
- validation beyond basic correctness
- any speculative features