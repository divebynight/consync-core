# .scaffoldai/planning/

## Purpose

This folder contains historical planning documents that informed ScaffoldAI's development and evolution.

Planning docs are **retained for context and traceability**, not treated as active authority unless explicitly referenced by current process docs or contracts.

---

## What Belongs Here

- Historical planning documents for completed work (e.g., `scaffoldai-mcp-readonly-v0.md`, `scaffoldai-closeout-command-planning-v1.md`)
- Design explorations and decision records that led to current implementation
- Archived planning files that are no longer active but may be referenced for context

---

## What Does NOT Belong Here

- **Active contracts** (belong in `.scaffoldai/contracts/`)
- **Current process documentation** (belongs in `.scaffoldai/process/`)
- **Agent role definitions** (belong in `.scaffoldai/agents/`)
- **Completed audit records** (belong in `.scaffoldai/audits/`)
- **Reference material** (belongs in `.scaffoldai/reference/`)

---

## Important Notes

- **Not every file here is authoritative** — planning docs reflect intent at the time of writing; implementations may have evolved
- **Newer contracts and process docs override older planning docs** — if there's a conflict, trust `.scaffoldai/contracts/` and `.scaffoldai/process/`
- **Planning docs are historical artifacts** — they explain "why this decision was made" and "what was considered," not necessarily "how it works now"

---

## Retention Policy

Planning docs are kept to:
- Preserve decision rationale when revisiting features later
- Provide context for understanding incremental evolution of the system
- Support process archaeology when diagnosing unexpected behavior

If a planning doc becomes misleading or outdated, consider:
- Adding a **status note** at the top (e.g., "STATUS: Superseded by [link to contract]")
- Moving it to `planning/archive/` if it's no longer referenced
- Removing it entirely if it provides no historical value

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/contracts/` | Authoritative boundary rules and process contracts — these override planning docs |
| `.scaffoldai/process/` | Current operational process documentation — the "how it works now" source of truth |
| `.scaffoldai/audits/` | Completed point-in-time audit records — may reference planning docs |
| `.scaffoldai/reference/` | Durable explanatory material — more stable than planning docs |
