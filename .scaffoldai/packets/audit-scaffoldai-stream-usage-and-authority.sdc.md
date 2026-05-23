# SDC — Audit ScaffoldAI Stream Usage and Authority

MODE: PLANNING

EXECUTION SURFACE:
consync-core ScaffoldAI process documentation, stream/state usage analysis, read-only source inspection, and verification planning.

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Audit ScaffoldAI stream usage and authority so the project can determine whether streams are safe, stale, partial, or incorrectly coupled to lifecycle closeout/status behavior.

The immediate concern is that the active stream is `electron_ui` while current work is on `feature/diagram-function-reorg`, and closeout wrote to `.scaffoldai/streams/electron_ui/stream.md` even though the stream content appears stale and product/UI-specific.

TASKS:
1. Locate every read and write of `.scaffoldai/streams` and `active_stream` in the repository.
2. Identify which commands or lifecycle phases touch stream files.
3. Determine whether stream content affects authoritative lifecycle behavior such as intake, activation, verification, closeout, cleanup, or status.
4. Compare `.scaffoldai/streams/README.md` and stream-related docs with the actual implementation and folder contents.
5. Explain why `electron_ui` is currently the active stream during diagram/function reorg work.
6. Classify stream artifacts as authoritative state, non-authoritative continuity notes, stale product context, or dead/partial implementation.
7. Identify any risk that ScaffoldAI process changes could accidentally affect Consync product/runtime behavior.
8. Produce a recommendation for whether streams should be retained, clarified, renamed, disabled from closeout writes, repaired, or deferred.
9. Produce a small implementation-ready follow-up plan only if the audit finds a safe bounded change.

VERIFY:
This packet is planning/audit first. Prefer read-only inspection unless an explicit follow-up implementation packet is approved.

Required verification recommendations:
- include `npm run verify:scaffoldai` for any ScaffoldAI process change
- include `npm run verify:consync` for any change that touches shared entrypoints, command routing, source under `src/commands`, `src/cli`, `src/lib`, or anything that could affect product/runtime behavior
- include targeted checks proving streams are not used as lifecycle authority unless intentionally documented
- confirm packet lifecycle still reports idle/active state from `.scaffoldai/state`, not stream metadata

OUTPUT:
- stream usage inventory
- read/write map for `.scaffoldai/streams` and `active_stream`
- authority classification for stream artifacts
- docs-vs-implementation mismatch list
- Consync risk assessment
- recommendation for retain/repair/defer/remove behavior
- implementation-ready follow-up scope if needed

CONSTRAINTS:
- Do not modify Consync product/runtime behavior during the audit.
- Do not assume streams are authoritative unless source inspection proves it.
- Do not change packet lifecycle mechanics in this planning packet.
- Do not broaden into epic/expo implementation.
- Do not introduce multi-packet orchestration.
- Do not add automation authority, git authority, or cleanup authority.
- Preserve one-active-packet lifecycle semantics.
- Preserve fail-closed behavior for ambiguous lifecycle state.
- Treat `.scaffoldai/state` as the expected authoritative lifecycle source unless proven otherwise.
- Treat `.scaffoldai/streams` as suspect/non-authoritative until audited.

CONTEXT:
The packet lifecycle is currently working well: intake, activation, verification, closeout, cleanup, and idle recovery have been validated through recent work.

However, streams appear to be a partial or stale subsystem introduced earlier for continuity or multi-packet work. The documented stream model does not appear to match observed folder contents or current stream metadata. Recent closeout updated `.scaffoldai/streams/electron_ui/stream.md`, which raised concern that a stale product-specific stream may still be touched by ScaffoldAI process closeout.

This audit should protect the now-stable packet lifecycle by identifying whether streams are harmless continuity notes, stale process residue, or an unsafe partial implementation that needs clarification before future planner/expo work builds on it.
