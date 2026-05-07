# ScaffoldAI / Consync Separation Contract

## Purpose

Record the intended separation between Consync, ScaffoldAI, and the Bridge
layer before any files or directories are moved.

This is an architecture decision note. It does not create the target structure.

## Target Model

- `CONSYNC` owns product/runtime code and product-specific metadata.
- `SCAFFOLDAI` owns the process harness: agents, skills, templates, prompts,
  packet workflows, and process execution guidance.
- `BRIDGE` owns project-local state and configuration used by ScaffoldAI to
  coordinate work against a project.

## Target Future Structure

```text
consync-core/
  .scaffoldai/   <- future bridge/state/config
  scaffoldai/    <- future ScaffoldAI source, possibly an npm package later
  src/           <- Consync runtime/product
```

## Current State

- `.consync/` currently contains mixed product, process, and Bridge material.
- This is the current legacy structure, not the target architecture.
- Current files remain authoritative until an explicit migration updates them.

## Migration Constraints

- Do not move files yet.
- Do not rename directories yet.
- Do not create `.scaffoldai/` yet.
- Do not create `scaffoldai/` yet.
- All migration must be incremental and verified.
- `npm run verify` must pass after each step.
- Prefer `npm run verify:full` for structural changes.

## Boundary Rule

- New process or harness concepts belong to ScaffoldAI.
- New product or runtime concepts belong to Consync.
- Bridge concepts must be explicitly identified, kept minimal, and kept out of
  planning or idea-dump roles.

## Status

- Provisional contract.
- No files are moved, renamed, or restructured by this contract.
- Future migration packets must update references and pass verification.
