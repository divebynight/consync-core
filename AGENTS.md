# AGENTS

Consync process truth lives under `.consync/`.

Use these boundaries when working in this repo:

- `.consync/` is the authoritative process layer for Consync state, docs, streams, prompts, skills, and gatekeeping workflows.
- `.consync/agents/` defines agent roles, invocation points, and binding status.
- `.consync/skills/` contains reusable procedures/skills used by agents; it is not the primary role-definition surface.
- `.github/` is a thin Copilot/GitHub adapter layer only. Treat it as tool-specific guidance, not the canonical Consync process model.
- `AGENTS.md` is the Codex entry point and should point back to `.consync` rather than re-describing the whole process system.

## Required Workflow Pointers

- Use `.consync/agents/entry-adapter.md` only when incoming input needs manual classification before choosing which existing Consync agent to invoke. It recommends the next agent; it does not auto-dispatch, execute agents, or modify repo state.
- Current agent roles are Preflight, Intake, Verify, Closeout, and Reentry. Invoke them manually; no orchestrator, runner, dispatcher, or automatic agent pipeline exists.
- Use the Closeout agent after human-approved completed work to verify tests, docs, integrity, and commit readiness. Its current bound process surface is `.consync/skills/closeout-agent.md`.
- Use `.consync/skills/ingestion-gatekeeper.md` before adding external context so it is classified conservatively and placed in the right Consync surface.

## Invocation Rules

- MUST invoke agents manually; do not auto-dispatch or invent hidden workflows.
- MUST use Verify evidence before reporting clean closeout.
- SHOULD use the Entry Adapter when the correct next agent is unclear.
- MAY SKIP the Entry Adapter when the human explicitly invokes a specific agent or command.

## State + Docs Discipline

- Do not modify `.consync/state/*` or `.consync/docs/*` manually unless you are following the appropriate Consync workflow.
- Treat `.consync/state/*` as authoritative over chat memory or tool-local assumptions.
- Do not push automatically.
