# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Use Electron as a thin UI shell over reusable Consync core logic while keeping each desktop step narrow and verifiable.

LAST COMPLETED WORK:
The last completed package exposed a deterministic preload-backed bridge value in the renderer and kept the shell launch path stable.

CURRENT REALITY:
- Electron boots.
- A preload-backed value is visible in the renderer.
- Active workflow state now lives in `.consync/state/` and background material lives in `.consync/state/history/`.
- The renderer is still intentionally minimal and has not started useful Consync-facing behavior yet.

ACTIVE FOCUS:
Move from bridge proof toward the first useful Consync-facing renderer value without broadening the desktop shell prematurely.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should expose one simple backend or system summary value in the Electron renderer.