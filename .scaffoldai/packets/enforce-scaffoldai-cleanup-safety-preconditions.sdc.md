# SDC — Enforce ScaffoldAI Cleanup Safety Preconditions

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI housekeeping cleanup safety, lifecycle precondition enforcement, active/claimed runtime guards, cleanup invariant validation, and fixture-isolated tests

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Enforce explicit cleanup safety preconditions before ScaffoldAI housekeeping mutates transient runtime state.

The goal is to ensure cleanup and reset operations only run when the workspace is lifecycle-safe, rather than relying on ad hoc cleanup behavior.

BACKGROUND:
The lifecycle transition-table contract and lifecycle matrix tests now define cleanup-related invariants and forbidden transitions.

Recent matrix testing identified an implementation gap:
- cleanup while active claimed work exists is contractually forbidden
- current cleanup behavior does not fully enforce that lifecycle precondition internally

The broader architectural rule is:
- destructive or state-resetting operations should require lifecycle-safe preconditions
- claimed or actively executing work must not be silently reset by cleanup
- cleanup must preserve durable packets, contracts, source, and append-only logs
- cleanup should move the system toward safe_idle only when it is safe to do so

This packet should harden cleanup behavior without broad lifecycle redesign.

TASKS:
1. Review current cleanup and lifecycle guard behavior.

Review:
- `.scaffoldai/contracts/lifecycle-transition-table.contract.md`
- `src/lib/scaffoldaiHousekeeping.auth.scaffoldai.js`
- `src/test/unit-scaffoldai-lifecycle-matrix.js`
- existing housekeeping tests
- existing claim tests
- existing lifecycle simulation tests
- current closeout behavior where relevant

Identify existing cleanup actions that mutate transient runtime state.

2. Define cleanup safety preconditions.

Implement or document cleanup safety preconditions such as:
- no active claim exists
- no claimed packet execution is in progress
- cleanup does not delete durable packet artifacts
- cleanup does not delete append-only logs
- cleanup does not delete durable contracts or source
- cleanup either preserves active work or rejects when active claimed work exists

The expected primary blocked condition is:
- active packet exists and is claimed

Use a stable diagnostic reason such as:
- `active_claim_exists`
or an equivalent clear reason if existing naming conventions suggest a better value.

3. Enforce cleanup blocking for active claims.

Update housekeeping cleanup behavior so cleanup refuses to proceed when active claimed work exists.

The blocked response should:
- return a failing or blocked status
- include a stable reason/diagnostic
- avoid partial cleanup mutation
- report a clear next-safe-action
- preserve all authoritative state
- preserve durable surfaces
- preserve append-only logs

4. Preserve allowed cleanup behavior.

Ensure cleanup still succeeds when:
- no active packet exists
- active packet is absent or safely idle
- no claim exists
- transient runtime cleanup is safe

Do not introduce unnecessary friction for normal post-closeout cleanup.

5. Add or update deterministic tests.

Add or update tests covering:
- cleanup blocked while active packet is claimed
- cleanup allowed when no active packet and no claim
- cleanup preserves durable packet artifacts
- cleanup preserves append-only logs
- cleanup does not partially mutate authoritative state on blocked cleanup
- cleanup returns stable reason/diagnostic on blocked cleanup
- lifecycle matrix F08 now reflects enforced behavior instead of only documenting a gap

Use fixture-isolated runtime state only.

6. Update lifecycle matrix expectations.

Update the lifecycle matrix test coverage so F08 becomes an enforced forbidden transition if implementation now supports it.

Preserve documentation for any remaining cleanup-related gaps.

7. Update documentation or contract notes if needed.

If implementation clarifies cleanup safety semantics, update the relevant contract or reference documentation.

Document:
- cleanup preconditions
- blocked cleanup reason
- relation to safe_idle
- relation to claimed work

8. Recommend next hardening packet.

Recommend the next packet after this work.

Likely candidates include:
- packet identity coherence matrix
- safe_idle formalization
- property-based lifecycle simulation
- active replacement guard hardening
- stable packet identity and activation aliasing

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. cleanup safety preconditions implemented
3. blocked cleanup behavior summary
4. allowed cleanup behavior summary
5. tests added or updated
6. lifecycle matrix F08 status
7. remaining cleanup or lifecycle gaps
8. recommended next hardening packet
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
- no property-based/randomized testing in this packet
- human-controlled commits only
