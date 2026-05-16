# SDC — Define ScaffoldAI Packet Identity Coherence

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI packet identity semantics, activation identity coherence, packet ID/filename/title normalization, lifecycle state references, and fixture-isolated identity tests

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Define and harden ScaffoldAI packet identity coherence so packet lifecycle operations do not rely on fragile human-entered filenames or ambiguous normalized titles.

The goal is to clarify what uniquely identifies a packet as it moves through intake, acceptance, activation, claim, completion, closeout, cleanup, and future supersede or backlog workflows.

BACKGROUND:
Recent lifecycle hardening established:
- canonical SDC intake format
- accepted packet durability
- lifecycle transition table
- lifecycle matrix tests
- forbidden transition enforcement
- cleanup safety preconditions
- active packet replacement guard
- safe_idle operational behavior

During packet activation, an identity/ergonomics issue was observed:
- an inbox filename may differ from the normalized accepted packet filename
- a human-readable packet title may differ from the durable filename
- lifecycle commands currently depend heavily on slug-like names
- repeated or similar packet titles may eventually create ambiguity

The system needs clearer packet identity semantics before adding:
- property-based lifecycle testing
- supersede semantics
- packet backlog management
- MCP candidate submission
- multi-client orchestration

This packet should define and test packet identity coherence without introducing broad storage redesign unless the implementation is small and clearly safe.

TASKS:
1. Review current packet identity behavior.

Review:
- packet intake behavior
- packet normalization behavior
- packet activation behavior
- claim/release behavior
- completion signal behavior
- closeout behavior
- cleanup behavior
- packet visibility MCP behavior
- lifecycle matrix tests
- packet archive/packets directory semantics

Identify current fields such as:
- source path
- source filename
- packet title
- normalized file name
- packet id
- active packet id
- active runtime packet reference
- next-action packet reference
- completion packet reference

2. Define packet identity vocabulary.

Document the distinction between:
- immutable packet identity
- human-readable packet label/title
- source inbox filename
- normalized slug
- durable packet filename
- active lifecycle reference
- completion/reference packet identifier

Clarify which fields are authoritative and which are display/convenience fields.

3. Define packet identity coherence rules.

Define rules such as:
- active-runtime and next-action must refer to the same packet identity
- claim state must refer to the active packet identity
- completion signals should reference the same packet identity as the active packet
- cleanup must not erase durable packet identity records
- packet visibility should expose identity consistently
- accepted packet records must remain durable even if source inbox candidates are cleaned
- source filename must not be treated as authoritative identity after intake

4. Evaluate current packet ID generation.

Assess whether current packet id generation is sufficient.

Specifically evaluate risks around:
- duplicate titles
- duplicate normalized slugs
- repeated packet attempts
- inbox filename drift
- title changes during intake
- activation by filename vs activation by id
- packet path ambiguity
- future supersede or lineage semantics

Do not introduce GUID-based identity unless the implementation is small, compatible, and clearly justified. A documented recommendation is acceptable.

5. Add or update identity coherence tests.

Add deterministic fixture-isolated tests for packet identity coherence.

Cover:
- intake records source path, title, packet id, normalized filename, and durable packet path coherently
- activation writes coherent active-runtime and next-action references
- blocked activation does not change active packet identity
- cleanup preserves durable packet identity records
- cleanup clears transient active identity only when safe
- source inbox filename is not required after acceptance
- packet visibility or equivalent read surface reports coherent identity where currently testable

6. Add duplicate/ambiguous identity tests where feasible.

Add tests or documented gaps for:
- duplicate packet titles
- duplicate normalized slugs
- existing packet filename collision
- activation ambiguity
- repeated intake of same source file
- repeated intake of different source files with same title

If current behavior is not robust, document the gap and recommend a follow-up packet instead of weakening the identity model.

7. Update documentation or contract notes.

Add or update a contract/reference note describing packet identity semantics.

Suggested locations:
- `.scaffoldai/contracts/`
- `.scaffoldai/reference/`
- existing lifecycle transition contract if appropriate

Document:
- current identity behavior
- authoritative vs non-authoritative identity fields
- known risks
- recommended future identity model

8. Recommend next hardening packet.

Recommend the next packet after this work.

Likely candidates include:
- stable GUID packet identity
- activation aliases and latest-accepted activation
- safe_idle formalization
- supersede lifecycle semantics
- property-based lifecycle simulation
- packet backlog/deferred findings capture
- MCP candidate SDC submission

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. current packet identity behavior summary
3. packet identity vocabulary defined
4. coherence rules defined
5. tests added or updated
6. duplicate/ambiguous identity risks discovered
7. recommended future identity model
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
- no GUID identity migration unless small, compatible, and explicitly justified
- human-controlled commits only
