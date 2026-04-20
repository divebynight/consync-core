# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package defined explicit contracts for the core live-state artifacts
- the current package implements the first lightweight preflight and postflight integrity checks over the global live-state surface
- the process phase has now moved from definition-only rules into the first narrow enforcement slice

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
- package: `implement_preflight_and_postflight_doc_integrity_checks`

## Current Goal / Focus

Implement the first lightweight integrity checks so the repo can validate core live-state coherence before package execution and again before accepting closeout.

The current package should stay narrow: one small preflight check, one small postflight check, concise PASS/FAIL output, and minimal operator guidance for when to run them.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package now implements the first smoke/contract checks over the four core global live-state artifacts

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- stream-local state is still outside the first implementation surface and should only be covered later
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `expand_integrity_checks_from_core_state_to_stream_local_state`
- a later narrow package to extend the same smoke/contract model beyond the four global artifacts without scanning broader reference docs
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.