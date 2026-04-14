# Decisions

- Electron is currently being used as a UI shell over Consync core.
- `snapshot.md` is the main re-entry file.
- Active state is separated from history/reference.
- SDCs are the primary write interface.
- Every SDC must declare `TYPE: PROCESS` or `TYPE: FEATURE`.
- Process and feature packages should usually be committed separately.
