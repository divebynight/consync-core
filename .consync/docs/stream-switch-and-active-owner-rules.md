# Stream Switch And Active Owner Rules

This is the current working rule for pausing one stream and activating another while keeping the live loop singular.

## Stream Status Model

Use these statuses:

- `ACTIVE` — the stream currently owns the live loop
- `PAUSED` — the stream stopped at a clean point and can resume later
- `SUPPORTING` — the stream is not the live owner, but it is supplying context or adjacent work
- `BLOCKED` — the stream cannot continue until a named blocker is resolved

Only one stream may be `ACTIVE` at a time.

## Active Owner Rule

`next-action.md` and `handoff.md` are global live slots.

Only one stream may own them at a time.

The active owner is recorded in `.consync/state/active-stream.md`.

That file should show, at minimum:

- active stream
- previous stream
- switch reason
- paused streams
- supporting streams
- live owner note for `next-action.md` and `handoff.md`

This keeps the live execution surface singular without multiplying per-stream live files.

## Durable Stream Ownership

Each real stream should own, durably:

- stream name
- package plan location
- current status
- last completed package

Keep that ownership lightweight.

Use the stream's durable stream file for these facts when practical instead of introducing extra live state docs.

## Stream Switch Ritual

When switching streams:

1. close or pause the current stream cleanly
2. mark the current stream `PAUSED`, `SUPPORTING`, or `BLOCKED` as appropriate
3. record the new active stream and previous stream in `.consync/state/active-stream.md`
4. record the switch reason in `.consync/state/active-stream.md`
5. mount the new stream into `next-action.md`
6. keep `handoff.md` aligned with the active stream's latest closeout

The switch should make it obvious, in one glance, which stream owns the live loop.

## Scope Guard

This rule only defines a minimal switching and ownership model.

It does not add automation, per-stream live-loop duplication, or a larger state hierarchy.