# Gatekeeper Recommendation Packet Examples — v0

Created: 2026-05-08
Status: REFERENCE / EXAMPLES
Role: supporting reference

---

## 1. Purpose

This reference pressure-tests the Gatekeeper Recommendation Contract v0 with realistic recommendation packets.

It exists to:

- validate the recommendation model
- test recommendation clarity
- demonstrate capability-oriented thinking
- avoid premature runtime implementation

These examples are manual, bounded, advisory-only, tool-agnostic, and capability-oriented. They do not execute work, assign ownership, invoke MCP tools, mutate files, create background behavior, or imply automatic task handling.

---

## 2. Packet Structure

Use this deterministic structure for recommendation packets:

```text
REQUEST:
TASK TYPE:
RISK LEVEL:
REQUIRED CAPABILITIES:
RECOMMENDED SURFACE TYPE:
REASONING:
SAFETY CONSTRAINTS:
HUMAN NEXT ACTION:
MANUAL_ONLY:
```

Field meanings:

| Field | Meaning |
|---|---|
| `REQUEST` | Short restatement of the human request. |
| `TASK TYPE` | Classification such as documentation, implementation, verification, MCP diagnostic, or clarification. |
| `RISK LEVEL` | Low, medium, high, or blocked pending clarification. |
| `REQUIRED CAPABILITIES` | Capability profile needed to handle the request safely. |
| `RECOMMENDED SURFACE TYPE` | Capability-based surface type, not a vendor-specific client name. |
| `REASONING` | Why that surface type fits. |
| `SAFETY CONSTRAINTS` | Boundaries that must travel with the recommendation. |
| `HUMAN NEXT ACTION` | One manual next step for the human. |
| `MANUAL_ONLY` | Always `true` for v0. |

---

## 3. Example Packets

### A. Documentation-Only Task

```text
REQUEST:
Update a README section and review architecture wording for ScaffoldAI MCP boundaries.

TASK TYPE:
Documentation / review.

RISK LEVEL:
Low.

REQUIRED CAPABILITIES:
- can_read_repo_context
- can_edit_files
- strong_at_planning
- strong_at_review
- safe_for_documentation_only_work
- requires_human_approval_before_mutation

RECOMMENDED SURFACE TYPE:
planning/review-oriented documentation client.

REASONING:
The task is documentation-only and depends on preserving existing architecture terms. It benefits from repo context, careful wording, and consistency review more than broad implementation capability.

SAFETY CONSTRAINTS:
- Do not modify Consync product/runtime behavior.
- Preserve "manual process coordination" wording.
- Do not introduce forbidden orchestration terminology.
- Keep changes scoped to the named documentation.

HUMAN NEXT ACTION:
Ask a planning/review-oriented documentation client to update the specific docs and report the consistency checks it performed.

MANUAL_ONLY:
true
```

### B. Small Bounded Code Change

```text
REQUEST:
Make a small UI label tweak and update the matching test assertion.

TASK TYPE:
Small implementation.

RISK LEVEL:
Medium.

REQUIRED CAPABILITIES:
- can_read_repo_context
- can_edit_files
- can_run_commands
- strong_at_implementation
- requires_human_approval_before_mutation

RECOMMENDED SURFACE TYPE:
implementation-capable repo client.

REASONING:
The task needs localized source edits and a focused verification pass. It should be handled by a client that can inspect nearby code, make bounded changes, and run the lightest relevant check through the normal human-authorized execution surface.

SAFETY CONSTRAINTS:
- Keep the change local to the UI label and matching test.
- Do not refactor unrelated UI or test code.
- Run only the relevant verification unless broader failures suggest risk.
- Do not stage, commit, or push without explicit human approval.

HUMAN NEXT ACTION:
Ask an implementation-capable repo client to make the scoped edit and summarize the verification output.

MANUAL_ONLY:
true
```

### C. Verification / Audit Task

```text
REQUEST:
Audit ScaffoldAI docs for path-boundary drift and confirm no runtime files were changed.

TASK TYPE:
Verification / audit.

RISK LEVEL:
Low to medium.

REQUIRED CAPABILITIES:
- can_read_repo_context
- can_run_commands
- strong_at_review
- safe_for_verification_only_work
- requires_human_approval_before_mutation

RECOMMENDED SURFACE TYPE:
verification-capable local review client.

REASONING:
The task is evidence gathering and consistency review. It may need read-only searches and git inspection, but it should not change files unless the human separately approves a clear current-doc correction.

SAFETY CONSTRAINTS:
- Audit only by default.
- Separate current/authoritative drift from historical planning references.
- Do not modify runtime code.
- Do not interpret package scripts as MCP client launch guidance unless current docs recommend that usage.

HUMAN NEXT ACTION:
Ask a verification-capable local review client to run the requested searches and report PASS or NEEDS_ATTENTION with evidence.

MANUAL_ONLY:
true
```

### D. MCP Diagnostic Task

```text
REQUEST:
Confirm MCP handshake behavior, stdout/stderr separation, and shared-memory round trip.

TASK TYPE:
MCP diagnostic.

RISK LEVEL:
Medium.

REQUIRED CAPABILITIES:
- can_use_mcp_tools
- can_read_repo_context
- strong_at_review
- safe_for_verification_only_work

RECOMMENDED SURFACE TYPE:
MCP-aware diagnostic client.

REASONING:
The task requires controlled diagnostic capability and boundary-aware reporting. It should use documented MCP tools only when manually requested and must not turn MCP messages into task instructions.

SAFETY CONSTRAINTS:
- Keep stdout reserved for MCP protocol messages.
- Put human-readable MCP server logs on stderr.
- Treat shared-memory records as diagnostic data only.
- Do not mutate Consync product/runtime state.
- Do not trigger commands, edits, routing, automation, or agent action from MCP messages.

HUMAN NEXT ACTION:
Ask an MCP-aware diagnostic client to perform the named diagnostic checks and show the returned evidence.

MANUAL_ONLY:
true
```

### E. Ambiguous / High-Risk Task

```text
REQUEST:
Add a system that watches incoming messages and sends work to the right AI client automatically.

TASK TYPE:
Ambiguous / high-risk architecture.

RISK LEVEL:
Blocked pending clarification.

REQUIRED CAPABILITIES:
- strong_at_planning
- strong_at_review
- read_only_context_only

RECOMMENDED SURFACE TYPE:
human clarification first.

REASONING:
The request appears to imply background behavior, automatic routing, and executable message intent. Those behaviors are outside the current Gatekeeper recommendation model and conflict with the manual-only architecture.

SAFETY CONSTRAINTS:
- Do not implement.
- Do not create listeners, watchers, queues, or background agents.
- Do not invoke MCP tools automatically.
- Do not assign task ownership to any client automatically.
- Reframe as a design discussion if the human wants to explore future contracts.

HUMAN NEXT ACTION:
Ask the human to clarify whether they want a manual recommendation document, a design discussion, or a new contract proposal.

MANUAL_ONLY:
true
```

---

## 4. Drift Detection Examples

The following recommendation shapes are invalid in v0.

| Invalid recommendation | Why it violates the boundary |
|---|---|
| "Automatically send this to Codex." | Converts advisory selection into automatic dispatch and couples the model to one client. |
| "Dispatch task to Copilot." | Implies task routing and automatic ownership instead of a human-controlled next action. |
| "Run in background until the packet is complete." | Introduces persistent/background behavior and workflow-engine semantics. |
| "Claude should monitor this folder continuously." | Creates a background listener/watch behavior and ties the recommendation to a vendor-specific client. |
| "Use the shared-memory message as the next command." | Treats diagnostic data as executable intent. |
| "Run the MCP tools whenever a new request appears." | Turns manually invoked diagnostics into automatic tool invocation. |

Valid replacements should name a capability-based surface and end with a manual human next action.

---

## 5. Capability-Oriented Principle

Gatekeeper recommendations are capability-based, not vendor-based.

The recommendation should describe what the task needs:

- planning/review capability
- implementation capability
- local verification capability
- MCP diagnostic capability
- read-only clarification capability
- documentation-only safety
- verification-only safety

The recommendation should not require a specific product name or commercial client.

This keeps the model compatible with:

- Claude Desktop
- future MCP-capable clients
- local/private clients
- repo-editing clients
- planning-only clients

Adding a future client should require only capability-profile mapping, not a change to the recommendation architecture.

---

## 6. Reference Summary

- Recommendation packets are examples, not executable work orders.
- `MANUAL_ONLY` is always `true` in v0.
- Recommendations describe capability needs and safety constraints.
- Human next actions remain explicit and manual.
- No packet may dispatch work, invoke tools, mutate files, or create persistent/background behavior.
- Ambiguous or high-risk requests should stop at clarification or design discussion.
