# ScaffoldAI Runtime Planning — v1

**Date:** 2026-05-05
**Status:** PLANNING — not yet implemented
**Next packet:** scaffoldai-status-command-v1

---

## 1. Purpose

ScaffoldAI runtime should make the existing process visible and executable from the terminal — without autonomous behavior.

Goals for v1:
- Surface current state clearly so the operator knows what to do next.
- Provide deterministic, repeatable output.
- Read existing state files rather than maintaining separate state.
- Remain useful without an AI assistant, network access, or MCP server.

Non-goals for v1:
- No autonomous agent chaining.
- No MCP server.
- No automatic commits or pushes.
- No broad repo mutation.
- No product feature work.

---

## 2. First Command: `scaffoldai status`

This is the first and most important runtime surface.

It gives the operator a single-command snapshot of:
- What is currently active.
- What the safe next action is.
- Whether the system is clean enough to proceed.

### Invocation

```
node src/index.js scaffoldai status
```

Or, once an npm script is added:

```
npm run scaffoldai:status
```

---

## 3. What `scaffoldai status` Should Report

### 3.1 System state

- Active stream name (from `.scaffoldai/state/active-stream.md`)
- Active packet / in-flight packet identifier (from `.scaffoldai/state/active-contract.json`)
  - If `in_flight_packet: null` → report "No active packet"

### 3.2 Next safe action

- Extracted from `.scaffoldai/state/next-action.md`
  - Print the first meaningful line or section heading only — not the full document.
  - If the file is empty or missing → report "No next-action found — run reentry or preflight"

### 3.3 Last known verification state

- Check if the verify output was recently run.
  - v1 approach: note that verification state is not automatically tracked; advise operator to run `npm run verify` or `npm run verify:full`.
  - v2 consideration: write a lightweight last-verify stamp file after a PASS.

### 3.4 Unstaged git changes summary

- Run `git status --short` internally.
- Report:
  - "Clean — no uncommitted changes" if working tree is clean.
  - Count of modified/untracked files if not clean.
  - List files if fewer than 10; truncate with a count note if more.

### 3.5 Recommended VERIFY COMMAND

- If active packet is a process/scaffoldai packet → recommend `npm run verify:scaffoldai`
- If active packet is a product/Consync packet → recommend `npm run verify:consync`
- If no active packet → recommend `npm run verify`

### 3.6 Warnings or blockers

- Warn if `.scaffoldai/state/next-action.md` is missing or empty.
- Warn if `.scaffoldai/state/active-contract.json` is malformed or missing.
- Warn if `.scaffoldai/state/handoff.md` is missing (expected after each closeout).
- Warn if `.consync/` exists at repo root (architecture violation).
- Blocker if active-contract.json declares an in-flight packet but next-action.md says NONE.

---

## 4. Inputs

| Source | Usage |
|--------|-------|
| `.scaffoldai/state/active-contract.json` | Active packet identifier and stream |
| `.scaffoldai/state/active-stream.md` | Active stream name |
| `.scaffoldai/state/next-action.md` | Next safe action text |
| `.scaffoldai/state/handoff.md` | Last closeout evidence |
| `.scaffoldai/state/snapshot.md` | System snapshot summary |
| `package.json` scripts | VERIFY COMMAND detection |
| `git status --short` | Working tree cleanliness |
| `.scaffoldai/state/cleanup-complete-checkpoint.md` | Cleanup phase state, if relevant |

---

## 5. Outputs

- Human-readable terminal output only in v1.
- No file writes.
- Exit code 0 for clean/informational output; exit code 1 only for hard blockers (missing required files, malformed JSON).
- Format:

```
[scaffoldai status]

ACTIVE STREAM:    process
ACTIVE PACKET:    scaffoldai-status-command-v1
NEXT ACTION:      Implement scaffoldai status command
GIT STATUS:       3 modified files
VERIFY COMMAND:   npm run verify:scaffoldai
WARNINGS:         none

STATUS: ON_TRACK
```

---

## 6. Non-Goals (explicit)

These are deferred until a later packet:

| Non-goal | Deferred to |
|----------|------------|
| MCP server | Future MCP planning packet |
| Autonomous agent chaining | Not planned for v1 or v2 |
| Automatic commits | Not planned |
| Writing state files | v2 or later |
| JSON output mode | v2 (MCP compatibility consideration) |
| CI/CD integration | Not planned yet |

---

## 7. Follow-Up Commands (not yet implemented)

These are noted for planning purposes only. Each will require its own packet.

| Command | Purpose |
|---------|---------|
| `scaffoldai preflight` | Verify process state is safe before mounting a new packet |
| `scaffoldai verify` | Run or recommend the correct VERIFY COMMAND for the active packet type |
| `scaffoldai closeout` | Summarize completed work, verify evidence, and check commit readiness |
| `scaffoldai reentry` | Reconstruct context after interruption or stale state |

---

## 8. Open Questions

| Question | Options | Decision needed by |
|----------|---------|-------------------|
| Should `status` live under `src/commands/` or a future `scaffoldai/` sub-package? | `src/commands/scaffoldai-status.js` (consistent with current structure); or `src/commands/scaffoldai/status.js` (grouped) | Before implementation |
| Should it be exposed through an npm script immediately? | Yes — `"scaffoldai:status": "node src/index.js scaffoldai status"` is cheap and useful | Decide during implementation |
| Should status read git directly (`child_process spawnSync`) or through a helper module? | Direct `spawnSync` in a new `src/lib/gitStatus.js` helper for reuse | Prefer helper — reusable by future `closeout` |
| What output format should later MCP use: plain text, JSON, or both? | Plain text for v1; consider `--format=json` flag for v2 when MCP is being planned | Defer to MCP planning packet |

---

## 9. Implementation Checklist (for next packet)

- [ ] Create `src/commands/scaffoldai-status.js`
- [ ] Create `src/lib/gitStatus.js` (thin wrapper around `git status --short`)
- [ ] Register `scaffoldai status` subcommand in `src/cli/index.js`
- [ ] Add `"scaffoldai:status"` npm script to `package.json`
- [ ] Write `src/test/unit-scaffoldai-status.js` — unit test for status output shape
- [ ] Add step to `verify.js` under `SURFACES.SCAFFOLDAI`
- [ ] Update `src/commands/README.md` to list the new command
- [ ] Run `npm run verify:scaffoldai` → PASS
- [ ] Run `npm run verify` → PASS
