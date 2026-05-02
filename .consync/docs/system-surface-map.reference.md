# REFERENCE DOCUMENTATION — NOT SOURCE OF TRUTH
# Consync + ScaffoldAI — System Surface Map

This file groups every major surface under `.consync/` by role.
It is a visibility aid for humans and AI sessions. It does not modify, move, or
govern any surface — it only names them.

Last updated: 2026-05-02

---

## Consync

Core process layer. These surfaces are authoritative for how work is run.

### `.consync/state/`
Live execution truth. The only source of record for what is happening right now.

| Path | Purpose |
|---|---|
| `state/next-action.md` | Live execution slot — what the current package is |
| `state/handoff.md` | Closeout record for the most recently completed package |
| `state/snapshot.md` | Fast re-entry artifact — current truth in compact form |
| `state/active-stream.md` | Declares which stream owns the live loop |
| `state/active-contract.md` | Active behavioral contract for the current execution context |
| `state/active-contract.json` | Machine-readable form of the active contract |
| `state/history/` | Historical state snapshots; immutable once written |

### `.consync/process/`
How the system operates. Reference these when the live state is unclear or a session is starting.

| Path | Purpose |
|---|---|
| `process/runbook.process.md` | Primary operator entrypoint — how to start a session and which docs to open |
| `process/ai-context.process.md` | AI tool entry context and key-doc index |
| `process/manual-execution-flow.process.md` | Step-by-step manual execution flow including CLI surfaces |
| `process/feature-planning-and-packetization.process.md` | How to break features into packets and run them |
| `process/feature-packet-execution.process.md` | Coordination layer: roles, readiness gate, execution loop |
| `process/production-change-packet-rules.process.md` | Safeguards for packets that modify production source |
| `process/handoff-delivery-bridge.process.md` | Transport-vs-source-of-truth model for handing off to AI sessions |
| `process/process-flow-map-and-dry-run-contract.process.md` | Formal flow map and dry-run contract rules |
| `process/work-log.log.md` | Append-only work log for the process stream |

### `.consync/agents/`
Agent role definitions and invocation rules. Consulted before invoking an agent.

| Path | Purpose |
|---|---|
| `agents/00_agent-system.md` | Agent system overview, invocation rules, and role index |
| `agents/entry-adapter.agent.md` | Manual input-classification adapter — recommends next agent, does not dispatch |
| `agents/preflight.agent.md` | Checks repo and process state are safe before work begins |
| `agents/intake.agent.md` | Classifies new work and its boundaries before execution |
| `agents/verify.agent.md` | Runs and reports verification evidence |
| `agents/closeout.agent.md` | Summarizes changed files, verification, risks, and commit readiness |
| `agents/reentry.agent.md` | Reconstructs context after interruption or unclear handoff |
| `agents/gatekeeper.agent.md` | Governs what enters the process layer |
| `agents/janitor-agent-concept.md` | Concept only — not bound; moved to `archive/conceptual/` |
| `agents/work-manager-agent-concept.md` | Concept only — not bound; moved to `archive/conceptual/` |

### `.consync/contracts/`
Explicit invariants, boundary rules, and naming contracts.

| Path | Purpose |
|---|---|
| `contracts/state-contracts-and-integrity-checks.md` | Invariants and bounded change rules for live state artifacts |
| `contracts/consync-export-boundary.md` | What Consync may and may not export |
| `contracts/scaffoldai-consync-boundary.md` | Authority boundary between ScaffoldAI and Consync |
| `contracts/markdown-artifact.contract.md` | Naming rules and suffix system for `.consync/` markdown artifacts |
| `contracts/markdown-file-types.contract.md` | File type taxonomy for markdown within the system |

### `.consync/streams/`
Durable work streams. Each stream has its own state and history.

| Path | Purpose |
|---|---|
| `streams/electron_ui/stream.md` | Stream descriptor for the Electron UI work stream |
| `streams/electron_ui/history/` | Historical state for the electron_ui stream |
| `streams/process/stream.md` | Stream descriptor for the process improvement stream |
| `streams/process/history/` | Historical state for the process stream |

---

## ScaffoldAI

Product layer. Describes what is being built, not how to run the process.

### `.consync/product/`
Product truth: what the system is and where it is going.

| Path | Purpose |
|---|---|
| `product/current-system.md` | Current product and architecture truth |
| `product/product-model.md` | Product model and design principles |

---

## Bridge

Thin adapter layers connecting Consync to external tools.

### `.github/`
Copilot and GitHub adapter. Points back to `.consync/` for authoritative behavior.

| Path | Purpose |
|---|---|
| `.github/copilot-instructions.md` | Copilot-specific guidance; delegates authority to `.consync/` |
| `.github/prompts/` | Prompt files surfaced via the VS Code Copilot prompt picker |

---

## Supporting

Reference, planning, verification, and tooling surfaces. Informative, not authoritative.

### `.consync/docs/`
Navigation aids, surface maps, and human-readable reference docs.

| Path | Purpose |
|---|---|
| `docs/START_HERE.md` | Navigation index for new sessions |
| `docs/current-system.md` | Docs-layer view of current system (see also `product/current-system.md`) |
| `docs/docs-surface-map.reference.md` | Surface classification map of `.consync/` |
| `docs/repo-structure-inventory.reference.md` | Full repo file inventory |
| `docs/restructure-inventory-map.reference.md` | File restructuring migration map |
| `docs/prompt-contract.md` | Rules for prompt files |
| `docs/examples/` | Example docs for reference |

### `.consync/verification/`
Test readiness, coverage maps, and integrity evidence.

| Path | Purpose |
|---|---|
| `verification/system-integrity-snapshot.md` | Point-in-time integrity snapshot |
| `verification/verification-ladder.md` | Verification levels and what each covers |
| `verification/manual-test-protocol.md` | Manual testing steps and expectations |
| `verification/family-test-readiness.md` | Test readiness across feature families |
| `verification/ui-e2e-coverage-map.md` | E2E coverage map for UI surfaces |
| `verification/ui-e2e-coverage.reference.md` | Reference version of E2E coverage |

### `.consync/planning/`
Active planning artifacts. In-progress direction, not committed truth.

| Path | Purpose |
|---|---|
| `planning/active-work.plan.md` | Current active work plan |
| `planning/current-direction.plan.md` | Current high-level direction |
| `planning/next-steps.plan.md` | Queued next steps |
| `planning/marker-capture.plan.md` | Marker capture planning |

### `.consync/templates/`
Reusable scaffold templates for packets and portable exports.

| Path | Purpose |
|---|---|
| `templates/work-packet-v3.md` | Canonical packet template (current version) |
| `templates/portable/` | Portable export scaffolding templates |

### `.consync/skills/`
Reusable procedural skills referenced by agents.

| Path | Purpose |
|---|---|
| `skills/closeout-agent.md` | Closeout procedure bound to the Closeout agent |
| `skills/ingestion-gatekeeper.md` | Ingestion classification procedure |

### `.consync/examples/`
Canonical worked examples for reference.

| Path | Purpose |
|---|---|
| `examples/search-panel-feature-example.md` | Canonical multi-packet feature example |
| `examples/current-system/` | Current system example artifacts |

### `.consync/prompts/`
Prompt files for AI tool surfaces.

| Path | Purpose |
|---|---|
| `prompts/generate-packet.prompt.md` | Prompt for packet generation |
| `prompts/run-integrity-agent.prompt.md` | Prompt for integrity agent invocation |

### `.consync/packets/`
Closed packet records. Append-only historical record of executed work packets.

| Path | Purpose |
|---|---|
| `packets/packet-*.md` | Individual closed packet records; immutable once written |

### `sandbox/`
Local test fixtures, probes, and expectation files for manual and automated verification.

| Path | Purpose |
|---|---|
| `sandbox/fixtures/` | Static fixture data for test scenarios |
| `sandbox/expectations/` | Expected output files for expectation-based tests |
| `sandbox/current/` | Current sandbox session artifacts |
| `sandbox/probes/` | Targeted probe tests for specific behaviors |

---

## Archive

Surfaces that are historical, superseded, or inactive. Not consulted during normal operation.

### `.consync/archive/`
Retired content. Kept for historical reference only.

| Path | Purpose |
|---|---|
| `archive/conceptual/` | Retired conceptual design documents |
| `archive/history/` | Historical session or process records |
| `archive/legacy/` | Legacy artifacts from earlier system versions |
| `archive/plans/` | Superseded plans |
| `archive/system/` | Retired system-level documents |
| `archive/artifacts-work-log.md` | Work log from the artifacts stream (closed) |
| `archive/marker-capture-resume.md` | Resume artifact for the marker-capture effort (closed) |

### `.consync/artifacts/`
Artifact archive layer. Contains archived output artifacts from completed streams.

| Path | Purpose |
|---|---|
| `artifacts/archive/` | Archived artifact outputs |

### `.consync/quarantine/`
Isolated content pending classification or disposal. Not actively consulted.

| Path | Purpose |
|---|---|
| `quarantine/temp/` | Temporary scratch files pending disposition |

---

## Authority Model

### Authoritative
These surfaces record committed truth. Treat them as ground truth over chat memory, plans, or docs.

- `.consync/state/` — live execution truth
- `.consync/process/` — how the system operates
- `.consync/agents/` — agent roles and invocation rules
- `.consync/contracts/` — invariants and boundary rules

### Supportive
These surfaces are useful and consulted, but they describe or support rather than govern.

- `.consync/product/` — what is being built
- `.consync/docs/` — navigation and reference
- `.consync/verification/` — evidence and test readiness
- `.consync/planning/` — in-progress direction
- `.consync/templates/`, `.consync/skills/`, `.consync/examples/`, `.consync/prompts/` — tooling and scaffolding
- `.consync/packets/` — closed work records (authoritative as immutable history, but not live)
- `sandbox/` — test infrastructure
- `.github/` — external tool adapter

### Historical
These surfaces are read-only. They explain what happened but do not influence current operation.

- `.consync/archive/` — retired content
- `.consync/artifacts/` — archived outputs
- `.consync/quarantine/` — isolated, pending disposition
- `state/history/`, `streams/*/history/` — past state snapshots
