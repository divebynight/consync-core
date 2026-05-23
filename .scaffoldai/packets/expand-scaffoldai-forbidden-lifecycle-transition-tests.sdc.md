# SDC — Expand ScaffoldAI Forbidden Lifecycle Transition Tests

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle matrix testing, forbidden-transition enforcement, fixture-isolated negative tests, lifecycle invariant validation, and bounded implementation-gap documentation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Expand ScaffoldAI lifecycle matrix coverage for forbidden transitions and negative lifecycle paths.

The goal is to harden known invalid transitions before introducing randomized/property-based lifecycle testing.

BACKGROUND:
The lifecycle transition-table contract defines forbidden transitions F01 through F15 and lifecycle invariants INV-01 through INV-12.

The first lifecycle matrix test packet added:
- 20 deterministic lifecycle matrix tests
- 11 allowed-transition tests
- 9 forbidden-transition tests
- 6 core invariant assertions
- fixture-root isolation
- verification-suite integration

It also identified remaining gaps including:
- incomplete forbidden-transition coverage
- cleanup while claimed behavior
- active packet replacement/gatekeeper behavior
- packet identity coherence edge cases
- readonly MCP mutation boundaries
- malformed candidate rejection completeness
- safe-idle formalization gaps

This packet should expand deterministic negative coverage using the existing lifecycle matrix test structure before property-based testing is introduced.

TASKS:
1. Review current lifecycle matrix coverage.

Review:
- `.scaffoldai/contracts/lifecycle-transition-table.contract.md`
- `src/test/unit-scaffoldai-lifecycle-matrix.js`
- existing packet intake tests
- existing activation tests
- existing claim tests
- existing readonly MCP tests
- existing housekeeping cleanup tests
- current verify integration

Identify which forbidden transitions are already covered and which require expansion.

2. Expand forbidden-transition matrix cases.

Add deterministic fixture-isolated tests for missing or partial forbidden transitions, including:
- F03 activation of malformed candidate or invalid accepted packet shape
- F07 closeout before verification evidence where currently testable
- F11 readonly MCP authoritative mutation prevention
- F12 blocked packet type entering execution
- F13 autonomous supersede or supersede without explicit authority
- F15 malformed intake reaching accepted state
- active packet replacement without explicit clear/release
- packet identity divergence between active-runtime and next-action where currently testable
- cleanup while active claimed work exists if currently enforceable

If a forbidden transition cannot yet be enforced because the implementation lacks the required guard, document it clearly as an implementation gap rather than weakening the contract.

3. Strengthen negative assertion behavior.

For each forbidden-transition test, assert:
- rejected status or blocked outcome
- stable reason or diagnostic field where available
- no partial authoritative mutation
- durable packets preserved
- append-only logs preserved
- fixture isolation preserved

Prefer explicit reason assertions where the implementation already exposes reason/status values.

4. Add reusable negative-test helpers.

Where useful, add helpers for:
- fixture root creation
- live runtime snapshot comparison
- active packet setup
- claim setup
- forbidden action execution
- no-partial-mutation assertions
- durable surface preservation checks
- append-only preservation checks
- safe-idle checks

Keep helpers local to the test file unless there is an obvious existing shared test utility.

5. Document remaining enforcement gaps.

Document any remaining forbidden-transition gaps in test comments or a small audit note.

Include:
- forbidden transition ID
- current behavior
- expected future behavior
- recommended follow-up packet

Do not silently convert contract violations into accepted behavior.

6. Maintain verification integration.

Ensure all new tests are included in:
- `npm run verify:scaffoldai`

The verification suite must remain deterministic and non-flaky.

7. Recommend next hardening packet.

Recommend whether the next packet should be:
- cleanup claim-blocking enforcement
- packet identity coherence matrix
- safe-idle formalization
- property-based lifecycle simulation

Base the recommendation on what this packet discovers.

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. forbidden transitions newly covered
3. forbidden transitions still partial or untestable
4. negative-test helper changes
5. invariants asserted or strengthened
6. implementation gaps discovered
7. recommended next hardening packet
8. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no live runtime mutation during tests
- no broad repository reorganization
- no weakening lifecycle authority boundaries
- no Consync product/runtime modification
- no deletion of durable packet artifacts
- no deletion of append-only logs
- no property-based/randomized testing in this packet
- human-controlled commits only
