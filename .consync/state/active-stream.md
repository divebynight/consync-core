ACTIVE STREAM

process

PREVIOUS STREAM

electron_ui

SWITCH REASON

The live loop is currently executing process packages that define and repair shared workflow rules, so `process` owns `next-action.md` and `handoff.md` during this phase.

PAUSED STREAMS

- electron_ui

SUPPORTING STREAMS

- none

BLOCKED STREAMS

- none

LIVE OWNER NOTE

Only `process` currently owns `.consync/state/next-action.md` and `.consync/state/handoff.md`.

The global live loop stays singular even while other streams remain durable and resumable.