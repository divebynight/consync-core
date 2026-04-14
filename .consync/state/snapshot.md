# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Use Electron as a thin UI shell over reusable Consync core logic while keeping each desktop step narrow and verifiable.

LAST COMPLETED WORK:
The last completed package exposed one real backend summary value in the renderer and kept the shell launch path stable.

CURRENT REALITY:
- Electron boots.
- Real backend/system data is visible in the renderer.
- Active workflow state now lives in `.consync/state/` and background material lives in `.consync/state/history/`.
- The bridge now carries real signals, but the renderer is still intentionally minimal and has not started useful Consync-facing behavior yet.

ACTIVE FOCUS:
Move from backend summary proof toward the first meaningful Consync-facing renderer value without broadening the desktop shell prematurely.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should expose one simple Consync-relevant value or scan stub in the Electron renderer.