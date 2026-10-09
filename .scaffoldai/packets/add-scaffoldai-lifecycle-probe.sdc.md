# SDC — Add ScaffoldAI Lifecycle Probe

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle orchestration and runtime validation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Create a deterministic lightweight ScaffoldAI lifecycle probe that validates the orchestration/runtime loop without requiring real feature work.

BACKGROUND:
ScaffoldAI now supports:
- SDC submission
- intake/activation
- async executor planning
- MCP polling/result retrieval
- runtime artifact persistence
- lifecycle closeout

However, there is no canonical end-to-end runtime probe.

A lifecycle probe is needed for:
- MCP integration validation
- regression detection
- onboarding verification
- runtime smoke testing
- executor compatibility checks

TASKS:
1. Add a deterministic no-op lifecycle probe flow.

Validate:
- packet submission
- intake
- activation
- executor planning
- async job polling
- result retrieval
- closeout readiness

2. Add bounded probe packet generation.

The probe must:
- require no product/runtime mutations
- avoid filesystem writes outside ScaffoldAI runtime artifacts
- produce deterministic planning output
- preserve bounded execution guarantees

3. Add lifecycle reporting.

Include:
- lifecycle phases reached
- MCP tools exercised
- async job ids
- runtime artifact paths
- terminal states observed
- timeout behavior

4. Add verification coverage.

Test:
- probe generation
- probe lifecycle flow
- async planning integration
- cleanup behavior
- refusal behavior with no active packet

5. Add operator Makefile surfaces.

Potential targets:
- make scaffold-probe-e2e
- make scaffold-probe-clean

VERIFY:
Run:
- probe lifecycle flow
- npm run verify:scaffoldai

OUTPUT:
Return:
1. files changed
2. probe architecture
3. lifecycle phases validated
4. runtime artifacts generated
5. MCP tools exercised
6. remaining orchestration gaps discovered

CONSTRAINTS:
- no arbitrary prompt execution
- no arbitrary shell execution
- no work-mode execution
- no .consync usage
- no lifecycle bypass authority
- human-controlled commits only
