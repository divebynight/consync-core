# SDC — Harden Packet Closeout and Cleanup Workflow

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: LOCAL_OPERATOR_MCP_ONLY

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Harden ScaffoldAI packet closeout and cleanup so completed packets are finalized deterministically, cleanup is safe and scoped, and `.scaffoldai/inbox/` does not accumulate completed packet candidates.

TASKS:
1. Review current packet closeout and cleanup implementation.
2. Preserve closeout and cleanup as separate primitive commands.
3. Add or preserve a safe composite finish flow only if already appropriate; cleanup must run only after closeout passes cleanly.
4. Ensure cleanup removes only the completed packet’s originating inbox candidate, if present.
5. Ensure cleanup does not remove:
   * `.scaffoldai/inbox/README.md`
   * `passing-contract-example.sdc.md`
   * unrelated pending candidates
   * failed candidates
   * examples or fixtures
6. Ensure cleanup is idempotent:
   * running cleanup twice should not fail dangerously
   * missing originating inbox candidate should be reported clearly
7. Add structured diagnostics for closeout and cleanup results, including:
   * packet_closed
   * cleanup_performed
   * inbox_candidate_removed
   * removed_paths
   * skipped_paths
   * validation_errors
   * guard_errors
   * error_category
8. Add negative tests for:
   * cleanup before closeout
   * cleanup with active/claimed packet still open
   * cleanup when packet path is missing
   * cleanup when packet identity does not match inbox candidate
   * cleanup must not delete unrelated inbox files
   * cleanup must not delete README or passing example
   * cleanup rerun/idempotency
9. Confirm closeout/cleanup do not commit, push, branch, or mutate unrelated runtime state.
10. Confirm `npm run verify:scaffoldai` passes.

VERIFY:
Run:
* relevant closeout/cleanup unit tests
* relevant lifecycle/transition tests
* npm run verify:scaffoldai

OUTPUT:
1. Exact files changed.
2. Exact tests added or updated.
3. Verification results.
4. Final closeout/cleanup smoke result.
5. Remaining gaps before exposing any closeout/cleanup MCP authority.

CONSTRAINTS:
* Do not modify HTTPS MCP.
* Do not expose closeout/cleanup over HTTPS.
* Do not add commit authority.
* Do not add activation authority.
* Do not add claim authority.
* Do not add execution authority.
* Do not remove unrelated inbox files.
* Do not remove `passing-contract-example.sdc.md`.
* Do not commit.
