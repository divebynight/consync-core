# .scaffoldai/packets/

Role: archived work unit history

---

## Purpose

`.scaffoldai/packets/` contains **archived completed work packets**.

Packets are **structured work units**, not temporary scratch files. Each packet represents a completed, bounded piece of work with:
- A unique timestamped identifier (e.g., `packet-20260421T062146Z.md`)
- A work summary and context
- A closeout status (PASS/FAIL)
- Files created/modified during the work
- Verification notes

---

## Taxonomy

| Category | Description | Location |
|----------|-------------|----------|
| **Archived Work Packets** | Completed, closed work units | `.scaffoldai/packets/*.md` |
| **Active Work State** | Current in-flight operational state | `.scaffoldai/state/` |
| **Stream Continuity** | Human-readable work continuity logs | `.scaffoldai/streams/` |
| **Temporary Artifacts** | Ephemeral runtime/debug output | `.scaffoldai/tmp/` |

**Packets are NOT temporary files.** They are archived structured records of completed work.

---

## Lifecycle

1. **Created:** When a work packet is completed and closed
2. **Named:** Timestamped format `packet-YYYYMMDDTHHMMSSZ.md`
3. **Gitignored:** Entire `.scaffoldai/packets/` directory is excluded from git (see `.gitignore`)
4. **Retention:** No automatic cleanup policy; manual retention decisions only

---

## Relationship to Other Artifacts

- **vs. `.scaffoldai/state/handoff.md`:** Handoff is the **current** active work document; packets are **archived** closed work
- **vs. `.scaffoldai/state/history.jsonl`:** History is a **minimal append-only state transition log**; packets are **detailed structured closeout records**
- **vs. `.scaffoldai/streams/*/history/`:** Stream history is **work continuity within a stream**; packets are **cross-stream archived work units**
- **vs. `.scaffoldai/tmp/`:** Tmp contains **ephemeral runtime artifacts**; packets are **durable archived records**

---

## Gitignore Status

**Gitignored:** ✅ Yes

Pattern: `.scaffoldai/packets/`

Packets are gitignored to:
- Prevent repo bloat from accumulated archived work
- Keep git history focused on active code/docs changes
- Allow local packet retention without forcing commits

---

## Current Contents

Packets accumulate over time as work is completed. Use `ls -lh .scaffoldai/packets/` to view current archived packets.

Example:
```
packet-20260421T062146Z.md
packet-20260421T062806Z.md
```

---

## When to Archive vs Delete

**Archive (keep locally):**
- Recent completed work for reference
- Work packets with important context for future work
- Closeout records needed for auditing or review

**Delete (manual only):**
- Very old packets no longer relevant
- Redundant packets superseded by newer work
- Space reclamation on local disk

**No automatic cleanup.** Packet retention is a manual human decision.

---

## Related Documentation

- `.scaffoldai/state/history.md` — Append-only state transition history format
- `.scaffoldai/streams/README.md` — Stream continuity and work logs
- `.scaffoldai/tmp/README.md` — Temporary runtime artifacts
- `.scaffoldai/contracts/state-schema.contract.md` — Operational state schema
