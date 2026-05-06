# Planning — scaffoldai-verify-command-v1

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

`scaffoldai verify` is the runtime verification decision layer for the ScaffoldAI process.

It reads current state (active contract, active stream) and determines which verification command is appropriate for the current context.

It does not replace `npm run verify` or `npm run verify:scaffoldai`. Those remain the canonical execution commands and continue to be invoked directly.

`scaffoldai verify` answers: "Given the current state, what should I run to verify, and did it pass?"

---

## 2. v1 Behavior

Default (no flags):
- Read `.scaffoldai/state/active-contract.json` if present.
- Read `package.json` verify scripts.
- Determine the recommended verify command based on the contract's `allowed_packet_types`.
- Print the recommendation without executing.
- Exit 0.

With `--run`:
- Perform the same determination.
- Execute the recommended command as a child process.
- Report the result (PASS or FAIL) and exit with the child process exit code.

Resolution logic (same as `recommendedVerifySurface` in status command):
- `allowed_packet_types` includes `process`, `contract`, or `planning` → `npm run verify:scaffoldai`
- `allowed_packet_types` includes `product` or `agent` → `npm run verify:consync`
- No contract or unknown types → `npm run verify`

---

## 3. Command Modes

| Invocation | Behavior |
|---|---|
| `node src/index.js scaffoldai verify` | Recommend only — print RECOMMENDED VERIFY, exit 0 |
| `node src/index.js scaffoldai verify --run` | Run recommended command, report result |
| `node src/index.js scaffoldai verify --target=scaffoldai` | Pin to `verify:scaffoldai`, run if --run also passed |
| `node src/index.js scaffoldai verify --target=consync` | Pin to `verify:consync`, run if --run also passed |

`--target` overrides the contract-derived recommendation. Use `--target` for explicit target pinning.
`--run` is required to execute. Without it, the command always recommends and exits 0.

---

## 4. Output Format

Recommend mode (default):

```
[scaffoldai verify]

RECOMMENDED VERIFY:   npm run verify:scaffoldai
ACTIVE CONTRACT:      process / contract / planning
REASON:               allowed_packet_types includes process

Run with:  node src/index.js scaffoldai verify --run

STATUS: RECOMMEND
```

Run mode (`--run`):

```
[scaffoldai verify]

SELECTED VERIFY:      npm run verify:scaffoldai
ACTIVE CONTRACT:      process / contract / planning

Running npm run verify:scaffoldai ...

[verify] PASS

STATUS: PASS
```

Failure run mode:

```
[scaffoldai verify]

SELECTED VERIFY:      npm run verify:scaffoldai
ACTIVE CONTRACT:      process / contract / planning

Running npm run verify:scaffoldai ...

[verify] FAIL

STATUS: FAIL
```

---

## 5. Terminology

Use:
- `RECOMMENDED VERIFY` — when reporting a recommendation without running
- `SELECTED VERIFY` — when a command was chosen and executed
- `VERIFY COMMAND` — generic label in other scaffoldai command output (status)
- `--target` — user-facing ScaffoldAI runtime flag for explicit verify selection (`--target=scaffoldai`, `--target=consync`, `--target=full`)

Avoid:
- `VERIFY SURFACE` in user-facing output
- `--surface` in ScaffoldAI runtime commands (`surface` is an internal verify-runner implementation detail, not preferred runtime language)
- `agent`, `agentic`, `autonomous`, `orchestrate`

---

## 6. Safety Rules

- Do not run `verify:full` or `verify:consync:e2e` automatically. Full/E2E must be explicitly requested.
- Do not commit.
- Do not modify any files.
- Do not auto-fix verification failures.
- If the contract is missing or ambiguous, default to recommend-only and suggest `npm run verify`.
- Print the command that will be run before running it.

---

## 7. Open Questions

1. **Should `--run` be the opt-in for execution, or should recommend be a separate subcommand (`scaffoldai verify --recommend`)?**
   Lean: `--run` as opt-in is cleaner. Default is always safe (no side effects).

2. **How should full verify be selected?**
   Lean: Only via explicit `--target=full` or `--full` flag. Never selected automatically.

3. **Should `--target` accept `full` as a value?**
   Lean: Yes, but only if `--run` is also passed. Without `--run`, print recommendation only.

4. **Should output support `--format=json` for future MCP compatibility?**
   Lean: Yes, plan for it in v2. v1 uses plain text only.

5. **Should verify selection consult the active packet type (in_flight_packet) directly?**
   Lean: Yes. If `in_flight_packet` is set, prefer the packet's type to determine the target over `allowed_packet_types`.

---

## 8. Implementation Checklist (for v1 execution task)

- [ ] `src/lib/resolveVerifyCommand.js` — pure function: `resolveVerifyCommand(contract, flags)` → `{ command, reason }`
- [ ] `src/commands/scaffoldai-verify.js` — thin command using the resolver
- [ ] `src/cli/index.js` — add `verify` dispatch under `scaffoldai` subcommand block
- [ ] `package.json` — add `"scaffoldai:verify": "node src/index.js scaffoldai verify"`
- [ ] `src/test/unit-scaffoldai-verify.js` — test recommend mode and run mode
- [ ] Wire test into `verify.js` under `GROUPS.SYSTEM` / `SURFACES.SCAFFOLDAI`
- [ ] Confirm `npm run verify:scaffoldai` passes
- [ ] Confirm `npm run verify` passes
