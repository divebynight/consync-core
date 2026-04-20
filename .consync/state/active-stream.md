ACTIVE STREAM

process

PREVIOUS STREAM

electron_ui

SWITCH REASON

Documentation/bootstrap work exposed a real ownership mismatch between the recorded active UI stream and the live process package already mounted in the global loop, so the repo is now formally pausing `electron_ui` and switching the live loop to `process` before further UI expansion continues.

PAUSED STREAMS

- electron_ui

SUPPORTING STREAMS

- none

BLOCKED STREAMS

- none

LIVE OWNER NOTE

Only `process` currently owns `.consync/state/next-action.md` and `.consync/state/handoff.md`.

The global live loop stays singular even while other streams remain durable and resumable.