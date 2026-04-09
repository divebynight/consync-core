# Marker Capture (v0)

## Status
- NEW
- Experimental feature slice inside consync-core
- Scoped intentionally small (signal capture only)

## Purpose
Capture early creative “signal moments” with minimal friction.

This is not a memory system.  
This is not behavioral tracking.

This is:
explicit user-marked moments of interest

## Core Principle
Notice → Mark → Continue

## Feature
Command: mark "<note>"  
Alias: m "<note>"

## Behavior
1. Accept note from CLI argument
2. Ask to attach files (y/n)
3. Allow multiple file paths
4. Save marker
5. Exit

## Data Model
{
  "id": "marker_<timestamp>_<shortid>",
  "timestamp": "ISO string",
  "note": "string",
  "files": []
}

## Storage
- sandbox/current/markers/
- Append to .consync/state/events.log

## Testing
- Basic marker (no files)
- Marker with files
- Validate JSON structure

## Non-Goals
- No behavioral tracking
- No timing metrics
- No AI analysis

## Next
- list markers
- show marker
- pattern analysis later

## Success
- Fast
- Minimal friction
- Useful signals
