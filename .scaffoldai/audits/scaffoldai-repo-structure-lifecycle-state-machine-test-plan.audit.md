# ScaffoldAI Repo Structure Inventory And Lifecycle State-Machine Test Plan

Status: PACKET EXECUTION OUTPUT
Packet: scaffoldai-repo-structure-inventory-and-lifecycle-state-machine-test-plan.sdc
Date: 2026-05-16

## Scope And Boundaries

This report is planning and classification only.

Preserved constraints:
- no MCP write authority expansion
- no autonomous execution
- no broad repository reorganization
- no Consync product/runtime changes
- no lifecycle boundary weakening

## 1) Repository Structure Inventory Summary

### A. ScaffoldAI source and implementation
- `src/scaffoldai/commands/` - CLI command layer
- `src/lib/*.scaffoldai.js` - authority/query/auth modules
- `src/scaffoldai.js` and `src/cli/scaffoldai.js` - entry surfaces

### B. Bridge state (authoritative)
- `.scaffoldai/state/` - active runtime pointers, handoff, snapshot, stream pointer
- `.scaffoldai/streams/` - stream continuity state

### C. Runtime state (non-authoritative)
- `.scaffoldai/runtime/packet-intake/latest-intake.json` - intake transient metadata
- `.scaffoldai/runtime/mcp/` - runtime MCP append artifacts
- `.scaffoldai/tmp/` - transient verify/debug output

### D. Append-only operational surfaces
- `.scaffoldai/state/history.jsonl`
- `.scaffoldai/runtime/mcp/signals.jsonl`
- `.scaffoldai/runtime/mcp/shared-memory.jsonl`

### E. Packet intake/archive surfaces
- `.scaffoldai/inbox/*.sdc.md` - transient candidate packets
- `.scaffoldai/packets/*.sdc.md` - durable accepted packet artifacts
- `.scaffoldai/packets/packet-*.md` - retained historical packet records

### F. Contracts, docs, templates, examples
- `.scaffoldai/contracts/` - durable constraints and authority contracts
- `.scaffoldai/process/` - runbook/process flow docs
- `.scaffoldai/reference/` - operational references
- `.scaffoldai/templates/` - authoring templates
- `.scaffoldai/examples/` - canonical passing examples

### G. Test and fixture surfaces coupled to lifecycle behavior
- `src/test/unit-scaffoldai-lifecycle-simulation.js`
- `src/test/unit-scaffoldai-packet-intake.js`
- `src/test/unit-scaffoldai-packet-claim.js`
- `src/test/unit-scaffoldai-packet-activation.js`
- `src/test/unit-scaffoldai-housekeeping.js`
- `src/test/unit-scaffoldai-mcp-readonly.js`
- `src/test/scaffoldai-invariants.test.js`

## 2) Ambiguity And Drift Findings

1. Inbox vs packets duality increases cognitive load.
- Candidate and accepted versions of similar packet names can coexist.

2. Durable accepted packets and retained packet-history records share one directory.
- Mixed role is valid but easy to misread without strict naming language.

3. Bridge state semantics are distributed.
- Active/in-flight meaning is composed across multiple files in `.scaffoldai/state/`.

4. Runtime append-only files can be confused as authority.
- `signals.jsonl` and `shared-memory.jsonl` are non-authoritative despite rich event content.

5. Lifecycle ownership boundaries are not always explicit in command output language.
- "active" and "claimed" can be interpreted as equivalent by operators even though they are separate states.

## 3) Target Repository Taxonomy Proposal

| Category | Intended location | Allowed contents | Forbidden contents | Commit expectation | Ignore expectation | Cleanup expectation |
|---|---|---|---|---|---|---|
| Durable source | `src/scaffoldai/`, `src/lib/*.scaffoldai.js` | command/auth/query implementation | runtime logs, tmp files | tracked | not ignored | never runtime-cleaned |
| Durable contracts | `.scaffoldai/contracts/` | active policy/authority contracts | runtime pointers, generated telemetry | tracked | not ignored | never runtime-cleaned |
| Durable docs/reference | `.scaffoldai/process/`, `.scaffoldai/reference/`, `.scaffoldai/README.md` | process docs and references | transient logs | tracked | not ignored | manual only |
| Templates/examples | `.scaffoldai/templates/`, `.scaffoldai/examples/` | reusable templates/examples | active packet pointers | tracked | not ignored | manual only |
| Bridge state (authoritative) | `.scaffoldai/state/`, `.scaffoldai/streams/` | active state pointers, stream docs, append history | product artifacts, tmp traces | mostly tracked; runtime members may be ignored by policy | mixed | bounded housekeeping only |
| Accepted packet archive | `.scaffoldai/packets/` | accepted `.sdc.md` and retained packet history | candidate drafts, tmp output | tracked by intent | not ignored by default | never auto-delete |
| Intake candidates (transient) | `.scaffoldai/inbox/` | candidate `.sdc.md` drafts pending intake | accepted/archive records | usually untracked transient | ignored (`.scaffoldai/inbox/*.sdc.md`) | explicit intake cleanup |
| Runtime append logs | `.scaffoldai/runtime/mcp/` | append-only runtime coordination logs | authoritative state files | usually untracked | ignored | preserved by default |
| Runtime transient metadata | `.scaffoldai/runtime/packet-intake/`, `.scaffoldai/tmp/` | latest intake metadata, debug output | authoritative policy/state | untracked | ignored | explicit bounded cleanup |
| Tests/fixtures | `src/test/` | fixture-root lifecycle and invariant tests | writes into live repo state during tests | tracked | not ignored | fixture teardown only |

## 4) Lifecycle Terminology Summary

State vocabulary:
- planned: backlog idea, no candidate artifact
- candidate: inbox packet draft exists
- accepted: strict intake passed and durable packet exists
- active: packet mounted in active state pointers
- claimed: active packet lock owned by one client
- blocked: transition denied due to policy/collision/precondition failure
- verification_pending: execution done, verify evidence not yet attached
- verified: verify command passed for packet target
- completed: packet completion signal recorded with verify evidence
- closed: closeout readiness complete, human review path ready
- released: claim cleared and packet lock removed
- cleaned: transient runtime/intake artifacts reset within bounds
- safe_idle: no active packet and no claim owner
- superseded: active/accepted packet replaced through explicit lifecycle action

## 5) Lifecycle Transition Planning Summary

### Allowed transition groups
- planned -> candidate -> accepted
- accepted -> active -> claimed
- claimed -> verification_pending -> verified -> completed
- completed -> released -> cleaned -> safe_idle
- active or claimed -> blocked (with explicit denial reason)
- blocked -> active or claimed (only after preconditions recover)

### Required preconditions and surfaces
- intake/accept: valid canonical SDC and policy pass
- activation: packet exists in `.scaffoldai/packets/` and activation policy allows
- claim: active packet exists and no conflicting owner
- complete/closeout: verify evidence is present and valid
- cleanup: no unsafe active claim conflict for destructive runtime resets

Observable surfaces:
- authoritative state pointers: `.scaffoldai/state/`
- stream continuity: `.scaffoldai/streams/`
- append-only state evidence: `.scaffoldai/state/history.jsonl`
- append-only runtime coordination: `.scaffoldai/runtime/mcp/*.jsonl`

### Negative transition analysis
- closeout before verification -> forbidden
- claim without active packet -> forbidden
- dual claim attempts with different client -> forbidden (collision busy)
- malformed packet activation -> forbidden
- cleanup deleting durable artifacts -> forbidden
- readonly MCP mutation of authoritative state -> forbidden
- blocked packet-type execution -> forbidden by active policy
- active packet replacement without release/clear -> forbidden
- cleanup during active claimed work -> forbidden

## 6) Lifecycle Enforcement Testing Strategy

### Existing coverage (high confidence)
- strict intake validation, section ordering, policy rejection
- activation flow and pointer consistency
- claim/collision/release semantics
- cleanup preservation of durable packet/archive and append logs
- lifecycle simulation with blocked transitions
- readonly MCP execution-class boundaries
- state schema and architecture invariants

### Missing or expandable coverage
- explicit transition-table legality matrix tests over full vocabulary
- more exhaustive negative-order assertions around closeout/verification timing
- stronger cross-command ordering checks under interrupted sequences
- explicit regression tests for packet/inbox/archive taxonomy language and semantics

### High-value invariant tests
- claim owner uniqueness invariant
- active pointer coherence invariant
- durable packet preservation under all cleanup variants
- append-only log non-overwrite invariant
- readonly MCP no-authoritative-write invariant
- safe-idle invariant (`active_packet = NONE` and `claim_owner = null`)

## 7) Randomized / Property-Based Testing Strategy

Introduce property-based lifecycle simulation using a sequence generator (for example `fast-check`) against fixture roots only.

Generated operations:
- intake(valid/invalid)
- activate(packet)
- claim(client)
- release(client)
- force_release(client)
- verify(pass/fail)
- completion_signal(valid/invalid)
- cleanup(mode)

Core randomized invariants:
- no forbidden transition is accepted
- no authoritative write via readonly MCP tools
- no durable packet deletion during cleanup
- append-only files are never rewritten
- dual-client claim collisions never produce dual ownership
- safe-idle state remains well-formed after cleanup/release sequences

Failure diagnostics expectations:
- shrinking to minimal reproducer sequence
- deterministic sequence seed emission
- touched-surface inventory on failure
- invariant identifier in assertion output

## 8) Recommended Follow-Up Packets (Ordered)

1. Lifecycle transition table contract + executable transition matrix tests.
2. Exhaustive negative-transition packet focused on denial paths and ordering violations.
3. Property-based lifecycle simulation packet (fixture-root only, no live-state mutation).
4. Packet surface taxonomy hardening packet (accepted vs retained-history clarity).
5. Cleanup safety formalization packet (durable/transient constraints in one contract table).
6. Lifecycle terminology normalization packet (status/CLI wording alignment).
7. Safe-idle formalization packet (single canonical readiness definition and checks).

## 9) Verification Result

Command:
- `npm run verify:scaffoldai`

Result:
- PASS

Summary:
- CLI / command tests: PASS
- bridge / state tests: PASS
- system tests: PASS
- renderer tests: NOT RUN by this target
- e2e tests: NOT RUN by this target
