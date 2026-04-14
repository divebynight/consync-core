# Current System

## What Consync Does Today

Consync is a small offline-first workspace that is still CLI-first, with a new desktop scaffold layered in for local app iteration.

It currently:

- creates GUID-backed JSON artifacts
- reads and lists existing artifact metadata
- includes a first Electron main/preload/renderer scaffold with a React renderer
- installs a curated portable workflow scaffold into another repo
- runs deterministic sandbox inspection and proposal commands
- keeps workflow state and durable internal reference docs inside `.consync/`

## What It Does Not Do Yet

Consync does not currently:

- move or rename user files automatically
- run background services or watchers
- depend on network services or cloud APIs
- add AI interpretation to command behavior
- maintain a database or central index
- implement real desktop audio playback or renderer-side filesystem access

## State And Artifacts

- Runtime and workflow state lives in `.consync/state/`
- Durable internal artifacts and reference docs live in `.consync/artifacts/`
- Runtime sandbox outputs for command verification live under `sandbox/`

## Prompt Adapter Layer

`.github/prompts/` is the adapter layer for Copilot-driven workflow execution.

Those prompt files tell the agent where to read the next action, where to write the handoff, and how to format the workflow output without changing the actual runtime code.

## Desktop Architecture

- `src/core/` holds shared logic intended to stay reusable across CLI, Electron, and future MCP layers.
- `src/cli/` is the thin command entry layer for the existing Node CLI.
- `src/electron/main/` owns window creation and IPC handler registration.
- `src/electron/preload/` exposes a narrow bridge to the renderer with `contextBridge`.
- `src/electron/renderer/` holds the React UI and should not import Node or filesystem APIs directly.

The earlier terminal capture probe remains in `sandbox/probes/audio-session-capture/` as an exploratory reference. Audio playback, timeline sync, and richer capture behaviors are paused while the shared desktop shell is established.

## Command Surface

Current command surface includes:

- `new-guid`
- `list-guid`
- `portable`
- `show-guid`
- `sandbox-scan`
- `sandbox-verify`
- `sandbox-describe`
- `sandbox-propose`
- `sandbox-catalog`
- `system-check`
- `system-summary`

## Verification Expectations

Use `npm run verify` as the default repo-level verification pass.

Use `npm run test:desktop-scaffold` as the focused check for the Electron scaffold boundary and preload bridge behavior.

That suite checks:

- core new-guid behavior
- sandbox fixture verification
- proposal output expectations
- command surface summary and system-check status

## On-Track State

The system is considered on track when:

- `.consync/state/handoff.md` is present and current
- `.consync/artifacts/` reflects the current internal reference set
- sandbox fixtures and expectations are present
- `npm run verify` passes cleanly
- `system-check` reports `STATUS: ON_TRACK`