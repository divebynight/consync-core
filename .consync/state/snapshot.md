# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package defined a compact trigger model for when validation should stay light and when it should escalate to elevated or heavy expectations
- the current package wires that trigger model into the live loop so operators can see the trigger level and required checks directly during package execution
- the process phase remains definition-focused here and still does not implement broader repo-wide validation

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
- package: `apply_integrity_trigger_model_to_live_loop_commands_and_closeout`

## Current Goal / Focus

Wire the trigger model into the practical live loop so operators can tell which validation level applies and which checks to run before execution and before accepting closeout.

The current package should stay compact and operational: expose the trigger level in the live loop, define the required preflight and postflight checks, and keep heavier review expectations explicit without turning ordinary work into bureaucracy.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package now applies the trigger rules to the operator-facing loop and template surfaces

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- the next stream switch should preserve the new trigger-aware loop without making ordinary UI work feel heavy
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `resume_electron_ui_stream_with_integrity_aware_loop`
- a stream-switch package that returns the live loop to `electron_ui` while preserving `light` validation as the normal default for ordinary UI work
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.