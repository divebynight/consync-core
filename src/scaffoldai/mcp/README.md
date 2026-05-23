# ScaffoldAI MCP Server (Local Operational Surface)

**Role:** Full-featured ScaffoldAI MCP surface for local trusted clients

**Transport:** stdio only (Copilot, Codex, local MCP clients)

**Authority:** Thin adapter over ScaffoldAI core/state functions

---

## Purpose

This MCP server provides the **operational ScaffoldAI MCP surface** for local AI clients such as GitHub Copilot and Codex.

It exposes controlled access to ScaffoldAI capabilities through MCP tools that delegate to shared core functions. The server is a thin adapter layer — it does not contain business logic, permission logic, or state-transition logic.

**What this server is:**
- A local stdio MCP interface for trusted clients
- A thin adapter over ScaffoldAI authority functions
- A controlled exposure of ScaffoldAI operational capabilities
- A diagnostic and observability surface

**What this server is NOT:**
- A remote service
- A workflow engine or orchestrator
- An autonomous agent bus
- A shell execution proxy
- A command router
- A source of workflow authority

---

## Relationship to `src/scaffoldai/mcp-readonly/`

The repository has **two complementary MCP surfaces**:

| Surface | Path | Transport | Client | Role |
|---------|------|-----------|--------|------|
| **Operational** | `src/scaffoldai/mcp/` | stdio | Copilot, Codex | Full ScaffoldAI operational capabilities |
| **Readonly** | `src/scaffoldai/mcp-readonly/` | stdio + HTTPS | ChatGPT, external clients | Stricter, read-only compatibility layer |

**These are NOT duplicates.** They serve different client ecosystems:
- `src/scaffoldai/mcp/` is the **local trusted surface** with fuller capabilities
- `src/scaffoldai/mcp-readonly/` is the **constrained compatibility surface** for external/HTTPS clients

Both surfaces remain **thin adapters** calling the same shared ScaffoldAI core functions. Neither surface should contain business logic or state-transition logic.

---

## Current Tools

**Status & Observation:**
- `scaffoldai_status` - Current ScaffoldAI operational status
- `scaffoldai_preflight` - Pre-work readiness check
- `scaffoldai_question` - Structural questions about current state

**Verification & Closeout:**
- `scaffoldai_verify_recommend` - Recommended verification command
- `scaffoldai_verify_run` - Local bounded verify execution runner (allowlisted commands only)
- `scaffoldai_closeout_readiness` - Closeout readiness assessment
- `scaffoldai_completion_status` - Readonly completion-handshake visibility from append-only signals

**Diagnostic:**
- `scaffoldai_signal` - Client capability and presence signaling (diagnostic POC)
- `scaffoldai_submit_sdc_candidate` - Bounded candidate SDC submission to `.scaffoldai/inbox/` (candidate only, no intake/activation/claim)
- `scaffoldai_memory_write` - Inter-client message write (diagnostic POC)
- `scaffoldai_memory_read` - Inter-client message read (diagnostic POC)

---

## Architecture Principles

### 1. Thin Adapter Only

This server is a **surface layer** that:
- Validates MCP input shape
- Calls shared ScaffoldAI core functions
- Formats responses for MCP output
- Logs tool invocations to stderr

It does NOT:
- Contain state-transition logic (that's in gatekeeper functions)
- Contain permission logic (that's in authority functions)
- Contain business rules (that's in core validation)
- Read/write state directly (must go through `scaffoldaiState` gateway)

### 2. Authority Through Core Functions

All state mutation must flow through:
```
MCP tool → ScaffoldAI authority function → scaffoldaiState gateway → .scaffoldai/state/*
```

The MCP server never touches `.scaffoldai/state/` directly. It calls functions like:
- `gatherStatus()` (read-only query)
- `gatherPreflightResults()` (read-only query)
- `gatherQuestions()` (read-only query)
- `resolveVerifyCommand()` (read-only query)

Bounded mutation currently allowed in this surface:
- `scaffoldai_submit_sdc_candidate` may write candidate files under `.scaffoldai/inbox/` only.
- It must never intake, activate, claim, execute, closeout, clean, or commit.
- It must never mutate `.scaffoldai/state/` or `.scaffoldai/streams/`.

All other operational tools remain read-only or append-only diagnostic surfaces. When additional mutation is added in future SDCs, it must:
- Go through gatekeeper authority functions
- Validate transitions
- Append history via `scaffoldaiState.appendHistory()`
- Return evidence, not approval

### 3. Transport Does Not Define Authority

- stdio vs HTTPS is a transport concern
- Tool contracts + core validation define authority
- The same validation rules apply regardless of transport

### 3b. Bounded Local Verify Execution

`scaffoldai_verify_run` is intentionally bounded:
- local stdio MCP only
- allowlisted verify commands only
- no arbitrary shell strings
- timeout enforced
- output bounded to tails
- returns structured pass/fail/error/timeout result

It is not a general shell and does not grant closeout authority.

### 4. Diagnostic Tools Are Isolated

`scaffoldai_signal` and `scaffoldai_memory_*` are **diagnostic POC tools only**:
- They prove inter-client coordination is possible
- They write to `.scaffoldai/runtime/mcp/shared-memory.jsonl` (NOT state/)
- They are isolated from authoritative workflow state
- They must not become workflow engines or task queues

Completion handshake note:
- `scaffoldai_signal` now supports advisory `packet_completed` records containing packet id, verify summary fields, changed files, and closeout hints.
- Completion records are append-only diagnostic metadata in `.scaffoldai/runtime/mcp/signals.jsonl`.
- `scaffoldai_status`, `scaffoldai_packet_visibility`, and `scaffoldai_completion_status` now surface claim owner/status and busy or wait guidance as readonly visibility only.
- `scaffoldai_status` and `scaffoldai_packet_visibility` may also surface the latest bounded local packet-intake result for advisory visibility.
- Completion records must not mutate packet/state files, close packets, create commits, or grant workflow authority.
- `scaffoldai_completion_status` is readonly advisory visibility only and may recommend that a human run closeout; it cannot perform closeout.

Packet-intake note:
- Strict SDC packet intake is local CLI only and file-based only.
- Intake validates formal SDC structure and rejects malformed or unauthorized packets with explicit reasons.
- Intake writes only accepted packets into `.scaffoldai/packets/` using deterministic normalized filenames.
- Intake is separate from activation and separate from execution approval.

---

## Stdio Launch

Local MCP clients should launch this server directly:

```json
{
  "command": "node",
  "args": ["src/scaffoldai/mcp/server.js"]
}
```

**Do NOT use `npm run scaffoldai:mcp` for stdio clients.** npm lifecycle output can contaminate stdout and break the MCP protocol stream.

---

## Stdio Cleanliness

For stdio MCP, stdout is **reserved for MCP protocol messages only**.

All diagnostic output must go to stderr:
```javascript
process.stderr.write(`[MCP] tool call: scaffoldai_status\n`);
```

Any non-protocol stdout output will corrupt the client/server message exchange.

---

## Future Expansion

When adding new MCP tools:

1. **Create shared core function first** in `src/lib/*.scaffoldai.js`
2. **Add thin adapter wrapper** in `src/scaffoldai/mcp/tools.js` or similar
3. **Validate input shape** using zod schemas
4. **Delegate to core function** with minimal transformation
5. **Format response** for MCP output
6. **Add tests** for the core function (not MCP wrapper)
7. **Document** tool purpose and authority class

**Do NOT:**
- Embed business logic in MCP tools
- Read `.scaffoldai/state/` directly
- Write state without going through `scaffoldaiState` gateway
- Create MCP-specific validation that differs from core validation
- Make MCP the source of workflow authority

---

## Testing

MCP tools are tested indirectly through their core functions:
- Core function tests: `src/test/unit-scaffoldai-*.test.js`
- Integration tests: `src/test/integration-*.js`
- System tests: `src/test/scaffoldai-invariants.test.js`

The MCP server itself is integration-tested through manual client verification, not unit tests.

---

## Related Documentation

- `.scaffoldai/reference/mcp-boundary.reference.md` - MCP boundary and authority model
- `src/scaffoldai/mcp-readonly/COMPATIBILITY.md` - Readonly surface compatibility expectations
- `.scaffoldai/contracts/` - Binding contracts for ScaffoldAI behavior
- `.scaffoldai/process/runbook.process.md` - Operational workflow procedures

---

## Critical Constraints

1. **This server must remain a thin adapter** - no business logic, permission logic, or state-transition logic
2. **All state access must go through `scaffoldaiState` gateway** - no direct file reads/writes
3. **Mutation must go through gatekeeper authority functions** - never bypass transition validation
4. **Transport does not define authority** - stdio vs HTTPS is irrelevant to permission models
5. **Diagnostic tools must remain isolated** - no workflow engine behavior, no task queues
6. **This is not a duplicate of `src/scaffoldai/mcp-readonly/`** - these are complementary surfaces for different clients
