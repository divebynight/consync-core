# Planning — current-runtime-state-reference-v1

Created: 2026-05-07
Status: PLAN

---

## Purpose

Design a canonical current-state reference for ScaffoldAI.

The reference should answer, in one concise place:

- What ScaffoldAI is right now.
- What it can do.
- What it cannot do yet.
- Which Runtime Commands exist.
- Which MCP tools exist.
- What is validated.
- What is planned or experimental.
- What the current safety and authority boundaries are.
- How humans and AI tools should interact with the current runtime.

The reference should reduce reentry friction for humans, Codex, ChatGPT, Copilot, and future MCP-aware clients without becoming another process novel.

---

## Proposed Path

```text
.scaffoldai/reference/current-runtime-state.reference.md
```

The `.scaffoldai/reference/` directory should hold stable reference material: current, concise, and maintained. It should not replace planning docs, process docs, state files, contracts, or runtime artifacts.

---

## Audience

Primary audiences:

- Humans returning to the repo after time away.
- AI sessions that need a quick operational anchor.
- Future contributors trying to understand current ScaffoldAI boundaries.
- MCP-aware clients consuming runtime observations.

Secondary audiences:

- Maintainers deciding whether a future packet changes runtime authority.
- Reviewers checking whether new docs or commands preserve current semantics.

---

## Section Outline

Recommended document structure:

1. **Current Phase**
   - One paragraph naming the current phase:
     `READ_ONLY MCP + deterministic local Runtime Commands + human-authoritative workflow`.
   - State that ScaffoldAI is process/runtime infrastructure for Consync, not product UI behavior.

2. **What ScaffoldAI Is**
   - Runtime command layer.
   - Read-only MCP observation surface.
   - Snapshot and reentry support.
   - Human-authoritative process model.

3. **What ScaffoldAI Is Not Yet**
   - Not an orchestrator.
   - Not autonomous.
   - Not write-capable through MCP.
   - Not a remote service.
   - Not a verifier that records durable evidence automatically.
   - Not a replacement for human judgment.

4. **Runtime Commands**
   - Include a compact command table.
   - Columns:
     `Command`, `Purpose`, `Writes?`, `Authority`, `When to Use`.
   - Include:
     - `npm run scaffoldai:status`
     - `npm run scaffoldai:preflight`
     - `npm run scaffoldai:question`
     - `npm run scaffoldai:verify`
     - `node src/index.js scaffoldai closeout`
     - `npm run scaffoldai:mcp:snapshot`
   - Link to deeper command planning docs rather than duplicating command internals.

5. **MCP Surface**
   - Include a compact MCP tool table.
   - Columns:
     `Tool`, `Purpose`, `execution_class`, `Authority`, `Notes`.
   - Include:
     - `scaffoldai_status`
     - `scaffoldai_preflight`
     - `scaffoldai_question`
     - `scaffoldai_verify_recommend`
     - `scaffoldai_closeout_readiness`
   - State explicitly:
     MCP v0 is local stdio, read-only, no HTTP, no ngrok, no remote exposure.

6. **Snapshots and Reentry**
   - Distinguish:
     - `.scaffoldai/state/snapshot.md`
     - `.scaffoldai/tmp/mcp-runtime-snapshot.json`
     - handoff bundles
     - Runtime Commands
   - Explain what is human-curated, what is machine-generated, what is long-lived, and what is ephemeral.
   - Link to `.scaffoldai/process/runbook.process.md` and `.scaffoldai/process/ai-context.process.md`.

7. **Current Safety and Authority Boundaries**
   - Put this section near the middle, not buried at the end.
   - Include:
     - Humans remain final authority.
     - MCP clients observe and recommend only.
     - VERIFY COMMAND is human-run unless explicitly requested.
     - TARGET is a recommendation/selection, not proof of completed verification.
     - NEXT SAFE ACTION is advisory.
     - `execution_class: READ_ONLY` never grants mutation authority.

8. **Validated Surfaces**
   - Summarize current validation:
     - Runtime Commands are covered by `npm run verify:scaffoldai`.
     - MCP smoke/E2E tests are covered by `npm run test:mcp`.
     - Full repo verification is covered by `npm run verify`.
   - Avoid listing every assertion.

9. **Experimental / Planned Layers**
   - Link out to planning docs:
     - execution classification
     - tool router
     - future write-capable MCP phases
   - Keep this section short and clearly marked as future/planned.

10. **How Humans Should Use This**
    - Recommended quick loop:
      1. Read current reference.
      2. Run `npm run scaffoldai:status`.
      3. Run `npm run scaffoldai:preflight`.
      4. Run `npm run scaffoldai:question`.
      5. Run the recommended VERIFY COMMAND before closeout.

11. **How AI Tools Should Use This**
    - Read this reference for orientation.
    - Prefer Runtime Commands or MCP observations for current facts.
    - Cite tool/command observations back to the human.
    - Stop on blockers, unresolved questions, stale observations, or authority ambiguity.
    - Do not infer approval, verification success, or write authority from read-only observations.

12. **Deeper References**
    - Link list only.
    - Suggested links:
      - `.scaffoldai/README.md`
      - `.scaffoldai/process/runbook.process.md`
      - `.scaffoldai/process/ai-context.process.md`
      - `.scaffoldai/contracts/scaffoldai-mcp-client-interaction-v0.contract.md`
      - `.scaffoldai/planning/scaffoldai-mcp-readonly-v0.md`
      - `.scaffoldai/planning/scaffoldai-mcp-runtime-snapshot-v1.md`
      - `.scaffoldai/planning/scaffoldai-tool-router-v0.md`
      - `.scaffoldai/planning/scaffoldai-execution-classification-v1.md`

---

## What to Summarize vs Link

Summarize:

- Current runtime phase.
- Current commands and tools.
- Current safety boundaries.
- Current validation commands.
- The difference between Runtime Commands, MCP tools, snapshots, and reentry artifacts.

Link instead of duplicating:

- Full MCP client contract.
- Full command design history.
- Full router model.
- Full execution classification model.
- Full runbook workflows.
- Detailed test assertion lists.

Do not include:

- Long historical migration narrative.
- Full planning rationale for every command.
- Detailed implementation code paths.
- Future architecture beyond short, clearly marked notes.

---

## Update Rules

Update this reference when:

- A Runtime Command is added, removed, renamed, or materially changes output.
- An MCP tool is added, removed, renamed, or changes output shape.
- `execution_class` semantics change.
- A read-only surface becomes write-capable.
- Verification or closeout evidence semantics change.
- Snapshot structure changes materially.
- The current runtime phase changes.

Do not update this reference for:

- Internal refactors that do not change user-facing behavior.
- Historical planning doc edits.
- Test-only implementation detail changes.
- Temporary artifact churn under `.scaffoldai/tmp/`.

Recommended cadence:

- Update during the same packet that changes a user-facing runtime surface.
- Re-audit during runtime coherence passes.
- Keep it short enough that maintainers will actually update it.

---

## Relationship to Other Docs

### `.scaffoldai/README.md`

The README remains the repo-local orientation page. It should link to the current-state reference for deeper operational detail.

The current-state reference should be more complete than the README, but still concise.

### `.scaffoldai/state/snapshot.md`

The state snapshot is the human/process continuity artifact. It is curated, long-lived, and part of BRIDGE state.

The current-state reference is not live state. It describes what the runtime is, not what the active work item is.

### `.scaffoldai/tmp/mcp-runtime-snapshot.json`

The MCP runtime snapshot JSON is generated on demand by `npm run scaffoldai:mcp:snapshot`. It is machine-readable, ephemeral, and read-only except for writing the snapshot artifact itself.

The current-state reference should explain how to interpret the JSON, but should not duplicate a live snapshot.

### Runbook and AI Context Docs

The runbook explains workflow. The AI context doc explains session reentry and context use.

The current-state reference should link to both and provide a quick map of when to use them.

### MCP Contract

The MCP client interaction contract remains authoritative for AI-client behavior.

The current-state reference should summarize the contract's practical implications and link to it.

---

## Risks and Guardrails

### Risk: The reference becomes stale

Guardrail: Keep update rules explicit and pair reference updates with user-facing runtime changes.

### Risk: The reference duplicates too much

Guardrail: Use compact tables and links. Do not copy whole contracts or planning rationale.

### Risk: The reference implies new authority

Guardrail: State current boundaries prominently: humans decide, tools observe/recommend, MCP v0 is read-only.

### Risk: The reference becomes too long to read

Guardrail: Prefer short sections, command/tool tables, and links to deeper docs.

### Risk: AI clients treat the reference as live state

Guardrail: Explicitly distinguish descriptive reference from live Runtime Command output, state snapshot, and MCP runtime snapshot JSON.

---

## Recommended Implementation Packet

```text
MODE: EXECUTE
TASK: Add canonical ScaffoldAI current runtime state reference v1

GOAL:
Create .scaffoldai/reference/current-runtime-state.reference.md from the approved plan.

REQUIREMENTS:
- Documentation-only.
- No runtime behavior changes.
- No new MCP tools.
- No write-capable behavior.
- No orchestration.
- Keep it concise and layered.
- Link to deeper docs instead of duplicating them.
- Update .scaffoldai/README.md with a short pointer to the new reference if appropriate.

VERIFY:
Run:
npm run verify:scaffoldai

OUTPUT:
Report:
- reference path
- sections included
- verification result
- whether runtime behavior changed
```

Implementation should proceed after this plan is accepted.
