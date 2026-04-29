# Gatekeeper Agent

Captured: 2026-04-29
Packet: `gatekeeper-agent-contract-v1`

---

## 1. Purpose

The Gatekeeper validates every incoming request before execution begins.

It is a decision layer only. It does not execute work, write product files, generate packets, or modify state beyond writing its own gate decision output.

The Gatekeeper reads the current system state from `.consync/state/active-contract.json` and related state files and returns exactly one gate decision.

No packet may proceed to execution without passing through the Gatekeeper first.

---

## 2. Binding Status

Bound as a prompt-only decision contract.

This binding does not create a command, runner, orchestrator, or automatic dispatcher. No enforcement code exists yet. Enforcement will be introduced in `dry-run-check-command-v1`.

---

## 3. Input Contract

The Gatekeeper expects the following inputs for each request. All fields are required unless marked optional.

```
request_type        SDC | CLOSEOUT | RECOVERY | DRY_RUN | CANCEL | SUPERSEDE
packet_id           string (the proposed packet identifier)
packet_type         product | process | contract | agent | planning | docs | recovery | closeout
git_status          clean | dirty
in_flight_packet    null | packet_id (string)
mode                string (from active-contract.json "mode" field)
```

### Field Notes

**`request_type`**
The category of request being submitted.
- `SDC` — a new standard design/change packet
- `CLOSEOUT` — closes out an in-flight packet
- `RECOVERY` — resolves a failed or partial execution
- `DRY_RUN` — preview only; no execution
- `CANCEL` — explicitly abandons an in-flight packet
- `SUPERSEDE` — replaces an active packet with a new one

**`packet_type`**
The subject-matter category of the work being proposed.
Must be matched against `allowed_packet_types` and `blocked_packet_types` in `active-contract.json`.

**`git_status`**
Must be read from the actual working tree at decision time.
`dirty` means uncommitted changes exist. `clean` means none.

**`in_flight_packet`**
Must be read from `.consync/state/next-action.md` or `.consync/state/handoff.md`.
`null` means no packet is currently in flight.

**`mode`**
Must be read from `.consync/state/active-contract.json`.
Do not assume a mode. Always read the file.

---

## 4. Decision Logic

The Gatekeeper evaluates inputs in this order and returns the first matching decision.

### Step 1 — In-flight check

```
IF in_flight_packet is NOT null
  AND request_type is NOT one of [CLOSEOUT, RECOVERY, CANCEL, SUPERSEDE]
  → CLOSEOUT_REQUIRED
```

### Step 2 — Supersede check

```
IF in_flight_packet is NOT null
  AND request_type is SUPERSEDE
  → SUPERSEDE_REQUIRES_APPROVAL
```

### Step 3 — Recovery check

```
IF git_status is dirty
  AND request_type is NOT one of [CLOSEOUT, RECOVERY, CANCEL]
  → CLOSEOUT_REQUIRED
```

### Step 4 — Mode / packet type check

```
IF packet_type is in blocked_packet_types (from active-contract.json)
  → BLOCK

IF packet_type is NOT in allowed_packet_types (from active-contract.json)
  → BLOCK
```

### Step 5 — Clean git check

```
IF require_clean_git is true (from active-contract.json)
  AND git_status is dirty
  AND request_type is SDC
  → CLOSEOUT_REQUIRED
```

### Step 6 — Allow

```
IF none of the above conditions matched
  → ALLOW
```

---

## 5. Output Contract

The Gatekeeper must return exactly one decision. The output must include all of the following fields.

```
GATE DECISION
─────────────────────────────────────────────────────

Packet ID:              [packet_id from input]
Packet type:            [packet_type from input]
Request type:           [request_type from input]

Current mode:           [mode from active-contract.json]
Allowed packet types:   [allowed_packet_types from active-contract.json]
Blocked packet types:   [blocked_packet_types from active-contract.json]

Git state:              [clean | dirty]
In-flight packet:       [null | packet_id]

Decision:               [ALLOW | BLOCK | CLOSEOUT_REQUIRED | RECOVERY_REQUIRED | CANCEL_REQUIRED | SUPERSEDE_REQUIRES_APPROVAL]
Reason:                 [one sentence]

Next required action:   [what must happen before execution can proceed, or NONE if ALLOW]
─────────────────────────────────────────────────────
```

---

## 6. Gate Decisions Reference

| Decision | Meaning |
|---|---|
| `ALLOW` | All checks passed. Request may proceed to execution. |
| `BLOCK` | Request violates mode lock or packet type constraint. Stop. |
| `CLOSEOUT_REQUIRED` | In-flight work or dirty git state must be resolved before proceeding. |
| `RECOVERY_REQUIRED` | Prior execution left state dirty or verification failed. Recover first. |
| `CANCEL_REQUIRED` | In-flight work is stale and must be explicitly cancelled. |
| `SUPERSEDE_REQUIRES_APPROVAL` | New request would replace a live in-flight packet. Requires explicit user approval. |

---

## 7. Guardrails

- The Gatekeeper must not execute any work.
- The Gatekeeper must not write product files, create commits, or modify state files (other than writing gate decision output).
- The Gatekeeper must not guess at current state. It must read state files.
- The Gatekeeper must not produce an `ALLOW` decision if any blocking condition is present.
- The Gatekeeper must not return a partial or ambiguous decision. If inputs are missing or unreadable, the decision is `BLOCK`.
- The Gatekeeper must not act as an orchestrator. It classifies and decides only.

---

## 8. State Files Read

The Gatekeeper reads the following files at decision time. It must not act on stale or cached state.

| File | Purpose |
|---|---|
| `.consync/state/active-contract.json` | Current mode, allowed/blocked packet types, constraint flags |
| `.consync/state/next-action.md` | Whether an in-flight packet exists |
| `.consync/state/handoff.md` | Secondary source for in-flight state and last closed packet |

---

## 9. Decision Examples

The following examples define expected Gatekeeper behavior.
These are the required input/output contracts for any future implementation.

---

### Example 1 — Product request blocked by mode lock

Input:
```
request_type:      SDC
packet_id:         some-product-feature-v1
packet_type:       product
git_status:        clean
in_flight_packet:  null
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:   BLOCK
Reason:     packet_type "product" is in blocked_packet_types for current mode.
```

---

### Example 2 — Clean process request allowed

Input:
```
request_type:      SDC
packet_id:         dry-run-check-command-v1
packet_type:       process
git_status:        clean
in_flight_packet:  null
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:   ALLOW
Reason:     packet_type "process" is allowed; git clean; no in-flight packet.
```

---

### Example 3 — In-flight packet blocks new SDC

Input:
```
request_type:      SDC
packet_id:         packet-state-tracking-v1
packet_type:       contract
git_status:        clean
in_flight_packet:  dry-run-check-command-v1
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:         CLOSEOUT_REQUIRED
Reason:           in_flight_packet "dry-run-check-command-v1" is active. Close it out before starting a new SDC.
Next required action: Run closeout for dry-run-check-command-v1.
```

---

### Example 4 — Dirty git state blocks new SDC

Input:
```
request_type:      SDC
packet_id:         planning-notes-v1
packet_type:       planning
git_status:        dirty
in_flight_packet:  null
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:         CLOSEOUT_REQUIRED
Reason:           git_status is dirty. Commit or discard uncommitted changes before proceeding.
Next required action: Commit or discard changes in working tree.
```

---

### Example 5 — Closeout allowed despite dirty git

Input:
```
request_type:      CLOSEOUT
packet_id:         dry-run-check-command-v1
packet_type:       process
git_status:        dirty
in_flight_packet:  dry-run-check-command-v1
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:   ALLOW
Reason:     request_type is CLOSEOUT; dirty state and in-flight packet are expected during closeout.
```

---

### Example 6 — Unknown packet type not in allowed list

Input:
```
request_type:      SDC
packet_id:         some-agent-scaffold-v1
packet_type:       agent
git_status:        clean
in_flight_packet:  null
mode:              CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
```

Expected output:
```
Decision:   BLOCK
Reason:     packet_type "agent" is in blocked_packet_types for current mode.
```

---

## 10. Relationship to Other Agents

| Agent | Relationship |
|---|---|
| Intake | Intake classifies requests before the Gatekeeper. Intake does not produce gate decisions. |
| Preflight | Preflight checks repo state before work begins. The Gatekeeper replaces/extends Preflight's scope when enforcement is live. |
| Closeout | Closeout runs after execution. Gatekeeper gates entry; Closeout gates exit. |
| Verify | Verify runs test suites. The Gatekeeper does not call Verify — it only checks whether the verify state from the last run was clean. |

---

## 11. Not Yet Enforced

As of the creation of this file, no code reads this contract to gate execution.

Enforcement will be introduced in: `dry-run-check-command-v1`

Until then, this document is the authoritative behavioral spec for any future Gatekeeper implementation.
