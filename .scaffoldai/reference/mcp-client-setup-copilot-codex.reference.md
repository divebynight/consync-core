# ScaffoldAI MCP Client Setup for Copilot and Codex

Updated: 2026-05-07
Status: CURRENT / EXPERIMENTAL REFERENCE

---

## 1. Purpose

This guide explains how Copilot and Codex should connect to and use the ScaffoldAI MCP v0 surface.

It is a setup and usage reference only. It does not add repo-local MCP client config, new MCP tools, write-capable behavior, orchestration, shell execution, autonomous workflow, or remote transport.

Use this guide when configuring an MCP-aware client by hand in user-local settings.

---

## 2. Current MCP Posture

ScaffoldAI MCP v0 is:

- local stdio only
- read-only
- observe/recommend only
- `execution_class: READ_ONLY`
- backed by existing Runtime Command semantics
- human-authoritative

Supported server command:

```text
npm run scaffoldai:mcp
```

Underlying server entrypoint:

```text
node src/mcp/server.js
```

Unsupported transports:

- HTTP
- SSE
- WebSocket
- ngrok
- browser transport
- remote access

---

## 3. Shared Client Model

Copilot and Codex should use the same local ScaffoldAI MCP server and receive the same five read-only tools.

Differences belong in client behavior and human workflow, not in MCP server capability.

### Copilot

Copilot should treat ScaffoldAI MCP as editor-adjacent process context.

Copilot may use MCP to:

- orient to current ScaffoldAI state before suggesting edits
- summarize STATUS, active stream, VERIFY COMMAND, TARGET, and NEXT SAFE ACTION
- notice preflight blockers or structural questions
- recommend that the human run a Runtime Command

Copilot must not treat MCP output as permission to edit, verify, close out, stage, commit, push, or dispatch workflow steps.

### Codex

Codex should treat ScaffoldAI MCP as structured process context, not as an execution channel.

Codex may use MCP to:

- re-anchor a coding session
- understand current runtime state
- explain verify and closeout recommendations
- compare MCP observations with Runtime Command output

Codex may run shell commands only through its normal human-authorized workspace execution path. MCP itself must remain read-only.

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

The current MCP server exposes exactly these five read-only tools:

| Tool | Purpose | Authority |
|---|---|---|
| `scaffoldai_status` | Observe current runtime state, active stream, git summary, VERIFY COMMAND, and NEXT SAFE ACTION. | Read-only observation |
| `scaffoldai_preflight` | Observe blockers, warnings, and readiness checks before work proceeds. | Read-only observation |
| `scaffoldai_question` | Observe open structural questions or ambiguity. | Read-only observation |
| `scaffoldai_verify_recommend` | Recommend VERIFY COMMAND and TARGET. | Read-only recommendation |
| `scaffoldai_closeout_readiness` | Observe closeout readiness. | Read-only recommendation |

No write-capable MCP tools are supported in v0.

---

## 5. Copilot Setup Notes

Use documented/user-local setup only.

Do not add repo-local Copilot MCP config yet.

When configuring Copilot manually, use:

- transport: local stdio
- working directory: repo root
- command: `npm`
- args: `run scaffoldai:mcp`

Equivalent server entrypoint:

```text
node src/mcp/server.js
```

Before relying on the setup, confirm that Copilot can see only the five read-only ScaffoldAI tools listed in this guide.

Copilot responses should cite tool observations and ask the human before any non-read-only action.

---

## 6. Codex Setup Notes

Use documented/user-local setup only.

Do not add repo-local Codex MCP config yet.

When configuring Codex manually, use:

- transport: local stdio
- working directory: repo root
- command: `npm`
- args: `run scaffoldai:mcp`

Equivalent server entrypoint:

```text
node src/mcp/server.js
```

Codex may use MCP observations for orientation and recommendations. It should use Runtime Commands only through the normal human-authorized workspace execution path, not through MCP.

Before relying on the setup, confirm that Codex can see only the five read-only ScaffoldAI tools listed in this guide.

---

## 7. Allowed Usage Examples

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

Allowed client behavior:

- call the five MCP tools over local stdio
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

## 8. Prohibited Usage

Copilot and Codex must not use ScaffoldAI MCP to:

- write files
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

## 9. Runtime Commands vs MCP

Runtime Commands are the human-visible local command layer. MCP tools are the structured read-only observation layer for MCP-aware clients.

| Surface | Role | Authority |
|---|---|---|
| Runtime Commands | Local command output and human-controlled execution | Operational command layer |
| MCP tools | Structured observation and recommendation | Read-only client context |
| MCP snapshot JSON | Generated paste/upload bundle of MCP observations | Ephemeral read-only artifact |

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

---

## 10. Human Authority Rules

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

## 11. Troubleshooting / Validation

Validate the current read-only MCP implementation with:

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
- confirm the server command is `npm run scaffoldai:mcp` or `node src/mcp/server.js`
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

## 12. Links to Deeper Docs

- [Current runtime state reference](current-runtime-state.reference.md)
- [MCP client interaction contract](../contracts/scaffoldai-mcp-client-interaction-v0.contract.md)
- [Copilot/Codex MCP interaction plan](../planning/mcp-client-interaction-copilot-codex-v1.md)
- [MCP read-only v0 plan](../planning/scaffoldai-mcp-readonly-v0.md)
- [MCP runtime snapshot plan](../planning/scaffoldai-mcp-runtime-snapshot-v1.md)
- [ScaffoldAI README](../README.md)
- [Runbook](../process/runbook.process.md)
- [AI context process](../process/ai-context.process.md)
