# SDC — Harden Local MCP Operation Guards and Idempotency

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: LOCAL_OPERATOR_MCP_ONLY

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Ensure local ScaffoldAI MCP operations cannot put ScaffoldAI into a dirty, broken, reordered, or repeatedly-mutated state. Prefer strict fail-closed behavior over permissive recovery.

TASKS:
1. Inventory all local ScaffoldAI MCP tools currently exposed by `server.js`.
2. Classify each tool by execution class:
   - read-only
   - candidate inbox write-only
   - signal append-only
   - verification/recommendation
   - lifecycle-mutating
   - memory read/write
3. For every non-read-only MCP tool, document and test:
   - required preconditions
   - allowed state transition, if any
   - forbidden state transitions
   - idempotency behavior on repeat calls
   - filesystem write scope
   - structured diagnostics on rejection
4. Add or strengthen guard tests proving:
   - operations cannot run out of order
   - duplicate calls do not repeatedly mutate state
   - cleanup only removes artifacts directly tied to the completed packet/process instance
   - no command performs broad directory cleanup
   - no MCP operation can commit, push, branch, or mutate git
   - no MCP operation writes outside its declared scope
5. Ensure `scaffoldai_submit_sdc_candidate` remains:
   - bounded to 32 KB content
   - argument-content only
   - `.scaffoldai/inbox/` write-only
   - non-activating
   - non-claiming
   - non-executing
   - non-cleaning
   - non-committing
6. Ensure closeout/cleanup remains:
   - closeout and cleanup are separate primitives
   - cleanup requires successful terminal closeout evidence
   - cleanup removes only the originating inbox candidate/artifacts
   - duplicate cleanup is safe/idempotent
7. Add a guardrail reference or contract file if appropriate, documenting the strict MCP operation ordering model.

VERIFY:
Run:
- relevant MCP unit tests
- relevant lifecycle/transition tests
- relevant housekeeping tests
- npm run verify:scaffoldai

OUTPUT:
1. Exposed MCP tool inventory.
2. Execution-class classification.
3. Exact guards added or confirmed.
4. Exact tests added or updated.
5. Verification results.
6. Remaining unsafe or intentionally deferred MCP surfaces.

CONSTRAINTS:
- Do not modify HTTPS MCP.
- Do not expose new remote authority.
- Do not add commit authority.
- Do not add push/branch/PR authority.
- Do not loosen lifecycle ordering.
- Do not broaden cleanup scope.
- Do not make cleanup delete arbitrary directory contents.
- Do not commit.
