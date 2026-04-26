# Reentry Agent

## Purpose

Make the next session safe to resume by preserving concise, accurate context.

## Invocation Point

Invoke after closeout when context needs to be preserved for the next session or packet.

## Inputs

- Completed or blocked packet result
- Verification results
- Current changed files
- Relevant Consync state/docs references

## Responsibilities

- Summarize what changed and what remains unresolved.
- Record next safe action when the governing workflow allows it.
- Preserve blockers and verification failures plainly.
- Avoid inventing completion for partially completed work.

## Required Output

- Status: `PASS`, `FAIL`, or `BLOCKED`
- Resume summary
- Next safe action
- Known blockers or risks
- Verification status to trust on reentry

## Guardrails

- Do not manually edit `.consync/state/` unless the active workflow explicitly requires it.
- Do not hide failed verification.
- Do not create competing process truth outside `.consync/`.
