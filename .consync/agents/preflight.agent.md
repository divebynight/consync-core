# Preflight Agent

## Purpose

Confirm the repo and Consync process state are safe before a packet begins.

## Invocation Point

Invoke before intake or execution when a packet is mounted or a human asks to begin work.

## Inputs

- Current user packet or task statement
- `git status --short`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`
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

## Guardrails

- Do not modify runtime code.
- Do not modify `.consync/state/` manually.
- Do not treat a failed preflight as a clean pass.
