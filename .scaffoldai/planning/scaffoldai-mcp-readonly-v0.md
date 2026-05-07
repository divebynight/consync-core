# Planning — scaffoldai-mcp-readonly-v0

Created: 2026-05-06
Decided: 2026-05-06
Status: DECIDED

---

## 0. Decisions (2026-05-06)

These decisions were made after the PLAN phase was verified. They govern v0 implementation scope.

### Accepted

- **5-tool v0 list accepted.** Tools are: `scaffoldai_status`, `scaffoldai_preflight`, `scaffoldai_question`, `scaffoldai_verify_recommend`, `scaffoldai_closeout_readiness`. No additional tools in v0.

- **`@modelcontextprotocol/sdk` accepted as implementation dependency.** Pin to a specific version in `package.json` `dependencies`. Use the custom stdio fallback (Option B) only if the SDK creates blocking friction during implementation.

- **`src/mcp/` confirmed as source location.** Structure: `src/mcp/server.js`, `src/mcp/tools/`, `src/mcp/lib/tool-runner.js`. Not reachable from `src/cli/index.js` or the verify runner.

- **v0 scope boundaries confirmed:**
  - No `--run` flag — `scaffoldai_verify_recommend` returns command recommendation only, never runs it.
  - No `--verify-passed` — `scaffoldai_closeout_readiness` always returns `verify_evidence: "not provided"`.
  - No write tools of any kind.
  - No arbitrary shell execution.
  - No unrestricted file reads (only `.scaffoldai/state/`, `.scaffoldai/planning/`, `package.json`, git status).
  - No autonomous chaining or orchestration.
  - No Consync product controls (`src/core/`, `src/electron/` are out of scope).

### Deferred

- **`scaffoldai_verify_run`** — deferred to v1. Requires a safe verify evidence model before adding run capability to the MCP surface.

- **`scaffoldai_closeout_readiness` with verify evidence** — deferred to v1. Tied to the verify evidence model above.

- **`scaffoldai_intake_classify`** — deferred to v1.

- **Contract-level `max_permitted_class` in MCP surface** — deferred to v2 (follows contract field deferral from execution classification decisions).

### Out of Scope

- Consync product behavior exposure via MCP.
- Any MCP tool with execution class above `READ_ONLY`.
- Session-scoped authority or dynamic permission grants.

---

## 1. Purpose

ScaffoldAI has a clean, verified runtime loop. An AI/tool client — including a Copilot agent, MCP-capable IDE extension, or external tool — should be able to observe ScaffoldAI runtime state through a bounded, read-only tool surface.

This document plans the first MCP (Model Context Protocol) surface for ScaffoldAI: a v0 read-only layer that exposes existing runtime commands safely through structured tool calls.

The goal is observation, not authority. An MCP client reading these tools should be able to understand:

- What is the current ScaffoldAI state?
- Is it safe to begin work?
- What questions are open?
- Which VERIFY COMMAND and TARGET are recommended?
- Is this work ready for human review?

It cannot use these tools to modify files, execute verification, commit code, approve work, or act as an orchestrator.

## 1.1 Current v0 Boundary Clarification

- The MCP server is a local stdio process (`npm run scaffoldai:mcp` / `node src/mcp/server.js`).
- The MCP Inspector is a local validation UI only. It may provide a localhost browser interface while connecting to the stdio server, but it is not runtime authority and is not a production transport.
- MCP transport tests validate protocol behavior, tool registration, and read-only semantic contracts over stdio. They do not add authority, tools, or runtime execution.
- `.scaffoldai/tmp/mcp-runtime-snapshot.json` is produced by a separate Runtime Command that calls these MCP tools over local stdio and writes only that snapshot artifact.
- v0 MCP clients may observe and recommend only. MCP output does not approve closeout, provide verification evidence, or authorize a client to run a VERIFY COMMAND.

---

## 2. Non-Goals (v0)

- Does NOT implement write tools of any kind.
- Does NOT execute `npm run verify` or any verification command.
- Does NOT accept `--verify-passed` — no write-capable flags.
- Does NOT access paths outside the project root.
- Does NOT use `/tmp` for any output.
- Does NOT expose arbitrary shell execution.
- Does NOT expose Consync product controls (capture, bookmark, export, session).
- Does NOT add autonomous chaining, dispatch, or orchestration.
- Does NOT implement commit, edit, delete, move, rename, or generate capabilities.
- Does NOT claim authority to approve, close, or declare work complete.
- Does NOT replace the manual runtime loop.
- Does NOT add MCP server infrastructure to production Consync behavior.

---

## 3. MCP Tool List (v0)

Five read-only tools. All classified as execution class `READ_ONLY`.

| Tool | Maps To | Description |
|------|---------|-------------|
| `scaffoldai_status` | `scaffoldai status` | Returns current runtime state snapshot |
| `scaffoldai_preflight` | `scaffoldai preflight` | Returns preflight safety check result |
| `scaffoldai_question` | `scaffoldai question` | Returns open structural questions |
| `scaffoldai_verify_recommend` | `scaffoldai verify` (recommend mode) | Returns recommended VERIFY COMMAND — does not run it |
| `scaffoldai_closeout_readiness` | `scaffoldai closeout` (no `--verify-passed`) | Returns closeout readiness without claiming review approval |

---

## 4. Tool Contracts

### 4.1 `scaffoldai_status`

**Description:** Returns a snapshot of current ScaffoldAI runtime state.

**Inputs:** None.

**Internal call:** Reuses the logic of `scaffoldai-status.js` — reads `active-contract.json`, `active-stream.md`, `next-action.md`, git status. Does not invoke the CLI subprocess.

**Output fields:**
```json
{
  "tool": "scaffoldai_status",
  "execution_class": "READ_ONLY",
  "active_packet": "(none)" | "<packet_id>",
  "stream": "<stream_name>",
  "git_status": "clean" | "dirty (<n> file(s))",
  "mode": "<contract_mode>",
  "verify_command": "<command>",
  "next_safe_action": "<text>",
  "status": "ON_TRACK" | "WARNING" | "BLOCKED"
}
```

**Forbidden:** No file writes. No subprocess execution beyond `git status`.

---

### 4.2 `scaffoldai_preflight`

**Description:** Returns preflight safety check results. Tells a client whether it is safe to begin a new packet.

**Inputs:** None.

**Internal call:** Reuses the check logic of `scaffoldai-preflight.js` — checks required state files, contract coherence, active packet presence, git cleanliness, and required verify scripts.

**Output fields:**
```json
{
  "tool": "scaffoldai_preflight",
  "execution_class": "READ_ONLY",
  "checks": [
    { "name": "<check_name>", "status": "PASS" | "WARN" | "BLOCKED", "detail": "<text>" }
  ],
  "next_safe_action": "<text>",
  "status": "PASS" | "WARN" | "BLOCKED"
}
```

**Forbidden:** No file writes. No subprocess execution.

---

### 4.3 `scaffoldai_question`

**Description:** Returns open structural questions detected in the current repo state.

**Inputs:** None.

**Internal call:** Reuses the check logic of `scaffoldai-question.js` — all 9 structural checks including `EXECUTION_CLASS_BOUNDARY`.

**Output fields:**
```json
{
  "tool": "scaffoldai_question",
  "execution_class": "READ_ONLY",
  "active_packet": "(none)" | "<packet_id>",
  "stream": "<stream_name>",
  "questions_detected": 0,
  "questions": [
    {
      "index": 1,
      "category": "<CATEGORY>",
      "severity": "BLOCKED" | "QUESTION" | "WARNING",
      "condition": "<text>",
      "why": "<text>",
      "action": "<text>"
    }
  ],
  "next_safe_action": "<text>",
  "status": "CLEAR" | "QUESTION" | "WARNING" | "BLOCKED"
}
```

**Forbidden:** No file writes. No subprocess execution.

---

### 4.4 `scaffoldai_verify_recommend`

**Description:** Returns the recommended VERIFY COMMAND for the current contract and stream. Does NOT run verification.

**Inputs:** None. (No `--run` flag, no target selection in v0.)

**Internal call:** Reuses `resolveVerifyCommand()` from `src/lib/resolveVerifyCommand.js` directly.

**Output fields:**
```json
{
  "tool": "scaffoldai_verify_recommend",
  "execution_class": "READ_ONLY",
  "verify_command": "npm run verify:scaffoldai" | "npm run verify" | "(unavailable)",
  "target": "scaffoldai" | "consync" | "all",
  "reason": "<text>",
  "note": "This tool recommends a VERIFY COMMAND. It does not execute verification.",
  "next_safe_action": "Run: <verify_command>"
}
```

**Forbidden:** No subprocess execution. No `spawnSync`. No file writes. Does not invoke `npm run` or any shell command.

**v0 constraint:** No `--run` mode. The tool returns what to run, not results of running it. Adding run capability requires a separate planning pass and is deferred.

---

### 4.5 `scaffoldai_closeout_readiness`

**Description:** Returns closeout readiness state — commit prefix inference, blockers, and advisory information. Does NOT accept `--verify-passed`. Does NOT declare work approved or complete.

**Inputs:** None in v0.

**Internal call:** Reuses `inferCommitPrefix()` and git status reading from `scaffoldai-closeout.js`. Uses `verifyPassed: false` hardcoded — no way to pass verify evidence through MCP in v0.

**Output fields:**
```json
{
  "tool": "scaffoldai_closeout_readiness",
  "execution_class": "READ_ONLY",
  "git_status": "clean" | "dirty",
  "changed_files": ["<path>", "..."],
  "suggested_commit_prefix": "feat:" | "process:" | "docs:" | "chore:" | "test:" | "(none)",
  "blockers": [],
  "verify_evidence": "not provided",
  "note": "This tool reports readiness. It does not approve, commit, or close work.",
  "next_safe_action": "<text>",
  "status": "CLEAN" | "NEEDS_VERIFICATION" | "WARNING" | "BLOCKED"
}
```

**v0 constraint:** `verify_evidence` is always `"not provided"`. Status will be `NEEDS_VERIFICATION` unless git is clean with no changes (`CLEAN`) or there are hard blockers (`BLOCKED`). `READY_FOR_REVIEW` is not available in v0 MCP surface — that requires human-provided verify evidence.

**Forbidden:** No file writes. No subprocess beyond git. Does not approve or close work.

---

## 5. Execution Class Declaration

All v0 MCP tools are execution class `READ_ONLY` as defined in `scaffoldai-execution-classification-v1.md`.

| Tool | Execution Class | Risk | Can Block? | Writes Files? |
|------|----------------|------|:----------:|:-------------:|
| `scaffoldai_status` | READ_ONLY | None | No | No |
| `scaffoldai_preflight` | READ_ONLY | None | No | No |
| `scaffoldai_question` | READ_ONLY | None | No | No |
| `scaffoldai_verify_recommend` | READ_ONLY | None | No | No |
| `scaffoldai_closeout_readiness` | READ_ONLY | None | No | No |

The MCP surface itself does not change execution class at call time. A tool client reading these outputs is responsible for its own action class when it chooses how to act on the information.

---

## 6. Allowed and Forbidden Operations

### Allowed
- Reading `.scaffoldai/state/*.md` and `.scaffoldai/state/*.json`
- Reading `.scaffoldai/planning/*.md` (for `EXECUTION_CLASS_BOUNDARY` check)
- Reading `.scaffoldai/streams/` directory listing
- Reading `package.json` scripts block
- Running `git status` (read-only git invocation)
- Returning structured JSON output to the MCP client
- Logging to stdout within the MCP server process

### Forbidden
- Writing to any file in the repo
- Writing to `.scaffoldai/tmp/` (MCP surface is not a runtime command)
- Writing to `/tmp`, `~/`, or any path outside project root
- Running `npm run *` or any verification command
- Running `git add`, `git commit`, `git push`, `git reset`, or any write git operation
- Spawning arbitrary shell commands
- Reading files outside the project root
- Reading `.env`, credentials, or secrets
- Modifying `active-contract.json`, `next-action.md`, or any state file
- Claiming authority to approve, commit, or close work in output text

---

## 7. Output Format Recommendation

**Primary format: JSON.**

MCP tool responses should return structured JSON. The CLI runtime commands return human-readable terminal output. The MCP layer returns machine-readable JSON — this is the key architectural distinction.

**Rationale:**
- MCP clients (AI agents, IDE integrations) consume structured data more reliably than parsed terminal output.
- JSON output is deterministic and testable.
- JSON avoids terminal formatting, ANSI codes, and column-alignment drift.
- The human-readable CLI surface is preserved separately; MCP does not replace it.

**Error representation:**
```json
{
  "tool": "<tool_name>",
  "execution_class": "READ_ONLY",
  "error": true,
  "error_message": "<description>",
  "next_safe_action": "Restore required state files and retry."
}
```

Errors should never expose stack traces, file system paths outside `.scaffoldai/`, or internal Node.js error messages directly. Wrap and sanitize before returning.

---

## 8. Source Location Recommendation

```
src/mcp/
  server.js           — MCP server entry point (v0: stdio transport)
  tools/
    scaffoldai-status.js
    scaffoldai-preflight.js
    scaffoldai-question.js
    scaffoldai-verify-recommend.js
    scaffoldai-closeout-readiness.js
  lib/
    tool-runner.js    — shared helper: wraps a check function, catches errors, returns JSON
```

**Rationale:**
- `src/mcp/` is a clean, isolated surface. It does not pollute `src/commands/` (CLI layer) or `src/lib/` (shared logic).
- MCP tools import from `src/lib/` and `src/commands/` — they reuse existing logic, they do not duplicate it.
- `src/mcp/server.js` is the only entry point. No MCP logic leaks into CLI dispatch or the main index.
- The `src/mcp/` directory is explicitly excluded from `src/cli/index.js` and the main runtime loop.

**CLI separation:** `src/index.js` does NOT dispatch to MCP tools. MCP is a separate server process, not a CLI subcommand.

---

## 9. Implementation Options

### Option A — `@modelcontextprotocol/sdk` (recommended)
Use the official MCP TypeScript/JavaScript SDK. Provides:
- Tool registration with schema validation
- stdio and SSE transports
- Request/response lifecycle management

**Pros:** Standard, maintained, IDE-compatible. Copilot and other MCP clients will recognize standard schema.
**Cons:** Adds a dependency. Requires the SDK to be available and pinned.

**Acceptable under project dependency policy:** Yes. The MCP SDK is a small, stable utility library — comparable to `yargs` or `commander` for CLI. It is directly justified by the current task.

### Option B — Minimal custom stdio handler
Implement a lightweight JSON-RPC 2.0 over stdio handler without any SDK dependency.

**Pros:** Zero dependencies, fully transparent, easy to audit.
**Cons:** More code to maintain. MCP protocol details must be implemented manually (method dispatch, schema, error codes).

**Verdict:** Acceptable for v0 if the SDK adds friction. The protocol is simple enough to implement in ~100 lines.

### Recommendation
Use **Option A** (`@modelcontextprotocol/sdk`) for v0. It is the path of least resistance for Copilot compatibility and future expansion. If the SDK introduces unexpected complexity during implementation, fall back to Option B.

---

## 10. Package and Dependency Choices

- **`@modelcontextprotocol/sdk`** — MCP protocol layer. Pin to a specific version.
- **No additional dependencies** — all business logic reuses existing `src/lib/` functions.
- **No `axios`, `got`, `node-fetch`** — no network access in v0.
- **No `fs-extra`, `glob`, `fast-glob`** — use built-in `fs` and `path`.
- **No test framework additions** — reuse existing Node.js `assert`-based test pattern.

Add to `package.json` `dependencies` (not `devDependencies`) since the MCP server is a runtime artifact.

---

## 11. How the MCP Surface Proves It Is Read-Only

Three layers of read-only proof:

1. **Code structure:** `src/mcp/tools/*.js` files import only from `src/lib/` (shared read functions). They do not import `fs.writeFile`, `fs.appendFile`, `fs.mkdir`, or any write-capable module.

2. **Execution class declaration:** Each tool handler declares `execution_class: "READ_ONLY"` in its response. Any output containing a different class is a test failure.

3. **Test assertions:** The `unit-scaffoldai-mcp-readonly.js` test suite asserts:
   - No MCP tool response contains `error: true` in healthy repo state.
   - No MCP tool triggers a file write (verified by checking `src/mcp/` for write API calls).
   - All tool responses include `"execution_class": "READ_ONLY"`.
   - `scaffoldai_verify_recommend` does not include verification pass/fail results.
   - `scaffoldai_closeout_readiness` does not include `READY_FOR_REVIEW` status.

---

## 12. Test and Verification Plan

### Unit tests: `src/test/unit-scaffoldai-mcp-readonly.js`

Test cases:

1. MCP server module loads without error.
2. All 5 tools are registered.
3. Each tool handler returns valid JSON.
4. Each tool response includes `execution_class: "READ_ONLY"`.
5. `scaffoldai_status` returns a `status` field with a valid value.
6. `scaffoldai_preflight` returns a `checks` array.
7. `scaffoldai_question` returns `questions_detected` as a non-negative integer.
8. `scaffoldai_question` returns 0 questions in healthy repo state.
9. `scaffoldai_verify_recommend` returns a `verify_command` string.
10. `scaffoldai_verify_recommend` does NOT return `STATUS: PASS` or `STATUS: FAIL` (no run results).
11. `scaffoldai_closeout_readiness` returns a `status` field.
12. `scaffoldai_closeout_readiness` does NOT return `READY_FOR_REVIEW` in v0.
13. `scaffoldai_closeout_readiness` always returns `verify_evidence: "not provided"`.
14. No tool handler file in `src/mcp/tools/` contains `writeFile`, `appendFile`, `mkdirSync`, or `writeFileSync`.
15. MCP server entry point (`server.js`) is not reachable from `src/cli/index.js`.

### Wire into `verify.js`

Add under `GROUPS.SYSTEM / SURFACES.SCAFFOLDAI`:
```
runNodeStep("[verify] ScaffoldAI MCP read-only surface", [path.join(repoRoot, "src", "test", "unit-scaffoldai-mcp-readonly.js")], GROUPS.SYSTEM, SURFACES.SCAFFOLDAI);
```

### npm script
```
"scaffoldai:mcp": "node src/mcp/server.js"
```

---

## 13. Risks and Guardrails

### Risk: Tool output leaking sensitive file paths
MCP tool output should not expose full absolute filesystem paths. Return relative paths within the project root only.

**Guardrail:** Strip `repoRoot` prefix from any path returned in tool output.

### Risk: MCP server becoming an execution surface
A client could call `scaffoldai_verify_recommend` and then independently execute the returned command. This is expected and acceptable — the tool returns a recommendation, not a result. The boundary is clear.

**Guardrail:** Tool output must include the `note` field explicitly stating the tool does not execute the command.

### Risk: SDK version drift
The MCP SDK API may change. Pinning prevents silent behavior changes.

**Guardrail:** Pin the SDK version in `package.json`. Do not use `"*"` or `"latest"`.

### Risk: MCP surface being confused with Consync product behavior
The Consync product controls (capture, bookmark, session) must not appear in the MCP surface.

**Guardrail:** `src/mcp/tools/` must not import from `src/core/`, `src/electron/`, or any Consync product module. Imports are restricted to `src/lib/` and `src/commands/`.

### Risk: Scaffoldai MCP server starting automatically
The MCP server should not start as a side effect of the CLI or verify runner.

**Guardrail:** `src/mcp/server.js` is invoked only via `scaffoldai:mcp` script or explicit MCP client configuration. It is not imported by any other module.

### Risk: `git status` subprocess output being untrusted
`git status` output is parsed to count changed files and extract paths. Malformed output should not crash the server.

**Guardrail:** Wrap all git subprocess calls in try/catch. Return `git_status: "error"` on failure rather than throwing.

---

## 14. Separation from Consync Product Behavior

The MCP surface is a ScaffoldAI process layer tool. It is not part of the Consync runtime.

| Layer | Location | Accessible from MCP? |
|-------|----------|:-------------------:|
| Consync product (capture, bookmark, session) | `src/core/`, `src/electron/` | No |
| Consync CLI commands | `src/commands/` (non-scaffoldai) | No |
| Consync lib | `src/lib/` (non-scaffoldai) | No |
| ScaffoldAI lib | `src/lib/resolveVerifyCommand.js`, `src/lib/getInFlightPacket.js`, `src/lib/gitStatus.js` | Yes |
| ScaffoldAI commands | `src/commands/scaffoldai-*.js` | Logic only — not subprocess invoked |

MCP tools reuse shared lib functions, not CLI subprocess invocations. This keeps the surface deterministic and avoids spawning child processes unnecessarily.

---

## 15. Future Evolution Path

Once v0 is live and verified:

1. **`scaffoldai_verify_run`** (v1) — Runs `npm run verify:scaffoldai` and returns structured pass/fail evidence. Requires a safe evidence model and a new execution class (`LOCAL_WRITE` for log output).

2. **`scaffoldai_closeout_readiness --verify-passed`** (v1) — Accepts a verify evidence token (timestamp + command + result) rather than a self-reported flag. Requires the evidence model from verify_run.

3. **`scaffoldai_intake_classify`** (v1) — Returns classification result for a proposed packet type. Read-only, reuses `intakeClassify.js`.

4. **`scaffoldai_question` with execution class filter** (v1) — Allows filtering by category, e.g., return only `EXECUTION_CLASS_BOUNDARY` questions.

5. **Contract-level `max_permitted_class` gating** (v2) — Once `active-contract.json` has a `max_permitted_class` field, the MCP surface can surface when a pending action exceeds the permitted class.

---

## 16. Recommended Next Step

**Do not implement yet.**

Before implementation, confirm:

1. Human confirms the 5-tool v0 list is correct and complete.
2. Human confirms `@modelcontextprotocol/sdk` is acceptable as a dependency, or approves the custom stdio fallback.
3. Human confirms `src/mcp/` as the source location.
4. Human confirms that `scaffoldai_verify_recommend` (no run) and `scaffoldai_closeout_readiness` (no `--verify-passed`) are the correct v0 scope boundaries.

Once confirmed, implementation proceeds as:
1. Install `@modelcontextprotocol/sdk` (or scaffold custom handler).
2. Create `src/mcp/server.js` and `src/mcp/tools/`.
3. Create `src/test/unit-scaffoldai-mcp-readonly.js`.
4. Wire into `verify.js` and `package.json`.
5. Run `npm run verify:scaffoldai`.

---

## 17. Verification Expectation

After this planning doc is created:

```
npm run verify:scaffoldai
```

Expected: OVERALL: PASS — no implementation changes made, no tests affected.
