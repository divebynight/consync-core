# Artifact Role Model

## Purpose

This doc defines a small role model for Consync artifacts so operational files can be reasoned about by role instead of being treated as one undifferentiated text class.

Artifact role matters more than file format.

Markdown alone is not a meaningful operational classifier.

The system should validate based on role and risk, not uniformly across all files.

## Core Roles

### `state`

Purpose:

- declare current live truth
- answer the main live-state questions directly

Examples:

- `.consync/state/active-stream.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
- `.consync/state/snapshot.md`
- `.consync/orchestration/active_foreground_stream.txt`
- stream-local state files under `.consync/streams/*/state/`

Canonical status:

- canonical for current live truth when the question belongs to that file

Expected change frequency:

- frequent while work is active

Expected validation weight:

- always checked by core smoke and contract checks

Typical owner or stream relationship:

- owned by the currently active stream when global
- owned by the specific stream when local

### `control`

Purpose:

- drive the active loop or mounted execution surface
- move work from intent to execution

Examples:

- `.consync/state/next-action.md`
- the active stream's local `state/next_action.md`
- prompt surfaces that mount and execute the live package

Canonical status:

- canonical for what is actively mounted and what should happen next in the live loop

Expected change frequency:

- changes at package boundaries and during intentional stream switches

Expected validation weight:

- always checked when mounted or used to drive execution

Typical owner or stream relationship:

- tightly coupled to the active stream and active live-loop owner

### `governance`

Purpose:

- define rules, contracts, policies, and process expectations
- govern how state and control artifacts should be interpreted

Examples:

- `.consync/docs/runbook.md`
- `.consync/docs/doc-integrity-layer.md`
- `.consync/docs/state-contracts-and-integrity-checks.md`
- `.consync/docs/next-action-handoff-automation-contract.md`
- `.consync/docs/stream-switch-and-active-owner-rules.md`
- `.consync/docs/agent-routing-policy.md`

Canonical status:

- canonical for process interpretation, contracts, and validation expectations

Expected change frequency:

- low to moderate; should change intentionally and narrowly

Expected validation weight:

- highest validation weight when touched

Typical owner or stream relationship:

- primarily process-stream owned
- should not be changed casually by ordinary feature packages

### `reference`

Purpose:

- explain, clarify, orient, or provide examples
- help humans and AI understand the system without redefining live truth

Examples:

- `.consync/docs/current-system.md`
- stream-model explanatory docs
- examples under `.consync/docs/examples/`

Canonical status:

- supporting only

Expected change frequency:

- occasional, usually after a real process or product clarification

Expected validation weight:

- light validation, usually pointer accuracy or relevance checks only

Typical owner or stream relationship:

- shared across streams
- may be updated by process work or by narrowly justified feature/process packages

### `history`

Purpose:

- preserve past actions, prior states, and archived records
- retain durable reconstruction value without competing with live truth

Examples:

- `.consync/state/history/`
- stream-local `history/` directories
- archived handoffs, archived next actions, and prior repair records

Canonical status:

- non-canonical for current live truth

Expected change frequency:

- append or preserve when packages close or state is archived

Expected validation weight:

- usually preservation-focused rather than heavily validated unless history is being used to reconstruct live truth

Typical owner or stream relationship:

- owned by whichever stream or process archived the prior state

## Highest-Governance Zone

The process silo is the highest-governance zone.

That zone includes, at minimum:

- global live state artifacts under `.consync/state/`
- loop-driving control artifacts
- governance docs under `.consync/docs/` that define contracts, switching rules, integrity expectations, and process behavior

This zone deserves stronger validation than ordinary feature work because it controls how the rest of the repo is interpreted.

Implications:

- process, state, and governance artifacts deserve stronger validation than ordinary feature work
- non-process packages should not casually modify governance or process surfaces
- when ordinary work must touch governance or process artifacts, that should be explicit and narrowly justified

## Validation Tiers By Role

- `state` → always checked by core smoke and contract checks because it declares current live truth
- `control` → always checked when mounted or live because it drives action directly
- `governance` → checked most heavily when touched because it defines contracts, rules, and interpretation
- `reference` → lightly checked, usually for relevance, pointer accuracy, or obvious contradiction with canonical state
- `history` → usually preserved or appended, not heavily validated unless it affects recovery or reconstruction of live truth

Not every stream or artifact gets the same level of checking.

Ordinary feature work should not automatically trigger the same validation weight as process/governance work.

## Cross-Role Expectations

- `reference` artifacts must not override `state` artifacts
- `history` artifacts must not override live truth
- `governance` artifacts define how `state` and `control` artifacts are interpreted
- `control` artifacts may drive action but do not automatically redefine governance
- process changes that touch `governance`, `state`, or `control` surfaces should trigger stronger integrity expectations
- artifact role matters more than whether a file is markdown, JSON, text, or another human-readable format

## Practical Mapping

Current main artifacts by role:

- `state`
  - `.consync/state/active-stream.md`
  - `.consync/state/next-action.md`
  - `.consync/state/handoff.md`
  - `.consync/state/snapshot.md`
  - `.consync/orchestration/active_foreground_stream.txt`
  - `.consync/streams/process/state/snapshot.md`
  - `.consync/streams/electron_ui/state/snapshot.md`

- `control`
  - `.consync/state/next-action.md`
  - active stream local `state/next_action.md`
  - prompt surfaces that execute the mounted package loop

- `governance`
  - `.consync/docs/runbook.md`
  - `.consync/docs/doc-integrity-layer.md`
  - `.consync/docs/state-contracts-and-integrity-checks.md`
  - `.consync/docs/next-action-handoff-automation-contract.md`
  - `.consync/docs/stream-switch-and-active-owner-rules.md`

- `reference`
  - `.consync/docs/current-system.md`
  - stream-model explanation docs
  - examples and orientation-style docs

- `history`
  - `.consync/state/history/`
  - archived handoffs and prior next actions
  - stream-local history surfaces

## Practical Rule

The repo should reason about artifacts by operational role, not by extension alone.

That makes it possible to apply:

- lighter checks during normal feature work
- stronger checks when process, governance, or live state surfaces are touched
- the strongest validation expectations around the process silo and its governing artifacts

The role model should reduce ambiguity, not create a taxonomy hobby.