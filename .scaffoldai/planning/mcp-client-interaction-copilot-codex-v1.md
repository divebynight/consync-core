# Planning — mcp-client-interaction-copilot-codex-v1

Created: 2026-05-07
Status: PLAN

---

## 1. Purpose

Plan how Copilot and Codex should interact with the ScaffoldAI MCP v0 surface safely and consistently.

This plan is intentionally near-term. It does not add MCP tools, client configuration, write authority, orchestration, autonomous behavior, shell execution, or remote transport. It defines a practical client interaction model for the current read-only phase.

---

## 2. Current MCP Posture

ScaffoldAI MCP v0 is:

- local stdio only
- read-only
- observe/recommend only
- `execution_class: READ_ONLY`
- backed by existing Runtime Command semantics
- human-authoritative

The current MCP tool surface is:

| Tool | Current role |
|---|---|
| `scaffoldai_status` | Observe current runtime state, active stream, git summary, VERIFY COMMAND, and NEXT SAFE ACTION. |
| `scaffoldai_preflight` | Observe blockers, warnings, and readiness checks before work proceeds. |
| `scaffoldai_question` | Observe open structural questions or ambiguity. |
| `scaffoldai_verify_recommend` | Recommend VERIFY COMMAND and TARGET; does not run verification. |
| `scaffoldai_closeout_readiness` | Observe closeout readiness; does not approve closeout or provide verify evidence. |

MCP v0 must not use HTTP, SSE, WebSocket, ngrok, browser transport, or remote exposure.

---

## 3. Client Roles

### Copilot

Copilot should treat ScaffoldAI MCP as an orientation and recommendation surface inside the editor.

Copilot may use MCP observations to:

- understand current ScaffoldAI process state before suggesting edits
- summarize active stream, STATUS, VERIFY COMMAND, TARGET, and NEXT SAFE ACTION
- detect whether structural questions or preflight blockers exist
- recommend that the human run a Runtime Command

Copilot must not treat MCP as permission to edit, verify, close out, stage, commit, push, or dispatch workflow steps.

### Codex

Codex should treat ScaffoldAI MCP as structured process context, not as its execution channel.

Codex may use MCP observations to:

- re-anchor a coding session
- decide which Runtime Command to recommend next
- explain verification and closeout readiness
- compare MCP observations with local Runtime Command output

Codex may run shell commands only through its normal human-authorized workspace execution path, not through MCP. MCP observations do not grant permission to run VERIFY COMMAND, closeout, git operations, or file edits.

### Human

The human remains final authority for:

- choosing work
- resolving ambiguity
- approving edits
- running or accepting verification evidence
- approving closeout
- staging, committing, pushing, branching, and opening PRs
- deciding whether client observations are stale or sufficient

---

## 4. Shared vs Separate MCP Surface

Recommended model: Copilot and Codex should use the same ScaffoldAI MCP server and receive the same read-only five-tool surface.

Reasons:

- one server contract is easier to validate and explain
- one tool surface prevents client-specific authority drift
- both clients need the same runtime facts
- differences belong in client behavior and documentation, not in server capability

Do not create Copilot-only or Codex-only MCP tools in v0.

Do not give one client write-capable behavior while the other remains read-only.

---

## 5. Configuration Strategy

Near-term recommendation: use documented setup and user-local client configuration only.

Do not commit repo-local MCP client configuration yet.

Preferred order:

1. Document the local stdio server command and expected read-only behavior.
2. Let humans configure Copilot or Codex in their user-local client settings.
3. Validate each client manually against the MCP client interaction contract.
4. Consider repo-local config only after client config formats are stable and the repo has an explicit config contract.

Repo-local docs may describe setup. Repo-local config should remain deferred because it can imply automatic enablement, client support guarantees, or authority that ScaffoldAI v0 does not grant.

Any future config must preserve:

- local stdio only
- no remote transport
- no write-capable MCP tools
- no shell execution through MCP
- human approval boundaries

---

## 6. Allowed Interactions

Both Copilot and Codex may:

- call all five MCP v0 tools over local stdio
- follow the default observation sequence from the MCP client interaction contract
- summarize MCP observations for the human
- cite `execution_class`, STATUS, VERIFY COMMAND, TARGET, NEXT SAFE ACTION, warnings, blockers, and open questions
- recommend a human-run Runtime Command
- report partial MCP failures without hiding successful tool results
- ask the human to rerun MCP observations when state may be stale
- consume `.scaffoldai/tmp/mcp-runtime-snapshot.json` as a generated observation bundle when interactive MCP is unavailable

Minimum recommendation sequence:

1. Call `scaffoldai_status`.
2. Call `scaffoldai_question`.
3. If advising whether work can begin or continue, call `scaffoldai_preflight`.
4. If naming verification, call `scaffoldai_verify_recommend`.
5. If discussing closeout, call `scaffoldai_closeout_readiness`.

Copilot should bias toward concise editor assistance and human prompts.

Codex should bias toward explicit command/report boundaries: MCP observes, Runtime Commands execute when the human asks.

---

## 7. Prohibited Interactions

Copilot and Codex must not:

- add MCP tools
- request or expose write-capable MCP behavior
- execute shell commands through MCP
- treat MCP as an orchestrator, dispatcher, or autonomous workflow runner
- automatically run Runtime Commands from MCP recommendations
- automatically run VERIFY COMMAND
- treat `scaffoldai_verify_recommend` as verification evidence
- treat `scaffoldai_closeout_readiness` as closeout approval
- infer human approval from any MCP response
- modify `.scaffoldai/state/` or `.scaffoldai/streams/` from MCP output
- use HTTP, SSE, WebSocket, ngrok, browser transport, or remote MCP access
- hide stale, partial, conflicting, or missing MCP observations
- allow one client to rely on another client's old observations without freshness checks

Explicitly prohibited claims:

```text
MCP verified the work.
```

```text
MCP approved closeout.
```

```text
Copilot can run the ScaffoldAI workflow through MCP.
```

```text
Codex can commit because MCP reported no open questions.
```

---

## 8. Runtime Commands vs MCP

Runtime Commands are the human-visible local command layer. MCP tools are the structured read-only observation layer for MCP-aware clients.

The relationship should remain:

| Surface | Role | Authority |
|---|---|---|
| Runtime Commands | Local command output and human-controlled execution | Operational command layer |
| MCP tools | Structured observation and recommendation | Read-only client context |
| MCP snapshot JSON | Generated paste/upload bundle of MCP observations | Ephemeral read-only artifact |

MCP may recommend a Runtime Command. It should not replace Runtime Commands as the authority for verification or closeout.

When a client needs current executable evidence and the human has authorized shell execution, use Runtime Commands. When a client needs structured process context, use MCP.

---

## 9. Snapshot / Reentry Relationship

The MCP runtime snapshot JSON is useful when Copilot, Codex, ChatGPT, or another AI client cannot access the MCP server directly.

Use it as:

- a generated observation bundle
- a pasteable or uploadable runtime context packet
- an ephemeral read-only artifact under `.scaffoldai/tmp/`

Do not treat it as:

- live state
- human-curated continuity truth
- verification evidence
- closeout approval

For reentry, use the layered model:

| Artifact | Use |
|---|---|
| `.scaffoldai/state/snapshot.md` | Human/process continuity state. |
| `.scaffoldai/reference/current-runtime-state.reference.md` | Canonical current runtime orientation. |
| Runtime Commands | Current local operational observations. |
| `.scaffoldai/tmp/mcp-runtime-snapshot.json` | Generated MCP observation bundle for AI clients. |
| Handoff bundles | Portable AI-session bootstrap context. |

Clients should cite `generated_at` when using snapshot JSON and ask for a fresh snapshot if state may have changed.

---

## 10. Multi-client Risks

| Risk | Description | Guardrail |
|---|---|---|
| Stale observations | One client may summarize state that changed after another client acted. | Call `scaffoldai_status` at session start and after known changes. |
| Conflicting recommendations | Copilot and Codex may phrase NEXT SAFE ACTION differently. | Preserve ScaffoldAI wording and cite the tool or command source. |
| Authority drift | A client may treat recommendation as permission. | Keep MCP read-only and repeat human authority rules in setup docs. |
| Config drift | Client-specific config may point to different commands or transports. | Prefer documented user-local setup before repo-local config. |
| Hidden execution assumptions | One client may assume the other ran verify or closeout. | Require explicit verification evidence and human acceptance. |
| Remote exposure | Copied config could accidentally use remote transport. | Document local stdio only and prohibit HTTP/ngrok/remote access. |
| Context collision | Two tools may consume the same state while one is editing files. | Treat MCP observations as moment-in-time and rerun after edits. |
| Over-calling tools | Clients may repeatedly poll MCP and create noisy sessions. | Use MCP at start, before recommendations, and after known state changes. |

---

## 11. Safe Experiment Plan

### Current Supported Behavior

- Run Runtime Commands locally.
- Generate MCP snapshot JSON with `npm run scaffoldai:mcp:snapshot`.
- Use the MCP client interaction contract for any MCP-aware client.
- Validate MCP server behavior with local stdio tests and Inspector validation.

### Safe Next Experiments

1. Add docs-only user-local setup guidance for Copilot.
2. Add docs-only user-local setup guidance for Codex.
3. Include the exact read-only tool list and local stdio boundary in both setup notes.
4. Run each client through the five-tool observation sequence.
5. Compare client summaries against the MCP client interaction contract.
6. Capture friction as planning notes before adding any repo-local config.

### Future / Not Yet

Do not implement these in the current phase:

- repo-local MCP client config
- client-specific MCP surfaces
- write-capable MCP tools
- MCP-triggered shell execution
- MCP-triggered verification
- MCP closeout approval
- remote MCP transport
- autonomous routing, dispatch, or orchestration

Each future authority expansion needs its own contract, tests, implementation packet, and explicit human approval model.

---

## 12. Recommended Next Implementation Packet

Recommended next packet:

```text
MODE: IMPLEMENT
TASK: Document user-local MCP setup guidance for Copilot and Codex

REQUIREMENTS:
- Docs-only.
- No repo-local client config yet.
- No MCP tool changes.
- No runtime behavior changes.
- No write-capable MCP.
- No orchestration.
- No remote transport.
- Document local stdio setup only.
- Link to the MCP client interaction contract and current runtime state reference.

VERIFY:
Run:
npm run verify:scaffoldai
```

Implementation should not proceed to config until user-local documented setup has been reviewed against real Copilot and Codex client behavior.
