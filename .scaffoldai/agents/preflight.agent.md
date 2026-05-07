# Preflight Agent

## Purpose

Confirm the repo and Consync process state are safe before a packet begins.

## Invocation Point

Invoke before intake or execution when a packet is mounted or a human asks to begin work.

## Command Binding

The current concrete Runtime Command binding for the Preflight agent is:

```sh
npm run check:state-preflight
```

This is an implicit command binding to the existing state preflight check, not a full orchestrator and not a new runner.

## Execution Binding (Explicit Runtime Command)

- CLI: `preflight-run`
- Input: prompt string
- Behavior: validates readiness of classified work
- Output: structured readiness report
- No execution, no orchestration, no state mutation

## Inputs

- Current user packet or task statement
- `git status --short`
- `.scaffoldai/state/snapshot.md`
- `.scaffoldai/state/next-action.md`
- `.scaffoldai/state/handoff.md`
- `npm run check:state-preflight` output
- Available verification requirements for the packet surface

## Responsibilities

- Identify the active stream and mounted package.
- Detect unrelated dirty work before implementation begins.
- Run required preflight integrity checks when the packet requests them.
- Confirm whether the packet may proceed, should pause, or needs human clarification.

## Required Output

- Status: `PASS`, `FAIL`, or `BLOCKED`
- Active stream/package summary
- Dirty worktree summary
- Preflight command results
- Proceed/stop recommendation

## Required Executable Packet Fields

Preflight must block any packet missing these fields:
- MODE
- EXECUTION SURFACE
- CONTEXT
- EXPECTATION
- TASK or GOAL
- OUTPUT FORMAT

Preflight must also block if the declared EXECUTION SURFACE packet field does not match the current runtime binding.

## Guardrails

- Do not modify runtime code.
- Do not modify `.scaffoldai/state/` manually.
- Do not treat a failed preflight as a clean pass.
