# Consync + ScaffoldAI

## Governed AI-Assisted Systems for Real-World Workflows

`consync-core` is an experimental but operational repository exploring how AI-assisted systems can be built safely, transparently, and deterministically.

It combines:

- **ScaffoldAI** — a governance and development harness for AI-assisted workflows
- **Consync** — an experimental local-first creative tracking system used as the implementation target

The goal is not autonomous AI orchestration.

The goal is creating architectures where:

- authority is explicit
- execution boundaries are observable
- AI systems remain inspectable
- workflows remain verifiable
- humans remain the final authority layer

Everything in this repository is designed to work locally-first:
- without cloud dependencies
- without background services
- without hidden orchestration
- and without requiring autonomous execution

---

# Why This Repository Exists

Modern AI systems are increasingly capable of:

- executing tools
- modifying files
- coordinating workflows
- managing long-running tasks
- interacting with external systems

But most AI-assisted workflows still struggle with:

- hidden execution
- unclear authority boundaries
- unsafe orchestration
- prompt drift
- unverifiable state mutation
- uncontrolled agent behavior
- poor operational visibility

At the same time, creative work generates large amounts of fragile context:
- interrupted sessions
- disconnected files
- forgotten decisions
- incomplete handoffs
- unclear project state

This repository explores practical architectural approaches for solving both problems:
- preserving creative and operational context
- while maintaining explicit governance and deterministic workflows

---

# System Overview

## ScaffoldAI

ScaffoldAI is the governance and process layer.

It provides:

- verification surfaces
- operational contracts
- handoff systems
- advisory-only coordination patterns
- MCP boundary management
- deterministic workflow structure
- explicit execution semantics
- structured runtime state

ScaffoldAI is intentionally:

- manual-first
- observable
- inspectable
- verification-oriented
- non-autonomous by default

It is NOT:

- an autonomous orchestration engine
- a hidden agent runtime
- a self-modifying system
- an unrestricted execution framework

ScaffoldAI lives under `.scaffoldai/`.

It is not part of the Consync runtime product.

---

## Consync

Consync is the runtime product being built within the ScaffoldAI environment.

Consync explores:

- creative session tracking
- AI-assisted file organization
- metadata generation
- contextual memory systems
- media analysis workflows
- long-term creative archives

Consync acts as the real-world pressure test for ScaffoldAI.

The desktop runtime is built using:
- Electron
- React
- local JSON/state artifacts
- timestamped event tracking
- GUID-based metadata identity

---

# Design Position

This repository intentionally favors:

- explicit workflows
- deterministic verification
- human authority
- advisory-first systems
- bounded capability exposure
- observable operational state
- contracts over implicit behavior

Over:

- hidden orchestration
- unrestricted autonomy
- implicit execution
- opaque agent behavior
- uncontrolled multi-agent swarms

AI systems here are treated as managed workers operating within governed boundaries.

---

# Core Principles

## Human-First Architecture

Humans remain the final authority layer.

---

## Explicit Authority Boundaries

Execution capability should never be ambiguous.

---

## Advisory-First Systems

Systems should recommend before they execute.

---

## Observable Operational Surfaces

Actions, verification, and workflow boundaries should remain inspectable.

---

## Contracts Over Implicit Behavior

Operational expectations should be documented and verifiable.

---

## Deterministic Verification

Verification should rely on observable evidence instead of hidden assumptions.

---

## AI as Managed Worker, Not Autonomous Swarm

AI systems should operate within governed boundaries rather than unrestricted orchestration.

---

# What Currently Works

- **Session and file tracking** — timestamped event artifacts, GUID-based identity metadata, local JSON
- **Desktop workspace** — Electron app with audio file loading, markers, bookmarks, search, and workspace browsing
- **Runtime CLI** — commands for system status, preflight checks, structured verification, and handoff/closeout
- **Verification loop** — fast local checks that report PASS/FAIL across major runtime areas
- **MCP integration (read-only)** — local stdio MCP server exposing constrained operational tooling
- **CI** — GitHub Actions workflow running core verification on PRs and pushes

---

# Operational Model

This repository intentionally favors:

- manual orchestration
- explicit workflows
- constrained MCP capabilities
- deterministic verification
- visible operational state
- human approval for critical actions

The system intentionally avoids:

- hidden execution
- unrestricted autonomous behavior
- implicit approval semantics
- uncontrolled multi-agent orchestration

AI tools assist.

Humans approve, commit, and push.

---

# MCP Philosophy

MCP servers in this repository are treated as:

- controlled interface boundaries
- capability exposure layers
- operational surfaces

NOT as unrestricted autonomous runtimes.

Current MCP experimentation focuses on:

- status visibility
- verification guidance
- operational inspection
- bounded shared-memory experiments
- explicit capability exposure

Current MCP tooling is intentionally constrained and primarily read-only.

---

# Quick Start

```bash
# Install dependencies
npm install

# Start the desktop app
npm run start:desktop

# Run core tests
npm test

# Run fast verification
npm run verify
```

---

# Common Commands

| Command | What it does |
|---|---|
| `npm test` | Runs unit and integration tests |
| `npm run verify` | All fast non-E2E checks |
| `npm run verify:scaffoldai` | ScaffoldAI runtime checks, state, MCP coverage |
| `npm run verify:consync` | Fast Consync product checks |
| `npm run test:e2e` | Playwright renderer E2E |
| `npm run start:desktop` | Launches the Electron desktop app |
| `npm run scaffoldai:status` | Current runtime posture summary |
| `npm run scaffoldai:preflight` | Pre-work safety check |
| `npm run scaffoldai:mcp` | Starts the local MCP server (stdio) |

---

# Repository Layout

```text
consync-core/
  .github/       -> Tool adapter layer (Copilot, etc.)
  .scaffoldai/   -> ScaffoldAI bridge/state/process layer
  src/           -> Consync runtime/product source
  test/          -> Verification and runtime tests
  scripts/       -> Deterministic operational tooling
  sandbox/       -> Deterministic fixtures and local probes
```

Additional documentation:
- `src/README.md`
- `.scaffoldai/README.md`

---

# Documentation Map

| What you want | Where to look |
|---|---|
| What Consync is building | `src/README.md` |
| CLI commands reference | `src/commands/README.md` |
| ScaffoldAI runtime state | `.scaffoldai/reference/current-runtime-state.reference.md` |
| ScaffoldAI process guide | `.scaffoldai/process/runbook.process.md` |
| MCP client contract | `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md` |
| Desktop/Electron layer | `src/electron/README.md` |
| Sandbox fixtures | `sandbox/README.md` |

---

# Current Status

## Active Areas

- ScaffoldAI governance patterns
- MCP experimentation
- verification surfaces
- operational contracts
- Consync runtime development
- AI-assisted workflow architecture

## Operational Characteristics

- Local-first development
- No cloud dependency required
- Desktop runtime operational
- CLI verification operational
- Read-only MCP operational over stdio
- CI verification operational
- Human approval required for commits, pushes, and PRs

## Intentionally Deferred

- autonomous orchestration
- unrestricted execution
- self-modifying systems
- hidden workflow automation
- production-scale agent autonomy

This is experimental software.

APIs, architecture, and operational patterns will evolve over time.

---

# Why Open Source This?

This repository is intentionally public because:

- AI governance patterns should be inspectable
- operational architectures benefit from peer review
- deterministic workflows are easier to improve collaboratively
- other engineers may want reusable patterns
- the ecosystem needs more practical examples of constrained AI systems

This is an exploratory engineering repository, not a finished platform.

---

# AI Tool Compatibility

This repository is intentionally structured for:

- humans
- ChatGPT
- Copilot
- Codex
- MCP clients
- future AI-assisted tooling

The repository emphasizes:

- discoverability
- explicit structure
- operational readability
- deterministic navigation
- layered documentation

---

# Long-Term Direction

Future exploration areas include:

- governed execution systems
- action classification models
- stronger operational contracts
- supervised agent workflows
- controlled memory systems
- creative runtime evolution
- AI-assisted development governance

---

# Relationship Between Systems

```text
ScaffoldAI is used to build consync-core
consync-core produces Consync
```

ScaffoldAI and Consync intentionally remain separate systems.

That separation is foundational to the architecture.
