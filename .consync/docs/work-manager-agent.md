# Work Manager Agent (Concept)

## Purpose

The Work Manager Agent is a coordination layer that sits above existing Consync process agents.

It answers:

> "Should this work be happening right now?"

This is distinct from gatekeepers, which answer:

> "Is this change valid and aligned?"

## Role in the System

The Work Manager does NOT execute work.

It:

- Tracks active work streams
- Understands whether work is:
  - active
  - paused
  - blocked
  - closed
- Prevents overlapping or conflicting work
- Encourages proper closeout discipline
- Routes work into the existing next_action → handoff → closeout loop

## Relationship to Existing Process

This layer reflects behavior that already exists manually:

- Work is started intentionally
- Work is executed in a focused stream
- Work is closed explicitly
- State is captured in `.consync/state` and work-log

The Work Manager Agent formalizes this coordination.

It does not introduce new required steps.

## Current (Manual) Implementation

Today, the Work Manager role is performed by:

- The human (deciding what to work on)
- ChatGPT (framing next steps and scope)
- Codex/Copilot (executing within a bounded task)

This document exists to make that implicit coordination explicit.

## Future (Agent Implementation)

A future Work Manager Agent may:

- Read `.consync/state/handoff.md`
- Inspect recent entries in `.consync/docs/03_work-log.md`
- Determine if work is already in progress
- Approve or block new work
- Suggest resuming or closing existing work

## Non-Goals

The Work Manager Agent does NOT:

- Replace gatekeeper agents
- Replace closeout
- Automatically perform file changes
- Introduce heavy workflow overhead

## Principle

If the Work Manager Agent changes how work is done, it is too heavy.

If it simply enforces what already happens, it is correct.

## Integration Point

The Work Manager sits logically before:

- `run_next_action`
- `run_closeout`

It acts as a lightweight approval and coordination step.

## Minimal Preflight Check

Before starting new work, the Work Manager asks:

1. Is there already active work?
2. Is this new work continuing that stream?
3. If not, should the active work be closed, paused, or explicitly set aside?

This check is advisory for now.

It should not block work automatically until the process is proven stable.
