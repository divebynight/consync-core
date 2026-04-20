# Consync Runbook

## Purpose

This runbook is the thin operating entrypoint for a new human, ChatGPT, or Copilot session.

Use it to answer two questions fast:

1. How should Consync be operated right now?
2. Which repo files tell the current truth?

This file is not the full spec. It is the practical decision layer above the deeper docs.

## How To Start A Session

Read these files in order:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

Then check the repo surface:

1. `git status --short`
2. any files named in the current package
3. the deeper reference docs only if the live state is unclear

## Core Operating Loop

The live loop is still singular.

- `.consync/state/next-action.md` is the live execution slot
- `.consync/state/handoff.md` is the live closeout for the most recently completed package
- `.consync/state/snapshot.md` is the fast re-entry artifact

Run one package at a time.

For each package:

1. read `next-action.md`
2. execute only that package
3. run the declared verification
4. reconcile repo state
5. overwrite `handoff.md`
6. refresh `snapshot.md`
7. only then prepare the next package

## Active Stream Rule

The system may have many durable streams, but only one live owner at a time.

- `.consync/state/active-stream.md` records the active stream
- `.consync/orchestration/active_foreground_stream.txt` records the foreground stream
- the live loop should match that ownership unless an intentional switch or reconciliation is in progress

If the system is closed, any stream may be chosen intentionally.

If the system is open, the active stream must be continued until it is completed, paused cleanly, or formally switched.

## Open Vs Closed System Rule

Treat the system as closed when:

- `handoff.md` closes the last package coherently
- `snapshot.md` reflects the current truth
- repo state is reconciled
- there is no ambiguity about which package or stream is live

Treat the system as open when:

- a package is currently mounted in `next-action.md`
- repo state and state files imply in-flight work
- stream ownership and live work do not fully match yet

Closed systems allow intentional stream choice.

Open systems require finishing, pausing, or formally switching the active work before moving elsewhere.

## Stream Switching Rule

Switch streams deliberately, not implicitly.

When switching:

1. pause or close the current stream cleanly
2. update `.consync/state/active-stream.md`
3. update `.consync/orchestration/active_foreground_stream.txt` if needed
4. make `next-action.md` match the new owner
5. keep `handoff.md` and `snapshot.md` aligned with that reality

If those files disagree, reconciliation comes before new feature work.

## Package Selection Rule

Choose the next package from repo truth, not chat memory.

Primary inputs:

1. `.consync/state/snapshot.md`
2. `.consync/state/handoff.md`
3. `.consync/state/package_plan.md`
4. `.consync/state/active-stream.md`
5. current repo status

Keep packages narrow.

Prefer:

- one concrete behavior change
- one focused doc change
- one repair slice

Avoid bundling feature work, process repair, and state reconciliation into one large package unless the current package explicitly says to do that.

## State Reconciliation Rule

If state is inconsistent or misleading, reconciliation takes priority over feature execution.

Examples:

- `next-action.md` points at work that `active-stream.md` does not explain
- `handoff.md` describes a different package than the repo files imply
- repo status shows unfinished work without matching closeout state

When that happens:

1. stop interpreting from memory
2. read the live state files again
3. classify the state cleanly
4. repair the baseline before advancing normal work

## How To Use This Runbook With AI Tools

For a new AI conversation, paste or summarize:

1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. any single deeper doc directly relevant to the current package

Tell the assistant to treat `.consync/state/*` as authoritative over prior conversation memory.

The assistant should:

1. inspect the named repo files first
2. execute one package only
3. verify the result
4. overwrite `handoff.md`
5. avoid broad refactors or speculative expansion

## Pointers To Deeper Docs

- `.consync/docs/doc-integrity-layer.md` for the governed documentation/state surface, canonical live-state questions, and integrity enforcement points
- `.consync/docs/current-system.md` for current product and architecture truth
- `.consync/docs/stream-operating-model.md` for stream structure and pause-safe rules
- `.consync/docs/stream-and-state-interaction.md` for live-loop versus per-stream state
- `.consync/docs/stream-switch-and-active-owner-rules.md` for switching and ownership
- `.consync/docs/human-assisted-observation-closeout-rules.md` for manual observation packages
- `.consync/docs/agent-routing-policy.md` and `.consync/docs/integrity-agent-loop.md` for optional agent use