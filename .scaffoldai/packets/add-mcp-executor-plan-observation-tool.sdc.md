# SDC — Add MCP Executor Plan Observation Tool

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI MCP executor boundary and read-oriented executor planning integration

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Expose the existing bounded executor planning path through the ScaffoldAI MCP server so the coordinator can request and receive executor planning output without shell access.

This packet should add the smallest safe MCP-visible executor planning slice first, using the existing CLI-first executor adapter and command boundaries.

BACKGROUND:
ScaffoldAI now has a bounded executor adapter and operator CLI surface:
- `make scaffold-plan`
- `make scaffold-work`

The current implementation can resolve active packet context, build deterministic Copilot CLI command boundaries, and preserve lifecycle separation.

The next architectural step is to expose the planning side through MCP so a coordinator can:
1. submit an SDC
2. wait for operator intake and activation
3. request executor plan output through MCP
4. review the plan
5. ask the operator to approve or continue

Important clarification:
- this is executor planning, not the parallel discussion lane
- MCP must not become a generic shell proxy
- MCP should expose bounded ScaffoldAI capability, not arbitrary command execution

TASKS:
1. Add an MCP tool for executor planning.

Add a bounded MCP-visible tool such as:
- `scaffoldai_executor_plan`

The exact exported name may follow current MCP naming conventions.

2. Reuse the existing executor adapter boundary.

The MCP tool must:
- resolve active packet context through the existing adapter or shared support code
- use deterministic repo root scoping
- construct the same planning mode command boundary already exposed by `make scaffold-plan`
- preserve the same read-only planning capability boundary

Expected Copilot boundary remains equivalent to:

```bash
copilot \
  -C <repoRoot> \
  --plan \
  --silent \
  --disable-builtin-mcps \
  --deny-tool='write' \
  --deny-tool='shell(*)' \
  -p "<prompt>"
```

3. Execute only the bounded planning request.

The MCP tool may invoke Copilot CLI only through the approved planning boundary.

It must not accept arbitrary shell commands or arbitrary executable strings from the coordinator.

4. Return structured output.

The MCP response should include:
- active packet id
- planning mode used
- repo root used
- command boundary summary
- executor stdout or captured plan text
- executor stderr if relevant
- exit code or status
- refusal reason if no active packet or missing next-action

5. Preserve lifecycle separation.

The MCP planning tool must not:
- activate packets
- close packets
- verify packets
- mutate approval state
- mutate workflow phases
- perform work-mode execution
- modify `.consync/`

6. Add tests.

Test at least:
- MCP tool registration or routing
- active packet requirement
- command boundary construction reuse
- refusal when no active packet exists
- structured response shape
- no arbitrary shell command input

Mock or isolate Copilot invocation where appropriate so verification remains deterministic.

7. Keep work-mode MCP exposure out of scope.

Do not implement MCP work execution in this packet unless it is unavoidable. Planning-only MCP exposure is the intended first safe slice.

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also run any targeted MCP/executor tests added by this packet.

OUTPUT:
Return:
1. files changed
2. MCP tool name added
3. executor planning boundary reused
4. response shape
5. refusal behavior
6. lifecycle separation guarantees
7. tests run and results
8. follow-up needed for MCP work execution

CONSTRAINTS:
- planning-only MCP exposure in this packet
- no generic shell proxy
- no arbitrary command execution
- no work-mode MCP execution yet
- no discussion lane implementation
- no chat/session system implementation
- no lifecycle redesign
- no approval state mutation
- no workflow phase mutation
- no `.consync/` changes
- keep Consync product state separate from ScaffoldAI process state
- human-controlled commits only
