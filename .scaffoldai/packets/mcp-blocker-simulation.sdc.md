# SDC — MCP Blocker Simulation

MODE: PROCESS_VALIDATION
EXECUTION SURFACE: ScaffoldAI coordination runtime

APPROVAL:
  execute: APPROVED
  commit: DENIED

GOAL:
Validate the pending-question coordination loop across:
- CLI packet activation
- Copilot stdio MCP
- ChatGPT HTTPS readonly MCP
- append-only runtime coordination signals

TASKS:
1. Emit one synthetic blocked/question signal through the MCP signal surface.

2. Use:
   - client_id: github-copilot
   - signal_type: question
   - severity: blocked

3. Message:
   "Synthetic coordination test: should pending questions auto-expire after resolution?"

4. Options:
   - keep_history_visible
   - auto_hide_resolved

5. Do not modify product/runtime code.

6. Do not modify authoritative state except normal packet activation state.

7. Do not commit changes.

VERIFY:
- confirm signal accepted
- confirm signal recorded append-only
- confirm no authoritative state mutation occurred

OUTPUT:
Return:
1. exact signal payload used
2. MCP response
3. confirmation no authoritative state writes occurred