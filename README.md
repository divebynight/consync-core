# consync-core

Consync is a small local-first workspace for creating and inspecting structured artifact metadata, with a lightweight workflow layer kept inside `.consync/`.

Today the repo provides:

- CLI commands for artifact creation and inspection
- a minimal Electron desktop scaffold with a React renderer, preload bridge, and first in-memory session bookmark loop
- a deterministic sandbox verification loop
- a portable scaffold command for installing a minimal Consync workflow starter into another repo
- a portable `.consync/` boundary for workflow state and durable internal docs

It does not require network access, servers, or external services.

## Repository Structure

- `.consync/` — internal workflow state, durable artifacts, plans, and system docs
- `.github/prompts/` — Copilot adapter layer for running the next-action and closeout workflow
- `src/core/` — shared app logic that can be reused by CLI, Electron, and later MCP surfaces
- `src/cli/` — CLI entry layer that keeps command parsing out of the desktop UI
- `src/electron/` — desktop scaffold split into main, preload, and renderer layers
- `src/commands/`, `src/lib/`, `src/test/` — existing CLI commands, helpers, and verification code
- `sandbox/` — fixtures, expectations, and current runtime artifacts used for manual and automated verification

## Workflow Loop

The working loop is:

1. update `.consync/state/next-action.md`
2. execute the packet and write `.consync/state/handoff.md`
3. run verification, usually with `npm run verify`

This keeps the active workflow state explicit and local to the repo.

## Desktop Scaffold

The repo now includes a first desktop scaffold for local macOS development using Electron Forge, a React-capable renderer, and a narrow preload bridge.

The architectural boundary is intentional:

- shared logic belongs in `src/core/`
- process orchestration belongs in `src/electron/main/`
- the preload bridge exposes a minimal safe API from `src/electron/preload/`
- the renderer in `src/electron/renderer/` stays UI-only and does not touch Node or filesystem APIs directly

To start the desktop scaffold locally, run `npm run start:desktop`.

The current desktop step supports a simple in-memory capture loop: the renderer can read placeholder session state and drop bookmarks through preload and IPC into shared core state. Real playback, persistence, and media control are still paused.

The earlier terminal capture exploration remains under `sandbox/probes/audio-session-capture/`. It is still useful as a probe, but audio playback and richer media behavior remain paused while the desktop shell is being established.

## Portable Boundary

`.consync/` is the portable system boundary for Consync's internal process. It holds the workflow state and supporting artifacts that let the repo travel without depending on external coordination.

To scaffold the minimal workflow starter into another repo, run `node src/index.js portable --target /path/to/other-repo`.

## Verification

Run `npm run verify` to execute the current verification pass.

Expected result: the suite ends with `[verify] PASS`.

For the desktop scaffold only, run `npm run test:desktop-scaffold` to verify the shared core metadata, session state, bookmark creation, and preload bridge wiring without launching a real Electron window.

For a quick CLI check, run `node src/index.js new-guid --note "some text"` to create an artifact in `sandbox/current/` and append an event to `.consync/state/events.log`.
