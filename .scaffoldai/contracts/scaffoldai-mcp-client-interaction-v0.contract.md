# ScaffoldAI MCP Client Interaction Contract — v0

Created: 2026-05-06
Status: CONTRACT

---

## 1. Purpose

Define how MCP-aware AI clients may interact with the ScaffoldAI MCP surface.

v0 is read-only observation only. An MCP client may ask ScaffoldAI for structured runtime observations, summarize those observations for the human, and recommend the next human-controlled action. It must not modify repo state, run workflows, approve work, or infer authority that the MCP tools do not provide.

The human remains the final authority for all decisions, execution, verification, closeout, commits, pushes, and workflow transitions.

---

## 2. Scope

This contract applies to AI clients using the ScaffoldAI MCP server and its v0 read-only tools:

- `scaffoldai_status`
- `scaffoldai_preflight`
- `scaffoldai_question`
- `scaffoldai_verify_recommend`
- `scaffoldai_closeout_readiness`

It also applies to AI clients consuming `.scaffoldai/tmp/mcp-runtime-snapshot.json` as a pasted or uploaded runtime observation bundle.

The MCP surface is separate from Runtime Commands. MCP tools observe and report. Runtime Commands remain the human-visible command layer, such as:

- `npm run scaffoldai:status`
- `npm run scaffoldai:preflight`
- `npm run scaffoldai:question`
- `npm run scaffoldai:verify`
- `npm run scaffoldai:closeout`
- `npm run scaffoldai:mcp:snapshot`

---

## 3. Assumptions

This contract assumes:

- MCP clients may be ChatGPT, Codex, Copilot, or future MCP-aware clients.
- The v0 MCP surface is available through local stdio transport only.
- The v0 MCP surface exposes only the 5 read-only tools listed in this contract.
- Runtime semantics are deterministic and should be preserved in client responses.
- MCP observations can become stale when files change, verification runs, branches switch, or a human resumes work after interruption.
- User claims are important context, but MCP observations are the current structured ScaffoldAI runtime evidence available to the client.
- MCP observations do not replace the underlying `.scaffoldai/state/` and `.scaffoldai/streams/` source-of-truth surfaces.
- MCP Inspector is a local validation UI, not runtime authority or production transport.
- MCP transport tests validate protocol behavior and read-only contracts, not closeout approval or verification evidence.
- The runtime snapshot JSON is a generated observation bundle, not an interactive MCP session.
- Human approval is required before any action above `READ_ONLY`.

---

## 4. Execution Class

All v0 MCP tool observations are execution class:

```text
READ_ONLY
```

An MCP client must preserve and cite `execution_class` when it materially affects a recommendation.

`READ_ONLY` means:

- The MCP tool may observe state.
- The MCP tool may return structured JSON.
- The MCP tool may recommend a Runtime Command.
- The MCP tool may not write files.
- The MCP tool may not run verification.
- The MCP tool may not approve closeout.
- The MCP tool may not commit, push, stage, edit, delete, rename, or move files.

The snapshot runtime command is also `READ_ONLY` observation, with one explicit artifact write under `.scaffoldai/tmp/`.

Execution class controls client behavior:

| execution_class | Client behavior |
|---|---|
| `READ_ONLY` | Observe, summarize, recommend, and ask the human before any action. |
| Missing or unknown | Treat as unsafe. Stop and ask the human. |
| Anything above `READ_ONLY` | Out of scope for v0. Stop and ask the human. |

---

## 5. Allowed Behavior

An MCP-aware AI client may:

- Call the v0 MCP tools over local stdio transport.
- Read and summarize the JSON returned by those tools.
- Use MCP observations to understand current ScaffoldAI state.
- Recommend a human-run VERIFY COMMAND from `scaffoldai_verify_recommend`.
- Quote or summarize the `NEXT SAFE ACTION` from tool output.
- Surface `TARGET`, status, warnings, blockers, and open questions.
- Compare multiple MCP observations in the same session when the human asks for status or closeout reasoning.
- Ask the human for approval before any non-read-only action.
- Tell the human when MCP observations are stale, partial, missing, or inconsistent.
- Ask the human to run a Runtime Command or VERIFY COMMAND.

Allowed client output examples:

```text
MCP reports execution_class READ_ONLY. The recommended VERIFY COMMAND is npm run verify:scaffoldai with TARGET scaffoldai.
```

```text
MCP closeout_readiness reports NEEDS_VERIFICATION, so I cannot treat this as ready for review yet.
```

---

## 6. Forbidden Behavior

An MCP-aware AI client must not:

- Add, expose, or request write-capable MCP tools in v0.
- Treat MCP as an orchestrator.
- Auto-dispatch multiple process agents.
- Automatically run Runtime Commands unless the human explicitly asks.
- Automatically run the VERIFY COMMAND returned by MCP.
- Execute shell commands through MCP.
- Treat a recommendation as permission to execute a shell command.
- Treat `scaffoldai_verify_recommend` as verification evidence.
- Treat `scaffoldai_closeout_readiness` as human approval.
- Treat MCP Inspector success or MCP transport test success as closeout approval or product verification evidence.
- Infer `READY_FOR_REVIEW` unless the tool explicitly returns that status in a future phase and the human accepts the evidence model.
- Commit, push, stage, edit, delete, move, or rename files through MCP.
- Modify `.scaffoldai/state/` or `.scaffoldai/streams/` based on MCP output.
- Hide partial MCP failures behind a clean summary.
- Present MCP output as more authoritative than the underlying ScaffoldAI state files.
- Use remote access, HTTP, ngrok, SSE, WebSocket, or browser transport for v0 MCP interactions.
- Replace human judgment with an automated decision.

Forbidden client claims:

```text
MCP says verification passed.
```

```text
MCP approved closeout.
```

```text
I can commit this because closeout_readiness returned NEEDS_VERIFICATION.
```

```text
I will run the full workflow automatically from status to closeout.
```

---

## 7. Required Call Sequence

The default v0 observation sequence is:

1. `scaffoldai_status`
2. `scaffoldai_preflight`
3. `scaffoldai_question`
4. `scaffoldai_verify_recommend`
5. `scaffoldai_closeout_readiness`

This is the preferred sequence for general status, planning, closeout assessment, or handoff reasoning.

Minimum required MCP call sequence before making recommendations:

1. Call `scaffoldai_status`.
2. Call `scaffoldai_question`.
3. If the recommendation concerns starting or continuing work, call `scaffoldai_preflight`.
4. If the recommendation names verification, call `scaffoldai_verify_recommend`.
5. If the recommendation concerns closeout or commit readiness, call `scaffoldai_closeout_readiness`.

If the client cannot complete the minimum sequence required for the requested recommendation, it must report the missing observation and ask the human how to proceed.

### 7.1 When to Call `scaffoldai_status`

An MCP client must call `scaffoldai_status`:

- At the start of any MCP-assisted ScaffoldAI session.
- Before answering "what is the current state?"
- Before recommending a Runtime Command.
- Before interpreting closeout state from an older observation.
- After the human says they changed files, ran verification, switched branches, or resumed work.

The client may rely on `scaffoldai_status` for current state, active packet, current mode, git cleanliness summary, and the currently recommended VERIFY COMMAND as reported by ScaffoldAI.

### 7.2 When to Call `scaffoldai_preflight`

An MCP client must call `scaffoldai_preflight`:

- Before advising that new work can begin.
- Before saying a packet appears safe to mount or continue.
- When `scaffoldai_status` reports warnings or a dirty working tree.
- When the human asks whether the process state is safe.

The client may infer from preflight only whether ScaffoldAI currently reports `PASS`, `WARNING`, or `BLOCKED` preflight state. It must not infer permission to mutate the repo.

### 7.3 When to Call `scaffoldai_question`

An MCP client must call `scaffoldai_question`:

- Before declaring that no structural questions are open.
- Before recommending closeout.
- When status or preflight output is ambiguous.
- When the human asks what is uncertain, blocked, or unresolved.
- When a requested action crosses process/product/agent boundaries.

The client may infer from `scaffoldai_question` whether ScaffoldAI currently detects open structural questions. If questions exist, the client must summarize them and stop before recommending execution unless the human explicitly resolves the ambiguity.

### 7.4 When to Call `scaffoldai_verify_recommend`

An MCP client must call `scaffoldai_verify_recommend`:

- Before naming a VERIFY COMMAND.
- Before suggesting a TARGET.
- Before explaining what verification the human should run.

The client may infer:

- The recommended VERIFY COMMAND.
- The selected TARGET.
- The reason ScaffoldAI chose that command.

The client must not infer:

- That verification has run.
- That verification passed.
- That verification failed.
- That closeout is approved.
- That the client should execute the command automatically.

VERIFY COMMAND treatment:

- Treat VERIFY COMMAND as a human-run recommendation.
- Preserve the command string exactly when summarizing it.
- Pair it with TARGET when TARGET is present.
- Do not reclassify it as PASS, FAIL, or evidence.
- Do not run it automatically in v0.

### 7.5 When to Call `scaffoldai_closeout_readiness`

An MCP client must call `scaffoldai_closeout_readiness`:

- Before discussing closeout readiness.
- Before suggesting commit readiness.
- After the human says verification has been run and asks what remains.
- When the human asks for blockers, warnings, changed file summary, or commit prefix guidance.

The client may infer:

- The reported closeout readiness status.
- Changed file count and changed files as observed by the tool.
- Advisory commit prefix suggestion.
- Whether verify evidence is present or absent.
- The NEXT SAFE ACTION for closeout.

The client must not infer:

- Human approval.
- Commit readiness when status is `NEEDS_VERIFICATION`, `WARNING`, or `BLOCKED`.
- Verification success from a changed file list.
- That advisory commit prefix is mandatory.
- That it should stage or commit files.

NEXT SAFE ACTION treatment:

- Treat NEXT SAFE ACTION as advisory guidance for the human.
- Preserve the meaning and do not silently upgrade it into an executed action.
- If NEXT SAFE ACTION exceeds `READ_ONLY`, stop and ask the human.
- If multiple tools produce different NEXT SAFE ACTION values, summarize the conflict and ask the human which path to use.

---

## 8. Stop Conditions

An MCP-aware AI client must stop and ask the human before proceeding when:

- Any MCP tool returns an error and the missing observation affects the recommendation.
- MCP observations conflict with each other.
- `scaffoldai_preflight` returns `BLOCKED`.
- `scaffoldai_question` returns any unresolved question that affects the requested action.
- `scaffoldai_verify_recommend` cannot produce a VERIFY COMMAND.
- `scaffoldai_closeout_readiness` returns `BLOCKED`, `WARNING`, or `NEEDS_VERIFICATION` and the human asks for commit/closeout readiness.
- The next action would exceed `READ_ONLY`.
- The human asks the client to run a command, edit files, commit, push, or mutate state without explicit scope.
- The client cannot distinguish product work from process work.
- The client is using a stale snapshot and the human reports new changes.
- MCP state conflicts with the human's claim in a way that affects the recommendation.

Stop response shape:

```text
MCP observation is read-only and does not provide enough authority to continue. The blocking condition is <condition>. Please confirm <specific human decision>.
```

---

## 9. Human Authority Rules

Human approval is required for:

- Running any Runtime Command that can execute checks or produce side effects.
- Running any VERIFY COMMAND.
- Treating verification output as accepted evidence.
- Proceeding after `WARNING` or `BLOCKED` observations.
- Resolving structural questions.
- Creating, editing, deleting, moving, or renaming files.
- Staging, committing, pushing, branching, or creating PRs.
- Updating `.scaffoldai/state/` or `.scaffoldai/streams/`.
- Adding new MCP tools or changing execution class.

The MCP client may recommend. The human decides.

If MCP state conflicts with user claims:

- State the conflict plainly.
- Prefer MCP observations as current structured runtime evidence.
- Do not accuse the human of being wrong.
- Ask the human whether to refresh MCP observations, run a Runtime Command, or proceed with the human-provided context.
- Do not proceed with closeout, verification claims, or commit readiness until the conflict is resolved.

Example:

```text
You said verification passed, but MCP closeout_readiness still reports verify_evidence "not provided". I can treat your result as human context, but MCP does not currently contain that evidence. Should I summarize the gap or wait while you run the relevant Runtime Command?
```

---

## 10. Observation and Reporting Rules

When responding based on MCP observations, the client should:

- Name the tool or snapshot source used.
- Preserve ScaffoldAI terminology: VERIFY COMMAND, TARGET, NEXT SAFE ACTION, execution_class, Runtime Commands.
- Separate observation from recommendation.
- Report partial failures clearly.
- Avoid claiming more certainty than the tools provide.
- Keep summaries concise enough for human decision-making.

Recommended response structure:

```text
MCP observations:
- scaffoldai_status: <status>, execution_class <class>
- scaffoldai_preflight: <status>
- scaffoldai_question: <status or question count>
- scaffoldai_verify_recommend: VERIFY COMMAND <command>, TARGET <target>
- scaffoldai_closeout_readiness: <status>, verify evidence <value>

Recommendation:
<one human-controlled NEXT SAFE ACTION>
```

If using a runtime snapshot, cite it as:

```text
From .scaffoldai/tmp/mcp-runtime-snapshot.json generated_at <timestamp>...
```

Do not paste entire tool payloads unless the human asks for raw JSON. Summarize the fields that affect the decision.

Observation summaries should include:

- Tool names consulted.
- Each relevant tool status.
- `execution_class` when it constrains behavior.
- VERIFY COMMAND and TARGET when verification is relevant.
- NEXT SAFE ACTION when available.
- Explicit note when observations are partial, stale, or conflicting.

Observation summaries should not include:

- Claims that verification passed unless the human supplied verify output or a future evidence model supports it.
- Claims that closeout is approved.
- Claims that commits, pushes, edits, or state changes are authorized by MCP.
- Raw JSON dumps unless requested.

---

## 11. Required Inferences and Non-Inferences

| MCP observation | Client may infer | Client must never infer |
|---|---|---|
| `execution_class: READ_ONLY` | Observation only | Permission to mutate |
| `VERIFY COMMAND` | The command ScaffoldAI recommends the human run | That the command has already run |
| `TARGET` | The verification target ScaffoldAI selected | That other targets are unnecessary forever |
| `NEXT SAFE ACTION` | The next human-controlled recommendation | Authority to execute it automatically |
| `preflight PASS` | Process state appears safe to begin or continue | Permission to bypass human approval |
| `preflight WARNING` | Proceed only with caution and human awareness | Clean state |
| `preflight BLOCKED` | Stop condition exists | That the client should fix it autonomously |
| `question CLEAR` | No structural questions currently detected | No possible ambiguity outside the tool surface |
| `closeout NEEDS_VERIFICATION` | Verification evidence is missing or insufficient | Ready for commit |
| `closeout changed_files` | Changed files as observed by MCP | Full semantic diff review |

---

## 12. Future Evolution Notes

Future phases may add write-capable or execution-capable MCP surfaces, but only after a separate contract update.

Before any future phase can exceed `READ_ONLY`, it must define:

- New execution class.
- Explicit human approval model.
- Which Runtime Commands may be invoked.
- Evidence model for verification results.
- How verify evidence is stored or passed.
- Rollback or failure behavior.
- Audit/logging expectations.
- Tests proving write boundaries.
- Updated stop conditions.

Potential future phases:

| Phase | Possible capability | Required contract change |
|---|---|---|
| v1 | Run verify through a bounded tool | Define execution class above READ_ONLY and verify evidence model |
| v1 | Closeout with accepted verify evidence | Define evidence input and human approval semantics |
| v2 | Intake/classification tool | Define whether classification is read-only or workflow-affecting |
| v2+ | Write-capable process tools | New contract, explicit authorization, audit trail, and failure handling |

No future capability is implied by v0. v0 remains read-only observation only until superseded by a later contract.

---

## 13. Contract Summary

- MCP clients observe; humans decide.
- Call `scaffoldai_status` first for session context.
- Call `scaffoldai_preflight` before advising that work is safe.
- Call `scaffoldai_question` before claiming no unresolved structural questions.
- Use `scaffoldai_verify_recommend` only to identify VERIFY COMMAND and TARGET.
- Use `scaffoldai_closeout_readiness` only as advisory readiness, never approval.
- Stop on errors, blockers, unresolved questions, stale observations, MCP/user conflicts, or any action above `READ_ONLY`.
- Cite MCP observations by tool name, status, execution_class, VERIFY COMMAND, TARGET, and NEXT SAFE ACTION.
- Do not add write access, shell execution, orchestration, or autonomous behavior in v0.
