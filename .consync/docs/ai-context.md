# AI Context — consync-core

Structured execution context for AI tools operating in this repository.

---

## 1. Authority Boundary

`.consync/` is the authoritative process layer.

- `.consync/state/` — live session state (read/write during execution)
- `.consync/agents/` — authoritative agent role, invocation, and binding contracts
- `.consync/docs/` — process docs and reference material (read; write only during doc work)
- `.consync/templates/` — copy-paste templates (read-only during execution)
- `.consync/skills/` — reusable skill/procedure files (read before using a workflow)
- `.github/` — thin Copilot/GitHub adapter only; not the canonical process model

Do not treat `.github/` as authoritative for process behavior. Point back to `.consync/` instead.

---

## 2. System Structure

```
consync-core/
  src/
    index.js              — CLI entry point
    cli/                  — CLI parsing (thin layer, no business logic)
    commands/             — command handlers (one file per command)
    lib/                  — reusable logic (callable from CLI, Electron, and MCP)
    core/                 — shared app logic (session, desktop shell)
    electron/             — desktop scaffold (main, preload, renderer)
    test/                 — unit, integration, and e2e tests
  sandbox/
    fixtures/             — deterministic test data for e2e and verification
    current/              — runtime dev artifacts
  .consync/
    state/                — live loop state files
    agents/               — agent role and binding contracts
    docs/                 — process docs
    templates/            — work packet template
    skills/               — reusable skills and procedures
  scripts/                — project scripts (state checks, Playwright helpers)
```

---

## 3. Key Docs and Their Roles

| Doc | Role |
|-----|------|
| `.consync/state/snapshot.md` | Fast re-entry artifact — read first to understand current state |
| `.consync/state/next-action.md` | Live execution slot — the one thing to do next |
| `.consync/state/handoff.md` | Closeout record for the most recently completed package |
| `.consync/docs/runbook.md` | Operating entrypoint — how to start a session, core loop, trigger levels |
| `.consync/docs/current-system.md` | Current product and process truth |
| `.consync/docs/verification-ladder.md` | Three verification levels (FAST_CHECK, UI_CHECK, FULL_VERIFY) |
| `.consync/docs/feature-planning-and-packetization.md` | How to break a feature into packets and execute them |
| `.consync/docs/feature-packet-execution.md` | Coordination model for multi-packet features (roles, readiness, loop) |
| `.consync/docs/03_work-log.md` | Append-only log of completed work — one entry per packet |
| `.consync/docs/ui-e2e-coverage-map.md` | e2e test coverage by surface — update when adding specs |
| `.consync/templates/work-packet-v3.md` | Copy-paste work packet template with idempotency detection |
| `.consync/agents/closeout.agent.md` | Closeout agent role definition; currently bound to `.consync/skills/closeout-agent.md` |
| `.consync/skills/closeout-agent.md` | Current Closeout agent prompt/process execution surface after human approval |

---

## 4. Execution Model

### Single Work Packet

Each task is a **work packet** using the `work-packet-v3` template. A packet:

1. Checks ALREADY_COMPLETE before doing any work
2. Implements only the stated TASK
3. Verifies at the declared level (FAST_CHECK / UI_CHECK / FULL_VERIFY)
4. Documents (appends to `03_work-log.md`, updates coverage map if needed)
5. Commits only files in ALLOWED FILES

Three outcomes: `COMPLETE`, `ALREADY_COMPLETE`, `STOPPED`.

### Feature Packets

For features with two or more independently testable concerns, use the feature packet model:

- Decompose into ordered work packets, one concern per packet
- Run a readiness gate before starting (clean repo + FULL_VERIFY)
- Execute packets sequentially — do not advance if any packet returns STOPPED
- Run a dedicated closeout packet at the end

See: `.consync/docs/feature-planning-and-packetization.md`

---

## 5. Verification Model

| Level | Command | When to use |
|-------|---------|-------------|
| FAST_CHECK | `npm test` | Docs-only or logic changes with no UI/state impact |
| UI_CHECK | `npm run test:e2e` | UI changes, new e2e specs |
| FULL_VERIFY | `npm run verify:full` | Before committing any packet that creates/modifies a spec or touches state contracts |

`FULL_VERIFY` expands to: state preflight → `npm test` → `npm run test:e2e` → state postflight.

FULL_VERIFY is the default for any packet touching production code or state.

---

## 6. Idempotency Rules

Before implementing anything, check:

1. Expected artifact or test file already exists at stated path
2. Coverage map already reflects the new coverage
3. `03_work-log.md` already contains an entry for this packet or PACKET_ID
4. `git log --oneline -- <relevant files>` shows a matching recent commit

If all four pass → return `ALREADY_COMPLETE`. Do not modify any files.

This matters in multi-agent and multi-session workflows.

---

## 7. State Read/Write Rules

**Read at session start (in order):**
1. `.consync/state/snapshot.md`
2. `.consync/state/next-action.md`
3. `.consync/state/handoff.md`
4. `.consync/state/active-stream.md`

**Write during execution:**
- `.consync/state/handoff.md` — overwrite at packet closeout
- `.consync/state/snapshot.md` — refresh after closeout
- `.consync/docs/03_work-log.md` — append only, one entry per packet
- `.consync/docs/ui-e2e-coverage-map.md` — update in the same commit as any new spec

**Never modify without following the appropriate workflow:**
- `.consync/state/next-action.md` — only the human or work manager sets the next action
- `.consync/state/active-stream.md` — stream switches require explicit workflow
- Any `governance` surface

---

## 8. Constraints

- **Local-first.** Do not require network access, servers, or external APIs.
- **Scope control.** Only modify files listed in ALLOWED FILES for the active packet.
- **One execution slot.** `next-action.md` is singular. One packet at a time.
- **No force-push, no --no-verify, no amending published commits.**
- **Do not push automatically.** Commit locally; a human decides when to push.
- **Stop cleanly.** If a stop condition is met, record STOPPED in the work-log and leave the repo clean.

---

## Reference

Canonical feature example: `.consync/docs/examples/search-panel-feature-example.md`

Production-change packet rules (when source changes are allowed): `.consync/docs/production-change-packet-rules.md`
