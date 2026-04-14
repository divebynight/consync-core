You are helping scaffold the first desktop UI layer for a Consync capture app.

Context:
- This project is evolving from a terminal-based capture prototype into a modular desktop app.
- The architecture must preserve a shared core so that CLI, Electron, and future MCP integration can all use the same underlying logic.
- Do not build app logic directly into React components.
- Do not make the renderer directly access Node or filesystem APIs.
- Use Electron best practices: main process, preload bridge, renderer UI, narrow API surface.
- We want a minimal first scaffold only, not a full feature implementation.

Goals for this task:
1. Set up an Electron Forge project suitable for local development on macOS.
2. Use a React-capable renderer setup that is practical for iteration.
3. Create a clear source layout for:
   - src/core
   - src/cli
   - src/electron/main
   - src/electron/preload
   - src/electron/renderer
4. Add a minimal preload bridge and IPC example.
5. Add a placeholder renderer UI that proves the app launches correctly.
6. Do not implement real audio playback yet.
7. Update project docs to reflect this new architecture and feature direction.
8. Keep all changes small, modular, and easy to verify.

Requirements:
- Preserve future MCP compatibility by keeping logic out of the renderer.
- Add or update docs that explain:
  - why the desktop UI is being added
  - how the architecture is separated
  - what remains paused from the earlier terminal capture exploration
- Add or update tests only where reasonable for the scaffold stage.
- Include a short handoff summary of:
  - files created/modified
  - commands to run
  - what was verified
  - any follow-up limitations

Please first inspect the existing repo structure and docs before making changes.
Then make the smallest coherent scaffold that satisfies the goals above.