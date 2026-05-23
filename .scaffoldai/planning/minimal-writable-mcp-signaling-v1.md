# Planning — minimal-writable-mcp-signaling-v1

Created: 2026-05-07
Status: IMPLEMENTED / VALIDATED

---

## 0. Implementation Note (2026-05-07)

This plan was implemented as the minimal v0 signal layer:

- MCP tool: `scaffoldai_signal`
- execution class: `LOCAL_SIGNAL_APPEND_ONLY`
- storage: `.scaffoldai/runtime/mcp/signals.jsonl`
- rotation: `.scaffoldai/runtime/mcp/signals.jsonl.1`
- transport: local stdio only
- authority: non-authoritative diagnostic signaling only

The implementation preserves the existing five read-only tools and does not add shell execution, arbitrary path writes, orchestration, verification authority, closeout authority, or commit/push/merge authority.

Validated with:

```text
npm run test:mcp
```

---

## 1. Purpose

Plan the smallest safe writable MCP capability for ScaffoldAI connection validation and presence awareness.

ScaffoldAI MCP v0 is read-only. This plan explores a narrow future addition: an append-only local signal surface where MCP-aware clients can leave tiny structured records such as "connected", "heartbeat", or "observed these tools". The surface is intentionally closer to a dry erase board than to state, memory, workflow, or authority.

The goal is to answer lightweight operational questions during local stdio testing:

- Did a client connect and successfully call the signaling tool?
- Which client claims to be present?
- What capability/tool visibility did the client observe?
- Has the client checked in recently?
- Did a client report disconnect, when detectable?

Signal records are diagnostics only. They are never authoritative ScaffoldAI state.

---

## 2. Non-Goals

- No implementation in this planning packet.
- No new MCP tools yet.
- No change to current MCP v0 behavior.
- No arbitrary file write access.
- No repo file edits through MCP.
- No writes to `.scaffoldai/state/` or `.scaffoldai/streams/`.
- No shell execution.
- No Runtime Command execution.
- No verification execution.
- No verification approval.
- No closeout approval.
- No commit, push, merge, branch, stage, or PR authority.
- No orchestration, routing execution, dispatch, or agent chaining.
- No remote transport, HTTP, SSE, WebSocket, browser transport, or ngrok.
- No durable memory model.
- No client-to-client command queue.
- No hidden authority upgrade from read-only observation to workflow control.

---

## 3. Proposed Tool Shape

Recommended writable surface name:

```text
scaffoldai_signal
```

Recommended classification:

```text
execution_class: LOCAL_SIGNAL_APPEND_ONLY
```

This is intentionally not `READ_ONLY`, but it is also not general `LOCAL_WRITE`. It permits exactly one append-only write to a designated runtime signal log under `.scaffoldai/tmp/`.

Proposed MCP tool:

```json
{
  "name": "scaffoldai_signal",
  "description": "Append one bounded local ScaffoldAI client signal for presence and connection testing. Does not modify authoritative state.",
  "input": {
    "client_id": "codex-local-<short-id>",
    "signal_type": "connected",
    "message": "optional short human-readable note",
    "capabilities": ["mcp_tools_visible"],
    "observed_tools": ["scaffoldai_status", "scaffoldai_signal"]
  }
}
```

Recommended response:

```json
{
  "tool": "scaffoldai_signal",
  "execution_class": "LOCAL_SIGNAL_APPEND_ONLY",
  "status": "RECORDED",
  "data": {
    "record_id": "<timestamp>-<short-random>",
    "signal_type": "connected",
    "stored_at": ".scaffoldai/runtime/mcp/signals.jsonl"
  },
  "authority": {
    "authoritative_state": false,
    "may_execute": false,
    "may_modify_repo": false,
    "may_approve_verification": false,
    "may_approve_closeout": false
  }
}
```

Failure responses should be explicit and non-authoritative:

```json
{
  "tool": "scaffoldai_signal",
  "execution_class": "LOCAL_SIGNAL_APPEND_ONLY",
  "status": "REJECTED",
  "error_code": "RATE_LIMITED",
  "message": "heartbeat is limited to one record per 60 seconds per client_id"
}
```

The tool should not return previous signal records by default. Inspection can happen through a separate human-readable local file read, a future read-only utility, or a Runtime Command planned separately.

---

## 4. Storage Location

Recommended storage path:

```text
.scaffoldai/runtime/mcp/signals.jsonl
```

Rationale:

- `.scaffoldai/tmp/` is already treated as generated, non-authoritative runtime space.
- Signals should not live in `.scaffoldai/state/` because they are not BRIDGE truth.
- Signals should not live in `.scaffoldai/streams/` because they are not execution stream records.
- Signals should not live in `/tmp` because ScaffoldAI docs already prefer repo-local generated artifacts.
- Signals should not live in source or docs paths because they are runtime scratch data.

Recommended companion metadata path, if needed later:

```text
.scaffoldai/tmp/mcp-signal-index.json
```

Do not add the companion index in the first implementation unless rate limiting cannot be done safely from the JSONL tail.

Signals should be ephemeral. They may be deleted, rotated, or regenerated without affecting ScaffoldAI state or closeout decisions.

---

## 5. Signal Schema

Recommended storage format: append-only JSONL, one record per line.

Required stored fields:

```json
{
  "schema_version": 1,
  "record_id": "2026-05-07T15:04:05.000Z-a1b2c3",
  "created_at": "2026-05-07T15:04:05.000Z",
  "client_id": "codex-local-a1b2",
  "signal_type": "connected",
  "message": "optional note",
  "capabilities": ["mcp_read_only", "signal_append_only"],
  "observed_tools": ["scaffoldai_status", "scaffoldai_signal"]
}
```

Required input fields:

| Field | Type | Rule |
|---|---|---|
| `client_id` | string | Required. Stable within a client session. 3-64 chars. |
| `signal_type` | string | Required. Must be one allowed value. |

Optional input fields:

| Field | Type | Rule |
|---|---|---|
| `message` | string | Optional. Max 250 chars. Human-readable only. |
| `capabilities` | array of strings | Optional. Max 10 entries. Each entry must be an allowed token. |
| `observed_tools` | array of strings | Optional. Max 20 entries. Tool-name tokens only. |

Server-created fields:

| Field | Type | Rule |
|---|---|---|
| `schema_version` | integer | Always `1` for this plan. |
| `record_id` | string | Timestamp plus short random suffix. |
| `created_at` | string | Server-side ISO 8601 timestamp. |

Validation rules:

- Reject unknown top-level input fields.
- Reject nested objects.
- Reject arrays containing non-strings.
- Reject empty strings after trimming.
- Reject control characters.
- Normalize whitespace in `message`.
- Do not accept client-provided `created_at`, `record_id`, `path`, `cwd`, `command`, or `authority` fields.
- Do not store raw MCP request or response payloads.

---

## 6. Allowed Signal Types

Recommended fixed signal types:

| Signal type | Purpose | Suggested minimum interval |
|---|---|---|
| `connected` | Client reports successful connection to the MCP surface. | Once per client session. |
| `heartbeat` | Client reports continued presence. | 60 seconds per `client_id`. |
| `capability_check` | Client reports which bounded capabilities it believes are available. | 60 seconds per `client_id`. |
| `tool_visibility` | Client reports which MCP tools it can see. | 60 seconds per `client_id`. |
| `disconnected` | Client reports graceful disconnect, when detectable. | Once per client session. |
| `note` | Short human-readable diagnostic note. | 60 seconds per `client_id`. |

Recommended capability tokens:

```text
mcp_read_only
signal_append_only
local_stdio
tool_list_visible
tool_call_visible
runtime_snapshot_visible
```

Recommended `observed_tools` rule:

- Accept only strings matching MCP tool-name format: `^[a-z][a-z0-9_]{2,63}$`.
- Store the client-observed names as claims, not truth.
- Do not infer missing tools from this field.
- Do not use this field to register, hide, add, remove, or authorize tools.

Unknown signal types must be rejected.

---

## 7. Limits and Abuse Prevention

Recommended v1 limits:

| Limit | Recommendation |
|---|---|
| Max record size | 1 KB after serialization. |
| Max `message` length | 250 chars. |
| Max `client_id` length | 64 chars. |
| Max `capabilities` entries | 10. |
| Max `observed_tools` entries | 20. |
| Max signal log size | 64 KB initially. |
| Max heartbeat frequency | Once per 60 seconds per `client_id`. |
| Max non-heartbeat frequency | Once per 10 seconds per `client_id`. |
| Max rejected response detail | One concise error code and message. |

Recommended client ID rules:

- Pattern: `^[a-zA-Z0-9._:-]{3,64}$`.
- No path separators.
- No whitespace.
- No secrets or account identifiers required.

Recommended write behavior:

- Append exactly one JSONL line per accepted signal.
- Use exclusive append where practical.
- On malformed existing JSONL lines, keep the file appendable and report a warning only if inspection tooling is added later.
- If `.scaffoldai/tmp/` does not exist, implementation may create only that directory.
- Do not create any other directory.
- Do not follow symlinks outside the repo.
- Resolve and assert the final write path remains under `.scaffoldai/tmp/`.

Recommended rotation behavior:

- If the signal log exceeds 64 KB before appending, rotate it to `.scaffoldai/runtime/mcp/signals.jsonl.1`.
- Keep at most one rotated file in v1.
- If rotation fails, reject the signal with `LOG_LIMIT_REACHED`; do not truncate the active file silently.
- Do not rotate into `.scaffoldai/state/`, `.scaffoldai/streams/`, source, docs, or system temp paths.

Rate limiting approach:

- Prefer reconstructing last-seen timestamps by reading only the tail of `.scaffoldai/runtime/mcp/signals.jsonl`.
- If a small index becomes necessary, store it only at `.scaffoldai/tmp/mcp-signal-index.json`.
- The index is cache only and must be reconstructable from JSONL.

---

## 8. Authority Boundaries

Signal records are not ScaffoldAI truth.

Authoritative surfaces remain:

- `.scaffoldai/state/`
- `.scaffoldai/streams/`
- human-approved workflow decisions
- explicit verification evidence from the proper Verify workflow

The signal surface must never authorize or imply:

- verification passed
- closeout is approved
- work is ready for review
- a packet is mounted, completed, superseded, or closed
- a client may run shell commands
- a client may edit repo files
- a client may route, dispatch, or orchestrate work
- a client may commit, push, merge, create branches, stage files, or open PRs
- a client may modify `.scaffoldai/state/` or `.scaffoldai/streams/`

Any future implementation must include tests that assert:

- `server.js` exposes only the planned new signal tool in addition to existing tools.
- The signal tool writes only `.scaffoldai/runtime/mcp/signals.jsonl` and optional rotation/index files under `.scaffoldai/runtime/mcp/`.
- The signal tool does not import or invoke Runtime Commands.
- The signal tool does not spawn shell commands.
- The signal tool does not write or append outside `.scaffoldai/tmp/`.
- The signal response does not include `READY_FOR_REVIEW`, `verify_passed`, `verified`, `approved`, or similar authority language.

Recommended client-facing statement:

```text
This signal was recorded as local MCP presence metadata only. It does not modify ScaffoldAI state, approve verification, approve closeout, or grant execution authority.
```

---

## 9. Router Relationship

The Tool Router remains recommend-only.

The router may recommend `scaffoldai_signal` only for connection validation or presence diagnostics, for example:

- "Confirm this MCP client can write a bounded local signal."
- "Record that this client sees the five read-only tools."
- "Leave a heartbeat during manual MCP testing."

The router must not:

- call `scaffoldai_signal` automatically as a side effect of routing
- treat signals as routing facts
- dispatch work based on signal records
- infer capability authority from `capabilities`
- infer tool truth from `observed_tools`
- route from a signal into verification, closeout, commit, or execution

Recommended router target name, if needed later:

```text
MCP_SIGNAL_APPEND_ONLY
```

Recommended router posture:

| Request shape | Router recommendation |
|---|---|
| "Can this MCP client write a tiny presence signal?" | `MCP_SIGNAL_APPEND_ONLY`, human-visible diagnostic only |
| "Which tools does this client see?" | `MCP_READ_ONLY` for actual tool list, optional `MCP_SIGNAL_APPEND_ONLY` for client-reported visibility |
| "Use the signal log to decide who should act" | `HUMAN_MANUAL` stop condition |
| "Use signal records as closeout evidence" | `HUMAN_MANUAL` stop condition |

If future router work references this signal layer, it should label it as diagnostic presence metadata, not process authority.

---

## 10. Presence/Check-In Relationship

The signal layer can become the substrate for future presence/check-in utilities, but only as local runtime diagnostics.

Potential future read-only utilities:

- `scaffoldai_signal_status` Runtime Command to print recent clients and last heartbeat.
- `scaffoldai_signal_inspect` Runtime Command to summarize recent JSONL records for a human.
- A read-only MCP tool that summarizes recent signal records without exposing raw payloads.

Future presence/check-in utility rules:

- Presence means "a client recently appended a valid signal", not "a client is alive" or "a client is authorized".
- Heartbeats are best-effort and may be missing during crashes, reloads, or client disconnects.
- `disconnected` is advisory only because many clients cannot reliably emit graceful shutdown.
- Capability declarations are claims from clients, not verified permissions.
- Tool visibility claims are diagnostics, not source-of-truth tool registration.
- Presence data must remain under `.scaffoldai/tmp/`.
- Cleanup must be safe even if the signal log is deleted while a client is connected.

Recommended human-readable status fields for a future inspector:

```json
{
  "client_id": "codex-local-a1b2",
  "last_signal_type": "heartbeat",
  "last_seen_at": "2026-05-07T15:04:05.000Z",
  "recent_capabilities": ["mcp_read_only", "signal_append_only"],
  "recent_observed_tools": ["scaffoldai_status", "scaffoldai_signal"],
  "presence_status": "RECENT"
}
```

`presence_status` must not be used for workflow gating.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Writable MCP surface is mistaken for general repo write authority. | Use a distinct execution class, explicit authority fields, and tests that enforce `.scaffoldai/tmp/` only. |
| Signal records are treated as authoritative state. | Document that records are diagnostics only and never write to `.scaffoldai/state/` or `.scaffoldai/streams/`. |
| Clients spam heartbeats or notes. | Enforce per-client rate limits, max record size, and max log size. |
| Payloads become covert arbitrary storage. | Reject nested objects, unknown fields, large strings, and arbitrary payload fields. |
| Tool visibility claims are mistaken for actual tool registry state. | Label `observed_tools` as client claims only; use MCP `tools/list` for actual discovery. |
| Sensitive data is written to the signal log. | Keep schema tiny, cap message length, reject freeform payload objects, and warn clients not to include secrets. |
| Log rotation deletes useful debugging data. | Keep one rotated file and state that signals are ephemeral diagnostics. |
| Symlink/path issues escape `.scaffoldai/tmp/`. | Resolve real paths and reject writes outside the intended repo-local tmp directory. |
| Future router or presence tools use signals to trigger work. | Require separate planning and tests before any router or presence integration. |
| Human authority boundary becomes blurry. | Every response should state no execution, verification, closeout, or commit authority. |

---

## 12. Recommended Implementation Packet

Implementation completed in the follow-up packet. The original recommended packet is preserved below as historical acceptance criteria.

The accepted implementation packet was:

1. Add contract update for `LOCAL_SIGNAL_APPEND_ONLY` and `scaffoldai_signal`.
2. Add tests before implementation:
   - tool appears in `tools/list`
   - existing five read-only tools remain unchanged
  - accepted signal appends one JSONL line under `.scaffoldai/runtime/mcp/signals.jsonl`
   - unknown signal types are rejected
   - unknown fields are rejected
   - oversized message and oversized record are rejected
   - heartbeat rate limit is enforced per `client_id`
   - writes outside `.scaffoldai/tmp/` are impossible
   - no shell execution is present
   - no `.scaffoldai/state/` or `.scaffoldai/streams/` writes are present
3. Add a small signal validator module near MCP code.
4. Add `scaffoldai_signal` to the MCP server with append-only behavior.
5. Add concise stderr logs:
   - `[MCP] signal recorded: <signal_type> <client_id>`
   - `[MCP] signal rejected: <error_code> <client_id>`
6. Run:
   - `npm run test:mcp`
   - `npm run verify:scaffoldai`
7. Do not add router integration in the first implementation.
8. Do not add presence/check-in utilities in the first implementation.

Recommended writable surface:

```text
scaffoldai_signal
```

Recommended storage:

```text
.scaffoldai/runtime/mcp/signals.jsonl
```

Recommended limits:

- fixed allowed signal types only
- max serialized record size: 1 KB
- max message length: 250 chars
- max signal log size: 64 KB
- heartbeat limit: once per 60 seconds per `client_id`
- non-heartbeat limit: once per 10 seconds per `client_id`
- reject unknown signal types
- reject unknown fields
- reject nested/freeform payload objects
- rotate at 64 KB with one `.1.jsonl` backup

Current status for this document:

```text
IMPLEMENTED / VALIDATED - append-only signaling only, not general write authority.
```
