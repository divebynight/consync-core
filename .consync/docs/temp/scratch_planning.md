MODE: IMPLEMENT
PACKET_ID: scaffoldai-system-layers-summary-v1

GOAL:
Capture the key architectural insights from this conversation:
- Concentric explanation layers
- Prompt-as-interface concept
- Contract-based system design

This document serves as a high-level reference for future development and onboarding.

---

TASK:

Create:
.consync/docs/system-layers.md

Document the following:

---

1. CORE IDEA

Explain:

The system is defined by:

INPUT SHAPE → PROCESS CONTRACT → OUTPUT SHAPE

Prompts are the interface.
Agents enforce the contract.
Outputs communicate system state.

---

2. CONCENTRIC LAYERS

Define four layers:

---

LAYER 1 — SIMPLE (USER VIEW)

Purpose:
- Help non-technical users

Contains:
- What to do
- Basic steps
- Minimal terminology

Example:
- "Write what you want and run intake"

---

LAYER 2 — OPERATIONAL (POWER USER)

Purpose:
- Help consistent usage

Contains:
- How to write prompts
- How to interpret outputs
- How to revise prompts

---

LAYER 3 — CONTRACT (AI INTERFACE)

Purpose:
- Define how AI tools interact

Contains:
- Required input structure
- Required output structure
- Allowed actions
- Forbidden actions

This is the most important layer for interoperability.

---

LAYER 4 — SYSTEM (INTERNAL DESIGN)

Purpose:
- Define architecture

Contains:
- agent definitions
- execution surfaces
- system rules
- philosophy

---

3. WHY LAYERS MATTER

Explain:

Without layers:
- confusion
- misuse
- bypassing system

With layers:
- clarity
- consistency
- tool interoperability

---

4. SAFETY MODEL

Explain:

When ambiguity exists:
→ system defaults to safety

Examples:
- no commit
- BLOCKED instead of guessing
- WARN instead of FAIL for unknown

---

5. HUMAN AUTHORITY

Define:

- AI evaluates
- Human decides
- Human commits
- Human pushes

---

6. TOOL-AGNOSTIC VISION

Explain:

- Any AI can plug in
- System behavior is stable
- Intelligence layer is replaceable

---

CONSTRAINTS:

- Docs-only
- Do not change code
- Do not introduce new agents or commands
- Keep language clear and structured

---

VERIFY:

npm run check:state-preflight
npm run verify
npm run check:state-postflight

---

OUTPUT:

STATUS
SUMMARY
FILES CHANGED
LAYERS DOCUMENTED
KEY INSIGHTS CAPTURED
VERIFY RESULTS
BLOCKERS