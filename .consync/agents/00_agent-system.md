# ScaffoldAi Agent System

This document defines the basic invoked-agent structure for the current repo while preserving existing Consync behavior and integrity checks.

A **Consync agent** is an invoked role with a bounded responsibility, defined inputs, and a required status output. Agents do not replace deterministic commands or runtime code. They decide, classify, verify, or summarize at specific handoff points in the work loop.

## Naming Boundary

- **Consync** is the product currently represented by this repository and its local-first workflow surface.
- **ScaffoldAi** is the development harness working name for the invoked-agent system, coordination flow, and future process tooling.
- The `.consync/` folder name stays unchanged for now.
- A future migration may move harness material to `.scaffoldai/`, but that must be a separate explicit migration. Do not rename `.consync/` as part of ordinary agent-definition work.

## Authority Boundary

- `.consync/agents/` is the source of truth for invoked-agent roles and invocation order.
- `.consync/agents/entry-adapter.md` defines the manual Phase 2 input-classification adapter for recommending which existing agent a human should invoke next.
- `.consync/skills/` holds reusable workflow instructions that an agent may reference or execute when its role calls for that skill.
- If `.consync/agents/` and `.consync/skills/` appear to overlap, `.consync/agents/` defines the role and handoff point; `.consync/skills/` defines reusable procedure.
- `.consync/docs/` remains the process documentation and reference surface.
- `.consync/state/` remains authoritative live state and must not be edited manually outside the appropriate workflow.
- `.github/` is an adapter layer only. It may point back to `.consync/agents/` and `.consync/docs/`, but it must not become a competing source of process truth.

## Entry Adapter

The Phase 2 Entry Adapter lives at `.consync/agents/entry-adapter.md`.

It is a manual prompt/document layer that classifies incoming input and recommends the next manually invoked Consync agent:

- New work request -> Intake
- Before repo changes -> Preflight
- Verification/evidence request -> Verify
- Closeout/commit readiness -> Closeout
- Stale/lost context or interrupted work -> Reentry

The Entry Adapter is unbound and manual unless explicitly invoked. It does not execute agents, auto-dispatch, choose hidden workflows, modify repo state, collapse agent responsibilities, or act as a runner, dispatcher, or orchestrator.

## Manual Invocation Rules

- **MUST** invoke agents manually. No orchestrator, runner, automatic dispatcher, or hidden agent pipeline exists.
- **MUST** keep the Entry Adapter to classification and recommendation only; a human invokes the recommended agent.
- **MUST** use Verify evidence before reporting clean closeout.
- **SHOULD** use the Entry Adapter when incoming input is ambiguous or the correct next agent is unclear.
- **MAY SKIP** the Entry Adapter when a human explicitly invokes a specific agent, command, or bound process surface.

## Invocation Order

1. **Preflight**
   - Establish current repo/process state before work begins.
   - Answer: can work safely start from this repo and process state?
   - Invoke before intake or execution when a packet is mounted or a human asks to begin work.
   - Current concrete surface: `npm run check:state-preflight`.

2. **Intake**
   - Classify the requested work and decide the correct surface.
   - Answer: what kind of work is this, and which boundaries apply?
   - Invoke before new work is converted into a packet, after preflight passes when repo/process state must be checked first.
   - Current concrete surface: prompt-only work-classification contract.
   - Preserve scope boundaries before implementation begins.

3. **Execution/tool adapter**
   - Perform the requested implementation or invoke the tool-specific adapter needed to do it.
   - This is a workflow phase, not currently a Consync agent.
   - Do not treat it as an agent unless a dedicated agent definition is explicitly added later.
   - Keep runtime and process changes inside the declared packet scope.

4. **Verify**
   - Run the smallest appropriate checks required by the changed surfaces.
   - Invoke after execution changes are complete and before closeout.
   - Current concrete surface: existing verification commands documented in `.consync/docs/verification-ladder.md`.
   - Escalate to broader verification when source, state contracts, UI, or process integrity require it.

5. **Closeout**
   - Summarize changed files, verification, risks, and commit readiness.
   - Invoke after verify completes, or when failed verification must be reported as blocked.
   - Current concrete surface: `.consync/skills/closeout-agent.md`.
   - Do not report a clean closeout if verification is failing.

6. **Reentry**
   - Prepare the next operator or future session to resume safely.
   - Invoke when work resumes after interruption, context loss, stale conversation state, unclear handoff, or incomplete closeout.
   - Current concrete surface: prompt-only recovery and context-reconstruction contract.
   - Preserve state handoff without inventing completed work.

## Execution Bindings

Agent execution bindings are incremental. A binding means an existing command, prompt, or process is the current concrete execution surface for an agent role. It does not create a full orchestrator, imply automatic agent dispatch, or add a new runner.

Current bindings:

- **Preflight agent** → `npm run check:state-preflight`
- **Intake agent** → prompt-only work-classification contract
- **Verify agent** → existing verification commands documented in `.consync/docs/verification-ladder.md`
- **Closeout agent** → `.consync/skills/closeout-agent.md`
- **Reentry agent** → prompt-only recovery and context-reconstruction contract

The Closeout binding is a prompt/process binding, not a command binding. `.github/prompts/run_closeout.prompt.md` is an adapter for that workflow, not the authoritative Closeout agent definition.

Verify is a command-based evidence contract. It reports commands run and outcomes; it does not decide by itself whether work is acceptable.

Intake classifies only. It does not approve work, start work, modify files, or replace Preflight, Verify, or Closeout.

Reentry reconstructs only. It is not authoritative over repo state, process state, or next work.

No additional agents are defined or bound. The Entry Adapter is not an additional agent binding; it is a manual classification adapter that can recommend one existing agent for human invocation.

## Status Meanings

- **PASS** means the agent completed its responsibility and required verification for that responsibility succeeded.
- **FAIL** means the agent completed enough work to determine that required checks or expectations did not pass.
- **BLOCKED** means the agent cannot safely continue without a human decision, missing dependency, unavailable context, or failing verification that must not be bypassed.

A clean `PASS` is not allowed if `Verify` fails. If verification fails, the result must be `FAIL` or `BLOCKED`, with the failing command and reason reported.

## Current Guardrails

- Do not move runtime code as part of this agent-system introduction.
- Do not rename packages.
- Do not rename `.consync/`.
- Do not weaken or delete tests.
- Do not change package scripts unless a packet explicitly requires it.
- Keep current Consync behavior intact while adding invoked-agent definitions.
