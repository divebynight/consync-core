# consync-core

Consync is a small local-first tool for tracking creative work. It organizes sessions, artifacts, and development loops without requiring a server, network, or external service.

## What it does

- Captures session context and artifact metadata locally
- Runs structured development loops: plan → packet → test → verify → commit
- Provides a desktop scaffold for browsing and searching work
- Keeps a portable `.consync/` process boundary that travels with the repo

## How work happens

```
Plan → Break into packets → Implement → Verify → Commit
```

Each piece of work is a **work packet** — a small, focused task with a clear goal, a verification step, and a commit. Larger features are broken into a sequence of packets.

Consync uses manual, explicit agent invocation for process judgment. There is no orchestrator, runner, automatic dispatcher, or hidden agent pipeline.

The post-Phase 2 entry flow is:

1. use the Entry Adapter when incoming input needs classification
2. receive one recommended agent
3. have a human manually invoke that agent

Current agent roles:

- **Preflight** checks whether repo and process state are safe before work begins.
- **Intake** classifies new work and its boundaries before execution.
- **Verify** runs and reports verification evidence.
- **Closeout** summarizes changed files, verification, risks, and commit readiness.
- **Reentry** reconstructs context after interruption, stale state, or unclear handoff.

Invocation rules:

- **MUST** invoke agents manually; no doc or command auto-dispatches them.
- **MUST** use `Verify` evidence before reporting clean closeout.
- **SHOULD** use the Entry Adapter when the next agent is unclear.
- **MAY SKIP** the Entry Adapter when the human explicitly invokes a specific agent or command.

## What you can run today

The first explicit agent execution surface is `intake-run`. It runs the Intake agent's classification logic in a single, inspectable step.

```
node src/index.js intake-run --prompt "describe the work here"
```

Other current execution surfaces:

- `dry-run-check` — simulation only (prints a Gatekeeper decision report, no prompt, no execution)
- `consync-run` — approval only (prompts on ALLOW, no execution wiring)

This system is still fully manual and non-orchestrated. No agent auto-dispatches. No pipeline exists.

## Manual Execution Flow

The current manual execution flow (including Intake and Preflight CLI surfaces) is documented in:

`.scaffoldai/process/manual-execution-flow.process.md`

This system remains manual and non-orchestrated. Intake and Preflight have explicit CLI commands.

## Where to go next

**Feature development process:**
- How to plan and break down a feature → [`.scaffoldai/process/feature-planning-and-packetization.process.md`](.scaffoldai/process/feature-planning-and-packetization.process.md)
- Coordination model for multi-packet features → [`.scaffoldai/process/feature-packet-execution.process.md`](.scaffoldai/process/feature-packet-execution.process.md)
- Canonical example (Search Panel e2e coverage) → [`.consync/examples/search-panel-feature-example.md`](.consync/examples/search-panel-feature-example.md)

**Running the project:**
- Start the desktop app: `npm run start:desktop`
- Run unit + integration tests: `npm test`
- Run normal verification: `npm run verify`
- Run full verification (includes e2e): `npm run verify:full`

## For AI tools

For structured execution context, system architecture, and process constraints:

> `.scaffoldai/process/ai-context.process.md`

Agent role contracts live in `.scaffoldai/agents/`. Reusable procedures and skills live in `.scaffoldai/skills/`. GitHub and Copilot files are adapters only, not the canonical process model.
