# Consync Layered System (Current State)

## Overview

Consync is currently a read-only, deterministic system with a layered command progression.

It observes directories, verifies structure, describes contents, and proposes simple organization suggestions.

It does not modify the filesystem.

## Layer Flow

observe → verify → describe → propose

## Layers

### Observe

- command: sandbox-scan
- purpose: recursively list files and structure
- does not:
  - modify files
  - interpret meaning
  - validate correctness

### Verify

- command: sandbox-verify
- purpose: compare scan output to expected fixtures
- does not:
  - interpret content
  - modify files
  - generate descriptions

### Describe

- command: sandbox-describe
- purpose: summarize directory contents in a human-readable way
- does not:
  - modify files
  - enforce rules
  - propose changes

### Propose

- command: sandbox-propose
- purpose: suggest simple, deterministic organization based on explicit heuristics
- does not:
  - modify files
  - use AI
  - infer beyond defined rules

## System Characteristics

- read-only
- deterministic
- fixture-driven
- no AI behavior
- no mutation
- no config
- explicit heuristics only

## What This System Is NOT

- does not move files
- does not rename files
- does not create folders
- does not learn or adapt
- does not apply AI reasoning

## Verification Surface

- npm run verify
- sandbox/fixtures
- sandbox/expectations

## Boundary

This is the first stable checkpoint of the system.

Mutation and AI behavior are intentionally not implemented.

Future work must preserve the current layer boundaries.
