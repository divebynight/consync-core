# ScaffoldAI MCP Client Setup for Copilot and Codex

Updated: 2026-05-08
Status: CURRENT / EXPERIMENTAL REFERENCE

---

## 1. Purpose

This guide explains how Copilot and Codex should connect to and use the ScaffoldAI MCP v0 surface.

It is a setup and usage reference only. It does not add repo-local MCP client config, broader write-capable behavior, orchestration, shell execution, autonomous workflow, or remote transport.

Use this guide when configuring an MCP-aware client by hand in user-local settings.

---

## 2. Current MCP Posture

ScaffoldAI MCP v0 is:

- local stdio only
- five read-only observe/recommend tools
- one append-only local signal tool
- diagnostic shared-memory POC tools
- `execution_class: READ_ONLY` for observation tools
- `execution_class: LOCAL_SIGNAL_APPEND_ONLY` for `scaffoldai_signal`
- backed by existing Runtime Command semantics
- human-authoritative

Supported server command for stdio MCP clients:

```text
node src/scaffoldai/mcp/server.js
```

Client configuration shape:

```text
command: node
args: ["src/scaffoldai/mcp/server.js"]
```

Do not launch stdio MCP clients through npm wrappers. stdio MCP clients require protocol-clean stdout: stdout must contain only MCP protocol messages, while human-readable logs, diagnostics, warnings, and startup notes belong on stderr. npm lifecycle output can contaminate stdout and break or degrade client parsing.

Direct Node execution is the recommended and verified approach for both Codex and Copilot. Codex proved stricter about stdout contamination. Copilot tolerated malformed startup output but produced parse warnings. Both clients successfully connected after switching to direct Node execution.

Unsupported transports:

- HTTP
- SSE
- WebSocket
- ngrok
- browser transport
- remote access

---

## 3. Shared Client Model

Copilot and Codex should use the same local ScaffoldAI MCP server and receive the same bounded tool surface: five read-only tools, `scaffoldai_signal`, and the diagnostic shared-memory POC tools.

Differences belong in client behavior and human workflow, not in MCP server capability.

### Copilot

Copilot should treat ScaffoldAI MCP as editor-adjacent process context.

Copilot may use MCP to:

- orient to current ScaffoldAI state before suggesting edits
- summarize STATUS, active stream, VERIFY COMMAND, TARGET, and NEXT SAFE ACTION
- notice preflight blockers or structural questions
- append a bounded `scaffoldai_signal` record for local connection or capability visibility diagnostics
- recommend that the human run a Runtime Command

Copilot must not treat MCP output or signal records as permission to edit, verify, close out, stage, commit, push, or dispatch workflow steps.

### Codex

Codex should treat ScaffoldAI MCP as structured process context, not as an execution channel.

Codex may use MCP to:

- re-anchor a coding session
- understand current runtime state
- explain verify and closeout recommendations
- compare MCP observations with Runtime Command output
- append a bounded `scaffoldai_signal` record for local connection or capability visibility diagnostics

Codex may run shell commands only through its normal human-authorized workspace execution path. MCP itself must not become an execution channel; `scaffoldai_signal` is only append-only diagnostic signaling under `.scaffoldai/tmp/`.

### Human

The human remains final authority for:

- choosing work
- resolving ambiguity
- approving edits
- running or accepting verification evidence
- approving closeout
- staging, committing, pushing, branching, and opening PRs
- deciding whether MCP observations are stale or sufficient

---

## 4. Expected Tools

The current MCP server exposes five read-only tools, one append-only signal tool, and diagnostic shared-memory POC tools.

| Tool | Purpose | Authority |
|---|---|---|
| `scaffoldai_status` | Observe current runtime state, active stream, git summary, VERIFY COMMAND, and NEXT SAFE ACTION. | Read-only observation |
| `scaffoldai_preflight` | Observe blockers, warnings, and readiness checks before work proceeds. | Read-only observation |
| `scaffoldai_question` | Observe open structural questions or ambiguity. | Read-only observation |
| `scaffoldai_verify_recommend` | Recommend VERIFY COMMAND and TARGET. | Read-only recommendation |
| `scaffoldai_closeout_readiness` | Observe closeout readiness. | Read-only recommendation |
| `scaffoldai_signal` | Append a bounded local signal for connection, heartbeat, capability check, tool visibility, disconnect, or note diagnostics. | Non-authoritative append-only signal |
| `scaffoldai_memory_write` | Append a bounded shared-memory diagnostic message. | Diagnostic POC only |
| `scaffoldai_memory_read` | Read bounded shared-memory diagnostic messages. | Diagnostic POC only |

No general write-capable MCP tools are supported in v0. `scaffoldai_signal` writes only `.scaffoldai/runtime/mcp/signals.jsonl`, which is append-only, local, safe to delete, and not ScaffoldAI runtime truth.

`scaffoldai_memory_write` and `scaffoldai_memory_read` are diagnostic-only, append-only where writing, non-authoritative, manually invoked, and isolated from production workflow state. Shared-memory messages are data only, not executable intent.

---

## 5. Process Profile Configuration

ScaffoldAI process profiles control interaction mode (PASSIVE, STRICT, BYPASS) and execution mode (LIVE, DRY_RUN). Profiles are selected at process startup via the `SCAFFOLDAI_PROCESS_PROFILE` environment variable and cannot be changed at runtime.

See `.scaffoldai/contracts/process-profile.contract.md` for the full profile contract.

### Profile Selection for MCP Clients

**Important:** Terminal environment variables do not affect MCP server processes launched by Copilot, Codex, or other MCP clients. Client-managed MCP servers need environment variables configured in the client's MCP configuration file.

For VS Code/Copilot, add the `env` block to `.vscode/mcp.json`:

```json
{
  "servers": {
    "scaffoldai": {
      "type": "stdio",
      "command": "node",
      "args": ["src/scaffoldai/mcp/server.js"],
      "cwd": "/path/to/consync-core",
      "env": {
        "SCAFFOLDAI_PROCESS_PROFILE": "DEFAULT_DEV"
      }
    }
  }
}
```

### Available Profiles

**DEFAULT_DEV** (recommended for normal use)
- Interaction mode: PASSIVE — AI pauses before mutations and asks
- Execution mode: LIVE — Real changes allowed
- Use case: Standard local development work

Example config:
```json
"env": {
  "SCAFFOLDAI_PROCESS_PROFILE": "DEFAULT_DEV"
}
```

**PROCESS_TEST** (dry-run process testing only)
- Interaction mode: STRICT — Must route through ScaffoldAI process
- Execution mode: DRY_RUN — No real changes, responses use "would" language
- Use case: Testing A-to-Z process flows without side effects

Example config:
```json
"env": {
  "SCAFFOLDAI_PROCESS_PROFILE": "PROCESS_TEST"
}
```

**Warning:** Only use PROCESS_TEST when explicitly testing the process loop in dry-run mode. Do not use PROCESS_TEST for normal development work.

**FULL_GOVERNED** (strict governance with real changes)
- Interaction mode: STRICT — Must route through ScaffoldAI process
- Execution mode: LIVE — Real changes allowed through process
- Use case: Critical work requiring enforced process discipline

**DIRECT_WORK** (bypass governance)
- Interaction mode: BYPASS — ScaffoldAI governance bypassed
- Execution mode: LIVE — Real changes allowed directly
- Use case: Quick fixes where process overhead not justified

### Profile Observation via MCP

All ScaffoldAI MCP tools report the active profile in their responses:

```json
{
  "tool": "scaffoldai_status",
  "execution_class": "READ_ONLY",
  "profile": "DEFAULT_DEV",
  "interaction_mode": "PASSIVE",
  "execution_mode": "LIVE",
  ...
}
```

MCP clients may observe the profile but must not change it. Profile switching requires restarting the MCP server process with a different environment variable value.

### No Runtime Profile Switching

There is no `set_mode` or `set_profile` MCP tool. Profiles are startup configuration only, not runtime switches. This is intentional — profile changes should be deliberate configuration decisions, not runtime behavior changes.

To change profiles:
1. Update the `env` block in the MCP client configuration
2. Restart the MCP server process (disconnect and reconnect in Copilot/Codex)

---

## 6. Copilot Setup Notes

Use documented/user-local setup only.

Do not add repo-local Copilot MCP config yet.

When configuring Copilot manually, use:

- transport: local stdio
- working directory: repo root
- command: `node`
- args: `["src/scaffoldai/mcp/server.js"]`
- env: `{"SCAFFOLDAI_PROCESS_PROFILE": "DEFAULT_DEV"}`

Before relying on the setup, confirm that Copilot can see the eight ScaffoldAI tools listed in this guide.

Copilot responses should cite tool observations and ask the human before any action beyond read-only observation or bounded signal append.

---

## 7. Codex Setup Notes

Use documented/user-local setup only.

Do not add repo-local Codex MCP config yet.

When configuring Codex manually, use:

- transport: local stdio
- working directory: repo root
- command: `node`
- args: `["src/scaffoldai/mcp/server.js"]`
- env: `{"SCAFFOLDAI_PROCESS_PROFILE": "DEFAULT_DEV"}`

Codex may use MCP observations for orientation and recommendations. It should use Runtime Commands only through the normal human-authorized workspace execution path, not through MCP.

Before relying on the setup, confirm that Codex can see the eight ScaffoldAI tools listed in this guide.

---

## 8. Allowed Usage Examples

Allowed client requests:

```text
Ask ScaffoldAI for current status.
```

```text
Use ScaffoldAI MCP to check whether there are open structural questions.
```

```text
Summarize the recommended VERIFY COMMAND and TARGET.
```

```text
Compare status, preflight, question, verify recommendation, and closeout readiness.
```

```text
Use the MCP runtime snapshot JSON for reentry context.
```

```text
Append a ScaffoldAI signal that this client can see the MCP tools.
```

Allowed client behavior:

- call the five read-only MCP tools over local stdio
- call `scaffoldai_signal` only for bounded local presence/capability diagnostics
- summarize observations for the human
- cite STATUS, VERIFY COMMAND, TARGET, NEXT SAFE ACTION, and `execution_class`
- report stale, partial, missing, or conflicting observations
- recommend a human-controlled Runtime Command
- ask the human before execution, edits, closeout, or git operations

Recommended default observation sequence:

1. `scaffoldai_status`
2. `scaffoldai_preflight`
3. `scaffoldai_question`
4. `scaffoldai_verify_recommend`
5. `scaffoldai_closeout_readiness`

---

## 9. Prohibited Usage

Copilot and Codex must not use ScaffoldAI MCP to:

- write files other than the bounded `scaffoldai_signal` append to `.scaffoldai/runtime/mcp/signals.jsonl`
- edit code
- mutate `.scaffoldai/state/` or `.scaffoldai/streams/`
- run shell commands
- run VERIFY COMMAND
- approve closeout
- stage, commit, push, branch, merge, or open PRs
- orchestrate workflow steps
- auto-dispatch agents
- perform autonomous execution
- expose the server over HTTP, SSE, WebSocket, ngrok, browser transport, or remote access
- treat signal records as authoritative state, verification evidence, closeout approval, or permission to act

Prohibited claims:

```text
MCP verified the work.
```

```text
MCP approved closeout.
```

```text
MCP gave permission to commit.
```

```text
The client can run the ScaffoldAI workflow through MCP.
```

---

## 10. Runtime Commands vs MCP

Runtime Commands are the human-visible local command layer. MCP tools are the structured observation and bounded signal layer for MCP-aware clients.

| Surface | Role | Authority |
|---|---|---|
| Runtime Commands | Local command output and human-controlled execution | Operational command layer |
| MCP tools | Structured observation, recommendation, and bounded local signaling | Read-only client context plus non-authoritative signal append |
| MCP snapshot JSON | Generated paste/upload bundle of MCP observations | Ephemeral read-only artifact |
| MCP signal JSONL | Local presence/capability signal log | Ephemeral non-authoritative diagnostic artifact |

MCP may recommend a Runtime Command. It must not replace Runtime Commands as verification evidence or closeout authority.

Useful Runtime Commands:

| Command | Use |
|---|---|
| `npm run scaffoldai:status` | Human-visible status check. |
| `npm run scaffoldai:preflight` | Human-visible readiness check. |
| `npm run scaffoldai:question` | Human-visible structural question check. |
| `npm run scaffoldai:verify` | Recommend or run the selected VERIFY COMMAND, depending on flags and human intent. |
| `npm run scaffoldai:closeout` | Human-visible closeout readiness summary. |
| `npm run scaffoldai:mcp:snapshot` | Generate `.scaffoldai/tmp/mcp-runtime-snapshot.json` from all five MCP tools. |

`scaffoldai_signal` is an MCP tool, not a Runtime Command. It appends only to `.scaffoldai/runtime/mcp/signals.jsonl`.

---

## 11. Human Authority Rules

MCP observations are evidence and recommendations. They are not approval.

The human must approve:

- starting or changing work scope
- resolving unclear boundaries
- running verification
- accepting verification evidence
- closing out work
- staging, committing, pushing, branching, merging, or opening PRs
- changing client setup from local stdio
- adding repo-local config
- adding any new MCP tool or authority

If MCP output conflicts with user claims, docs, Runtime Commands, or observed repo state, the client should stop, summarize the conflict, and ask the human how to proceed.

---

## 12. Troubleshooting / Validation

Validate the current MCP implementation with:

```text
npm run test:mcp
```

Validate the broader ScaffoldAI surface with:

```text
npm run verify:scaffoldai
```

Generate a pasteable MCP observation bundle with:

```text
npm run scaffoldai:mcp:snapshot
```

Expected snapshot path:

```text
.scaffoldai/tmp/mcp-runtime-snapshot.json
```

When a client cannot connect:

- confirm it is using local stdio
- confirm its working directory is the repo root
- confirm the server command is `node src/scaffoldai/mcp/server.js`
- confirm stdout contains only MCP protocol messages and human-readable logs go to stderr
- confirm it is not using HTTP, SSE, WebSocket, ngrok, browser transport, or remote access
- run `npm run test:mcp`
- use `npm run scaffoldai:mcp:snapshot` as a fallback context bundle

When observations appear stale:

- call `scaffoldai_status` again
- regenerate `.scaffoldai/tmp/mcp-runtime-snapshot.json`
- rerun the relevant Runtime Command
- ask the human whether files, branch, verification, or work scope changed

Temp, log, and generated runtime artifacts must stay under:

```text
.scaffoldai/tmp/
```

---

## 13. Links to Deeper Docs

- [Current runtime state reference](current-runtime-state.reference.md)
- [MCP client interaction contract](../contracts/scaffoldai-mcp-client-interaction-v0.contract.md)
- [Copilot/Codex MCP interaction plan](../planning/mcp-client-interaction-copilot-codex-v1.md)
- [MCP read-only v0 plan](../planning/scaffoldai-mcp-readonly-v0.md)
- [MCP runtime snapshot plan](../planning/scaffoldai-mcp-runtime-snapshot-v1.md)
- [ScaffoldAI README](../README.md)
- [Runbook](../process/runbook.process.md)
- [AI context process](../process/ai-context.process.md)
