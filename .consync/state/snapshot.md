# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package implemented the first lightweight preflight and postflight integrity checks over the four global live-state artifacts
- the current package extends that same smoke/contract model into active and paused stream-local state surfaces
- the process phase is still intentionally narrow and has not expanded into broad documentation validation

## Active Stream

- recorded active stream: `process`
- recorded foreground stream: `process`
- the global live loop is now intentionally owned by `process`

## Previous Or Paused Streams

- previous stream: `electron_ui`
- paused streams: `electron_ui`
- supporting streams: none

## Current Package

- type: `PROCESS`
- package: `expand_integrity_checks_from_core_state_to_stream_local_state`

## Current Goal / Focus

Extend the integrity-check surface so stream-local state stays coherent with the global owner model for active and paused streams.

The current package should stay narrow: shallow stream-local checks, concise PASS/FAIL output, and one narrow test surface for obvious active/paused contradictions.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package now extends those same smoke/contract checks into stream-local state without scanning broader reference docs

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- broader reference docs are still intentionally outside the integrity-check surface
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `define_artifact_role_labels_for_state_control_governance_reference_and_history`
- a later narrow package to extend the smoke/contract model further only after artifact roles are formalized more explicitly
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.