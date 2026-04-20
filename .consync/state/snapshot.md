# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package restyled the Electron renderer so the timeline is visually primary
- `handoff.md` currently records that renderer restyle package as `PASS`
- `next-action.md` currently mounts a new process package: `create_runbook_and_snapshot_bootstrap_docs`

## Active Stream

- recorded active stream: `electron_ui`
- recorded foreground stream: `electron_ui`
- live owner note still says `electron_ui` owns `next-action.md` and `handoff.md`

## Previous Or Paused Streams

- previous stream: `process`
- paused streams: `process`
- supporting streams: none

## Current Package

- type: `PROCESS`
- package: `create_runbook_and_snapshot_bootstrap_docs`

## Current Goal / Focus

Create a thin bootstrap pair for future AI conversations:

- `.consync/docs/runbook.md` for operating rules and decision logic
- `.consync/state/snapshot.md` for compact current-state re-entry

The immediate goal is to make cold-start AI sessions more consistent without broadening into a full process rewrite.

## Current Loop State

- the live loop is open because a new package is mounted in `next-action.md`
- the repo is between streams conceptually: active-stream metadata still points to `electron_ui`, but the mounted package is process-oriented bootstrap work
- this is workable for the current package, but it should be reconciled intentionally rather than left implicit

## Known Tensions Or Pending Decisions

- stream ownership and live package type do not currently line up perfectly
- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- bootstrap docs should stay thin and practical instead of turning into a new meta-framework
- any deterministic documentation integrity checks should come later, after stream ownership is clarified

## Next Likely Packages

- reconcile whether this bootstrap-doc package is a one-off process support slice inside the UI stream or the start of a formal process-stream return
- lightly link the new runbook from one existing system doc if that pointer is still useful after this package lands
- add deterministic documentation integrity checks only after the active stream situation is intentionally reconciled

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.