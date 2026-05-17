# SDC — Repair ScaffoldAI Lifecycle Authority Documentation Drift

MODE: PLANNING

EXECUTION SURFACE:
consync-core ScaffoldAI process documentation, lifecycle authority references, operator guidance text, and narrow parser/help-message consistency surfaces.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Repair the highest-priority lifecycle authority documentation drift found by the packet lifecycle authority audit, without changing lifecycle mechanics.

This packet should make the documented authority model match the actual implementation so operators and AI agents can reason about packet lifecycle state correctly.

TASKS:
1. Update authority-map documentation to correctly state that packet intake writes durable packet files under `.scaffoldai/packets`.
2. Update runtime/MCP documentation to consistently describe the actual signal path under `.scaffoldai/runtime/mcp/signals.jsonl`.
3. Remove or correct stale claims that LOCAL_SIGNAL_APPEND_ONLY writes only under `.scaffoldai/tmp`.
4. Normalize SDC title remediation guidance so user-facing hints match the strict parser requirement: `# SDC — <Title>`.
5. Add or update a concise lifecycle authority reference that separates:
   - packet content authority
   - active packet pointer authority
   - runtime/claim authority
   - verification evidence authority
   - closeout/handoff authority
   - continuity artifacts
   - diagnostic/advisory runtime artifacts
6. Identify and document the current preferred closeout/commit choreography to reduce operator confusion.
7. Keep all changes documentation/help-text focused unless a tiny parser/help-string correction is required.
8. Produce follow-up recommendations for behavior changes separately, especially Makefile close ergonomics and unknown packet-category handling.

VERIFY:
Run `npm run verify:scaffoldai` after changes.

Run `npm run verify:consync` only if shared command routing, Consync command surfaces, or product/runtime code is touched.

Targeted verification should confirm:
- documentation no longer claims packet files are never written by runtime intake
- signal path docs match actual MCP signal writer behavior
- SDC title guidance matches the strict parser format
- no lifecycle mechanics changed

OUTPUT:
- corrected lifecycle authority documentation
- corrected MCP/runtime signal path documentation
- corrected SDC title remediation guidance if present
- concise authority reference or updated existing reference
- documented preferred closeout/commit choreography
- follow-up remediation list for behavior/ergonomics changes that were intentionally deferred

CONSTRAINTS:
- Do not change lifecycle mechanics in this packet.
- Do not add automation authority.
- Do not change activation, verification, closeout, cleanup, claim, or git authority.
- Do not broaden into Consync product refactors.
- Do not implement epic/expo/multi-packet orchestration.
- Do not implement Makefile behavior changes unless explicitly approved in a follow-up packet.
- Preserve one-active-packet semantics.
- Preserve fail-closed behavior.
- Treat packet lifecycle as the trust boundary.
- Keep this as a narrow documentation/coherence repair.

CONTEXT:
The packet lifecycle authority audit found that the core lifecycle remains coherent and state-first, but several documents and guidance strings conflict with implementation.

Highest-priority findings:
- documentation claims no runtime writer mutates packet files, but intake writes durable packet files
- runtime signal documentation contains inconsistent path guidance for LOCAL_SIGNAL_APPEND_ONLY
- SDC title remediation guidance may show a hyphen format even though the parser requires an em dash format
- operators are experiencing avoidable cognitive load around verify, closeout, generated artifacts, and commit timing

This packet should repair the documentation/authority model first so later behavior changes can be made safely and intentionally.
