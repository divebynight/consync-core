# ScaffoldAI Lifecycle Transition Table

Status: ACTIVE CONTRACT
Packet: define-scaffoldai-lifecycle-transition-table.sdc
Date: 2026-05-16
Baseline: Packet 1 audit `.scaffoldai/audits/scaffoldai-repo-structure-lifecycle-state-machine-test-plan.audit.md`

---

## Purpose

Convert the implicit ScaffoldAI packet lifecycle into explicit documented system law.

This contract defines:
- canonical lifecycle states
- allowed transitions
- forbidden transitions
- authority class requirements
- testable lifecycle invariants
- test coverage mapping

It is planning, contract, and reference material only.
It does not introduce MCP write authority, autonomous execution, or new enforcement hooks.

---

## Clarified Semantic Ambiguities

The following ambiguities were identified and resolved during contract authoring.

### Packet identity semantics

A packet has two identity forms:
- `packet-id`: the canonical ID used in runtime state pointers (e.g. `my-packet.sdc`). It is the filename of the accepted packet file minus the final `.md` extension.
- `packet-file`: the physical durable file in `.scaffoldai/packets/` (e.g. `my-packet.sdc.md`).

Intake derives a normalized `packet-file` from the packet title slug. The `packet-id` is always the `.md`-stripped form of that filename.

Authoritative runtime surfaces reference the `packet-id`, never the `packet-file` path directly.

### Activation semantics

Activation does not move or copy the packet file. It writes the `packet-id` into two authoritative state pointers:
- `.scaffoldai/state/active-runtime.json` (`in_flight_packet` field)
- `.scaffoldai/state/next-action.md` (`PACKET_ID:` line)

The packet file itself remains durable in `.scaffoldai/packets/` unchanged. Activation changes where the runtime pointer points, not the artifact.

### Normalized filename behavior

Intake normalizes a submitted SDC packet into a canonical filename under `.scaffoldai/packets/`. The normalization is deterministic and derives from the packet title. This means:
- the inbox candidate filename and the accepted packet filename may differ
- the accepted packet filename is the authoritative identity surface post-intake

### Active vs claimed semantics

These are distinct lifecycle states and must not be conflated:

| Concept | Meaning | Authoritative field |
|---|---|---|
| active | The runtime pointer is set to this packet | `active-runtime.json:in_flight_packet` |
| claimed | An execution lock is held by a specific owner | `active-runtime.json:claimed_by` |

A packet can be active without being claimed. A packet cannot be claimed without being active. A claimed packet must always have a single owner.

### Append-only vs authoritative surfaces

| Surface | Role | Authority class |
|---|---|---|
| `.scaffoldai/state/active-runtime.json` | authoritative runtime state | AUTHORITATIVE_WRITE via CLI only |
| `.scaffoldai/state/next-action.md` | authoritative active pointer | AUTHORITATIVE_WRITE via CLI only |
| `.scaffoldai/state/history.jsonl` | append-only observational history | APPEND_ONLY |
| `.scaffoldai/runtime/mcp/signals.jsonl` | append-only MCP coordination | APPEND_ONLY via scaffoldai_signal only |
| `.scaffoldai/runtime/mcp/shared-memory.jsonl` | append-only MCP coordination | APPEND_ONLY via scaffoldai_memory_write only |

Append-only surfaces are observational and non-authoritative. No lifecycle decision may use them as a source of truth for state transitions.

### Cleanup and finalization boundaries

Cleanup operations are bounded to known ScaffoldAI transient runtime surfaces:
- `.scaffoldai/state/active-runtime.json` (reset pointer fields)
- `.scaffoldai/state/next-action.md` (reset to NONE)
- `.scaffoldai/state/snapshot.md` (neutralize package section)
- `.scaffoldai/runtime/packet-intake/latest-intake.json` (remove)
- `.scaffoldai/inbox/*.sdc.md` consumed candidates (remove)

Cleanup must never touch:
- `.scaffoldai/packets/` durable artifacts
- `.scaffoldai/contracts/` durable contracts
- `.scaffoldai/state/history.jsonl` (append-only; preserved by default)
- `.scaffoldai/runtime/mcp/signals.jsonl` (append-only; preserved by default)
- `.scaffoldai/runtime/mcp/shared-memory.jsonl` (append-only; preserved by default)
- source implementation files
- durable documentation

---

## 1. Canonical Lifecycle States

### planned

| Field | Value |
|---|---|
| Meaning | Idea exists, no candidate artifact yet |
| Entry condition | Human decides a packet is worth drafting |
| Exit condition | Human authors a candidate and places it in inbox |
| Authoritative surface | No ScaffoldAI surface; purely conceptual |
| Observational surface | Planning docs, notes |
| Allowed authority | human |
| Durability | not tracked by system |
| Cleanup behavior | n/a |

### candidate

| Field | Value |
|---|---|
| Meaning | Draft packet file exists in inbox awaiting intake |
| Entry condition | Packet file placed in `.scaffoldai/inbox/` |
| Exit condition | `scaffoldai packet intake` accepts or rejects the candidate |
| Authoritative surface | `.scaffoldai/inbox/*.sdc.md` (transient) |
| Observational surface | `.scaffoldai/runtime/packet-intake/latest-intake.json` |
| Allowed authority | human, CLI intake command |
| Durability | TRANSIENT — inbox candidates are gitignored by policy |
| Cleanup behavior | intake-artifact cleanup may remove consumed inbox candidates |

### accepted

| Field | Value |
|---|---|
| Meaning | Intake passed; durable packet exists in packets directory |
| Entry condition | `scaffoldai packet intake` succeeds and writes durable packet file |
| Exit condition | Packet is activated (active), superseded, or manually removed |
| Authoritative surface | `.scaffoldai/packets/<id>.sdc.md` |
| Observational surface | `.scaffoldai/runtime/packet-intake/latest-intake.json`, readonly MCP packet visibility |
| Allowed authority | CLI intake command (write); human, CLI, MCP (read) |
| Durability | DURABLE — never auto-deleted by cleanup |
| Cleanup behavior | never removed by runtime housekeeping |

### active

| Field | Value |
|---|---|
| Meaning | Packet pointer is set in runtime state; work may begin |
| Entry condition | `scaffoldai packet activate` sets runtime pointer to this packet |
| Exit condition | Claim acquired (claimed), explicitly cleared (safe_idle path), or superseded |
| Authoritative surface | `active-runtime.json:in_flight_packet`, `next-action.md:PACKET_ID` |
| Observational surface | `scaffoldai status`, `scaffoldai packet status`, readonly MCP status |
| Allowed authority | CLI activation command |
| Durability | TRANSIENT runtime pointer; underlying packet file remains DURABLE |
| Cleanup behavior | runtime-state reset clears active pointer, packet file preserved |

### claimed

| Field | Value |
|---|---|
| Meaning | Execution lock held by exactly one owner; active work in progress |
| Entry condition | `scaffoldai packet claim` succeeds with active packet and no conflicting owner |
| Exit condition | Owner releases claim (released) or force-release by human (released) |
| Authoritative surface | `active-runtime.json:claimed_by`, `active-runtime.json:claim_status` |
| Observational surface | `scaffoldai packet claim-status`, readonly MCP status claim fields |
| Allowed authority | CLI claim command |
| Durability | TRANSIENT claim pointer |
| Cleanup behavior | cleanup is blocked while claim is active |

### blocked

| Field | Value |
|---|---|
| Meaning | A lifecycle transition was denied; denial reason is recorded |
| Entry condition | A lifecycle operation fails a precondition check |
| Exit condition | Precondition is resolved and operation is retried |
| Authoritative surface | return value of CLI/auth function; no separate state file |
| Observational surface | CLI output, MCP tool response, optional signal record |
| Allowed authority | any authority attempting a transition that fails |
| Durability | NOT a persistent state; it is a transition-result concept |
| Cleanup behavior | n/a |

### verification_pending

| Field | Value |
|---|---|
| Meaning | Execution work complete; verification evidence not yet recorded |
| Entry condition | Human/agent finishes implementation work under claimed packet |
| Exit condition | Verify command runs and passes |
| Authoritative surface | conceptual; represented by claimed state with no completion signal |
| Observational surface | `scaffoldai verify` output, closeout readiness |
| Allowed authority | human, agent under claimed packet |
| Durability | TRANSIENT conceptual state; no separate state file |
| Cleanup behavior | n/a |

### verified

| Field | Value |
|---|---|
| Meaning | Required verify command has passed |
| Entry condition | `npm run verify:scaffoldai` (or target-specific command) returns exit 0 |
| Exit condition | Completion signal emitted with verify evidence |
| Authoritative surface | verify command exit code; no separate state file |
| Observational surface | `scaffoldai verify` output, `scaffoldai closeout` readiness report |
| Allowed authority | CLI verify runner, local verify command |
| Durability | TRANSIENT evidence; captured via completion signal |
| Cleanup behavior | n/a |

### completed

| Field | Value |
|---|---|
| Meaning | Packet work is done, verify evidence present, completion signal recorded |
| Entry condition | `scaffoldai_signal` packet_completed with verify_status: passed |
| Exit condition | Human releases claim and proceeds to closeout |
| Authoritative surface | `.scaffoldai/runtime/mcp/signals.jsonl` (append-only, advisory) |
| Observational surface | `scaffoldai completion-status`, `scaffoldai closeout` |
| Allowed authority | MCP signal append (APPEND_ONLY) |
| Durability | Signal is DURABLE in append-only log; not a separate state pointer |
| Cleanup behavior | signals.jsonl preserved by default |

### closed

| Field | Value |
|---|---|
| Meaning | Closeout readiness confirmed; human review path ready |
| Entry condition | `scaffoldai closeout --verify-passed` produces READY_FOR_REVIEW |
| Exit condition | Human reviews, commits, and proceeds |
| Authoritative surface | closeout command output; no separate state pointer |
| Observational surface | `scaffoldai closeout` output |
| Allowed authority | CLI closeout command (read-only authority) |
| Durability | TRANSIENT conceptual state; no separate state file |
| Cleanup behavior | n/a |

### released

| Field | Value |
|---|---|
| Meaning | Claim owner lock cleared; packet may be safe-idled or reactivated |
| Entry condition | `scaffoldai packet release` by owner, or force-release by human |
| Exit condition | Cleanup runs (cleaned) or packet is directly cleared (safe_idle) |
| Authoritative surface | `active-runtime.json` claim fields cleared |
| Observational surface | `scaffoldai packet claim-status` |
| Allowed authority | CLI claim release, human force-release |
| Durability | TRANSIENT pointer |
| Cleanup behavior | cleanup may follow release |

### cleaned

| Field | Value |
|---|---|
| Meaning | Transient runtime and intake artifacts have been bounded-reset |
| Entry condition | `scaffoldai housekeeping clean-workspace` or `reset-runtime-state` completes |
| Exit condition | Active pointer becomes null; system approaches safe_idle |
| Authoritative surface | state files reset to NONE/null; intake metadata removed |
| Observational surface | `scaffoldai housekeeping status`, `scaffoldai status` |
| Allowed authority | CLI housekeeping command |
| Durability | Post-clean state is transient pointer state |
| Cleanup behavior | this IS the cleanup transition |

### safe_idle

| Field | Value |
|---|---|
| Meaning | No active packet and no claim owner; system is quiescent |
| Entry condition | `active-runtime.json:in_flight_packet = null` AND `claimed_by = null` |
| Exit condition | New packet is activated (active) |
| Authoritative surface | `active-runtime.json`, `next-action.md` |
| Observational surface | `scaffoldai status`, `scaffoldai packet claim-status` |
| Allowed authority | any read authority for observation |
| Durability | STABLE quiescent state |
| Cleanup behavior | safe to run any cleanup in this state |

### superseded

| Field | Value |
|---|---|
| Meaning | Packet explicitly replaced by a successor through approved lifecycle action |
| Entry condition | Human explicitly clears or releases active packet before activating successor |
| Exit condition | Successor packet is activated |
| Authoritative surface | active-runtime and next-action cleared then updated |
| Observational surface | history.jsonl record of transition |
| Allowed authority | human approval required; CLI command executes |
| Durability | Superseded packet file remains DURABLE in packets directory |
| Cleanup behavior | superseded packet is never auto-deleted |

---

## 2. Lifecycle Transition Table

### Normal forward path

| # | From | To | Trigger | Preconditions | Authority | Authoritative mutation | Append record | Failure behavior |
|---|---|---|---|---|---|---|---|---|
| T01 | planned | candidate | Human authors draft and places in inbox | human decision | human | `.scaffoldai/inbox/*.sdc.md` written | none | n/a |
| T02 | candidate | accepted | `scaffoldai packet intake` passes validation | valid SDC structure, policy compliant | CLI intake | `.scaffoldai/packets/<id>.sdc.md` written | `runtime/packet-intake/latest-intake.json` updated | blocked; recovery hints emitted |
| T03 | candidate | rejected | `scaffoldai packet intake` fails validation | any validation failure | CLI intake | no packet file written | `latest-intake.json` records rejection | error output with stable recovery hints |
| T04 | accepted | active | `scaffoldai packet activate <packet>` | packet file exists in packets dir, path must be under `.scaffoldai/packets/` | CLI packet command | `active-runtime.json:in_flight_packet`, `next-action.md:PACKET_ID` updated | `state/history.jsonl` appended | throws with clear rejection message |
| T05 | active | claimed | `scaffoldai packet claim --client <id>` | active packet exists, no conflicting claim owner | CLI claim command | `active-runtime.json:claimed_by`, `claim_status`, `claimed_at` written | none (observational via MCP) | returns `{success:false, reason:"busy"}` or `"no_active_packet"` |
| T06 | claimed | claimed (idempotent) | Same client re-claims | active packet with same owner already claimed | CLI claim command | no-op | none | returns `{success:true, idempotent:true}` |
| T07 | claimed | verification_pending | Human/agent completes implementation work | packet is claimed; work is done | agent under claim | no state mutation; conceptual transition | none | n/a |
| T08 | verification_pending | verified | `npm run verify:scaffoldai` passes | claimed packet, verify exits 0 | CLI verify runner | none to authoritative state | optional `scaffoldai_signal` append | verify runner reports failure with exit code |
| T09 | verified | completed | `scaffoldai_signal packet_completed` with `verify_status:passed` | verification evidence provided | MCP scaffoldai_signal (APPEND_ONLY) | none to authoritative state (signals.jsonl APPEND) | `runtime/mcp/signals.jsonl` record | signal rejected if verify fields missing |
| T10 | completed | released | `scaffoldai packet release --client <id>` | claimant is the owner | CLI claim release | `active-runtime.json` claim fields cleared | none | returns `{success:false, reason:"not_owner"}` |
| T11 | released | cleaned | `scaffoldai housekeeping clean-workspace` | no active claim | CLI housekeeping | `active-runtime.json` pointer reset, `next-action.md` set to NONE | touched/skipped report | blocked if claim active |
| T12 | cleaned | safe_idle | cleanup completes; pointers are null | cleanup ran successfully | CLI housekeeping | all pointer fields null | none | n/a |

### Recovery / alternative paths

| # | From | To | Trigger | Preconditions | Authority | Notes |
|---|---|---|---|---|---|---|
| T13 | active | safe_idle | `scaffoldai packet clear` | no active claim required; claim cleared on clear | CLI packet command | Explicit human clear bypassing full release/cleanup sequence |
| T14 | claimed | released | `scaffoldai packet force-release` | human authority; no owner check | CLI force-release | Overrides owner restriction; human-only authority |
| T15 | claimed | blocked | Any precondition failure during execution | precondition fails | any | Blocked result returned; no state mutation |
| T16 | blocked | claimed | Retry after precondition resolved | precondition now satisfied | any | Re-attempt the originally blocked transition |
| T17 | accepted | superseded | Human clears or replaces active packet pointer with new packet | human approval | human + CLI | Superseded packet file remains durable |
| T18 | active | superseded | `scaffoldai packet clear` then `activate <successor>` | no active claim on prior packet | human + CLI | Prior packet file preserved |

---

## 3. Forbidden Transitions

| # | Attempted transition | Failure reason | Expected behavior |
|---|---|---|---|
| F01 | safe_idle → claimed | no active packet | `claimPacket` returns `{success:false, reason:"no_active_packet"}` |
| F02 | claimed → claimed (different owner) | busy collision | `claimPacket` returns `{success:false, reason:"busy", claimed_by: <owner>}` |
| F03 | candidate → active | packet not in packets dir | `activatePacket` throws; intake must precede activation |
| F04 | accepted → active (malformed path) | path outside packets dir | `activatePacket` throws `"must stay under .scaffoldai/packets/"` |
| F05 | active → active (replace without clear) | in-flight already set | new activate while packet active produces unexpected state; operator must clear first |
| F06 | verification_pending → completed | no verification evidence | `scaffoldai_signal` rejects `packet_completed` without required `verify_command` and `verify_status:passed` |
| F07 | completed → closed | closeout before `--verify-passed` | `scaffoldai closeout` without `--verify-passed` flag does not emit `READY_FOR_REVIEW` |
| F08 | active+claimed → cleaned | claim active | `cleanWorkspace` returns `{status:"blocked", reason:"claim_active"}` |
| F09 | any → accepted packet deleted | cleanup deleting packets dir | cleanup bounds check must preserve `.scaffoldai/packets/` |
| F10 | any → history.jsonl deleted/overwritten | append-only log destroyed | cleanup preserves by default; `--include-runtime-logs` does not touch history.jsonl |
| F11 | readonly MCP → authoritative state mutated | no write tool registered | MCP HTTP has no write tools; MCP stdio has APPEND_ONLY tools only; any authoritative write is a boundary violation |
| F12 | blocked packet type → active | policy mode blocks type | gatekeeper decision returns `BLOCK`; `activatePacket` would not be called for blocked category |
| F13 | active → superseded (without human authority) | autonomous supersede | no autonomous supersede path exists; requires explicit human CLI action |
| F14 | non-owner → released | not_owner | `releasePacket` returns `{success:false, reason:"not_owner"}` |
| F15 | intake → accepted (malformed candidate) | validation failure | validator rejects with stable error codes; no packet file written |

---

## 4. Authority Classes

| Authority class | Description | Lifecycle operations allowed |
|---|---|---|
| **human** | The human operator making decisions at keyboard | All operations; ultimate authority over commits, activations, supersedes, force-releases |
| **CLI_intake** | `scaffoldai packet intake` command | candidate → accepted/rejected only |
| **CLI_activation** | `scaffoldai packet activate`, `clear` commands | accepted → active, active → safe_idle (clear) |
| **CLI_claim** | `scaffoldai packet claim`, `release`, `force-release` | active → claimed, claimed → released |
| **CLI_housekeeping** | `scaffoldai housekeeping *` commands | cleaned → safe_idle, bounded transient reset only |
| **CLI_verify** | `scaffoldai verify`, `npm run verify:scaffoldai` | verification evidence generation |
| **CLI_closeout** | `scaffoldai closeout` | read-only closeout readiness reporting |
| **agent_under_claim** | An AI agent that has acquired a packet claim | execute work under claimed packet, emit completion signals, release own claim |
| **MCP_readonly** | MCP tools (status, preflight, question, etc.) | READ_ONLY observation of authoritative state; no lifecycle mutations |
| **MCP_append_only** | `scaffoldai_signal`, `scaffoldai_memory_write` | APPEND_ONLY to `runtime/mcp/` surfaces only; no authoritative state writes |
| **future_candidate_submission** | Not yet implemented | Would allow structured candidate placement in inbox; requires separate contract |

### Authority matrix

| Operation | human | CLI_intake | CLI_activation | CLI_claim | CLI_housekeeping | agent_under_claim | MCP_readonly | MCP_append_only |
|---|---|---|---|---|---|---|---|---|
| Draft packet | ✓ | — | — | — | — | ✓ (propose) | — | — |
| Place in inbox | ✓ | — | — | — | — | ✓ | — | — |
| Intake packet | ✓ | ✓ | — | — | — | — | — | — |
| Activate packet | ✓ | — | ✓ | — | — | — | — | — |
| Claim packet | ✓ | — | — | ✓ | — | ✓ | — | — |
| Execute work | ✓ | — | — | — | — | ✓ | — | — |
| Run verify | ✓ | — | — | — | — | ✓ | — | — |
| Emit completion signal | ✓ | — | — | — | — | ✓ | — | ✓ |
| Release own claim | ✓ | — | — | ✓ | — | ✓ | — | — |
| Force-release | ✓ | — | — | — | — | — | — | — |
| Closeout report | ✓ | — | — | — | — | ✓ | ✓ | — |
| Clean transient state | ✓ | — | — | — | ✓ | — | — | — |
| Commit changes | ✓ | — | — | — | — | — | — | — |
| Observe state | ✓ | — | — | — | — | ✓ | ✓ | — |

---

## 5. Lifecycle Invariants

### INV-01 Safe-idle invariant

`safe_idle ⟺ (in_flight_packet = null AND claimed_by = null)`

Both conditions must hold simultaneously. Either condition alone is insufficient.

### INV-02 Single-owner claim invariant

At any moment, `claimed_by` contains at most one value. No concurrent ownership is possible. Attempting to claim an already-claimed packet returns `{success:false, reason:"busy"}` regardless of the competing identity.

### INV-03 Active-required-for-claim invariant

`claimed ⟹ in_flight_packet ≠ null`

A claimed state without an active packet pointer is an invalid state. `claimPacket` enforces this by checking `in_flight_packet` before allowing the claim to proceed.

### INV-04 Accepted-packet durability invariant

An accepted packet file under `.scaffoldai/packets/` is never deleted by runtime cleanup. Cleanup operations are bounded to known transient runtime surfaces only.

### INV-05 Inbox-transience invariant

Inbox candidate files under `.scaffoldai/inbox/*.sdc.md` are transient and gitignored. They may be removed by explicit intake-artifact cleanup. They are never the authoritative source of packet identity after intake.

### INV-06 Append-only preservation invariant

Append-only logs (`history.jsonl`, `signals.jsonl`, `shared-memory.jsonl`) are never overwritten or deleted by runtime cleanup. Records are only appended. `--include-runtime-logs` flag on `reset-runtime-state` may clear signals/shared-memory only; history.jsonl is always preserved.

### INV-07 Readonly MCP non-mutation invariant

No MCP tool registered on the MCP HTTP surface has write authority. No MCP stdio tool writes to `.scaffoldai/state/` or `.scaffoldai/streams/`. All MCP stdio write-capable tools are bounded to `runtime/mcp/` append operations only.

### INV-08 Cleanup preservation invariant

The following surfaces must be intact after any housekeeping cleanup command:
- `.scaffoldai/packets/` all `.sdc.md` and history files
- `.scaffoldai/contracts/` all contract files
- `src/` all source files
- `.scaffoldai/state/history.jsonl`
- `.scaffoldai/runtime/mcp/signals.jsonl`
- `.scaffoldai/runtime/mcp/shared-memory.jsonl`

### INV-09 Blocked-transition rejection invariant

Any forbidden transition (F01–F15) must produce a deterministic rejection response including a stable `reason` field. No forbidden transition silently succeeds or produces partial state.

### INV-10 Malformed-candidate rejection invariant

A candidate packet that fails strict intake validation is never written to `.scaffoldai/packets/`. The rejection response includes stable recovery hints pointing to the canonical example and template.

### INV-11 Human-authority boundary invariant

Commits, force-releases, packet supersedes, and stream switches require human authority. No autonomous agent path exists for these operations. No MCP tool performs them.

### INV-12 Packet-id coherence invariant

After activation, `active-runtime.json:in_flight_packet` and the `PACKET_ID:` line in `next-action.md` must reference the same `packet-id` value. Divergence between these two fields is an invalid state.

---

## 6. Test Coverage Mapping

### T01 planned → candidate
- Coverage: not applicable (no system surface to test)

### T02 candidate → accepted (happy path)
- `unit-scaffoldai-packet-intake.js` — "valid SDC accepted", "inbox path intake accepted without warning"
- `unit-scaffoldai-lifecycle-simulation.js` — lifecycle happy path intake phase
- Coverage: STRONG

### T03 candidate → rejected
- `unit-scaffoldai-packet-intake.js` — "malformed title rejected", "missing sections rejected", "invalid mode rejected", "malformed approval block rejected", "blocked authority requests rejected", "malformed canonical section ordering rejected", "rejected packets never written"
- Coverage: STRONG

### T04 accepted → active
- `unit-scaffoldai-packet-activation.js` — "valid activation writes pointer and metadata"
- `unit-scaffoldai-lifecycle-simulation.js` — activate phase, "activate_while_active" blocked transition
- Coverage: STRONG for happy path; missing explicit test for activation when active_policy blocks the packet type

### T05 active → claimed
- `unit-scaffoldai-packet-claim.js` — "claim succeeds with active packet and no prior claim"
- `unit-scaffoldai-lifecycle-simulation.js` — claim phase
- Coverage: STRONG

### T06 claimed → claimed (idempotent)
- `unit-scaffoldai-packet-claim.js` — "same client claim is idempotent"
- Coverage: STRONG

### T07 claimed → verification_pending
- `unit-scaffoldai-lifecycle-simulation.js` — verify_without_active_claim blocked transition
- Coverage: PARTIAL — the conceptual transition is present; no explicit verification_pending state surface to assert

### T08 verification_pending → verified
- `unit-scaffoldai-lifecycle-simulation.js` — verify_execution phase
- `unit-scaffoldai-verify-runner.js` — allowlisted verify command, pass/fail outcomes
- Coverage: STRONG

### T09 verified → completed
- `unit-scaffoldai-lifecycle-simulation.js` — completion_signal phase, completion_without_verification blocked transition
- `unit-scaffoldai-mcp-readonly.js` — packet_completed signal validation
- Coverage: STRONG

### T10 completed → released
- `unit-scaffoldai-packet-claim.js` — "release by owner succeeds and clears claim"
- `unit-scaffoldai-lifecycle-simulation.js` — claim_release phase
- Coverage: STRONG

### T11 released → cleaned
- `unit-scaffoldai-housekeeping.js` — "clean-workspace orchestrates intake cleanup + runtime reset with durable preservation"
- `unit-scaffoldai-lifecycle-simulation.js` — clean_workspace phase, "cleanup_while_claimed" blocked transition
- Coverage: STRONG

### T12 cleaned → safe_idle
- `unit-scaffoldai-lifecycle-simulation.js` — verified in cleanup result assertions
- Coverage: PARTIAL — no explicit `safe_idle` state assertion as a named invariant check

### T13 active → safe_idle (clear path)
- `unit-scaffoldai-packet-activation.js` — "clear behavior only clears active pointer"
- Coverage: STRONG

### T14 claimed → released (force-release)
- `unit-scaffoldai-packet-claim.js` — "force-release works regardless of owner", "force-release with no claim succeeds cleanly"
- Coverage: STRONG

### F01 safe_idle → claimed
- `unit-scaffoldai-packet-claim.js` — "claim fails when no active packet"
- `unit-scaffoldai-lifecycle-simulation.js` — "claim_without_active_packet" blocked
- Coverage: STRONG

### F02 dual claim ownership
- `unit-scaffoldai-packet-claim.js` — "different client claim is rejected with busy response"
- `unit-scaffoldai-lifecycle-simulation.js` — collision phase
- Coverage: STRONG

### F03 candidate → active (no intake)
- Covered implicitly by activation path checking packets dir
- Coverage: PARTIAL — no explicit test named for this forbidden path

### F04 malformed path activation
- `unit-scaffoldai-packet-activation.js` — "outside packet paths are rejected"
- Coverage: STRONG

### F05 active replacement without clear
- `unit-scaffoldai-lifecycle-simulation.js` — "activate_while_active" blocked
- Coverage: STRONG

### F06 completion without verification
- `unit-scaffoldai-lifecycle-simulation.js` — "completion_without_verification" blocked
- `unit-scaffoldai-mcp-readonly.js` — "runSignalTool rejects packet_completed when required verify fields are missing"
- Coverage: STRONG

### F07 closeout before verify-passed
- `unit-scaffoldai-closeout.js` — "without --verify-passed → no READY_FOR_REVIEW"
- Coverage: STRONG

### F08 cleanup while claimed
- `unit-scaffoldai-lifecycle-simulation.js` — "cleanup_while_claimed" blocked
- `unit-scaffoldai-housekeeping.js` — housekeeping status classifications
- Coverage: STRONG

### F09 durable packets deleted by cleanup
- `unit-scaffoldai-lifecycle-simulation.js` — "packet_files_preserved: true" assertion
- `unit-scaffoldai-housekeeping.js` — preservation assertions
- Coverage: STRONG

### F10 append-only logs destroyed
- `unit-scaffoldai-lifecycle-simulation.js` — "logs_preserved: true", skipped records
- `unit-scaffoldai-housekeeping.js` — optional runtime log cleanup is explicit and bounded
- Coverage: STRONG

### F11 readonly MCP mutation
- `unit-scaffoldai-mcp-readonly.js` — server.js/tools.js write API static checks, execution_class assertions
- `mcp-readonly-security.js` — 11 source files passed static boundary checks
- Coverage: STRONG

### F12 blocked packet type activation
- `unit-dry-run-check.js` — "product packet blocked by mode lock", "agent packet blocked by mode lock"
- Coverage: STRONG for dry-run/gatekeeper layer; activation-layer block is implicit

### F13 autonomous supersede
- No runtime path exists; structural invariant
- Coverage: structural (no autonomous supersede code path exists)

### F14 non-owner release
- `unit-scaffoldai-packet-claim.js` — "release by non-owner fails"
- Coverage: STRONG

### F15 malformed candidate intake
- `unit-scaffoldai-packet-intake.js` — multiple rejection cases
- Coverage: STRONG

### Coverage gaps and priorities

| Gap | Priority | Notes |
|---|---|---|
| INV-12: packet-id coherence (active-runtime vs next-action alignment) | HIGH | No explicit divergence-detection invariant test exists |
| T12: explicit safe_idle state assertion | HIGH | No test names and asserts the safe_idle definition post-cleanup |
| F05: explicit replace-without-clear test | MEDIUM | Covered implicitly by activate_while_active but no named forbidden test |
| F03: explicit candidate-bypasses-intake test | MEDIUM | Covered structurally but no named forbidden test |
| Transition-table exhaustive legality matrix | HIGH | No single test iterates over the full T01–T18 / F01–F15 matrix |

---

## 7. Follow-Up Executable Matrix Test Packet

### Recommended packet title

`define-scaffoldai-lifecycle-matrix-tests.sdc`

### Likely test file location

`src/test/unit-scaffoldai-lifecycle-matrix.js`

### Fixture isolation strategy

- All tests must operate on fixture-root only (`.scaffoldai/tmp/<test-name>-<random>/`)
- Fixture initialization must snapshot and verify live runtime is unchanged before and after each test sequence
- No test may write to real `.scaffoldai/state/`, `.scaffoldai/packets/`, or `.scaffoldai/streams/`

### Transition-table fixture shape

Each test case is a structure:

```
{
  id: "T04",           // transition or forbidden-transition id from this contract
  label: "accepted → active",
  setup: function(fixtureRoot) { /* produce initial state */ },
  action: function(fixtureRoot) { /* call the CLI/auth function */ },
  assert: function(result, fixtureRoot) { /* assert expected outcome */ },
  expectBlocked: false,
  expectedReason: null,
}
```

### Expected negative test organization

- One describe-equivalent block per forbidden transition F01–F15
- Each block asserts the specific `reason` field in the rejection result
- Each block verifies no partial authoritative state mutation occurred

### Relationship to randomized testing

Once the matrix test file exists, the property-based follow-up packet can:
- generate random sequences of valid transition IDs from this contract
- apply them to a fixture root via the same `action` functions
- assert all named invariants (INV-01 through INV-12) after each generated step
- use `fast-check` `.shrink` semantics to produce minimal failing sequences

---

## Related Surfaces

- `.scaffoldai/audits/scaffoldai-repo-structure-lifecycle-state-machine-test-plan.audit.md` — Packet 1 baseline
- `.scaffoldai/contracts/state-schema.contract.md` — Approved state file schema
- `.scaffoldai/reference/state-write-surfaces.reference.md` — Authority map
- `.scaffoldai/contracts/ai-tool-access.contract.md` — MCP access boundaries
- `src/test/unit-scaffoldai-lifecycle-simulation.js` — Current lifecycle simulation test
- `src/test/unit-scaffoldai-packet-claim.js` — Claim/collision tests
- `src/test/unit-scaffoldai-packet-intake.js` — Intake validation tests
- `src/test/unit-scaffoldai-packet-activation.js` — Activation tests
- `src/test/scaffoldai-invariants.test.js` — Architectural invariant tests
