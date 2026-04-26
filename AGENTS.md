# AGENTS

Consync process truth lives under `.consync/`.

Use these boundaries when working in this repo:

- `.consync/` is the authoritative process layer for Consync state, docs, streams, prompts, skills, and gatekeeping workflows.
- `.consync/agents/` defines agent roles, invocation points, and binding status.
- `.consync/skills/` contains reusable procedures/skills used by agents; it is not the primary role-definition surface.
- `.github/` is a thin Copilot/GitHub adapter layer only. Treat it as tool-specific guidance, not the canonical Consync process model.
- `AGENTS.md` is the Codex entry point and should point back to `.consync` rather than re-describing the whole process system.

## Required Workflow Pointers

- Use the Closeout agent after human-approved completed work to verify tests, docs, integrity, and commit readiness. Its current bound process surface is `.consync/skills/closeout-agent.md`.
- Use `.consync/skills/ingestion-gatekeeper.md` before adding external context so it is classified conservatively and placed in the right Consync surface.

## State + Docs Discipline

- Do not modify `.consync/state/*` or `.consync/docs/*` manually unless you are following the appropriate Consync workflow.
- Treat `.consync/state/*` as authoritative over chat memory or tool-local assumptions.
- Do not push automatically.
