ACTIVE STREAM

electron_ui

PREVIOUS STREAM

process

SWITCH REASON

The process integrity phase is now coherent enough to pause cleanly, so the live loop is intentionally returning to `electron_ui` for normal product work under the new integrity-aware operating model.

PAUSED STREAMS

- process

SUPPORTING STREAMS

- none

BLOCKED STREAMS

- none

LIVE OWNER NOTE

Only `electron_ui` currently owns `.consync/state/next-action.md` and `.consync/state/handoff.md`.

The global live loop stays singular even while other streams remain durable and resumable.