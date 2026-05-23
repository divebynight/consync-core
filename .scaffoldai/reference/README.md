# .scaffoldai/reference/

## Purpose

This folder contains **durable reference material** — explanatory documents that clarify concepts, boundaries, and operational models without being contracts or process instructions.

Reference docs are **stable explanations** meant to be read, not executed. They answer "what is this?" and "how does it work conceptually?"

---

## What Belongs Here

- Conceptual explanations (e.g., `mcp-boundary.reference.md`, `scaffoldai-flowchart-v0.reference.md`)
- Operational baselines and state descriptions (e.g., `operational-baseline-v0.reference.md`, `current-runtime-state.reference.md`)
- Client setup guides (e.g., `mcp-client-setup-copilot-codex.reference.md`)
- Test and workflow analyses (e.g., `workflow-pressure-test-v0.reference.md`, `cold-start-context-recovery-test-v0.reference.md`)

---

## What Does NOT Belong Here

- **Contracts** (belong in `.scaffoldai/contracts/`) — contracts are binding rules; reference docs are explanations
- **Process instructions** (belong in `.scaffoldai/process/`) — process docs are actionable "how to do X"; reference docs are conceptual
- **Planning documents** (belong in `.scaffoldai/planning/`) — planning is future-facing; reference is descriptive
- **Audit records** (belong in `.scaffoldai/audits/`) — audits are point-in-time findings; reference docs are stable
- **Agent role definitions** (belong in `.scaffoldai/agents/`) — agents have executable binding contracts; reference docs are read-only

---

## Reference vs Contracts vs Process vs Audits

| Type | Purpose | Authority | Changeability |
|------|---------|-----------|---------------|
| **Reference** | Explain concepts and boundaries | Descriptive | Updated when underlying system changes |
| **Contracts** | Define binding rules and boundaries | Authoritative | Changed deliberately via formal updates |
| **Process** | Instruct how to execute workflow | Operational | Evolved based on practice |
| **Audits** | Record findings at a point in time | Historical | Never updated retroactively |
| **Planning** | Capture intent and design rationale | Historical | Archived after implementation |

---

## Important Notes

- **Reference docs are explanatory, not prescriptive** — they describe "what is" rather than mandate "what must be"
- **Reference docs are more stable than planning docs** — planning reflects intent before implementation; reference reflects reality after implementation
- **Reference docs may be cited by contracts and process docs** — when a contract needs to explain a concept, it can point to a reference doc
- **Reference docs should remain understandable to new contributors** — avoid jargon without definitions; provide context

---

## Retention Policy

Reference docs are kept indefinitely as long as they remain accurate and useful. If a reference doc becomes outdated:
- **Update it** if the underlying concept evolved but is still relevant
- **Archive it** to `reference/archive/` if it describes a deprecated feature or obsolete model
- **Add a deprecation note** at the top if it's being replaced by a newer reference doc

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/contracts/` | Contracts may cite reference docs for explanatory detail |
| `.scaffoldai/process/` | Process docs may link to reference docs for background |
| `.scaffoldai/planning/` | Planning docs are future-facing; reference docs describe current reality |
| `.scaffoldai/audits/` | Audits may use reference docs as baseline for comparison |
