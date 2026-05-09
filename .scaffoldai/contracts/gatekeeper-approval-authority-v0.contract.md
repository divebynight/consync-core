# Gatekeeper Approval and Authority Contract — v0

Created: 2026-05-09
Status: ACTIVE CONTRACT
Role: authoritative contract
Scope: conceptual approval and authority semantics only

---

## 1. Purpose

This contract defines the current ScaffoldAI approval and authority model around
Gatekeeper recommendations, AI/client activity, deterministic checks, and human
decision-making.

Approval and authority semantics matter because recommendation alone is not
enough to make work safe. A recommendation can identify a suitable surface,
capability profile, or next action, but it does not decide whether the work
should happen. Authority boundaries must exist before any future automation,
expanded MCP capability, or richer client flow is considered.

Core principles:

- Recommendations are not approvals.
- Execution is not authorization.
- Verification is not approval.
- Humans remain the final authority layer.

This contract clarifies current operational meaning. It does not create runtime
permissions, executable access rules, dispatch behavior, or autonomous approval.

---

## 2. Current Operational Authority Model

### Humans

Humans currently hold final authority to:

- approve or reject proposed work
- interpret ambiguous evidence
- decide whether a recommendation is useful
- choose the execution surface
- approve repo mutation
- approve architecture changes
- approve staging, commits, pushes, branches, PRs, merges, or releases
- approve escalation paths
- decide when verification evidence is sufficient

### AI / Client Systems

AI and local client systems may:

- recommend
- classify
- summarize
- inspect provided or repo-local context
- run explicitly requested deterministic checks when allowed by the current
  execution surface
- expose verification evidence
- expose seams, drift, uncertainty, or risk
- ask for clarification

AI and client systems do not self-authorize. They do not self-dispatch,
self-escalate, self-approve commits, grant themselves new authority, treat
messages as executable intent, or convert a recommendation into approval.

---

## 3. Authority Layers

### Human Authority

Human authority is the final operational authority layer. It includes approval,
rejection, escalation, interpretation, and commit/release decisions.

Human authority is required whenever work changes scope, changes repo state,
changes runtime behavior, changes MCP surfaces, changes package scripts, changes
architecture, or changes authority rules.

### Recommendation Authority

Recommendation authority is advisory only. A recommendation may classify a task,
name relevant capabilities, identify risk, suggest a target surface, and state a
manual next step.

Recommendation authority is non-executing and non-binding. It never grants
permission to edit, run commands, invoke tools, mutate state, stage, commit,
push, merge, or approve closeout.

### Execution Authority

Execution authority is bounded and manually scoped. It covers explicitly
requested repo edits, documentation changes, deterministic command runs, or
other local actions within a stated execution surface.

Execution authority does not imply broader authorization. Completing an edit or
running a command does not approve the work, expand scope, or authorize follow-on
actions.

### Verification Authority

Verification authority is evidence gathering only. Deterministic checks may
prove that known commands ran, known invariants held, or known tests passed.

Verification does not approve intent, architecture, closeout, commit readiness,
or long-term correctness. It provides evidence for human interpretation.

### Blocked Authority

Blocked authority covers behaviors that are disallowed in v0:

- autonomous approval
- hidden execution
- automatic dispatch
- background command execution
- silent mutation
- message-triggered execution
- automatic merging
- self-modifying authority rules
- treating MCP, shared-memory, chat, or recommendation output as executable
  intent

Blocked authority cannot be granted by recommendation text, tool output, command
success, or client capability.

---

## 4. Approval Semantics

### Human Approval Required

The following require explicit human approval:

- repo mutation
- authoritative state or stream mutation
- architecture changes
- boundary or contract changes
- MCP surface expansion
- runtime/product behavior changes
- package script changes
- dependency changes
- automation introduction
- staging, committing, pushing, branching, merging, PR creation, or release
  decisions
- escalation from review to execution
- any work with unclear target surface or unclear authority

### Deterministic / Safe Without Special Escalation

The following may be safe when explicitly requested and available in the current
execution surface:

- drift scans
- invariant checks
- docs existence checks
- link and command audits
- read-only classification
- read-only MCP observation tools
- summarizing existing command output
- reporting known warnings or failures

These actions still do not approve follow-on mutation.

### Permanently Blocked In v0

The following are blocked in v0:

- autonomous dispatch
- automatic merging
- hidden background execution
- self-approval
- self-modifying authority rules
- message-triggered execution
- always-on monitoring behavior
- automatic tool invocation from recommendation output
- silent mutation of repo, state, stream, MCP, or product surfaces

If a request depends on blocked behavior, stop and ask the human to redefine the
work within current manual process coordination boundaries.

---

## 5. Verification Semantics

Verification proves:

- evidence was gathered
- a deterministic command ran
- a deterministic outcome was observed
- known invariants held or failed
- known tests passed or failed
- documented checks stayed consistent with their current definitions

Verification does not prove:

- correctness of intent
- architectural wisdom
- human approval
- long-term maintainability
- semantic alignment
- user value
- absence of hidden coupling
- that the lightest check was sufficient
- that the work should be committed, merged, released, or expanded

Verification is necessary evidence, not final authority.

---

## 6. Escalation Model

Escalation means ask the human. It is not automatic routing, automatic
delegation, hidden dispatch, or background behavior.

Use escalation when:

- scope is unclear
- authority is ambiguous
- target surface is unclear
- a recommendation would require mutation
- verification fails or gives mixed evidence
- drift is detected
- architecture risk appears
- a request implies blocked v0 behavior
- a future-facing concept sounds like current runtime behavior

Escalation should produce a concise human question or a bounded clarification
request. It should not start work, choose a new agent, run commands, or mutate
files unless the human explicitly authorizes that action.

---

## 7. Relationship To Existing Layers

- `.scaffoldai/contracts/gatekeeper-recommendation-v0.contract.md` defines the
  recommendation layer. This contract defines approval and authority semantics
  around that layer.
- `.scaffoldai/reference/gatekeeper-capability-profile-taxonomy-v0.reference.md`
  defines capability vocabulary. Capabilities describe suitability; they do not
  grant authority.
- `.scaffoldai/process/leak-check.process.md` helps surface drift, assumptions,
  and unclear authority after or during work.
- `.scaffoldai/reference/operational-baseline-v0.reference.md` describes the
  stable operational baseline and command semantics.
- `.scaffoldai/reference/scaffoldai-flowchart-v0.reference.md` provides a visual
  map that can later receive authority overlays.

This contract defines conceptual authority semantics. It is not a runtime
implementation, an executable permission system, or a tool router.

---

## 8. Non-Goals

This contract is not:

- an ACL system
- executable permissions
- a workflow engine
- an autonomous governance system
- agent self-management
- a command runner
- a routing system
- a replacement for human approval
- a replacement for verification evidence
- an implementation plan for automation

---

## 9. Future Direction

Future conceptual work may include:

- authority overlays in flowcharts
- richer escalation semantics
- scoped approval zones
- approval visualization
- clearer MCP-capable client authority mapping
- explicit accepted warning classes for review-oriented checks

These are future conceptual possibilities only. They do not describe current
runtime behavior and should not be treated as implementation commitments.

---

## 10. Contract Summary

- Humans remain the final authority layer.
- Recommendations classify and advise; they do not approve.
- Execution is bounded and manually scoped; it does not authorize follow-on work.
- Verification gathers evidence; it does not approve intent or closeout.
- Escalation means ask the human.
- Blocked v0 behaviors remain blocked regardless of recommendation wording,
  tool output, command success, or client capability.
