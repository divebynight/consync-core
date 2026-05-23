# .scaffoldai/packets/

Role: durable accepted packets and retained packet history

---

## Purpose

`.scaffoldai/packets/` contains **durable accepted packet files** produced by strict intake and may also retain **historical packet records**.

Packets are structured work units, not temporary scratch files. In current ScaffoldAI behavior this directory may contain:
- normalized accepted `.sdc.md` packet files that can later be activated
- retained timestamped historical packet records (for local archive/reference)

---

## Taxonomy

| Category | Description | Location |
|----------|-------------|----------|
| **Accepted Packet Records** | Durable normalized SDC packets accepted by intake | `.scaffoldai/packets/*.sdc.md` |
| **Retained Packet History** | Historical local packet/archive records | `.scaffoldai/packets/packet-*.md` |
| **Active Work State** | Current in-flight operational state | `.scaffoldai/state/` |
| **Stream Continuity** | Human-readable work continuity logs | `.scaffoldai/streams/` |
| **Temporary Artifacts** | Ephemeral runtime/debug output | `.scaffoldai/tmp/` |

**Packets are NOT temporary files.** Accepted packets stay durable after intake; active/inactive status is driven by `.scaffoldai/state/`, not by moving files around.

---

## Lifecycle

1. **Candidate authored:** packet draft lives in `.scaffoldai/inbox/*.sdc.md`
2. **Accepted:** strict intake writes a normalized durable packet into `.scaffoldai/packets/*.sdc.md`
3. **Activated:** active packet pointer is tracked in `.scaffoldai/state/next-action.md` and `.scaffoldai/state/active-runtime.json`
4. **Retained:** accepted packets remain durable unless a human intentionally removes them
5. **Historical archive:** timestamped packet records may also remain here for local history/reference

---

## Relationship to Other Artifacts

- **vs. `.scaffoldai/state/handoff.md`:** Handoff is the current active-work closeout surface; packets are durable accepted packet records and retained historical packet artifacts
- **vs. `.scaffoldai/state/history.jsonl`:** History is a **minimal append-only state transition log**; packets are **detailed structured closeout records**
- **vs. `.scaffoldai/streams/*/history/`:** Stream history is **work continuity within a stream**; packets are **cross-stream archived work units**
- **vs. `.scaffoldai/tmp/`:** Tmp contains **ephemeral runtime artifacts**; packets are **durable archived records**
- **vs. `.scaffoldai/examples/`:** Examples are stable reusable references; packets are live accepted artifacts or retained local packet history
- **vs. `.scaffoldai/templates/`:** Templates are copyable starting points; packets are concrete accepted records

---

## Git Status Guidance

Accepted packet `.sdc.md` files may be intentionally tracked when they represent durable process inputs.
Timestamped historical packet records are local retention material unless a human decides otherwise.

---

## Current Contents

Packets accumulate over time as work is completed. Use `ls -lh .scaffoldai/packets/` to view current archived packets.

Example:
```
packet-20260421T062146Z.md
packet-20260421T062806Z.md
```

---

## When to Retain vs Delete

**Retain:**
- accepted `.sdc.md` packets still useful for activation or reference
- packet records with important context for future work
- local historical packet records needed for auditing or review

**Delete (manual only):**
- obsolete accepted packets no longer needed as reusable work units
- redundant historical packet records superseded by newer material
- space reclamation on local disk

**No automatic cleanup.** Packet retention is a manual human decision.

---

## Related Documentation

- `.scaffoldai/state/history.md` — Append-only state transition history format
- `.scaffoldai/streams/README.md` — Stream continuity and work logs
- `.scaffoldai/tmp/README.md` — Temporary runtime artifacts
- `.scaffoldai/contracts/state-schema.contract.md` — Operational state schema
