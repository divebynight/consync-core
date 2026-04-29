# Active Contract

## Purpose

`active-contract.json` is the machine-readable state surface for the Consync process loop.

It represents the current system mode and execution constraints. Future gatekeeper and agent logic will read this file to determine what is allowed before executing any packet.

This file is the authoritative source of truth for:
- current system mode
- allowed and blocked packet types
- in-flight packet tracking
- basic execution constraints

**This file is not yet enforced automatically.** Enforcement logic will be introduced in a future packet (`gatekeeper-agent-contract-v1`).

---

## Field Reference

### `mode`
The current operational mode of the system.

Controls what categories of work are appropriate right now. Must be set explicitly when shifting context.

Example values:
- `"CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN"` — process/contract design work only
- `"OPEN"` — general product and process work permitted

---

### `allowed_packet_types`
Array of packet type strings that are permitted in the current mode.

A future gatekeeper agent will check incoming packet types against this list before allowing execution.

Example: `["process", "contract", "planning"]`

---

### `blocked_packet_types`
Array of packet type strings that are explicitly blocked in the current mode.

A future gatekeeper agent will reject packets matching any type in this list.

Example: `["product", "agent"]`

---

### `in_flight_packet`
The ID of any packet currently being executed, or `null` if none.

Used to prevent concurrent packet execution. A future gatekeeper will block new packet starts if this field is non-null.

Example: `"active-contract-file-v1"` or `null`

---

### `require_clean_git`
Boolean. If `true`, a future gatekeeper will require a clean git working tree before executing any packet.

Prevents accidental execution on top of uncommitted changes.

---

### `require_dry_run`
Boolean. If `true`, a future gatekeeper will require a dry-run report to be produced and approved before executing any packet.

Corresponds to the dry-run contract defined in `.consync/process/process-flow-map-and-dry-run-contract.md`.

---

## Authoritative Surface

This file (`active-contract.json`) is the single source of truth for system execution constraints.

When implementing gatekeeper or agent logic, read from this file — do not hardcode mode logic or constraint values in scripts or commands.

When shifting system mode or constraints, update this file explicitly as a tracked state change.

---

## Not Yet Enforced

As of the creation of this file, no enforcement logic exists.

The contract is defined and tracked, but no command or agent currently reads it to gate execution.

Enforcement will be introduced in: `gatekeeper-agent-contract-v1`
