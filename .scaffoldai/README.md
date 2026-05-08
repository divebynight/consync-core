# .scaffoldai/

ScaffoldAI is the process and AI development system used to build `consync-core`.

It is **not** the Consync product. It is the harness around the work.

---

## Operational Overview

Current runtime phase:

```text
READ_ONLY MCP + deterministic local Runtime Commands + human-authoritative workflow.
```

ScaffoldAI currently is:

- a repo-local process harness for planning, executing, verifying, and closing focused work packets
- the owner of live process state under `.scaffoldai/state/` and `.scaffoldai/streams/`
- a deterministic Runtime Command layer for status, preflight, question, verify, closeout, and MCP snapshot generation
- a manual agent/process model where agents are invoked intentionally and never auto-dispatched
- a read-only MCP observation surface for structured runtime state
- a set of contracts, planning docs, prompts, and skills that keep work bounded and re-enterable

ScaffoldAI is not yet:

- an autonomous orchestrator
- a write-capable MCP server
- a remote service
- a shell execution proxy
- a closeout approver
- a durable verify-evidence store
- a replacement for human judgment
- the Consync product UI or product runtime

## Runtime Command Model

Runtime Commands are human-visible local commands. They may inspect state, recommend a VERIFY COMMAND, report STATUS, and print a NEXT SAFE ACTION.

Current ScaffoldAI Runtime Commands include:

- `npm run scaffoldai:status`
- `npm run scaffoldai:preflight`
- `npm run scaffoldai:question`
- `npm run scaffoldai:verify`
- `npm run scaffoldai:closeout`
- `npm run scaffoldai:mcp:snapshot`

Use `npm run scaffoldai:verify` to ask ScaffoldAI which VERIFY COMMAND and TARGET apply. Running verification remains a human-controlled decision unless explicitly requested.

## MCP Model

The MCP surface has five read-only observation tools and one bounded append-only signal tool in the current phase. Observation tools return structured JSON with `execution_class: "READ_ONLY"`. `scaffoldai_signal` returns `execution_class: "LOCAL_SIGNAL_APPEND_ONLY"` and writes only ephemeral, non-authoritative signal records under `.scaffoldai/tmp/mcp-signals.jsonl`.

MCP does not approve, verify, close, commit, push, stage, edit, execute shell commands, orchestrate workflow, or mutate authoritative state.

Current MCP tools:

- `scaffoldai_status`
- `scaffoldai_preflight`
- `scaffoldai_question`
- `scaffoldai_verify_recommend`
- `scaffoldai_closeout_readiness`
- `scaffoldai_signal`

The MCP server runs locally over stdio. MCP Inspector is a local validation UI for development/testing; it is not the runtime itself, does not add authority, and does not change the no-remote/no-HTTP v0 boundary for ScaffoldAI MCP.

MCP clients may summarize tool observations, cite STATUS, VERIFY COMMAND, TARGET, NEXT SAFE ACTION, and `execution_class`, append bounded local presence/capability signals, and recommend a human-controlled next step. They must not treat MCP output or signal records as authority to execute.

## Snapshot and Reentry Model

There are two different snapshot concepts:

- `.scaffoldai/state/snapshot.md` — human-readable live-loop state for fast reentry; part of authoritative ScaffoldAI state.
- `.scaffoldai/tmp/mcp-runtime-snapshot.json` — generated read-only MCP observation bundle for paste/upload into AI clients; runtime artifact only.

For reentry, start with:

1. `.scaffoldai/state/snapshot.md`
2. `.scaffoldai/state/next-action.md`
3. `.scaffoldai/state/handoff.md`
4. `npm run scaffoldai:status`
5. `npm run scaffoldai:question`

Use `npm run scaffoldai:mcp:snapshot` when an MCP-aware or external AI client needs one deterministic JSON bundle of the current read-only MCP observations. The snapshot command does not call `scaffoldai_signal`.

## Human Authority Model

Humans remain final authority for:

- choosing or approving work
- resolving ambiguity
- running VERIFY COMMANDS
- accepting verification evidence
- approving closeout
- staging, committing, pushing, branching, or creating PRs
- changing process state under `.scaffoldai/state/` or `.scaffoldai/streams/`

Tool output is evidence or recommendation. It is not approval.

## Future Planning Notes

The Tool Router plan is recommend-only. It may later help classify a request and suggest a target such as ChatGPT, Copilot, Codex, MCP read-only tools, local CLI, or human/manual review. It does not exist as an execution system today.

Future write-capable MCP or dispatch behavior would require a separate contract, authority model, tests, and explicit human approval rules.

---

## What Lives Here

| Folder | Category | Purpose | Status |
|--------|----------|---------|--------|
| `agents/` | PROCESS | Agent role definitions, invocation contracts, binding status | Active |
| `audits/` | DOCS | Point-in-time boundary and structure audits | Historical |
| `contracts/` | PROCESS | Formal behavioral contracts (ownership, migration, integrity) | Active + Historical |
| `packets/` | HISTORY | Completed work packet artifacts | Historical |
| `planning/` | PROCESS | Planning docs and current direction | Active + Historical |
| `process/` | PROCESS | Process docs: runbook, flow maps, execution guides, work log | Active |
| `prompts/` | EXECUTION | AI prompt files for specific workflow steps | Active |
| `skills/` | EXECUTION | Reusable procedure files referenced by agents | Active |
| `state/` | STATE | Live loop state: next-action, handoff, snapshot, active-stream | Active |
| `streams/` | STATE | Per-stream state and history | Active |
| `templates/` | TEMPLATES | Work packet template and portable scaffold templates | Active |

---

## Folder Details

### `state/` — Live session state
The authoritative source of truth for the current development loop.

- `next-action.md` — the one thing to do next (or PACKAGE: NONE when idle)
- `handoff.md` — closeout record for the most recently completed package
- `snapshot.md` — fast re-entry summary of current system state
- `active-stream.md` — which work stream is currently mounted
- `active-contract.json` — current gatekeeper mode and constraints
- `history/` — append-only event log

### `streams/` — Per-stream state
Contains subdirectories per stream (e.g. `electron_ui/`, `process/`).
Each stream tracks its own state and resume checkpoint.

### `agents/` — Agent role contracts
Defines the Consync agent roles: Preflight, Intake, Verify, Closeout, Reentry, Gatekeeper, Entry Adapter.
Agents are invoked manually. No automatic dispatcher exists.

### `process/` — Process documentation
Runbook, flow maps, AI context guide, execution guides, and the append-only work log.
Read these to understand how the development loop operates.

### `skills/` — Reusable workflow procedures
Referenced by agents during execution (e.g. closeout-agent.md).
Not role definitions — those live in `agents/`.

### `prompts/` — AI prompt files
Prompt templates for specific workflow steps (e.g. generate-packet, run closeout).

### `contracts/` — Behavioral contracts
Formal agreements about system boundaries, ownership, and integrity rules.
Includes historical migration contracts and active boundary contracts.

### `planning/` — Direction and planning
Current direction docs and feature planning records.

### `templates/` — Copy-paste templates
`work-packet-v3.md` — the standard work packet template.
`portable/` — standalone scaffold templates for separate deployment contexts.

### `packets/` — Completed packet archive
Historical record of completed work packets. Append-only. Do not modify.

### `audits/` — Boundary audits
Point-in-time structural audit records. Historical. Do not modify.

---

## Critical Boundary

| Zone | Purpose |
|------|---------|
| `.scaffoldai/state/` | Live ScaffoldAI process state — read/write here during work |
| `.scaffoldai/streams/` | Per-stream state — managed by stream workflow |
| `.scaffoldai/packets/` | Completed packet archive — append only |
| `.consync/` | Consync product metadata only: `docs/`, `product/`, `examples/`, `archive/` |

**Do not reintroduce `.consync/state/`, `.consync/streams/`, or `.consync/packets/`.**

These paths were migrated to `.scaffoldai/` during `scaffoldai-bridge-migration-v1`.
`.consync/` is reserved for Consync product metadata, not process state.

---

## Quick Mental Model

- **ScaffoldAI** runs the development loop (agents, state, process, prompts)
- **consync-core** is the software being built (src/, scripts/, sandbox/)
- **Consync** is the product concept and runtime (`src/`, future MCP/app surfaces)
- **`.consync/`** holds product metadata — not process state
- **`.github/`** is a thin Copilot/GitHub adapter only — not the canonical process layer
