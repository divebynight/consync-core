# Planning — scaffoldai-tool-router-v0

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

Plan a recommend-only Tool Router concept for ScaffoldAI.

The Tool Router would classify a user request, SDC, packet idea, or runtime situation and recommend the best execution target. It would not execute the route, dispatch work, call tools autonomously, or change repo state.

The goal is a deterministic advisory layer that answers:

> "Given this request, which tool or human workflow should handle it?"

The human remains final authority. A router recommendation is guidance, not permission.

---

## 2. Non-Goals

- No implementation in v0.
- No new MCP tools.
- No routing execution.
- No autonomous behavior.
- No orchestration.
- No shell execution.
- No commits, staging, pushes, or PR creation.
- No file writes beyond this planning document.
- No state mutation under `.scaffoldai/state/` or `.scaffoldai/streams/`.
- No hidden dispatch to ChatGPT, Copilot, Codex, MCP, CLI, or human workflows.
- No replacement for the MCP client interaction contract.
- No permission enforcement or sandboxing.

---

## 3. Candidate Targets

The router may recommend one target, or a ranked list of targets when the request is ambiguous.

| Target | Intended use | v0 authority |
|---|---|---|
| `ChatGPT` | Broad reasoning, product/process explanation, strategy, synthesis, external-context discussion when provided by the human | Recommend only |
| `Copilot` | IDE-local code suggestions, small edits inside developer-supervised editor flow | Recommend only |
| `Codex` | Repo-local coding, tests, verification, file edits when explicitly requested and within workspace rules | Recommend only |
| `MCP_READ_ONLY` | Structured ScaffoldAI runtime observation through the 5 read-only MCP tools or snapshot | Recommend only |
| `LOCAL_CLI` | Human-run Runtime Commands such as status, preflight, question, verify, closeout, snapshot | Recommend only |
| `HUMAN_MANUAL` | Decisions, approvals, ambiguity resolution, destructive or external actions, final authority | Required for approval |

Target names are conceptual labels, not executable command names.

---

## 4. Routing Criteria

The router should consider:

- Requested outcome: explanation, planning, code change, verification, closeout, approval, external action.
- Required execution class: `READ_ONLY`, `LOCAL_WRITE`, `PROJECT_STRUCTURE_CHANGE`, `VERIFY_REQUIRED`, `HUMAN_APPROVAL_REQUIRED`, `EXTERNAL_SYSTEM_ACCESS`, or `DESTRUCTIVE`.
- Whether the request needs live ScaffoldAI runtime observations.
- Whether the request needs repo-local file edits or tests.
- Whether the request needs IDE-local assistance.
- Whether the request requires human approval or judgment.
- Whether there is ambiguity about product/process/agent boundaries.
- Whether the user supplied an SDC, packet, prompt, or informal request.
- Whether the request can be answered from existing context.
- Whether MCP observations are stale, partial, blocked, or conflicting.

v0 routing must be conservative. If the correct target is unclear, recommend `HUMAN_MANUAL` for clarification before any tool-specific execution.

---

## 5. Routing Heuristics

| Request shape | Recommended target | Rationale |
|---|---|---|
| "What is the current ScaffoldAI state?" | `MCP_READ_ONLY` or `LOCAL_CLI` | Runtime observation is needed. |
| "What should I run to verify this?" | `MCP_READ_ONLY` first, then `LOCAL_CLI` for human-run VERIFY COMMAND | MCP can recommend; CLI executes only by human choice. |
| "Is this ready to commit?" | `MCP_READ_ONLY` plus `HUMAN_MANUAL` | Closeout readiness is advisory; human decides. |
| "Plan this process change" | `ChatGPT` or `Codex` depending on repo-local context needs | Planning is reasoning-heavy and read-only. |
| "Implement this repo change" | `Codex` | Requires file edits and verification in workspace. |
| "Suggest code in my editor" | `Copilot` | Best fit for IDE-local inline assistance. |
| "Explain this architecture to a stakeholder" | `ChatGPT` | Synthesis and communication task. |
| "Run verify" | `LOCAL_CLI` with human approval | VERIFY COMMAND execution is outside MCP read-only v0. |
| "Approve closeout" | `HUMAN_MANUAL` | Approval cannot be delegated to tools. |
| "Push this branch" | `HUMAN_MANUAL` | External/write action requiring explicit human authority. |
| "Use MCP to update state" | `HUMAN_MANUAL` stop condition | MCP v0 is read-only and cannot mutate state. |

---

## 6. Example Decisions

### Example A — Runtime status request

Input:

```text
What is the current ScaffoldAI state and next safe action?
```

Router recommendation:

```json
{
  "recommended_target": "MCP_READ_ONLY",
  "execution_class": "READ_ONLY",
  "reason": "The request needs structured runtime observation and no mutation.",
  "next_step": "Call scaffoldai_status and summarize NEXT SAFE ACTION.",
  "requires_human_approval": false
}
```

### Example B — Verification recommendation

Input:

```text
Which verify command should I run?
```

Router recommendation:

```json
{
  "recommended_target": "MCP_READ_ONLY",
  "execution_class": "READ_ONLY",
  "reason": "scaffoldai_verify_recommend can identify VERIFY COMMAND and TARGET without executing.",
  "next_step": "Call scaffoldai_verify_recommend, then ask the human whether to run the Runtime Command.",
  "requires_human_approval": true
}
```

### Example C — Implementation request

Input:

```text
Implement the snapshot command and verify it.
```

Router recommendation:

```json
{
  "recommended_target": "Codex",
  "execution_class": "PROJECT_STRUCTURE_CHANGE",
  "reason": "The request requires repo-local file edits and verification.",
  "next_step": "Use Codex workspace editing and run the requested verification commands.",
  "requires_human_approval": false
}
```

### Example D — Ambiguous process/product request

Input:

```text
Add the new router to the app.
```

Router recommendation:

```json
{
  "recommended_target": "HUMAN_MANUAL",
  "execution_class": "HUMAN_APPROVAL_REQUIRED",
  "reason": "The target surface is ambiguous: ScaffoldAI process concept or Consync product UI.",
  "next_step": "Ask the human to choose process planning, runtime implementation, or product UI.",
  "requires_human_approval": true
}
```

### Example E — Closeout request

Input:

```text
Can we close this out?
```

Router recommendation:

```json
{
  "recommended_target": "MCP_READ_ONLY",
  "secondary_target": "HUMAN_MANUAL",
  "execution_class": "READ_ONLY",
  "reason": "MCP can report closeout readiness, but human approval is required for final closeout decisions.",
  "next_step": "Call scaffoldai_closeout_readiness and summarize blockers, verify evidence, and NEXT SAFE ACTION.",
  "requires_human_approval": true
}
```

---

## 7. Output Packet Shape

If implemented later, the router should return a deterministic JSON recommendation packet.

Sketch:

```json
{
  "router_version": "0.1.0",
  "mode": "RECOMMEND_ONLY",
  "input_summary": "<short summary of request>",
  "classification": {
    "request_type": "status | planning | implementation | verification | closeout | approval | external | ambiguous",
    "execution_class": "READ_ONLY",
    "confidence": "high | medium | low",
    "ambiguities": []
  },
  "recommendation": {
    "recommended_target": "MCP_READ_ONLY",
    "secondary_targets": [],
    "reason": "<why this target fits>",
    "next_step": "<human-controlled next step>",
    "requires_human_approval": false,
    "may_execute": false
  },
  "guardrails": {
    "no_autonomous_execution": true,
    "no_shell_execution": true,
    "no_mcp_writes": true,
    "human_final_authority": true
  }
}
```

Required packet properties:

- Deterministic key order.
- No command execution.
- No state mutation.
- No hidden dispatch.
- Explicit `may_execute: false` in v0.
- Explicit human approval flag when applicable.

---

## 8. Relationship to MCP

The Tool Router is not an MCP tool in v0.

In v0, MCP remains a read-only observation surface. The router may recommend using `MCP_READ_ONLY` when a request needs structured ScaffoldAI runtime observations, such as:

- current state
- preflight status
- open questions
- VERIFY COMMAND and TARGET
- closeout readiness

The router must not:

- add MCP tools
- call MCP tools automatically as a side effect of routing
- expose write-capable MCP actions
- treat MCP observations as approval
- route from MCP observation directly into execution

If future versions expose the router through MCP, that MCP tool must itself be `READ_ONLY` and recommend-only unless a later contract explicitly permits more.

---

## 9. Relationship to `execution_class`

`execution_class` is the primary risk vocabulary for routing.

Recommended mapping:

| execution_class | Preferred router posture |
|---|---|
| `READ_ONLY` | Recommend ChatGPT, MCP_READ_ONLY, LOCAL_CLI recommend modes, or Codex read-only analysis. |
| `LOCAL_WRITE` | Recommend Codex or supervised local tooling; require verification before closeout. |
| `PROJECT_STRUCTURE_CHANGE` | Recommend Codex with verify requirement; summarize expected file scope. |
| `VERIFY_REQUIRED` | Recommend LOCAL_CLI VERIFY COMMAND; human runs or explicitly authorizes execution. |
| `HUMAN_APPROVAL_REQUIRED` | Recommend HUMAN_MANUAL first. |
| `EXTERNAL_SYSTEM_ACCESS` | Recommend HUMAN_MANUAL; require explicit approval and external-access contract. |
| `DESTRUCTIVE` | Recommend HUMAN_MANUAL stop; do not route to execution. |

The router should never downgrade an execution class to make a target seem permissible.

If classification confidence is low, use the higher-risk plausible class and ask the human.

---

## 10. Relationship to Runtime Commands

Runtime Commands are execution targets only when the human chooses to run them.

The router may recommend:

- `npm run scaffoldai:status`
- `npm run scaffoldai:preflight`
- `npm run scaffoldai:question`
- `npm run scaffoldai:verify`
- `npm run scaffoldai:closeout`
- `npm run scaffoldai:mcp:snapshot`
- `npm run verify:scaffoldai`

The router must phrase these as recommendations:

```text
Recommended Runtime Command: npm run verify:scaffoldai
```

It must not phrase them as completed actions:

```text
Verification passed.
```

Unless separate verified evidence exists.

---

## 11. Future Evolution Notes

Potential future phases:

| Phase | Capability | Required before implementation |
|---|---|---|
| v0 | Planning-only router model | This document only |
| v1 | CLI recommend-only command | Dedicated planning packet, tests, no execution |
| v1 | JSON router output | Schema contract and fixture tests |
| v2 | MCP read-only router tool | MCP contract update, no dispatch, no execution |
| v3 | Human-approved dispatch helper | New authority model, audit trail, stop conditions, explicit approval |

Future implementation should start as a local recommend-only Runtime Command, not as an MCP tool. That keeps routing behavior visible to humans before it becomes available to AI clients.

Before any dispatch-capable router exists, ScaffoldAI must define:

- authority model
- explicit human approval flow
- audit/logging requirements
- failure behavior
- dry-run packet shape
- verification evidence handling
- tool boundary tests

---

## 12. Recommended Router Model

v0 should remain a planning concept:

- Router classifies requests.
- Router recommends a target.
- Router returns structured rationale.
- Router never executes.
- Router never dispatches.
- Router never mutates state.
- Human chooses whether to follow the recommendation.

Recommended next step:

Do not implement now. Use this plan as vocabulary for future packet routing discussions. If the concept proves useful, plan a separate `scaffoldai tool-router --recommend` Runtime Command with JSON output and fixture tests.
