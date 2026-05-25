# SDC — Convert Executor Plan to Async Artifact Job

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI bounded executor planning lifecycle and async artifact-backed MCP orchestration

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Convert the current blocking `scaffoldai_executor_plan` MCP flow into an asynchronous artifact-backed executor planning job system.

The new model must:
- avoid long blocking MCP calls
- persist executor planning output as durable artifacts
- support polling/status retrieval
- preserve bounded planning behavior
- preserve operator approval boundaries
- prevent arbitrary prompt execution from coordinator tools

BACKGROUND:
The current bounded planning flow is now functional:
- ChatGPT can call `scaffoldai_executor_plan`
- the MCP operator HTTP surface exposes the tool
- the tool invokes Copilot CLI planning mode with bounded capability restrictions

However:
- Copilot planning calls may take significant time
- MCP calls may timeout before completion
- plan output should become a durable reviewable artifact
- coordinator edits/revisions should not become arbitrary prompt injection

Architectural clarification:
- AI tools must not directly submit arbitrary execution prompts
- executable prompts should derive from approved ScaffoldAI artifacts
- bounded planning requests should create durable observable runtime artifacts

Core principle:
> AI tools may request bounded actions. They may not inject arbitrary executable prompts.

TASKS:
1. Replace blocking planning execution with async job execution.

Convert executor planning into:
- start job
- poll status
- fetch result

rather than a single blocking MCP call.

2. Add async MCP planning tools.

Add bounded MCP tools such as:
- `scaffoldai_executor_plan_start`
- `scaffoldai_executor_plan_status`
- `scaffoldai_executor_plan_result`

Exact names may follow existing naming conventions.

3. Preserve bounded planning behavior.

The async planning flow must still:
- resolve active packet context internally
- avoid arbitrary prompt input
- avoid arbitrary command input
- use deterministic repoRoot resolution
- invoke Copilot only through the bounded planning capability boundary

Expected boundary remains equivalent to:

```bash
copilot \
  -C <repoRoot> \
  --plan \
  --silent \
  --disable-builtin-mcps \
  --deny-tool='write' \
  --deny-tool='shell(*)' \
  -p "<internally constructed prompt>"
```

4. Add durable runtime artifacts.

Planning jobs should persist runtime artifacts under a bounded ScaffoldAI runtime location such as:

```text
.scaffoldai/runtime/executor-plans/<job-id>/
```

Expected artifacts may include:
- `request.json`
- `stdout.md`
- `stderr.log`
- `result.json`
- `status.json`

The exact artifact structure may evolve but should remain deterministic.

5. Add structured job lifecycle behavior.

Planning jobs should support states such as:
- queued
- running
- completed
- failed
- timed_out
- cancelled

6. Preserve operator approval boundaries.

The async planning system must not:
- accept arbitrary prompt text from coordinator tools
- execute arbitrary commands
- auto-run work execution
- mutate workflow phases
- mutate approval state
- bypass operator lifecycle control

7. Preserve lifecycle separation.

Planning jobs must not:
- activate packets
- close packets
- verify packets
- commit changes
- mutate `.consync/`

8. Add polling/result behavior.

Status/result retrieval should:
- avoid re-running Copilot
- read persisted runtime artifacts
- support bounded output retrieval
- expose structured status metadata

9. Add cleanup strategy.

Define bounded cleanup behavior for old executor-plan runtime artifacts.

Cleanup must not:
- delete accepted packets
- delete append-only logs
- mutate active packet state

10. Add tests.

Test at least:
- job creation
- job status transitions
- artifact creation
- result retrieval
- timeout behavior
- refusal when no active packet exists
- refusal of arbitrary prompt injection
- refusal of arbitrary command execution
- cleanup behavior
- operator HTTP MCP tool inventory

Mock or isolate Copilot execution where appropriate so verification remains deterministic.

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also run any targeted async executor-plan tests added by this packet.

OUTPUT:
Return:
1. files changed
2. async planning architecture
3. artifact layout
4. job lifecycle model
5. MCP tool names
6. approval boundary guarantees
7. timeout handling strategy
8. cleanup strategy
9. tests run and results

CONSTRAINTS:
- no arbitrary shell proxy
- no arbitrary prompt execution
- no work-mode MCP execution in this packet
- no discussion lane implementation
- no lifecycle redesign
- no workflow phase mutation
- no approval state mutation
- no `.consync/` usage
- keep Consync product state separate from ScaffoldAI process state
- human-controlled commits only
