# System Integrity Snapshot

Captured: 2026-04-25 (updated 2026-04-26)
HEAD: `c76a3d8` — Align docs with manual agent invocation model

---

## Phase 2 Manual Agent System Snapshot

Captured: 2026-04-26

Current commit: `c76a3d8` — Align docs with manual agent invocation model

### Test / Verification Count

- Current packet verification command: `npm run verify`
- Current observed UI test count from `npm run verify`: 1 jsdom test file, 35 tests passing in `src/test/app-search-flow.test.jsx`
- e2e inventory: 20 Playwright spec files under `src/test/e2e/`
- Full e2e was not rerun for this docs-only snapshot packet.

### System Characteristics

- Consync uses manual, explicit agent invocation.
- The Entry Adapter is a manual classification layer that recommends one existing agent.
- A human invokes the recommended agent.
- No orchestrator, runner, dispatcher, automatic dispatch, or hidden agent pipeline exists.
- This snapshot records current behavior only; it does not describe future features.

### Current Agent List

| Agent | Current role |
|---|---|
| Preflight | Checks whether repo and process state are safe before work begins. |
| Intake | Classifies new work and its boundaries before execution. |
| Verify | Runs and reports verification evidence. |
| Closeout | Summarizes changed files, verification, risks, and commit readiness. |
| Reentry | Reconstructs context after interruption, stale state, or unclear handoff. |

### Entry Adapter

Input types:

- `new_work_request` -> Intake
- `before_repo_changes` -> Preflight
- `verification_evidence_request` -> Verify
- `closeout_commit_readiness` -> Closeout
- `stale_lost_context` -> Reentry

Output contract:

```text
STATUS: PASS | BLOCKED
INPUT_TYPE:
RECOMMENDED_AGENT:
REASON:
REQUIRED_HUMAN_ACTION:
```

Invocation rules:

- **MUST** return a classification and recommendation only.
- **MUST** recommend a single existing agent or return `BLOCKED`.
- **MUST NOT** execute, dispatch, or invoke the recommended agent.
- **SHOULD** be used when incoming input is ambiguous or the correct next agent is unclear.
- **MAY SKIP** when a human explicitly invokes a specific agent, command, or bound process surface.

### Directory Structure

- `.consync/agents/` is the source of truth for agent roles, invocation points, binding status, and the manual Entry Adapter.
- `.consync/skills/` contains reusable procedures/skills used by agents; it is not the primary role-definition surface.
- `.github/` remains an adapter layer only and is not canonical process truth.

### Recent Phase 2 Packets

| Packet | Outcome | Commit |
|---|---|---|
| Boundary normalization | COMPLETE | `952ab7b` |
| Entry Adapter definition | COMPLETE | `c0f5376` |
| Entry Adapter examples | COMPLETE | `153e198` |
| Entry Adapter real usage validation | COMPLETE | `90e459e` |
| Invocation rules | COMPLETE | `c76a3d8` |
| System alignment | COMPLETE | `c76a3d8` |

---

## Test Suite State

| Level | Command | Status |
|---|---|---|
| Unit + integration | `npm test` | ✅ PASS |
| e2e (Playwright/Electron) | `npx playwright test` | ✅ PASS |
| Full verify | `CI=true npm run verify:full` | ✅ PASS (last run: `477c74b`) |

**e2e test count:** 20 tests, 20 passing

---

## e2e Coverage by Surface

| Surface | Coverage |
|---|---|
| Audio load via Choose MP3 | ✅ Full |
| Hotkey marker creation (B) | ✅ Full |
| Empty marker creation | ✅ Full |
| Multiple markers (ordering) | ✅ Full |
| Marker delete | ✅ Full |
| Marker undo (Cmd+Z) | ✅ Full |
| Marker persistence after reload | ✅ Full |
| Audio path restoration after reload | ✅ Full |
| Native playback toggle | ✅ Smoke |
| Seek to marker | ✅ Full |
| File Notes | ✅ Full |
| Marker timestamp label accuracy | ✅ Full |
| Recent audio list | ✅ Full |
| Search panel navigation | ✅ Smoke |
| Search panel input + results | ✅ Full |
| Inspector panel empty state | ✅ Smoke |
| Inspector panel marker selection | ✅ Full |
| Inspector panel latest bookmark | ✅ Smoke |
| Timeline View default state | ✅ Smoke |
| Timeline View bookmark lane entry | ✅ Regression |
| Timeline View → Inspector sync | ✅ Regression |

---

## Process Docs in Place

| Doc | Purpose |
|---|---|
| `runbook.md` | Primary operator entry point |
| `current-system.md` | System architecture and state |
| `ai-context.md` | AI-first entry point for structured execution |
| `verification-ladder.md` | FAST_CHECK / UI_CHECK / FULL_VERIFY definitions |
| `feature-packet-execution.md` | Feature packet coordination layer |
| `feature-planning-and-packetization.md` | How to decompose features into packets |
| `production-change-packet-rules.md` | When and how packets may modify production code |
| `ui-e2e-coverage-map.md` | Living record of all e2e tests and surface coverage |
| `03_work-log.md` | Append-only record of completed work |
| `state-contracts-and-integrity-checks.md` | State transition and integrity rules |
| `handoff-delivery-bridge.md` | Package handoff contracts |
| `skills/closeout-agent.md` | Post-work closeout verification workflow |
| `skills/ingestion-gatekeeper.md` | External context classification workflow |
| `examples/search-panel-feature-example.md` | Canonical end-to-end feature packet example |

---

## Packet / Feature Workflow Status

All work through `477c74b` is committed and clean. No active packet is in progress.

| Feature / Packet | Outcome | Commit |
|---|---|---|
| Search panel e2e coverage (3 packets) | COMPLETE | `b486585` |
| Search panel feature example doc | COMPLETE | `022d3cb` |
| Feature planning and packetization doc suite | COMPLETE | `a71ca8b`, `e11565c` |
| README refactor + ai-context.md | COMPLETE | `535cef4`, `e6fae64` |
| Inspector panel empty state e2e | COMPLETE | `d1dc3c0` |
| Inspector marker selection behavior (production change) | COMPLETE | `dc37aee` |
| Inspector e2e coverage closeout | COMPLETE | `f789616` |
| Production change packet rules | COMPLETE | `a118a18` |
| System integrity snapshot (v1) | COMPLETE | `ef97f80` |
| Inspector latest bookmark e2e | COMPLETE | `4b051cf` |
| Timeline empty state e2e | COMPLETE | `d4e2d1e` |
| Timeline marker entry e2e | COMPLETE | `aed0b0c` |
| Timeline → Inspector sync (production change) | COMPLETE | `477c74b` |

---

## Known Weak Spots

| Area | Description |
|---|---|
| Active marker highlight | `bookmark-item-active` class applied during playback but not asserted in any test |
| Session sidebar | Current file, bookmark count, latest note — no e2e coverage |
| Timeline Session Events lane | Lane content is rendered but not asserted in any test |
| Search → Reveal in Finder | Post-match action path not tested in e2e |
| Recent audio persistence | Recent audio list is in-memory only; resets on full app restart |
| Full cold-start path | Audio and bookmark state after a complete process restart (not just window reload) not tested |
| Error states | Audio load error, session error panel — no e2e coverage |

---

## Recommended Next Feature Candidate

**Session sidebar smoke coverage** (current file label, bookmark count)

Rationale: The session sidebar shows the current file and bookmark count but has no e2e assertion. Low complexity, no production changes likely required, makes the main workspace state surface visible to the test suite.

Rationale: The Latest Bookmark inspector state is exercised implicitly in `inspector-marker-selection.spec.js` (before the marker click), but is not the named subject of any test. It is a core inspector render path and the gap is small — a single smoke spec would close it. This is a coverage-only packet with no production changes required.

Alternative: Session sidebar smoke coverage (current file label, bookmark count) — low complexity, no new production code, makes the workspace state surface visible to the test suite.

---
