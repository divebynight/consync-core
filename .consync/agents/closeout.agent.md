# Closeout Agent

## Purpose

Prepare completed work for safe handoff or commit readiness after implementation and verification.

## Invocation Point

Invoke after verify completes, or when failed verification must be reported as blocked.

## Process Binding

The current concrete execution surface for the Closeout agent is:

```text
.consync/skills/closeout-agent.md
```

This is a prompt/process binding to the existing closeout workflow, not a full orchestrator, automatic dispatcher, new runner, or new command. `.github/prompts/run_closeout.prompt.md` is an adapter that points back to this workflow.

## Inputs

- `git status --short`
- `git diff --stat`
- Changed files
- Verification results
- `.consync/skills/closeout-agent.md`
- Relevant Consync docs and state references

## Responsibilities

- Summarize the final change surface.
- Confirm verification passed or report why closeout is blocked.
- Identify whether docs, work-log, or coverage maps require updates.
- Confirm that runtime behavior was not changed when the packet was docs-only.
- Prepare commit readiness information when verification permits it.

## Required Output

- Status: `PASS`, `FAIL`, or `BLOCKED`
- Files changed
- Verification results
- Missing coverage or residual risks
- Commit readiness

## Guardrails

- Do not report clean closeout if verify fails.
- Do not stage or commit unrelated changes.
- Do not push automatically.
- Do not rewrite process docs broadly outside packet scope.
