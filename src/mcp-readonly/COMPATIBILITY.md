# ScaffoldAI Readonly MCP Compatibility

Role: ChatGPT MCP compatibility regression reference

This readonly MCP server is a transport and tool exposure layer over canonical ScaffoldAI operational helpers. It must not become a parallel ScaffoldAI state reader, workflow engine, or write-capable MCP surface.

The compatibility expectations below come from the `mock-scaffoldai-mcp-poc` interoperability work. That repo is a compatibility reference only; its mock feature-loop architecture, mock state model, and write-capable feature tools must not be copied into `consync-core`.

## Phase 1 Tool Surface

Only these tools are exposed:

```text
scaffoldai_identity
scaffoldai_status
```

Deferred or write-capable tools must not be exposed by the readonly server.

## ChatGPT Compatibility Invariants

The dedicated compatibility test suite verifies:

1. `GET /health` returns `200` with healthy JSON.
2. `GET /mcp` with `Accept: text/event-stream` returns `200` and `Content-Type: text/event-stream`.
3. Anonymous `GET /mcp` SSE bootstrap does not require an existing session ID.
4. `POST /mcp` initialize accepts a ChatGPT-like `openai-mcp` client payload, including experimental visibility and UI MIME capability fields.
5. Initialize returns a compatible `protocolVersion`.
6. Initialize establishes or returns a valid `mcp-session-id`.
7. `tools/list` requires a valid initialized session.
8. `tools/list` with a valid session returns exactly the Phase 1 tools.
9. `tools/call` works for both exposed tools.
10. Write-capable or deferred tools are not exposed.
11. Unknown tools return deterministic MCP-compatible error behavior.
12. Malformed JSON-RPC returns deterministic MCP-compatible error behavior.
13. Anonymous SSE/bootstrap behavior remains streaming-compatible and does not immediately return JSON `No valid session ID provided`.

## Boundary

`src/mcp-readonly/**` must not:

- import filesystem modules
- call shell, git, or child processes
- read `.scaffoldai/*` directly
- write files
- expose workflow authority
- expose more than the Phase 1 readonly tools

Canonical ScaffoldAI helpers own state/doc access. MCP tools only validate MCP input shape and format helper responses.
