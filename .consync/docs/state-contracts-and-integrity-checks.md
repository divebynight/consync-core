# State Contracts And Integrity Checks

## Purpose

This doc defines the core contracts for live-state artifacts and the first lightweight integrity-check model around them.

It exists to answer two practical questions:

1. What does valid state look like?
2. What should be checked before a package runs and before a handoff is accepted?

This is still definition-only. It does not implement validators, agents, or permissions.

## Core State Contracts

### `.consync/state/active-stream.md`

Represents:

- the current live-loop owner
- the previous stream
- paused, supporting, and blocked streams
- the reason the current owner became active

Required structure:

- `ACTIVE STREAM`
- `PREVIOUS STREAM`
- `SWITCH REASON`
- `PAUSED STREAMS`
- `SUPPORTING STREAMS`
- `BLOCKED STREAMS`
- `LIVE OWNER NOTE`

Required fields:

- exactly one active stream name
- a previous stream value or an explicit none-like value when not relevant
- a readable switch reason
- explicit lists for paused, supporting, and blocked streams
- a live-owner note naming ownership of the global loop

Must always be true:

- exactly one active stream is named
- the active stream matches the current live-loop owner
- paused/supporting/blocked lists do not contradict the active stream
- the live-owner note agrees with the active stream and the foreground marker

### `.consync/state/next-action.md`

Represents:

- the one active package mounted in the live loop

Required structure:

- `TYPE: ...`
- `PACKAGE: ...`
- one clear goal section
- actionable work instructions
- constraints or non-goals
- verification expectations

Required fields:

- one package identity
- package type
- concrete scope
- verification expectations

Must always be true:

- only one package is mounted
- the package belongs to the active stream's current live work
- the instructions are executable without guessing the intended outcome
- the package is not stale relative to the current ownership state

### `.consync/state/handoff.md`

Represents:

- the closeout for the most recently completed package

Required structure:

- `TYPE: ...`
- `PACKAGE: ...`
- `STATUS`
- `SUMMARY`
- `FILES CREATED`
- `FILES MODIFIED`
- `COMMANDS TO RUN`
- `HUMAN VERIFICATION`
- `VERIFICATION NOTES`

Required fields:

- matching type and package identity for the package being closed
- explicit status
- verification outcome based on what actually ran

Must always be true:

- the handoff reflects the package that was just executed
- required closeout sections are present
- verification notes describe observed results, not invented ones
- the handoff does not silently close a different package than `next-action.md` mounted during execution

### `.consync/state/snapshot.md`

Represents:

- the compact current-state re-entry view for humans and AI

Required structure:

- `System Status`
- `Active Stream`
- `Previous Or Paused Streams`
- `Current Package`
- `Current Goal / Focus`
- `Current Loop State`
- `Known Tensions Or Pending Decisions`
- `Next Likely Packages`
- `Bootstrap Note For New AI Conversations`

Required fields:

- current active stream
- current package
- current focus
- current tensions when they exist

Must always be true:

- the snapshot is shorter and more readable than the deeper process docs
- it reflects current live truth, not a historical package
- it supports re-entry and does not override canonical state artifacts when they disagree

## Canonical State Invariants

These invariants define valid live state:

- exactly one active stream exists
- the live-loop owner is unambiguous
- `next-action.md` belongs to the active stream
- `handoff.md` reflects the last completed package, not a different one
- the system is either `OPEN` or `CLOSED`, not both
- there is no conflicting ownership across canonical state files
- `snapshot.md` reflects current live state, not stale history

If any invariant fails, the system is in tension and reconciliation comes before normal package advancement.

## System OPEN Vs CLOSED Contract

### OPEN

The system is `OPEN` when:

- a package is actively mounted in `next-action.md`
- execution, verification, or closeout is still in progress
- canonical state artifacts disagree
- live ownership is ambiguous or unresolved

Allowed actions while open:

- execute the mounted package
- verify the mounted package
- close the package with `handoff.md`
- reconcile contradictions
- perform an intentional stream switch

Disallowed behavior while open:

- treating the system like it is between packages
- drafting unrelated work without resolving current state
- changing protected global artifacts casually

### CLOSED

The system is `CLOSED` when:

- no active package is in progress
- the last package has a coherent handoff
- canonical state files agree on current truth
- the repo is ready for an intentional next-step choice

Allowed actions while closed:

- choose the next stream intentionally
- draft the next package intentionally
- refresh bootstrap docs if that refresh keeps state truthful

The current iteration model stays the same: one package at a time. `CLOSED` is the brief reconciled state between packages, not a separate planning system.

## Preflight Check

Run before package execution begins.

Preflight must verify:

- the system state is coherent enough to proceed
- the active stream is unambiguous
- `next-action.md` is valid and not stale
- there are no unresolved state conflicts that make execution unsafe

Minimum preflight read surface:

- `.consync/state/active-stream.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/snapshot.md`
- current repo status

Preflight result meanings:

- proceed: state is coherent enough for the mounted package
- reconcile first: canonical files conflict or the package appears stale

V1 operator command:

- `npm run check:state-preflight`

Meaning:

- `STATUS: PASS` means the mounted package and current live state are coherent enough to proceed
- `STATUS: FAIL` means reconciliation is required before execution continues

## Postflight Check

Run after implementation and verification, before the handoff is accepted.

Postflight must verify:

- `handoff.md` matches the executed package
- required handoff sections are present
- canonical state files remain consistent
- no unintended artifacts were modified outside the package's allowed change surface

Minimum postflight read surface:

- the executed `next-action.md`
- the new `handoff.md`
- any changed canonical state artifacts
- current repo status

Postflight result meanings:

- accept closeout: package output and state remain coherent
- reconcile before accepting handoff: state drift or unplanned cross-boundary changes exist

V1 operator command:

- `npm run check:state-postflight`

Meaning:

- `STATUS: PASS` means the written handoff, mounted package, and core live-state artifacts still agree
- `STATUS: FAIL` means closeout should not be accepted until the contradiction is resolved

## Zones Of Influence

This is a bounded-change model, not a permissions model.

### In-Scope Artifacts

Artifacts the package is expected to change directly.

Examples:

- the named target doc for a doc package
- the relevant renderer file for a UI package
- the live `handoff.md` closeout

### Controlled Artifacts

Artifacts that may change during a package, but only if they stay contract-valid.

Examples:

- `.consync/state/snapshot.md`
- `.consync/state/active-stream.md` during a stream switch
- `.consync/state/next-action.md` when mounting the next package as part of a switch or package-defined closeout

### Protected Artifacts

Artifacts that should not change unless the package explicitly requires them.

Examples:

- unrelated stream-local state files
- protected global ownership markers during non-switch packages
- reference/history docs not named by the package

Protected does not mean immutable. It means changes require explicit reason and reconciliation.

## Allowed Change Rule

A package should:

- declare or clearly imply what it is allowed to modify
- avoid modifying unrelated artifact classes
- treat cross-boundary edits as exceptional, not routine
- trigger reconciliation when it must cross from in-scope work into controlled or protected artifacts

Unintended edits outside the expected change surface are a postflight concern, even when the content itself is valid.

## Integrity Ownership Model

### Human Operator

Owns final verification and final acceptance of ambiguous cases.

### Prompt Layer

Owns structure enforcement for the live loop:

- read current state first
- execute one package only
- write the handoff with required sections
- avoid inventing results

### Future Integrity Agent

Will own contract enforcement across governed artifacts.

Its future role is to check whether state contracts and invariants still hold.

### Process Agent

Owns loop correctness.

Its focus is whether active stream, active package, handoff, and loop state still align.

## Scope Boundary

This doc does not add:

- automated validators
- file-level permissions
- a full action-plan system
- new security mechanisms

It keeps the current iteration model intact while defining what valid state means and when integrity should be checked.

Current implementation note:

- the lightweight integrity-check command now covers both the four global live-state artifacts and the active/paused stream-local state surfaces needed for smoke-level stream coherence