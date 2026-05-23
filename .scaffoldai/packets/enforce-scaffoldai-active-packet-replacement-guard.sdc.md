# SDC — Enforce ScaffoldAI Active Packet Replacement Guard

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI packet activation lifecycle guards, active packet replacement prevention, transition-table enforcement, lifecycle matrix tests, and fixture-isolated validation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Enforce explicit lifecycle safety when activating packets so an active packet cannot be replaced without an explicit clear, release, or approved lifecycle transition.

The goal is to close the F05 lifecycle gap identified by the transition matrix tests.

BACKGROUND:
The ScaffoldAI lifecycle transition table defines active packet replacement without explicit lifecycle handling as a forbidden transition.

Current lifecycle hardening has established:
- canonical lifecycle states
- lifecycle transition table
- forbidden transition tests
- cleanup safety preconditions
- no-partial-mutation guarantees
- fixture-isolated lifecycle matrix tests

Recent matrix testing identified F05 as a remaining implementation gap:
- active packet replacement is prevented by higher-level lifecycle expectations
- but the lower-level activation behavior may still allow replacement directly

This packet should harden activation behavior so active packet replacement is explicitly blocked unless the current lifecycle state is safe.

TASKS:
1. Review current activation behavior.

Review:
- `.scaffoldai/contracts/lifecycle-transition-table.contract.md`
- `src/lib/scaffoldaiPacketActivation.auth.scaffoldai.js`
- packet activation tests
- lifecycle matrix tests
- claim/release behavior
- cleanup/safe_idle behavior

Identify where active packet replacement is currently possible.

2. Define active replacement safety preconditions.

Define activation safety semantics.

Activation should be allowed when:
- no active packet exists
- or the current active packet has been explicitly cleared through the supported lifecycle command
- or an approved future supersede path exists

Activation should be blocked when:
- an active packet already exists
- active work is claimed
- replacing the active packet would bypass release, clear, closeout, or cleanup semantics

Use a stable diagnostic reason such as:
- `active_packet_exists`
or an equivalent clear reason if existing conventions suggest a better value.

3. Enforce activation replacement guard.

Update activation behavior so activating a new packet while another packet is already active is rejected.

The blocked response should:
- return a failing or blocked status
- include a stable reason/diagnostic
- avoid partial authoritative mutation
- preserve the current active packet
- preserve packet identity coherence
- preserve durable packet artifacts
- provide clear next-safe-action guidance

4. Preserve allowed activation behavior.

Ensure activation still succeeds when:
- no active packet exists
- the target packet exists in `.scaffoldai/packets/`
- packet path boundaries are valid
- lifecycle state is safe for activation

Do not introduce unnecessary friction for normal candidate to accepted to active flow.

5. Update lifecycle matrix F05.

Update lifecycle matrix tests so F05 becomes an enforced forbidden transition rather than a documented gap.

Assert:
- active packet replacement is blocked
- current active packet remains unchanged
- next-action remains coherent
- active-runtime remains coherent
- no partial mutation occurs
- stable reason/diagnostic is returned

6. Add or update activation tests.

Add focused activation tests covering:
- activation succeeds from safe_idle
- activation fails when another packet is already active
- activation fails when active packet is claimed
- blocked activation preserves authoritative state
- blocked activation preserves durable packet artifacts

Use fixture-isolated runtime state only.

7. Document remaining activation or supersede gaps.

If supersede semantics remain undefined, document that:
- supersede requires explicit human authority
- supersede is not implemented by this packet
- active replacement is blocked until an explicit supersede lifecycle exists

8. Recommend next hardening packet.

Recommend the next packet after this work.

Likely candidates include:
- packet identity coherence matrix
- safe_idle formalization
- property-based lifecycle simulation
- stable packet identity and activation aliasing
- supersede lifecycle semantics

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. active replacement guard implemented
3. blocked activation behavior summary
4. allowed activation behavior summary
5. tests added or updated
6. lifecycle matrix F05 status
7. remaining activation/supersede gaps
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
