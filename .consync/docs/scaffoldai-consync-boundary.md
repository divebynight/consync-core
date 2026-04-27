# ScaffoldAi / Consync Boundary

This document makes the current boundary explicit without moving code, renaming
packages, or changing runtime behavior.

## Purpose

`consync-core` currently contains two related but distinct concerns:

- **ScaffoldAi product/app:** the user-facing local desktop and CLI experience.
- **Consync dev harness/process:** the repo-local operating system for packets,
  state, docs, verification, streams, prompts, and agent workflows.

The current repository name and `.consync/` directory remain unchanged. This
document is a planning reference for future separation work only.

## Current Product / App Areas

These areas are part of the ScaffoldAi-facing product surface or app runtime:

| Area | Current location | Boundary note |
| --- | --- | --- |
| Desktop app shell | `src/electron/` | Electron main, preload, renderer, IPC, and UI assets. |
| Renderer UI | `src/electron/renderer/` | Search panel, session panel, waveform/bookmark flows, styles, and UI state. |
| Desktop shared channels | `src/electron/shared/` | Runtime IPC contract used by the desktop app. |
| App/core runtime logic | `src/core/` | Shared app/session concepts used by the product surface. |
| Reusable runtime utilities | `src/lib/` | Mixed today; some files support product behavior, while others support process workflows. |
| CLI entrypoint and command routing | `src/index.js`, `src/cli/` | Mixed today; some commands are product-like, others are process/harness-only. |
| Product-oriented commands | `src/commands/new-guid.js`, `src/commands/list-guid.js`, `src/commands/show-guid.js`, `src/commands/portable.js`, selected sandbox commands | Candidate product-facing commands, depending on future product framing. |
| Product tests | `src/test/*renderer*`, `src/test/*session*`, `src/test/e2e/` | UI and runtime behavior checks for the desktop/app surface. |
| Desktop packaging/build config | `forge.config.js`, `vite.*.config.mjs`, `playwright.config.js` | Build and verification config for the app surface. |

## Current Dev-Harness / Process Areas

These areas are part of Consync as a development harness, process layer, or
repo-local operating model:

| Area | Current location | Boundary note |
| --- | --- | --- |
| Consync state | `.consync/state/` | Authoritative live process state; do not hand-edit outside workflow. |
| Consync docs | `.consync/docs/` | Process and operating reference material. |
| Skills and procedures | `.consync/skills/` | Reusable workflow procedures used by Consync operators and agents. |
| Prompts and templates | `.consync/prompts/`, `.consync/templates/` | Process scaffolding and packet generation material. |
| Streams and packets | `.consync/streams/`, `.consync/packets/` | Durable process coordination surfaces. |
| Artifacts and notes | `.consync/artifacts/`, `.consync/notes/` | Historical or working process context. |
| GitHub adapter | `.github/` | Thin tool adapter only; not canonical process truth. |
| Gatekeeper commands | `src/commands/gatekeeper.js`, `src/lib/gatekeeper*.js` | Process lifecycle commands. |
| State integrity commands | `src/commands/state-integrity-check.js`, `src/lib/stateIntegrityCheck.js` | Process verification and guardrail logic. |
| Handoff/process checks | `src/commands/handoff-bundle.js`, `scripts/check-handoff-contract.js`, related tests | Process contract verification. |
| Dev harness server/artifacts | `dev-harness/` | Local development harness material, not product runtime. |
| Sandbox fixtures/probes | `sandbox/` | Mixed test/probe surface; currently supports both product discovery and harness verification. |

## Mixed Areas To Classify Before Moving

The following surfaces cross the product/process boundary and should not be moved
until ownership is decided file-by-file:

- `src/lib/` mixes app utilities with process/gatekeeper/state utilities.
- `src/commands/` mixes product-facing CLI commands with process-only commands.
- `src/test/` mixes product behavior tests, process integrity tests, and e2e app
  tests.
- `sandbox/` includes fixtures useful for product discovery flows and probes used
  as dev-harness validation.
- `README.md` currently describes Consync as both product and process; future
  naming should decide whether this is ScaffoldAi product documentation,
  Consync harness documentation, or a short bridge between them.

## Proposed Future Folder Map

This is a proposed destination map, not an implementation instruction.

```text
repo/
  apps/
    scaffoldai-desktop/
      src/
      tests/
      package.json
      forge.config.js
      vite.*.config.mjs
  packages/
    scaffoldai-core/
      src/
      tests/
    scaffoldai-cli/
      src/
      tests/
  tools/
    consync-harness/
      src/
      tests/
      scripts/
    dev-harness/
  fixtures/
    product/
    harness/
  .consync/
    state/
    docs/
    packets/
    streams/
    prompts/
    templates/
    .agents/
  .github/
```

### Future Ownership Intent

- `apps/scaffoldai-desktop/` owns the Electron app and UI-specific tests.
- `packages/scaffoldai-core/` owns product domain logic shared by CLI and desktop.
- `packages/scaffoldai-cli/` owns user-facing command-line entrypoints.
- `tools/consync-harness/` owns process-only commands, gatekeepers, state checks,
  handoff checks, and process verification.
- `.consync/` remains the portable process state and documentation layer until a
  separate migration explicitly renames or relocates it.
- `.github/` remains an adapter layer pointing back to canonical Consync process
  truth.

## Risks

- **Runtime regressions from accidental moves:** Electron, Vite, Playwright, and
  CLI paths are likely path-sensitive.
- **Process drift:** moving process code without updating `.consync` docs, skills,
  and state checks could make the harness lie about repo truth.
- **Boundary ambiguity:** `src/lib/`, `src/commands/`, `src/test/`, and `sandbox/`
  need file-level classification before relocation.
- **Naming churn:** renaming `.consync`, packages, or public commands too early
  would create avoidable breakage and stale documentation.
- **Verification gaps:** app and process checks currently share one package and
  may need separate verification ladders after migration.
- **Adapter confusion:** `.github/` must stay thin; duplicating process rules there
  would create competing sources of truth.

## Migration Phases

1. **Phase 0: Boundary documentation**
   - Create and maintain this document.
   - Do not move code, rename packages, rename `.consync`, or change behavior.
   - Keep verification running against the current tree.

2. **Phase 1: File-level classification**
   - Inventory `src/lib/`, `src/commands/`, `src/test/`, and `sandbox/`.
   - Mark each file as `product`, `process`, `mixed`, or `test-fixture`.
   - Record unresolved decisions before changing layout.

3. **Phase 2: Verification split design**
   - Define product verification and process verification as separate lanes.
   - Preserve the existing top-level verification command until replacements pass
     at parity.

4. **Phase 3: Non-runtime scaffolding**
   - Add empty or documentation-only future folders if helpful.
   - Avoid imports, package renames, or runtime path changes in this phase.

5. **Phase 4: Process harness extraction**
   - Move only process-owned commands/libs/tests after classification.
   - Update `.consync` docs and skills in the same packet as any harness move.
   - Require state preflight and postflight checks.

6. **Phase 5: Product app extraction**
   - Move Electron/app/core surfaces after process extraction is stable.
   - Update build, test, and packaging paths together.
   - Require full product verification before committing.

7. **Phase 6: Naming decisions**
   - Decide whether and when package names, CLI names, or `.consync` should change.
   - Treat `.consync` rename as a separate governance/process migration, not a
     side effect of app refactoring.

## Current Guardrails

- Do not gut the app.
- Do not rename packages.
- Do not move source files.
- Do not rename `.consync`.
- Do not change runtime behavior.
- Keep `.consync/` authoritative for process truth until an explicit migration
  changes that contract.
