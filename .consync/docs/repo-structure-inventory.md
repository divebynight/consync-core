# Repo Structure Inventory

Captured: 2026-04-26
Branch: `feature/scaffoldai-agent-system-docs-v1`

This document is an observed inventory. It describes what exists and, where clear, what it is for. Where purpose is uncertain, that is noted explicitly. It is not a policy document and does not introduce new rules.

---

## Classification Key

| Label | Meaning |
|---|---|
| SOURCE | Production source code |
| PROCESS | Consync process state and docs |
| AGENTS | Agent role definitions |
| SKILLS | Reusable procedure/workflow files |
| PROMPTS | Prompt templates for AI tool invocation |
| TEMPLATES | Copy-paste scaffold templates |
| ARTIFACTS | Generated process artifacts / living context docs |
| TESTS | Automated test files |
| SANDBOX | Fixture and test data for manual and automated verification |
| DEPS | Dependencies |
| BUILD | Build or runtime output |
| ADAPTER | Thin tool-specific adapter layer (e.g. GitHub/Copilot) |
| LEGACY | Observed to be older; may no longer be in active use |
| UNCERTAIN | Purpose not clearly established from observed content |

---

## Top-Level Files

| File | Classification | Purpose |
|---|---|---|
| `package.json` | SOURCE | Node.js project manifest, scripts, and dependency declarations |
| `package-lock.json` | DEPS | Lockfile for reproducible installs |
| `README.md` | PROCESS | Project readme; practical usage overview |
| `AGENTS.md` | ADAPTER | Codex/AGENTS.md entry point; redirects back to `.consync/agents/` as authoritative source |
| `forge.config.js` | SOURCE | Electron Forge packaging and make configuration |
| `playwright.config.js` | TESTS | Playwright e2e test runner configuration |
| `vite.main.config.mjs` | BUILD | Vite build config for Electron main process |
| `vite.preload.config.mjs` | BUILD | Vite build config for Electron preload |
| `vite.renderer.config.mjs` | BUILD | Vite build config for Electron renderer |
| `.gitignore` | SOURCE | Git ignore rules |
| `.DS_Store` | UNCERTAIN | macOS Finder metadata; not project content — see cleanup review |

---

## Top-Level Folders

| Folder | Classification | Purpose |
|---|---|---|
| `.consync/` | PROCESS | Authoritative Consync process layer: state, docs, agents, skills, prompts, templates, artifacts, streams |
| `.github/` | ADAPTER | Thin GitHub/Copilot adapter: prompt files and agent definitions that point back to `.consync/` |
| `src/` | SOURCE | All production source code: CLI, commands, lib, Electron, renderer, tests |
| `scripts/` | SOURCE | Project-level utility scripts (not CLI commands) |
| `sandbox/` | SANDBOX | Fixture data, probe experiments, scan expectations, and GUID artifacts for development and manual verification |
| `dev-harness/` | ~~UNCERTAIN~~ | ~~Local HTTP development harness~~ — **removed** in `cleanup-remove-dev-harness-v1` (2026-04-26) |
| `test-results/` | BUILD | Playwright last-run output; generated artifact |
| `node_modules/` | DEPS | Installed Node.js dependencies; managed by npm |
| `.vite/` | BUILD | Vite build output; generated at build time |
| `.git/` | BUILD | Git repository metadata |

---

## `.consync/` — Detail

The authoritative Consync process layer. All meaningful process state, agent roles, skills, docs, templates, and stream tracking live here.

### `.consync/state/`

| File/Folder | Classification | Purpose |
|---|---|---|
| `active-stream.md` | PROCESS | Declares the current active stream, previous stream, paused streams, and ownership rules |
| `next-action.md` | PROCESS | Live execution slot: one mounted package at a time, with goal, scope, and verification instructions |
| `handoff.md` | PROCESS | Live result contract for the most recently completed package; overwritten at each closeout |
| `snapshot.md` | PROCESS | Human-readable state snapshot: active stream, current package, next likely packages |
| `history/` | PROCESS | Append-only archive of executed state |
| `history/README.md` | PROCESS | Explains the history preservation rule |
| `history/events.log` | PROCESS | Append-only event log |
| `history/agent-handoff.md` | PROCESS | Historical agent handoff record |
| `history/consync_v1_spec.md` | LEGACY | Early v1 spec document; kept as historical reference |
| `history/plans/` | PROCESS | Archive of executed package instructions (one file per completed package) |

### `.consync/agents/`

| File | Classification | Purpose |
|---|---|---|
| `00_agent-system.md` | AGENTS | Defines the agent system overview, naming boundary (Consync vs ScaffoldAi), authority boundary, and the role of each surface |
| `entry-adapter.md` | AGENTS | Manual Phase 2 input-classification adapter; classifies incoming input and recommends which agent to invoke next; does not auto-dispatch |
| `preflight.agent.md` | AGENTS | Preflight agent role definition |
| `intake.agent.md` | AGENTS | Intake agent role definition |
| `verify.agent.md` | AGENTS | Verify agent role definition |
| `closeout.agent.md` | AGENTS | Closeout agent role definition |
| `reentry.agent.md` | AGENTS | Reentry agent role definition |

### `.consync/skills/`

| File | Classification | Purpose |
|---|---|---|
| `closeout-agent.md` | SKILLS | Reusable closeout procedure; bound to the Closeout agent as its current execution surface |
| `ingestion-gatekeeper.md` | SKILLS | Procedure for classifying and placing external context conservatively before ingestion |

### `.consync/docs/`

| File/Folder | Classification | Purpose |
|---|---|---|
| `runbook.md` | PROCESS | Thin operating entrypoint for a new session; answers how to start and where truth lives |
| `ai-context.md` | PROCESS | Structured execution context for AI tools; defines authority boundary and surface roles |
| `current-system.md` | PROCESS | Description of the current system surface |
| `system-integrity-snapshot.md` | PROCESS | Periodic integrity snapshot; records test counts, command surface, and HEAD at capture time |
| `state-contracts-and-integrity-checks.md` | PROCESS | Documents the integrity check contracts and what each check validates |
| `verification-ladder.md` | PROCESS | Documents the tiered verification approach (unit → integration → e2e → manual) |
| `feature-packet-execution.md` | PROCESS | Documents how feature packets are executed |
| `feature-planning-and-packetization.md` | PROCESS | Documents how work is planned and packetized |
| `handoff-delivery-bridge.md` | PROCESS | Defines the handoff delivery bridge between local truth and external AI session state |
| `production-change-packet-rules.md` | PROCESS | Rules governing production change packets |
| `scaffoldai-consync-boundary.md` | PROCESS | Documents the naming and authority boundary between Consync and ScaffoldAi |
| `ui-e2e-coverage-map.md` | PROCESS | Map of UI e2e coverage |
| `ui-e2e-coverage.md` | PROCESS | Coverage summary document |
| `work-manager-agent.md` | PROCESS | Concept document for a future Work Manager Agent; explicitly marked as a concept, not implemented |
| `03_work-log.md` | PROCESS | Appears to be a copy or older version of the work log artifact; relationship to `artifacts/03_work-log.md` is unclear |
| `04_next-steps.md` | PROCESS | Appears to be a copy or older version of next-steps; relationship to artifacts is unclear |
| `examples/` | PROCESS | Example files for current-system shape and a search-panel feature example; used for reference |

### `.consync/artifacts/`

Living context documents. Numbered prefix indicates intended reading order.

| File/Folder | Classification | Purpose |
|---|---|---|
| `01_current-direction.md` | ARTIFACTS | High-level product direction and guardrails |
| `02_active-work.md` | ARTIFACTS | Active work context |
| `03_work-log.md` | ARTIFACTS | Append-only work log of completed packets |
| `04_manual-test-protocol.md` | ARTIFACTS | Manual test protocol |
| `05_marker-capture.md` | ARTIFACTS | Marker capture feature definition |
| `marker-capture-resume.md` | ARTIFACTS | Resume context for the marker capture feature; notes the feature is defined but not yet implemented |
| `archive/` | LEGACY | Archived conceptual and system documents from earlier development phases |
| `archive/conceptual/` | LEGACY | Early conceptual foundations (foundations, layered-system, state-hierarchy, trust-boundaries) |
| `archive/legacy/next-targets.md` | LEGACY | Early next-targets planning document from v1 |
| `archive/system/` | LEGACY | Early system-level planning documents (artifact-index, feature-map, guid-rules) |

### `.consync/streams/`

| File/Folder | Classification | Purpose |
|---|---|---|
| `process/stream.md` | PROCESS | Active stream record for the `process` stream |
| `process/history/` | PROCESS | History folder for `process` stream; currently empty |
| `electron_ui/stream.md` | PROCESS | Stream record for the `electron_ui` stream; currently paused |
| `electron_ui/history/` | PROCESS | History folder for `electron_ui` stream; currently empty |

### `.consync/prompts/`

| File | Classification | Purpose |
|---|---|---|
| `generate-packet.prompt.md` | PROMPTS | Prompt template for generating a work packet from state files |
| `run_integrity_agent.md` | PROMPTS | Prompt template for invoking the integrity agent; user fills in TYPE and PACKAGE |

### `.consync/templates/`

| File/Folder | Classification | Purpose |
|---|---|---|
| `work-packet-v3.md` | TEMPLATES | Work packet template v3 with idempotency detection |
| `sdc-implementation-task.md` | TEMPLATES | SDC (simple deterministic command) implementation task template |
| `portable/` | TEMPLATES | Scaffold for the portable template output (`.consync/docs`, `.consync/state`, `.github/prompts`) |

### `.consync/packets/`

| File | Classification | Purpose |
|---|---|---|
| `packet-20260421T062146Z.md` | ARTIFACTS | Generated handoff review packet |
| `packet-20260421T062806Z.md` | ARTIFACTS | Generated handoff review packet |

### `.consync/notes/`

**Removed** in `cleanup-remove-consync-notes-v1` (2026-04-26). Contained scratch session notes and an image; the only substantive content (a deferred bug note about `inferStreamFromRequest`) was confirmed fixed before removal.

---

## `.github/` — Detail

Thin adapter layer for GitHub/Copilot tooling.

| File/Folder | Classification | Purpose |
|---|---|---|
| `copilot-instructions.md` | ADAPTER | GitHub Copilot system instructions for this repo; references `.consync/` as authoritative |
| `prompts/run_closeout.prompt.md` | ADAPTER | Copilot prompt that reads `.consync/state/handoff.md` and `.consync/skills/closeout-agent.md` |
| `prompts/run_next_action.prompt.md` | ADAPTER | Copilot prompt that reads and executes `.consync/state/next-action.md` |
| `agents/consync-integrity.agent.md` | ADAPTER | Copilot agent definition for the integrity agent |
| `agents/consync-process.agent.md` | ADAPTER | Copilot agent definition for the process agent |

---

## `src/` — Detail

All production source code.

### `src/index.js`

Entry point. Routes CLI commands to handlers in `src/commands/`.

### `src/cli/`

| File | Classification | Purpose |
|---|---|---|
| `index.js` | SOURCE | CLI argument parsing and command dispatch |

### `src/commands/`

Command handlers. Each file is one CLI command, thin over business logic in `src/lib/`.

| File | Purpose |
|---|---|
| `new-guid.js` | Create a new GUID artifact |
| `list-guid.js` | List GUID artifacts from `sandbox/current/` |
| `show-guid.js` | Show a single GUID artifact by partial match |
| `handoff-bundle.js` | Generate a handoff bundle from state files |
| `gatekeeper.js` | Mount, close, or switch gatekeeper state |
| `portable.js` | Scaffold a portable `.consync` template into a target directory |
| `reentry-check.js` | Check reentry state and print guidance |
| `sandbox-scan.js` | Scan a sandbox fixture and print file type summary |
| `sandbox-describe.js` | Describe a sandbox fixture in structured form |
| `sandbox-propose.js` | Propose a Consync session structure for a fixture |
| `sandbox-discover.js` | Discover nested `.consync` anchors under a root |
| `sandbox-search.js` | Search sandbox anchor data |
| `sandbox-desktop-search.js` | Desktop-aware sandbox search |
| `sandbox-catalog.js` | Print catalog of fixtures and expectations |
| `sandbox-verify.js` | Verify a fixture against its expectation file |
| `state-integrity-check.js` | Run preflight or postflight state integrity checks |
| `system-check.js` | Print system check output |
| `system-summary.js` | Print system summary |

### `src/lib/`

Reusable business logic. Functions here are independent of the CLI layer.

| File | Purpose |
|---|---|
| `guid.js` | GUID generation and resolution logic |
| `newGuidTool.js` | Tool wrapper for new-guid logic |
| `time.js` | Timestamp formatting |
| `fs.js` | File system utilities |
| `clipboard.js` | Clipboard access utility |
| `stateIntegrityCheck.js` | State integrity check logic |
| `handoffContractChecker.js` | Handoff contract validation logic |
| `gatekeeperMount.js` | Gatekeeper mount logic |
| `gatekeeperClose.js` | Gatekeeper close logic |
| `gatekeeperSwitch.js` | Gatekeeper switch logic |
| `portableScaffold.js` | Portable template scaffolding logic |
| `sandbox-anchors.js` | Sandbox anchor discovery and resolution logic |

### `src/core/`

| File | Purpose |
|---|---|
| `session.js` | Session model and state management |
| `desktop-shell.js` | Desktop shell abstraction layer |

### `src/electron/`

Electron application structure.

| Folder/File | Purpose |
|---|---|
| `main/index.js` | Electron main process entry point |
| `main/ipc.js` | IPC handler registrations |
| `main/window.js` | Window creation and management |
| `preload/bridge.js` | Preload bridge API exposed to renderer |
| `preload/preload.js` | Electron preload script |
| `renderer/App.jsx` | Root React component |
| `renderer/renderer.jsx` | Renderer entry point |
| `renderer/index.html` | Renderer HTML shell |
| `renderer/styles.css` | Renderer stylesheet |
| `renderer/session-panel.mjs` | Session panel component logic |
| `renderer/bookmark-flow.mjs` | Bookmark flow component logic |
| `renderer/mock-search-panel.mjs` | Mock search panel component |
| `renderer/mock-waveform-panel.mjs` | Mock waveform panel component |
| `shared/ipc-channels.js` | Shared IPC channel name constants |

### `src/test/`

| File/Folder | Classification | Purpose |
|---|---|---|
| `verify.js` | TESTS | Master verification runner; runs all verification slices in order |
| `unit-new-guid.js` | TESTS | Unit tests for new-guid logic |
| `integration-new-guid-cli.js` | TESTS | Integration tests for new-guid CLI |
| `integration-handoff-bundle-cli.js` | TESTS | Integration tests for handoff-bundle CLI |
| `state-integrity-checks.js` | TESTS | Tests for state integrity check logic |
| `gatekeeper-checks.js` | TESTS | Tests for gatekeeper decision logic |
| `handoff-contract-checker.js` | TESTS | Tests for handoff contract checker |
| `desktop-scaffold.js` | TESTS | Desktop scaffold boundary verification |
| `core-session.js` | TESTS | Core session model tests |
| `renderer-session-panel.js` | TESTS | Renderer session panel slice verification |
| `renderer-mock-search-panel.js` | TESTS | Renderer mock search panel slice verification |
| `renderer-bookmark-flow.js` | TESTS | Renderer bookmark flow slice verification |
| `bookmark-write-read-render-loop.js` | TESTS | Bookmark write/read/render loop verification |
| `app-search-flow.test.jsx` | TESTS | Vitest/jsdom UI test suite (35 tests); covers audio, bookmarks, search, timeline marker behavior |
| `e2e/` | TESTS | Playwright e2e test specs for the Electron desktop app |

---

## `scripts/` — Detail

| File | Classification | Purpose |
|---|---|---|
| `check-handoff-contract.js` | SOURCE | Script to run handoff contract verification outside the main CLI |
| `playwright-electron-main.cjs` | SOURCE | Helper for launching Electron in Playwright test runs |

---

## `sandbox/` — Detail

| Folder/File | Classification | Purpose |
|---|---|---|
| `current/` | SANDBOX | GUID artifacts in active use; four `.json` files present |
| `expectations/` | SANDBOX | Expected output files for sandbox fixture verification (scan, propose, discover, search results) |
| `fixtures/` | SANDBOX | Test fixture directories used by scan, propose, discover, search, and verify commands |
| `fixtures/basic-mixed/` | SANDBOX | Mixed-type flat fixture (audio, design, image, text) |
| `fixtures/mixed-flat-small/` | SANDBOX | Small mixed-type flat fixture |
| `fixtures/nested-anchor-trial/` | SANDBOX | Fixture with nested `.consync` anchor folders representing real creative project structure |
| `fixtures/nested-mixed/` | SANDBOX | Nested directory structure with mixed file types |
| `fixtures/single-type-flat/` | SANDBOX | Flat fixture with single file type (images) |
| `fixtures/audio/` | SANDBOX | Audio-only fixture files |
| `probes/` | SANDBOX | Probe experiments; standalone scripts and working directories outside the main command surface |
| `probes/audio-session-capture/` | SANDBOX | Probe for audio session capture behavior; has its own `workdir/` with real session artifacts |

---

## `dev-harness/` — Detail

**Removed** in `cleanup-remove-dev-harness-v1` (2026-04-26). Was an MCP-style local HTTP tool server (whiteboard read/write) with no active references, no real content, and no product dependency.

---

## `test-results/` — Detail

| File | Classification | Purpose |
|---|---|---|
| `.last-run.json` | BUILD | Playwright last test run status; generated artifact; shows `"status": "passed"` |

---

## `node_modules/` and `.vite/`

| Folder | Classification | Purpose |
|---|---|---|
| `node_modules/` | DEPS | Installed dependencies; managed by npm; not tracked in git |
| `.vite/` | BUILD | Vite build output; generated at build time; not tracked in git |

---

## Cleanup Review

The following items are unclear, potentially redundant, generated, stale, or possibly unnecessary.

---

### `.DS_Store` files (root, `.consync/`, `sandbox/fixtures/`, etc.)

- **Current observed purpose:** macOS Finder metadata; auto-generated by the OS.
- **Why removable:** Not project content; no functional purpose in the repo. Multiple instances present throughout the tree.
- **Recommendation:** REMOVE CANDIDATE
- **Risk:** None. These are OS artifacts. `.gitignore` should already or could easily exclude them.

---

### `dev-harness/server.js` and `dev-harness/artifacts/whiteboard.md`

**Removed.** Executed in `cleanup-remove-dev-harness-v1` (2026-04-26). See `Deferred Cleanup Review (v1)` for findings.

---

### `dev-harness/fixtures/` (empty folder)

**Removed.** Executed in `cleanup-execution-safe-removals-v1` (2026-04-26).

---

### `.consync/notes/refactor-notes-from-chatgpt.md` and `.consync/notes/image.png`

**Removed.** Executed in `cleanup-remove-consync-notes-v1` (2026-04-26). The `inferStreamFromRequest` bug described in those notes was confirmed fixed in `src/lib/gatekeeperMount.js` before removal. See `Deferred Cleanup Review (v1)` for findings.

---

### `.consync/docs/03_work-log.md` and `.consync/docs/04_next-steps.md`

- **Current observed purpose:** These appear to be copies or older versions of numbered artifacts that live in `.consync/artifacts/`. The authoritative numbered artifacts are `01_current-direction.md` through `05_marker-capture.md` in `.consync/artifacts/`.
- **Why it might be removable:** The presence of similarly-named files in both `docs/` and `artifacts/` creates ambiguity about which is authoritative.
- **Why it should remain:** Not inspected deeply enough to confirm they are exact duplicates; they may contain different or more current content.
- **Recommendation:** REVIEW
- **Risk:** Low if confirmed to be outdated duplicates. A human should compare them against their `artifacts/` counterparts before removing.

---

### `.consync/artifacts/marker-capture-resume.md`

- **Current observed purpose:** A resume context file for the marker capture feature, explicitly noting the feature is defined but not implemented.
- **Why it might be removable:** If marker capture has since been implemented or superseded, this resume context is stale. If it has not been implemented, it is a valid resume anchor.
- **Recommendation:** REVIEW
- **Risk:** Low either way. Keeping a stale resume anchor is low harm; removing an active one could lose context.

---

### `.consync/artifacts/archive/`

- **Current observed purpose:** Archived conceptual and system documents from earlier development phases (conceptual foundations, state hierarchy, trust boundaries, feature map, guid rules, early next-targets).
- **Why it might be removable:** These are historical; current architecture and rules are described in the live `.consync/docs/` surface. They may no longer accurately describe the current system.
- **Why it should remain:** They provide historical context for why certain decisions were made. Archive material has low practical daily cost.
- **Recommendation:** KEEP (archive is intentional; no action needed unless a cleanup pass specifically targets historical docs)
- **Risk:** Low. These files are not referenced by any runtime code or active process.

---

### `.consync/streams/process/history/` and `.consync/streams/electron_ui/history/` (both empty)

- **Current observed purpose:** Empty folders. Intended as append-only archive directories for stream history, per the README pattern in `.consync/state/history/`.
- **Why it might be removable:** Empty; no content.
- **Why it should remain:** They are scaffolded placeholders for a defined future use. Removing them would require recreating them before the stream history mechanism is used.
- **Recommendation:** KEEP
- **Risk:** None to keep. Removing them is also low risk but eliminates a named structure.

---

### `test-results/` folder and `.last-run.json`

- **Current observed purpose:** Generated by Playwright after an e2e run. Records last run status.
- **Why it might be removable:** It is generated output, not source. Should be in `.gitignore`.
- **Recommendation:** REVIEW (check `.gitignore`; if not already excluded, add it)
- **Risk:** None to the system. These are generated artifacts.

---

### `.consync/packets/` folder

- **Current observed purpose:** Contains two generated handoff review packets from 2026-04-21. These appear to be intermediate output artifacts from the packet generation workflow.
- **Why it might be removable:** These are point-in-time artifacts and may not need indefinite retention. The canonical state is always `.consync/state/`.
- **Why it should remain:** They serve as a paper trail for specific handoff moments, consistent with the Consync append-only, traceability-first approach.
- **Recommendation:** KEEP (consistent with the project's traceability model; not a cleanup target)
- **Risk:** Low either way.

---

### `.consync/docs/work-manager-agent.md`

- **Current observed purpose:** A concept document for a future Work Manager Agent. The file itself states it is a concept and does not implement anything.
- **Why it might be removable:** If the Work Manager Agent concept has been superseded or absorbed into the existing agent model, this doc may be stale.
- **Why it should remain:** It is an explicit concept document, not a stale process doc. Its value is as a future design anchor.
- **Recommendation:** KEEP (intentional concept doc; low cost)
- **Risk:** None.

---

### `sandbox/probes/audio-session-capture/workdir/` (contains real session artifacts and media files)

- **Current observed purpose:** Working directory for the audio session capture probe. Contains real `.consync/sessions/` JSON artifacts (14 session files from 2026-04-12) and actual audio media files.
- **Why it should remain:** These are valid generated artifacts from a probe run; they demonstrate the session capture behavior and serve as observed reference data.
- **Recommendation:** KEEP
- **Risk:** Low. These are probe artifacts and media used for development verification.

---

## Uncertain Areas

1. ~~**`dev-harness/`**~~ — **Resolved.** Removed in `cleanup-remove-dev-harness-v1` (2026-04-26).

2. ~~**`.consync/notes/`**~~ — **Resolved.** Removed in `cleanup-remove-consync-notes-v1` (2026-04-26).

3. ~~**`inferStreamFromRequest` latent bug**~~ — **Resolved.** Bug was confirmed fixed in `src/lib/gatekeeperMount.js` (word-boundary matching for short signals). Notes removed after confirmation.

4. **Duplicate numbered files in `.consync/docs/` vs `.consync/artifacts/`** — `03_work-log.md` and `04_next-steps.md` appear in `docs/` but the numbered artifact sequence belongs in `artifacts/`. Whether these are exact duplicates or have diverged is not confirmed.

5. **`.consync/templates/portable/`** — This folder scaffolds a portable template output. It is referenced by the `portable` command in `src/commands/portable.js`. Its relationship to `.github/prompts/` content is structural (the template includes GitHub prompt files). This is observed fact, not a problem — noted because the nesting may look surprising on first read.

---

## Cleanup Decisions (v1)

Captured: 2026-04-26

These decisions convert the Cleanup Review above into explicit, deliberate choices. Nothing has been deleted or moved as part of this document. Decisions here describe intended actions, not completed ones.

Additional fact available at decision time: `.gitignore` already excludes `.DS_Store`, `node_modules/`, `.vite/`, `test-results/`, `sandbox/current/*.json`, `.consync/packets/`, `.consync/state/history/`, and `*.mp3`. This informs several decisions below.

---

### Immediate Safe Removals

Items confirmed safe to remove. No source code, no active process content, no live references.

---

**`.DS_Store` files — all instances**

- Path: `./.DS_Store`, `./.consync/.DS_Store`, `./sandbox/fixtures/.DS_Store`, `./sandbox/fixtures/nested-anchor-trial/2026/april/balcony-zine/.DS_Store`, `./sandbox/fixtures/nested-anchor-trial/2026/april/greenhouse-poster/.DS_Store`, `./sandbox/probes/audio-session-capture/.DS_Store`, `./sandbox/probes/audio-session-capture/workdir/.DS_Store`, `./sandbox/probes/audio-session-capture/workdir/media/.DS_Store`
- Original Recommendation: REMOVE CANDIDATE
- Final Decision: **REMOVE**
- Reason: macOS Finder metadata. No project content. Already excluded by `.gitignore`. These files should not be in git at all.
- Risk Confirmation: Zero risk. OS metadata only. No code or process depends on them.

---

**`dev-harness/fixtures/` (empty folder)**

- Path: `./dev-harness/fixtures/`
- Original Recommendation: REMOVE CANDIDATE
- Final Decision: **REMOVE**
- Reason: Empty folder. No files, no references, no observed purpose.
- Risk Confirmation: Near zero. An empty folder has no consumers. If `dev-harness/` is later used, a new `fixtures/` can be recreated trivially.

---

### Deferred Review Items

Items that require human judgment before action. Not safe to remove without verification.

---

**`dev-harness/server.js` and `dev-harness/artifacts/whiteboard.md`**

- Path: `./dev-harness/server.js`, `./dev-harness/artifacts/whiteboard.md`
- Original Recommendation: REVIEW
- Final Decision: **REMOVE** *(updated after deferred review)*
- Executed: `cleanup-remove-dev-harness-v1` (2026-04-26)
- Outcome: Entire `dev-harness/` folder removed. No references found.

---

**`.consync/notes/refactor-notes-from-chatgpt.md` and `.consync/notes/image.png`**

- Path: `./.consync/notes/refactor-notes-from-chatgpt.md`, `./.consync/notes/image.png`
- Original Recommendation: REVIEW
- Final Decision: **REMOVE** *(updated after deferred review)*
- Executed: `cleanup-remove-consync-notes-v1` (2026-04-26)
- Outcome: `.consync/notes/` folder removed. Bug confirmed fixed before removal.

---

**`.consync/docs/03_work-log.md` and `.consync/docs/04_next-steps.md`**

- Path: `./.consync/docs/03_work-log.md`, `./.consync/docs/04_next-steps.md`
- Original Recommendation: REVIEW
- Final Decision: **DEFER**
- Reason: Possible duplicates of numbered artifacts in `.consync/artifacts/`. Content not confirmed identical. A human should compare before removing.
- Risk Confirmation: Low. Ambiguity is the cost of keeping both; information loss is the cost of removing the wrong one.

---

**`.consync/artifacts/marker-capture-resume.md`**

- Path: `./.consync/artifacts/marker-capture-resume.md`
- Original Recommendation: REVIEW
- Final Decision: **DEFER**
- Reason: Feature is defined but not implemented. Status of implementation is not confirmed.
- Risk Confirmation: Low to defer. Keeping a stale resume anchor is harmless. Removing an active one loses context.

---

### Intentional Keeps

Items reviewed and confirmed to stay as-is.

---

**`.consync/artifacts/archive/`** — KEEP. Intentional historical archive. Low cost. No runtime or process dependency.

**`.consync/streams/process/history/` and `.consync/streams/electron_ui/history/`** — KEEP. Scaffolded placeholders for a defined future use.

**`.consync/packets/`** — KEEP. Append-only paper trail. Already gitignored. Consistent with traceability model.

**`.consync/docs/work-manager-agent.md`** — KEEP. Explicit concept doc. No process or runtime dependency.

**`sandbox/probes/audio-session-capture/workdir/`** — KEEP. Valid probe reference data. Already gitignored.

---

## Deferred Cleanup Review (v1)

Captured: 2026-04-26

This section records the findings from inspecting each deferred item. Content was read; no files were deleted, moved, merged, or renamed.

---

### `dev-harness/server.js` and `dev-harness/artifacts/whiteboard.md`

**Observed content:**
- `server.js` is a small HTTP server listening on port 3000. It exposes two tool calls over JSON POST: `read_whiteboard` and `append_whiteboard`. Both operate on `artifacts/whiteboard.md`.
- `artifacts/whiteboard.md` contains only the default stub template text. No real content has been appended.

**References from rest of repo:** None. `grep` across `src/`, `scripts/`, and `package.json` finds no reference to `dev-harness`, `server.js`, or `whiteboard`.

**Assessment:** This is an MCP-style tool server stub — a local HTTP endpoint that exposes whiteboard read/write as tool calls, likely built as an early experiment for AI tool access to a shared scratch surface. It was never wired into any script, test, or build path, and the whiteboard has never been used. The `artifacts/` folder exists only to hold `whiteboard.md`.

**Classification:** REMOVE CANDIDATE

**Reason:** No references, no real content, no active use observed. The entire `dev-harness/` folder is inert.

**Risk of removal:** Low. Nothing in the product, tests, or process depends on it. If a similar tool server is needed later, it can be rebuilt from scratch in minutes.

**Recommended next packet:** `remove_dev_harness_folder` — remove `dev-harness/` entirely (server.js, artifacts/whiteboard.md, and the dev-harness folder itself). Docs-only confirm first, then a one-step removal.

---

### `.consync/notes/refactor-notes-from-chatgpt.md` and `.consync/notes/image.png`

**Observed content:**
- The notes file contains a ChatGPT session summary with a checkpoint of gatekeeper implementation state, a Copilot summary of `git status`, and a latent bug note: `inferStreamFromRequest` uses `"ui"` as a plain substring signal, which false-positives on words like `"guid"`, `"build"`, `"suite"`. The note says the fix is deferred to a separate package.
- `image.png` is referenced as `![summary](image.png)` at the top of the notes file. It is likely a screenshot from the ChatGPT session.

**Bug status check:** `inferStreamFromRequest` still exists in `src/lib/gatekeeperMount.js`. Inspecting the current implementation shows the fix **has been applied**: the function now uses a `wordBoundarySignals` set and applies word-boundary matching for short signals like `"ui"`. The bug noted in these scratch notes is resolved in the current source.

**Assessment:** The latent bug has been fixed. The notes file's only non-trivial content — the bug note — is no longer live. The rest of the file is an ad-hoc session checkpoint that has no ongoing value. The image is meaningful only in the context of those notes.

**Classification:** REMOVE CANDIDATE

**Reason:** The bug described in the notes is confirmed fixed in `src/lib/gatekeeperMount.js`. The notes file is scratch material with no ongoing process value. The `.consync/notes/` folder has no defined process role and is not referenced by any process doc, runbook, or agent definition.

**Risk of removal:** Low. The bug is fixed. No process or runtime dependency on this folder. Removing it does not affect any test, build, or system behavior.

**Recommended next packet:** `remove_consync_notes_folder` — remove `.consync/notes/refactor-notes-from-chatgpt.md`, `.consync/notes/image.png`, and the `.consync/notes/` folder. One-step removal.

---

### `.consync/docs/03_work-log.md` and `.consync/docs/04_next-steps.md`

**Observed content:**

`.consync/docs/03_work-log.md` — This is a **live, actively updated work log** in the `docs/` surface. It contains detailed entries for recent completed packages including e2e test coverage work from 2026-04-26. Each entry records packet ID, summary, files changed, tests run, friction notes, and decisions. This is the work log that active development entries are being written to.

`.consync/docs/04_next-steps.md` — This contains near-term package candidates and horizon notes for the audio workflow. It is brief and forward-looking.

`.consync/artifacts/03_work-log.md` — The `artifacts/` version is an **older, shorter work log** from an earlier phase of the project (unified handoff workflow, list-guid, show-guid commands). It predates the e2e coverage work.

**Assessment:** These are **not duplicates**. They serve different purposes:

- `.consync/docs/03_work-log.md` is the **current active work log**, actively appended by development workflows. It is the live record.
- `.consync/artifacts/03_work-log.md` is an **older artifact-level log** from the early CLI feature phase. It has not been updated recently.
- `.consync/docs/04_next-steps.md` contains planning candidates that do not appear in the artifacts surface.

The numbered prefix naming (`03_`, `04_`) creates visual ambiguity between `docs/` and `artifacts/`, but the contents are distinct and both have value.

**Classification:** KEEP both; rename or re-clarify the relationship if ambiguity becomes a problem.

**Reason:** `.consync/docs/03_work-log.md` is actively used. `.consync/artifacts/03_work-log.md` is historical. Neither is a duplicate of the other. Removing either would lose content.

**Risk of removal:** Medium for `docs/03_work-log.md` — it is the live work log. Low for `artifacts/03_work-log.md` — it is historical, but still records real completed work from the early phase.

**Recommended next packet:** None required for removal. If the numbered-prefix ambiguity is confusing, a future `clarify_work_log_naming` docs packet could rename or cross-reference them. Not urgent.

---

### `.consync/artifacts/marker-capture-resume.md`

**Observed content:** States that the marker capture feature (`05_marker-capture.md`) is defined but not implemented. Identifies the next step as implementing the `mark` command only. Includes mental model constraints and a target interaction example (`m "note here"`).

**Implementation status check:** `grep` across `src/commands/` and `src/index.js` finds no `mark` command, no reference to `marker-capture`, and no reference to `05_marker`. The feature has **not been implemented**.

**Assessment:** The resume context is **still accurate**. The marker capture feature is defined in `.consync/artifacts/05_marker-capture.md` and has not been implemented. `marker-capture-resume.md` is a valid, live resume anchor for that deferred feature.

**Classification:** KEEP

**Reason:** The feature it describes is still pending. The file accurately represents current state. Removing it would lose the resume context for a defined but unstarted feature.

**Risk of removal:** Low-medium. Removes the only explicit resume anchor for the marker capture feature. The feature definition in `05_marker-capture.md` would remain, but the scoped implementation guidance would be gone.

**Recommended next packet:** None for cleanup. When the marker capture feature is ready to implement, this file is the correct starting point. After implementation, it can be archived or removed as part of that package's closeout.
- Reason: These files share names with the numbered artifact sequence in `.consync/artifacts/`. Whether they are stale duplicates or have diverged in content is not confirmed. A human should compare them against their `artifacts/` counterparts and decide which to keep.
- Risk Confirmation: Low risk to defer. Keeping both creates minor ambiguity but no system failure. Removing without confirming content match risks losing information.

---

**`.consync/artifacts/marker-capture-resume.md`**

- Path: `./.consync/artifacts/marker-capture-resume.md`
- Original Recommendation: REVIEW
- Final Decision: **DEFER**
- Reason: The file explicitly states marker capture is defined but not yet implemented. Whether this is still the accurate state — or whether the feature was implemented, deferred, or dropped — is not confirmed from inspection alone.
- Risk Confirmation: Low risk to defer. Keeping a stale resume anchor is low harm. A human should confirm the current status of the marker capture feature before removing this.

---

**`test-results/` folder and `.last-run.json`**

- Path: `./test-results/.last-run.json`
- Original Recommendation: REVIEW (check `.gitignore`)
- Final Decision: **DEFER** (already handled by `.gitignore`; action is low priority)
- Reason: `.gitignore` already excludes `test-results/`. The folder and its contents are not tracked in git. No active cleanup action is needed. The only remaining question is whether the folder itself should be in a `.gitkeep` state or simply left as a generated output.
- Risk Confirmation: Already gitignored. No git or system risk. Deferring any further action as a low-priority housekeeping item only.

---

### Intentional Keeps

Items reviewed and confirmed to stay as-is. No action needed.

---

**`.consync/artifacts/archive/`**

- Path: `./.consync/artifacts/archive/`
- Original Recommendation: KEEP
- Final Decision: **KEEP**
- Reason: Intentional archive of conceptual and system documents from earlier phases. Provides historical context without creating noise in the live process surface.
- Risk Confirmation: No runtime or process dependency. Low daily cost. Removing historical context is harder to undo than keeping it.

---

**`.consync/streams/process/history/` and `.consync/streams/electron_ui/history/`**

- Path: `./.consync/streams/process/history/`, `./.consync/streams/electron_ui/history/`
- Original Recommendation: KEEP
- Final Decision: **KEEP**
- Reason: Scaffolded placeholders for stream history. The README pattern in `.consync/state/history/` documents this convention. Empty now, but removing them would require recreating them before the mechanism is used.
- Risk Confirmation: No cost to keep. These are intentional structural placeholders.

---

**`.consync/packets/`**

- Path: `./.consync/packets/`
- Original Recommendation: KEEP
- Final Decision: **KEEP**
- Reason: Append-only packet paper trail. Consistent with the Consync traceability model. Already excluded from git tracking by `.gitignore`, which means these are local-only artifacts — a deliberate choice.
- Risk Confirmation: Already gitignored. No git bloat. Keeping is consistent with the project's local-first, audit-trail-friendly approach.

---

**`.consync/docs/work-manager-agent.md`**

- Path: `./.consync/docs/work-manager-agent.md`
- Original Recommendation: KEEP
- Final Decision: **KEEP**
- Reason: Explicit concept document. The file itself marks it as a concept. Low cost; preserves a future design anchor.
- Risk Confirmation: No process or runtime dependency. Does not pollute the live process surface.

---

**`sandbox/probes/audio-session-capture/workdir/`**

- Path: `./sandbox/probes/audio-session-capture/workdir/`
- Original Recommendation: KEEP
- Final Decision: **KEEP**
- Reason: Contains real session artifacts and audio media from a probe run. Demonstrates observed system behavior. Already excluded from git tracking by `.gitignore`.
- Risk Confirmation: Already gitignored. Kept as local-only probe reference data.
