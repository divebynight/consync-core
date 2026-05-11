# Gatekeeper Recommendation Contract — v0

Created: 2026-05-08
Status: ACTIVE CONTRACT

---

## 1. Purpose

Define a bounded Gatekeeper recommendation layer for choosing the appropriate AI/client surface for a requested task.

The Gatekeeper recommendation layer answers:

```text
What kind of client/capability should handle this task?
```

It is part of ScaffoldAI manual process coordination. It may classify task needs, describe required capabilities, explain safety constraints, and recommend a human next action.

It must not execute the task, dispatch work, invoke tools automatically, edit files, run commands, create background behavior, or treat messages as executable intent.

---

## 2. Scope

This contract applies to recommendation-only decisions about AI/client surfaces used around `consync-core`, ScaffoldAI, and Consync development.

The recommendation model must preserve the active system identity boundaries:

- Consync is the product/runtime/context engine.
- `consync-core` is the repository/codebase that builds Consync.
- ScaffoldAI is the manual process coordination layer.
- `.scaffoldai/` is ScaffoldAI project-local bridge/state.
- MCP is a controlled capability/access layer, not a daemon, router, orchestrator, or workflow engine.

The model is tool-agnostic. It may describe client capability types, but it must not require a specific commercial client or vendor.

---

## 3. Non-Goals

The Gatekeeper recommendation layer is not:

- autonomous routing
- workflow execution
- background listening
- automatic dispatch
- executable message intent
- direct file mutation
- command execution
- MCP tool invocation
- agent invocation
- verification execution
- closeout approval
- commit, push, branch, PR, or release authority

Any recommendation requiring action must end with a human-controlled next step.

---

## 4. Client Capability Profile Model

Recommendations should be based on capability dimensions, not vendor-specific behavior.

A client capability profile may include:

| Capability | Meaning |
|---|---|
| `can_read_repo_context` | Can inspect local repository files or provided repo context. |
| `can_edit_files` | Can make bounded file changes when explicitly asked. |
| `can_run_commands` | Can run local commands through the normal human-authorized execution surface. |
| `can_use_mcp_tools` | Can call available MCP tools within their documented authority. |
| `strong_at_planning` | Well suited for decomposition, design, sequencing, and tradeoff analysis. |
| `strong_at_implementation` | Well suited for code or document changes. |
| `strong_at_review` | Well suited for risk, regression, consistency, or correctness review. |
| `safe_for_documentation_only_work` | Suitable for docs-only tasks with no runtime behavior changes. |
| `safe_for_verification_only_work` | Suitable for running or interpreting checks without modifying source. |
| `requires_human_approval_before_mutation` | Must ask before edits, commands, state changes, or git operations. |
| `read_only_context_only` | Can reason over supplied context but cannot safely mutate files or execute commands. |

Capability profiles may be extended in future versions, but they must remain capability-based and client-neutral.

---

## 5. Recommendation Output Shape

A Gatekeeper recommendation should be concise and structured.

Recommended fields:

```text
recommended_surface: <client/capability type>
required_capabilities:
  - <capability>
reasoning_summary: <why this surface fits>
safety_constraints:
  - <constraint>
human_next_action: <one explicit manual next step>
manual_only: true
```

Rules:

- `manual_only` must be `true` in v0.
- `human_next_action` must be an instruction for the human, not an instruction to a background system.
- `recommended_surface` should describe capability type, such as `repo-editing client`, `MCP-aware review client`, `planning-only client`, or `verification-capable local client`.
- The output must not include commands that are treated as automatically executable.
- The output must not imply that recommendation equals approval.

---

## 6. Allowed Example Recommendations

### Documentation or Review Task

```text
recommended_surface: documentation-capable repo client
required_capabilities:
  - can_read_repo_context
  - can_edit_files
  - strong_at_review
  - safe_for_documentation_only_work
reasoning_summary: The task is bounded to documentation consistency and does not require runtime changes.
safety_constraints:
  - Documentation-only changes.
  - Preserve Consync and ScaffoldAI boundaries.
  - Do not modify runtime code.
human_next_action: Ask a documentation-capable repo client to update the named docs and report verification.
manual_only: true
```

### Small Code Change

```text
recommended_surface: implementation-capable repo client
required_capabilities:
  - can_read_repo_context
  - can_edit_files
  - can_run_commands
  - strong_at_implementation
reasoning_summary: The task needs bounded source edits plus local verification.
safety_constraints:
  - Keep edits scoped to the requested behavior.
  - Run the lightest relevant verification.
  - Do not stage, commit, or push without human approval.
human_next_action: Ask an implementation-capable repo client to make the scoped change and show verification results.
manual_only: true
```

### Verification or Audit Task

```text
recommended_surface: verification-capable local client
required_capabilities:
  - can_read_repo_context
  - can_run_commands
  - strong_at_review
  - safe_for_verification_only_work
reasoning_summary: The task is to inspect current state and report evidence, not to change files.
safety_constraints:
  - Audit only unless a clear current-doc contradiction is found.
  - Do not modify runtime code.
  - Report stale references separately from current guidance.
human_next_action: Ask a verification-capable client to run the requested checks and summarize findings.
manual_only: true
```

### MCP Capability Test

```text
recommended_surface: MCP-aware diagnostic client
required_capabilities:
  - can_use_mcp_tools
  - strong_at_review
reasoning_summary: The task requires manually invoked MCP diagnostics and boundary-aware reporting.
safety_constraints:
  - Use MCP tools only within documented authority.
  - Treat shared-memory messages as diagnostic data only.
  - Do not trigger commands, edits, routing, automation, or agent action from MCP messages.
human_next_action: Ask an MCP-aware client to run the named diagnostic MCP calls and report the returned records.
manual_only: true
```

### Ambiguous or High-Risk Task

```text
recommended_surface: human clarification first
required_capabilities:
  - strong_at_planning
  - strong_at_review
reasoning_summary: The request has unclear authority, unclear target surface, or potentially high blast radius.
safety_constraints:
  - Do not execute, edit, dispatch, or run tools automatically.
  - Clarify scope, target, and allowed actions before selecting an execution surface.
human_next_action: Ask the human to choose the target surface and confirm allowed actions.
manual_only: true
```

---

## 7. Drift Rules

The following changes are out of scope for v0 and require a separate contract before use:

- Any version that dispatches work automatically.
- Any version that invokes tools automatically.
- Any version that runs commands automatically.
- Any version that edits files directly.
- Any version that creates background listeners, daemons, queues, watchers, or agent loops.
- Any version that treats MCP messages, shared-memory messages, chat messages, or recommendation output as executable intent.
- Any version that requires a specific commercial client or vendor.
- Any version that collapses Consync product/runtime state into ScaffoldAI process state.
- Any version that replaces manual process coordination with forbidden orchestration terminology.

If a recommendation conflicts with active ScaffoldAI contracts, the active contract wins until explicitly updated.

---

## 8. Future Compatibility

Future MCP-capable clients, including clients such as Claude Desktop, should fit this model by declaring capabilities rather than by receiving vendor-specific rules.

The recommended surface should remain capability-based:

```text
MCP-aware diagnostic client
repo-editing client
planning-only client
verification-capable local client
documentation-capable repo client
human clarification first
```

Adding a new client type must not add automatic dispatch, workflow execution, background behavior, or executable message intent.

---

## 9. Contract Summary

- Gatekeeper recommendations are manual and advisory.
- Recommendations classify capability needs, not vendor identity.
- The human decides which client or surface to use.
- MCP remains a controlled capability/access layer.
- Shared-memory and MCP messages are data only, not executable intent.
- No recommendation may execute, dispatch, edit, run commands, or approve workflow progress.
- Consync, `consync-core`, ScaffoldAI, and `.scaffoldai/` boundaries remain intact.
- v0 preserves manual process coordination.
