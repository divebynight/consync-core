# .scaffoldai/streams/

Role: work continuity and stream identity

---

## Purpose

`.scaffoldai/streams/` contains **work stream metadata and continuity logs**.

Streams represent **parallel lines of work** that can be mounted, switched, and paused. Each stream has its own identity, status, and work history for human-readable continuity tracking.

---

## Taxonomy

| Category | Description | Location |
|----------|-------------|----------|
| **Stream Metadata** | Current stream identity and status | `.scaffoldai/streams/*/stream.md` |
| **Stream History** | Work continuity within a stream | `.scaffoldai/streams/*/history/` |
| **Diagnostic Artifacts** | POC/diagnostic inter-client messages | `.scaffoldai/streams/shared-memory.jsonl` |
| **Active Stream Pointer** | Which stream is currently active | `.scaffoldai/state/active-stream.md` |

---

## Stream Structure

Each stream is a subdirectory containing:

```
.scaffoldai/streams/
├── electron_ui/
│   ├── stream.md          # Stream metadata (id, title, status, branch)
│   └── history/           # Work continuity logs (gitignored)
├── process/
│   ├── stream.md          # Stream metadata
│   └── history/           # Work continuity logs (gitignored)
└── shared-memory.jsonl    # Diagnostic POC only (gitignored)
```

---

## Stream vs State vs Packets

| Artifact | Purpose | Lifetime | Authority |
|----------|---------|----------|-----------|
| **`.scaffoldai/streams/*/stream.md`** | Stream identity and metadata | Persistent across work | Describes stream characteristics |
| **`.scaffoldai/streams/*/history/`** | Human-readable work continuity | Accumulates over stream lifetime | Non-authoritative observation |
| **`.scaffoldai/state/`** | Current active operational state | Current work only | Authoritative source of truth |
| **`.scaffoldai/packets/`** | Archived completed work units | Post-closeout archive | Structured closeout records |

**Key distinction:**
- **State history (`.scaffoldai/state/history.jsonl`)** tracks **state transitions** (mount/close/switch operations)
- **Stream history (`.scaffoldai/streams/*/history/`)** tracks **work continuity** within a specific stream (notes, context, progress)

---

## Stream Metadata (`stream.md`)

Each `stream.md` contains:
- **id:** Stream identifier (e.g., "electron_ui", "process")
- **title:** Human-readable stream name
- **status:** "active" | "paused" | "archived"
- **current_branch:** Git branch associated with this stream
- Optional: description, context, work focus

**Committed to git:** ✅ Yes (stream metadata is durable identity)

---

## Stream History

Stream history subdirectories (`.scaffoldai/streams/*/history/`) contain:
- Work notes and context logs
- Progress tracking
- Planning artifacts specific to the stream
- Human-readable continuity for reentry

**Gitignored:** ✅ Yes (observational logs, not authoritative)

**Non-authoritative:** Stream history does not participate in decision-making or become source of truth. It's for human continuity only.

---

## Shared Memory (Diagnostic)

`.scaffoldai/streams/shared-memory.jsonl` is a **diagnostic proof-of-concept only**.

**Purpose:** Test inter-client visibility between MCP clients (Copilot ↔ Codex)

**Properties:**
- Append-only JSON Lines format
- Manual invocation only (not automatic workflow)
- Non-authoritative (messages are data, not executable intent)
- Gitignored

**Contract:** Shared memory must NOT:
- Trigger commands or tool calls
- Route or dispatch work
- Act as automation surface
- Become production workflow state

See: `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md`

---

## Gitignore Status

| Artifact | Gitignored | Reason |
|----------|------------|--------|
| `stream.md` | ❌ No | Stream identity is durable metadata |
| `history/` | ✅ Yes | Observational logs, not authoritative |
| `shared-memory.jsonl` | ✅ Yes | Diagnostic POC only |

---

## Current Streams

Use `.scaffoldai/state/active-stream.md` to see which stream is currently active.

Example streams:
- `electron_ui` — Electron UI features and testing
- `process` — ScaffoldAI process and development harness work

---

## Stream Operations

**Mount:** Activate a stream and load its context  
**Switch:** Pause current stream and activate another  
**Close:** Complete work in a stream and optionally archive it  

All stream operations are recorded in:
- `.scaffoldai/state/history.jsonl` (state transition log)
- `.scaffoldai/streams/*/history/` (stream-specific work continuity)

---

## Related Documentation

- `.scaffoldai/state/history.md` — State transition history format
- `.scaffoldai/packets/README.md` — Archived work packets
- `.scaffoldai/tmp/README.md` — Temporary runtime artifacts
- `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md` — MCP interaction boundaries
