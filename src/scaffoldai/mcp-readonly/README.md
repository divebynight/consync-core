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
- A duplicate of `src/scaffoldai/mcp/`

---

## Relationship to `src/scaffoldai/mcp/`

The repository has **two complementary MCP surfaces**:

| Surface | Path | Transport | Client | Role |
|---------|------|-----------|--------|------|  
| **Operational** | `src/scaffoldai/mcp/` | stdio | Copilot, Codex | Full ScaffoldAI operational capabilities |
| **Readonly** | `src/scaffoldai/mcp-readonly/` | stdio + HTTPS | ChatGPT, external clients | Stricter, read-only compatibility layer |

**These are NOT duplicates.** They serve different client ecosystems:
- `src/scaffoldai/mcp/` is the **local trusted surface** with fuller capabilities (9 tools including diagnostics)
- `src/scaffoldai/mcp-readonly/` is the **constrained compatibility surface** with minimal exposure (5 tools, no diagnostics)

Both surfaces remain **thin adapters** calling the same shared ScaffoldAI core functions. Neither surface should contain business logic or state-transition logic.

---

## Readonly Tool Surface

Only these tools are exposed:

```text
scaffoldai_identity
scaffoldai_status (minimal, no git)
scaffoldai_packet_visibility (bounded metadata from .scaffoldai/packets)
scaffoldai_pending_questions (bounded advisory coordination visibility from .scaffoldai/runtime/mcp/signals.jsonl)
scaffoldai_completion_status (bounded advisory packet completion visibility from .scaffoldai/runtime/mcp/signals.jsonl)
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
- Expose write-capable or unrestricted-read tools

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

This surface is **deliberately more constrained** than `src/scaffoldai/mcp/`:
- **Fewer tools** (5 vs 9)
- **No diagnostic tools** (no signal, no shared-memory)
- **No direct filesystem access in MCP layer** (reads happen through canonical query helpers)
- **No git integration** (status is git-free)
- **No process spawning** (boundary enforced)

`scaffoldai_pending_questions` is advisory runtime coordination only. It does not resolve loop state authoritatively and does not grant write authority.

`scaffoldai_status`, `scaffoldai_packet_visibility`, and `scaffoldai_completion_status` also surface claim owner/status and busy or wait guidance as readonly visibility only. They do not grant claim ownership or release authority.

`scaffoldai_status` and `scaffoldai_packet_visibility` may also expose the latest bounded packet-intake result from local CLI intake. That visibility is advisory only: intake is not activation, and intake is not execution approval.

Pending-question resolution lifecycle behavior:
- `unresolvedOnly=true` (default) returns unresolved question/blocker observations only.
- `unresolvedOnly=false` preserves historical visibility, including resolved entries.
- Resolved records expose detected `resolution_status`, plus `resolved_at` and `resolved_by` when correlation is possible.
- Correlation is advisory and append-only; it does not mutate authoritative state.

Completion-handshake behavior:
- `scaffoldai_completion_status` reads append-only `packet_completed` advisory signals only.
- It may recommend human closeout when verify status is passed and no unresolved packet questions are detected.
- It may recommend resolving blockers first when verify failed/not_run or unresolved questions remain.
- It never mutates state, clears packets, executes closeout, or grants authority to close out work.

Packet-intake behavior:
- Strict packet intake is local CLI only and file-based only.
- Accepted packets are written into `.scaffoldai/packets/` with deterministic normalized filenames.
- Intake validation requires formal SDC structure and explicit approval fields; malformed packets are rejected with explicit reasons.
- Intake does not activate a packet unless the human passes `--activate`.
- Intake does not imply execution approval, MCP write authority, or autonomous behavior.

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
8. `tools/list` returns exactly the readonly exposed tools
9. `tools/call` works for all exposed tools
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
  "args": ["src/scaffoldai/mcp-readonly/stdio.js"]
}
```

---

## HTTPS Launch

For HTTPS-connected clients:

```bash
node src/scaffoldai/mcp-readonly/http.js
```

Default port: 3100

---

## Future Expansion Constraints

This surface must remain **deliberately minimal**.

When considering new tools for external clients:

1. **Evaluate necessity** - Is this tool essential for external observation?
2. **Check operational surface first** - Can the client use `src/scaffoldai/mcp/` instead?
3. **Maintain strict boundaries** - No filesystem, git, processes, or state writes
4. **Create shared core function** in `src/lib/*.scaffoldai.js` if needed
5. **Add thin adapter wrapper** in `src/scaffoldai/mcp-readonly/tools/`
6. **Update compatibility tests** to verify new tool
7. **Document expansion rationale** in this README

**Default answer should be NO.** This surface is meant to stay small.

Note on future scope:
- Limited HTTPS write tools may be evaluated in a future contract phase with explicit authority boundaries.
- No HTTPS write authority is introduced by the current completion-handshake visibility surface.

---

## Testing

Readonly MCP tools are tested through:
- Core function tests: `src/test/unit-scaffoldai-*.test.js`
- Compatibility tests: `src/test/mcp-readonly-chatgpt-compatibility.js`
- Manual ChatGPT integration testing

---

## Related Documentation

- `src/scaffoldai/mcp/README.md` - Local operational surface (fuller capabilities)
- `.scaffoldai/reference/mcp-boundary.reference.md` - MCP boundary and dual surface architecture
- `COMPATIBILITY.md` - ChatGPT compatibility expectations
- `.scaffoldai/contracts/` - Binding contracts for ScaffoldAI behavior

---

## Critical Constraints

1. **This server must remain a thin adapter** - no business logic, permission logic, or state-transition logic
2. **This server must stay stricter than `src/scaffoldai/mcp/`** - minimal tool surface, no filesystem/git/process access
3. **All state access must go through `scaffoldaiState` gateway** - no direct file reads/writes
4. **No mutation allowed** - this is a readonly surface by design
5. **Transport does not define authority** - stdio vs HTTPS is irrelevant to permission models
6. **This is not a duplicate of `src/scaffoldai/mcp/`** - these are complementary surfaces for different clients with different trust levels
