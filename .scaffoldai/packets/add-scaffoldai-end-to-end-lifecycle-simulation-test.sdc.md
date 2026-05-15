# SDC — Add ScaffoldAI End-to-End Lifecycle Simulation Test

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle orchestration and simulation testing

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add a deterministic end-to-end ScaffoldAI lifecycle simulation test that exercises the complete operational loop using isolated fixture/runtime state instead of the live repository runtime.

BACKGROUND:
ScaffoldAI now supports:
- packet intake
- packet activation
- packet claim/release
- bounded verification execution
- completion signaling
- workspace cleanup
- runtime state reset
- collision handling

However, lifecycle correctness is currently validated through:
- focused unit tests
- smoke tests
- live operational runs

The system now needs a deterministic simulation harness that validates:
- operational ordering
- lifecycle safety
- cleanup behavior
- collision handling
- state transitions
- bounded orchestration behavior

without mutating live developer runtime state.

TASKS:
1. Create isolated ScaffoldAI lifecycle simulation harness.

The simulation must:
- execute against isolated fixture/runtime state
- avoid mutating live repo runtime state
- support deterministic assertions
- support repeated execution safely

2. Simulate full happy-path workflow.

Required flow:
- packet intake
- packet activate
- packet claim
- verification execution
- completion signal emission
- claim release
- closeout readiness
- clean-workspace execution

3. Simulate invalid/out-of-order flows.

Include assertions for:
- claim with no active packet
- activate while another packet is active
- second-client claim collision
- verify without active claim
- completion signal without verification
- cleanup during active claimed work

4. Assert bounded orchestration behavior.

Verify:
- no live runtime mutation occurs
- no authority expansion occurs
- readonly MCP remains readonly
- append-only logs remain preserved
- accepted packets remain preserved
- transient runtime state resets correctly

5. Runtime isolation requirements.

The simulation harness must:
- use isolated temporary runtime directories
- avoid modifying live `.scaffoldai/state`
- avoid modifying live `.scaffoldai/runtime`
- avoid modifying active developer packet state

6. Reporting behavior.

Simulation should emit structured summaries including:
- lifecycle phases executed
- blocked transitions
- collision events
- cleanup results
- preserved durable artifacts
- final runtime cleanliness state

7. Update verification coverage.

Integrate simulation into:
- `npm run verify:scaffoldai`

8. Documentation updates.

Document:
- lifecycle simulation purpose
- fixture isolation behavior
- operational safety guarantees
- expected developer workflow

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. lifecycle simulation architecture
3. isolated runtime strategy
4. enforced lifecycle invariants
5. collision handling behavior
6. cleanup verification behavior
7. verification result
8. confirmation no live runtime mutation occurred

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no live runtime mutation during tests
- no deletion of accepted packets
- no deletion of append-only logs
- no product/runtime feature expansion outside ScaffoldAI
- no closeout authority changes
- human-controlled commits only
