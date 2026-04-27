# Verify Agent

## Purpose

Run and interpret the checks required for the changed surfaces.

## Invocation Point

Invoke after execution changes are complete and before closeout.

## Binding Status

Bound to the existing verification command surface documented in `.consync/docs/verification-ladder.md`.

This is a command-based evidence contract, not a runner, orchestrator, automatic dispatcher, or subjective review agent.

## Command Binding

The Verify agent uses existing package scripts and verification levels only:

- `npm run verify` for the repo's normal verification surface.
- `npm test` for `FAST_CHECK`.
- `npm run test:e2e` for `UI_CHECK`.
- `npm run verify:full` for `FULL_VERIFY`.

The packet, trigger level, or human instruction determines which existing command(s) to run. The Verify agent does not add new commands.

## Evidence Reported

- Commands run.
- Pass/fail result for each command.
- Relevant failing output or suspected failure cause.
- Any required verification that was not run.

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

- Verify reports evidence; it does not decide by itself whether work is acceptable.
- Preflight establishes whether work can safely start before execution.
- Closeout uses Verify evidence, plus changed files and process requirements, to decide commit readiness or blocked status.
- No clean `PASS` if any required verification fails.
- Do not delete, skip, or weaken failing tests to get green results.
- Do not claim unrun checks passed.
