# Stream Operating Model

This is the current minimal operating model for real streams in `.consync/`.

## Tiny Stream Core

Every real stream should start with:

- `stream.md`
- `state/next_action.md`
- `state/handoff.md`
- `state/snapshot.md`
- optional `history/`

Extra structure is earned. Do not add more files or folders until the stream actually needs them.

## Status Vocabulary

- `new` — the stream exists, but it is not shaped enough to run yet.
- `ready` — the stream is defined and can be picked up when it becomes the focus.
- `active` — the stream is the current working stream.
- `paused` — the stream stopped at a clean point and can be resumed later.
- `blocked` — the stream cannot continue until a named blocker is resolved.
- `complete` — the stream has reached its intended stopping point for now.

## Pause-Safe Rule

A stream is pause-safe when:

- `handoff.md` is complete
- `snapshot.md` is updated
- `next_action.md` is empty or clearly staged

Recovery test:

> If I came back cold later, could I continue without relying on memory alone?

If the answer is no, the stream is not pause-safe yet.

## Foreground Rule

Current policy is simple: one foreground active stream at a time.

That is a working rule, not a permanent architectural limit. The structure should stay compatible with future background or parallel agent work when streams are independent enough, but that future should not add present complexity.