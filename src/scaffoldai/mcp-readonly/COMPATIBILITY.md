# ScaffoldAI Readonly MCP Compatibility

**Role:** ChatGPT MCP compatibility regression reference

**Transport:** stdio + HTTPS (ChatGPT, external MCP clients)

**Authority:** Thin adapter over canonical ScaffoldAI operational helpers

---

## Purpose

This readonly MCP server is a **stricter compatibility surface** for external clients such as ChatGPT that may connect over HTTPS.

It provides a controlled, constrained subset of ScaffoldAI capabilities with tighter boundaries than the local operational surface.

---

## Relationship to `src/scaffoldai/mcp/`

The repository has **two complementary MCP surfaces**:

| Surface | Path | Transport | Client | Role |
|---------|------|-----------|--------|------|
| **Operational** | `src/scaffoldai/mcp/` | stdio | Copilot, Codex | Full ScaffoldAI operational capabilities |
| **Readonly** | `src/scaffoldai/mcp-readonly/` | stdio + HTTPS | ChatGPT, external clients | Stricter, read-only compatibility layer |

**These are NOT duplicates.** They serve different client ecosystems:
- `src/scaffoldai/mcp/` is the **local trusted surface** with fuller capabilities (status, preflight, question, verify, closeout, diagnostic tools)
- `src/scaffoldai/mcp-readonly/` is the **constrained compatibility surface** with minimal exposure (identity, status, packet visibility, pending questions, completion status)

Both surfaces remain **thin adapters** calling the same shared ScaffoldAI core functions. Neither surface should contain business logic or state-transition logic.

---

## Architecture Principles

This readonly MCP server is a transport and tool exposure layer over canonical ScaffoldAI operational helpers. It must not become a parallel ScaffoldAI state reader, workflow engine, or write-capable MCP surface.

The compatibility expectations below come from the `mock-scaffoldai-mcp-poc` interoperability work. That repo is a compatibility reference only; its mock feature-loop architecture, mock state model, and write-capable feature tools must not be copied into `consync-core`.

---

## Readonly Tool Surface

Only these tools are exposed:

```text
scaffoldai_identity
scaffoldai_status
scaffoldai_packet_visibility
scaffoldai_pending_questions
scaffoldai_completion_status
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
8. `tools/list` with a valid session returns exactly the readonly exposed tools.
9. `tools/call` works for all exposed tools.
10. Write-capable or deferred tools are not exposed.
11. Unknown tools return deterministic MCP-compatible error behavior.
12. Malformed JSON-RPC returns deterministic MCP-compatible error behavior.
13. Anonymous SSE/bootstrap behavior remains streaming-compatible and does not immediately return JSON `No valid session ID provided`.
14. `scaffoldai_packet_visibility` provides bounded metadata only (filename/category/existence/title-summary/in-flight relation) with no packet mutation.
15. `scaffoldai_packet_visibility` also surfaces claim owner/status and busy/wait guidance as readonly visibility only.
16. `scaffoldai_pending_questions` returns bounded advisory runtime metadata from `.scaffoldai/runtime/mcp/signals.jsonl` only, with no write authority and no authoritative resolution.
17. `scaffoldai_pending_questions` with `unresolvedOnly=true` hides resolved entries when detectable.
18. `scaffoldai_pending_questions` with `unresolvedOnly=false` preserves historical visibility and may include `resolution_status`, `resolved_at`, and `resolved_by` when detectable.
19. `scaffoldai_completion_status` returns bounded advisory completion records (`packet_completed`) and supports packet/latest filtering.
20. `scaffoldai_completion_status` includes advisory readiness recommendation only; it does not provide closeout authority.

## Boundary

`src/scaffoldai/mcp-readonly/**` must not:

- import filesystem modules
- call shell, git, or child processes
- read `.scaffoldai/*` directly
- write files
- expose workflow authority
- expose more than the Phase 1 readonly tools

Canonical ScaffoldAI helpers own state/doc access. MCP tools only validate MCP input shape and format helper responses.
