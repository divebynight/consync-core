# AGENTS

## STOP BEFORE EDITING FILES

⚠️ **REQUIRED: Pre-Edit Pause Gate** ⚠️

Before any repository file mutation, you MUST stop and display the acknowledgement block below.

Do not create, edit, delete, move, rename, format, generate, patch, stage, or otherwise modify repository files until the human answers.

This applies even to trivial edits and explicitly requested edits.

**Acknowledgement block:**

```
SCAFFOLDAI ACK

I have been instructed to use the ScaffoldAI development harness for this repository.

Current profile: DEFAULT_DEV
Interaction mode: PASSIVE
Execution mode: LIVE

Before modifying files, should I:
1. continue through the ScaffoldAI process loop
2. or bypass the harness for this request?
```

Wait for the human's response before taking action.

---

**AI Tool Entrypoint:** This repository uses ScaffoldAI as the development harness.

**Access Contract:** See `.scaffoldai/contracts/ai-tool-access.contract.md` for AI tool interaction rules.

**Process Overview:** See `.scaffoldai/README.md` for ScaffoldAI operational model.

---

Consync BRIDGE truth lives under `.scaffoldai/state/` and `.scaffoldai/streams/`. ScaffoldAI PROCESS truth lives under `.scaffoldai/`.

Use these boundaries when working in this repo:

- `.scaffoldai/state/` and `.scaffoldai/streams/` are the BRIDGE source of truth for live execution state.
- `.scaffoldai/agents/` defines agent roles, invocation points, and binding status.
- `.scaffoldai/skills/` contains reusable procedures/skills used by agents; it is not the primary role-definition surface.
- `.github/` is a thin Copilot/GitHub adapter layer only. Treat it as tool-specific guidance, not the canonical Consync process model.
- `AGENTS.md` is the Codex entry point and should point back to `.scaffoldai/` rather than re-describing the whole process system.

## Required Workflow Pointers

- Use `.scaffoldai/agents/entry-adapter.agent.md` only when incoming input needs manual classification before choosing which existing Consync agent to invoke. It recommends the next agent; it does not auto-dispatch, execute agents, or modify repo state.
- Current agent roles are Preflight, Intake, Verify, Closeout, and Reentry. Invoke them manually; no orchestrator, runner, dispatcher, or automatic agent pipeline exists.
- Use the Closeout agent after human-approved completed work to verify tests, docs, integrity, and commit readiness. Its current bound process surface is `.scaffoldai/skills/closeout-agent.md`.
- Use `.scaffoldai/skills/ingestion-gatekeeper.md` before adding external context so it is classified conservatively and placed in the right Consync surface.

## Invocation Rules

- MUST invoke agents manually; do not auto-dispatch or invent hidden workflows.
- MUST use Verify evidence before reporting clean closeout.
- SHOULD use the Entry Adapter when the correct next agent is unclear.
- MAY SKIP the Entry Adapter when the human explicitly invokes a specific agent or command.

## State + Docs Discipline

- Do not modify `.scaffoldai/state/*` manually unless you are following the appropriate Consync workflow.
- Treat `.scaffoldai/state/*` as authoritative over chat memory or tool-local assumptions.
- Do not push automatically.
