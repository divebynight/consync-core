# Handoff Delivery Bridge

## Purpose

This doc defines how Consync should deliver local handoff truth into ChatGPT or another AI session without confusing transport with source of truth.

Delivery reliability is now a first-class process concern.

A flaky transport layer can reintroduce drift even when local repo state is clean.

## Three Distinct Layers

### Local truth

Authoritative state that lives in the repo.

Current authoritative closeout artifact:

- `.consync/state/handoff.md`

Supporting re-entry artifacts that may travel with it:

- `.consync/state/snapshot.md`
- `.consync/docs/runbook.md` or a compact pointer to it

### Delivery bridge

The transport layer that moves local truth into a new AI session.

Its job is delivery, not reinterpretation.

It should move a small, trustworthy bundle from the local repo into ChatGPT or another assistant without silently mutating authority.

### Downstream assistant state

What the receiving assistant must know to continue correctly.

At minimum, the receiving assistant should be able to identify:

- the current mounted package or most recent completed package
- the active stream and current live-loop state
- the next safe action without reconstructing truth from many files

## Source-Of-Truth Rule

`.consync/state/handoff.md` remains the local authoritative closeout artifact.

The bridge is a transport layer, not a second source of truth.

External mirrors, uploads, synced files, and copied summaries must not become canonical by accident.

If transport and local repo truth disagree, the repo wins.

## Acceptable Delivery Modes

### Manual copy/paste

Strengths:

- simple
- works offline
- no extra tooling required

Weaknesses:

- easy to truncate or omit context
- depends on human discipline
- high rehydration burden

Risk profile:

- medium to high drift risk when done hurriedly

### Local generated export or bundle

Strengths:

- keeps local repo canonical
- can be made small and repeatable
- reduces human summarization burden

Weaknesses:

- requires a defined bundle shape
- still depends on a transport step unless delivery becomes direct

Risk profile:

- good near-term balance of reliability and simplicity

### Uploaded file handoff

Strengths:

- preserves exact artifact text
- easier to inspect than ad hoc manual summaries

Weaknesses:

- upload step can be skipped or stale
- receiving assistant may miss related context if only one file is uploaded

Risk profile:

- acceptable if the uploaded payload is small and explicit

### Synced cloud document or file mirror

Strengths:

- can reduce repeated manual transfer
- can keep a durable external landing zone

Weaknesses:

- sync reliability can be partial or delayed
- stale mirrored copies can look authoritative when they are not
- external tooling can fail at exactly the wrong moment

Risk profile:

- useful as a convenience layer, weak as the only bridge

Current Google Drive frustration is an example of this category: partially useful, but not reliable enough to be the only transport.

### Future MCP or direct tool-based delivery

Strengths:

- potentially lowest manual burden
- can preserve exact local truth with less copy friction

Weaknesses:

- not available yet here
- easy to overdesign too early

Risk profile:

- promising later, not required for the near-term bridge

## Successful Delivery

Handoff delivery is successful when:

- the receiving AI can identify the current package or last completed package
- the receiving AI can identify active stream and current system state
- the receiving AI can continue without reconstructing truth manually from many files
- the delivered payload does not silently fork or mutate local authority
- the human operator is not forced to summarize from memory

## Bridge Failure Modes

- stale uploaded or mirrored copy
- partial upload or mirror failure
- handoff delivered without snapshot context when snapshot is needed
- missing stream context
- multiple conflicting external copies
- human summarization from memory instead of repo truth
- a transport artifact being treated as canonical when local state has moved on

## Preferred Near-Term Automation Path

The preferred near-term path is:

- generate a small exportable handoff bundle locally
- keep local repo artifacts canonical
- treat transport as a separate delivery step
- avoid dependence on a flaky cloud mirror as the only bridge
- leave room for later direct delivery through MCP or similar tooling

This keeps the system practical now without overcommitting to Google Drive, a cloud sync layer, or a full direct-delivery stack.

## Minimal Reliable Bundle

The smallest practical bundle should usually include:

- latest handoff
- current snapshot
- a compact runbook pointer or equivalent bootstrap note

Optional only when needed:

- one deeper doc directly relevant to the mounted package

The bundle should stay small enough to deliver reliably and large enough to prevent manual reconstruction.

## Practical Rule

Transport must stay separate from source of truth.

The goal is to reduce human rehydration burden without duplicating authority across systems.

## Related Docs

- `.consync/docs/runbook.md` explains which local files should be read first during re-entry
- `.consync/state/snapshot.md` provides the compact current-state view that should usually travel with the latest handoff