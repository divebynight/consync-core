# Consync Reference Audit

## Status

PASS

## Summary

Audited all references to `.consync/` across the repo:
- `src/` runtime commands, libs, and tests
- `scripts/`
- `.github/` prompts and agents
- Root-level docs (`README.md`, `AGENTS.md`)

Date: 2026-05-02  
Branch: `feature/product-design-electron`  
Context: Post-commit of `scaffoldai-consync-separation.contract.md` and `bridge-ownership.contract.md`

**Key finding:** Every runtime code path that hardcodes a `.consync/` location reads or writes exclusively from `.consync/state/` or `.consync/streams/` — both classified as **BRIDGE**. Zero runtime code reads `.consync/process/`, `.consync/agents/`, `.consync/skills/`, `.consync/contracts/`, or `.consync/templates/` at runtime. The PROCESS zone is entirely safe to relocate without touching any runtime code.

---

## Classification Table

| File | Role | Reference Type | Notes | Migration Risk |
|---|---|---|---|---|
| `src/commands/system-check.js` | BRIDGE | Runtime read | Reads `.consync/state/handoff.md` via file existence check | HIGH |
| `src/commands/dry-run-check.js` | BRIDGE | Runtime read | Reads `.consync/state/active-contract.json` | HIGH |
| `src/commands/consync-run.js` | BRIDGE | Runtime read | Reads `.consync/state/active-contract.json` | HIGH |
| `src/commands/handoff-bundle.js` | BRIDGE + PROCESS | Runtime read | Reads `.consync/state/handoff.md`, `snapshot.md` (BRIDGE); reads `runbook.process.md` path as content (PROCESS pointer, not logic) | HIGH (state paths); LOW (runbook path is content string) |
| `src/lib/getInFlightPacket.js` | BRIDGE | Runtime read | Hardcodes `.consync/state/next-action.md` as a constant | HIGH |
| `src/lib/gatekeeperMount.js` | BRIDGE | Console output | Prints `.consync/state/` and `.consync/streams/` paths as operator instructions; no file reads | LOW |
| `src/lib/gatekeeperSwitch.js` | BRIDGE | Runtime write + console | Writes to `.consync/state/active-stream.md`, `handoff.md`, `next-action.md`, `snapshot.md`; console.log for stream paths | HIGH (write paths); LOW (console output) |
| `src/lib/gatekeeperClose.js` | BRIDGE | Console output | Prints `.consync/state/` and `.consync/streams/` paths as operator instructions; no file reads | LOW |
| `src/lib/gatekeeperDecision.js` | PROCESS | Comment only | `@see .consync/agents/gatekeeper.agent.md` — doc comment, not a file read | NONE |
| `src/lib/intakeClassify.js` | MIXED | Data strings | `.consync/process/`, `.consync/agents/`, `.consync/docs/`, `.consync/state/` appear as classification pattern strings — not filesystem reads | LOW (strings only) |
| `src/commands/reference-audit.js` | MIXED | Config strings | REFERENCE_CATEGORIES lists all `.consync/` zones as search needles and expected-zone strings; no file reads at import | LOW–MEDIUM (zone names must stay correct if audit command runs) |
| `src/commands/reentry-check.js` | BRIDGE | Console output | Prints `.consync/state/` as a reviewer instruction; no file read | LOW |
| `src/test/state-integrity-checks.js` | BRIDGE | Test assertions | Hardcodes `.consync/state/*` and `.consync/streams/process/stream.md`, `electron_ui/stream.md`; reads file content | HIGH |
| `src/test/bridge-integrity-checks.js` | BRIDGE | Test assertions | Hardcodes `.consync/state/*`, `.consync/streams/process/stream.md`, `electron_ui/stream.md`; reads and parses file content | HIGH |
| `scripts/check-handoff-contract.js` | BRIDGE | Runtime read | Reads `.consync/state/next-action.md` and `.consync/state/handoff.md` | HIGH |
| `README.md` | DOCS | Navigation link | Links to `.consync/process/` docs and `.consync/examples/`; no code path | LOW |
| `AGENTS.md` | DOCS | Navigation text | References `.consync/agents/`, `.consync/skills/`, `.consync/state/`; no code path | LOW |
| `.github/copilot-instructions.md` | DOCS (adapter) | Orientation text | References multiple `.consync/` zones as authority boundaries; no code path | LOW |
| `.github/prompts/run_closeout.prompt.md` | BRIDGE + PROCESS | Prompt file read | AI prompt reads `.consync/state/handoff.md` (BRIDGE) and `.consync/skills/closeout-agent.md` (PROCESS) at prompt execution time | MEDIUM |
| `.github/prompts/run_next_action.prompt.md` | BRIDGE + PROCESS | Prompt file read | AI prompt reads `.consync/state/*` (BRIDGE) and `.consync/process/runbook.process.md` (PROCESS) | MEDIUM |
| `.github/agents/consync-integrity.agent.md` | BRIDGE | Agent instruction | References `.consync/streams/` and `.consync/state/active-stream.md` as orientation context; no code path | LOW |

---

## High-Risk References

These references are hardcoded in runtime code, tests, or scripts. Moving the referenced paths would cause immediate breakage.

### Runtime Commands

| Path | File | Notes |
|---|---|---|
| `.consync/state/active-contract.json` | `src/commands/dry-run-check.js` (line 6) | Hardcoded constant; read at command invocation |
| `.consync/state/active-contract.json` | `src/commands/consync-run.js` (line 7) | Hardcoded constant; read at command invocation |
| `.consync/state/handoff.md` | `src/commands/system-check.js` (line 24) | Existence probe; system-check fails if absent |
| `.consync/state/handoff.md` + `snapshot.md` | `src/commands/handoff-bundle.js` (lines 4–6) | Both read as bundle content |
| `.consync/state/next-action.md` | `src/lib/getInFlightPacket.js` (line 4) | Constant; parsed to extract in-flight packet |

### Runtime Libs

| Path | File | Notes |
|---|---|---|
| `.consync/state/active-stream.md` | `src/lib/gatekeeperSwitch.js` | Written during stream switch |
| `.consync/state/handoff.md` | `src/lib/gatekeeperSwitch.js` | Written during stream switch |
| `.consync/state/next-action.md` | `src/lib/gatekeeperSwitch.js` | Written during stream switch |
| `.consync/state/snapshot.md` | `src/lib/gatekeeperSwitch.js` | Written during stream switch |

### Tests

| Path | File | Notes |
|---|---|---|
| `.consync/state/active-stream.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content validated |
| `.consync/state/active-contract.json` | `src/test/bridge-integrity-checks.js` | Parsed as JSON |
| `.consync/state/next-action.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content validated |
| `.consync/state/handoff.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content validated (×6 locations) |
| `.consync/state/snapshot.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content read and validated |
| `.consync/streams/process/stream.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content read and validated |
| `.consync/streams/electron_ui/stream.md` | `src/test/state-integrity-checks.js`, `bridge-integrity-checks.js` | Content read and validated |

### Scripts

| Path | File | Notes |
|---|---|---|
| `.consync/state/next-action.md` | `scripts/check-handoff-contract.js` (line 6) | Read via `path.join` |
| `.consync/state/handoff.md` | `scripts/check-handoff-contract.js` (line 7) | Read via `path.join` |

**All high-risk references are exclusively in the BRIDGE zone** (`.consync/state/` and `.consync/streams/`). No runtime code reads any PROCESS zone path.

---

## Low-Risk References

These references appear in documentation, navigation text, orientation comments, or console output strings. They do not affect runtime execution but would mislead operators if stale after a migration.

| File | Zone Referenced | Risk if stale |
|---|---|---|
| `README.md` | `.consync/process/`, `.consync/examples/` | Operator confusion only |
| `AGENTS.md` | `.consync/agents/`, `.consync/skills/`, `.consync/state/` | Operator confusion only |
| `.github/copilot-instructions.md` | Multiple `.consync/` zones | Copilot session orientation; operator confusion only |
| `.github/agents/consync-integrity.agent.md` | `.consync/streams/`, `.consync/state/` | Agent instruction; operator confusion only |
| `src/lib/gatekeeperMount.js` (console output) | `.consync/state/`, `.consync/streams/` | Misleading operator output, not a file read |
| `src/lib/gatekeeperClose.js` (console output) | `.consync/state/`, `.consync/streams/` | Misleading operator output, not a file read |
| `src/lib/gatekeeperSwitch.js` (console output) | `.consync/state/`, `.consync/streams/` | Misleading operator output, not a file read |
| `src/lib/gatekeeperDecision.js` (comment) | `.consync/agents/gatekeeper.agent.md` | Doc comment only; zero runtime impact |
| All `.consync/process/` cross-references | `.consync/` internal | Internal doc navigation; no code impact |
| All `.consync/docs/` cross-references | `.consync/` internal | Internal doc navigation; no code impact |

---

## Mixed / Ambiguous References

These require human review before any migration decision.

### `src/lib/intakeClassify.js`
- References `.consync/process/`, `.consync/agents/`, `.consync/docs/`, `.consync/state/` as **string values** in a classification dictionary (not filesystem reads).
- Used to map incoming prompts to target surfaces.
- **Decision needed:** If PROCESS zone migrates to `.scaffoldai/`, these strings must be updated. Not a breaking change (no file read), but the classification model would become stale.

### `src/commands/reference-audit.js`
- Contains `REFERENCE_CATEGORIES` with all `.consync/` zone paths as search needle strings and expected-zone strings.
- This is the runtime reference-audit command. If zones move, the audit command's results become misleading (it would no longer detect out-of-zone references correctly).
- **Decision needed:** This command should be updated in the same migration packet that moves any zone.

### `.github/prompts/run_closeout.prompt.md` and `run_next_action.prompt.md`
- Mix BRIDGE references (`.consync/state/handoff.md`) with PROCESS references (`.consync/skills/closeout-agent.md`, `runbook.process.md`).
- These are AI execution prompts — they are "read" by a language model at invocation time, not by Node.js. Breaking the PROCESS path would cause the prompt to fail to load the skill file, but would not crash any Node.js command.
- **Decision needed:** If PROCESS zone moves to `.scaffoldai/`, these prompts need updating before they can function correctly.

---

## Zone Classification Summary

| `.consync/` Zone | Semantic Role | Runtime Code Dependency | Migration Complexity |
|---|---|---|---|
| `state/` | BRIDGE | HIGH — read/written by 5+ commands, libs, tests, scripts | High; must migrate together with all consumers |
| `streams/` | BRIDGE | HIGH — read/validated by tests and switch logic | High; same as state/ |
| `process/` | PROCESS | NONE — no runtime code reads this | Low; pure doc migration |
| `agents/` | PROCESS | NONE (comment ref only in gatekeeperDecision.js) | Low |
| `skills/` | PROCESS | NONE runtime; MEDIUM via .github/ prompts | Low–Medium |
| `contracts/` | PROCESS | NONE | Low |
| `templates/` | PROCESS | NONE (portableScaffold.js has no .consync/ refs) | Low |
| `prompts/` | PROCESS | NONE | Low |
| `verification/` | PROCESS | NONE | Low |
| `planning/` | PROCESS | NONE | Low |
| `docs/` | DOCS | NONE | Low |
| `product/` | PRODUCT | NONE | Low |
| `examples/` | DOCS | NONE | Low |
| `archive/` | DOCS | NONE | Low |
| `quarantine/` | MISC | NONE | Low |
| `audits/` | PROCESS | NONE (this file) | Low |
| `packets/` | BRIDGE | NONE runtime; referenced in docs | Low |

---

## Suggested Next Safe Action

**Confirm bridge-ownership.contract.md accurately reflects the zone classification found here.**

Specifically, verify that `state/` and `streams/` are listed as BRIDGE in the contract, that `process/`, `agents/`, `skills/`, `contracts/`, `templates/`, and `prompts/` are listed as PROCESS/ScaffoldAI, and that `product/` is listed as PRODUCT/Consync. If the contract already matches this audit, the classification layer is complete and the repo is ready to begin planning the `.scaffoldai/` migration as a future intentional packet — not now.
