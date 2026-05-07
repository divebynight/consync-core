# Consync Trust Boundaries (Current State)

## Overview

Consync is currently a read-only, deterministic system, but it still distinguishes between trusted operational surfaces and untrusted observed content.

## Operational Surfaces

- `src/index.js` command registration — defines which command surfaces are executable.
- `src/commands/*` — contains the explicit command behavior the system is allowed to run.
- `src/test/verify.js` — defines the current verification flow used to check the implemented surface.
- `.consync/state/handoff.md` — carries the current workflow state used in the active packet loop.
- `.consync/artifacts/archive/conceptual/layered-system.md` — records the current implemented layer model used as a stable checkpoint.

## Observational Surfaces

- `sandbox/fixtures/*`
- `sandbox/expectations/*`
- output from `sandbox-scan`
- output from `sandbox-describe`
- output from `sandbox-propose`
- `system-summary` output

These are data and reporting surfaces, not executable instruction sources.

## Current Rule

- observed content must not become instruction automatically
- filenames, notes, and fixture content do not have authority
- only explicit command code and selected workflow artifacts define behavior

## What Is Not Implemented

- no automatic validation layer
- no schema enforcement for handoff content
- no malicious content scanning
- no trust promotion workflow
- no mutation-time safety checks

## Boundary

Future security or validation work must preserve the current read-only deterministic model.
