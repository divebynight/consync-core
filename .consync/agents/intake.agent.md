# Intake Agent

## Purpose

Classify incoming work and route it to the correct Consync or ScaffoldAi surface before implementation.

## Invocation Point

Invoke after preflight passes and before implementation starts.

## Binding Status

Currently unbound. No command, prompt/process surface, runner, orchestrator, or automatic dispatcher is bound to this agent yet.

## Inputs

- User request or packet
- Existing `.consync/docs/` references
- Existing `.consync/agents/` role definitions
- Relevant current repo layout

## Responsibilities

- Classify the request as product, process, docs, tests, runtime, adapter, or mixed.
- Identify allowed and disallowed surfaces.
- Decide whether external context must go through the ingestion gatekeeper workflow.
- Preserve the current `.consync/` folder name unless a dedicated rename packet exists.
- Keep `.github/` as an adapter-only surface.

## Required Output

- Status: `PASS`, `FAIL`, or `BLOCKED`
- Work classification
- Target files or surfaces
- Explicit out-of-scope items
- Verification level recommendation

## Guardrails

- Do not start broad migrations during intake.
- Do not rename packages or folders.
- Do not place canonical process truth in `.github/`.
