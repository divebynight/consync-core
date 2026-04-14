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

- `.consync/state/` — active workflow state: `snapshot.md`, `next-action.md`, `handoff.md`, and `decisions.md`
- `.consync/state/history/` — historical/reference state such as plans, specs, handoff source material, and event logs
- `.github/prompts/` — Copilot adapter layer for running the next-action and closeout workflow
- `src/core/` — shared app logic that can be reused by CLI, Electron, and later MCP surfaces
- `src/cli/` — CLI entry layer that keeps command parsing out of the desktop UI
- `src/electron/` — desktop scaffold split into main, preload, and renderer layers
- `src/commands/`, `src/lib/`, `src/test/` — existing CLI commands, helpers, and verification code
- `sandbox/` — fixtures, expectations, and current runtime artifacts used for manual and automated verification

## SDC Loop

SDCs are the primary write interface for this repo.

Each SDC must declare `TYPE: PROCESS` or `TYPE: FEATURE`.

- `PROCESS` packages change workflow, structure, prompts, docs, scaffolding, or guardrails.
- `FEATURE` packages change product behavior or user-facing/system functionality.

The normal loop is:

1. start in `.consync/state/snapshot.md`
2. point `.consync/state/next-action.md` at the current SDC
3. execute that package and overwrite `.consync/state/handoff.md` with what actually happened
4. run `npm run verify`
5. only begin new feature work after verification passes

Keep process restructuring and feature development in separate packages unless there is a specific reason to combine them.

For a concrete reference of the expected current layout and state-file formats, see `.consync/docs/examples/current-system/`.

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

`.consync/` is the portable system boundary for Consync's internal process. It holds the active state, supporting artifacts, and historical references that let the repo travel without depending on external coordination.

To scaffold the minimal workflow starter into another repo, run `node src/index.js portable --target /path/to/other-repo`.

## Verification

Run `npm run verify` to execute the current verification pass.

Expected result: the suite ends with `[verify] PASS`.

For the desktop scaffold only, run `npm run test:desktop-scaffold` to verify the shared core metadata, session state, bookmark creation, and preload bridge wiring without launching a real Electron window.

For a quick CLI check, run `node src/index.js new-guid --note "some text"` to create an artifact in `sandbox/current/` and append an event to `.consync/state/history/events.log`.
