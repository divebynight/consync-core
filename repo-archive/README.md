# repo-archive/

## Purpose

This folder contains **archived material** from earlier project phases that is no longer active but is retained for historical reference.

Archived content is **non-authoritative** unless explicitly referenced by current docs or code.

---

## What Belongs Here

- `consync-legacy/` — Earlier Consync prototypes, documentation, or implementations that predate the current `consync-core` structure
- Other archived projects, experiments, or deprecated codebases that may inform future work but are not part of the active runtime

---

## What Does NOT Belong Here

- **Active runtime code** (belongs in `src/`)
- **Current documentation** (belongs in root docs, `src/`, or `.scaffoldai/`)
- **Recent planning or audit material** (belongs in `.scaffoldai/planning/` or `.scaffoldai/audits/`)
- **Test fixtures** (belong in `sandbox/fixtures/`)

---

## Important Notes

- **Archived material is historical** — it reflects past thinking, past implementations, or past experiments
- **Do not rely on archived material as current truth** — if it's not referenced by active docs, assume it's outdated
- **Archived material may contain outdated terminology or architectures** — treat it as context, not as a blueprint

---

## Retention Policy

Material is archived here when:
- It represents a significant previous iteration or design direction
- It may provide useful context for future architectural decisions
- It's no longer relevant to active development but deleting it would lose institutional knowledge

Material may be **removed entirely** if:
- It provides no historical value
- It's misleading or confusing for new contributors
- It duplicates information available elsewhere (e.g., in git history)

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/planning/` | Planning docs are retained as process history; repo-archive is for whole projects/codebases |
| `.scaffoldai/audits/` | Audits are point-in-time snapshots of the current repo; repo-archive is for deprecated projects |
| `sandbox/` | Test fixtures are active development support; repo-archive is historical |
