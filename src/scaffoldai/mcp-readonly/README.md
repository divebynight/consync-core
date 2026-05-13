# ScaffoldAI MCP Server (Readonly Compatibility Surface)

**Role:** Constrained ScaffoldAI MCP surface for external clients

**Transport:** stdio + HTTPS (ChatGPT, external MCP clients)

**Authority:** Thin adapter over ScaffoldAI core/state functions (minimal subset)

---

## Purpose

This MCP server provides a **stricter, readonly compatibility surface** for external AI clients such as ChatGPT or future HTTPS-connected tools.

It exposes a minimal subset of ScaffoldAI capabilities with tighter boundaries than the local operational surface. The server is a thin adapter layer — it does not contain business logic, permission logic, or state-transition logic.

**What this server is:**
- An HTTPS-compatible MCP interface for external clients
- A thin adapter over ScaffoldAI authority functions (minimal subset)
- A constrained exposure of ScaffoldAI observability
- A compatibility layer for ChatGPT MCP integration

**What this server is NOT:**
- A remote service (runs locally, may accept HTTPS connections)
- A workflow engine or orchestrator
- An autonomous agent bus
- A shell execution proxy
- A command router
- A duplicate of `src/mcp/`

---

## Relationship to `src/scaffoldai/mcp/`

The repository has **two complementary MCP surfaces**:

| Surface | Path | Transport | Client | Role |
|---------|------|-----------|--------|------|  
| **Operational** | `src/scaffoldai/mcp/` | stdio | Copilot, Codex | Full ScaffoldAI operational capabilities |
| **Readonly** | `src/scaffoldai/mcp-readonly/` | stdio + HTTPS | ChatGPT, external clients | Stricter, read-only compatibility layer |

**These are NOT duplicates.** They serve different client ecosystems:
- `src/scaffoldai/mcp/` is the **local trusted surface** with fuller capabilities (8 tools including diagnostics)
- `src/scaffoldai/mcp-readonly/` is the **constrained compatibility surface** with minimal exposure (2 tools, no diagnostics)

Both surfaces remain **thin adapters** calling the same shared ScaffoldAI core functions. Neither surface should contain business logic or state-transition logic.

---

## Phase 1 Tool Surface

Only these tools are exposed:

```text
scaffoldai_identity
scaffoldai_status (minimal, no git)
```

**Deliberately NOT exposed:**
- `scaffoldai_preflight` (not needed for external observation)
- `scaffoldai_question` (not needed for external observation)
- `scaffoldai_verify_recommend` (not needed for external observation)
- `scaffoldai_closeout_readiness` (not needed for external observation)
- `scaffoldai_signal` (diagnostic tool, local only)
- `scaffoldai_memory_write` (diagnostic tool, local only)
- `scaffoldai_memory_read` (diagnostic tool, local only)

Deferred or write-capable tools must not be exposed by the readonly server.

---

## Architecture Principles

### 1. Thin Adapter Only

This server is a **surface layer** that:
- Validates MCP input shape
- Calls shared ScaffoldAI core functions (minimal subset)
- Formats responses for MCP output
- Does NOT contain business logic or state-transition logic

It does NOT:
- Import filesystem modules (`fs`, `path`)
- Call shell, git, or child processes
- Read `.scaffoldai/*` directly
- Write files
- Expose workflow authority
- Expose more than Phase 1 readonly tools

### 2. Authority Through Core Functions

All queries flow through:
```
MCP tool → ScaffoldAI authority function → scaffoldaiState gateway → .scaffoldai/state/*
```

The MCP server never touches `.scaffoldai/state/` directly. It calls minimal functions like:
- `gatherScaffoldAIIdentity()` (read-only query, no file access)
- `gatherStatus()` (read-only query, no git)

**No MCP tool performs state mutation.** This surface is deliberately readonly.

### 3. Transport Does Not Define Authority

- stdio vs HTTPS is a transport concern
- Tool contracts + core validation define authority
- The same validation rules apply regardless of transport
- HTTPS exposure requires tighter boundaries (minimal tool surface)

### 4. Stricter Than Operational Surface

This surface is **deliberately more constrained** than `src/mcp/`:
- **Fewer tools** (2 vs 8)
- **No diagnostic tools** (no signal, no shared-memory)
- **No filesystem access** (boundary enforced)
- **No git integration** (status is git-free)
- **No process spawning** (boundary enforced)

---

## ChatGPT Compatibility

The compatibility test suite verifies:

1. `GET /health` returns `200` with healthy JSON
2. `GET /mcp` with `Accept: text/event-stream` returns `200` and `Content-Type: text/event-stream`
3. Anonymous `GET /mcp` SSE bootstrap does not require existing session ID
4. `POST /mcp` initialize accepts ChatGPT-like `openai-mcp` client payload
5. Initialize returns compatible `protocolVersion`
6. Initialize establishes or returns valid `mcp-session-id`
7. `tools/list` requires valid initialized session
8. `tools/list` returns exactly Phase 1 tools
9. `tools/call` works for both exposed tools
10. Write-capable or deferred tools are not exposed
11. Unknown tools return deterministic MCP-compatible error behavior
12. Malformed JSON-RPC returns deterministic MCP-compatible error behavior
13. Anonymous SSE/bootstrap remains streaming-compatible

---

## Stdio Launch

ChatGPT and other MCP clients can launch this server via stdio:

```json
{
  "command": "node",
  "args": ["src/mcp-readonly/stdio.js"]
}
```

---

## HTTPS Launch

For HTTPS-connected clients:

```bash
node src/mcp-readonly/http.js
```

Default port: 3100

---

## Future Expansion Constraints

This surface must remain **deliberately minimal**.

When considering new tools for external clients:

1. **Evaluate necessity** - Is this tool essential for external observation?
2. **Check operational surface first** - Can the client use `src/mcp/` instead?
3. **Maintain strict boundaries** - No filesystem, git, processes, or state writes
4. **Create shared core function** in `src/lib/*.scaffoldai.js` if needed
5. **Add thin adapter wrapper** in `src/mcp-readonly/tools/`
6. **Update compatibility tests** to verify new tool
7. **Document expansion rationale** in this README

**Default answer should be NO.** This surface is meant to stay small.

---

## Testing

Readonly MCP tools are tested through:
- Core function tests: `src/test/unit-scaffoldai-*.test.js`
- Compatibility tests: `src/test/mcp-readonly-compatibility.test.js` (if exists)
- Manual ChatGPT integration testing

---

## Related Documentation

- `src/mcp/README.md` - Local operational surface (fuller capabilities)
- `.scaffoldai/reference/mcp-boundary.reference.md` - MCP boundary and dual surface architecture
- `COMPATIBILITY.md` - ChatGPT compatibility expectations
- `.scaffoldai/contracts/` - Binding contracts for ScaffoldAI behavior

---

## Critical Constraints

1. **This server must remain a thin adapter** - no business logic, permission logic, or state-transition logic
2. **This server must stay stricter than `src/mcp/`** - minimal tool surface, no filesystem/git/process access
3. **All state access must go through `scaffoldaiState` gateway** - no direct file reads/writes
4. **No mutation allowed** - this is a readonly surface by design
5. **Transport does not define authority** - stdio vs HTTPS is irrelevant to permission models
6. **This is not a duplicate of `src/mcp/`** - these are complementary surfaces for different clients with different trust levels
