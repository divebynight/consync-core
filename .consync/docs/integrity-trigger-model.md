# Integrity Trigger Model

## Purpose

This doc defines when Consync should use light, elevated, or heavy integrity expectations.

Not every package needs the same validation depth.

Validation should scale with operational risk.

The goal is to preserve flow during ordinary feature work while applying stronger validation when packages touch live state, loop-driving control, or governance surfaces.

## Why Trigger Scoping Exists

Consync now has:

- live-state contracts
- preflight and postflight checks
- stream-local integrity checks
- an artifact-role model

What it still needs is a small rule set for choosing how much validation a package should trigger.

Without trigger scoping, the system either under-checks risky process changes or over-checks ordinary work.

The correct default is role-aware and stream-aware, not format-aware.

Validation intensity should follow risk, not file format.

## Trigger Levels

### `light`

Use when the package is ordinary feature or reference work and does not materially change the process silo.

Typical fit:

- ordinary `electron_ui` feature work
- narrow implementation work inside a stream's expected surface
- reference-doc clarification that does not alter state, control, or governance interpretation

Required expectations:

- run current preflight and postflight checks
- confirm no obvious contradiction was introduced into the live loop
- accept narrow closeout when the package stayed within its expected surface

### `elevated`

Use when the package touches live state or control surfaces, crosses expected boundaries, or performs operational changes that are riskier than ordinary feature work but do not redefine governance.

Typical fit:

- stream switch packages
- packages that modify `state` artifacts
- packages that modify `control` artifacts
- bootstrap or re-entry changes that influence how the current loop is read

Required expectations:

- run current preflight and postflight checks
- verify touched artifacts stayed inside their expected zones of influence
- confirm there is no unintended cross-role drift
- confirm the live loop still reads coherently after the change

### `heavy`

Use when the package touches governance or other process-silo surfaces that determine how the repo should be interpreted.

Typical fit:

- governance or process-model changes
- integrity-check model changes
- packages that change contracts or switching rules
- non-process packages that unusually touch process/governance surfaces

Required expectations:

- run current preflight and postflight checks
- perform focused human review of governance, process, and live-state implications
- confirm role and contract alignment after the change
- confirm process-silo truth remains coherent after the package closes

The process silo is the highest-governance zone, so packages that alter it deserve the strongest validation expectations.

## Trigger Inputs

Trigger selection should consider three inputs together:

1. artifact role touched
2. stream type
3. package character

No single input should be used mechanically in isolation.

## Artifact Role Rules

### `reference`

Default trigger level:

- usually `light`

Escalate when:

- the package appears reference-only but changes how canonical state should be interpreted
- the reference doc conflicts with live state or governance guidance

### `history`

Default trigger level:

- usually `light`

Escalate when:

- history is being used to repair or reconstruct live truth
- archival changes affect recovery or explain current contradictions

### `state`

Default trigger level:

- usually `elevated`

Escalate when:

- multiple canonical state artifacts are touched together
- the package changes active ownership, pause state, or reconciliation meaning
- the state change has governance implications

### `control`

Default trigger level:

- usually `elevated`

Escalate when:

- control changes alter how packages are mounted or executed
- control changes cross into governance or process-silo interpretation

### `governance`

Default trigger level:

- usually `heavy`

Escalate because:

- governance artifacts define contracts, policies, and interpretation rules
- changes here can silently alter how other artifacts are read

Non-process streams should not casually rewrite governance or process surfaces.

## Stream Type Rules

### `electron_ui`

Default expectation:

- ordinary feature work stays `light`

Escalate when:

- the package touches `state` or `control` artifacts
- the package crosses into process/governance surfaces
- the package performs a stream switch or bootstrap change

### `process`

Default expectation:

- not automatically `heavy`

Process packages are more likely to reach `elevated` or `heavy` because they more often touch state, control, or governance surfaces.

Still, a narrow process-stream package that only updates a small reference surface may remain `light`.

### Other Future Streams

Default expectation:

- ordinary stream-local feature work stays `light`

Escalate when:

- the package touches shared live-state artifacts
- the package changes loop-driving control surfaces
- the package reaches into governance or process-silo surfaces

## Package Character Rules

### Ordinary Feature Work

- default `light`
- move to `elevated` if `state` or `control` artifacts are touched
- move to `heavy` only if governance/process-silo surfaces are touched

### Stream Switch

- default `elevated`
- move to `heavy` if the switch also changes switching rules, contracts, or governance interpretation

### Governance Or Process-Model Change

- default `heavy`

### Bootstrap Or Re-entry Change

- default `elevated`
- move to `heavy` if the package changes governance meaning rather than only improving discoverability

### Integrity-Check Change

- default `heavy`

## Compact Decision Table

| Situation | Default level | Why |
| --- | --- | --- |
| Ordinary UI or stream-local feature work | `light` | Low cross-role risk; keep normal work moving |
| Reference or history update with no live-state implications | `light` | Supporting surface only |
| Touches `state` or `control` artifacts | `elevated` | Live-loop truth or execution flow may shift |
| Stream switch or bootstrap change | `elevated` | Operational readability and ownership must stay coherent |
| Touches `governance` artifacts | `heavy` | Contracts and interpretation rules may change |
| Changes integrity model or process-silo rules | `heavy` | Highest-governance zone is being altered |
| Non-process stream touches governance/process surfaces | `heavy` | Unusual cross-boundary move with higher drift risk |

## Selection Rule

Choose the strongest trigger level implied by the package.

Examples:

- a package that is mostly UI work but edits `.consync/state/snapshot.md` should be treated as at least `elevated`
- a package that looks like reference cleanup but changes a governance contract should be treated as `heavy`
- a process-stream package that only improves a supporting explanation doc may remain `light`

Trigger rules are meant to preserve flow, not create bureaucracy.

## Override Behavior

- If a package appears light but actually modifies governance, state, or process-silo artifacts, raise it to `elevated` or `heavy`.
- If canonical state contradiction is found, reconciliation takes priority over normal trigger selection.
- If uncertainty is high, prefer the stronger trigger level.
- If a non-process stream must touch governance or process-silo surfaces, treat that as exceptional and validate accordingly.

## Why The Model Stays Small

The repo does not need a trigger framework for every file.

It needs a practical rule:

- ordinary feature work should usually stay light
- touching live state or control should escalate to elevated
- touching governance or process-silo truth should default to heavy

That keeps validation proportional to risk while avoiding heavy process on every package.

## Related Docs

- `.consync/docs/artifact-role-model.md` defines the role model that trigger selection depends on
- `.consync/docs/doc-integrity-layer.md` defines the governed state/doc surface and integrity enforcement points
- `.consync/docs/runbook.md` explains how operators should read live state before executing a package