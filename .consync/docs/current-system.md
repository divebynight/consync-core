# Current System

## What Consync Is

Consync is a small offline-first context layer over creative work.

It captures meaningful interaction and re-entry cues that a normal filesystem does not express well, while staying grounded in local files and small human-readable metadata.

## What Consync Does Today

Consync is a small offline-first workspace that is still CLI-first, with a new desktop scaffold layered in for local app iteration.

It currently:

- creates GUID-backed JSON artifacts
- reads and lists existing artifact metadata
- includes a first Electron main/preload/renderer scaffold with a React renderer
- supports a real desktop session read/write bookmark loop through preload + IPC
- installs a curated portable workflow scaffold into another repo
- runs deterministic sandbox inspection and proposal commands
- keeps workflow state and durable internal reference docs inside `.consync/`

## What Consync Is Not

Consync is not:

- a full mirror of the filesystem
- a file-repair system for renamed or moved user structures
- a tracker of every file in ambient scope

## What It Does Not Do Yet

Consync does not currently:

- move or rename user files automatically
- run background services or watchers
- depend on network services or cloud APIs
- add AI interpretation to command behavior
- maintain a database or central index
- implement real desktop audio playback or renderer-side filesystem access

## Primary Unit And Local Truth

- Session is the primary unit of captured context.
- Folder context is important, but folder != session.
- Local `.consync` anchors hold durable context truth where meaningful local persistence exists.
- Those anchors should remain sparse and intentional rather than being placed in every folder automatically.

## Selective Capture And Relationships

- By default, only artifacts explicitly interacted with, such as bookmarked or deliberately added items, become active session scope.
- Nearby files remain background context unless scope is widened deliberately.
- Parent or higher-level context may know about child contexts.
- Child contexts should remain locally legible and portable even if higher-level links are added later.
- Search/discovery associations are provisional until they are linked deliberately; they are not durable structural links by default.

## Search And Discovery

- A broader search root may scan downward for nested `.consync` anchors.
- A rebuildable index or cache may exist later for speed, but local anchors remain the source of truth.
- Search hits should not automatically rewrite or manufacture durable history.

## State And Artifacts

- Runtime and workflow state lives in `.consync/state/`
- Stream orchestration state lives in `.consync/orchestration/` and `.consync/streams/`
- Durable internal artifacts and reference docs live in `.consync/artifacts/`
- The current stream operating rules live in `.consync/docs/stream-operating-model.md`
- The current stream lifecycle and promotion rules live in `.consync/docs/stream-lifecycle-and-promotion.md`
- The current stream-to-live-loop bridge rules live in `.consync/docs/stream-and-state-interaction.md`
- The current agent introduction strategy lives in `.consync/docs/agent-introduction-strategy.md`
- The current integrity-agent loop rules live in `.consync/docs/integrity-agent-loop.md`
- The current agent routing guidance lives in `.consync/docs/agent-routing-policy.md`
- The current next-action/handoff automation contract lives in `.consync/docs/next-action-handoff-automation-contract.md`
- Runtime sandbox outputs for command verification live under `sandbox/`

`sandbox/current/` is currently a development harness. It is useful for exercising artifact flow and verification, but it should not be treated as the final long-term Consync ontology.

## Prompt Adapter Layer

`.github/prompts/` is the adapter layer for Copilot-driven workflow execution.

Reusable repo-local prompt templates for manual process helpers now also live under `.consync/prompts/`.

Those prompt files tell the agent where to read the next action, where to write the handoff, and how to format the workflow output without changing the actual runtime code.

## Desktop Architecture

- `src/core/` holds shared logic intended to stay reusable across CLI, Electron, and future MCP layers.
- `src/cli/` is the thin command entry layer for the existing Node CLI.
- `src/electron/main/` owns window creation and IPC handler registration.
- `src/electron/preload/` exposes a narrow bridge to the renderer with `contextBridge`.
- `src/electron/renderer/` holds the React UI and should not import Node or filesystem APIs directly.

The earlier terminal capture probe remains in `sandbox/probes/audio-session-capture/` as an exploratory reference. Audio playback, timeline sync, and richer capture behaviors are paused while the shared desktop shell is established.

The active desktop direction now proves one real interaction loop: the renderer can read session state and save bookmarks into the current session artifact, but playback and wider capture behavior remain intentionally deferred.

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

Use `npm run test:desktop-scaffold` as the focused check for the Electron scaffold boundary, shared session state, bookmark creation, and preload bridge behavior.

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