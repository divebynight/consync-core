# Feature Map

This file tracks major feature areas in Consync V1 and their current status.
It is a lightweight map of what is implemented, what is next, and what is deferred.

## Artifact Commands
- implemented: `new-guid`
- implemented: `list-guid`
- implemented: `show-guid`
- next: `update-guid-note`
- deferred: `delete-guid`

## Workflow / Handoff
- implemented: unified `state/handoff.md`
- implemented: standardized handoff verification format
- next: keep `state/handoff.md` updated through each packet
- deferred: possible future snapshot or state summary view

## System Docs
- implemented: `artifacts/state-hierarchy.md`
- implemented: `artifacts/guid-rules.md`
- implemented: `artifacts/work-log.md`
- next: `artifacts/feature-map.md` maintenance rhythm

## History / Traceability
- implemented: append-only `artifacts/work-log.md`
- next: continue recording meaningful completed packets

## Deferred / Future Areas
- deferred: broader session structure decisions
- deferred: stronger state summary conventions
- deferred: additional artifact commands beyond current inspection flow

## Guardrail
- Curated fixtures are a development tool, not the target environment.
- The longer-term goal is to work against existing, unstructured creative directories.
- Consync should infer structure from chaotic data while keeping user input to a few high-value questions.