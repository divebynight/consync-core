# Process Migration Preflight Audit

## Status

PASS — with one corrected finding

Date: 2026-05-02  
Branch: `feature/product-design-electron`  
Prior audit: `.consync/audits/consync-reference-audit.process.md`

---

## Summary

All PROCESS zone references across `src/`, `.github/`, `scripts/`, and markdown
surfaces have been identified and classified.

**Corrected finding from prior audit:**  
`src/commands/handoff-bundle.js` was previously classified as "LOW risk — runbook
path is content string." This is incorrect. The command calls
`readRequiredFile(RUNBOOK_PATH)` at runtime when `--full` is passed. This is a
**RUNTIME_CRITICAL** reference. It is covered by `integration-handoff-bundle-cli.js`,
which seeds and exercises the `--full` path. The test will fail clearly if the path
is not updated during migration. Migration must include both the command constant and
the test fixture path.

**Overall confidence:** HIGH. There are no unknown references. Every PROCESS zone
reference is classified. There is one RUNTIME_CRITICAL surface (handoff-bundle),
one MEDIUM-HIGH prompt surface (run_closeout.prompt.md `#file:` inclusion), and a
well-bounded set of doc/string surfaces.

---

## Reference Classification Table

| File | Reference | Classification | Covered by Tests | Migration Risk |
|---|---|---|---|---|
| `src/commands/handoff-bundle.js` | `.consync/process/runbook.process.md` (line 9 — RUNBOOK_PATH constant; read at runtime via `readRequiredFile`) | RUNTIME_CRITICAL | YES — `integration-handoff-bundle-cli.js` seeds and tests `--full` path | HIGH |
| `src/lib/intakeClassify.js` | `.consync/process/`, `.consync/agents/` (line 12 — classification pattern strings) | STRING_ONLY | YES — `unit-intake-run` tests classification flow, but does not assert zone strings specifically | LOW–MEDIUM |
| `src/commands/reference-audit.js` | `.consync/process/`, `.consync/agents/`, `.consync/skills/`, `.consync/templates/`, `.consync/contracts/` (lines 7–27 — search needle strings in REFERENCE_CATEGORIES) | STRING_ONLY | NO | LOW–MEDIUM |
| `src/lib/gatekeeperDecision.js` | `.consync/agents/gatekeeper.agent.md` (line 5 — `@see` doc comment) | DOC_ONLY | NO | NONE |
| `.github/prompts/run_closeout.prompt.md` | `.consync/skills/closeout-agent.md` (lines 6, 15, 28 — line 15 is a bare `#file:`-style path inclusion read by AI tool) | PROMPT_ONLY | NO | MEDIUM–HIGH |
| `.github/prompts/run_next_action.prompt.md` | `.consync/process/runbook.process.md` (line 4 — orientation reference) | PROMPT_ONLY | NO | MEDIUM |
| `.github/copilot-instructions.md` | `.consync/process/runbook.process.md`, `.consync/agents/`, `.consync/skills/`, `.consync/agents/entry-adapter.agent.md` (lines 7, 9, 11, 71) | PROMPT_ONLY | NO | MEDIUM |
| `.github/agents/consync-process.agent.md` | `.consync/process/` (line 23 — orientation text) | DOC_ONLY | NO | LOW |
| `README.md` | `.consync/process/` (lines 62, 69, 70, 83, 85 — navigation links) | DOC_ONLY | NO | LOW |
| `README.md` | `.consync/agents/`, `.consync/skills/` (line 85 — orientation text) | DOC_ONLY | NO | LOW |
| `AGENTS.md` | `.consync/agents/`, `.consync/skills/` (lines 8, 9, 15, 17, 18 — authority boundary text) | DOC_ONLY | NO | LOW |
| `.consync/docs/START_HERE.md` | `.consync/process/`, `.consync/agents/`, `.consync/skills/`, `.consync/contracts/`, `.consync/templates/`, `.consync/verification/`, `.consync/planning/` (lines 40–120 — navigation table, ~20 path references) | DOC_ONLY | NO | MEDIUM |
| `.consync/docs/docs-surface-map.md` | All PROCESS zones (lines 34–134 — full surface inventory table, ~40+ path references) | DOC_ONLY | NO | MEDIUM |
| `.consync/process/runbook.process.md` | Internal cross-links to other process docs, agents, skills, contracts (lines 14, 26–27, 87–88, 272–283) | DOC_ONLY (internal) | NO | LOW |
| `.consync/process/production-change-packet-rules.process.md` | Cross-links to templates, verification, process docs (lines 74, 98, 100, 104–105, 135–137) | DOC_ONLY (internal) | NO | LOW |
| `.consync/process/feature-planning-and-packetization.process.md` | Cross-link to `.consync/process/production-change-packet-rules.md` (line 237) | DOC_ONLY (internal) | NO | LOW |
| `.consync/templates/work-packet-v3.md` | Cross-links to process, skills, verification (lines 87, 124, 194–196) | DOC_ONLY (internal) | NO | LOW |
| `.consync/skills/closeout-agent.md` | Cross-links to `.consync/process/work-log.log.md` (lines 41, 66) | DOC_ONLY (internal) | NO | LOW |
| `.consync/skills/ingestion-gatekeeper.md` | Cross-links to `.consync/planning/`, `.consync/process/work-log.log.md` (lines 45, 53, 57, 61, 106–107) | DOC_ONLY (internal) | NO | LOW |

---

## Coverage Gaps

References not covered by automated tests but likely to affect behavior if stale:

### MEDIUM–HIGH

**`.github/prompts/run_closeout.prompt.md` line 15**  
`./consync/skills/closeout-agent.md` — This is a bare file path on its own line,
consistent with a Copilot `#file:` inclusion directive. If the file does not exist
at this path after migration, the AI closeout prompt will silently fail to load the
skill. There is no automated test for prompt file resolution. This is manually
verifiable: after migration, opening the closeout prompt in VS Code must resolve the
`#file:` path correctly.

### MEDIUM

**`.github/copilot-instructions.md`**  
Paths on lines 7, 9, 11, 71 are loaded into AI context on every Copilot session.
Stale paths would cause AI to reference a non-existent authority surface for every
interaction. No test coverage. Manually verifiable: verify after migration that
Copilot context loads the correct authority locations.

**`.consync/docs/START_HERE.md`** (~20 PROCESS path references)  
Primary operator entry point. Stale navigation links confuse both human operators
and AI tools that parse it as a context bootstrap. No test coverage.

**`.consync/docs/docs-surface-map.md`** (~40+ PROCESS path references)  
Used by agents as an inventory surface. One stale entry on line 35 already exists
(`entry-adapter.md` instead of `entry-adapter.agent.md`). Will require bulk path
update. No test coverage.

### LOW–MEDIUM

**`src/lib/intakeClassify.js`** — zone strings in classification dictionary  
Does not crash if stale. `unit-intake-run` tests classification outcomes (e.g.,
`CLASSIFICATION: process`) but does not assert the zone path strings specifically.
Stale strings degrade classification hints in the intake output without breaking
the command.

**`src/commands/reference-audit.js`** — zone needle strings in REFERENCE_CATEGORIES  
Does not crash if stale. However, running the `reference-audit` command post-migration
would produce misleading results (looking for `.consync/` paths that no longer exist
while missing `.scaffoldai/` occurrences). No dedicated test for this command.

---

## High-Risk Surfaces

Surfaces requiring careful handling and explicit update in the migration packet:

### 1. `src/commands/handoff-bundle.js` + `src/test/integration-handoff-bundle-cli.js`
**Risk: HIGH**  
`RUNBOOK_PATH = path.join(".consync", "process", "runbook.process.md")` is a
runtime file read. The integration test seeds a temp directory with this path and
exercises the `--full` code path. Both the command constant and the test fixture
must be updated atomically. If only one is updated, either the test fails or the
live command is broken. The test provides a clear verification gate: if the path
update is missed, `npm run verify` will fail.

### 2. `.github/prompts/run_closeout.prompt.md`
**Risk: MEDIUM–HIGH**  
Line 15 contains `.consync/skills/closeout-agent.md` as a likely `#file:` inclusion.
This is loaded by the AI tool at prompt execution time. No automated coverage. Must
be verified manually after migration by opening the prompt in VS Code and confirming
the file path resolves.

### 3. `.github/copilot-instructions.md`
**Risk: MEDIUM**  
Loaded into AI context on every Copilot chat session. References 4 PROCESS zone
paths as authority surfaces. Stale paths degrade all AI-assisted work for the
duration they remain uncorrected. Must be updated in the migration packet.

### 4. `.consync/docs/START_HERE.md`
**Risk: MEDIUM**  
~20 PROCESS zone path references. Primary navigation surface for human operators
and AI bootstrapping. Must be updated in the migration packet. Bulk find/replace
by path prefix is safe for this file.

### 5. `.consync/docs/docs-surface-map.md`
**Risk: MEDIUM**  
~40+ PROCESS zone path references. Full surface inventory. Already has one stale
reference (line 35: `entry-adapter.md` not `entry-adapter.agent.md`). Must be
updated in the migration packet. Note: this file also uses unsuffixed filenames in
some entries (e.g., `work-log.md` instead of `work-log.log.md`) — these are
pre-existing issues not caused by migration.

---

## Safe Surfaces

Surfaces that are low-risk, safe to update by pattern, or non-breaking if deferred:

- `src/lib/gatekeeperDecision.js` — `@see` doc comment only; no code impact; can be updated or left as historical note
- `.github/agents/consync-process.agent.md` — orientation text only; no functional impact
- `README.md` — navigation links only; broken links degrade docs but do not affect tests or runtime
- `AGENTS.md` — orientation text only; no runtime impact
- Internal cross-links inside moved PROCESS docs (runbook, production-change-packet-rules, templates, skills) — all move together; bulk prefix replacement is safe; links only affect doc navigation
- `.github/prompts/run_next_action.prompt.md` line 4 — orientation text in the prompt; does not affect file reads; LOW risk

---

## Migration Checklist

Concrete updates required in the migration packet, in execution order:

```
[ ] 1. Create .scaffoldai/ at repo root

[ ] 2. Move all 9 PROCESS zone directories
       .consync/process/      → .scaffoldai/process/
       .consync/agents/       → .scaffoldai/agents/
       .consync/skills/       → .scaffoldai/skills/
       .consync/contracts/    → .scaffoldai/contracts/
       .consync/templates/    → .scaffoldai/templates/
       .consync/prompts/      → .scaffoldai/prompts/
       .consync/verification/ → .scaffoldai/verification/
       .consync/planning/     → .scaffoldai/planning/
       .consync/audits/       → .scaffoldai/audits/

[ ] 3. RUNTIME_CRITICAL — update src/commands/handoff-bundle.js
       Change: path.join(".consync", "process", "runbook.process.md")
       To:     path.join(".scaffoldai", "process", "runbook.process.md")

[ ] 4. TEST — update src/test/integration-handoff-bundle-cli.js
       Change: path.join(".consync", "process", "runbook.process.md")
       To:     path.join(".scaffoldai", "process", "runbook.process.md")
       (This is the temp dir seed path used to exercise the --full path)

[ ] 5. STRING — update src/lib/intakeClassify.js
       Change: ".consync/process/" → ".scaffoldai/process/"
       Change: ".consync/agents/"  → ".scaffoldai/agents/"

[ ] 6. STRING — update src/commands/reference-audit.js
       Update all REFERENCE_CATEGORIES needle strings from .consync/* to .scaffoldai/*
       (for PROCESS zone entries only; leave .consync/state/ and .consync/streams/)

[ ] 7. PROMPT — update .github/prompts/run_closeout.prompt.md
       Change all 3 occurrences of .consync/skills/closeout-agent.md
       To: .scaffoldai/skills/closeout-agent.md

[ ] 8. PROMPT — update .github/prompts/run_next_action.prompt.md
       Change: .consync/process/runbook.process.md
       To: .scaffoldai/process/runbook.process.md

[ ] 9. PROMPT — update .github/copilot-instructions.md
       Replace all PROCESS zone paths:
       .consync/process/runbook.process.md    → .scaffoldai/process/runbook.process.md
       .consync/agents/                       → .scaffoldai/agents/
       .consync/skills/                       → .scaffoldai/skills/
       .consync/agents/entry-adapter.agent.md → .scaffoldai/agents/entry-adapter.agent.md

[ ] 10. PROMPT — update .github/agents/consync-process.agent.md
        Change: .consync/process/ → .scaffoldai/process/

[ ] 11. DOC — update README.md
        Replace all .consync/process/, .consync/agents/, .consync/skills/ paths
        with .scaffoldai/ equivalents

[ ] 12. DOC — update AGENTS.md
        Replace all .consync/agents/, .consync/skills/ paths
        with .scaffoldai/ equivalents

[ ] 13. DOC — update .consync/docs/START_HERE.md
        Bulk replace .consync/process/ → .scaffoldai/process/
                     .consync/agents/  → .scaffoldai/agents/
                     .consync/skills/  → .scaffoldai/skills/
                     .consync/contracts/ → .scaffoldai/contracts/
                     .consync/templates/ → .scaffoldai/templates/
                     .consync/verification/ → .scaffoldai/verification/
                     .consync/planning/ → .scaffoldai/planning/
        Note: leave .consync/state/ and .consync/streams/ untouched

[ ] 14. DOC — update .consync/docs/docs-surface-map.md
        Same bulk replacements as START_HERE.md
        Note: also fix pre-existing stale ref on line 35 (entry-adapter.md →
        entry-adapter.agent.md) and line 64 (state-contracts-and-integrity-checks.md →
        state-contracts-and-integrity-checks.contract.md) in the same pass

[ ] 15. DOC — bulk replace .consync/process/ etc. inside all moved PROCESS docs
        Internal cross-links in runbook, production-change-packet-rules,
        feature-planning-and-packetization, templates/work-packet-v3, closeout-agent,
        ingestion-gatekeeper — replace .consync/ → .scaffoldai/ for PROCESS paths only

[ ] 16. VERIFY — run npm run verify (must PASS)
[ ] 17. VERIFY — run npm run verify:full (must PASS)
[ ] 18. COMMIT — single atomic commit
```

---

## Recommendation

**PROCEED WITH CAUTION**

The PROCESS zone is safe to migrate — confirmed zero Node.js runtime dependency
except for one well-tested surface (`handoff-bundle.js` RUNBOOK_PATH).

Caution is warranted because:

1. **The prior reference audit underclassified `handoff-bundle.js`** as LOW risk.
   It is RUNTIME_CRITICAL. Both the command and the test must be updated atomically.
   The test provides a clear verification gate.

2. **`run_closeout.prompt.md` line 15** is a bare `#file:` path inclusion that is
   not covered by any automated test. Manual verification after migration is required.

3. **The migration checklist has 18 steps** across 6 categories. The most likely
   failure mode is a partial update where one of the STRING_ONLY or DOC_ONLY
   surfaces is missed. The verify gate will only catch the RUNTIME_CRITICAL failure
   (handoff-bundle); prompt and doc surfaces must be audited manually.

No items are BLOCKED. There are no unknown references. Migration can proceed once
the migration packet is formally mounted.
