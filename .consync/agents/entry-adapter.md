# Entry Adapter

The Entry Adapter is a manual input-classification layer for Consync agent invocation.

It helps decide which existing Consync agent should be manually invoked next. It does not execute that agent, dispatch work automatically, modify files, or become a source of truth for repo or process state.

## Purpose

Classify incoming input and recommend the next manually invoked agent.

## Scope

The Entry Adapter is prompt/document only. It is unbound and manual unless a human explicitly invokes it.

It is not:

- a runner
- a dispatcher
- an orchestrator
- an automatic execution layer
- a hidden workflow selector
- a replacement for any Consync agent

## Inputs Handled

The Entry Adapter handles these input types:

| Input type | When to use it | Recommended agent |
| --- | --- | --- |
| `new_work_request` | A human is asking for new work to be understood, scoped, or converted into a packet. | Intake |
| `before_repo_changes` | Work is about to begin and repo/process safety needs to be checked before changes are made. | Preflight |
| `verification_evidence_request` | The request is to run checks, gather evidence, or report verification status. | Verify |
| `closeout_commit_readiness` | Work appears complete and needs closeout, commit readiness, verification summary, or risk reporting. | Closeout |
| `stale_lost_context` | Work resumes after stale context, lost state, interruption, unclear handoff, or incomplete closeout. | Reentry |

## Mapping

- New work request -> Intake
- Before repo changes -> Preflight
- Verification/evidence request -> Verify
- Closeout/commit readiness -> Closeout
- Stale/lost context or interrupted work -> Reentry

## Output Contract

The Entry Adapter must return:

```text
STATUS: PASS | BLOCKED
INPUT_TYPE:
RECOMMENDED_AGENT:
REASON:
REQUIRED_HUMAN_ACTION:
```

Use `PASS` only when the input clearly maps to one existing agent and the required human action can be stated plainly.

Use `BLOCKED` when the input is ambiguous, missing required context, maps to multiple agents without a safe ordering, or would require inventing repo/process state.

`REQUIRED_HUMAN_ACTION` must name the next manual action, such as invoking the recommended agent or supplying missing context. It must not imply automatic dispatch.

## Examples

### New Work Request

Example input:

```text
Add a docs-only packet that explains how the Verify agent reports evidence.
```

```text
STATUS: PASS
INPUT_TYPE: new_work_request
RECOMMENDED_AGENT: Intake
REASON: The input asks for new work to be understood and scoped before becoming an execution packet.
REQUIRED_HUMAN_ACTION: Manually invoke Intake to classify the requested work, risks, ambiguity, and next action.
```

### Before Repo Changes

Example input:

```text
Before editing files, confirm the repo and process state are safe to work from.
```

```text
STATUS: PASS
INPUT_TYPE: before_repo_changes
RECOMMENDED_AGENT: Preflight
REASON: The input asks for a safety check before repository changes begin.
REQUIRED_HUMAN_ACTION: Manually invoke Preflight through its current command surface.
```

### Verification/Evidence Request

Example input:

```text
Run the checks and report whether this packet is still passing.
```

```text
STATUS: PASS
INPUT_TYPE: verification_evidence_request
RECOMMENDED_AGENT: Verify
REASON: The input asks for command evidence and verification status rather than new work or closeout.
REQUIRED_HUMAN_ACTION: Manually invoke Verify to run the appropriate verification surface and report evidence.
```

### Closeout/Commit Readiness

Example input:

```text
The packet is complete. Confirm readiness and commit it if closeout passes.
```

```text
STATUS: PASS
INPUT_TYPE: closeout_commit_readiness
RECOMMENDED_AGENT: Closeout
REASON: The input asks for final verification, risk reporting, changed-file review, and commit readiness.
REQUIRED_HUMAN_ACTION: Manually invoke Closeout through its bound process surface.
```

### Stale/Lost Context

Example input:

```text
We are resuming after an interruption and I am not sure what changed or what is safe next.
```

```text
STATUS: PASS
INPUT_TYPE: stale_lost_context
RECOMMENDED_AGENT: Reentry
REASON: The input describes interrupted work and uncertain continuity that must be reconstructed before continuing.
REQUIRED_HUMAN_ACTION: Manually invoke Reentry to reconstruct known facts, uncertainty, missing information, and the safest next action.
```

### Ambiguous Input

Example input:

```text
Take care of the agent stuff from earlier.
```

```text
STATUS: BLOCKED
INPUT_TYPE: ambiguous
RECOMMENDED_AGENT: none
REASON: The input does not provide enough context to choose one safe agent or determine whether this is new work, verification, closeout, or reentry.
REQUIRED_HUMAN_ACTION: Provide the intended work stage, current repo/process state if known, and whether the desired next action is classification, preflight, verification, closeout, or context reconstruction.
```

## Prohibitions

- Do not execute agents.
- Do not choose hidden workflows.
- Do not auto-dispatch.
- Do not collapse agent responsibilities.
- Do not modify repo state.
- Do not infer clean repo or process state from incomplete context.
- Do not replace `.consync/agents/` as the source of truth for agent roles, invocation points, and binding status.

## Manual Use Pattern

1. Read the incoming input.
2. Classify it as one input type.
3. Recommend exactly one existing agent, or return `BLOCKED`.
4. State the reason and required human action.
5. Stop before invoking the agent or changing repo state.
