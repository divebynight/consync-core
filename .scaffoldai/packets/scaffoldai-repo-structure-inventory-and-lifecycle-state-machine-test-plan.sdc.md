# SDC — ScaffoldAI Repo Structure Inventory And Lifecycle State-Machine Test Plan

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI repository structure analysis, lifecycle semantics planning, lifecycle testing strategy, packet/runtime taxonomy, and bounded planning documentation

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Inventory the current ScaffoldAI-related repository structure, classify confusing or ambiguous areas, and produce a lifecycle state-machine test plan that can guide future cleanup, enforcement, and randomized lifecycle testing.

The goal is to improve structural clarity and reduce cognitive load without performing a broad repository reorganization.

BACKGROUND:
ScaffoldAI has now established:
- strict packet intake validation
- canonical SDC packet structure
- inbox-based intake flow
- bounded claim/collision lifecycle
- append-only operational observations
- deterministic cleanup semantics
- readonly MCP observation surfaces
- lifecycle simulation testing
- canonical packet templates/examples/contracts

The current operational loop is becoming stable, but some repository structures and lifecycle semantics are still conceptually blurry.

The system now needs:
- clearer structural taxonomy
- clearer lifecycle terminology
- clearer durable vs transient boundaries
- clearer packet/archive semantics
- clearer lifecycle transition definitions
- broader lifecycle enforcement test planning

This packet should prioritize:
- clarity
- classification
- lifecycle semantics
- test planning
- operational understanding

rather than broad implementation churn.

TASKS:
1. Inventory ScaffoldAI-related repository structures.

Review ScaffoldAI-related files and directories and classify them as:
- ScaffoldAI source/implementation
- bridge state
- runtime state
- append-only operational surface
- contract
- documentation
- template/example surface
- test/fixture
- adapter/integration layer
- transient operational artifact
- ambiguous/needs-decision

Include at minimum:
- `.scaffoldai/`
- packet/intake/archive surfaces
- contracts/examples/templates
- lifecycle simulation tests
- housekeeping/cleanup flows
- MCP-related surfaces
- ignored runtime files
- repository areas coupled to ScaffoldAI behavior

2. Identify ambiguous or confusing structures.

Produce a report identifying:
- unclear directory purposes
- naming drift
- source/runtime overlap
- bridge/runtime overlap
- transient/durable ambiguity
- Consync vs ScaffoldAI coupling risks
- unclear lifecycle ownership semantics
- structures requiring clearer boundaries

Avoid broad file movement or rename operations during this packet unless trivial and clearly safe.

3. Propose target repository taxonomy.

Draft a proposed target organization map distinguishing:
- durable source
- durable contracts
- durable documentation
- templates/examples
- project-local bridge state
- append-only operational logs
- transient runtime state
- fixtures/tests
- adapters/integration surfaces

For each category specify:
- intended location
- allowed contents
- forbidden contents
- commit expectations
- ignore expectations
- cleanup expectations

4. Define lifecycle state terminology.

Draft an initial lifecycle state model covering likely states such as:
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

Clearly distinguish:
- planning backlog state
- inbox candidate state
- accepted-but-idle state
- active execution state
- blocked/collision state
- verification state
- closeout/finalization state
- cleanup/safe-idle state

5. Define lifecycle transition categories.

Produce an initial lifecycle transition matrix including:
- allowed transitions
- forbidden transitions
- required preconditions
- observable surfaces
- append-only records
- authority requirements
- cleanup expectations

Include negative cases such as:
- closeout before verification
- claim without active packet
- dual claim attempts
- malformed packet activation
- cleanup deleting durable artifacts
- readonly MCP mutation
- blocked packet-type execution
- active packet replacement without release
- cleanup during active claimed work

6. Plan lifecycle enforcement test coverage.

Create a lifecycle enforcement test plan covering:
- positive lifecycle transitions
- negative lifecycle transitions
- collision handling
- cleanup preservation
- append-only invariants
- readonly MCP invariants
- safe-idle assertions
- fixture isolation assertions
- lifecycle ordering assertions

Identify:
- existing coverage
- missing coverage
- likely high-risk gaps
- likely high-value invariant tests

7. Plan randomized/property-based lifecycle testing.

Evaluate introducing randomized lifecycle testing using tools such as:
- `fast-check`

Plan for:
- generated packet sequences
- generated claim/release flows
- invalid transition attempts
- randomized cleanup timing
- randomized lifecycle ordering
- invariant preservation assertions

Implementation is optional if planning/documentation is sufficient.

8. Recommend follow-up packets.

Produce an ordered follow-up packet recommendation list including likely areas such as:
- lifecycle transition-table implementation
- exhaustive lifecycle negative tests
- randomized/property-based lifecycle simulation
- MCP candidate SDC submission tooling
- repository cleanup/reclassification
- audit/archive improvements
- safe-idle lifecycle formalization

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. repository structure inventory summary
3. lifecycle terminology summary
4. lifecycle transition-planning summary
5. lifecycle testing strategy summary
6. randomized testing strategy summary
7. identified ambiguity/drift areas
8. recommended follow-up packets
9. verification result

CONSTRAINTS:
- no MCP write authority
- no autonomous execution
- no broad repository reorganization
- no lifecycle authority-boundary weakening
- no Consync product/runtime modification
- no bypassing lifecycle contracts
- no deletion of durable packet artifacts
- human-controlled commits only
