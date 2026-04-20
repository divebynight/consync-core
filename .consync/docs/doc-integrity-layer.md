# Documentation And State Integrity Layer

## Purpose

This doc defines the first formal integrity layer for Consync documentation and state artifacts.

Its job is simple:

- make live state readable without scattered inference
- name the first governed artifact surface
- define which files answer which canonical state questions
- define when integrity must be checked
- define who owns those checks

This is a definition layer, not an implementation layer.

## Why This Layer Exists

Users and AI should not need to manually infer live state from scattered markdown.

The system should converge toward deterministic state readability.

Historical and reference docs are useful, but they must not override live state artifacts.

## Governed Artifact Classes

The first integrity layer governs these artifact classes:

### State Artifacts

Files that answer current live-system questions directly.

First governed state artifacts:

- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/snapshot.md`
- `.consync/state/active-stream.md`
- `.consync/orchestration/active_foreground_stream.txt`
- relevant per-stream state files under `.consync/streams/*/state/`

### Contracts

Files that define required structure or loop invariants.

First governed contracts:

- `.consync/docs/next-action-handoff-automation-contract.md`
- `.consync/docs/stream-and-state-interaction.md`
- `.consync/docs/stream-switch-and-active-owner-rules.md`

### Runbooks

Files that explain how to operate the system consistently.

First governed runbook:

- `.consync/docs/runbook.md`

### Policies

Files that guide judgment or routing in recurring cases.

First governed policies:

- `.consync/docs/agent-routing-policy.md`
- `.consync/docs/integrity-agent-loop.md`
- `.consync/docs/human-assisted-observation-closeout-rules.md`

### History Records

Files that preserve what happened previously.

Governed history surface:

- `.consync/state/history/`
- stream-local `history/` directories

History records are durable and useful, but they are not canonical live state.

### Reference Docs

Files that describe the broader system and architecture.

First governed reference surface:

- `.consync/docs/current-system.md`
- stream-model docs under `.consync/docs/`

Reference docs explain the system. They do not override current live state when a live artifact says otherwise.

## Canonical Live-State Questions

The system must always be able to answer these questions deterministically:

1. Is the system open or closed?
2. What is the active stream?
3. What is the previous stream, if relevant?
4. What streams are paused?
5. What is the active package?
6. What is the current live-loop owner?
7. Is the live loop reconciled or in tension?
8. What is the next safe action?

## Canonical Sources For Each Question

### 1. Is the system open or closed?

- primary source: `.consync/state/next-action.md` plus `.consync/state/handoff.md`
- supporting confirmation: `.consync/state/snapshot.md`, current repo status
- non-canonical supporting context: `.consync/docs/runbook.md`
- historical only: `.consync/state/history/`

Meaning:

- open: a package is currently mounted, in progress, or awaiting reconciliation
- closed: live state is reconciled, no active contradiction remains, and a new stream or package may be chosen intentionally

### 2. What is the active stream?

- primary source: `.consync/state/active-stream.md`
- supporting confirmation: `.consync/orchestration/active_foreground_stream.txt`, active stream `stream.md`
- non-canonical supporting context: `.consync/state/snapshot.md`
- historical only: prior stream handoffs and history records

### 3. What is the previous stream?

- primary source: `.consync/state/active-stream.md`
- supporting confirmation: stream-local snapshots when relevant
- non-canonical supporting context: `.consync/state/snapshot.md`
- historical only: switch-related handoffs and history records

### 4. What streams are paused?

- primary source: `.consync/state/active-stream.md`
- supporting confirmation: each affected stream's `stream.md` and local `state/snapshot.md`
- non-canonical supporting context: `.consync/state/snapshot.md`
- historical only: older stream handoffs

### 5. What is the active package?

- primary source: `.consync/state/next-action.md`
- supporting confirmation: `.consync/state/snapshot.md`
- non-canonical supporting context: active stream `state/next_action.md`
- historical only: `.consync/state/history/`

### 6. What is the current live-loop owner?

- primary source: `.consync/state/active-stream.md`
- supporting confirmation: `.consync/orchestration/active_foreground_stream.txt`
- non-canonical supporting context: `.consync/docs/stream-and-state-interaction.md`
- historical only: prior stream-switch records

### 7. Is the live loop reconciled or in tension?

- primary source: cross-read `.consync/state/next-action.md`, `.consync/state/handoff.md`, `.consync/state/active-stream.md`, and current repo status
- supporting confirmation: `.consync/state/snapshot.md`
- non-canonical supporting context: `.consync/docs/runbook.md`, `.consync/docs/doc-integrity-layer.md`
- historical only: prior handoffs and repair records

Reconciled means the live state surfaces tell one coherent story.

In tension means one or more canonical artifacts disagree or imply unresolved drift.

### 8. What is the next safe action?

- primary source: `.consync/state/next-action.md` when state is reconciled
- supporting confirmation: `.consync/state/snapshot.md`, `.consync/state/handoff.md`
- non-canonical supporting context: `.consync/state/package_plan.md` when it still matches the live loop
- historical only: previous next-action files in history

If state is in tension, the next safe action is reconciliation first, not feature execution.

## Open Vs Closed System State

### System Open

Treat the system as open when any of these are true:

- `next-action.md` mounts an active package
- live ownership and mounted work do not align yet
- repo status shows unreconciled live-state edits
- `handoff.md` and other canonical state artifacts do not tell one coherent story

Allowed actions in the open state:

- execute the mounted package
- verify and close the mounted package
- repair contradictions
- perform an intentional stream switch

Disallowed behavior in the open state:

- casually choosing a different stream without switching
- treating historical or reference docs as stronger than live state artifacts
- skipping reconciliation when canonical files disagree

### System Closed

Treat the system as closed when all of these are true:

- the latest handoff closes coherently
- canonical live-state artifacts agree
- repo status is reconciled enough for deliberate next-step choice
- no active stream/package contradiction remains

Allowed actions in the closed state:

- intentionally choose the next stream
- intentionally draft the next package
- refresh bootstrap/re-entry docs

### Reconciliation Rule

If canonical state surfaces disagree, reconciliation takes priority.

Reconciliation means:

1. identify which artifact is canonical for the disputed question
2. align supporting artifacts to that canonical answer
3. record the resolved truth in the live handoff and snapshot when needed
4. do not continue normal work until the tension is understandable again

## Enforcement Points

Integrity checks should happen at these points:

### Before Executing A New Package

Confirm the active stream, active package, live-loop owner, and current open/closed state are readable and non-contradictory.

### After Package Completion Before Closeout Is Accepted

Confirm `handoff.md` matches the executed package and that live-state artifacts still tell one coherent story.

### After Stream Switches

Confirm global ownership markers, stream summaries, and paused/active state all agree.

### When Bootstrap Docs Are Refreshed

Confirm `runbook.md` and `snapshot.md` still reflect the current canonical state model rather than stale assumptions.

### Before Resuming A Paused Stream After A Long Gap

Confirm the stream-local snapshot still explains the stream clearly and that reviving it will not contradict the current live loop.

## Ownership Of Integrity Checks

### Human Operator

Owns final judgment.

The operator decides whether the system is coherent enough to continue and whether a contradiction requires repair before more work proceeds.

### Prompt Instructions

Own the baseline enforcement of the live loop.

Prompt surfaces should require the assistant to:

- read current live state first
- respect canonical live artifacts over memory
- overwrite `handoff.md` cleanly
- avoid inventing verification or state transitions

### Process Agent

Owns loop, state, and stream alignment checks when used.

Its focus is whether the active package, stream ownership, state files, and handoff structure still agree.

### Integrity Agent

Owns drift-sensitive trust checks when used.

Its focus is whether code, docs, tests, and state surfaces have drifted in ways that make the repo harder to trust.

### Future Doc-Integrity Check Surface

May later own deterministic validation of governed documentation/state artifacts.

That future surface should check format and consistency against this integrity model, but it is not implemented in this package.

## What Happens When Files Disagree

Use this order:

1. prefer the canonical source for the specific question
2. treat supporting artifacts as needing update, not reinterpretation
3. treat history and reference docs as context only
4. stop normal execution if the disagreement makes the next action unsafe

The system should get easier to explain after reconciliation, not harder.

## Scope Boundary

This integrity layer does not yet add validators, scripts, or a new agent.

It defines the governed surface, the canonical questions, the enforcement points, and the ownership model so later packages can implement one narrow integrity check at a time.

See `.consync/docs/artifact-role-model.md` for the complementary role model that explains why process/governance surfaces carry stronger validation expectations than ordinary feature/reference work.

See `.consync/docs/integrity-trigger-model.md` for the compact trigger rules that decide when packages should stay light and when they should escalate to elevated or heavy validation.