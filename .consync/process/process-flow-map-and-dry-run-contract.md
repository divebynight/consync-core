# Process Flow Map and Dry-Run Contract

Captured: 2026-04-29
Packet: `process-flow-map-and-dry-run-contract-v1`

---

## 1. Purpose

This document is a design and contract map for the Consync process loop.

It describes what happens when, who is responsible at each step, where
dry-run behavior belongs, and where the first agent/gate should be placed
when it is eventually implemented.

**No agent, gate, or code is implemented by this packet.**

This document is the authoritative design surface for the gatekeeper flow.
Any future implementation packet must be consistent with this map or must
explicitly supersede it with approval.

---

## 2. Core Principles

These principles must hold at every layer of the process:

1. **Each interaction is an individual action.**
   No SDC (Specification/Design/Change packet) should assume that a prior
   conversation established hidden context. Each packet is self-contained.

2. **No hidden continuity between SDCs.**
   An SDC must restate current branch, current mode, current in-flight
   state, and key constraints before generating a new work packet.

3. **Current state must be declared before a new SDC is generated.**
   If state cannot be determined, the correct response is BLOCK, not guess.

4. **Midflight work blocks new SDCs.**
   If a packet is in flight and has not been closed out, new SDCs must be
   blocked unless the action is one of: closeout, recovery, cancel, or an
   explicitly approved supersede.

5. **Multi-step work requires visible step accounting.**
   Any multi-step action must declare its progress explicitly: `1/3`, `2/3`,
   `3/3`. Implicit continuation is not permitted.

6. **AI proposes; contract/gate validates; user approves; execution tool acts.**
   This is the mandatory ordering. AI must not act without gate validation.
   Gate must not act without user approval. Execution must not skip verify.

7. **Dry-run must be available before execution.**
   Every gate decision should be previewable without performing any action.
   A user must be able to ask "what would happen?" before any packet fires.

---

## 3. Flow Map

The following is the authoritative linear flow for each user request.
Each step should be independently testable.

```
[1] USER REQUEST
    │
    ▼
[2] INTAKE / GATEKEEPER
    - Classify the request type (product, process, contract, recovery, etc.)
    - Check current mode lock (if any)
    - Read .consync/state/* to determine current state
    │
    ▼
[3] MODE CHECK
    - Is there an active mode lock? (e.g. CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN)
    - If yes: is this request consistent with the mode?
    - If no match → BLOCK with reason
    │
    ▼
[4] GIT STATE CHECK
    - Is the working tree clean? (git status)
    - If dirty and not a closeout action → CLOSEOUT_REQUIRED
    - If dirty and action is closeout → ALLOW
    │
    ▼
[5] IN-FLIGHT WORK CHECK
    - Is there an active packet that is not closed out?
    - Check .consync/state/next-action.md and handoff.md
    - If in-flight work exists and request is not closeout/recovery/cancel:
      → CLOSEOUT_REQUIRED or BLOCK
    │
    ▼
[6] REQUEST CLASSIFICATION
    - What type of action is being requested?
      product / process / docs / contract / agent / recovery / closeout / dry-run
    - Check against allowed types for current mode and state
    - If disallowed type → BLOCK with reason
    │
    ▼
[7] DRY-RUN / INSPECT OUTPUT
    - Produce a dry-run report (see §6 for contract)
    - Show: gate decision, files likely affected, expected verify, reason
    - Do not execute anything at this step
    │
    ▼
[8] USER APPROVAL
    - Present gate decision and dry-run report to user
    - Wait for explicit approval before proceeding
    - If user declines → stop, no state change
    │
    ▼
[9] SDC GENERATION
    - Generate the packet/SDC document
    - Must include: PACKET_ID, ALLOWED FILES, VERIFY level, BLOCKED WORK
    - Must restate current branch, mode, and in-flight status
    │
    ▼
[10] COPILOT EXECUTION
    - Execute the packet as specified
    - Do not expand scope
    - Emit step accounting if multi-step (1/N, 2/N, etc.)
    │
    ▼
[11] VERIFICATION
    - Run the verify commands specified in the packet
    - npm run check:state-preflight
    - npm run verify (or narrower subset if packet specifies)
    - npm run check:state-postflight
    - If verify fails → RECOVERY_REQUIRED
    │
    ▼
[12] CLOSEOUT
    - Confirm all changes match ALLOWED FILES
    - Confirm commit is staged and committed correctly
    - Write work-log entry if required
    - Update any live state files that the packet specified
    │
    ▼
[13] STATE UPDATE / NEXT CHECKPOINT
    - Update .consync/state/handoff.md
    - Update .consync/state/next-action.md
    - Mark packet as closed
    - System returns to IDLE / ready for next request
```

---

## 4. Actors and Responsibilities

### User
- Initiates requests.
- Approves gate decisions and dry-run reports.
- Must not bypass the gate by directly instructing execution tools to skip steps.
- Responsible for resolving in-flight work before requesting new work.

### ChatGPT
- Classifies user requests.
- Generates SDC documents.
- Restates current state before each SDC.
- Does not execute code directly.
- Must not silently assume continuity from prior conversations.

### Intake / Gatekeeper Agent
- Reads `.consync/state/*` to determine current execution context.
- Classifies the incoming request.
- Produces a gate decision and dry-run report.
- Does not perform product work.
- Does not write files beyond gate output.
- Returns one of the gate decisions defined in §5.

### Copilot / Codex Executor
- Receives a fully formed SDC packet.
- Executes only within declared ALLOWED FILES scope.
- Emits step accounting for multi-step work.
- Runs verification as specified.
- Does not expand scope based on judgment.

### Contract Gate
- Validates that an SDC is consistent with current mode and state.
- Enforces BLOCKED WORK declarations.
- May be implemented as a script (`npm run check:contract` or similar) in a
  future packet.
- Returns a machine-readable gate decision (see §5).

### Verification Commands
- `npm run check:state-preflight` — confirms state is safe before work begins.
- `npm run verify` — runs full test suite.
- `npm run check:state-postflight` — confirms state is coherent after work ends.
- These are the canonical pre/post gate for every packet.

### Closeout Process
- Confirms commit, scope, and state update.
- Writes work-log entry if required.
- Declares the packet closed.
- Resets the system to a clean checkpoint.

---

## 5. Gate Decisions

The gatekeeper must return exactly one of these decisions for each request.
Each decision must include a reason.

| Decision | Meaning |
|---|---|
| `ALLOW` | Request is consistent with current mode and state. Proceed. |
| `BLOCK` | Request violates mode lock, scope, or active constraint. Stop. |
| `CLOSEOUT_REQUIRED` | In-flight work exists. Must be closed out before proceeding. |
| `RECOVERY_REQUIRED` | Prior execution left state dirty or verification failing. Recover first. |
| `CANCEL_REQUIRED` | In-flight work is stale or invalid. Must be explicitly cancelled. |
| `SUPERSEDE_REQUIRES_APPROVAL` | Request would replace an active packet. Requires explicit user approval before proceeding. |

### Decision rules

- `ALLOW` requires: clean git state (or closeout action), no in-flight packet
  (or closeout/recovery action), and request type consistent with mode.
- `BLOCK` applies when mode lock explicitly prohibits the request type and no
  overriding condition is present.
- `CLOSEOUT_REQUIRED` applies when in-flight work exists and the new request
  is neither closeout, recovery, cancel, nor supersede.
- `RECOVERY_REQUIRED` applies when the last verify run failed or the working
  tree contains uncommitted partial work from a prior execution.
- `CANCEL_REQUIRED` applies when in-flight work is stale beyond a defined
  threshold (e.g. no activity for N sessions) and cannot be safely continued.
- `SUPERSEDE_REQUIRES_APPROVAL` applies when a new SDC would replace an
  in-flight packet that is still valid.

---

## 6. Dry-Run Contract

A dry-run must produce a report without performing any execution. The report
must include all of the following fields.

```
DRY-RUN REPORT
─────────────────────────────────────────────────────

Requested action:        [short description]
Requested packet type:   [product | process | contract | agent | recovery | closeout | docs]

Current mode:            [mode lock name, or NONE]
Current branch:          [branch name]
Current in-flight state: [packet ID if in flight, or NONE]
Git state:               [clean | dirty — list changed files if dirty]

Allowed packet types:    [list of types currently allowed]
Blocked packet types:    [list of types currently blocked, with reason]

Files likely affected:   [list if known, or UNKNOWN]
Expected verify level:   [FAST_CHECK | UI_CHECK | FULL_VERIFY]

Gate decision:           [ALLOW | BLOCK | CLOSEOUT_REQUIRED | RECOVERY_REQUIRED | CANCEL_REQUIRED | SUPERSEDE_REQUIRES_APPROVAL]
Reason:                  [one sentence explaining the decision]

Next required action:    [what the user must do before execution can proceed, if not ALLOW]
─────────────────────────────────────────────────────
```

A dry-run must never:
- Write any file.
- Create any commit.
- Execute any test or verify command.
- Change any state.

A dry-run should be triggered automatically when:
- The gatekeeper produces a BLOCK or CLOSEOUT_REQUIRED decision.
- The user explicitly requests an inspect/preview before execution.
- The request type is novel or ambiguous.

> **Current implementation:** `node src/index.js dry-run-check [flags]` is the simulation-only dry-run command. It reads real state and applies Gatekeeper decision logic but does not prompt, execute, or write files. It satisfies this contract for simulation purposes only.

---

## 7. Unit-Test Style Examples

The following examples define expected gatekeeper behavior. Each example is
an input/output pair. Future gate implementations must produce these outputs
for these inputs.

---

### Example 1 — Product request while in contract/design mode lock

```
INPUT:
  mode lock: CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
  request type: product feature (new UI element)
  in-flight state: NONE
  git state: clean

EXPECTED OUTPUT:
  gate decision: BLOCK
  reason: Mode lock CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN prohibits product feature work.
  next required action: Remove mode lock or complete design-mode work before requesting product changes.
```

---

### Example 2 — New SDC while a packet is midflight (no drift)

```
INPUT:
  mode lock: NONE
  request type: new feature packet
  in-flight state: packet idea-surface-from-notes-v1 is open
  git state: dirty (modified App.jsx)

EXPECTED OUTPUT:
  gate decision: CLOSEOUT_REQUIRED
  reason: Packet idea-surface-from-notes-v1 is open and working tree is dirty.
  next required action: Close out the in-flight packet before requesting a new one.
```

---

### Example 3 — Dirty git state before new packet, no in-flight work

```
INPUT:
  mode lock: NONE
  request type: new feature packet
  in-flight state: NONE
  git state: dirty (untracked file added, no open packet)

EXPECTED OUTPUT:
  gate decision: CLOSEOUT_REQUIRED
  reason: Working tree is dirty with no in-flight packet to explain the state.
  next required action: Commit, stash, or discard the uncommitted changes before starting a new packet.
```

---

### Example 4 — Closeout request while working tree is dirty

```
INPUT:
  mode lock: NONE
  request type: closeout
  in-flight state: packet widget-view-product-model-v1 is open
  git state: dirty (staged changes consistent with in-flight packet)

EXPECTED OUTPUT:
  gate decision: ALLOW
  reason: Request is a closeout action for the open in-flight packet; dirty state is expected.
  next required action: none — proceed with closeout.
```

---

### Example 5 — Recovery request after failed verify

```
INPUT:
  mode lock: NONE
  request type: recovery
  in-flight state: packet notes-keyword-suggestions-v1 (verify failed)
  git state: dirty

EXPECTED OUTPUT:
  gate decision: RECOVERY_REQUIRED
  reason: Prior verify failed on in-flight packet. Recovery is the only permitted action.
  next required action: Execute recovery packet to restore green verify before proceeding.
```

---

### Example 6 — Dry-run request (inspect mode, no execution)

```
INPUT:
  mode lock: NONE
  request type: dry-run / inspect
  in-flight state: NONE
  git state: clean

EXPECTED OUTPUT:
  gate decision: ALLOW
  reason: Dry-run requests are always allowed; no execution will occur.
  dry-run report: [produce full report per §6 contract, no files written]
```

---

### Example 7 — Supersede request for in-flight packet

```
INPUT:
  mode lock: NONE
  request type: new packet that replaces open packet docs-restructure-move-v1
  in-flight state: docs-restructure-move-v1 is open
  git state: clean

EXPECTED OUTPUT:
  gate decision: SUPERSEDE_REQUIRES_APPROVAL
  reason: A new packet would replace the in-flight packet docs-restructure-move-v1.
  next required action: User must explicitly approve the supersede before a new packet is generated.
```

---

### Example 8 — Contract/design mode request consistent with mode lock

```
INPUT:
  mode lock: CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN
  request type: process design document (this packet)
  in-flight state: NONE
  git state: clean

EXPECTED OUTPUT:
  gate decision: ALLOW
  reason: Request type (process design document) is consistent with CONTRACT_AND_AGENT_ENFORCEMENT_DESIGN mode.
  next required action: none — proceed.
```

---

## 8. First Agent Placement

The first agent to implement is the **Intake / Gatekeeper** agent.

### Why first

Every other agent — Preflight, Verify, Closeout, Reentry — operates after
the gate has already determined that work is allowed. The Intake / Gatekeeper
is the entry point. Without it, mode locks and in-flight state checks are
advisory only.

### What it must do

- Read `.consync/state/next-action.md`, `handoff.md`, and `active-stream.md`.
- Classify the incoming request.
- Run a mode check against declared mode locks.
- Check git state via `git status --porcelain`.
- Check for open in-flight packets.
- Produce a gate decision and dry-run report.
- Return without executing any product or process work.

### What it must not do

- Write to product files.
- Modify agent files.
- Execute tests.
- Generate SDC packets on its own.
- Assume prior conversation context.

### Binding point

The Intake / Gatekeeper agent will be bound at:
`.consync/agents/intake.agent.md`

The current `intake.agent.md` exists but does not yet implement the gate
decision logic defined in this document. When it is updated, it must conform
to this contract.

---

## 9. Current System Capability (Soft Gate Phase)

As of 2026-04-29, the following packets from the implementation roadmap are complete:

| Packet ID | Status | Notes |
|---|---|---|
| `active-contract-file-v1` | Done | `.consync/state/active-contract.json` exists and is read at decision time |
| `gatekeeper-agent-contract-v1` | Done | `src/lib/gatekeeperDecision.js` implements the full decision logic from §4–5 |
| `dry-run-check-command-v1` | Done | `node src/index.js dry-run-check` — simulation only; reads real state; no prompt; no execution |
| `packet-state-tracking-v1` | Done | `src/lib/getInFlightPacket.js` reads in-flight state from `next-action.md`; `PACKAGE: NONE` is the closed-state marker |
| `consync-run-command-v1` | Done | `node src/index.js consync-run` — soft gate; reads real state; prompts for approval; no execution |

**What is not yet implemented:**
- Automatic enforcement (gate is never invoked without explicit CLI call).
- Packet execution (approval in `consync-run` produces no work).
- Background agents, runners, or watchers of any kind.

The user is the final authority. The system does not execute packets.

---

## 10. Next Implementation Candidates

The following packets are the next logical steps. They are ordered by dependency.

| Packet ID | Description | Depends on |
|---|---|---|
| `consync-run-execution-wiring-v1` | Wire actual packet execution to `consync-run` after user approval. | All items in §9 |
| `gatekeeper-auto-invoke-v1` | Automatically invoke the gate on every SDC submission before Copilot executes. | `consync-run-execution-wiring-v1` |
| `work-log-auto-append-v1` | Append a work-log entry automatically after each successful closeout. | `gatekeeper-auto-invoke-v1` |
