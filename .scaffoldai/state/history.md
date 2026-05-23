# ScaffoldAI State History

## Purpose

`.scaffoldai/state/history.jsonl` provides a minimal append-only audit trail for ScaffoldAI state transitions.

This is **observational history only**:
- It does NOT become source of truth
- It does NOT validate transitions
- It does NOT participate in decision-making
- It only records what happened

## Record Format

Each line is a JSON object with these fields:

### Required Fields

- `timestamp` (string) — ISO 8601 timestamp, automatically generated
- `operation` (string) — "mount" | "close" | "switch"
- `surface` (string) — "cli" | "mcp-local" | "mcp-https" | "unknown"
- `summary` (string) — One-line human-readable summary

### Optional Fields

- `stream` (string) — Stream name (e.g., "process", "electron_ui")
- `package` (string) — Package name
- `status` (string) — "PASS" | "FAIL" (close operations only)

## Example Records

```jsonl
{"timestamp":"2026-05-13T01:23:45.678Z","operation":"mount","surface":"cli","stream":"electron_ui","package":"add_electron_timeline","summary":"mounted: add_electron_timeline"}
{"timestamp":"2026-05-13T02:45:10.123Z","operation":"close","surface":"cli","stream":"electron_ui","package":"add_electron_timeline","status":"PASS","summary":"closed: add_electron_timeline (PASS)"}
{"timestamp":"2026-05-13T03:12:30.456Z","operation":"switch","surface":"cli","stream":"process","summary":"switched from electron_ui to process"}
{"timestamp":"2026-05-13T04:20:15.789Z","operation":"close","surface":"cli","stream":"process","package":"fix_gatekeeper_validation","status":"FAIL","summary":"closed: fix_gatekeeper_validation (FAIL)"}
{"timestamp":"2026-05-13T05:30:00.012Z","operation":"close","surface":"cli","stream":"process","package":"fix_gatekeeper_validation","status":"PASS","summary":"closed (reconciliation): fix_gatekeeper_validation (PASS)"}
```

## Write Pattern

History is appended **after successful state writes** in:
- `gatekeeperMount.executeMountWrites()`
- `gatekeeperClose.executeCloseWritesA()` (normal close)
- `gatekeeperClose.executeCloseWritesB()` (reconciliation close)
- `gatekeeperSwitch.executeSwitchWrites()`

All appends go through `scaffoldaiState.appendHistory()` — the single approved write boundary.

## Failure Behavior

If history append fails (e.g., filesystem error), the operation continues:
- State writes are **not** rolled back
- A warning is printed to console
- History failure does **not** block the transition

This ensures history remains observational and never becomes a critical dependency.

## Reading History

History is **not read** by gatekeeper logic or state validation.

Intended use cases:
- Debugging state transitions
- Auditing who/when/what changed
- Understanding sequence of operations
- Building timeline views (future CLI/MCP tools)

## Implementation

- **Gateway**: `src/lib/scaffoldaiState.state.scaffoldai.js` — `appendHistory(rootPath, record)`
- **Mount**: `src/lib/gatekeeperMount.auth.scaffoldai.js` — appends after mount writes
- **Close**: `src/lib/gatekeeperClose.auth.scaffoldai.js` — appends after close writes (both modes)
- **Switch**: `src/lib/gatekeeperSwitch.auth.scaffoldai.js` — appends after switch writes
- **Tests**: `src/test/unit-scaffoldai-history.test.js` — 7 test scenarios

## What This Is NOT

- Not a sequence/version system
- Not a locking mechanism
- Not stale-state rejection
- Not workflow orchestration
- Not source of truth
- Not smart state

This is minimal append-only observation only.
