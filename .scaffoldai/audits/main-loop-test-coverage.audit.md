# Main Loop Test Coverage Audit

Date: 2026-05-02
Branch: `feature/product-design-electron`
Status: PASS

---

## Summary

Test coverage for the Consync main loop is **MEDIUM confidence**. Core loop stages (Intake,
Preflight, Verify agents; Gatekeeper; Bridge state integrity; in-flight packet state) are each
covered by at least one test. However, the integration path for Handoff Bundle is wired only for
manual execution, three test files exist in `src/test/` but are not wired into any verify target,
and no test asserts the `.scaffoldai/` path boundary directly — meaning a future regression of
PROCESS paths back to `.consync/` would not be caught automatically.

---

## Main Loop Coverage Map

| Loop Stage | Covered Tests | In `verify`? | In `verify:full`? | Risk |
|---|---|---|---|---|
| **Intake / classify** | `unit-intake-run.js` | YES | YES | LOW — basic BLOCKED/PASS scenarios covered |
| **Preflight / gate** | `unit-preflight-run.js` | YES | YES | LOW — BLOCKED/PASS, mode/surface mismatch covered |
| **In-flight packet state** | `unit-get-in-flight-packet.js` | YES | YES | LOW |
| **Gatekeeper decision** | `unit-dry-run-check.js` | YES | YES | LOW — mount/close/switch rules covered |
| **Gatekeeper checks (full)** | `gatekeeper-checks.js` | NO | NO | MEDIUM — only reachable via `npm run test:gatekeeper` |
| **Execute packet (consync-run)** | `unit-consync-run.js` | YES | YES | LOW — soft-gate prompt path covered |
| **Verify agent** | `unit-verify-run.js` | YES | YES | LOW — BLOCKED/PASS scenarios covered |
| **Handoff bundle (lean)** | `integration-handoff-bundle-cli.js` — lean scenario | NO | NO | HIGH — not wired into any verify target |
| **Handoff bundle (full + runbook)** | `integration-handoff-bundle-cli.js` — full + missing scenarios | NO | NO | HIGH — not wired into any verify target |
| **Handoff contract format** | `handoff-contract-checker.js` | NO | NO | MEDIUM — only reachable via `npm run test:handoff-contract` |
| **Bridge state integrity** | `bridge-integrity-checks.js` | YES | YES | LOW — required state files, active-contract JSON, stream coherence |
| **State file contracts (unit)** | `state-integrity-checks.js` | NO | NO | MEDIUM — only reachable via `npm run test:state-integrity-checks` |
| **Preflight/postflight CLI** | `check:state-preflight`, `check:state-postflight` | NO (verify) | YES (verify:full) | LOW when verify:full is run |
| **PROCESS path boundary** | _(none)_ | NO | NO | HIGH — no test asserts `.scaffoldai/` paths; regression to `.consync/` undetectable |
| **Core session / bookmarks** | `core-session.js` | NO | NO | LOW — not a main loop stage; core product session layer |

---

## Tests Found

### Wired into `npm run verify`

| File | What it covers |
|---|---|
| `unit-new-guid.js` | GUID creation unit logic |
| `integration-new-guid-cli.js` | GUID CLI round-trip |
| `unit-dry-run-check.js` | Gatekeeper decision rules, dry-run simulation |
| `unit-get-in-flight-packet.js` | In-flight packet reader (`PACKAGE: NONE`, `PACKET_ID:` patterns) |
| `bridge-integrity-checks.js` | Required Bridge state files exist; active-contract.json valid; stream coherence |
| `unit-consync-run.js` | consync-run soft-gate prompt behavior |
| `unit-intake-run.js` | Intake agent: BLOCKED/PASS, no-prompt, zone classification |
| `unit-preflight-run.js` | Preflight agent: BLOCKED/PASS, mode/surface mismatch, required fields |
| `unit-verify-run.js` | Verify agent: BLOCKED/PASS, aligned/misaligned result |
| `desktop-scaffold.js` | Desktop shell boundary |
| `renderer-session-panel.js` | Renderer session panel slice |
| `renderer-mock-search-panel.js` | Renderer mock search panel |
| `renderer-bookmark-flow.js` | Renderer bookmark read/write |
| `bookmark-write-read-render-loop.js` | Bookmark write/read/render loop |
| `app-search-flow.test.jsx` | Renderer search flow UI (via vitest) |
| Sandbox fixture steps (7 steps) | Fixture verify, describe, discover, search, desktop-search, propose, catalog |
| `system-summary`, `system-check` CLI | Surface summary and process surface validation |

### Wired into `npm run verify:full` (additions beyond verify)

| Step | What it covers |
|---|---|
| `check:state-preflight` | State integrity preflight before work |
| `check:state-postflight` | State integrity postflight after work |
| `build:preload` | Electron preload build |
| `test:e2e` (20 tests) | Full Electron desktop e2e: timeline, inspector, search, bookmarks |

### Direct / manual-only (not wired into any verify target)

| File | What it covers | How to run |
|---|---|---|
| `integration-handoff-bundle-cli.js` | Handoff bundle lean/full/missing scenarios; RUNBOOK_PATH assertion | `node src/test/integration-handoff-bundle-cli.js` |
| `gatekeeper-checks.js` | Full gatekeeper mount/close/switch logic with state fixtures | `npm run test:gatekeeper` |
| `handoff-contract-checker.js` | Handoff format contract validation | `npm run test:handoff-contract` |
| `state-integrity-checks.js` | State file structure validation against contracts | `npm run test:state-integrity-checks` |
| `core-session.js` | Core session/bookmark layer | `node src/test/core-session.js` |

---

## Gaps

### HIGH risk

| Gap | Risk | Why it matters |
|---|---|---|
| `integration-handoff-bundle-cli.js` not wired into verify | HIGH | Lean/full handoff bundle scenarios and RUNBOOK_PATH assertion not exercised in any CI/verify path. Was silently broken post-migration and only caught by manual run. |
| No path-boundary regression test for `.scaffoldai/` | HIGH | No test asserts that `RUNBOOK_PATH` or other PROCESS paths point to `.scaffoldai/`. A future edit regressing paths to `.consync/` would pass verify until the file was actually missing at runtime. |

### MEDIUM risk

| Gap | Risk | Why it matters |
|---|---|---|
| `gatekeeper-checks.js` not wired into verify | MEDIUM | Full gatekeeper mount/close/switch logic is only reachable manually. A regression in gatekeeper state evaluation rules would not surface in verify. |
| `handoff-contract-checker.js` not wired into verify | MEDIUM | Handoff format contract validation is manual-only. A malformed handoff.md could pass bridge-integrity-checks (which only checks non-empty) without format validation. |
| `state-integrity-checks.js` not wired into verify | MEDIUM | Fine-grained state file structure validation is manual-only. Bridge-integrity-checks covers file existence and JSON validity but not full structural contracts. |
| `check:state-preflight` / `check:state-postflight` only in verify:full | MEDIUM | When developers run `npm run verify` alone (default path), pre/post state integrity is not checked. Drift in state files would not be caught unless verify:full is run. |

### LOW risk

| Gap | Risk | Why it matters |
|---|---|---|
| `core-session.js` not wired | LOW | Not a main loop stage; covers product session layer. Low impact on main loop. |
| Prompt/path references in `.github/prompts/` not tested | LOW | `run_closeout.prompt.md` and `run_next_action.prompt.md` reference `.scaffoldai/` paths that cannot be machine-verified. Must be maintained as doc discipline. |
| Verify coverage map in verify.js is static/printed text | LOW | `printCoverageMap()` output is descriptive only — it is not enforced or compared against actual test wiring. |

---

## Recommended First Test Packet

**Packet ID:** `wire-handoff-bundle-into-verify-v1`

**Scope:** Wire `integration-handoff-bundle-cli.js` into `npm run verify` and add one path-boundary assertion for `.scaffoldai/process/runbook.process.md`.

**Specific changes:**

1. Add to `src/test/verify.js`:
   ```
   runNodeStep("[verify] Handoff bundle scenarios", [path.join(repoRoot, "src", "test", "integration-handoff-bundle-cli.js")], GROUPS.CLI);
   ```
2. Add to `src/test/integration-handoff-bundle-cli.js` a new scenario:
   `runRunbookPathBoundaryScenario()` — asserts that `RUNBOOK_PATH` contains `.scaffoldai/process/` by reading the constant from `handoff-bundle.js` or running the CLI with a temp dir seeded at the new path, confirming it succeeds, and confirming it fails when only the old `.consync/process/` path is seeded.
3. Update the verify coverage map in `verify.js` to add `handoff_bundle_path_boundary` to COVERED.

**Why this is the smallest safe next packet:**
- Addresses the one concrete gap already demonstrated in this migration.
- Does not touch runtime behavior.
- Does not require new test infrastructure.
- Closes the only HIGH risk gap that is actionable without structural change.

---

## Non-Goals

- Do not build full lifecycle simulation yet.
- Do not change runtime behavior.
- Do not start BRIDGE migration.
- Do not start ScaffoldAI packaging or externalization.
- Do not refactor existing test files beyond wiring.

---

## Suggested Future Packets

These should each be a separate, small packet after the first test packet is verified.

| Packet | Scope |
|---|---|
| `wire-gatekeeper-state-integrity-into-verify-v1` | Add `gatekeeper-checks.js` and `state-integrity-checks.js` to `npm run verify` under BRIDGE group. Evaluate whether `handoff-contract-checker.js` belongs in verify or verify:full. |
| `path-boundary-regression-suite-v1` | Add a dedicated test file that asserts all known PROCESS paths (`handoff-bundle.js`, `intakeClassify.js`, `reference-audit.js`) point to `.scaffoldai/`. Fails if any path regresses. |
| `preflight-postflight-in-verify-v1` | Evaluate wiring `check:state-preflight` and `check:state-postflight` into `npm run verify` so state integrity is always checked, not only in `verify:full`. Requires confirming that state file presence is guaranteed in all dev environments. |
| `manual-verification-checklist-v1` | Create `.scaffoldai/verification/manual-verification-checklist.md` listing verification steps that cannot be automated (prompt references, UX review, semantic correctness). Provides a structured pre-commit checklist for humans. |
