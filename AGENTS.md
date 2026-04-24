# AGENTS

Consync process truth lives under `.consync/`.

Use these boundaries when working in this repo:

- `.consync/` is the authoritative process layer for Consync state, docs, streams, prompts, skills, and gatekeeping workflows.
- `.github/` is a thin Copilot/GitHub adapter layer only. Treat it as tool-specific guidance, not the canonical Consync process model.
- `AGENTS.md` is the Codex entry point and should point back to `.consync` rather than re-describing the whole process system.

## Required Workflow Pointers

- Use `.consync/.agents/skills/closeout-agent.md` after human-approved completed work to verify tests, docs, integrity, and commit readiness.
- Use `.consync/.agents/skills/ingestion-gatekeeper.md` before adding external context so it is classified conservatively and placed in the right Consync surface.

## State + Docs Discipline

- Do not modify `.consync/state/*` or `.consync/docs/*` manually unless you are following the appropriate Consync workflow.
- Treat `.consync/state/*` as authoritative over chat memory or tool-local assumptions.
- Do not push automatically.
