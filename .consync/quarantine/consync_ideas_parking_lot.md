# REFERENCE / HISTORICAL — NOT PART OF ACTIVE SYSTEM
# Consync / ScaffoldAI — Ideas Parking Lot

This file captures useful ideas that should not be implemented immediately.

The goal is to preserve signal without adding premature process or system complexity.

---

## IDEA: Reflection / Proposal Layer

SOURCE:
Came up while discussing how the system could eventually learn from real usage without modifying itself automatically.

CONTEXT:
After Preflight and Verify hardening, we noticed that real-world friction often reveals useful system improvements. The system should eventually be able to capture those improvements in a controlled way.

PROBLEM:
Friction points and improvement ideas can be forgotten if they are not captured somewhere consistent.

POTENTIAL SOLUTION:
Add a lightweight reflection or proposal section after Verify or Closeout.

Possible future format:
- ISSUE
- TYPE
- IMPACT
- PROPOSED FIX
- HUMAN ACTION

WHY NOT NOW:
The core execution loop is still being stabilized. Adding reflection output too early could create noise and overhead.

TRIGGER TO REVISIT:
Revisit if the same friction appears 2–3 times or if useful system improvement ideas keep getting lost between sessions.

STATUS:
PARKED

---

## IDEA: Proposal Review Packet

SOURCE:
Came up while discussing the middle version between simple idea capture and a future system that can reason deeply about proposed changes.

CONTEXT:
The future version of Consync/ScaffoldAI may review proposed system changes, estimate difficulty, identify affected files, propose task breakdowns, and suggest tests.

PROBLEM:
There is currently no structured middle layer between “interesting idea” and “implementation packet.”

POTENTIAL SOLUTION:
Create a Proposal Review Packet that asks the execution surface to inspect a proposed system improvement and report:
- where it would fit
- likely affected files
- complexity
- risk
- possible task breakdown
- testing strategy
- simpler alternatives

WHY NOT NOW:
The current priority is to stabilize the basic manual loop before adding meta-process.

TRIGGER TO REVISIT:
Revisit once several parked ideas are ready to be evaluated or once feature work repeatedly raises process questions.

STATUS:
PARKED

---

## IDEA: Execution Surface Failure Handling

SOURCE:
Came up after Copilot failed during a valid task because of an execution/service issue.

CONTEXT:
A packet can be valid, but the execution surface can still fail due to token limits, service instability, partial patch generation, or other external failures.

PROBLEM:
The current process distinguishes input failure and output failure, but does not formally classify execution surface failure.

POTENTIAL SOLUTION:
Add a lightweight failure category:
- STATUS: BLOCKED
- REASON: execution_surface_failure
- NEXT SAFE ACTION: retry, reduce scope, or switch surface manually

WHY NOT NOW:
One failure is not enough to justify formal process changes. Watch for repetition first.

TRIGGER TO REVISIT:
Revisit if Copilot/Codex execution failures happen repeatedly or cause confusion about whether the packet itself was valid.

STATUS:
PARKED

---

## IDEA: Product / System Gate

SOURCE:
Came up while discussing how the system should distinguish valid feature ideas from ideas that violate product principles.

CONTEXT:
Some feature requests may be structurally valid but product-risky. For example, adding a contextual preview might fit Consync, while building a full Finder-like file explorer may violate the principle of not reinventing the file system.

PROBLEM:
Preflight validates packet structure, but it does not evaluate whether the requested feature aligns with Consync’s product tenets.

POTENTIAL SOLUTION:
Introduce a future Intake/Product Gate that classifies ideas as:
- ALLOW
- WARN
- NEEDS_REFRAME
- BLOCK

WHY NOT NOW:
This is a higher-level judgment layer and should not be added until the basic execution loop has been tested with real features.

TRIGGER TO REVISIT:
Revisit when feature requests start raising repeated product-shape or scope questions.

STATUS:
PARKED

---

## IDEA: Packet Generator / Contract Compiler

SOURCE:
Came up while discussing the future state where ChatGPT can remain the collaborative planning surface while the system handles exact contract formatting.

CONTEXT:
Humans should not have to manually maintain perfect packet formatting forever. ChatGPT can help design work, but an app-side layer could normalize rough intent into a valid contract packet.

PROBLEM:
Manual packet formatting creates cognitive load and can drift.

POTENTIAL SOLUTION:
Build a packet generator that takes rough intent and produces a valid executable packet with required fields.

Early version:
- ask user a few questions
- output a valid SDC

Later version:
- normalize ChatGPT planning output
- validate contract
- show for human approval before execution

WHY NOT NOW:
The contract needs to stabilize through real usage first.

TRIGGER TO REVISIT:
Revisit when packet creation becomes a repeated source of friction.

STATUS:
PARKED

---

## IDEA: Agent Contract Test Expansion

SOURCE:
Came up after adding Preflight and Verify hardening and realizing the agent contracts need automated protection.

CONTEXT:
Tests should ensure that agent outputs keep required contract lines and expected blocking behavior.

PROBLEM:
Without tests, future changes could accidentally remove required output lines or weaken contract enforcement.

POTENTIAL SOLUTION:
Expand tests around:
- missing required fields
- execution surface mismatch
- ambiguous but valid packets
- Verify output lines
- Verify PASS/BLOCKED alignment

WHY NOT NOW:
This is partially active work already. Continue only in small, test-focused packets.

TRIGGER TO REVISIT:
Revisit whenever agent output formats change.

STATUS:
ACTIVE / IN PROGRESS
