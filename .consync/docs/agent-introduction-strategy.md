# Agent Introduction Strategy

This is the current working guideline for introducing agents into Consync.

## Principle

Agents should be introduced when tasks are repeatable, success is easy to verify, and blast radius is small.

Agents should compete on execution speed, not on guessing reality.

## Maturity Stages

- Stage 1 — Human-run simulation
- Stage 2 — Agent drafts, human approves
- Stage 3 — Agent executes in isolated lanes
- Stage 4 — Background or parallel agents later

Keep movement between stages practical. Do not skip ahead just because a task sounds automatable.

## Good Early Agent Tasks

- test generation and expansion
- doc cleanup and linking
- stream snapshot summarization
- handoff condensation
- integrity checks across docs, code, and state
- fixture and verification checks

## Tasks To Avoid Early

- process model changes
- orchestration decisions
- multi-stream coordination
- anything relying on implicit human context

## First Candidate Agents

- `consync-test-agent` — drafts or expands narrow tests around already-understood behavior.
- `consync-integrity-agent` — checks whether docs, repo state, changed files, and verification still agree.
- `consync-docs-agent` — tightens small process and reference docs without changing the operating model.

## Integrity Agent Idea

The first integrity-focused agent should check:

- docs versus repo reality
- test coverage versus changed surface
- broken references
- missing verification steps

It should report first and should not enforce or mutate yet.

Its current place in the package workflow is defined in `.consync/docs/integrity-agent-loop.md`.

## Relationship To Streams

Streams define boundaries.
Tests define truth.
Agents operate inside those boundaries.