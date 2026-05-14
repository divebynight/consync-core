# .scaffoldai/

Role: operational orientation

ScaffoldAI is the process and AI development system used to build `consync-core`.

It is **not** the Consync product. It is the harness around the work.

---

## Operational Overview

Current runtime phase:

```text
CONTROLLED MCP ACCESS + deterministic local Runtime Commands + human-authoritative workflow.
```

ScaffoldAI currently is:

- a repo-local process harness for planning, executing, verifying, and closing focused work packets
- the owner of three distinct operational zones:
  - `.scaffoldai/state/` — current authoritative operational state
  - `.scaffoldai/streams/` — stream identity and work continuity logs
  - `.scaffoldai/packets/` — archived completed work units
  - `.scaffoldai/runtime/` — non-authoritative runtime append artifacts
  - `.scaffoldai/tmp/` — ephemeral runtime and diagnostic artifacts
- a deterministic Runtime Command layer for status, preflight, question, verify, closeout, and MCP snapshot generation
- a manual agent/process model where agents are invoked intentionally and never auto-dispatched
- a controlled MCP capability/access layer for local AI clients such as Codex and Copilot
- a set of contracts, planning docs, prompts, and skills that keep work bounded and re-enterable

ScaffoldAI is not currently:

- an autonomous orchestrator
- an MCP orchestration engine
- an autonomous agent runner
- an automatic tool dispatcher
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

ScaffoldAI MCP is the current controlled access layer between local AI clients and ScaffoldAI capabilities/state:

```text
AI client
  -> ScaffoldAI MCP
  -> controlled ScaffoldAI capabilities/state
```

Current MCP clients include Codex and Copilot. Each client launches an ephemeral local stdio MCP server instance directly with Node; shared ScaffoldAI state persists independently of any MCP process lifetime.

The MCP surface has read-only observation tools, one bounded append-only signal tool, and a diagnostic shared-memory POC in the current phase. Observation tools return structured JSON with `execution_class: "READ_ONLY"`. `scaffoldai_signal` returns `execution_class: "LOCAL_SIGNAL_APPEND_ONLY"` and writes only non-authoritative signal records under `.scaffoldai/runtime/mcp/signals.jsonl`.

MCP is not currently an orchestration engine. It does not approve, verify, close, commit, push, stage, edit, execute shell commands, orchestrate workflow, dispatch tools automatically, run autonomous agents, or mutate authoritative state. MCP messages are data only, not executable intent.

Current MCP tools:

- `scaffoldai_status`
- `scaffoldai_preflight`
- `scaffoldai_question`
- `scaffoldai_verify_recommend`
- `scaffoldai_closeout_readiness`
- `scaffoldai_signal`
- `scaffoldai_memory_write`
- `scaffoldai_memory_read`

`scaffoldai_memory_write` and `scaffoldai_memory_read` are diagnostic-only, append-only, non-authoritative, manually invoked, and isolated from production workflow state. They are for validating MCP client-to-client visibility only; they are not long-term memory, workflow state, a task queue, a listener, an agent bus, or an automation surface.

The MCP server runs locally over stdio. stdout must remain protocol-clean for MCP messages only; human-readable logs belong on stderr. MCP Inspector is a local validation UI for development/testing; it is not the runtime itself, does not add authority, and does not change the no-remote/no-HTTP v0 boundary for ScaffoldAI MCP.

MCP clients may summarize tool observations, cite STATUS, VERIFY COMMAND, TARGET, NEXT SAFE ACTION, and `execution_class`, append bounded local presence/capability signals, use diagnostic shared-memory manually when requested, and recommend a human-controlled next step. They must not treat MCP output, signal records, or shared-memory messages as authority to execute.

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
| `examples/` | DOCS | Example usage and workflow scenarios | Active |
| `packets/` | ARCHIVE | Archived completed work units (gitignored) | Historical |
| `planning/` | PROCESS | Planning docs and current direction | Active + Historical |
| `process/` | PROCESS | Process docs: runbook, flow maps, execution guides, work log | Active |
| `prompts/` | EXECUTION | AI prompt files for specific workflow steps | Active |
| `reference/` | DOCS | Conceptual documentation and reference material | Active |
| `runtime/` | RUNTIME | Non-authoritative runtime append artifacts | Ephemeral |
| `skills/` | EXECUTION | Reusable procedure files referenced by agents | Active |
| `state/` | STATE | Authoritative operational state (current work) | Active |
| `streams/` | STATE | Stream identity and work continuity (per-stream context) | Active |
| `templates/` | TEMPLATES | Work packet template and portable scaffold templates | Active |
| `tmp/` | RUNTIME | Ephemeral runtime/verification/diagnostic artifacts (gitignored) | Ephemeral |
| `verification/` | PROCESS | Verification patterns and coverage maps | Active |

---

## Folder Details

### `state/` — Authoritative operational state
The authoritative source of truth for the current development loop.

- `next-action.md` — the one thing to do next (or PACKAGE: NONE when idle)
- `handoff.md` — closeout record for the most recently completed package
- `snapshot.md` — fast re-entry summary of current system state
- `active-stream.md` — which work stream is currently mounted
- `active-contract.json` — current gatekeeper mode and constraints
- `history.jsonl` — append-only state transition audit trail (optional, created on first append)
- `history/` — observational artifacts subdirectory (non-authoritative)

### `streams/` — Stream identity and work continuity
Contains subdirectories per stream (e.g. `electron_ui/`, `process/`).  
Each stream has:
- `stream.md` — stream metadata (id, title, status, branch)
- `history/` — work continuity logs (gitignored, non-authoritative)

### `runtime/` — Non-authoritative runtime append artifacts
Contains runtime append-only artifacts outside authoritative state and stream doc namespaces.

Current MCP runtime artifacts:
- `mcp/signals.jsonl` — bounded append-only diagnostic signals
- `mcp/shared-memory.jsonl` — bounded append-only diagnostic shared-memory messages

### `packets/` — Archived work units
Completed, closed work packets with timestamped identifiers (e.g. `packet-20260421T062146Z.md`).  
**Not temporary files** — these are durable archived records of completed work.  
Gitignored to prevent repo bloat; local retention is a manual decision.

### `tmp/` — Ephemeral runtime artifacts
Temporary verification logs, runtime snapshots, diagnostic signals, and debug output.  
**All contents are ephemeral, non-authoritative, and safe to delete.**  
Gitignored (contents excluded, directory tracked via `.gitkeep`).

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

### `audits/` — Boundary audits
Point-in-time structural audit records. Historical. Do not modify.

### `reference/` — Conceptual documentation
Broader conceptual docs and reference material about ScaffoldAI architecture and patterns.

### `verification/` — Verification patterns
Verification coverage maps and verification strategy documentation.

---

## Artifact Taxonomy

Four distinct categories of ScaffoldAI artifacts with different lifecycles and purposes:

### 1. Authoritative Operational State (`.scaffoldai/state/`)

**Purpose:** Current active work state that drives ScaffoldAI decision-making  
**Lifetime:** Current work only  
**Authority:** Source of truth for workflow decisions  
**Gitignored:** Partially (dynamic files like `next-action.md`, `snapshot.md` excluded)

**Key files:**
- `active-contract.json` — current work packet metadata
- `next-action.md` — current in-flight packet or NONE
- `handoff.md` — current handoff document
- `snapshot.md` — current operational snapshot

**Write authority:** All mutations go through `src/lib/scaffoldaiState.state.scaffoldai.js` gateway

### 2. Stream Identity and Work Continuity (`.scaffoldai/streams/`)

**Purpose:** Parallel work streams with identity and human-readable continuity logs  
**Lifetime:** Persistent across work (stream metadata), accumulated over stream lifetime (work logs)  
**Authority:** Stream metadata is authoritative; work logs are observational  
**Gitignored:** Partially (stream.md committed, history/ excluded)

**Key artifacts:**
- `stream.md` — stream identity (id, title, status, branch)
- `history/` — work continuity logs (non-authoritative, for human reentry)
- runtime append artifacts moved under `.scaffoldai/runtime/mcp/`

**Distinction from state:** Stream history tracks **work continuity** within a stream; state history tracks **state transitions** (mount/close/switch).

### 3. Archived Work Units (`.scaffoldai/packets/`)

**Purpose:** Completed, closed work packets with structured closeout records  
**Lifetime:** Post-closeout archive  
**Authority:** Non-authoritative (historical record, not source of truth)  
**Gitignored:** Yes (entire directory)

**Key properties:**
- **Not temporary files** — these are durable structured records
- Timestamped format: `packet-YYYYMMDDTHHMMSSZ.md`
- Local retention is a manual human decision
- No automatic cleanup policy

**Distinction from handoff:** Handoff is **current** active work; packets are **archived** closed work.

### 4. Ephemeral Runtime Artifacts (`.scaffoldai/tmp/`)

**Purpose:** Temporary verification logs, runtime snapshots, diagnostic signals  
**Lifetime:** Ephemeral (safe to delete at any time)  
**Authority:** Non-authoritative (never participates in decisions)  
**Gitignored:** Yes (contents excluded, directory tracked via `.gitkeep`)

**Key artifacts:**
- `verify_sai.log` — verification command output
- `mcp-runtime-snapshot.json` — generated read-only observation bundle
- `runtime/mcp/signals.jsonl` — bounded append-only diagnostic signals

**Hard rule:** Never write to `/tmp` or system-wide temp directories; all temporary artifacts must target `.scaffoldai/tmp/`.

---

## History Artifact Clarification

Three distinct history mechanisms serve different purposes:

| Artifact | Purpose | Format | Authority | Gitignored |
|----------|---------|--------|-----------|------------|
| **`.scaffoldai/state/history.jsonl`** | State transition audit trail | JSON Lines | Non-authoritative | Yes |
| **`.scaffoldai/streams/*/history/`** | Work continuity within a stream | Human-readable | Non-authoritative | Yes |
| **`.scaffoldai/packets/*.md`** | Archived structured closeout records | Markdown | Non-authoritative | Yes |

**State history** tracks **when state changed** (mount/close/switch operations).  
**Stream history** tracks **what work happened** within a stream context.  
**Packets** are **complete closeout summaries** of finished work units.

None of these histories participate in decision-making or become source of truth. They are observational only.

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
