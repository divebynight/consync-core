# ENTRY POINT — start here

SYSTEM STATE:
PASS

CURRENT DIRECTION:
Use Electron as a thin UI shell over reusable Consync core logic while keeping each desktop step narrow and verifiable.

LAST COMPLETED WORK:
The last completed package repaired the runtime renderer/preload contract by moving real runtime reads behind main-process IPC while preserving the existing bridge shape.

CURRENT REALITY:
- Electron boots.
- The live bridge repair has been applied and visually confirmed in the Electron window.
- Active workflow state now lives in `.consync/state/` and background material lives in `.consync/state/history/`.
- Bridge Status, Backend Summary, Consync Summary, and Session panels now populate through the repaired runtime bridge.

ACTIVE FOCUS:
Return to the next narrow session-facing renderer feature without broadening the desktop shell prematurely.

NEXT ACTION:
Run the next FEATURE package in `.consync/state/next-action.md`, which should expose one small session-facing value in the Electron renderer.