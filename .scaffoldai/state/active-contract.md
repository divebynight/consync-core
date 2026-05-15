# Active Contract

## Purpose

`active-contract.json` is a legacy compatibility mirror for the Consync process loop.

Durable policy and transient runtime execution state are now split:

- Durable policy: `.scaffoldai/contracts/active-policy.json`
- Runtime active state: `.scaffoldai/state/active-runtime.json`

Runtime and CLI readers compose these two sources through `src/lib/scaffoldaiState.state.scaffoldai.js`.

This compatibility file may still contain:
- current system mode
- allowed and blocked packet types
- in-flight packet tracking
- basic execution constraints

But it is no longer the primary write target for in-flight runtime packet changes.

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

Corresponds to the dry-run contract defined in `.scaffoldai/process/process-flow-map-and-dry-run-contract.process.md`.

---

## Authoritative Surface

Authoritative split model:

- `active-policy.json` is the tracked source of truth for durable process policy.
- `active-runtime.json` is the runtime source of truth for transient in-flight execution state.

`active-contract.json` is maintained only for compatibility during migration and should not be relied on as the primary runtime write surface.

---

## Not Yet Enforced

As of the creation of this file, no enforcement logic exists.

The contract is defined and tracked, but no command or agent currently reads it to gate execution.

Enforcement will be introduced in: `gatekeeper-agent-contract-v1`
