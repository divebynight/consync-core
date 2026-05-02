# CONSYNC CONTRACT — MARKDOWN ARTIFACT TERMINOLOGY AND NAMING

## Status

ACTIVE CONTRACT

---

## 1. Terminology

**Markdown artifact** — any `.md` file in this repository.

**"doc" / "document"** — reserved for explanatory or reference material. The word "doc" is not a generic synonym for any markdown artifact.

**Role** — the functional purpose of a markdown artifact. Each artifact has exactly one role, declared via its filename suffix.

Defined roles:

| Role | Purpose |
| --- | --- |
| `process` | Operational procedure, execution flow, or runbook |
| `reference` | Inventory, map, index, or lookup document |
| `plan` | Forward-looking work plan or direction document |
| `log` | Append-only record of work or events |
| `contract` | Invariants, rules, or formal agreements |
| `agent` | Agent role definition and invocation surface |
| `prompt` | Prompt template or reusable AI invocation pattern |

---

## 2. Naming Rule

Each markdown artifact declares its role via a double-extension filename suffix.

Pattern:

```
<name>.<role>.md
```

Examples:

- `runbook.process.md`
- `repo-structure-inventory.reference.md`
- `active-work.plan.md`
- `work-log.log.md`
- `state-contracts-and-integrity-checks.contract.md`
- `intake.agent.md`
- `generate-packet.prompt.md`

---

## 3. Accepted Suffixes

| Suffix | Role |
| --- | --- |
| `.process.md` | process |
| `.reference.md` | reference |
| `.plan.md` | plan |
| `.log.md` | log |
| `.contract.md` | contract |
| `.agent.md` | agent |
| `.prompt.md` | prompt |

No other role suffixes are defined. Files outside these patterns (e.g., `README.md`, `AGENTS.md`) are convention files and are exempt from this naming rule.

---

## 4. Invariants

1. **One canonical filename per artifact.** Each artifact has exactly one authoritative path.
2. **Artifact meaning must not depend on folder alone.** A file must be interpretable from its name without relying solely on its parent directory.
3. **References must match canonical filenames.** All links and path references must point to the actual filename including the role suffix.
4. **Legacy filenames must not coexist with renamed artifacts.** When a file is renamed to a suffixed form, the old unsuffixed file must be removed.
5. **Duplicate artifacts are not allowed.** No two files may represent the same artifact under different names.

---

## 5. Non-Goals

- This contract does not introduce automated enforcement.
- This contract does not introduce validation tooling.
- This contract does not require restructuring of directories.
- This contract does not govern sandbox fixtures, test expectations, or non-Consync markdown files.

---

## 6. Scope

This contract applies to `.consync/` markdown artifacts.

It does not apply to:
- `README.md`, `AGENTS.md`, or other repo-root convention files
- `sandbox/` fixtures and expectations
- `src/` or `scripts/` non-documentation files
