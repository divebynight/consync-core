# CANONICAL ENTRY POINT — SOURCE OF TRUTH FOR SYSTEM STATE
# CANONICAL ENTRY POINT
This is the canonical system entry and AI re-anchor document for Consync/ScaffoldAI. For all other system entry, planning, or template docs, refer back to this file as the source of truth.
# Consync / ScaffoldAI — Current System State

## WHAT THIS SYSTEM IS

Consync/ScaffoldAI is a deterministic, non-orchestrated process layer for managing creative and development work.

It uses explicit agent execution surfaces to:
- classify work (Intake)
- validate readiness (Preflight)
- verify outcomes (Verify)

The system is manual, tool-agnostic, and human-controlled.

---

## CURRENT CAPABILITIES

- intake-run → classification
- preflight-run → readiness validation
- verify-run → intent vs result evaluation

- Manual execution flow defined
- Prompt contract defined
- No orchestration or automatic execution

---

## HOW TO OPERATE

prompt → intake-run → preflight-run → perform work → verify-run → closeout → commit (manual)

---

## SYSTEM CONSTRAINTS

- No agent chaining
- No automatic execution
- No automatic commits
- No orchestration layer
- No state mutation by agents
- Human is final authority

---

## CURRENT PHASE

We have completed:
- Intake agent execution surface
- Preflight agent execution surface
- Verify agent execution surface
- Manual execution flow documentation
- Prompt contract definition
- System layering model

We are now focusing on:
- continuing process/system design in a controlled way
- maintaining simplicity and non-orchestrated behavior

---

## NEXT INTENT

Continue building the process layer carefully.

Priorities:
- avoid unnecessary complexity
- avoid introducing orchestration
- ensure all additions align with prompt contract and manual flow

---

## SOURCE OF TRUTH (DO NOT DUPLICATE)

Prompt Contract:
.consync/docs/prompt-contract.md

Manual Execution Flow:
.scaffoldai/process/manual-execution-flow.process.md

Agent Definitions:
.scaffoldai/agents/

---

## AI TOOL EXPECTATION

Any AI interacting with this system must:

- follow the Prompt Contract
- respect manual execution flow
- not introduce orchestration or hidden behavior
- not assume missing capabilities
- treat this document as the entry point
