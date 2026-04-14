TYPE: FEATURE

PACKAGE: expose_one_backend_summary_value_in_renderer

GOAL:
Expose one small real backend or system summary value in the Electron renderer so the shell moves from preload proof to the first useful Consync-facing display.

CONTEXT:
The shell now proves preload -> renderer wiring with a deterministic bridge value. The next step should stay narrow while moving one layer closer to meaningful product-facing information.

REQUIREMENTS:
1. Keep the package narrow and inspectable.
2. Use shared core and the existing preload/IPC pattern.
3. Expose only one small real backend or system summary value.
4. Render it clearly without turning this into a UI design pass.
5. Do not start file scanning, persistence, or larger workflow behavior yet.

CHANGES:

1. Choose one simple real value already available from the backend or easy to surface safely.
2. Expose that value through the existing preload/IPC path.
3. Render it clearly in the renderer.
4. Update only the smallest test surface needed.

SUCCESS CRITERIA:

* the Electron app launches
* the renderer shows one real backend/system value
* existing verification passes
* the desktop shell remains simple and stable

VERIFY:

* Run `npm run test:desktop-scaffold`
* Run `npm run verify`
* Run `npm run start:desktop`

HANDOFF FORMAT:
TYPE: FEATURE
PACKAGE: expose_one_backend_summary_value_in_renderer

STATUS: PASS | FAIL

CHANGES:

* list files created
* list files modified
* summarize the backend/system value exposed

VERIFY RESULT:

* include the verification results actually run
* note any warnings or follow-up concerns

NOTES:

* brief only