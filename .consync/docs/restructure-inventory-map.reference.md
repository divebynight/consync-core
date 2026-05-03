# .consync Restructure Inventory Map

Captured: 2026-04-29
Packet: `docs-restructure-inventory-map-v1`

## Role Boundary

Role: planning / inventory / reference.

Purpose: captures structure, mapping, or exploratory understanding of the repo.

This file is not authoritative for current system behavior or process rules. Current authoritative docs live in process docs, contracts, the runbook, and verification surfaces.

---

## 1. Purpose

This document is an inventory and proposed move map for all `.md` files under
`.consync`. It exists to make the proposed restructure legible before any files
are touched.

**No files are moved by this packet.**

The goal is to replace filename-based semantics with folder-based semantics. Each
destination folder should have a single, clear role. Reading the folder path should
tell you what kind of content is inside — you should not need to read the file
itself to determine its category.

---

## 2. Target Folder Roles

| Destination folder | Role |
|---|---|
| `.consync/docs/` | Navigation and index only. START_HERE, surface map, structure inventories. |
| `.consync/product/` | Product model, design decisions, UX slice definitions. |
| `.scaffoldai/process/` | Operating procedures, runbook, packet rules, agent usage guides, AI context. |
| `.scaffoldai/contracts/` | Boundary definitions, state contracts, integrity rules, export constraints. |
| `.scaffoldai/agents/` | Agent role definitions. Already in place. |
| `.scaffoldai/skills/` | Reusable procedures used by agents. Already in place. |
| `.scaffoldai/planning/` | Active planning artifacts, next steps, current direction, proposed future work. |
| `.scaffoldai/verification/` | Verification ladder, test coverage maps, test readiness docs. |
| `.consync/state/` | Live operational state only (handoff, snapshot, next-action, active-stream). |
| `.consync/streams/` | Per-stream live state. Already in place. |
| `.consync/packets/` | Executed packet records. Already in place. |
| `.scaffoldai/prompts/` | Prompt templates for tooling. Already in place. |
| `.scaffoldai/templates/` | Scaffolding templates (portable, packet, etc.). Already in place. |
| `.consync/archive/` | Historical plans, old specs, retired concepts, prior state artifacts. |
| `.consync/examples/` | Concrete usage examples (how-to, worked examples). |

---

## 3. Full Inventory

### `.scaffoldai/agents/` — 7 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `agents/00_agent-system.md` | stays | high | Agent system index. Correct location. |
| `agents/closeout.agent.md` | stays | high | Bound agent. |
| `agents/entry-adapter.md` | stays | high | Bound adapter. |
| `agents/intake.agent.md` | stays | high | Bound agent. |
| `agents/preflight.agent.md` | stays | high | Bound agent. |
| `agents/reentry.agent.md` | stays | high | Bound agent. |
| `agents/verify.agent.md` | stays | high | Bound agent. |

---

### `.consync/artifacts/` — 14 files

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `artifacts/01_current-direction.md` | `planning/current-direction.md` | high | Direction doc, not a state artifact. Belongs in planning. |
| `artifacts/02_active-work.md` | `planning/active-work.md` | high | Active planning content. |
| `artifacts/03_work-log.md` | `archive/work-log-artifacts.md` | medium | Work log entries; outdated and superseded by state/. Needs decision. |
| `artifacts/04_manual-test-protocol.md` | `verification/manual-test-protocol.md` | high | Verification procedure. |
| `artifacts/05_marker-capture.md` | `planning/marker-capture.md` | medium | Capture planning doc; needs review before placing. |
| `artifacts/marker-capture-resume.md` | `archive/marker-capture-resume.md` | medium | Resume artifact; likely historical. |
| `artifacts/archive/conceptual/foundations.md` | `archive/conceptual/foundations.md` | high | Already archived. Lift to top-level archive. |
| `artifacts/archive/conceptual/layered-system.md` | `archive/conceptual/layered-system.md` | high | Already archived. |
| `artifacts/archive/conceptual/state-hierarchy.md` | `archive/conceptual/state-hierarchy.md` | high | Already archived. |
| `artifacts/archive/conceptual/trust-boundaries.md` | `archive/conceptual/trust-boundaries.md` | high | Already archived. |
| `artifacts/archive/legacy/next-targets.md` | `archive/legacy/next-targets.md` | high | Already archived. |
| `artifacts/archive/system/artifact-index.md` | `archive/system/artifact-index.md` | high | Already archived. |
| `artifacts/archive/system/feature-map.md` | `archive/system/feature-map.md` | high | Already archived. |
| `artifacts/archive/system/guid-rules.md` | `archive/system/guid-rules.md` | high | Already archived. |

---

### `.consync/docs/` — 30 files

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `docs/START_HERE.md` | stays | high | Navigation index. Correct home. |
| `docs/docs-surface-map.reference.md` | stays | high | Classification map of .consync surfaces. Correct home. |
| `docs/repo-structure-inventory.md` | `docs/repo-structure-inventory.md` | medium | Structure inventory; could stay as a navigation aide. Needs decision. |
| `docs/product-model.md` | `product/product-model.md` | high | Product design truth. Belongs in product/. |
| `docs/current-system.md` | `product/current-system.md` | medium | Describes current system state; overlaps with process. Needs decision. |
| `docs/ai-context.md` | `process/ai-context.md` | high | AI execution context for agents. Operational, not product. |
| `docs/runbook.md` | `process/runbook.md` | high | Primary process entrypoint. |
| `docs/feature-packet-execution.md` | `process/feature-packet-execution.process.md` | high | Packet execution procedures. |
| `docs/feature-planning-and-packetization.md` | `process/feature-planning-and-packetization.md` | high | Planning and packetization procedures. |
| `docs/production-change-packet-rules.md` | `process/production-change-packet-rules.md` | high | Rules for production change packets. |
| `docs/handoff-delivery-bridge.md` | `process/handoff-delivery-bridge.md` | high | How to deliver handoff to AI sessions. Operational process. |
| `docs/scaffoldai-consync-boundary.contract.md` | `contracts/scaffoldai-consync-boundary.contract.md` | high | Boundary definition document. |
| `docs/consync-export-boundary.contract.md` | `contracts/consync-export-boundary.contract.md` | high | Export boundary definition. |
| `docs/state-contracts-and-integrity-checks.contract.md` | `contracts/state-contracts-and-integrity-checks.contract.md` | high | State contract definitions. |
| `docs/verification-ladder.md` | `verification/verification-ladder.md` | high | Verification tier definitions. |
| `docs/ui-e2e-coverage-map.md` | `verification/ui-e2e-coverage-map.md` | high | E2e test coverage map. |
| `docs/ui-e2e-coverage.md` | `verification/ui-e2e-coverage.md` | high | E2e coverage detail. |
| `docs/system-integrity-snapshot.md` | `verification/system-integrity-snapshot.md` | medium | Snapshot of integrity state; could be archive. Needs decision. |
| `docs/family-test-readiness.md` | `verification/family-test-readiness.md` | high | Test readiness checklist. |
| `docs/janitor-agent.md` | `agents/janitor.agent.md` | medium | Agent concept doc (status: CONCEPT, not yet bound). Could be planning/ if unbound. |
| `docs/work-manager-agent.md` | `agents/work-manager.agent.md` | medium | Agent concept doc (status: CONCEPT, not yet bound). Same ambiguity as janitor. |
| `docs/03_work-log.md` | `archive/docs-work-log.md` | medium | Work log living in docs/; appears outdated. Needs decision. |
| `docs/04_next-steps.md` | `planning/next-steps.md` | high | Active next-steps planning content. |
| `docs/examples/current-system/decisions.md` | `examples/current-system/decisions.md` | high | Example doc. |
| `docs/examples/current-system/handoff.md` | `examples/current-system/handoff.md` | high | Example doc. |
| `docs/examples/current-system/next-action.md` | `examples/current-system/next-action.md` | high | Example doc. |
| `docs/examples/current-system/README.md` | `examples/current-system/README.md` | high | Example index. |
| `docs/examples/current-system/snapshot.md` | `examples/current-system/snapshot.md` | high | Example doc. |
| `docs/examples/search-panel-feature-example.md` | `examples/search-panel-feature-example.md` | high | Feature example. |
| `docs/restructure-inventory-map.md` | stays (for now) | high | This document. Navigation aide during restructure. |

---

### `.consync/packets/` — 2 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `packets/packet-20260421T062146Z.md` | stays | high | Executed packet record. Correct location. |
| `packets/packet-20260421T062806Z.md` | stays | high | Executed packet record. Correct location. |

---

### `.scaffoldai/prompts/` — 2 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `prompts/generate-packet.prompt.md` | stays | high | Prompt template. Correct location. |
| `prompts/run_integrity_agent.md` | stays | high | Prompt template. Correct location. |

---

### `.scaffoldai/skills/` — 2 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `skills/closeout-agent.md` | stays | high | Bound skill. Correct location. |
| `skills/ingestion-gatekeeper.md` | stays | high | Bound skill. Correct location. |

---

### `.consync/state/` — 4 live files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `state/active-stream.md` | stays | high | Live state. Must not move. |
| `state/handoff.md` | stays | high | Live state. Must not move. |
| `state/next-action.md` | stays | high | Live state. Must not move. |
| `state/snapshot.md` | stays | high | Live state. Must not move. |

---

### `.consync/state/history/` — 3 files

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `state/history/README.md` | `archive/history/README.md` | high | History index. Already effectively archived. |
| `state/history/agent-handoff.md` | `archive/history/agent-handoff.md` | high | Historical handoff record. |
| `state/history/consync_v1_spec.md` | `archive/history/consync_v1_spec.md` | high | Historical v1 spec. |

---

### `.consync/state/history/plans/` — 36 files

All 36 plan files in this folder are historical executed or superseded plans.
They should all move to `.consync/archive/plans/`, preserving their filenames.

| Current path prefix | Proposed path prefix | Confidence | Notes |
|---|---|---|---|
| `state/history/plans/*.md` (all 36) | `archive/plans/*.md` | high | Historical plan records. Retain filenames. |

Files included:
- `docs-20260416-formalize-context-anchor-architecture.md`
- `feature-20260415-expose-one-more-real-session-facing-value.md`
- `feature-20260415-reflect-persisted-bookmark-in-running-desktop-state.md`
- `feature-20260415-render-latest-bookmark-note-in-session-panel.md`
- `feature-20260415-render-latest-bookmark-time-in-session-panel.md`
- `feature-20260415-render-new-session-value-in-session-panel.md`
- `feature-20260415-stabilize-bookmark-panel-empty-state-copy.md`
- `feature-20260415-stabilize-drop-bookmark-panel-copy.md`
- `feature-20260415-stabilize-session-panel-copy-after-incremental-real-values.md`
- `feature-20260415-wire-drop-bookmark-to-real-session-write.md`
- `feature-20260416-build-nested-anchor-mock-session-trial.md`
- `feature-20260417-add-reveal-in-finder-for-search-results.md`
- `feature-20260417-add-selected-match-detail-panel.md`
- `feature-20260417-expose-grouped-mock-search-in-desktop-shell.md`
- `feature-20260417-expose-nested-anchor-search-as-desktop-mock-flow.md`
- `feature-20260417-render-structured-grouped-search-results-in-desktop-shell.md`
- `feature-20260417-separate-selection-and-reveal-actions.md`
- `process-20260415-add-minimal-renderer-verification-slice-for-session-panel.md`
- `process-20260415-define-manual-sequence-advancement-procedure.md`
- `process-20260415-define-minimal-package-plan-format.md`
- `process-20260415-define-minimal-sequential-multi-package-protocol.md`
- `process-20260415-define-minimal-verification-contract-for-package-execution.md`
- `process-20260415-define-repair-entry-and-return-checklist.md`
- `process-20260415-define-resume-state-determination-checklist.md`
- `process-20260415-live-vs-history-state-and-reconcile-closeout.md`
- `process-20260415-refine-verification-contract-with-optional-vs-required-human-gates.md`
- `process-20260415-stabilize-bookmark-write-read-render-loop-verification.md`
- `process-20260415-validate-repair-entry-and-return-checklist-against-examples.md`
- `process-20260415-validate-resume-state-checklist-against-interrupted-examples.md`
- `process-20260417-rerun-mock-session-desktop-trial-with-search-path.md`
- `process-20260417-rerun-mock-session-desktop-trial-with-structured-results.md`
- `process-20260417-rerun-observational-search-loop-after-selection-reveal-split.md`
- `process-20260417-run-mock-session-desktop-trial.md`
- `process-20260418-reconcile-package-plan-after-loop-drift.md`
- `v1-plan-001.md`
- `v1-plan-002.md`

---

### `.consync/streams/` — 2 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `streams/electron_ui/stream.md` | stays | high | Live stream state. Must not move. |
| `streams/process/stream.md` | stays | high | Live stream state. Must not move. |

---

### `.scaffoldai/templates/` — 7 files (no moves proposed)

| Current path | Proposed path | Confidence | Notes |
|---|---|---|---|
| `templates/sdc-implementation-task.md` | stays | high | Task template. Correct location. |
| `templates/work-packet-v3.md` | stays | high | Packet template. Correct location. |
| `templates/portable/.consync/docs/current-system.md` | stays | high | Portable scaffold template. Must not break portable scaffold. |
| `templates/portable/.consync/state/handoff.md` | stays | high | Portable scaffold template. |
| `templates/portable/.consync/state/next-action.md` | stays | high | Portable scaffold template. |
| `templates/portable/.github/prompts/run_closeout.prompt.md` | stays | high | Portable scaffold template. |
| `templates/portable/.github/prompts/run_next_action.prompt.md` | stays | high | Portable scaffold template. |

---

## 4. Grouped Move Map

Only files that would move are listed here.

### → `.consync/product/`
```
docs/product-model.md             -> product/product-model.md
docs/current-system.md            -> product/current-system.md          (needs decision — see §5)
```

### → `.scaffoldai/process/`
```
docs/ai-context.md                             -> process/ai-context.md
docs/runbook.md                                -> process/runbook.md
docs/feature-packet-execution.md               -> process/feature-packet-execution.process.md
docs/feature-planning-and-packetization.md     -> process/feature-planning-and-packetization.md
docs/production-change-packet-rules.md         -> process/production-change-packet-rules.md
docs/handoff-delivery-bridge.md                -> process/handoff-delivery-bridge.md
```

### → `.scaffoldai/contracts/`
```
docs/scaffoldai-consync-boundary.contract.md            -> contracts/scaffoldai-consync-boundary.contract.md
docs/consync-export-boundary.contract.md                -> contracts/consync-export-boundary.contract.md
docs/state-contracts-and-integrity-checks.contract.md   -> contracts/state-contracts-and-integrity-checks.contract.md
```

### → `.scaffoldai/verification/`
```
docs/verification-ladder.md                    -> verification/verification-ladder.md
docs/ui-e2e-coverage-map.md                    -> verification/ui-e2e-coverage-map.md
docs/ui-e2e-coverage.md                        -> verification/ui-e2e-coverage.md
docs/family-test-readiness.md                  -> verification/family-test-readiness.md
docs/system-integrity-snapshot.md              -> verification/system-integrity-snapshot.md  (needs decision — see §5)
artifacts/04_manual-test-protocol.md           -> verification/manual-test-protocol.md
```

### → `.scaffoldai/agents/`
```
docs/janitor-agent.md                          -> agents/janitor.agent.md      (needs decision — see §5)
docs/work-manager-agent.md                     -> agents/work-manager.agent.md (needs decision — see §5)
```

### → `.scaffoldai/planning/`
```
artifacts/01_current-direction.md             -> planning/current-direction.md
artifacts/02_active-work.md                   -> planning/active-work.md
artifacts/05_marker-capture.md                -> planning/marker-capture.md    (needs decision — see §5)
docs/04_next-steps.md                         -> planning/next-steps.md
```

### → `.consync/examples/`
```
docs/examples/current-system/decisions.md         -> examples/current-system/decisions.md
docs/examples/current-system/handoff.md            -> examples/current-system/handoff.md
docs/examples/current-system/next-action.md        -> examples/current-system/next-action.md
docs/examples/current-system/README.md             -> examples/current-system/README.md
docs/examples/current-system/snapshot.md           -> examples/current-system/snapshot.md
docs/examples/search-panel-feature-example.md      -> examples/search-panel-feature-example.md
```

### → `.consync/archive/`
```
artifacts/archive/conceptual/foundations.md          -> archive/conceptual/foundations.md
artifacts/archive/conceptual/layered-system.md       -> archive/conceptual/layered-system.md
artifacts/archive/conceptual/state-hierarchy.md      -> archive/conceptual/state-hierarchy.md
artifacts/archive/conceptual/trust-boundaries.md     -> archive/conceptual/trust-boundaries.md
artifacts/archive/legacy/next-targets.md             -> archive/legacy/next-targets.md
artifacts/archive/system/artifact-index.md           -> archive/system/artifact-index.md
artifacts/archive/system/feature-map.md              -> archive/system/feature-map.md
artifacts/archive/system/guid-rules.md               -> archive/system/guid-rules.md
artifacts/marker-capture-resume.md                   -> archive/marker-capture-resume.md
artifacts/03_work-log.md                             -> archive/artifacts-work-log.md   (needs decision — see §5)
docs/03_work-log.md                                  -> archive/docs-work-log.md        (needs decision — see §5)
state/history/README.md                              -> archive/history/README.md
state/history/agent-handoff.md                       -> archive/history/agent-handoff.md
state/history/consync_v1_spec.md                     -> archive/history/consync_v1_spec.md
state/history/plans/*.md (36 files)                  -> archive/plans/*.md
```

### Files staying in `.consync/docs/`
```
docs/START_HERE.md                 (navigation index — correct home)
docs/docs-surface-map.reference.md  (surface classification map — correct home)
docs/repo-structure-inventory.md   (structure inventory — needs decision, see §5)
docs/restructure-inventory-map.md  (this file — navigation aide during restructure)
```

---

## 5. Ambiguities / Decisions Needed

The following files have unclear roles or overlapping candidates. These must be
decided before executing the move packet. Do not guess silently.

| File | Ambiguity | Options |
|---|---|---|
| `docs/current-system.md` | Describes current process + agent system. Could be product snapshot or process doc. | A) `product/current-system.md` — if primarily a product state snapshot. B) `process/current-system.md` — if primarily a process operating reference. |
| `docs/janitor-agent.md` | Agent concept doc, status CONCEPT (not yet bound). Bound agents live in `agents/`. Unbound concepts may belong in `planning/`. | A) `agents/janitor.agent.md` — if treating all agent docs as agents/ regardless of binding. B) `planning/janitor-agent-concept.md` — if unbound concepts stay in planning until bound. |
| `docs/work-manager-agent.md` | Same ambiguity as janitor-agent. CONCEPT status, not yet bound. | Same options as above. |
| `docs/system-integrity-snapshot.md` | Could be live verification reference or historical snapshot. | A) `verification/system-integrity-snapshot.md` — if still current. B) `archive/system-integrity-snapshot.md` — if outdated. |
| `artifacts/03_work-log.md` | Work log artifact in artifacts/. A similar file `docs/03_work-log.md` exists in docs/. May be duplicates. | A) Both to `archive/` if superseded by `state/`. B) Review content before deciding whether to consolidate or both archive. |
| `docs/03_work-log.md` | See above — likely a duplicate or misplaced work log. | Same as above. |
| `artifacts/05_marker-capture.md` | Planning doc or active state? | A) `planning/marker-capture.md` — if still being planned. B) `archive/marker-capture.md` — if superseded. |
| `docs/repo-structure-inventory.md` | Navigation aid or planning artifact? | A) Keep in `docs/` as navigation reference. B) Move to `planning/` if it becomes outdated. |

---

## 6. Refactor Safety Plan

This plan applies to the separate move packet that follows this one.

### Before moving any file

1. Run `npm run check:state-preflight`. Record STATUS.
2. Run `npm run verify`. Record full output.
3. Run `npm run check:state-postflight`. Record STATUS.
4. Capture `git status`. Working tree must be clean.
5. Baseline is established. Do not proceed if any check is not PASS.

### Move execution rules

- Move files in a single dedicated packet. No product or process changes in the
  same commit.
- Move each folder group together (e.g., all `→ process/` in one step).
- Fix all broken internal cross-references within the same commit.
- Do not split moves and reference fixes across separate commits.

### After moving files

1. Run `npm run check:state-preflight`. Must match baseline STATUS.
2. Run `npm run verify`. Must match baseline output.
3. Run `npm run check:state-postflight`. Must match baseline STATUS.
4. Run `grep -r "\.consync/docs/" .consync --include="*.md" | grep -v "restructure-inventory-map"` to surface any remaining stale references.

### Success criterion

Refactor is only successful if all three checks remain PASS and no stale
cross-references remain in `.consync`. If verification degrades, revert and
investigate before retrying.
