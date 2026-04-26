# Copilot Instructions — Consync Core

## Authority Boundary

`.consync/` is the authoritative Consync process layer.

Use `.consync/state/*`, `.consync/docs/runbook.md`, and `.consync/agents/*` as the source of truth for workflow behavior.

`.consync/agents/` defines agent roles, invocation points, and binding status. `.consync/skills/*` contains reusable procedures/skills that agents may reference; it is not the primary role-definition surface.

Treat `.github/` as a thin Copilot/GitHub adapter layer only.

## Purpose

This project is the local-first foundation of Consync.

The goal is to build a small, durable system for tracking creative work through:
- timestamped event artifacts
- GUID-based identity artifacts
- small JSON metadata files
- simple local tools

This project must remain useful without AI, network access, or server infrastructure.

---

## General Development Style

Write code in a style that is:

- simple
- explicit
- readable
- easy to refactor
- easy to test manually
- easy to extend later

Prefer code that is boring and clear over code that is clever.

Do not overengineer.

Do not introduce abstractions unless they are immediately useful.

Do not build for hypothetical future features unless explicitly asked.

---

## How to Approach Work

Implement only the task described by the current authoritative `.consync/state/*` files.

Use `.consync/docs/runbook.md` as the practical process entrypoint.

When working:
1. keep scope narrow
2. finish one small feature at a time
3. make it runnable
4. make it easy to verify manually
5. keep the codebase clean for the next iteration

Do not add extra commands, extra systems, or speculative features.

---

## Architectural Principles

### 1. Local-first
Assume the system must work fully offline.

Do not require:
- network access
- cloud services
- background servers
- external APIs

### 2. Time = iteration
Timestamped artifacts represent events, captures, or moments in a workflow.

### 3. GUID = identity
GUID metadata represents persistent concepts, entities, projects, or connective identity across time.

### 4. Filenames identify, metadata describes
Do not encode lots of meaning in filenames.

Filenames should stay stable and minimal.

Use JSON metadata for description and relationships.

### 5. Connective tissue matters more than app internals
Do not try to reorganize or reinterpret native app files unless explicitly asked.

Consync should focus on the connective layer around work:
- metadata
- timestamps
- summaries
- relationships
- selected exports

---

## Code Organization

Prefer this structure:

- `src/index.js` → entry point
- `src/commands/` → command handlers
- `src/lib/` → reusable logic
- `.consync/state/` → specs, handoff docs, logs
- `scripts/` → project scripts if needed

Keep CLI parsing separate from business logic.

Business logic should live in reusable functions that can later be exposed through other interfaces such as MCP tools.

---

## Node.js Preferences

Use plain Node.js unless a dependency is clearly justified.

Prefer:
- built-in Node modules
- small utility modules
- direct file operations
- simple async/await code

Avoid:
- large frameworks
- dependency-heavy architectures
- class hierarchies unless truly necessary
- configuration systems unless required by the current task

---

## Function Design

Prefer small focused functions.

A good function should:
- do one thing
- have a clear input
- return a clear output
- be reusable outside the CLI layer

Example mindset:
- CLI command gathers input
- reusable function performs logic
- file/log helper writes outputs

Do not bury core logic inside console interaction code.

---

## CLI Behavior

CLI commands should be:
- thin
- predictable
- easy to run manually
- easy to inspect

Output should be useful and concise.

When creating files, always print:
- what was created
- where it was created
- any key identifier, if relevant

---

## Logging and State

When the spec calls for logs or state files:
- keep them append-only and simple
- prefer plain JSON lines or similarly readable formats
- do not build a database
- do not build indexing systems unless explicitly requested

State files should remain human-readable.

---

## Testing Style

Prefer manual verification for early features.

When implementing a feature, make it easy for a human to verify by running one command and checking:
- expected files
- expected output
- expected JSON shape
- expected log entries

If automated tests are added later, keep them lightweight and focused.

Do not create large test scaffolding unless requested.

---

## Scope Control

This project is intentionally being built in small, testable chunks.

That means:

- do not “helpfully” add future commands
- do not anticipate unrequested features
- do not create elaborate plugin systems
- do not introduce watchers, servers, or background services unless explicitly requested
- do not refactor into a generalized platform too early

Start with the simplest implementation that satisfies the current handoff.

---

## Documentation Expectations

When appropriate:
- keep README updates short and practical
- keep docs aligned with verified behavior
- prefer examples over long explanations

Do not document speculative features as if they already exist.

---

## Collaboration Expectations

This project is developed through a ChatGPT ↔ human ↔ Copilot workflow.

That means code should support:
- incremental handoff
- easy review
- easy modification
- clear traceability between spec and implementation

Prefer code that makes the next iteration easier.

---

## Biases for This Project

Strongly prefer:
- simplicity
- directness
- human readability
- small modules
- filesystem-first design
- timestamp + GUID model
- JSON metadata
- offline usefulness

Strongly avoid:
- over-abstraction
- clever naming systems
- magical behavior
- speculative infrastructure
- premature MCP/server assumptions

---

## Final Rule

Keep Consync useful at its lowest level.

The local tool should provide value on its own.

AI, MCP, and richer interfaces may come later, but the foundation must remain lean, stable, and understandable.
