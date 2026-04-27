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

## Where to go next

**Feature development process:**
- How to plan and break down a feature → [`.consync/docs/feature-planning-and-packetization.md`](.consync/docs/feature-planning-and-packetization.md)
- Coordination model for multi-packet features → [`.consync/docs/feature-packet-execution.md`](.consync/docs/feature-packet-execution.md)
- Canonical example (Search Panel e2e coverage) → [`.consync/docs/examples/search-panel-feature-example.md`](.consync/docs/examples/search-panel-feature-example.md)

**Running the project:**
- Start the desktop app: `npm run start:desktop`
- Run unit + integration tests: `npm test`
- Run normal verification: `npm run verify`
- Run full verification (includes e2e): `npm run verify:full`

## For AI tools

For structured execution context, system architecture, and process constraints:

> `.consync/docs/ai-context.md`

Agent role contracts live in `.consync/agents/`. Reusable procedures and skills live in `.consync/skills/`. GitHub and Copilot files are adapters only, not the canonical process model.
