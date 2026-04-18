# Process Stream Snapshot

What just happened:

- the repo introduced the first minimal stream/orchestration layout under `.consync/`

Current state:

- `process` is the active foreground stream
- legacy `.consync/state/` files still hold the current live process loop
- the new stream layout is present but intentionally minimal

What matters next:

- decide how to migrate or map the existing process loop into the new stream model without losing continuity
- keep the stream model small and pause-safe