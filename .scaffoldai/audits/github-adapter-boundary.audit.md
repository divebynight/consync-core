# GitHub Adapter Boundary Audit

- date: 2026-05-03
- auditor: Copilot (read-only pass)
- trigger: post-process-zone-migration concern about whether `.github/agents/` and `.github/prompts/` still hold canonical process truth

---

## Status

PASS

The `.github/` layer is functioning correctly as a thin adapter. No canonical process truth lives exclusively in `.github/`. No file moves are required.

---

## Summary

After the `process-zone-migration-v1` migration moved PROCESS surfaces to `.scaffoldai/`, the `.github/` layer correctly delegates to `.scaffoldai/` and `.consync/state/` for all canonical content. The visual concern (process-looking files in `.github/`) is real but expected: GitHub/Copilot requires adapter files in `.github/` to wire tool-specific entry points. The current files satisfy that requirement without duplicating rules.

Two low-risk clarity gaps exist:
1. `.github/agents/consync-integrity.agent.md` — contains a full standalone behavioral prompt with no explicit pointer back to `.scaffoldai/`. It is self-contained rather than delegating, which is functionally acceptable but inconsistent with the stated adapter pattern.
2. `.github/agents/consync-process.agent.md` — same pattern: standalone behavioral prompt, references `.scaffoldai/process/` in one line but does not explicitly state it is a thin adapter.

Neither file duplicates or contradicts `.scaffoldai/` canonical content. They describe read-only inspection roles that are not defined anywhere else in `.scaffoldai/agents/`. This is a boundary ambiguity, not a duplication.

---

## Adapter Classification Table

| File | Classification | Canonical Source | Risk | Notes |
|---|---|---|---|---|
| `.github/copilot-instructions.md` | THIN_ADAPTER | `.scaffoldai/agents/`, `.consync/state/`, `.scaffoldai/process/runbook.process.md` | Low | Explicitly states `.github/` is adapter layer only; authority boundary clearly written |
| `.github/prompts/run_closeout.prompt.md` | THIN_ADAPTER | `.scaffoldai/skills/closeout-agent.md` | Low | Contains authority boundary notice; explicitly delegates to `.scaffoldai/skills/closeout-agent.md` |
| `.github/prompts/run_next_action.prompt.md` | THIN_ADAPTER | `.consync/state/next-action.md`, `.scaffoldai/process/runbook.process.md` | Low | Contains authority boundary notice; explicitly delegates to `.consync/state/next-action.md` |
| `.github/agents/consync-integrity.agent.md` | MIXED | None (standalone) | Low | Self-contained behavioral prompt; does not duplicate `.scaffoldai/` content but lacks an explicit pointer back to `.scaffoldai/`; inconsistent with adapter pattern |
| `.github/agents/consync-process.agent.md` | MIXED | `.scaffoldai/process/` (referenced in one line) | Low | Self-contained behavioral prompt; references `.scaffoldai/process/` but does not delegate to a `.scaffoldai/` canonical file; roles (integrity-check, process-alignment) are not defined in `.scaffoldai/agents/` |

---

## Duplicated / Mixed Truth

**None found.** No canonical process rules, agent role definitions, or workflow logic are duplicated between `.github/` and `.scaffoldai/`.

The two MIXED files (`consync-integrity.agent.md`, `consync-process.agent.md`) contain standalone inspection logic that does not exist in `.scaffoldai/agents/`. They are not duplicates — they are unregistered Copilot-only agent roles that live entirely in `.github/`. This is the ambiguity: they look like canonical agent definitions but are never invoked from `.scaffoldai/` and carry no binding status document there.

---

## Confusion Risks

1. **`.github/agents/` vs `.scaffoldai/agents/`**: A reader scanning the repo sees agent files in two locations. `.scaffoldai/agents/` defines the Consync canonical roles (Intake, Preflight, Verify, Closeout, Reentry, Entry Adapter). `.github/agents/` defines Copilot-only inspection roles (integrity check, process alignment). The distinction is not stated in either set of files. A new reader may not know which set is authoritative.

2. **`consync-integrity.agent.md` and `consync-process.agent.md` have no `.scaffoldai/` counterpart**: The `00_agent-system.md` authority boundary document in `.scaffoldai/agents/` states: "`.github/` is an adapter layer only. It may point back to `.scaffoldai/agents/` and `.consync/docs/`, but it must not become a competing source of process truth." These two files do not point back — they are self-contained. This is a minor drift from stated convention, not a functional defect.

3. **`run_closeout.prompt.md` references `.scaffoldai/skills/closeout-agent.md`**: The prompts correctly delegate, but `run_closeout.prompt.md` defines required output sections (STATUS, SUMMARY, FILES CREATED, FILES MODIFIED, COMMANDS TO RUN, HUMAN VERIFICATION, VERIFICATION NOTES). These sections are also implicitly defined by `stateIntegrityCheck.js` at the runtime level. There is no conflict, but the prompt-level section list and the runtime checker are not explicitly cross-referenced, which could cause drift over time.

---

## Recommendation

**Smallest safe next packet:** `github-adapter-clarification-v1` — documentation-only, no file moves.

What it would do:
- Add a one-line header to `.github/agents/consync-integrity.agent.md` and `.github/agents/consync-process.agent.md` stating: "This is a GitHub/Copilot adapter file. It is not canonical. Canonical agent roles are defined in `.scaffoldai/agents/`."
- Optionally add a note to `.scaffoldai/agents/00_agent-system.md` acknowledging that Copilot-only inspection roles (integrity, process-alignment) live in `.github/agents/` and are not bound to `.scaffoldai/`.

**Estimated scope:** 2–4 line additions across 2–3 files. No moves, no renames, no structural changes.

**Verdict on whether to act:** LOW URGENCY. The current state is functional and coherent. This cleanup is purely cosmetic — it removes reader confusion but fixes no defect. Mount it when convenient, not immediately.

---

## Files Read

- `.github/copilot-instructions.md`
- `.github/agents/consync-integrity.agent.md`
- `.github/agents/consync-process.agent.md`
- `.github/prompts/run_closeout.prompt.md`
- `.github/prompts/run_next_action.prompt.md`
- `.scaffoldai/agents/00_agent-system.md`
- `.scaffoldai/agents/closeout.agent.md`
- `.scaffoldai/agents/intake.agent.md`
- `.scaffoldai/prompts/generate-packet.prompt.md`
- `.scaffoldai/prompts/run-integrity-agent.prompt.md`
- `AGENTS.md`
