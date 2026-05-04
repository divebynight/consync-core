# .scaffoldai/

ScaffoldAI is the process and AI development system used to build `consync-core`.

It is **not** the Consync product. It is the harness around the work.

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
