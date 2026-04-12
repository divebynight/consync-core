# Current System

## What Consync Does Today

Consync is a small offline-first Node.js CLI workspace.

It currently:

- creates GUID-backed JSON artifacts
- reads and lists existing artifact metadata
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

## State And Artifacts

- Runtime and workflow state lives in `.consync/state/`
- Durable internal artifacts and reference docs live in `.consync/artifacts/`
- Runtime sandbox outputs for command verification live under `sandbox/`

## Prompt Adapter Layer

`.github/prompts/` is the adapter layer for Copilot-driven workflow execution.

Those prompt files tell the agent where to read the next action, where to write the handoff, and how to format the workflow output without changing the actual runtime code.

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