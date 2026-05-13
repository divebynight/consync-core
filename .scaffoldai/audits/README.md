# .scaffoldai/audits/

## Purpose

This folder contains **completed audit records** — point-in-time snapshots that document findings from specific inspection passes.

Audits are **historical artifacts** that capture what was true at the time of the audit. They are not updated retroactively.

---

## What Belongs Here

- Completed audit reports (e.g., `scaffoldai-bridge-migration-preflight.audit.md`, `github-adapter-boundary.audit.md`)
- Pressure test analyses and findings (e.g., `pressure-test-analysis-v2.audit.md`)
- Process migration assessments (e.g., `process-migration-preflight.audit.md`)
- Coverage and integrity audits (e.g., `main-loop-test-coverage.audit.md`)

---

## What Does NOT Belong Here

- **Active contracts** (belong in `.scaffoldai/contracts/`)
- **Current process documentation** (belongs in `.scaffoldai/process/`)
- **Planning documents** (belong in `.scaffoldai/planning/`)
- **Reference material** (belongs in `.scaffoldai/reference/`)
- **Verification protocols** (belong in `.scaffoldai/verification/`)

---

## Important Notes

- **Audits are snapshots, not living documents** — they reflect the state of the repo at the time of audit
- **Newer audits, contracts, and docs override older audit findings** — if an audit identifies a risk and that risk was later addressed, the audit remains unchanged but the fix is documented elsewhere
- **Audits inform but do not govern** — contracts and process docs are authoritative; audits provide evidence and recommendations

---

## Retention Policy

Audit docs are kept to:
- Preserve evidence of due diligence before major changes
- Document identified risks and whether they were accepted, mitigated, or resolved
- Support traceability when investigating historical decisions

If an audit becomes misleading or irrelevant:
- Add a **status note** at the top (e.g., "STATUS: Risks addressed in [packet-name]; see [link to contract]")
- Move it to `audits/archive/` if it's superseded by newer audits
- Keep it if it provides useful historical context, even if findings are outdated

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/contracts/` | Authoritative boundary rules — may codify audit recommendations |
| `.scaffoldai/process/` | Current process docs — may reference audit findings |
| `.scaffoldai/planning/` | Planning docs — audits may influence planning decisions |
| `.scaffoldai/verification/` | Verification protocols — ongoing verification vs one-time audits |
| `.scaffoldai/packets/` | Completed work packets — may address audit findings |
