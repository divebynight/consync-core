# SDC — Add MCP Loop Operating Notes

MODE: PROCESS_DOCUMENTATION
EXECUTION SURFACE: local repo
TARGET: ScaffoldAI MCP loop docs

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Document the current tested ScaffoldAI MCP operating loop and clarify which actions happen through MCP versus normal local workspace/terminal authority.

TASKS:
1. Add or update a small ScaffoldAI reference note documenting:
   - ChatGPT uses HTTPS readonly MCP for identity, status, and packet visibility.
   - Copilot uses local stdio MCP for status, packet visibility if available, and append-only runtime signals.
   - Packet creation/import is currently manual/human-authoritative.
   - Copilot may run verification through its normal local terminal/workspace tools when explicitly allowed by SDC.
   - MCP does not currently run verification commands.
   - MCP does not currently import, activate, mutate, or commit packets.

2. Keep this documentation concise and reference-style.

3. Do not modify Consync product/runtime behavior.

4. Do not add new MCP tools.

5. Do not change MCP authority boundaries.

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. where the operating notes were added
3. verification result
4. signal emitted
5. confirmation no product/runtime behavior or authoritative MCP write capability changed

CONSTRAINTS:
- docs/process only
- no product code changes
- no MCP authority expansion
- no packet import implementation
- no commits