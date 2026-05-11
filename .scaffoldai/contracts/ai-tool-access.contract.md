# AI Tool Access Contract v0

**Status:** Active  
**Purpose:** Advisory acknowledgement and discoverability POC for AI tool interaction with ScaffoldAI  
**Authority:** Advisory only — no enforcement, hooks, or runtime interception  

**Process Profiles:** See `.scaffoldai/contracts/process-profile.contract.md` for interaction and execution mode definitions.

---

## Contract Identity

This contract defines how AI tools (Copilot, Codex, ChatGPT, Claude, etc.) should interact with repositories using ScaffoldAI as the development harness.

**Key Principle:** AI tools are **clients** of ScaffoldAI, not owners of ScaffoldAI state.

---

## Pre-Edit Pause Gate

**Definition:** Before any repository file mutation, AI tools must stop and display the ScaffoldAI ACK block unless the human has already explicitly answered the ScaffoldAI bypass/continue question for the current request.

**Repository file mutation** includes:
- creating files
- editing files
- deleting files
- moving or renaming files
- formatting files
- generating files
- applying patches
- staging files
- otherwise modifying repository contents

**Acknowledgement Pattern:**

```
SCAFFOLDAI ACK

I have been instructed to use the ScaffoldAI development harness for this repository.

Current profile: DEFAULT_DEV
Interaction mode: PASSIVE
Execution mode: LIVE

Before modifying files, should I:
1. continue through the ScaffoldAI process loop
2. or bypass the harness for this request?
```

**Note:** The profile, interaction mode, and execution mode shown in the ACK block should reflect the active process profile. See `.scaffoldai/contracts/process-profile.contract.md` for profile definitions.

This applies to all file mutations, including trivial edits and explicitly requested edits.

After the human responds, proceed accordingly.

---

## Authoritative ScaffoldAI State

The following paths contain authoritative ScaffoldAI process state:

- `.scaffoldai/state/` — live loop state (next-action, handoff, snapshot, active-stream, history)
- `.scaffoldai/streams/` — per-stream state and resume checkpoints
- `.scaffoldai/packets/` — completed work packet archive (append-only)

**Access Rule:** AI tools **must not** directly mutate these files.

Direct state-file mutation is **not** a fallback path.

---

## Access Precedence

When an AI tool needs to interact with ScaffoldAI capabilities, use this precedence order:

### 1. MCP Tool (if implemented and available)

Example MCP tools:
- `scaffoldai_status`
- `scaffoldai_preflight`
- `scaffoldai_question`
- `scaffoldai_verify_recommend`
- `scaffoldai_closeout_readiness`
- `scaffoldai_signal`
- `scaffoldai_memory_write`
- `scaffoldai_memory_read`

MCP tools return structured observations with `execution_class` metadata.

### 2. ScaffoldAI Runtime Command

Example Runtime Commands:
- `npm run scaffoldai:status`
- `npm run scaffoldai:preflight`
- `npm run scaffoldai:question`
- `npm run scaffoldai:verify`
- `npm run scaffoldai:closeout`
- `npm run scaffoldai:mcp:snapshot`

Runtime Commands are human-visible, deterministic, and local-only.

### 3. ScaffoldAI Utility Function

If a utility function exists for the operation (e.g., append to history log), use that.

### 4. Human-Approved Utility Change

If no MCP tool, Runtime Command, or utility exists, **stop and ask** the human whether to:
- Create a utility function
- Use a Runtime Command
- Request an MCP tool addition
- Bypass the harness for this specific request

### 5. Stop and Ask

Never assume direct state mutation is acceptable.

---

## Process Mode: PASSIVE

**Current Mode:** PASSIVE

### PASSIVE Mode Behavior

AI tools operating in PASSIVE mode **must**:

1. **Acknowledge ScaffoldAI** when first interacting with the repository
2. **Notify the user** that this repository uses the ScaffoldAI development harness
3. **Apply the Pre-Edit Pause Gate** (see above) before any repository file mutation
4. **Ask the user** whether to:
   - Continue through the ScaffoldAI process loop (recommended)
   - Bypass the harness for this specific request

**PASSIVE mode is advisory only.** It is not enforcement. It is a discoverability and acknowledgement layer.

See § Pre-Edit Pause Gate above for the required acknowledgement pattern and complete definition of repository file mutation.

---

## What AI Tools Should Not Do

AI tools operating under this contract **must not**:

- Directly edit `.scaffoldai/state/*` files
- Directly edit `.scaffoldai/streams/*` files
- Directly append to `.scaffoldai/packets/*` (except through documented append-only utilities)
- Treat direct file mutation as a fallback when MCP tools or Runtime Commands are unavailable
- Implement hidden automation, hooks, or runtime interception
- Auto-dispatch agents or orchestrate workflows autonomously
- Execute git operations without explicit human approval
- Mutate authoritative state without going through the access precedence order

---

## What AI Tools Should Do

AI tools operating under this contract **should**:

- Query MCP tools for read-only observations (`scaffoldai_status`, `scaffoldai_preflight`, etc.)
- Recommend Runtime Commands when appropriate (`npm run scaffoldai:verify`, etc.)
- Cite `execution_class` metadata from MCP responses
- Respect human authority over staging, committing, pushing, and state transitions
- Ask clarifying questions when access precedence is unclear
- Acknowledge ScaffoldAI in PASSIVE mode before modifying files

---

## Future Modes (Not Implemented)

### ACTIVE Mode (Future)

In ACTIVE mode, AI tools may invoke MCP tools or Runtime Commands automatically with explicit `execution_class` boundaries and user consent rules.

**Not implemented.** Requires separate contract, tests, and approval model.

### ENFORCED Mode (Future)

In ENFORCED mode, direct state mutation would be blocked by hooks, linters, or runtime checks.

**Not implemented.** Not planned for v0. Enforcement is not a current goal.

---

## Implementation Status

**Current Implementation:** Advisory discoverability POC only

**Implemented:**
- Contract definition
- Access precedence documentation
- PASSIVE mode acknowledgement pattern
- AI entrypoint via `AGENTS.md`
- Copilot adapter note in `.github/copilot-instructions.md`

**Not Implemented:**
- Enforcement mechanisms
- Git hooks
- Runtime interception
- Automatic MCP invocation
- Automatic Runtime Command execution
- State mutation utilities

---

## Related Documentation

- `.scaffoldai/README.md` — ScaffoldAI operational overview
- `.scaffoldai/agents/` — Agent role definitions
- `.scaffoldai/process/runbook.process.md` — Process execution guide
- `AGENTS.md` — Vendor-neutral AI entrypoint (points here)
- `.github/copilot-instructions.md` — Copilot-specific adapter (points here)

---

## Contract Metadata

| Field | Value |
|-------|-------|
| **Version** | v0 |
| **Status** | Active |
| **Mode** | PASSIVE |
| **Authority** | Advisory only |
| **Created** | 2026-05-11 |
| **Purpose** | AI tool access discoverability and acknowledgement POC |
| **Non-Goal** | Enforcement, automation, hidden orchestration |

---

## Review and Evolution

This contract is a starting point. Future iterations may:

- Add ACTIVE mode (with explicit execution boundaries)
- Define additional MCP tools for state interaction
- Add utility functions for safe state mutations
- Expand acknowledgement patterns for specific AI tool vendors

Changes to this contract require:
- Human approval
- Updated documentation in `AGENTS.md` and `.github/copilot-instructions.md`
- Verification run (`npm run verify:scaffoldai`)
- Explicit version increment

---

**End of Contract**
