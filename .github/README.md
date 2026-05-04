# .github/

## Purpose

This folder is a thin GitHub/Copilot adapter layer.

It wires GitHub-specific and Copilot-specific tooling into the repo. It is not the canonical ScaffoldAI process layer and not Consync product code.

---

## What Belongs Here

- `copilot-instructions.md` — Copilot workspace instructions; points back to `.scaffoldai/` as the authority; states the adapter-only boundary
- `prompts/` — Copilot prompt files for specific workflow entry points (e.g. run closeout, run next action); each should delegate to `.scaffoldai/` for canonical behavior
- `agents/` — Copilot agent definitions used for read-only inspection roles (e.g. integrity check, process alignment); self-contained behavioral prompts that do not duplicate `.scaffoldai/` content
- `workflows/` — GitHub Actions CI/CD workflows, if added in future

---

## What Does NOT Belong Here

- Canonical ScaffoldAI process documentation (belongs under `.scaffoldai/process/`)
- Agent role definitions or binding contracts (belong under `.scaffoldai/agents/`)
- Live loop state: next-action, handoff, snapshot (belong under `.scaffoldai/state/`)
- Consync product metadata (belongs under `.consync/`)
- Consync runtime/product code (belongs in `src/`)

---

## Important Boundaries

- Files here must remain thin adapters — they may point to `.scaffoldai/` as the authority but must not become a competing source of process truth
- If a prompt or agent here grows canonical rules, those rules belong in `.scaffoldai/` and the file here should delegate to them
- `copilot-instructions.md` explicitly states `.github/` is an adapter layer only — keep that statement accurate when editing it
- Do not duplicate process rules, agent definitions, or state paths between `.github/` and `.scaffoldai/`; duplication creates drift

---

## Related Folders

| Folder | Relationship |
|--------|-------------|
| `.scaffoldai/` | The canonical ScaffoldAI process layer — agents, state, process docs, skills, and prompts all live here |
| `.scaffoldai/agents/` | Authoritative agent role and binding contracts; `.github/agents/` are adapter-only inspection roles |
| `.scaffoldai/prompts/` | Canonical prompt files; `.github/prompts/` are Copilot-specific entry points that delegate to these |
| `.consync/` | Consync product metadata — separate from this adapter layer |

---

## Verification Notes

- No automated verify step targets `.github/` content directly
- If `copilot-instructions.md` or prompt files are edited, manually confirm that authority boundary statements still point to `.scaffoldai/` rather than duplicating rules
- Run `npm run verify` after any change to confirm no runtime behavior is affected
