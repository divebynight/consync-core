# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package extended the lightweight integrity checks from global live-state artifacts into active and paused stream-local state
- the current package defines a compact artifact-role model so validation can be reasoned about by role and risk instead of file format alone
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
- package: `define_artifact_role_labels_for_state_control_governance_reference_and_history`

## Current Goal / Focus

Define a small artifact-role model so the repo can reason about operational files by role and apply stronger validation expectations to process/governance surfaces than to ordinary feature work.

The current package should stay compact and definitional: five useful roles, validation tiers by role, cross-role expectations, and a practical mapping of current artifacts.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package now defines the role model that explains why some artifact surfaces deserve stronger validation than others

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- the exact trigger rules for light versus heavy integrity checks still need a later narrow package
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `scope_integrity_check_triggers_by_artifact_role_and_stream`
- a later narrow package to use the role model for deciding when light versus heavy integrity checks should run
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.