# Docs Surface Map

Captured: 2026-04-29
Packet: `docs-surface-classification-v1`
Mode: inspection/documentation only

## Role Boundary

Role: planning / inventory / reference.

Purpose: captures structure, mapping, or exploratory understanding of the repo.

This file is not authoritative for current system behavior or process rules. Current authoritative docs live in process docs, contracts, the runbook, and verification surfaces.

This map classifies current `.consync` documentation and process surfaces. It
does not move, rename, delete, archive, or restructure files.

## Classification Key

- `ACTIVE_PROCESS` - required or directly useful for running ScaffoldAI/Consync process.
- `ACTIVE_PRODUCT` - current Consync app/product direction, runtime boundary, or product readiness.
- `PLANNING` - near-term or deferred planning that is not itself the live execution slot.
- `FUTURE_CONCEPT` - concept docs for possible later process/product shapes.
- `HISTORICAL` - prior state, completed work records, archives, or legacy system snapshots.
- `TEMPLATE` - copyable scaffolds or portable examples.
- `ADAPTER` - tool-specific bridge or prompt surface that points back to `.consync`.
- `GENERATED` - live or derived state written by process execution.
- `UNCLEAR` - mixed, stale, or insufficiently classified.

## Surface Classification

| Surface | Classification | Notes |
| --- | --- | --- |
| `.scaffoldai/agents/00_agent-system.md` | `ACTIVE_PROCESS` | Authoritative manual agent system, invocation rules, and binding boundaries. |
| `.scaffoldai/agents/entry-adapter.md` | `ACTIVE_PROCESS` | Manual classifier for unclear incoming work; does not auto-dispatch. |
| `.scaffoldai/agents/preflight.agent.md` | `ACTIVE_PROCESS` | Bound to state preflight command evidence. |
| `.scaffoldai/agents/verify.agent.md` | `ACTIVE_PROCESS` | Bound to existing verification commands and evidence reporting. |
| `.scaffoldai/agents/closeout.agent.md` | `ACTIVE_PROCESS` | Role definition bound to `.scaffoldai/skills/closeout-agent.md`. |
| `.scaffoldai/agents/intake.agent.md` | `ACTIVE_PROCESS` | Bound intake role for classifying/preserving context. |
| `.scaffoldai/agents/reentry.agent.md` | `ACTIVE_PROCESS` | Bound reentry role for restoring context from state. |
| `.scaffoldai/skills/closeout-agent.md` | `ACTIVE_PROCESS` | Concrete closeout workflow after human-approved completed work. |
| `.scaffoldai/skills/ingestion-gatekeeper.md` | `ACTIVE_PROCESS` | Concrete intake/placement workflow before adding external context. |
| `.scaffoldai/prompts/generate-packet.prompt.md` | `ADAPTER` | Prompt-format packet generator for another tool surface; should remain subordinate to `.consync` process truth. |
| `.scaffoldai/prompts/run_integrity_agent.md` | `ADAPTER` | Copy/paste integrity prompt for external/selected agents. |
| `.scaffoldai/templates/work-packet-v3.md` | `TEMPLATE` | Current work packet template and idempotency contract. |
| `.scaffoldai/templates/sdc-implementation-task.md` | `TEMPLATE` | Older SDC-style implementation handoff template; still useful as reference but overlaps with work-packet-v3. |
| `.scaffoldai/templates/portable/**` | `TEMPLATE` | Portable scaffold sample containing `.consync` and `.github` adapter examples. |
| `.consync/state/active-stream.md` | `GENERATED` | Live stream ownership state; authoritative at runtime. |
| `.consync/state/next-action.md` | `GENERATED` | Live execution slot for the next mounted package. |
| `.consync/state/handoff.md` | `GENERATED` | Live closeout record for the most recently completed package. |
| `.consync/state/snapshot.md` | `GENERATED` | Reentry snapshot and current state summary. |
| `.consync/state/history/README.md` | `ACTIVE_PROCESS` | Rule for preserving replaced live package instructions. |
| `.consync/state/history/agent-handoff.md` | `HISTORICAL` | Early V1 handoff artifact. |
| `.consync/state/history/consync_v1_spec.md` | `HISTORICAL` | Early local-first V1 specification; useful context but not current live app direction. |
| `.consync/state/history/events.log` | `HISTORICAL` | Event log from earlier state model. |
| `.consync/archive/plans/*.md` | `HISTORICAL` | 36 preserved executed or prior package plans. |
| `.consync/streams/electron_ui/stream.md` | `GENERATED` | Active stream-local checkpoint for product/UI work. |
| `.consync/streams/process/stream.md` | `GENERATED` | Paused stream-local checkpoint for process evolution. |
| `.consync/streams/*/history/` | `UNCLEAR` | Empty history folders; likely intended generated/archive surface but currently unused. |
| `.scaffoldai/process/runbook.process.md` | `ACTIVE_PROCESS` | Primary operating entrypoint for source-of-truth, loop, agents, streams, triggers, and state rules. |
| `.scaffoldai/process/ai-context.process.md` | `ACTIVE_PROCESS` | AI tool entry context and key-doc index; may need refresh as surface map matures. |
| `.consync/product/current-system.md` | `ACTIVE_PROCESS` | Thin current index into process, feature development, and AI context docs. |
| `.scaffoldai/verification/verification-ladder.md` | `ACTIVE_PROCESS` | Active verification levels and command mapping. |
| `.scaffoldai/contracts/state-contracts-and-integrity-checks.contract.md` | `ACTIVE_PROCESS` | Active state file contracts and integrity invariants. |
| `.scaffoldai/process/feature-planning-and-packetization.process.md` | `ACTIVE_PROCESS` | Active feature planning and packetization process. |
| `.scaffoldai/process/feature-packet-execution.process.md` | `ACTIVE_PROCESS` | Active multi-packet feature coordination process. |
| `.scaffoldai/process/production-change-packet-rules.process.md` | `ACTIVE_PROCESS` | Active safeguards for production-change packets. |
| `.scaffoldai/process/handoff-delivery-bridge.process.md` | `ACTIVE_PROCESS` | Active source-of-truth and delivery bridge rules for handoffs. |
| `.scaffoldai/contracts/scaffoldai-consync-boundary.contract.md` | `ACTIVE_PROCESS` | Active boundary doc separating Consync product/app areas from ScaffoldAI/process areas. |
| `.scaffoldai/process/work-log.log.md` | `HISTORICAL` | Append-only completed work log; active to write, historical by content. |
| `.scaffoldai/verification/ui-e2e-coverage-map.md` | `ACTIVE_PROCESS` | Current e2e coverage map used during UI/test closeout. |
| `.scaffoldai/verification/ui-e2e-coverage.md` | `HISTORICAL` | Older UI coverage map; likely superseded by `ui-e2e-coverage-map.md`. |
| `.scaffoldai/verification/system-integrity-snapshot.md` | `HISTORICAL` | Point-in-time Phase 2/manual agent snapshot. |
| `.consync/docs/repo-structure-inventory.md` | `HISTORICAL` | Point-in-time structure and cleanup inventory; useful audit reference but not live operating truth. |
| `.scaffoldai/contracts/consync-export-boundary.contract.md` | `ACTIVE_PRODUCT` | Current app/package export boundary and user-facing runtime separation. |
| `.scaffoldai/verification/family-test-readiness.md` | `ACTIVE_PRODUCT` | Current non-technical tester readiness and known limitations. |
| `.consync/product/product-model.md` | `ACTIVE_PRODUCT` | Current product model and Notes/Ideas/keywords direction; includes later concept sections. |
| `.scaffoldai/planning/next-steps.md` | `PLANNING` | Near-term/horizon candidates; may be stale relative to the current Ideas package. |
| `.scaffoldai/agents/janitor-agent-concept.md` | `FUTURE_CONCEPT` | Explicit concept doc, not bound. |
| `.scaffoldai/agents/work-manager-agent-concept.md` | `FUTURE_CONCEPT` | Explicit concept/manual coordination layer, not a bound agent. |
| `.consync/examples/current-system/**` | `TEMPLATE` | Canonical example of expected process/state layout; illustrative only. |
| `.consync/examples/search-panel-feature-example.md` | `HISTORICAL` | Completed feature example and canonical reference for one past feature packet. |
| `.scaffoldai/planning/current-direction.md` | `HISTORICAL` | Older direction artifact from prior artifact system. |
| `.scaffoldai/planning/active-work.md` | `HISTORICAL` | Older active work artifact; superseded by `.consync/state` and streams. |
| `.consync/archive/artifacts-work-log.md` | `HISTORICAL` | Older work log; superseded by `.scaffoldai/process/work-log.log.md`. |
| `.scaffoldai/verification/manual-test-protocol.md` | `HISTORICAL` | Older SDC manual test protocol. |
| `.scaffoldai/planning/marker-capture.md` | `HISTORICAL` | Older marker capture product/process artifact. |
| `.consync/archive/marker-capture-resume.md` | `HISTORICAL` | Older marker capture resume context. |
| `.consync/archive/**` | `HISTORICAL` | Explicit archive of conceptual, system, and legacy docs. |

## Docs Needed To Run ScaffoldAI / Process

- `.scaffoldai/process/runbook.process.md`
- `.scaffoldai/process/ai-context.process.md`
- `.consync/product/current-system.md`
- `.scaffoldai/verification/verification-ladder.md`
- `.scaffoldai/contracts/state-contracts-and-integrity-checks.contract.md`
- `.scaffoldai/process/feature-planning-and-packetization.process.md`
- `.scaffoldai/process/feature-packet-execution.process.md`
- `.scaffoldai/process/production-change-packet-rules.process.md`
- `.scaffoldai/process/handoff-delivery-bridge.process.md`
- `.scaffoldai/contracts/scaffoldai-consync-boundary.contract.md`
- `.scaffoldai/agents/*.md`
- `.scaffoldai/skills/closeout-agent.md`
- `.scaffoldai/skills/ingestion-gatekeeper.md`
- `.scaffoldai/templates/work-packet-v3.md`
- `.consync/state/*.md`
- `.consync/streams/*/stream.md`

## Docs Needed To Understand Consync App / Product Direction

- `.consync/state/snapshot.md`
- `.consync/state/next-action.md`
- `.consync/streams/electron_ui/stream.md`
- `.consync/product/product-model.md`
- `.scaffoldai/contracts/consync-export-boundary.contract.md`
- `.scaffoldai/verification/family-test-readiness.md`
- `.scaffoldai/verification/ui-e2e-coverage-map.md`
- `.scaffoldai/process/work-log.log.md`
- `.scaffoldai/planning/next-steps.md`, with caution because it may lag behind the current Ideas package.

## Planning-Only Docs

- `.scaffoldai/planning/next-steps.md`
- `.scaffoldai/agents/janitor-agent-concept.md`
- `.scaffoldai/agents/work-manager-agent-concept.md`
- Future-direction sections inside `.consync/product/product-model.md`
- Deferred/future sections inside `.scaffoldai/contracts/scaffoldai-consync-boundary.contract.md`
- Deferred cleanup sections inside `.consync/docs/repo-structure-inventory.md`

## Confusing Or Mixed Docs

- `.consync/product/product-model.md` is mostly `ACTIVE_PRODUCT`, but it also contains future product model sections and implementation notes. This is useful now, but it mixes current truth with later concepts.
- `.scaffoldai/planning/next-steps.md` points to audio candidates while live state points to `ideas_foundation_from_notes_first_workflow`; it should be reviewed before treating it as current.
- `.scaffoldai/verification/ui-e2e-coverage.md` and `.scaffoldai/verification/ui-e2e-coverage-map.md` duplicate coverage-map intent. The `*-map.md` file appears current.
- `.consync/product/current-system.md` is intentionally thin but may underrepresent active product docs, especially `product-model.md`, `consync-export-boundary.contract.md`, and `family-test-readiness.md`.
- `.consync/docs/repo-structure-inventory.md` contains active-sounding cleanup decisions, but it is a dated inventory and should be treated as historical audit context.
- `.consync/archive/` contains older active-work/current-direction names that conflict with current `.consync/state` authority.
- `.scaffoldai/templates/sdc-implementation-task.md` overlaps with `.scaffoldai/templates/work-packet-v3.md`; the latter is the stronger current template.
- `.scaffoldai/prompts/*.md` are adapters, but their folder name can make them look like canonical process definitions.
- `.consync/streams/*/history/` exists but is empty, so its intended use is unclear.

## Docs That Should Eventually Move, Rename, Or Archive

These are recommendations only; no restructure happened in this packet.

- Move or mark `.scaffoldai/verification/ui-e2e-coverage.md` as historical after confirming `ui-e2e-coverage-map.md` fully supersedes it.
- Move `.scaffoldai/verification/system-integrity-snapshot.md` under an archive/history location or label it more clearly as a snapshot.
- Move `.consync/docs/repo-structure-inventory.md` under an archive/history location after extracting any still-live cleanup decisions.
- `.scaffoldai/agents/janitor-agent-concept.md` and `.scaffoldai/agents/work-manager-agent-concept.md` are concept docs; bind or archive in a future packet.
- Review `.scaffoldai/planning/next-steps.md` against current state and either refresh it or mark it as planning/horizon only.
- Clarify or remove empty `.consync/streams/*/history/` folders when a stream-history workflow exists.

## Duplicated Or Confusing Pairs

| Pair | Issue | Current Leaning |
| --- | --- | --- |
| `.scaffoldai/verification/ui-e2e-coverage.md` and `.scaffoldai/verification/ui-e2e-coverage-map.md` | Duplicate coverage map concepts. | Treat `ui-e2e-coverage-map.md` as current. |
| `.consync/archive/artifacts-work-log.md` and `.scaffoldai/process/work-log.log.md` | Two work logs from different eras. | Treat process work log as current. |
| `.scaffoldai/planning/current-direction.md` and `.consync/state/snapshot.md` | Two current-direction surfaces. | Treat state snapshot as current. |
| `.scaffoldai/planning/active-work.md` and `.consync/state/next-action.md` | Two active-work surfaces. | Treat next-action as current. |
| `.scaffoldai/templates/sdc-implementation-task.md` and `.scaffoldai/templates/work-packet-v3.md` | Older task template overlaps with current packet template. | Treat work-packet-v3 as current. |
| `.scaffoldai/agents/work-manager-agent-concept.md` and `.scaffoldai/agents/*.md` | Concept agent vs bound/manual agent roles. | Treat `.consync/agents` as bound role surface. |

## Recommended Small Fixes

1. Add a short "surface status" line to the top of mixed docs: current, planning, concept, or historical.
2. Update `.consync/docs/current-system.md` to include product docs and this surface map.
3. Add a note to `.consync/docs/04_next-steps.md` clarifying whether audio candidates are still current or horizon-only.
4. Add superseded-by notes to `.consync/docs/ui-e2e-coverage.md` and `.consync/artifacts/03_work-log.md`.
5. Add an adapter note to `.scaffoldai/prompts/README.md` if a README is later introduced.
6. Add a short purpose note for `.consync/streams/*/history/` before using those folders.

## Deferred Restructure Options

A later packet could split `.consync/docs/` into subfolders without changing the process model:

```text
.consync/docs/process/
.consync/docs/product/
.consync/docs/planning/
.consync/docs/archive/
.consync/docs/examples/
```

Suggested placement if that split happens:

- `process/`: runbook, ai-context, current-system, verification ladder, state contracts, feature packet docs, production-change rules, handoff bridge, boundary docs, coverage map.
- `product/`: product model, export boundary, family-test readiness.
- `planning/`: next steps, janitor concept, work-manager concept, future product sections if extracted.
- `archive/`: system integrity snapshots, repo inventories, superseded coverage map, old artifact docs if promoted out of `.consync/artifacts`.
- `examples/`: current examples can remain grouped as examples.

Do this only after adding explicit status headers and confirming no scripts or prompts depend on exact doc paths.

## Blockers

- None for classification.
- Actual folder restructuring needs a separate packet because several docs and prompts refer to current paths directly.
