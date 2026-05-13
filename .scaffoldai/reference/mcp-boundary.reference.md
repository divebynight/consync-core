# ScaffoldAI MCP Boundary Reference

Updated: 2026-05-13
Status: CURRENT / DIAGNOSTIC BOUNDARY

---

## Purpose

ScaffoldAI MCP is a controlled access layer over ScaffoldAI capabilities and state.
It lets local MCP-aware clients observe or exercise explicitly exposed ScaffoldAI surfaces without turning MCP into workflow authority, command execution, routing, or automation.

The MCP servers are local only (stdio for trusted clients, stdio+HTTPS for external clients). They are not remote services, product runtime, shell proxies, workflow engines, or autonomous agent buses.

---

## Dual Surface Architecture

The repository has **two complementary MCP surfaces**:

| Surface | Path | Transport | Client | Role | Current Tools |
|---------|------|-----------|--------|------|---------------|
| **Operational** | `src/scaffoldai/mcp/` | stdio | Copilot, Codex | Full ScaffoldAI operational capabilities | status, preflight, question, verify_recommend, closeout_readiness, signal, memory_write, memory_read |
| **Readonly** | `src/scaffoldai/mcp-readonly/` | stdio + HTTPS | ChatGPT, external | Stricter, read-only compatibility layer | identity, status (minimal) |

### Why Two Surfaces?

**These are NOT duplicates.** They serve different client ecosystems with different trust and capability requirements:

1. **`src/scaffoldai/mcp/` - Local Operational Surface**
   - **Trusted local clients** (Copilot, Codex running on developer machine)
   - **stdio transport only** (no network exposure)
   - **Fuller capability set** (status, preflight, question, verify recommendations, closeout readiness)
   - **Diagnostic tools** (signal, shared-memory)
   - **Future expansion** (may add more operational tools as needed)

2. **`src/scaffoldai/mcp-readonly/` - External Compatibility Surface**
   - **External or HTTPS clients** (ChatGPT, future cloud-connected tools)
   - **stdio + HTTPS transport** (network-exposed capability)
   - **Minimal tool surface** (identity, status only — no diagnostic tools)
   - **Stricter boundaries** (no filesystem, no git, no processes, no state writes)
   - **Future expansion must stay constrained** (deliberate minimal surface)

### Complementary, Not Competing

Both surfaces:
- Are **thin adapters** over shared ScaffoldAI core functions
- Call the same authority functions (`gatherStatus()`, etc.)
- Go through the same state gateway (`scaffoldaiState`)
- Follow the same validation rules
- Must not contain business logic or permission logic
- Must not read/write `.scaffoldai/state/` directly

The **transport** (stdio vs HTTPS) and **client trust level** determine which surface is appropriate, not the underlying authority model.

---

## Local Client Launch

Local stdio MCP clients should launch the server directly with Node:

```text
command: node
args: ["src/scaffoldai/mcp/server.js"]
```

Do not use `npm run scaffoldai:mcp` for stdio MCP clients. npm lifecycle output can contaminate stdout and break the MCP protocol stream.

---

## Stdio Cleanliness

For stdio MCP, stdout is reserved for MCP protocol messages only.

Human-readable logs, diagnostics, warnings, and startup notes must go to stderr.
Any non-protocol stdout output can corrupt the client/server message exchange.

---

## Shared-Memory POC

`scaffoldai_memory_write` and `scaffoldai_memory_read` are diagnostic POC tools only.
They exist to prove that local MCP clients can exchange bounded diagnostic records through the ScaffoldAI MCP surface.

The shared-memory POC is isolated from Consync product state and authoritative ScaffoldAI workflow state.
It is not BRIDGE truth, PROCESS truth, verify evidence, closeout evidence, or long-term memory.

Messages are data only, never executable intent.
No message should trigger commands, tool calls, file edits, routing, automation, agent dispatch, verification, closeout, staging, committing, pushing, or any other workflow action.

The shared-memory POC must not become:

- a workflow engine
- a task queue
- an autonomous bus
- an agent listener
- a routing layer
- a long-term memory system
- production workflow state

---

## Diagnostic Tool Safety

Diagnostic MCP tools must remain:

- fixed-path
- append-only when writing
- bounded in input and output
- manually invoked
- non-authoritative
- isolated from authoritative ScaffoldAI workflow state
- unable to execute commands or trigger follow-on actions

Diagnostic records may be useful for connection checks and client visibility tests.
They must not be interpreted as approval, assignment, instruction, runtime state, or workflow progress.

---

## Verified Round Trip

The current shared-memory diagnostic POC verified this local MCP round trip:

```text
Copilot -> MCP write -> Codex MCP read -> Codex MCP write -> Copilot MCP read
```

Result:

```text
MCP_SHARED_MEMORY_ROUND_TRIP: PASS
```
