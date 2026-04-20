# Consync Snapshot

## System Status

- repo state is currently clean enough to run a new package
- the most recent completed package defined the first formal documentation/state integrity layer
- the current package defines explicit state contracts and the preflight/postflight integrity-check model
- the process phase remains definition-first and still has not introduced automated integrity checks yet

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
- package: `define_canonical_state_contracts_and_integrity_checks`

## Current Goal / Focus

Define explicit contracts for the core live-state artifacts so the repo has a clear definition of valid state, preflight checks, postflight checks, and bounded change surfaces.

The current package should stay definition-only: artifact contracts, state invariants, open vs closed behavior, preflight/postflight checks, and zones of influence.

## Current Loop State

- the live loop remains singular, but ownership is now intentionally switched to `process`
- `electron_ui` is paused cleanly with preserved stream-local resume state
- the mounted package is now the explicit state-contract and integrity-check model rather than an implementation package

## Known Tensions Or Pending Decisions

- `package_plan.md` still reflects older sequence state and is not the best guide for the current live package
- actual implementation of preflight/postflight integrity checks still needs a later narrow package
- bootstrap docs should remain thin and connective rather than turning into a new meta-framework
- the eventual return from process work back to `electron_ui` should happen intentionally, not implicitly

## Next Likely Packages

- `implement_preflight_and_postflight_doc_integrity_checks`
- a later narrow package to extend contract coverage only after the first lightweight integrity check exists
- an intentional stream switch back to `electron_ui` after the integrity phase reaches a clean pause point

## Bootstrap Note For New AI Conversations

If starting cold, read these files first:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Treat `.consync/state/*` as authoritative over prior conversation memory.

If repo reality and state files disagree, stop and reconcile before executing a new package.