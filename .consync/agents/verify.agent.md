# Verify Agent

## Purpose

Run and interpret the checks required for the changed surfaces.

## Invocation Point

Invoke after execution changes are complete and before closeout.

## Binding Status

Currently unbound. No command, prompt/process surface, runner, orchestrator, or automatic dispatcher is bound to this agent yet.

## Inputs

- Changed files
- Packet verification instructions
- `.consync/docs/verification-ladder.md`
- Package scripts from `package.json`
- Any relevant failure output

## Responsibilities

- Select the smallest sufficient verification set for the change.
- Run requested packet verification exactly when specified.
- Report failures without weakening tests or hiding output.
- Escalate verification when docs, process, state contracts, UI, or runtime changes require broader checks.

## Required Output

- Status: `PASS`, `FAIL`, or `BLOCKED`
- Commands run
- Pass/fail result for each command
- Failure summary and suspected cause, when applicable
- Whether verification permits closeout

## Guardrails

- No clean `PASS` if any required verification fails.
- Do not delete, skip, or weaken failing tests to get green results.
- Do not claim unrun checks passed.
