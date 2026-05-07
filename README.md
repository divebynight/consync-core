# consync-core

`consync-core` is an experimental local-first creativity and context system.

It combines:
- creative file and session tracking
- contextual reentry tooling
- structured runtime state
- an AI development harness designed to make collaboration with AI tools more deterministic and less chaotic

The project explores ways to preserve creative context over time, reduce reentry friction, and build operational tooling that keeps both humans and AI tools oriented during long, interrupted, or complex work sessions.

It is experimental but operational. Everything in this repo can be used without a network connection, a cloud service, or a background server.

---

## Why This Exists

Creative work — audio, writing, design, code — generates a lot of context that is easy to lose. Sessions get interrupted. You return days later with no clear sense of where you were, what decisions were made, or what still needs to happen.

Consync is an attempt to solve that in a local-first way: small files, explicit timestamps, GUID-based identity for tracked concepts, and just enough structure to make reentry fast.

The same problem applies to AI-assisted development. AI tools lose context between sessions, give inconsistent results when context is thin, and lack a stable way to verify their own work. ScaffoldAI is the development harness in this repo that addresses that problem — providing deterministic runtime commands, state checkpoints, and structured verification so that AI collaboration stays grounded.

---

## What Currently Works

- **Session and file tracking** — timestamped event artifacts, GUID-based identity metadata, local JSON
- **Desktop workspace** — Electron app with audio file loading, markers, bookmarks, search, and workspace browsing
- **Runtime CLI** — commands for system status, preflight checks, structured verification, and handoff/closeout
- **Verification loop** — fast local checks that report PASS/FAIL across all major runtime areas
- **MCP integration (read-only)** — a local stdio MCP server exposing 5 read-only tools for AI clients
- **CI** — GitHub Actions workflow running core verification on every PR and push to main

---

## Current Major Components

### Consync

Consync is the product: a local-first desktop and CLI tool for tracking creative work.

It tracks sessions, files, markers, bookmarks, and annotations as small local artifacts — timestamped events and GUID metadata — rather than in a database or cloud service.

The desktop app is built on Electron + React. The CLI commands live under `src/commands/`. Creative tracking logic lives under `src/lib/`.

### ScaffoldAI

ScaffoldAI is the development harness that wraps the Consync build process.

It provides runtime commands you can invoke from the CLI, a verification loop, state snapshot/handoff docs, and a read-only MCP server that AI clients can query. It is designed to keep AI-assisted work predictable: state is explicit, verification is runnable, and no autonomous action happens without human approval.

ScaffoldAI lives under `.scaffoldai/`. It is not part of the Consync product.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the desktop app
npm run start:desktop

# Run core tests
npm test

# Run all fast verification
npm run verify
```

---

## Common Commands

| Command | What it does |
|---|---|
| `npm test` | Runs unit and integration tests |
| `npm run verify` | All fast non-E2E checks |
| `npm run verify:scaffoldai` | ScaffoldAI runtime checks, state, MCP coverage |
| `npm run verify:consync` | Fast Consync product checks |
| `npm run test:e2e` | Playwright renderer E2E (requires preload build) |
| `npm run start:desktop` | Launches the Electron desktop app |
| `npm run scaffoldai:status` | Current runtime posture summary |
| `npm run scaffoldai:preflight` | Pre-work safety check |
| `npm run scaffoldai:mcp` | Starts the local MCP server (stdio) |

---

## Current Status

- Local-first development, no cloud or network dependency
- Desktop app operational (audio, markers, bookmarks, search, workspace browser)
- CLI runtime commands operational (status, preflight, verify, handoff, closeout)
- Read-only MCP server at v0 over local stdio — no remote exposure
- Verification loop passing across all surfaces
- CI running core verification on pull_request and push to main
- Human approval required for verification acceptance, commits, pushes, and PRs
- Runtime temp/log artifacts stay under `.scaffoldai/tmp/`

This is experimental software. APIs and structure will change. Planned layers (write-capable MCP, durable verify evidence, persistent event store) are not yet implemented.

---

## Repository Layout

```
src/                   Consync CLI, commands, lib, Electron app, and tests
.scaffoldai/           ScaffoldAI process layer: state, agents, planning, skills, contracts
.github/               GitHub Actions CI and Copilot adapter
sandbox/               Deterministic fixtures and probes for local verification
scripts/               Project utility scripts
```

Deeper layout documentation: [src/README.md](src/README.md), [.scaffoldai/README.md](.scaffoldai/README.md)

---

## Documentation Map

| What you want | Where to look |
|---|---|
| What Consync is building | [src/README.md](src/README.md) |
| CLI commands reference | [src/commands/README.md](src/commands/README.md) |
| ScaffoldAI runtime state | [.scaffoldai/reference/current-runtime-state.reference.md](.scaffoldai/reference/current-runtime-state.reference.md) |
| ScaffoldAI process guide | [.scaffoldai/process/runbook.process.md](.scaffoldai/process/runbook.process.md) |
| MCP client contract | [.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md](.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md) |
| Desktop/Electron layer | [src/electron/README.md](src/electron/README.md) |
| Sandbox fixtures | [sandbox/README.md](sandbox/README.md) |

---

## Development Notes

Keep work small and focused. One packet or PR at a time.

Before starting any substantive change:

```bash
npm run scaffoldai:preflight
npm run scaffoldai:question
```

Before committing:

```bash
npm run verify
```

For Electron/renderer changes, also run:

```bash
npm run test:e2e
```

This repo uses a human-controlled workflow. AI tools assist; humans approve, commit, and push.
