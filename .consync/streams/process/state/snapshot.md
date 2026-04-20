# Process Stream Snapshot

What just happened:

- a bootstrap runbook and compact global snapshot were added to make new AI conversations more consistent
- that work exposed a real mismatch: the global loop was already carrying process packages while the recorded active stream still said `electron_ui`
- this stream is now re-activated to reconcile ownership and define the first documentation-integrity layer

Current state:

- the process stream now owns the live loop again
- the immediate responsibility is documentation/state integrity, not broad process redesign
- `electron_ui` is intentionally paused, not abandoned

What matters next:

- define the governed documentation/state surface and the meaning of integrity
- decide when integrity checks should run and which prompt or agent surfaces own enforcement
- avoid implementing automated checks until that narrower definition package is complete