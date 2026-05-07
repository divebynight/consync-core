# System Identity Contract

## Purpose

This document defines the core terminology and architectural boundaries for Consync and ScaffoldAI.

It exists to prevent drift, ambiguity, and inconsistent mental models across development sessions.

If any future work contradicts this document, this document takes precedence until explicitly updated.

---

## Core Definitions

### Consync

**Consync** is the software/product.

It is a creative tracking system that:
- tracks sessions
- allows bookmarking, flagging, and annotating files
- stores metadata about creative work

Consync is what end users interact with.

---

### consync-core

**consync-core** is the repository and codebase that builds Consync.

It contains:
- the Consync runtime (`src/`)
- development infrastructure
- tests
- documentation

Important:
> consync-core is not Consync itself — it is the project that produces Consync.

---

### ScaffoldAI

**ScaffoldAI** is a separate system.

It is:
- an AI development/process platform
- a deterministic workflow system
- a coordination layer for tools like Copilot, Codex, ChatGPT

It provides:
- handoff system (`next-action`, `handoff`, `snapshot`)
- process orchestration
- structured development flow

Important:
> ScaffoldAI is NOT part of Consync as a product.

---

## System Relationship

```text
ScaffoldAI is used to build consync-core
consync-core produces Consync
```

---

## Bridge Layer

### Definition

A **bridge layer** is project-local state/config required for a system to operate.

It is:
- NOT source code
- NOT reusable logic
- specific to a single project

---

### ScaffoldAI Bridge

```text
.scaffoldai/
```

This folder contains:
- development state (`next-action`, `handoff`, `snapshot`)
- streams
- packets
- process runtime data

Important:
> `.scaffoldai/` belongs to ScaffoldAI, not Consync.

---

### Consync Bridge

```text
.consync/
```

This folder is used ONLY by the Consync product.

It will contain:
- session data
- bookmarks
- notes
- file metadata

Important:
> `.consync/` should NOT be used for ScaffoldAI development state.

---

## Directory Model (Target)

```text
consync-core/
  .github/       -> tool adapter layer (Copilot, etc.)
  .scaffoldai/   -> ScaffoldAI bridge/state (project-local)
  scaffoldai/    -> ScaffoldAI source/process (future package)
  src/           -> Consync runtime/product source
  package.json
```

---

## Non-Goals (Current Phase)

- Do NOT use Consync to track the development of consync-core
- Do NOT mix Consync metadata with ScaffoldAI state
- Do NOT collapse ScaffoldAI into Consync

---

## Key Principle

> Consync and ScaffoldAI must remain conceptually and structurally separate.

Any coupling must occur only through a thin, explicit boundary.

---

## Drift Detection Rule

If at any point:

- `.consync/` contains development/process state
- `.scaffoldai/` contains reusable source logic
- or Consync and ScaffoldAI responsibilities overlap

Then the system has drifted and must be re-evaluated.

---

## Update Rule

This document may only be changed via:

- explicit discussion
- a dedicated decision packet
- followed by a verification pass

---

## Status

ACTIVE — authoritative