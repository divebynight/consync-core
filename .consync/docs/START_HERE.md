# NAVIGATION / ONBOARDING ONLY — NOT AUTHORITATIVE
# START HERE

This file is a navigation index for `.consync/docs`. It is not a source of
truth for process rules, product direction, or agent behavior. All of those
live in the specific docs listed below.

For the full classification of every surface, see:
`.consync/docs/docs-surface-map.reference.md`

For a visual map grouping all surfaces by role (Consync / ScaffoldAI / Bridge / Supporting / Archive), see:
`.consync/docs/system-surface-map.reference.md`

---

## What you can run today

The first explicit agent execution surface:

```
node src/index.js intake-run --prompt "describe the work here"
```

This runs the Intake agent's classification logic — one agent, one step. No orchestration, no state mutation, no agent chaining.

Other current execution surfaces:

| Command | Behavior |
| --- | --- |
| `intake-run --prompt "..."` | Runs Intake classification, prints structured report |
| `dry-run-check` | Simulation only — prints Gatekeeper decision, no execution |
| `consync-run` | Approval only — prompts on ALLOW, no execution wiring |

All agent invocation remains manual. No orchestrator exists.

## Manual Execution Flow

The current manual execution flow (including Intake and Preflight CLI surfaces) is documented in:

`.consync/process/manual-execution-flow.process.md`

The system remains manual and non-orchestrated.

---

## Active Process Surfaces

These docs are required to run the Consync/ScaffoldAI process correctly. If
you are starting or resuming work, read these first.

| Doc | Purpose |
| --- | --- |
| `.consync/process/runbook.process.md` | Primary operating entrypoint — loop, agents, streams, state rules |
| `.consync/process/ai-context.process.md` | AI tool entry context and key-doc index |
| `.consync/product/current-system.md` | Thin current index into process, feature development, and AI context |
| `.consync/verification/verification-ladder.md` | Verification levels and command mapping |
| `.consync/contracts/state-contracts-and-integrity-checks.contract.md` | State file contracts and integrity invariants |
| `.consync/process/feature-planning-and-packetization.process.md` | Feature planning and packetization process |
| `.consync/process/feature-packet-execution.process.md` | Multi-packet feature coordination process |
| `.consync/process/production-change-packet-rules.process.md` | Safeguards for production-change packets |
| `.consync/process/handoff-delivery-bridge.process.md` | Source-of-truth and delivery bridge rules for handoffs |
| `.consync/contracts/bridge-ownership.contract.md` | Provisional ownership boundary for Consync, ScaffoldAI, and Bridge surfaces |
| `.consync/contracts/scaffoldai-consync-separation.contract.md` | Target separation note for Consync runtime, ScaffoldAI harness, and Bridge state/config |
| `.consync/contracts/scaffoldai-consync-boundary.contract.md` | Boundary separating Consync product areas from ScaffoldAI process areas |
| `.consync/verification/ui-e2e-coverage-map.md` | Current e2e coverage map used during UI and test closeout |
| `.consync/agents/` | All bound agent roles — preflight, verify, closeout, intake, reentry, entry-adapter |
| `.consync/skills/closeout-agent.md` | Concrete closeout workflow after human-approved completed work |
| `.consync/skills/ingestion-gatekeeper.md` | Concrete intake/placement workflow before adding external context |
| `.consync/templates/work-packet-v3.md` | Current work packet template and idempotency contract |
| `.consync/state/*.md` | Live execution state — active stream, next action, handoff, snapshot |
| `.consync/streams/*/stream.md` | Live stream-local checkpoints |

---

## Active Product Surfaces

These docs describe current Consync app direction, runtime boundaries, and
product readiness. Read these when planning or evaluating product work.

| Doc | Purpose |
| --- | --- |
| `.consync/product/product-model.md` | Product model — Ideas, Items, Notes, Keywords, Widgets, Views, Profiles, and per-user slices |
| `.consync/contracts/consync-export-boundary.contract.md` | App and package export boundary; user-facing runtime separation |
| `.consync/verification/family-test-readiness.md` | Non-technical tester readiness status and known limitations |

---

## Planning / Future Surfaces

These docs contain near-term candidates or longer-horizon concept work. They
are not live execution instructions. Do not treat them as current process or
product authority.

| Doc | Purpose |
| --- | --- |
| `.consync/planning/next-steps.md` | Near-term/horizon candidates — may lag behind the current mounted package |
| `.consync/archive/conceptual/janitor-agent-concept.md` | Concept doc for a future Janitor Agent — not bound, archived |
| `.consync/archive/conceptual/work-manager-agent-concept.md` | Concept/manual coordination layer — not a bound agent, archived |
| Future-direction sections of `product-model.md` | Widget composition, profile presets, AI-assisted pattern analysis — not yet in scope |

---

## Historical / Archive Surfaces

These docs record prior state, completed work, older system snapshots, or
legacy artifacts.

**Do not treat historical docs as current authority unless they have been
explicitly revalidated and re-classified as active.**

| Doc | Notes |
| --- | --- |
| `.consync/process/work-log.log.md` | Append-only completed work log — active to write, historical by content |
| `.consync/docs/repo-structure-inventory.md` | Point-in-time structure and cleanup inventory |
| `.consync/verification/system-integrity-snapshot.md` | Point-in-time Phase 2 / manual agent snapshot |
| `.consync/verification/ui-e2e-coverage.md` | Older UI coverage map — likely superseded by `ui-e2e-coverage-map.md` |
| `.consync/examples/search-panel-feature-example.md` | Completed feature example; canonical reference for one past packet |
| `.consync/archive/history/` | Preserved prior package plans and early V1 artifacts |
| `.consync/archive/` | Older artifact system — superseded by `.consync/state` and streams
