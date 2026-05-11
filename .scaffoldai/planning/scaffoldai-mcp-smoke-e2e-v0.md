# Planning — scaffoldai-mcp-smoke-e2e-v0

Created: 2026-05-06
Updated: 2026-05-07
Status: IMPLEMENTED / VALIDATED / UPDATED FOR SIGNAL TOOL

Note: Original examples in this plan targeted the five read-only MCP tools. The current smoke/E2E tests now expect six tools: the original five read-only tools plus `scaffoldai_signal`, the bounded `LOCAL_SIGNAL_APPEND_ONLY` diagnostic signal tool.
Status: IMPLEMENTED / VALIDATED

---

## 0. Purpose

Define terminal-runnable tests that validate the MCP server through stdio transport.

These tests exercise the full server path — process spawn, JSON-RPC message exchange, response parsing — rather than calling tool handler functions directly. They are complementary to `unit-scaffoldai-mcp-readonly.js`, which tests function-level logic in isolation.

This document records the implemented and validated smoke/E2E test model. It does not add runtime authority.

---

## 1. Non-Goals

- No new MCP tools.
- No writes outside `.scaffoldai/tmp/`.
- No network, ngrok, HTTP, or SSE.
- No remote MCP client configuration (no Claude Desktop, no Cursor).
- No autonomous behavior.
- No integration with the Consync product layer (`src/core/`, `src/electron/`).
- No coverage of error injection or malformed input fuzzing (deferred to v1).

---

## 2. Test Scope

Two tests are planned:

| Test | File | What it validates |
|---|---|---|
| Smoke | `src/test/mcp-smoke.js` | Server starts; `tools/list` returns all 5 expected tools |
| Transport E2E | `src/test/mcp-transport-e2e.js` | All 5 tools are callable via stdio; semantic contracts hold |

Authority boundary:

- These tests validate MCP protocol behavior, tool registration, and read-only response contracts.
- They do not add MCP tools, run Runtime Commands, execute verification, approve closeout, or create new execution authority.
- A passing transport test means the local stdio observation path works; it is not verification evidence for product work.
- The tests use the same stdio transport class the MCP Inspector uses, but they do not validate the Inspector UI itself.

---

## 3. Implementation Approach

### Transport mechanism

Use the **MCP SDK client** over stdio. The SDK ships `Client` and `StdioClientTransport` as CJS-compatible exports:

```js
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
```

`StdioClientTransport` accepts a `command` + `args` pair and spawns the server as a child process, communicating over its stdio pipes. This is the same mechanism the MCP Inspector uses.

```js
const transport = new StdioClientTransport({
  command: "node",
  args: [path.join(repoRoot, "src", "mcp", "server.js")],
});
const client = new Client({ name: "test-client", version: "0.1.0" });
await client.connect(transport);
```

This approach:
- Tests the actual stdio transport path, not just the tool functions
- Uses the same SDK that the server uses — no custom JSON-RPC parsing
- Does not require a separate HTTP or WebSocket server
- Works offline and in CI

### Why not raw JSON-RPC over stdio?

Raw stdio (piping `echo '...' | node server.js`) is useful for quick manual inspection but unsuitable for automated tests because:
- Requires manual message framing (newline-delimited or length-prefixed)
- No built-in request/response correlation
- Server stdin closes immediately when the pipe ends, causing it to exit

The SDK client handles framing, correlation, and lifecycle automatically.

### Test structure

Both test files follow the same pattern as all other test files in this repo:

```js
const TEST_NAME = "mcp-smoke";
console.log(`[${TEST_NAME}] Running`);
// async main() with process.exitCode = 1 on failure
// PASS/FAIL per assertion
// console.log(`[${TEST_NAME}] PASS`) at end
```

Async test runner pattern:

```js
async function main() {
  // setup: spawn server via SDK client
  // assertions
  // teardown: client.close()
}

main().catch((err) => {
  console.error(`[${TEST_NAME}] UNHANDLED ERROR: ${err.message}`);
  process.exitCode = 1;
});
```

---

## 4. Smoke Test Contract — `mcp-smoke.js`

**Purpose:** Confirm the server process starts, negotiates MCP protocol, and lists all expected tools.

**Steps:**
1. Spawn `node src/mcp/server.js` via `StdioClientTransport`
2. Call `client.listTools()`
3. Assert the returned tool names match the expected list exactly
4. Close client

**Assertions:**

```
PASS: server starts and connects without error
PASS: tools/list returns a non-empty result
PASS: tools/list returns exactly 6 tools
PASS: tool "scaffoldai_status" is listed
PASS: tool "scaffoldai_preflight" is listed
PASS: tool "scaffoldai_question" is listed
PASS: tool "scaffoldai_verify_recommend" is listed
PASS: tool "scaffoldai_closeout_readiness" is listed
PASS: tool "scaffoldai_signal" is listed
```

**Total: 8 assertions**

---

## 5. Transport E2E Test Contract — `mcp-transport-e2e.js`

**Purpose:** Call all 5 tools through the stdio transport and verify their semantic contracts hold end-to-end.

**Steps:**
1. Spawn server via `StdioClientTransport`
2. Call each of the 5 tools via `client.callTool({ name: "...", arguments: {} })`
3. Parse the JSON from `result.content[0].text`
4. Assert semantic contracts per tool
5. Close client

**Assertions:**

```
PASS: server starts and connects without error

# scaffoldai_status
PASS: scaffoldai_status call succeeds
PASS: scaffoldai_status returns execution_class "READ_ONLY"
PASS: scaffoldai_status returns a valid status field

# scaffoldai_preflight
PASS: scaffoldai_preflight call succeeds
PASS: scaffoldai_preflight returns execution_class "READ_ONLY"
PASS: scaffoldai_preflight returns status PASS or WARNING (not BLOCKED in healthy repo)

# scaffoldai_question
PASS: scaffoldai_question call succeeds
PASS: scaffoldai_question returns execution_class "READ_ONLY"
PASS: scaffoldai_question returns status CLEAR in healthy repo
PASS: scaffoldai_question returns question_count 0 in healthy repo

# scaffoldai_verify_recommend
PASS: scaffoldai_verify_recommend call succeeds
PASS: scaffoldai_verify_recommend returns execution_class "READ_ONLY"
PASS: scaffoldai_verify_recommend returns status RECOMMEND
PASS: scaffoldai_verify_recommend does not return status PASS or FAIL
PASS: scaffoldai_verify_recommend returns a non-empty verify_command string

# scaffoldai_closeout_readiness
PASS: scaffoldai_closeout_readiness call succeeds
PASS: scaffoldai_closeout_readiness returns execution_class "READ_ONLY"
PASS: scaffoldai_closeout_readiness does not return status READY_FOR_REVIEW
PASS: scaffoldai_closeout_readiness returns verify_evidence "not provided"
```

**Total: 20 assertions**

---

## 6. Timeout Strategy

Tests that spawn a child process can hang indefinitely if the server stalls or the client never receives a response. Two layers of timeout protection are needed.

### Per-call timeout

The MCP SDK `Client.callTool()` and `Client.listTools()` accept a `RequestOptions` object with a `timeout` field (milliseconds):

```js
const result = await client.callTool(
  { name: "scaffoldai_status", arguments: {} },
  undefined,       // resultSchema
  { timeout: 5000 } // 5 second per-call timeout
);
```

Use **5000ms** per call. All 5 tool handlers are synchronous filesystem reads; they should complete in under 100ms in practice.

### Overall test timeout

Wrap `main()` in a `Promise.race` against a timeout:

```js
const OVERALL_TIMEOUT_MS = 30000;

Promise.race([
  main(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Test timed out after 30s")), OVERALL_TIMEOUT_MS)
  ),
]).catch((err) => {
  console.error(`[${TEST_NAME}] FATAL: ${err.message}`);
  process.exitCode = 1;
  process.exit(1); // force exit — child process may still be running
});
```

`process.exit(1)` is needed in the timeout path because the spawned server child process keeps the Node event loop alive even after `client.close()`.

### Teardown guarantee

Always close the client in a `finally` block to ensure the child process is terminated:

```js
try {
  // assertions
} finally {
  await client.close().catch(() => {});
}
```

---

## 7. Determinism Guardrails

These tests must produce the same result every time in a healthy repo:

| Concern | Guardrail |
|---|---|
| Git status varies | Tests do not assert `git_clean: true` — they check structural shape only |
| Active packet changes | `scaffoldai_question` result is checked for `status: CLEAR`, not a specific packet value |
| Verify command changes with contract target | Only assert the value is a non-empty string, not a hardcoded command |
| Filesystem race | No concurrent writers; all tools are read-only |
| SDK version changes | Test file documents SDK version assumption at top |

---

## 8. Command Names

Add to `package.json` scripts:

```json
"test:mcp:smoke":    "node src/test/mcp-smoke.js",
"test:mcp:e2e":      "node src/test/mcp-transport-e2e.js",
"test:mcp":          "npm run test:mcp:smoke && npm run test:mcp:e2e"
```

These run independently of `verify:scaffoldai` initially (see section 9).

---

## 9. Verify Integration Recommendation

### Phase 1 — optional (immediate post-implementation)

Wire `test:mcp:smoke` and `test:mcp:e2e` as standalone commands only. Do **not** add them to `verify:scaffoldai` yet. Rationale:

- These tests spawn a child process — they add ~2–5s to the verify runtime
- They must be confirmed stable across multiple local runs before becoming required
- `unit-scaffoldai-mcp-readonly.js` (28 assertions, already in verify) covers function-level correctness

### Phase 2 — required (after stability confirmed)

Add a new verify step after `[verify] ScaffoldAI MCP read-only surface`:

```js
runNodeStep(
  "[verify] ScaffoldAI MCP smoke test",
  [path.join(repoRoot, "src", "test", "mcp-smoke.js")],
  GROUPS.SYSTEM,
  SURFACES.SCAFFOLDAI
);
runNodeStep(
  "[verify] ScaffoldAI MCP transport E2E",
  [path.join(repoRoot, "src", "test", "mcp-transport-e2e.js")],
  GROUPS.SYSTEM,
  SURFACES.SCAFFOLDAI
);
```

Phase 2 is deferred until Phase 1 confirms stability.

---

## 10. Failure Output Shape

Both test files emit the same format used across all test files in this repo:

**Success:**
```
[mcp-smoke] Running
  PASS: server starts and connects without error
  PASS: tools/list returns exactly 6 tools
  ...
[mcp-smoke] PASS
```

**Assertion failure:**
```
[mcp-smoke] Running
  PASS: server starts and connects without error
  FAIL: tools/list returns exactly 6 tools — got 5
[mcp-smoke] (exit code 1)
```

**Unhandled error (server crash, spawn failure, timeout):**
```
[mcp-smoke] Running
[mcp-smoke] FATAL: Failed to connect to MCP server: spawn ENOENT
```

---

## 11. Risks and Guardrails

| Risk | Mitigation |
|---|---|
| SDK `StdioClientTransport` API changes across versions | Pin SDK version; document assumption in test file header |
| Child process not cleaned up on test failure | `process.exit(1)` in timeout path; `finally` teardown |
| Test hangs in CI with no TTY | `process.exit` in timeout path forces termination |
| Test writes to wrong path | Tests contain no `fs.writeFile` or equivalent calls |
| `/tmp` usage | Both test files must not reference `/tmp`; enforced by adding them to the write-ops check in `unit-scaffoldai-mcp-readonly.js` |
| `scaffoldai_question` flaps if structural gap opens | Check is limited to `status: CLEAR` — the same condition already checked by unit tests |

---

## 12. Files to Create (implementation phase)

| File | Purpose |
|---|---|
| `src/test/mcp-smoke.js` | 8-assertion smoke test |
| `src/test/mcp-transport-e2e.js` | 20-assertion transport E2E test |

**Modify:**
| File | Change |
|---|---|
| `package.json` | Add `test:mcp:smoke`, `test:mcp:e2e`, `test:mcp` scripts |

**Defer:**
| File | Change |
|---|---|
| `src/test/verify.js` | Add MCP transport steps — deferred to Phase 2 |
