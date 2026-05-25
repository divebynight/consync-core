# SDC — Expose Executor Plan on Operator HTTP MCP

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI MCP operator HTTP surface and operator Makefile commands

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Expose the existing `scaffoldai_executor_plan` bounded planning tool on the actual operator HTTP MCP surface used by ChatGPT, and add clear Makefile commands for starting the ScaffoldAI MCP surfaces.

BACKGROUND:
The bounded executor planning tool was implemented and verified, but ChatGPT did not see it after MCP restart.

Diagnosis:
- `scaffoldai_executor_plan` was registered in `src/scaffoldai/mcp/server.js`
- the operator HTTP command runs `src/scaffoldai/mcp-operator/http.js`
- ChatGPT is connected to the operator HTTP MCP surface, so the new tool is not visible there

Current operator script:
```text
scaffoldai:mcp:operator:http = node src/scaffoldai/mcp-operator/http.js
```

The operator-facing workflow should not require remembering npm script names. Makefile targets should be the primary operator surface.

TASKS:
1. Expose `scaffoldai_executor_plan` on the operator HTTP MCP surface.

Update the actual HTTP operator entrypoint so ChatGPT sees the tool when connected through `scaffoldai:mcp:operator:http`.

2. Reuse existing implementation.

Do not duplicate executor-plan logic. Reuse the existing bounded tool implementation and wrapper created for `scaffoldai_executor_plan`.

3. Preserve capability boundaries.

The operator HTTP surface must expose only the bounded planning tool, not arbitrary shell execution.

The tool must still:
- accept no arbitrary command string
- accept no arbitrary prompt string
- resolve active packet context internally
- construct the deterministic Copilot planning boundary
- run only planning mode
- preserve lifecycle separation

4. Add Makefile MCP targets.

Add clear operator-facing targets such as:
- `make scaffold-mcp-operator`
- `make scaffold-mcp-readonly`
- `make scaffold-mcp-operator-stdio`
- `make scaffold-mcp-readonly-stdio`

The exact names may follow existing Makefile conventions, but the operator should not need to call raw npm scripts to start MCP servers.

5. Update help text.

Ensure `make help` or equivalent Makefile help output includes the new MCP targets if such help exists.

6. Add or update tests.

Test at least:
- operator HTTP MCP inventory includes `scaffoldai_executor_plan`
- readonly/coordinator inventory behavior remains intentional
- Makefile includes the new MCP targets
- no generic shell proxy is introduced
- existing ScaffoldAI verification still passes

7. Verify ChatGPT visibility path.

After implementation, the expected manual verification is:
- operator runs the new Makefile MCP operator target
- ChatGPT refreshes MCP tools
- ChatGPT sees `scaffoldai_executor_plan`

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also run any targeted MCP operator HTTP tests updated by this packet.

OUTPUT:
Return:
1. files changed
2. operator HTTP entrypoint updated
3. Makefile targets added
4. MCP tool inventory behavior
5. tests run and results
6. manual ChatGPT refresh verification steps

CONSTRAINTS:
- no generic shell proxy
- no arbitrary command execution
- no arbitrary prompt execution
- no work-mode MCP exposure in this packet
- no discussion lane implementation
- no lifecycle redesign
- no workflow phase mutation
- no approval state mutation
- no `.consync/` changes
- keep Consync product state separate from ScaffoldAI process state
- human-controlled commits only
