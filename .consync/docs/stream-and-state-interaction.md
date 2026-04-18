# Stream And State Interaction

This doc defines how the new stream structure interacts with the existing live loop in `.consync/state/`.

## Source Of Truth During Execution

For now, `.consync/state/next-action.md` and `.consync/state/handoff.md` remain the active execution surface.

That is the live loop.

The foreground stream drives what should appear there, but the loop itself is still global during this phase.

## Foreground Stream Mapping

The current foreground stream is identified by `.consync/orchestration/active_foreground_stream.txt`.

The live loop should always reflect that foreground stream's current work. In practice, the live loop is the working surface for execution, while the stream is the container for the longer-running thread.

## Per-Stream State Role

Per-stream state files under `.consync/streams/*/state/` are the durable and recoverable state of each stream.

They support pause and resume. They should not compete with the live loop or create a second active source of truth.

Active execution state should not be duplicated across multiple places. Per-stream state is authoritative for that stream's recovery context and local history.

## Transition Model

This is a hybrid phase.

- the legacy live loop remains active
- streams are being introduced alongside it
- no forced migration happens yet

Later, the live loop may become more stream-scoped. For now, it remains a shared execution surface so the system stays understandable while the stream model is still being defined.