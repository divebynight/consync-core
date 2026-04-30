# Intake Agent

## Purpose

Classify incoming work and route it to the correct Consync or ScaffoldAi surface before implementation.

## Invocation Point

Invoke before new work is converted into a packet, after preflight passes when repo/process state must be checked first.

## Binding Status

Bound as a prompt-only work-classification contract.

This binding does not create a command, runner, orchestrator, automatic dispatcher, or file mutation authority.

## Execution Binding (First Explicit Agent Execution Surface)

`intake-run` is the first explicit agent execution surface in Consync.

It runs the Intake agent's classification logic directly from the CLI:

```
node src/index.js intake-run --prompt "describe the work here"
```

Behavior:
- Accepts a `--prompt` value as the work description
- Prints the agent name and input received
- Runs deterministic keyword-based classification
- Outputs STATUS, CLASSIFICATION, RISK, AMBIGUITY, TARGET SURFACES, OUT OF SCOPE, VERIFICATION LEVEL, and REQUIRED NEXT STEP

This is not a runner, orchestrator, or dispatcher. It executes one agent's classification logic in a single, inspectable step. It does not call other agents, modify state, or chain workflows.

## Prompt Binding

The Intake agent is invoked by prompt or human request when incoming work needs classification before packet creation.

It classifies only. It does not approve work, start work, modify files, replace Preflight, replace Verify, or replace Closeout.

## Inputs

- Human request or proposed work
- Current stated repo/process state
- Relevant constraints, boundaries, and source-of-truth references
- Existing `.consync/docs/` references when needed
- Existing `.consync/agents/` role definitions when needed
- Relevant current repo layout when needed

## Responsibilities

- Classify the request as product, process, docs, tests, runtime, adapter, or mixed.
- Identify allowed and disallowed surfaces.
- Decide whether external context must go through the ingestion gatekeeper workflow.
- Preserve the current `.consync/` folder name unless a dedicated rename packet exists.
- Keep `.github/` as an adapter-only surface.

## Required Output

- Status: `PASS`, `NEEDS_CLARIFICATION`, or `BLOCKED`
- Proposed packet classification
- Risk level
- Ambiguity flags
- Recommended next action
- Target files or surfaces, if clear
- Explicit out-of-scope items
- Verification level recommendation

## Guardrails

- Do not approve work during intake.
- Do not start implementation during intake.
- Do not modify files during intake.
- Do not make Intake authoritative over repo state.
- If request/state is ambiguous, return `NEEDS_CLARIFICATION` or `BLOCKED` rather than inventing context.
- Do not start broad migrations during intake.
- Do not rename packages or folders.
- Do not place canonical process truth in `.github/`.
