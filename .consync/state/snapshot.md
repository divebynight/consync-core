# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package defined a compact artifact-role model so validation can be reasoned about by role and risk instead of file format alone
- the current package defines a compact trigger model for when validation should stay light and when it should escalate to elevated or heavy expectations
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
- package: `scope_integrity_check_triggers_by_artifact_role_and_stream`

## Current Goal / Focus

Define a small trigger model so the repo can choose light, elevated, or heavy validation expectations based on artifact role, stream type, and package character.

The current package should stay compact and definitional: three trigger levels, simple selection rules, a small decision table, and clear escalation rules for state, control, and governance changes.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package now defines the trigger rules that explain when stronger validation should apply

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- the next implementation package should apply the trigger model to practical loop operation without turning every package into a heavy process ceremony
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `apply_integrity_trigger_model_to_live_loop_commands_and_closeout`
- a later narrow package to use the trigger model during real package execution and closeout guidance
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.