# Planning — scaffoldai-closeout-command-v1

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

`scaffoldai closeout` evaluates whether the current work packet is ready for human review and commit.

It answers: "Is this work done enough to commit, or is something still blocking?"

It is a read-only judgment command. It does not commit, fix, or mutate anything. The human makes all final decisions.

This command is higher-risk than `status`, `preflight`, or `verify` because its output directly influences commit readiness decisions. For that reason, v1 defaults conservatively: if verification evidence is unavailable or ambiguous, closeout reports `NEEDS_VERIFICATION`, not `READY_FOR_REVIEW`.

---

## 2. v1 Behavior

The command inspects the following in order:

1. **Active packet** — read `active-contract.json` to determine if a packet is mounted.
2. **Git status** — count and list changed files using the existing `gitStatus` helper.
3. **Verification state** — determine whether recent verification evidence exists (see Open Questions).
4. **Changed files summary** — list modified, added, and untracked files by category.
5. **Commit prefix recommendation** — infer the appropriate prefix from changed file paths and active contract type.
6. **Blockers** — conditions that prevent `READY_FOR_REVIEW`.
7. **Warnings** — conditions worth noting but not blocking.
8. **Next safe action** — one concrete recommended action for the human.

---

## 3. Output Format

```
[scaffoldai closeout]

ACTIVE PACKET:        <packet-id or (none)>
CHANGED FILES:        <N> file(s)
                      M src/commands/scaffoldai-verify.js
                      M src/lib/resolveVerifyCommand.js
                      ?? src/test/unit-scaffoldai-verify.js

VERIFY COMMAND:       npm run verify:scaffoldai
COMMIT PREFIX:        process:
COMMIT SUGGESTION:    process: implement scaffoldai verify runtime command

BLOCKERS:             none
WARNINGS:             WARNING: 8 uncommitted files — run verify before committing

NEXT SAFE ACTION:     Run npm run verify:scaffoldai, then commit if all tests pass.

STATUS: NEEDS_VERIFICATION
```

---

## 4. Output Terminology

Use:
- `ACTIVE PACKET` — from active-contract.json
- `CHANGED FILES` — git status listing
- `VERIFY COMMAND` — recommended verify command based on contract
- `COMMIT PREFIX` — inferred commit type prefix
- `COMMIT SUGGESTION` — recommended commit message (never executed automatically)
- `BLOCKERS` — items that prevent `READY_FOR_REVIEW`
- `WARNINGS` — items worth noting
- `NEXT SAFE ACTION` — one concrete recommended step
- `STATUS` — one of: `READY_FOR_REVIEW`, `NEEDS_VERIFICATION`, `BLOCKED`, `WARNING`

Avoid:
- `VERIFY SURFACE` in user-facing output
- `agentic`, `autonomous`, `orchestrate`
- Any language implying the command will act on the recommendation

---

## 5. Status Semantics

| Status | Meaning |
|---|---|
| `READY_FOR_REVIEW` | Verification evidence present and passing, no blockers, git status is clean or expected |
| `NEEDS_VERIFICATION` | No verification evidence available, or evidence is stale/unavailable |
| `WARNING` | Verify passed but there are non-blocking concerns (e.g. unexpected extra files) |
| `BLOCKED` | A hard condition prevents closeout (e.g. active blocked packet, contract conflict) |

Default: if verification state is unknown → `NEEDS_VERIFICATION`. Never assume passing.

---

## 6. Commit Prefix Inference

v1 prefix inference from changed file paths (heuristic, not authoritative):

| Changed paths contain | Suggested prefix |
|---|---|
| `src/commands/`, `src/lib/`, `src/cli/` | `feat:` or `refactor:` depending on whether it is new |
| `src/test/` only | `test:` |
| `.scaffoldai/` only | `process:` |
| `README`, `docs/`, `.md` | `docs:` |
| `package.json` only | `chore:` |
| Mixed `src/` + `.scaffoldai/` | `process:` (scaffoldai changes dominate) |
| No clear signal | omit — let human decide |

The human is never required to use the suggested prefix. It is advisory only.

Active contract `allowed_packet_types` should also inform the suggestion:
- `process` / `contract` / `planning` → prefer `process:`
- `product` / `agent` → prefer `feat:` or `refactor:`

---

## 7. Verification Evidence

v1 challenge: the command runs in a fresh process with no memory of prior verification runs.

Options considered:

**Option A — Require `--verify-passed` flag**
The human passes `--verify-passed` after running verify manually.
- Pros: explicit, honest, simple to implement.
- Cons: extra friction; humans might skip it.

**Option B — Inspect a timestamped verify-result file**
`verify.js` writes a small `verify-result.json` after each run.
- Pros: automatic, no extra human input needed.
- Cons: adds a side effect to `verify.js`; introduces a new file to maintain.

**Option C — Default to NEEDS_VERIFICATION unless `--verify-passed` is provided**
No file writes needed; safe default.
- Pros: safe, simple, honest. Works without changing verify.js.
- Cons: always reports NEEDS_VERIFICATION unless flag is passed.

**Lean for v1: Option C** — default to `NEEDS_VERIFICATION`, allow `--verify-passed` to unlock `READY_FOR_REVIEW`.
Revisit Option B in v2 if the extra friction becomes a problem.

---

## 8. Safety Rules

- No commits, no file writes, no auto-fixes.
- No MCP, no agent chaining, no background work.
- If verification evidence is unavailable → `NEEDS_VERIFICATION`, not `READY_FOR_REVIEW`.
- Never block the human: closeout reports findings and recommends; the human decides.
- Do not run `verify:full` or E2E automatically.
- Print everything before making a status determination so output is traceable.

---

## 9. Open Questions

1. **How should closeout detect last successful verify?**
   v1 lean: use `--verify-passed` flag as explicit human attestation. No automatic detection.

2. **Should v1 require the user to pass verify result manually via `--verify-passed`?**
   Lean: yes for v1. Keeps implementation simple and honest.

3. **Should closeout infer commit prefix from changed files?**
   Lean: yes, heuristically. Advisory only; human is not required to use it.

4. **Should closeout produce a markdown summary for commit/PR notes later?**
   Lean: defer to v2. v1 uses plain terminal output only.

5. **Should JSON output be deferred for MCP compatibility?**
   Lean: yes. v2 may add `--format=json`. v1 is plain text only.

6. **Should `NEXT SAFE ACTION` always be a single concrete statement?**
   Lean: yes. One action per closeout. If multiple things are needed, list the first blocker only.

---

## 10. Non-Goals (v1)

- No automatic commit.
- No auto-generated changelog.
- No PR creation.
- No reentry or handoff mutation.
- No multi-packet batching.
- No diff summarization beyond file listing.
- No JSON output.

---

## 11. Implementation Checklist (for v1 execution task)

- [ ] `src/commands/scaffoldai-closeout.js` — thin command
- [ ] Reuse `src/lib/gitStatus.js` and `src/lib/resolveVerifyCommand.js`
- [ ] Add commit prefix inference in command (or small helper if reuse is likely)
- [ ] Parse `--verify-passed` flag
- [ ] `src/cli/index.js` — add `closeout` dispatch under `scaffoldai` subcommand block
- [ ] `package.json` — add `"scaffoldai:closeout": "node src/index.js scaffoldai closeout"`
- [ ] `src/test/unit-scaffoldai-closeout.js` — test recommend-only mode, `--verify-passed` flag, blocked state
- [ ] Wire test into `verify.js` under `GROUPS.SYSTEM` / `SURFACES.SCAFFOLDAI`
- [ ] Confirm `npm run verify:scaffoldai` passes
- [ ] Confirm `npm run verify` passes
