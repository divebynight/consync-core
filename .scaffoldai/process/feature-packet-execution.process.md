# SUPPORTING PROCESS DOCUMENTATION — NOT SOURCE OF TRUTH
# Feature Packet Execution

A design doc describing how Consync handles mid-size features composed of multiple work packets.

## Role Boundary

Role: feature-level coordination and execution flow.

Answers: "Given an ordered packet list, how do we safely execute, advance, stop, and close out the feature?"

---

## 1. Overview

### What is a Feature Packet?

A Feature Packet is a planned, bounded unit of work that:

- Represents a mid-size feature too large for a single work packet
- Is decomposed into two or more sequential work packets
- Has a defined goal, readiness gate, and explicit closeout
- Produces verified, committed output at each step before advancing

### How it differs from a Work Packet

| Dimension         | Work Packet (v3)                          | Feature Packet                                  |
|-------------------|-------------------------------------------|-------------------------------------------------|
| Size              | One focused task                          | Multiple coordinated tasks                      |
| Scope             | Single file area or behavior              | Cross-cutting feature or capability             |
| Execution         | One agent, one pass                       | Multiple packets, ordered execution             |
| Completion check  | Artifact + doc + commit                   | All child packets complete + integrity verified |
| Idempotency       | Per-packet (ALREADY_COMPLETE check)       | Per-packet + per-feature gate                   |

A Feature Packet is not a new format. It is a coordination layer on top of existing work packets.

---

## 2. High-Level Flow

```
PLAN
  └─ Define feature goal
  └─ Decompose into ordered packets
  └─ Identify readiness requirements

READINESS GATE
  └─ Confirm repo is clean
  └─ Run verify:full
  └─ No open work blocking this feature

PACKET EXECUTION LOOP
  For each packet (in order):
    └─ Run the packet using work-packet-v3
    └─ Advance only on COMPLETE or ALREADY_COMPLETE
    └─ Halt the feature if a packet returns STOPPED

INTEGRITY VERIFICATION
  └─ Run FULL_VERIFY after all packets complete
  └─ Confirm work-log entries exist for each packet
  └─ Confirm no unexpected files were changed

CLOSEOUT
  └─ Run closeout-agent workflow
  └─ Update handoff.md and work-log with feature-level summary
  └─ Confirm clean repo state
```

---

## 3. Roles

These roles describe process responsibilities. They may be performed by a human, a Copilot agent, or a ChatGPT session. They are not separate tools.

### Planner

**Responsibility:** Define the feature and decompose it into packets.

- Writes the feature goal
- Identifies packet ordering and dependencies
- Does not begin execution

### Readiness

**Responsibility:** Confirm the system is in a state where work can safely begin.

- Checks that repo is clean (`git status`)
- Runs `npm run verify:full`
- Confirms no unresolved open work

### Worker

**Responsibility:** Execute a single work packet using the work-packet-v3 template.

- Follows `.scaffoldai/templates/work-packet-v3.md`
- Returns the packet outcome defined by that template

### Integrity

**Responsibility:** Confirm the full feature is coherent after all packets complete.

- Runs `npm run verify:full`
- Checks work-log for packet entries
- Checks for unexpected file changes

### Closeout

**Responsibility:** Record the completed feature and reset system state.

- Appends a feature-level entry to work-log
- Updates `handoff.md` as appropriate
- Confirms clean repo state

---

## 4. Execution Loop

For each packet in the feature:

1. **Before starting:** confirm the previous packet returned COMPLETE or ALREADY_COMPLETE. If any packet returned STOPPED, halt the feature execution.

2. **Run the packet** using `.scaffoldai/templates/work-packet-v3.md`.

3. **After the packet completes:** run the verification level required for advancing the feature. See `.scaffoldai/verification/verification-ladder.md`.

4. **Record the result** in `.scaffoldai/process/work-log.log.md` using the packet's PACKET_ID.

5. **Advance** to the next packet only when:
   - The current packet returned COMPLETE or ALREADY_COMPLETE
   - the required verification passes
   - No unexpected files were changed outside the packet's ALLOWED FILES

If any of these conditions fail, stop and record a STOPPED entry in the work-log before attempting to unblock.

---

## 5. Readiness Gate

Before starting any work on a Feature Packet, all of the following must pass:

| Check                          | Command / Method                         |
|-------------------------------|------------------------------------------|
| Repo is clean                 | `git status` — no uncommitted changes    |
| No failing tests              | `npm test`                               |
| Full verify passes            | `npm run verify:full`                    |
| No open blocking work         | Review `.scaffoldai/state/handoff.md`    |
| Feature is decomposed         | Packet list is written and ordered       |

Do not begin packet execution until all readiness checks pass.

---

## 6. Stop Conditions

Halt feature execution (do not advance to the next packet) if any of the following occur:

- A packet returns STOPPED
- Required feature-level verification fails
- An unclear product decision must be resolved before the feature can continue
- Unexpected files were changed outside the scope of the active packet
- `npm run verify:full` fails at the integrity check phase

Generic packet stop conditions are defined in `.scaffoldai/templates/work-packet-v3.md`. Record the feature-level reason in the work-log and leave the repo in a clean state before stopping.

---

## 7. Relationship to Existing System

### work-packet-v3

Feature Packet execution is built directly on top of the work-packet-v3 template. Each step in the feature is a work packet.

See: `.scaffoldai/templates/work-packet-v3.md`

### Verification Ladder

Feature Packet execution uses the shared verification ladder. This document only adds feature-level timing: verification before starting, between packets as needed, and at final integrity check.

See: `.scaffoldai/verification/verification-ladder.md`

### Closeout Process

Feature Packet closeout follows the same closeout-agent workflow used for individual packets. The difference is that a feature-level summary is also appended to the work-log in addition to each packet's own entry.

See: `.scaffoldai/skills/closeout-agent.md`

### Coverage Map

If the feature touches UI or e2e test paths, the UI coverage map should be reviewed before starting and updated if new coverage is added.

See: `.scaffoldai/verification/ui-e2e-coverage-map.md`

---

## Principle

A Feature Packet is not a project management layer. It is a discipline for executing multi-packet work without losing the safety properties of individual work packets.

Each packet in a feature should be independently verifiable, independently committable, and independently idempotent. The feature layer only adds: ordering, a readiness gate, and a shared closeout.

If feature-level coordination becomes heavier than the packets themselves, the scope is too large and should be broken into smaller features.
