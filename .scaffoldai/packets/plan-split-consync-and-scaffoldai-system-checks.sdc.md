# SDC — Plan Split Consync and ScaffoldAI System Checks

MODE: PLANNING

EXECUTION SURFACE:
consync-core command, system-check, and related test/documentation surfaces needed to separate product checks from process checks.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Plan and scope the separation of Consync product/runtime system checks from ScaffoldAI process/infrastructure checks so the two systems no longer share a blurred validation surface.

This is the first narrow follow-up from the runtime layer diagram/function reorg planning packet.

TASKS:
1. Inspect the current shared system-check command and its CLI wiring.
2. Identify which checks belong to Consync product/runtime validation.
3. Identify which checks belong to ScaffoldAI process/infrastructure validation.
4. Define the target split between product and process check surfaces.
5. Preserve existing user-facing behavior where practical, but make ownership explicit.
6. Define whether a thin compatibility/aggregator command is still needed.
7. Identify focused tests or verification coverage required after the split.
8. Produce a concrete implementation-ready follow-up plan.

VERIFY:
Review the planned split for consistency with existing Consync/ScaffoldAI identity boundaries.
Run lint/typecheck or relevant tests only if touched files require it.
Run npm run verify:scaffoldai if ScaffoldAI process files are touched.

OUTPUT:
- planned Consync product check surface
- planned ScaffoldAI process check surface
- compatibility/aggregator recommendation if needed
- focused verification/test recommendations
- implementation-ready follow-up scope

CONSTRAINTS:
- Keep ScaffoldAI and Consync responsibilities separate.
- ScaffoldAI remains development/process infrastructure.
- Consync remains product/runtime.
- Do not use .consync for ScaffoldAI process state.
- Do not use .scaffoldai for Consync product runtime logic.
- Do not broaden scope into IPC decomposition, sandbox-anchor decomposition, or lifecycle-command refactor.
- Do not change lifecycle authority boundaries.
- Do not add git automation or cleanup authority.
- Prefer fail-closed behavior for ambiguous or missing validation state.
- Keep this packet small and planning-focused.

CONTEXT:
The runtime layer diagram/function reorg planning packet identified system-check as an early high-leverage cleanup because the current shared system-check surface blends product and process concerns.

The intended architectural boundary is:
- Consync product/runtime checks validate product-facing runtime assumptions.
- ScaffoldAI process checks validate development/process infrastructure assumptions.

The intended result is reduced identity drift and a safer foundation before larger runtime refactors such as sandbox-anchor decomposition or Electron IPC decomposition.
