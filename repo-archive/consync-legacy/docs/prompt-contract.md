# Prompt Contract

## 1. PURPOSE

Prompts are not casual input. Prompts are structured system entrypoints. The Consync/ScaffoldAI system relies on prompt clarity to function correctly. Every tool, agent, or human must treat prompts as the primary interface for intent and scope.

---

## 2. INPUT SHAPE (PROMPT CONTRACT)


A compliant executable packet must contain:
- MODE
- EXECUTION SURFACE
- CONTEXT
- EXPECTATION
- TASK or GOAL
- OUTPUT FORMAT

A good prompt contains:
- **Clear intent** (what is being done)
- **Clear scope** (what kind of work: product, docs, tests, process)
- **Optional:** constraints or boundaries

**Examples:**

**GOOD:**
- "add onboarding UI to Electron renderer with tooltips"

**MIXED:**
- "add onboarding UI and write documentation"

**BAD:**
- "do the thing with the stuff"

---

## 3. AGENT INTERPRETATION

Agents use the prompt as follows:
- **Intake:** classifies the prompt
- **Preflight:** checks readiness
- **Verify:** compares intent (prompt) vs result

The system is deterministic (keyword-based). Unknown prompts are expected early on. Blocking is a feature, not a failure.

---

## 4. OUTPUT CONTRACT (AGENT RESPONSES)

Expected output structure:
- **STATUS:** PASS / WARN / FAIL / BLOCKED
- **CLASSIFICATION**
- **RISK / READINESS**
- **ALIGNMENT / SCOPE / COMPLETENESS** (Verify)

Outputs are structured for both humans and AI tools. Outputs are not suggestions — they are system evaluations.

---

## 5. REVISION LOOP

How to react to system feedback:
- **PASS:** proceed
- **WARN:** refine or continue carefully
- **FAIL:** rethink request
- **BLOCKED:** rewrite prompt

**Example:**

Prompt:
"improve onboarding experience"

→ BLOCKED

Revised:
"add tooltip onboarding system to Electron renderer"

→ PASS

---

## 6. SYSTEM BOUNDARIES

- No automatic execution
- No automatic commits (unless explicitly allowed)
- No orchestration
- Human is final authority

---

## 7. TOOL-AGNOSTIC DESIGN

- Any AI tool must follow this contract
- The system is not tied to Copilot/ChatGPT/etc
- The contract is the integration layer
