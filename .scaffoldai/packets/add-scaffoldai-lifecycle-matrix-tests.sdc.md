# SDC — Add ScaffoldAI Lifecycle Matrix Tests

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle transition-table enforcement, fixture-isolated matrix testing, lifecycle invariant validation, and bounded negative-transition coverage

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add executable lifecycle matrix tests for the ScaffoldAI lifecycle transition table.

The goal is to turn the documented lifecycle contract into deterministic test coverage for allowed transitions, forbidden transitions, authority boundaries, cleanup safety, and safe-idle invariants.

BACKGROUND:
The lifecycle transition table contract now defines:
- canonical lifecycle states
- allowed transitions T01 through T18
- forbidden transitions F01 through F15
- authority classes
- lifecycle invariants INV-01 through INV-12
- known coverage gaps

The next step is to encode the transition table into executable tests using isolated fixture runtime state.

This packet should prioritize:
- deterministic matrix coverage
- negative-transition enforcement
- invariant validation
- fixture isolation
- no live runtime mutation

TASKS:
1. Review lifecycle transition contract.

Review:
- `.scaffoldai/contracts/lifecycle-transition-table.contract.md`
- Packet 1 audit artifact
- lifecycle simulation tests
- packet intake tests
- packet activation tests
- packet claim tests
- housekeeping cleanup tests
- readonly MCP tests

Use the transition contract as the primary source of truth.

2. Add lifecycle matrix test structure.

Create or extend a lifecycle matrix test file.

Suggested location:
- `src/test/unit-scaffoldai-lifecycle-matrix.js`

Each matrix case should define:
- id
- description
- setup
- action
- expected result
- expected reason or status
- invariant assertions
- affected lifecycle states

3. Implement allowed-transition matrix coverage.

Add deterministic coverage for important allowed transitions, including:
- candidate to accepted
- accepted to active
- active to claimed
- claimed to verification_pending or equivalent verified execution evidence
- verified to completed
- completed to released
- released to cleaned
- cleaned to safe_idle
- blocked retry/recovery path where currently supported
- force-release path where currently supported

If some documented states are conceptual rather than represented by state files, assert the observable evidence that currently represents them.

4. Implement forbidden-transition matrix coverage.

Add deterministic negative tests for forbidden transitions, including:
- claim without active packet
- dual claim ownership
- malformed candidate reaching accepted
- activation while another packet is active
- active packet replacement without explicit clear or release
- completion signal without verification evidence
- closeout before verification evidence where currently testable
- cleanup while active claimed work exists
- cleanup deleting durable packets
- cleanup deleting append-only logs
- readonly MCP authoritative mutation
- blocked packet type entering execution
- non-owner release
- supersede without explicit human authority where currently testable

5. Assert lifecycle invariants.

Add reusable invariant helpers where useful.

Cover at minimum:
- safe_idle means no active packet and no claim
- claimed implies active packet exists
- only one claim owner exists
- accepted packets are durable
- inbox candidates are transient
- append-only logs are preserved
- readonly MCP surfaces do not mutate authoritative state
- cleanup preserves durable surfaces
- malformed candidates are rejected
- active-runtime and next-action packet identity remain coherent where applicable

6. Preserve fixture isolation.

Ensure all matrix tests:
- run against isolated temporary fixture roots
- avoid modifying live `.scaffoldai/state`
- avoid modifying live `.scaffoldai/runtime`
- avoid modifying live active packet state
- clean up temporary state safely
- can be run repeatedly

7. Integrate with ScaffoldAI verification.

Ensure the matrix test is included in:
- `npm run verify:scaffoldai`

or document why a test is intentionally excluded.

8. Document remaining gaps.

If any transition or invariant cannot be tested yet, document:
- why it cannot be tested
- what system surface is missing
- what follow-up packet should address it

9. Recommend follow-up packets.

Recommend the next packet sequence after matrix testing, likely including:
- exhaustive negative-transition expansion
- property-based lifecycle simulation
- stable packet identity and activation aliasing
- safe-idle formalization
- packet backlog/deferred findings capture
- MCP candidate SDC submission tooling

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. lifecycle matrix test structure
3. allowed transitions covered
4. forbidden transitions covered
5. invariants asserted
6. fixture isolation strategy
7. remaining untested lifecycle gaps
8. recommended follow-up packets
9. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no live runtime mutation during tests
- no broad repository reorganization
- no weakening lifecycle authority boundaries
- no Consync product/runtime modification
- no deletion of durable packet artifacts
- no deletion of append-only logs
- no property-based/randomized testing in this packet unless trivial and explicitly scoped
- human-controlled commits only
