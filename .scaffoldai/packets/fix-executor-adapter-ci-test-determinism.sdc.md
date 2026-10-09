# SDC — Fix Executor Adapter CI Test Determinism

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: tests, scaffoldai executor adapter

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Refactor executor adapter tests to be deterministic and environment-independent, removing dependency on local `.scaffoldai/` runtime state so tests pass in clean CI environments.

CONTEXT:
CI failure indicates the executor adapter test `resolveExecutorContext should succeed with active packet in live repo` relies on local ScaffoldAI activation state that does not exist in a clean CI checkout. Error: "No active packet. Mount a packet before invoking the executor. Run: make scaffold-activate"

TASKS:
1. Examine `src/test/unit-executor-adapter.test.js` to identify all tests that assume pre-existing activation state.
2. Update `resolveExecutorContext` tests to explicitly create or mount a temporary fixture packet during setup.
3. Use isolated temporary directories where possible to avoid repo-local mutable state dependency.
4. Ensure test cleanup occurs properly after test execution.
5. Preserve operator-controlled activation semantics in production runtime (no change to actual executor behavior).
6. Preserve bounded execution model and artifact-backed planning/runtime architecture.

VERIFY:
Run:
- npm run verify:scaffoldai
- npm run test:unit-executor-adapter (or equivalent test command)
- Confirm tests pass without requiring pre-activated repo state

OUTPUT:
1. Modified test files with environment-independent test setup
2. Tests passing in clean CI environment assumptions
3. Verification output showing clean test execution
4. Summary of what dependency caused the CI mismatch

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- preserve authority boundaries
- human-controlled commits only
- do NOT modify production executor adapter runtime behavior
- do NOT rely on existing `.scaffoldai/` runtime state in tests
- do NOT assume `make scaffold-activate` was run externally
