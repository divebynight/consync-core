TYPE: FEATURE

PACKAGE: expose_one_consync_relevant_value_in_renderer

GOAL:
Expose one small Consync-relevant value in the Electron renderer so the shell moves from generic backend proof to the first project-facing display.

CONTEXT:
The shell now proves preload -> renderer wiring with a real backend summary value. The next step should stay narrow while moving one layer closer to meaningful Consync-facing information.

REQUIREMENTS:

1. Keep the package narrow and inspectable.
2. Use shared core and the existing preload/IPC pattern.
3. Expose only one small Consync-relevant value.
4. Render it clearly without turning this into a UI design pass.
5. Do not start file scanning, persistence, or larger workflow behavior yet.

CHANGES:

1. Choose one simple Consync-relevant value already available or easy to surface safely.
   Good examples:

   * current session placeholder file name
   * one lightweight sandbox/system summary field
   * one reusable core value already present in the app

2. Expose that value through the existing preload/IPC path.
3. Render it clearly in the renderer.
4. Update only the smallest test surface needed.

SUCCESS CRITERIA:

* the Electron app launches
* the renderer shows one simple Consync-relevant value
* existing verification passes
* the desktop shell remains simple and stable

VERIFY:

* Run `npm run test:desktop-scaffold`
* Run `npm run verify`
* Run `npm run start:desktop`

HANDOFF FORMAT:
TYPE: FEATURE
PACKAGE: expose_one_consync_relevant_value_in_renderer

STATUS: PASS | FAIL

CHANGES:

* list files created
* list files modified
* summarize the Consync-relevant value exposed

VERIFY RESULT:

* include the verification results actually run
* note any warnings or follow-up concerns

NOTES:

* brief only
