# SDC — Expose HTTPS Operator Submit-Only Surface

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: LOCAL_REPOSITORY_ONLY

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Expose a narrow HTTPS ScaffoldAI operator MCP surface that supports only bounded SDC candidate submission, while preserving the existing readonly observer HTTPS surface and all strict lifecycle authority boundaries.

TASKS:
1. Review current HTTPS MCP server/surface wiring.
2. Preserve observer HTTPS MCP as readonly only.
3. Add or configure a distinct HTTPS operator MCP surface.
4. Expose `scaffoldai_submit_sdc_candidate` on the HTTPS operator surface only.
5. Reuse the hardened local submit implementation rather than duplicating logic.
6. Ensure HTTPS submit preserves:
   - 32 KB candidate content limit
   - argument-content-only submission
   - `.scaffoldai/inbox/` write-only boundary
   - no intake
   - no accept
   - no activate
   - no claim
   - no execute
   - no closeout
   - no cleanup
   - no commit
   - no active runtime mutation
   - no next-action mutation
7. Add tests proving:
   - observer HTTPS cannot discover or call submit
   - operator HTTPS can discover submit
   - operator HTTPS submit writes only to `.scaffoldai/inbox/`
   - negative submit cases behave like local submit
   - duplicate/pending candidate guards still work
   - lifecycle/runtime state is not mutated
8. Add documentation or contract notes describing:
   - observer MCP = readonly
   - operator MCP v1 = readonly + bounded candidate submit only
   - lifecycle authority remains local/manual/core only

VERIFY:
Run:
- relevant HTTPS MCP tests
- relevant local MCP submit tests
- relevant lifecycle/transition tests
- npm run verify:scaffoldai

OUTPUT:
1. Exact files changed.
2. Observer/operator HTTPS tool inventory.
3. Tests added or updated.
4. Verification results.
5. Final HTTPS operator submit smoke result.
6. Remaining intentionally deferred operator tools.

CONSTRAINTS:
- Do not expose closeout over HTTPS.
- Do not expose cleanup over HTTPS.
- Do not expose claim over HTTPS.
- Do not expose activation over HTTPS.
- Do not expose execution over HTTPS.
- Do not expose commit/git authority over HTTPS.
- Do not expose memory_write over HTTPS.
- Do not expose verify_run over HTTPS unless already readonly-safe and explicitly justified.
- Do not broaden filesystem authority.
- Do not loosen submit validation.
- Do not commit.
