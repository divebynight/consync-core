TYPE: REFACTOR
PACKAGE: process-zone-migration-v1

STATUS

PASS

SUMMARY

Migrated all PROCESS / ScaffoldAI surfaces from `.consync/` to `.scaffoldai/`. Nine directories were moved atomically. All stale path references across runtime code, tests, docs, prompts, and orientation surfaces were corrected. Post-migration stabilization pass completed. All verification passed.

Branch: `feature/product-design-electron`

Commits:
- `3af0bc4` — initial migration move (9 dirs)
- `c930c39` — post-migration stabilization (3 stale ref fixes)

WHAT CHANGED

Directory structure:
- `.consync/agents/` → `.scaffoldai/agents/`
- `.consync/skills/` → `.scaffoldai/skills/`
- `.consync/contracts/` → `.scaffoldai/contracts/`
- `.consync/process/` → `.scaffoldai/process/`
- `.consync/templates/` → `.scaffoldai/templates/`
- `.consync/prompts/` → `.scaffoldai/prompts/`
- `.consync/verification/` → `.scaffoldai/verification/`
- `.consync/planning/` → `.scaffoldai/planning/`
- `.consync/audits/` → `.scaffoldai/audits/`

`.consync/` now contains BRIDGE and DOCS surfaces only:
- `.consync/state/` — BRIDGE (live execution state)
- `.consync/streams/` — BRIDGE (stream state)
- `.consync/docs/` — operator docs and navigation
- `.consync/product/` — product context
- `.consync/examples/` — worked examples
- `.consync/archive/` — historical/conceptual docs
- `.consync/packets/` — packet artifacts
- `.consync/quarantine/` — quarantined items

Runtime references updated:
- `src/commands/handoff-bundle.js` — RUNBOOK_PATH updated to `.scaffoldai/process/runbook.process.md`
- `src/test/integration-handoff-bundle-cli.js` — fixture path and both regex assertions updated
- `src/lib/intakeClassify.js` — TARGET_SURFACES.process updated to `.scaffoldai/` paths
- `src/commands/reference-audit.js` — all 5 REFERENCE_CATEGORIES needles updated
- `src/lib/gatekeeperDecision.js` — @see comment updated

Orientation surfaces updated:
- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/prompts/run_closeout.prompt.md`
- `.github/prompts/run_next_action.prompt.md`
- `.github/agents/consync-process.agent.md`
- `.consync/docs/START_HERE.md`
- `.consync/docs/docs-surface-map.reference.md`
- `.consync/docs/current-system.md`
- `.consync/docs/repo-structure-inventory.reference.md`
- `.consync/docs/restructure-inventory-map.reference.md`
- `.consync/docs/system-surface-map.reference.md`
- `.consync/product/current-system.md`
- `.consync/state/active-contract.md`
- `.consync/archive/conceptual/janitor-agent-concept.md`

All internal `.scaffoldai/` cross-links updated.

Process artifacts created this migration:
- `.scaffoldai/contracts/process-zone-migration-decisions.contract.md`
- `.scaffoldai/planning/process-zone-migration.plan.md`
- `.scaffoldai/audits/process-migration-preflight.audit.md`

FINAL ARCHITECTURE BOUNDARY

  Runtime / product:   src/
  ScaffoldAI PROCESS:  .scaffoldai/
  BRIDGE state:        .consync/state/  and  .consync/streams/
  Operator docs:       .consync/docs/
  AI adapter layer:    .github/  (thin — not canonical)

WHAT WAS VERIFIED

- `npm run verify` — PASS
- `npm run verify:full` — PASS (20/20 e2e, preflight PASS, postflight PASS)
- `integration-handoff-bundle-cli.js` — PASS (run directly, all 4 scenarios)
- Stale PROCESS path grep — CLEAN (zero hits outside justified archive text)

KNOWN REMAINING RISKS

- `integration-handoff-bundle-cli.js` is not wired into `verify` or `verify:full`. It was silently broken post-migration until fixed this session. Consider wiring it into the verify chain in a future packet.
- `.consync/state/active-contract.md` was updated as a live state file during migration. This was necessary but deviates slightly from normal packet discipline (state files updated mid-migration rather than at closeout).
- One recurring e2e flake observed on `timeline-marker-selects-inspector.spec.js` (intermittent timeout). Pre-existing; not introduced by this migration.

WHAT NOT TO DO NEXT

- Do NOT start BRIDGE migration (moving `.consync/state/` or `.consync/streams/`).
- Do NOT start ScaffoldAI packaging or externalization.
- Do NOT rename or restructure `.scaffoldai/` directories.
- Do NOT mount a new feature packet immediately — allow stabilization observation first.
- Do NOT push to main without human review of PR #3.

COMMANDS TO RUN

- `npm run check:state-preflight`
- `npm run verify`
- `npm run check:state-postflight`

HUMAN VERIFICATION

1. Confirm `.scaffoldai/` contains: agents/, audits/, contracts/, planning/, process/, prompts/, skills/, templates/, verification/
2. Confirm `.consync/` contains no PROCESS directories.
3. Confirm `npm run verify` passes.
4. Confirm grep for stale PROCESS paths returns CLEAN.
5. Confirm `node src/test/integration-handoff-bundle-cli.js` reports PASS.

RECOMMENDED NEXT SAFE ACTION

Observation only. Let the migrated state settle for one work session before mounting the next packet. When ready to resume product work, mount `ideas_foundation_from_notes_first_workflow` on `feature/product-design-electron` using normal Intake → Preflight → packet discipline.
