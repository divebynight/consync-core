# SDC — Define ScaffoldAI Lifecycle Transition Table

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI lifecycle semantics, transition-table planning, lifecycle invariant documentation, command/state boundary analysis, and bounded transition-test preparation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Define an explicit ScaffoldAI lifecycle transition table that turns the current implicit packet lifecycle into documented system law.

The goal is to formalize allowed transitions, forbidden transitions, required preconditions, authority requirements, observable surfaces, and testable invariants before expanding lifecycle enforcement or randomized testing.

BACKGROUND:
Packet 1 produced a durable lifecycle planning audit and identified the need for an explicit transition model.

Current lifecycle vocabulary includes:
- planned
- candidate
- accepted
- active
- claimed
- blocked
- verification_pending
- verified
- completed
- closed
- released
- cleaned
- safe_idle
- superseded

Current high-value invariants include:
- safe_idle means no active packet and no claim
- claimed implies an active packet exists
- only one claim owner may exist at a time
- inbox candidates are transient
- accepted packets are durable
- append-only logs are observational, not authoritative
- readonly MCP surfaces must not mutate authoritative state
- cleanup must preserve durable packet, contract, source, and append-only surfaces

This packet should convert those concepts into a concrete lifecycle transition table and prepare the system for executable matrix tests in a follow-up packet.

TASKS:
1. Review current lifecycle sources.

Review existing ScaffoldAI lifecycle-related surfaces including:
- Packet 1 audit artifact
- packet intake behavior
- packet activation behavior
- claim/release behavior
- completion signal behavior
- closeout behavior
- housekeeping cleanup behavior
- MCP readonly observation behavior
- current lifecycle simulation tests
- current packet/claim/intake tests
- current contracts and references

2. Define canonical lifecycle states.

Produce a canonical lifecycle-state reference defining:
- state name
- meaning
- entry condition
- exit condition
- authoritative surface
- observational surfaces
- allowed authority class
- cleanup behavior
- whether the state is durable or transient

At minimum, cover:
- planned
- candidate
- accepted
- active
- claimed
- blocked
- verification_pending
- verified
- completed
- closed
- released
- cleaned
- safe_idle
- superseded

3. Define lifecycle transition table.

Create an explicit transition table documenting:
- from state
- to state
- trigger/action
- required preconditions
- allowed authority
- expected authoritative mutation
- expected append-only observation
- expected MCP visibility
- cleanup implications
- failure behavior

Include current known transitions such as:
- planned to candidate
- candidate to accepted
- accepted to active
- active to claimed
- claimed to verification_pending
- verification_pending to verified
- verified to completed
- completed to released
- released to cleaned
- cleaned to safe_idle
- candidate to rejected
- active or claimed to blocked
- blocked to active or claimed
- accepted to superseded
- active to superseded only through explicit release/clear semantics

4. Define forbidden transitions.

Document forbidden transitions and expected rejection behavior.

Include at minimum:
- claim without active packet
- dual claim ownership
- activation of malformed candidate
- replacing active packet without explicit release or clear
- verification without active claimed work
- completion signal without verification evidence
- closeout before verification evidence
- cleanup during active claimed work
- cleanup deleting durable packets
- cleanup deleting append-only logs
- readonly MCP mutating authoritative state
- blocked packet type entering execution
- superseding active work without explicit human authority

5. Define authority classes.

Document authority classes for lifecycle actions.

Include:
- human approval authority
- CLI execution authority
- agent proposal authority
- agent execution within claimed packet
- readonly MCP observation authority
- future candidate-submission authority

Clarify which authority classes may:
- draft packets
- place candidates in inbox
- intake packets
- activate packets
- claim packets
- execute packet work
- emit completion signals
- release claims
- close out work
- clean transient runtime state
- commit changes

6. Define lifecycle invariants.

Document testable invariants including:
- safe_idle invariant
- single-owner claim invariant
- active-required-for-claim invariant
- accepted-packet durability invariant
- inbox-transience invariant
- append-only preservation invariant
- readonly MCP non-mutation invariant
- cleanup preservation invariant
- blocked-transition rejection invariant
- malformed-candidate rejection invariant
- human-authority boundary invariant

7. Map current test coverage to transition table.

Map existing tests against the transition table.

Identify:
- transitions already covered
- transitions partially covered
- forbidden transitions already covered
- forbidden transitions missing tests
- ambiguous lifecycle edges requiring decision
- follow-up test implementation priorities

8. Prepare follow-up executable matrix test packet.

Recommend the next packet for implementing executable lifecycle matrix tests.

The recommendation should include:
- likely test file location
- fixture isolation strategy
- transition-table fixture shape
- expected negative-test organization
- relationship to randomized/property-based lifecycle testing

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. canonical lifecycle states defined
3. lifecycle transition table summary
4. forbidden transition summary
5. authority class summary
6. lifecycle invariant summary
7. current test coverage mapping summary
8. recommended executable matrix-test follow-up
9. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no broad repository reorganization
- no weakening lifecycle authority boundaries
- no Consync product/runtime modification
- no deletion of durable packet artifacts
- no deletion of append-only logs
- no randomized test implementation in this packet unless trivial and explicitly scoped
- human-controlled commits only
