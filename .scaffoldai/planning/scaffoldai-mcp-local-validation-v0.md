# Planning — scaffoldai-mcp-local-validation-v0

Created: 2026-05-06
Status: VALIDATED

---

## 0. Purpose

Define the simplest local stdio-based validation flow for the MCP read-only v0 server.

This document is documentation-only. It does not require implementation changes, new tools, or writes to any path outside `.scaffoldai/tmp/`.

---

## 1. Server Entry Point

The MCP server runs as a stdio process:

```
npm run scaffoldai:mcp
```

Which resolves to:

```
node src/mcp/server.js
```

The server:
- Uses `@modelcontextprotocol/sdk` stdio transport
- Accepts JSON-RPC 2.0 messages on stdin
- Writes JSON-RPC 2.0 responses to stdout
- Registers 5 tools: `scaffoldai_status`, `scaffoldai_preflight`, `scaffoldai_question`, `scaffoldai_verify_recommend`, `scaffoldai_closeout_readiness`
- Does not write files, spawn subprocesses (beyond what the lib helpers do), or expose any network port

---

## 2. Recommended Local Inspector

**Tool: `@modelcontextprotocol/inspector`**

This is the official MCP inspector CLI, designed for exactly this purpose. It launches a local web UI that connects to any stdio MCP server and lets you call tools interactively.

### Install (one-time, global or npx)

```bash
npx @modelcontextprotocol/inspector node src/mcp/server.js
```

This single command:
1. Starts the MCP inspector web UI (typically at `http://localhost:5173`)
2. Launches `node src/mcp/server.js` as the stdio child process
3. Connects the inspector to it over stdio

No config file, no server setup, no remote exposure.

Inspector boundary:

- The Inspector is a local development and validation UI, not the ScaffoldAI runtime authority.
- Its browser UI may be served from localhost, but the ScaffoldAI MCP server still communicates over local stdio.
- Inspector success does not approve closeout, provide verification evidence, or grant permission to run Runtime Commands.
- The Inspector must not be treated as remote exposure, production transport, orchestration, or an MCP client behavior contract.

### Alternative: `mcp-cli` (lightweight, terminal-only)

If you prefer a terminal-only client:

```bash
npx mcp-cli node src/mcp/server.js
```

This is a minimal interactive REPL over stdio. Less UI, same protocol. Useful for scripted validation.

### Alternative: Raw stdio (lowest-level)

For manual inspection or scripted tests, send raw JSON-RPC directly:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/mcp/server.js
```

This is the lowest-level option and most useful for checking that the server starts and responds at all.

---

## 3. Configuration

No configuration file is needed for v0. The inspector accepts the server command directly.

If a future MCP client requires a config file (e.g., Claude Desktop `claude_desktop_config.json`), the entry would be:

```json
{
  "mcpServers": {
    "scaffoldai-consync": {
      "command": "node",
      "args": ["/absolute/path/to/consync-core/src/mcp/server.js"]
    }
  }
}
```

This is out of scope for v0 local validation but documented here for reference.

---

## 4. How to Call Each Tool

All tools accept no arguments (empty params `{}`). In the MCP inspector UI, select the tool and click "Run".

Via raw stdio (one per line):

```bash
# List all tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/mcp/server.js

# scaffoldai_status
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"scaffoldai_status","arguments":{}}}' | node src/mcp/server.js

# scaffoldai_preflight
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"scaffoldai_preflight","arguments":{}}}' | node src/mcp/server.js

# scaffoldai_question
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"scaffoldai_question","arguments":{}}}' | node src/mcp/server.js

# scaffoldai_verify_recommend
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"scaffoldai_verify_recommend","arguments":{}}}' | node src/mcp/server.js

# scaffoldai_closeout_readiness
echo '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"scaffoldai_closeout_readiness","arguments":{}}}' | node src/mcp/server.js
```

---

## 5. Expected Output for Each Tool

All tools return a `content` array with one `text` item containing JSON. The JSON always includes:

```json
{
  "tool": "<tool_name>",
  "execution_class": "READ_ONLY",
  "status": "<STATUS>",
  "data": { ... },
  "next_safe_action": "<string>"
}
```

### 5.1 `scaffoldai_status`

Healthy repo expected:

```json
{
  "tool": "scaffoldai_status",
  "execution_class": "READ_ONLY",
  "status": "ON_TRACK",
  "data": {
    "contract": { "mode": "...", "allowed_packet_types": [...], ... },
    "in_flight_packet": null,
    "git_clean": false,
    "git_file_count": <n>,
    "verify_command": "npm run verify:scaffoldai"
  },
  "next_safe_action": "Repo is on track. Run scaffoldai preflight to confirm readiness."
}
```

Note: `git_clean: false` is normal during active development. `status` degrades to `WARNING` when git is dirty, `BLOCKED` when contract is missing.

### 5.2 `scaffoldai_preflight`

Healthy repo expected:

```json
{
  "tool": "scaffoldai_preflight",
  "execution_class": "READ_ONLY",
  "status": "PASS",
  "data": {
    "blockers": [],
    "warnings": []
  },
  "next_safe_action": "Preflight PASS. Safe to begin work."
}
```

Degraded (dirty git) expected:

```json
{
  "status": "WARNING",
  "data": {
    "blockers": [],
    "warnings": ["<n> uncommitted file(s) in working tree"]
  }
}
```

### 5.3 `scaffoldai_question`

Healthy repo expected:

```json
{
  "tool": "scaffoldai_question",
  "execution_class": "READ_ONLY",
  "status": "CLEAR",
  "data": {
    "question_count": 0,
    "questions": [],
    "in_flight_packet": null,
    "stream": "electron_ui"
  },
  "next_safe_action": "No open structural questions. Run the recommended VERIFY COMMAND before closeout."
}
```

### 5.4 `scaffoldai_verify_recommend`

Expected:

```json
{
  "tool": "scaffoldai_verify_recommend",
  "execution_class": "READ_ONLY",
  "status": "RECOMMEND",
  "data": {
    "verify_command": "npm run verify:scaffoldai",
    "target": "scaffoldai",
    "reason": "..."
  },
  "next_safe_action": "Run: npm run verify:scaffoldai"
}
```

`status` must be `RECOMMEND` — never `PASS` or `FAIL`.

### 5.5 `scaffoldai_closeout_readiness`

Expected (during active development with uncommitted files):

```json
{
  "tool": "scaffoldai_closeout_readiness",
  "execution_class": "READ_ONLY",
  "status": "NEEDS_VERIFICATION",
  "data": {
    "changed_file_count": <n>,
    "changed_files": [...],
    "commit_prefix_suggestion": "process:" | "feat:" | null,
    "verify_command": "npm run verify:scaffoldai",
    "verify_evidence": "not provided",
    "in_flight_packet": null
  },
  "next_safe_action": "Run verify and pass --verify-passed to scaffoldai closeout."
}
```

`status` must never be `READY_FOR_REVIEW` from this tool. `verify_evidence` must always be `"not provided"`.

---

## 6. What Proves v0 is Working

A successful v0 local validation requires all of the following:

| Check | Expected |
|---|---|
| Server starts without error | No stderr on launch |
| `tools/list` returns 5 tools | All 5 names present |
| Each tool returns `execution_class: "READ_ONLY"` | Present in all 5 responses |
| `scaffoldai_question` returns `status: "CLEAR"` | `question_count: 0` in healthy repo |
| `scaffoldai_verify_recommend` returns a `verify_command` string | Non-empty, matches npm script |
| `scaffoldai_verify_recommend` does not return `PASS` or `FAIL` | `status: "RECOMMEND"` only |
| `scaffoldai_closeout_readiness` never returns `READY_FOR_REVIEW` | Always `NEEDS_VERIFICATION` or `WARNING` |
| `scaffoldai_closeout_readiness` returns `verify_evidence: "not provided"` | Hardcoded gate |
| No file writes occur during any tool call | Check `.scaffoldai/tmp/` is unchanged |

These checks are already covered by `src/test/unit-scaffoldai-mcp-readonly.js` (28 assertions). The local stdio inspection confirms the server-level transport works in addition to the unit-level tool logic.

---

## 7. Failure Signs

| Symptom | Likely Cause |
|---|---|
| Server exits immediately on launch | `@modelcontextprotocol/sdk` import failed; run `npm install` |
| `tools/list` returns empty or fewer than 5 tools | Tool registration error in `server.js` |
| Tool returns `error: true` | Exception in the tool handler; check stderr |
| `execution_class` missing from response | Tool handler was not updated to v0 contract |
| `scaffoldai_question` returns questions | State drift or a real structural issue; check `.scaffoldai/state/` |
| `scaffoldai_verify_recommend` returns `PASS` or `FAIL` | Implementation violation — must return `RECOMMEND` only |
| `scaffoldai_closeout_readiness` returns `READY_FOR_REVIEW` | Implementation violation — `verifyPassed` must always be false |
| Inspector UI shows connection error | Port conflict or inspector version mismatch; try `npx @modelcontextprotocol/inspector@latest` |
| Raw stdio test hangs | Server is waiting for more input; press Ctrl-C; use `echo | node src/mcp/server.js` to close stdin |

---

## 8. Out of Scope for v0 Local Validation

- No new MCP tools
- No writes to any path outside `.scaffoldai/tmp/`
- No ngrok or remote tunnel exposure
- No HTTP server or SSE transport for the ScaffoldAI MCP server
- No production or runtime authority from the Inspector's localhost validation UI
- No Claude Desktop or other AI client integration
- No persistent session state
- No authentication or access control
- No tool argument validation (all v0 tools accept empty args)
- No automated MCP client test scripts (unit tests cover the tool logic; stdio transport is validated manually)

---

## 9. Runbook (Quickstart)

```bash
# 1. Confirm server starts and lists tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node src/mcp/server.js

# 2. Launch interactive inspector
npx @modelcontextprotocol/inspector node src/mcp/server.js
# → Open http://localhost:5173 in browser
# → Select each tool and run it
# → Confirm execution_class: READ_ONLY in all responses

# 3. Confirm unit tests still pass
npm run verify:scaffoldai
```

---

## 10. Implementation Changes Required

**None.** The v0 MCP surface is fully implemented. This document describes how to validate it locally. The unit test suite (`unit-scaffoldai-mcp-readonly.js`) already covers all tool-level correctness assertions. Local stdio inspection adds transport-level confidence.
