TYPE: PROCESS
PACKAGE: establish_architecture_system_contract

STATUS

READY

SUMMARY

Introduce a global architecture contract that defines how Consync is structured across Core, Bridge, and Interface layers.

This ensures that all future development follows a consistent system-first approach and prevents business logic from drifting into UI or Electron layers.

This is not a feature change. It is a foundational system document.

FILES CREATED

- `ARCHITECTURE.md` — defines system layers, responsibilities, and development rules

FILES MODIFIED

- `.consync/state/package_plan.md`
- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/state/handoff.md`

GOAL

Create a single source-of-truth document that:

1. Defines Core as the only source of business logic
2. Defines Bridge as a thin forwarding layer
3. Defines Interface as display/input only
4. Establishes development and testing rules
5. Prevents architectural drift as the system evolves

CONSTRAINTS

- Keep the document simple and readable
- Do not over-engineer or introduce excessive abstraction
- Do not modify existing application code
- Do not restructure folders in this package
- Focus only on defining the contract, not enforcing it programmatically

TASK

1. Create a new file at the project root named `ARCHITECTURE.md`

2. Populate it with the following content:

---

# Consync Architecture — System Contract

## Purpose

This document defines the core architectural rules of Consync.

Its purpose is to ensure that:

- The system remains stable as it evolves
- Features are implemented in the correct layer
- Multiple interfaces (Electron, CLI, MCP) can exist without duplicating logic
- The system behaves consistently regardless of how it is accessed

This is a global contract, not tied to any single package or feature.

---

## Core Principle

Consync is a single system with multiple interfaces.

There is one source of truth:

The Core (Node.js)

All other layers must depend on it and must not reimplement its logic.

---

## System Layers

### 1. Core (Node.js) — Source of Truth

The Core is the actual Consync system.

It is responsible for:

- Session artifact persistence (read/write)
- Bookmark creation and storage
- Session derivation (counts, latest note, timestamps)
- File system interaction
- All business logic

Requirements:

- Must be executable without Electron
- Must be testable independently
- Must not depend on UI or renderer code
- Must produce deterministic outputs

Example responsibilities:

- writeBookmark(sessionDir, data)
- readSession(sessionDir)
- deriveSessionState(sessionData)

---

### 2. Bridge Layer (Electron Main + Preload)

The Bridge connects interfaces to the Core.

It is responsible for:

- Exposing safe APIs to the renderer
- Forwarding calls to the Core
- Managing IPC boundaries

Requirements:

- Must be thin and minimal
- Must not contain business logic
- Must not derive session state
- Must not modify data beyond simple validation or forwarding

Example:

preload exposes addBookmark → calls core.writeBookmark

---

### 3. Interface Layer (Renderer / UI)

The Interface displays state and captures user input.

It is responsible for:

- Rendering session data
- Triggering user actions (e.g., adding a bookmark)
- Displaying derived values

Requirements:

- Must not contain business logic
- Must not derive session state independently
- Must not read/write files directly
- Must rely entirely on the Core (via Bridge)

Example:

UI triggers addBookmark via exposed API

---

### 4. Tests (Verification Layer)

Tests validate system behavior.

Core Tests (Required):

- Must verify:
  - persistence (artifact correctness)
  - derivation (session state)
  - reload consistency
- Must not depend on UI

Interface Tests (Optional):

- Should be minimal
- Must not be the only verification of behavior

---

## Development Rules

Every feature must follow this sequence:

1. Implement in Core
2. Verify with deterministic tests (no UI)
3. Confirm persistence behavior
4. Expose through Bridge (if needed)
5. Integrate into Interface (UI)

---

## Anti-Rules (Critical)

Do NOT:

- Put business logic in the renderer
- Derive session state in the UI
- Depend on Electron for correctness
- Use UI behavior as proof of system correctness
- Duplicate logic across layers

---

## Verification Rule

A feature is not complete until:

- It works through Core alone
- It passes deterministic tests
- It persists correctly
- It can be reloaded from disk with identical results

---

## Mental Model

Consync is:

One engine (Core) with multiple dashboards (interfaces)

Interfaces may change, but the engine must remain stable.

---

## Future Interfaces

This architecture supports additional interfaces without changing Core:

- CLI commands
- MCP server (AI integration)
- Web UI

All must call into the same Core logic.

---

## Enforcement

When implementing or reviewing any change, ask:

1. Does this logic belong in Core?
2. Can this be tested without UI?
3. Is this duplicating logic that already exists?
4. Would this still work if Electron was removed?

If any answer is “no,” the implementation likely violates this contract.

---

## Final Note

This document is intentionally simple.

It exists to prevent drift and ensure Consync remains:

- predictable
- testable
- extensible
- system-first (not UI-first)

---

3. Do not modify any other files except state files

4. Update state files:

- `package_plan.md`
  - Add this as a foundational process package

- `snapshot.md`
  - Note that architecture contract is now defined

- `next-action.md`
  - Point to the next package (likely continuing bookmark or session work)

- `handoff.md`
  - Record that ARCHITECTURE.md was created and no code changes were made

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Confirm `ARCHITECTURE.md` exists at project root
2. Confirm content matches the contract structure
3. Confirm no application code was modified
4. Confirm only expected state files were updated

PASS CRITERIA

- Architecture contract exists and is readable
- No unintended code changes
- State files updated correctly

FAIL CRITERIA

- Document is missing or incomplete
- Code was modified
- Scope expanded beyond documentation

NOTES

- This is a system-level guardrail for all future work
- It should be referenced implicitly in all future packages
- Keep it stable unless a major architectural shift occurs