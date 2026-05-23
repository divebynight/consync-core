# SDC — Harden Local MCP SDC Submit Contract

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: LOCAL_OPERATOR_MCP_ONLY

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Make `scaffoldai_submit_sdc_candidate` fully reliable, explicitly tested, and ready to become the reference implementation for future HTTPS operator submit exposure.

TASKS:
1. Review the current implementation of `scaffoldai_submit_sdc_candidate`.
2. Confirm that candidate content is passed as an argument, not as an arbitrary file path.
3. Confirm and preserve the 32 KB content size limit.
4. Confirm candidate writes are restricted to `.scaffoldai/inbox/`.
5. Add or strengthen negative tests for:
- missing `content`
- non-string `content`
- oversized `content`
- empty/whitespace-only `content`
- path-style input attempts
- unsafe suggested filename
- filename traversal attempts
- missing `.scaffoldai/inbox/`
- duplicate filename
- duplicate packet identity
- malformed markdown that lacks required packet identity
6. Confirm structured diagnostics always include:
- `candidate_submitted`
- `candidate_path`
- `accepted`
- `activated`
- `claimed`
- `active_runtime_mutated`
- `next_action_mutated`
- `validation_errors`
- `guard_errors`
- `error_category`
7. Confirm all rejection paths preserve:
- `accepted = false`
- `activated = false`
- `claimed = false`
- `active_runtime_mutated = false`
- `next_action_mutated = false`
8. Add tests proving successful submission does not mutate:
- active packet state
- next-action state
- claim state
- lifecycle state

VERIFY:
Run:
- node src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js
- node src/test/mcp-transport-e2e.js
- npm run verify:scaffoldai

OUTPUT:
1. Exact files changed.
2. Exact tests added or updated.
3. Verification results.
4. Final local MCP smoke result.
5. Any remaining gaps before HTTPS exposure.

CONSTRAINTS:
- Do not modify HTTPS MCP.
- Do not add closeout authority.
- Do not add cleanup authority.
- Do not add activation authority.
- Do not add claim authority.
- Do not add execution authority.
- Do not commit.
