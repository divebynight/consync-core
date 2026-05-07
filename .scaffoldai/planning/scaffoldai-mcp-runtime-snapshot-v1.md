# Planning — scaffoldai-mcp-runtime-snapshot-v1

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

Create a local, read-only runtime snapshot command that emulates an external AI client having a bounded window into the ScaffoldAI MCP server without exposing the server remotely.

The command will call the existing 5 MCP read-only tools through local stdio transport and produce one deterministic JSON bundle that can be pasted or uploaded into ChatGPT:

- `scaffoldai_status`
- `scaffoldai_preflight`
- `scaffoldai_question`
- `scaffoldai_verify_recommend`
- `scaffoldai_closeout_readiness`

The snapshot is an observation artifact. It is not an execution authority, state transition, verification result, or closeout approval.

---

## 2. Non-Goals

- No remote MCP exposure.
- No ngrok.
- No HTTP, SSE, WebSocket, or localhost browser transport.
- No write-capable MCP tools.
- No new MCP tools beyond the current 5 read-only tools.
- No direct imports of MCP tool functions in the snapshot command.
- No direct reads of ScaffoldAI state files from the snapshot command, except what the MCP server already reads inside its tools.
- No execution of verify commands.
- No commits, staging, pushes, file edits, state mutation, or automatic closeout.
- No wiring into `verify:scaffoldai` yet.
- No production Consync product behavior exposure.

---

## 3. Proposed Command

Add:

```bash
npm run scaffoldai:mcp:snapshot
```

Recommended package script:

```json
{
  "scaffoldai:mcp:snapshot": "node src/mcp/snapshot.js"
}
```

Recommended source location:

```text
src/mcp/snapshot.js
```

This keeps the snapshot client near the MCP server while preserving the existing separation between CLI runtime commands and MCP process tooling.

---

## 4. Output Path

Write the snapshot JSON to:

```text
.scaffoldai/tmp/mcp-runtime-snapshot.json
```

This is the only permitted write for the command.

The command should also print the same JSON to stdout by default. This gives the operator both workflows:

- file output for upload, attachment, archival, or later comparison
- stdout output for immediate paste into ChatGPT

Recommended behavior:

```bash
npm run scaffoldai:mcp:snapshot
```

- Calls all 5 tools over local stdio MCP.
- Writes `.scaffoldai/tmp/mcp-runtime-snapshot.json`.
- Prints the exact same JSON to stdout.
- Exits `0` if at least one tool succeeded and the snapshot file was written.
- Exits non-zero only if the MCP client/server cannot start, no tools can be called, JSON cannot be written, or the command violates its own read-only guardrails.

---

## 5. JSON Schema Sketch

The bundle should be one pretty-printed JSON object with stable top-level key order.

```json
{
  "snapshot_version": "1.0.0",
  "execution_class": "READ_ONLY",
  "generated_at": "2026-05-06T00:00:00.000Z",
  "command": "npm run scaffoldai:mcp:snapshot",
  "client": {
    "name": "scaffoldai-mcp-snapshot",
    "transport": "stdio",
    "server_command": "node",
    "server_args": ["src/mcp/server.js"],
    "remote_access": false,
    "http": false
  },
  "output": {
    "path": ".scaffoldai/tmp/mcp-runtime-snapshot.json",
    "format": "json",
    "pretty_printed": true
  },
  "summary": {
    "tool_count": 5,
    "succeeded": 5,
    "failed": 0,
    "partial_success": false
  },
  "tools": {
    "scaffoldai_status": {
      "ok": true,
      "called_at": "2026-05-06T00:00:00.000Z",
      "result": {}
    },
    "scaffoldai_preflight": {
      "ok": true,
      "called_at": "2026-05-06T00:00:00.000Z",
      "result": {}
    },
    "scaffoldai_question": {
      "ok": true,
      "called_at": "2026-05-06T00:00:00.000Z",
      "result": {}
    },
    "scaffoldai_verify_recommend": {
      "ok": true,
      "called_at": "2026-05-06T00:00:00.000Z",
      "result": {}
    },
    "scaffoldai_closeout_readiness": {
      "ok": true,
      "called_at": "2026-05-06T00:00:00.000Z",
      "result": {}
    }
  }
}
```

Tool `result` values should contain the parsed JSON returned by the MCP tool, unchanged except for normal JSON serialization. Do not flatten, rename, or reinterpret the tool payloads in v1.

Recommended pretty-printing:

```js
JSON.stringify(snapshot, null, 2)
```

Rationale:

- Easier to paste into ChatGPT.
- Easier to diff during local debugging.
- Deterministic enough for human comparison.
- Avoids terminal-only formatting.

---

## 6. Client Metadata

Include lightweight metadata, but do not overfit it.

Recommended fields:

- `command`
- `client.name`
- `client.transport`
- `client.server_command`
- `client.server_args`
- `client.remote_access`
- `client.http`
- `output.path`
- `output.format`
- `output.pretty_printed`

Do not include:

- absolute repo path
- username or home directory
- environment variables
- process environment
- machine hostname
- dependency lockfile excerpts
- raw stack traces

This gives ChatGPT enough context to understand how the snapshot was produced without leaking local machine details.

---

## 7. Git Status Source

Use git status only as returned by MCP tool outputs.

The snapshot command should not independently run `git status`, read `.git`, or inspect changed files. Independent git reads would create a second observation source and could drift from the MCP surface being evaluated.

If `scaffoldai_status` or `scaffoldai_closeout_readiness` reports git information, preserve it inside that tool's `result`. The snapshot-level `summary` should report only MCP call success/failure counts.

---

## 8. Failure Behavior

Partial failure should be explicit and preserve every successful tool result.

Per-tool failure shape:

```json
{
  "ok": false,
  "called_at": "2026-05-06T00:00:00.000Z",
  "error": {
    "type": "TOOL_CALL_FAILED",
    "message": "Sanitized error message",
    "recoverable": true
  }
}
```

Recommended error types:

| Type | Meaning |
|---|---|
| `MCP_CONNECT_FAILED` | Client could not connect to `src/mcp/server.js` over stdio |
| `TOOL_CALL_FAILED` | MCP call failed or timed out |
| `TOOL_JSON_PARSE_FAILED` | Tool responded, but `content[0].text` was not valid JSON |
| `SNAPSHOT_WRITE_FAILED` | Tool calls completed, but snapshot file could not be written |
| `SNAPSHOT_GUARDRAIL_FAILED` | Command detected forbidden transport or output behavior |

Behavior matrix:

| Condition | Write file? | Print stdout? | Exit |
|---|:---:|:---:|:---:|
| All 5 tools succeed | Yes | Yes | `0` |
| 1-4 tools fail, at least 1 succeeds | Yes | Yes | `0` |
| All 5 tool calls fail after MCP connect | Yes, with errors | Yes | `1` |
| MCP connect fails before any tool call | No or error-only JSON if possible | Yes | `1` |
| Snapshot write fails | No | Yes | `1` |

`summary.partial_success` should be `true` when at least one tool succeeds and at least one fails.

Tool failures must not be hidden behind a single generic failure. The point of the snapshot is to preserve partial evidence.

---

## 9. Local Testing Flow

Manual local flow:

```bash
npm run test:mcp
npm run scaffoldai:mcp:snapshot
cat .scaffoldai/tmp/mcp-runtime-snapshot.json
```

Expected manual checks:

- Output file exists at `.scaffoldai/tmp/mcp-runtime-snapshot.json`.
- JSON parses cleanly.
- Top-level `execution_class` is `READ_ONLY`.
- `client.transport` is `stdio`.
- `client.remote_access` is `false`.
- `client.http` is `false`.
- All 5 expected tool keys exist.
- Each successful tool result includes `execution_class: "READ_ONLY"`.
- `scaffoldai_verify_recommend` reports recommendation only, not pass/fail evidence.
- `scaffoldai_closeout_readiness` reports `verify_evidence: "not provided"`.

Recommended implementation test:

```text
src/test/mcp-runtime-snapshot.js
```

Test assertions:

- Runs the snapshot command or imports a small snapshot client helper that still calls MCP over stdio.
- Confirms file creation under `.scaffoldai/tmp/`.
- Confirms no output path outside `.scaffoldai/tmp/`.
- Confirms snapshot JSON parses.
- Confirms top-level schema keys.
- Confirms exactly 5 tool entries.
- Confirms all tool calls use MCP transport, not direct tool function imports.
- Confirms no HTTP/ngrok/remote URL appears in metadata.
- Confirms partial-failure serialization with a mock or injectable client only if this can be done without weakening the stdio-path test.

Do not wire this test into `verify:scaffoldai` until after the runtime command has proven stable, unless implementation strongly recommends immediate coverage because the write behavior is easy to regress.

---

## 10. Verification Plan

Planning-phase verification:

```bash
npm run verify:scaffoldai
```

Implementation-phase verification:

```bash
npm run test:mcp
npm run scaffoldai:mcp:snapshot
node -e "JSON.parse(require('fs').readFileSync('.scaffoldai/tmp/mcp-runtime-snapshot.json', 'utf8')); console.log('snapshot json ok')"
npm run verify:scaffoldai
```

Optional follow-up after the command stabilizes:

- Add `src/test/mcp-runtime-snapshot.js`.
- Add `test:mcp:snapshot`.
- Consider including `test:mcp:snapshot` in `test:mcp`.
- Defer inclusion in `verify:scaffoldai` until the snapshot write behavior is accepted as part of normal ScaffoldAI verification.

Recommendation: treat the snapshot command as a Runtime Command first and a test target second. It writes an artifact, so it should not silently become part of the core VERIFY COMMAND until the team agrees that `.scaffoldai/tmp/mcp-runtime-snapshot.json` churn is acceptable.

---

## 11. Risks and Guardrails

### Risk: Snapshot bypasses MCP and imports tools directly

Guardrail: the snapshot command must create an MCP SDK `Client` with `StdioClientTransport` and call `client.callTool()` for each tool.

### Risk: Snapshot becomes a hidden write surface

Guardrail: the only allowed write path is `.scaffoldai/tmp/mcp-runtime-snapshot.json`. The command should create `.scaffoldai/tmp/` only if needed; no other directories or files.

### Risk: Remote exposure sneaks in later

Guardrail: no HTTP server, no SSE transport, no WebSocket, no ngrok, no inspector dependency, no remote MCP config.

### Risk: Snapshot output leaks local machine details

Guardrail: use relative paths in metadata and preserve existing MCP tool outputs. Do not add absolute paths, environment dumps, usernames, hostnames, or stack traces.

### Risk: Snapshot implies verification passed

Guardrail: snapshot-level `summary` reports MCP call success only. It must not use labels like `PASS`, `VERIFIED`, or `READY_FOR_REVIEW` for the whole repo.

### Risk: Partial failures are mistaken for clean state

Guardrail: include `summary.failed`, `summary.partial_success`, and per-tool `ok: false` error records. Do not omit failed tools from the bundle.

### Risk: Output is nondeterministic

Guardrail: preserve stable top-level key order, stable tool order, pretty-print with 2 spaces, and avoid adding variable local metadata beyond timestamps and tool outputs.

---

## 12. Recommended Snapshot Behavior

Recommended answers to the design questions:

| Question | Recommendation |
|---|---|
| Print JSON to stdout, write a file, or both? | Both. Write the file and print the exact same JSON to stdout. |
| Pretty-print? | Yes, 2-space JSON. |
| Include command/client metadata? | Yes, minimal non-sensitive metadata. |
| Include git status from MCP only or independently? | MCP only. Do not independently run git from the snapshot command. |
| Represent partial failures how? | Per-tool `ok: false` error objects plus snapshot summary counts. Preserve partial success. |
| Test, runtime command, or both? | Runtime command first. Add a dedicated test after acceptance; do not wire into verify yet. |

---

## 13. Recommended Next Step

Proceed to implementation next, with the following scope:

1. Add `src/mcp/snapshot.js`.
2. Add `npm run scaffoldai:mcp:snapshot`.
3. Use MCP SDK `Client` plus `StdioClientTransport` to call the existing 5 MCP tools.
4. Write only `.scaffoldai/tmp/mcp-runtime-snapshot.json`.
5. Print the same pretty JSON to stdout.
6. Manually verify with `npm run test:mcp`, `npm run scaffoldai:mcp:snapshot`, and `npm run verify:scaffoldai`.

Do not add write-capable MCP tools. Do not wire into `verify:scaffoldai` in the first implementation pass.
