# Process Stream Snapshot

What just happened:

- the integrity trigger model is now defined for `light`, `elevated`, and `heavy` validation levels
- the current process slice wires that trigger model into the live loop, runbook, and package template surfaces
- operators should now be able to see required checks directly in the mounted package instead of reconstructing them from deeper docs

Current state:

- the process stream now owns the live loop again
- the immediate responsibility is still documentation/state integrity, not broad process redesign
- `electron_ui` is intentionally paused, not abandoned

What matters next:

- keep the integration shallow: operator-visible trigger guidance plus the existing checks, not a workflow engine
- preserve `light` validation as the normal default when the loop returns to ordinary UI work
- avoid expanding into broader doc scanning, scheduler logic, or agent framework work yet