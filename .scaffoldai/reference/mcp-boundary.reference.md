# ScaffoldAI MCP Boundary Reference

Updated: 2026-05-08
Status: CURRENT / DIAGNOSTIC BOUNDARY

---

## Purpose

ScaffoldAI MCP is a controlled access layer over ScaffoldAI capabilities and state.
It lets local MCP-aware clients observe or exercise explicitly exposed ScaffoldAI surfaces without turning MCP into workflow authority, command execution, routing, or automation.

The MCP server is local stdio only. It is not a remote service, product runtime, shell proxy, workflow engine, or autonomous agent bus.

---

## Local Client Launch

Local stdio MCP clients should launch the server directly with Node:

```text
command: node
args: ["src/mcp/server.js"]
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
