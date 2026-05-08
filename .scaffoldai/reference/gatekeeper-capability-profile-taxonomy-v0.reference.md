# Gatekeeper Capability Profile Taxonomy — v0

Created: 2026-05-08
Status: REFERENCE / TAXONOMY

---

## 1. Purpose

This taxonomy provides stable vocabulary for Gatekeeper manual recommendations.

It exists before implementation to:

- reduce ambiguity in recommendation packets
- keep capability selection consistent across clients
- prevent automation drift
- preserve manual process coordination
- keep Consync, ScaffoldAI, Gatekeeper, and MCP boundaries clear

The taxonomy is descriptive only. It does not create executable code, runtime configuration, client-specific routing rules, MCP behavior, package scripts, automatic ownership, background behavior, or workflow-engine semantics.

---

## 2. Capability Categories

| Category | Capability vocabulary | Meaning |
|---|---|---|
| Planning / design | `strong_at_planning` | Can decompose problems, compare approaches, sequence work, and surface ambiguity. |
| Documentation review | `safe_for_documentation_only_work`, `strong_at_review` | Can inspect and edit docs while preserving architecture wording and boundaries. |
| Repository context reading | `can_read_repo_context` | Can inspect repository files, diffs, and local documentation context. |
| File editing | `can_edit_files` | Can make explicitly requested bounded file edits. |
| Command execution | `can_run_commands` | Can run local commands through the normal human-authorized execution surface. |
| Test / verification execution | `safe_for_verification_only_work`, `can_run_commands` | Can run or interpret checks without broadening scope or mutating source. |
| MCP tool access | `can_use_mcp_tools` | Can call documented MCP tools within their authority and summarize responses. |
| Diagnostic-only MCP access | `can_use_mcp_diagnostics` | Can perform manually requested MCP diagnostics without treating records as workflow state. |
| Architecture review | `strong_at_architecture_review`, `strong_at_review` | Can detect boundary drift, terminology drift, and inconsistent system models. |
| Human clarification / escalation | `requires_human_clarification`, `read_only_context_only` | Can stop and ask for scope, authority, target surface, or risk clarification. |

Capabilities describe what a surface can safely do. They do not grant permission to act automatically.

---

## 3. Risk Levels

| Risk level | Definition | Examples |
|---|---|---|
| `LOW` | Advisory or read-only work with no mutation. | Planning notes, architecture review, MCP observation summary. |
| `MEDIUM` | Bounded documentation edits or narrow repo file edits with human-approved scope. | README wording update, small test update, localized refactor. |
| `HIGH` | Command execution, runtime/product changes, MCP writes, or state-affecting work. | Running verification, changing product behavior, appending diagnostic MCP records. |
| `BLOCKED` | Requests that imply automatic dispatch, background listeners, executable message intent, unclear authority, or unapproved mutation. | Always-on monitoring, task routing without human action, message-triggered execution. |

Risk level informs the recommendation. It does not authorize execution.

---

## 4. Mutation Boundaries

| Boundary | Description | Gatekeeper treatment |
|---|---|---|
| Read-only | Inspect context, docs, diffs, MCP output, or command output without changing files or state. | Allowed for advisory recommendations. |
| Documentation-only mutation | Edit documentation or reference material without changing runtime behavior. | Allowed only when the human asks for docs work and scope is clear. |
| Repo file mutation | Edit source, tests, scripts, or process files in the repository. | Requires explicit human intent, scoped implementation capability, and verification expectations. |
| Runtime/product mutation | Change Consync product behavior under runtime/product surfaces. | Higher risk; requires implementation capability, explicit product scope, and verification. |
| State/stream mutation | Change authoritative ScaffoldAI state or stream files. | Protected; only allowed through the appropriate ScaffoldAI workflow and explicit human approval. |
| Diagnostic MCP append | Append bounded diagnostic MCP records where documented. | Diagnostic only; non-authoritative; never workflow state or executable intent. |
| Blocked mutation types | Automatic dispatch, background behavior, message-triggered execution, unapproved state changes, git actions, or tool invocation by recommendation. | Out of scope for v0. Stop and ask the human. |

Gatekeeper recommendations may name mutation boundaries, but they do not perform mutation.

---

## 5. Capability Profile Examples

### `planning_review_profile`

Allowed capabilities:

- `can_read_repo_context`
- `strong_at_planning`
- `strong_at_review`
- `read_only_context_only`

Disallowed capabilities:

- file mutation without separate human approval
- command execution
- MCP writes
- automatic ownership

Risk level: `LOW`

Expected human next action:

```text
Ask a planning/review-capable surface to produce a recommendation, design note, or clarification summary.
```

### `documentation_editor_profile`

Allowed capabilities:

- `can_read_repo_context`
- `can_edit_files`
- `strong_at_review`
- `safe_for_documentation_only_work`

Disallowed capabilities:

- runtime/product mutation
- command execution unless separately requested for docs checks
- state/stream mutation outside the appropriate workflow
- git actions without explicit human approval

Risk level: `MEDIUM`

Expected human next action:

```text
Ask a documentation-capable repo surface to make scoped docs changes and report the checks performed.
```

### `implementation_bounded_profile`

Allowed capabilities:

- `can_read_repo_context`
- `can_edit_files`
- `can_run_commands`
- `strong_at_implementation`
- `requires_human_approval_before_mutation`

Disallowed capabilities:

- unrelated refactors
- unrequested architecture changes
- automatic staging, commits, pushes, branches, or PRs
- background behavior

Risk level: `MEDIUM` to `HIGH`, depending on touched surface.

Expected human next action:

```text
Ask an implementation-capable repo surface to make the scoped change and run the lightest relevant verification.
```

### `verification_runner_profile`

Allowed capabilities:

- `can_read_repo_context`
- `can_run_commands`
- `strong_at_review`
- `safe_for_verification_only_work`

Disallowed capabilities:

- source edits unless a separate clear contradiction is approved for correction
- runtime/product mutation
- treating test success as closeout approval
- git actions

Risk level: `HIGH` when commands run; `LOW` when audit is read-only.

Expected human next action:

```text
Ask a verification-capable local surface to run or inspect the requested checks and report evidence.
```

### `mcp_diagnostic_profile`

Allowed capabilities:

- `can_use_mcp_tools`
- `can_use_mcp_diagnostics`
- `strong_at_review`
- `safe_for_verification_only_work`

Disallowed capabilities:

- treating MCP messages as executable intent
- automatic MCP polling
- background listeners
- Consync runtime/product mutation
- authoritative ScaffoldAI workflow-state mutation

Risk level: `HIGH` when diagnostic MCP writes are involved; otherwise `LOW` to `MEDIUM`.

Expected human next action:

```text
Ask an MCP-aware diagnostic surface to perform the named manual diagnostic calls and report returned evidence.
```

### `architecture_guardrail_profile`

Allowed capabilities:

- `can_read_repo_context`
- `strong_at_architecture_review`
- `strong_at_review`
- `read_only_context_only`

Disallowed capabilities:

- implementation before clarification
- boundary changes without a contract update
- client-specific routing rules
- automatic task ownership

Risk level: `LOW` for review; `BLOCKED` when the request conflicts with active boundaries.

Expected human next action:

```text
Ask an architecture-review surface to identify boundary risks and recommend a manual clarification or contract update.
```

### `human_clarification_required`

Allowed capabilities:

- `requires_human_clarification`
- `strong_at_planning`
- `strong_at_review`
- `read_only_context_only`

Disallowed capabilities:

- edits
- commands
- MCP writes
- automatic dispatch
- background behavior
- executable message intent

Risk level: `BLOCKED`

Expected human next action:

```text
Ask the human to clarify scope, authority, target surface, and allowed actions before choosing any execution-capable surface.
```

---

## 6. Vendor-Agnostic Mapping Guidance

Named tools or clients may be mapped to these profiles later, but the taxonomy must not depend on:

- Codex
- Copilot
- ChatGPT
- Claude Desktop
- any specific commercial client

Mapping rules:

- Map client names to capability profiles, not profiles to client names.
- Prefer capability descriptions over product names in recommendation output.
- Do not create client-specific routing rules in this taxonomy.
- Do not assume a client can mutate files, run commands, or use MCP unless that capability is explicitly available in the current execution surface.
- Future local/private clients should fit by declaring capabilities against this vocabulary.

---

## 7. Drift Rules

The taxonomy has drifted if a capability or profile:

- implies automatic ownership
- dispatches work
- invokes tools automatically
- treats chat, MCP, or shared-memory messages as executable intent
- assumes always-on process behavior
- creates background monitoring/listeners
- bypasses human approval
- treats recommendation as permission to mutate files, run commands, or change state
- requires a specific vendor or commercial client
- blurs Consync product/runtime state with ScaffoldAI process state

When drift is detected, stop at `human_clarification_required` or propose a contract update. Do not implement runtime behavior from this taxonomy.

---

## 8. Relationship to Existing Gatekeeper Docs

This taxonomy supports:

- [Gatekeeper Recommendation Contract v0](../contracts/gatekeeper-recommendation-v0.contract.md)
- [Gatekeeper Recommendation Packet Examples v0](gatekeeper-recommendation-packets-v0.reference.md)

The contract defines authority and output requirements. The packet examples show applied recommendations. This taxonomy supplies stable capability vocabulary for both.

If this taxonomy conflicts with an active contract, the active contract wins until explicitly updated.

---

## 9. Reference Summary

- Capability profiles are vocabulary for manual recommendations.
- Risk levels describe caution, not permission.
- Mutation boundaries must be explicit in recommendations.
- Vendor names are optional mapping labels, not taxonomy primitives.
- MCP diagnostics remain controlled, manual, and non-authoritative.
- Blocked requests require human clarification before any execution-capable surface is selected.
