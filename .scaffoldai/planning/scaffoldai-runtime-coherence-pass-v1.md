# Planning — scaffoldai-runtime-coherence-pass-v1

Created: 2026-05-06
Status: PLAN

---

## 1. Purpose

Plan a focused ScaffoldAI runtime coherence and documentation pass.

ScaffoldAI now has deterministic Runtime Commands, question boundaries, execution classification planning, read-only MCP tools, MCP transport tests, runtime snapshot generation, an MCP client interaction contract, and tool router planning. The next useful work is not more capability. It is making the current capability easier to understand, operate, cite, and re-enter.

This pass should improve:

- runtime terminology consistency
- snapshot readability
- operational documentation
- cross-doc consistency
- runtime ergonomics
- MCP interaction clarity
- onboarding and reentry clarity

The pass should preserve the current authority model: humans decide, tools observe or recommend, and no autonomous behavior is added.

---

## 2. Review Scope

In scope:

- Runtime command output language and docs.
- MCP read-only tool output language and docs.
- Runtime snapshot JSON structure and human readability.
- `.scaffoldai/README.md` operational overview.
- `.scaffoldai/process/runbook.process.md` reentry/onboarding path.
- MCP planning docs and MCP client interaction contract.
- Execution classification planning language.
- Tool router planning language.
- `.scaffoldai/tmp/` runtime artifact boundary.
- Terminology around status, verification, closeout, and advisory recommendations.

Out of scope:

- New Runtime Commands.
- New MCP tools.
- Write-capable MCP behavior.
- Orchestration.
- Autonomous execution.
- Shell execution through MCP.
- New state transitions.
- New source-of-truth files.
- Commits, pushes, or release automation.

---

## 3. Terminology Audit Areas

The pass should audit current docs, Runtime Command output, MCP output, and snapshot output for consistent use of:

| Term | Desired use | Concern to check |
|---|---|---|
| `VERIFY COMMAND` | The command recommended or selected for verification | Older docs may still say `VERIFY SURFACE`. |
| `TARGET` | The verification target selected by ScaffoldAI | Ensure it means `scaffoldai`, `consync`, `full`, or equivalent target, not filesystem target. |
| `NEXT SAFE ACTION` | One human-controlled recommended next step | Ensure it is advisory, not auto-executed. |
| `execution_class` | Structural risk/authority label | Ensure casing is stable in JSON and prose. |
| `Runtime Commands` | Human-visible command layer | Ensure MCP tools are not described as Runtime Commands unless explicitly discussing the snapshot command. |
| `STATUS` | Tool/command-specific state | Ensure values are defined near the surface that emits them. |
| `READ_ONLY` | Observation-only execution class | Ensure snapshot's one `.scaffoldai/tmp/` write is explained clearly. |
| `NEEDS_VERIFICATION` | Missing or insufficient verify evidence | Ensure it is never described as closeout-ready. |
| `READY_FOR_REVIEW` | Verify evidence present and no blockers | Ensure MCP v0 does not claim this. |

Known likely cleanup targets:

- `scaffoldai-runtime-planning-v1.md` previously showed `VERIFY SURFACE` in an early status output example; the terminology audit should keep this corrected.
- Some older planning docs predate the MCP/runtime terminology and may use "surface" where newer docs prefer `VERIFY COMMAND` and `TARGET`.
- `STATUS` values differ by command and tool; docs should make that normal rather than accidental.

---

## 4. Snapshot Audit Areas

Review `.scaffoldai/tmp/mcp-runtime-snapshot.json` and `src/mcp/snapshot.js` output shape for:

- top-level readability
- deterministic key order
- copy/paste usability
- summary usefulness
- field naming consistency
- clear distinction between snapshot metadata and tool payloads
- clear partial-failure representation
- no duplicate or misleading authority claims
- no independent git status outside MCP tool outputs
- no local machine leakage

Specific questions:

- Should `summary` include only MCP call success/failure counts, or also lightweight status rollups?
- Should `summary` include a `recommended_verify_command` copied from `scaffoldai_verify_recommend`, or should that remain only under `tools`?
- Should `summary` include `closeout_status`, or would that risk over-interpreting tool output?
- Should every tool entry include `execution_class` at the wrapper level, or is preserving it inside `result` enough?
- Should snapshot metadata include `snapshot_version` and `generated_at` only, or also a `schema_note` for ChatGPT paste ergonomics?
- Should failed tool entries include raw MCP error type, sanitized message, and recoverability as currently planned?

Lean:

- Keep summary conservative.
- Prefer `summary` for transport/call health, not semantic decisions.
- Keep semantic state inside `tools.<tool>.result`.
- If adding semantic rollups later, label them explicitly as copied observations, not judgments.

---

## 5. Documentation Audit Areas

Review and align the following surfaces:

| Surface | Audit focus |
|---|---|
| `.scaffoldai/README.md` | Add or clarify "What ScaffoldAI currently is" and "What it is not yet." |
| `.scaffoldai/process/runbook.process.md` | Add a modern runtime reentry path using Runtime Commands and optional MCP snapshot. |
| `.scaffoldai/process/ai-context.process.md` | Ensure AI onboarding mentions MCP/read-only semantics if appropriate. |
| `.scaffoldai/planning/scaffoldai-mcp-readonly-v0.md` | Check terminology against current implementation and snapshot behavior. |
| `.scaffoldai/planning/scaffoldai-mcp-local-validation-v0.md` | Separate inspector's local HTTP UI from the no-HTTP runtime snapshot rule. |
| `.scaffoldai/planning/scaffoldai-mcp-runtime-snapshot-v1.md` | Update from planning to implementation reality if needed. |
| `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md` | Ensure client behavior aligns with snapshot and router planning. |
| `.scaffoldai/planning/scaffoldai-tool-router-v0.md` | Ensure router target names do not imply execution authority. |
| `.scaffoldai/planning/scaffoldai-execution-classification-v1.md` | Reconcile future MCP notes with current read-only MCP reality. |

Documentation should answer, without requiring chat history:

- What is ScaffoldAI currently?
- What is the current runtime loop?
- Which commands can a human run?
- Which MCP tools exist?
- What does read-only MCP mean?
- What does the snapshot include?
- What is not implemented yet?
- Where should a new human or AI start?

---

## 6. Runtime Ergonomics Concerns

Potential ergonomic improvements to plan or evaluate:

- Make Runtime Command output use the same section labels where possible.
- Ensure every command has one clear `STATUS` line and one clear `NEXT SAFE ACTION`.
- Ensure `scaffoldai verify` output consistently uses `VERIFY COMMAND` and `TARGET`.
- Ensure `scaffoldai closeout` never implies approval without verify evidence.
- Decide whether snapshot output needs a short "paste preamble" or should remain pure JSON.
- Consider a docs-only "current runtime overview" section in `.scaffoldai/README.md`.
- Consider a lightweight reentry checklist that uses:
  1. `.scaffoldai/state/snapshot.md`
  2. `npm run scaffoldai:status`
  3. `npm run scaffoldai:question`
  4. optional `npm run scaffoldai:mcp:snapshot`
- Clarify when MCP observations are preferable to CLI output and when Runtime Commands are preferable.

No ergonomic change should add capability or authority in this pass.

---

## 7. Operational Overview Questions

The coherence pass should make these answers obvious:

### What ScaffoldAI currently is

- A repo-local process harness.
- A deterministic Runtime Command layer.
- A manual agent/process model.
- A read-only MCP observation surface.
- A runtime snapshot generator for AI/client handoff.
- A set of contracts and planning documents governing safe evolution.

### What ScaffoldAI is not yet

- Not an autonomous orchestrator.
- Not a write-capable MCP server.
- Not a remote service.
- Not a shell execution proxy.
- Not a verifier that records durable verify evidence automatically.
- Not a closeout approver.
- Not a replacement for human decisions.
- Not a product UI feature unless explicitly scoped in a future packet.

### Current phase boundary

Current phase should be described as:

```text
READ_ONLY MCP + deterministic local Runtime Commands + human-authoritative workflow.
```

---

## 8. Reentry and Onboarding Audit

Test question:

> Can a new human, ChatGPT session, Codex session, Copilot session, or future MCP-aware client understand the runtime from docs plus snapshot alone?

Audit for:

- clear first file to read
- clear first command to run
- clear difference between `.scaffoldai/state/snapshot.md` and `.scaffoldai/tmp/mcp-runtime-snapshot.json`
- clear distinction between MCP tools and Runtime Commands
- clear status interpretation
- clear verify recommendation flow
- clear closeout readiness semantics
- clear "ask the human" conditions
- clear source-of-truth hierarchy

Implicit assumptions to make explicit:

- MCP v0 observes but does not execute.
- `verify_recommend` recommends; it does not verify.
- `closeout_readiness` advises; it does not approve.
- Snapshot summary reports call health, not project health.
- Humans remain authoritative when observations conflict with claims.

---

## 9. Recommended Update Order

Recommended execution packets should follow this order:

1. **Terminology audit packet**
   - Replace stale `VERIFY SURFACE` wording where appropriate.
   - Normalize `VERIFY COMMAND`, `TARGET`, `NEXT SAFE ACTION`, `Runtime Commands`, and `execution_class`.
   - Avoid changing historical records unless they actively confuse current operation.

2. **Operational overview packet**
   - Update `.scaffoldai/README.md` with a concise "current runtime" section.
   - Add "What ScaffoldAI is not yet" to reduce overreach.

3. **Reentry/runbook packet**
   - Update `.scaffoldai/process/runbook.process.md` with current Runtime Commands and optional MCP snapshot flow.
   - Clarify docs-first vs command-first reentry.

4. **MCP documentation packet**
   - Align MCP read-only, local validation, runtime snapshot, and client interaction docs.
   - Explain Inspector local UI separately from runtime no-HTTP/no-remote rules.

5. **Snapshot ergonomics packet**
   - Review actual snapshot output.
   - Decide whether to keep summary call-health-only or add copied semantic rollups.
   - Make any snapshot structure change only after docs clarify intent.

6. **Router coherence packet**
   - Reconcile router planning with execution classification and MCP client contract.
   - Keep router recommend-only.

This order keeps language cleanup ahead of output changes, and docs ahead of new ergonomics.

---

## 10. Risks and Guardrails

### Risk: Documentation cleanup accidentally changes authority

Guardrail: Do not add words implying automatic execution, orchestration, approval, or write authority.

### Risk: Snapshot summary becomes a decision engine

Guardrail: Keep summary focused on call health unless a later packet explicitly accepts semantic rollups.

### Risk: Historical docs get rewritten too aggressively

Guardrail: Prefer marking older docs as historical or updating only confusing current-operation language.

### Risk: Runtime terminology becomes too rigid

Guardrail: Normalize core terms, but allow command-specific `STATUS` values when clearly documented.

### Risk: MCP Inspector docs conflict with no-HTTP rules

Guardrail: Clarify that MCP Inspector may use a local browser UI for manual validation, while runtime MCP and snapshot stay local stdio and no remote exposure.

### Risk: Reentry docs duplicate source-of-truth logic

Guardrail: Point back to `.scaffoldai/state/` and `.scaffoldai/streams/` as authoritative; do not make chat memory or snapshots authoritative.

### Risk: Coherence pass grows into implementation

Guardrail: Split into narrow execution packets. Each packet should have a small doc/output surface and run `npm run verify:scaffoldai`.

---

## 11. Definition of Coherent v1

ScaffoldAI runtime coherence v1 is achieved when:

- A new human or AI client can identify the current runtime phase in under 5 minutes.
- The difference between Runtime Commands, MCP tools, and runtime snapshots is explicit.
- `VERIFY COMMAND`, `TARGET`, `NEXT SAFE ACTION`, `execution_class`, and `Runtime Commands` are used consistently in current docs.
- `STATUS` values are documented as surface-specific but predictable.
- MCP v0 is clearly five read-only observations plus bounded append-only local signaling.
- Snapshot output is paste-friendly and does not overstate authority.
- Reentry docs explain how to combine state files, Runtime Commands, and optional MCP snapshot.
- Router planning remains recommend-only and does not imply dispatch.
- No docs imply write-capable MCP beyond bounded signaling, autonomous behavior, or hidden orchestration.
- `npm run verify:scaffoldai` passes after all coherence changes.

---

## 12. Recommended Next Step

Do not implement broad changes immediately.

Create follow-up execution packets in the recommended order, starting with a terminology audit packet. Each packet should stay narrow, update only the relevant docs or output surface, and preserve the current no-new-capability boundary.
