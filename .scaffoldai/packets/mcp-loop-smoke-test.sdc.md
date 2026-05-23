# SDC — ScaffoldAI MCP Loop Smoke Test

MODE: PROCESS_VALIDATION
EXECUTION SURFACE: local repo
TARGET: ScaffoldAI operational loop only

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Validate the current ScaffoldAI operational loop across:
- ChatGPT HTTPS readonly MCP
- Copilot local stdio MCP
- CLI authoritative bridge
- append-only runtime signaling

TASKS:
1. Create or update a small reference note documenting:
   - ChatGPT uses HTTPS readonly MCP
   - Copilot uses local stdio MCP
   - CLI remains authoritative for state changes
   - MCP runtime signals are append-only and non-authoritative

2. Do not modify Consync product/runtime behavior.

3. Do not change MCP authority boundaries.

4. Emit one append-only MCP signal after documentation update.

5. Run:
   - `npm run verify:scaffoldai`

OUTPUT:
Return:
- files changed
- verification result
- signal emitted
- confirmation no authoritative state files were modified

CONSTRAINTS:
- docs/process only
- no product changes
- no commits
- no new MCP write authority