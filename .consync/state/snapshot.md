# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package added the bootstrap runbook and compact snapshot layer for new AI conversations
- the live loop has now been intentionally switched to process work so documentation/state integrity can be stabilized before more UI work continues
- `next-action.md` should now mount the first narrow documentation-integrity definition package

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
- package: `switch_active_stream_to_process_for_doc_integrity_layer`

## Current Goal / Focus

Re-anchor the live loop to the process stream so the repo can define and enforce a documentation/state integrity layer from a coherent ownership baseline.

The immediate next work is not broad implementation. It is the narrow definition package for the governed doc/state surface, integrity meaning, enforcement timing, and ownership surfaces.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the next mounted live package should continue process integrity work immediately rather than leaving the stream switch abstract

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- the documentation-integrity surface still needs to be defined before any automated checks are introduced
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `define_doc_integrity_layer_and_enforcement_points`
- a later narrow package to implement deterministic integrity checks only after the governed surface and enforcement timing are defined
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.