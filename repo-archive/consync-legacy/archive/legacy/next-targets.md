# Consync V1 — Next Targets (SDC)

## MODE
CONTINUE

## CONTEXT
POST-MANUAL-TEST-PROTOCOL

## EXPECTATION
Define immediate next work areas. Do not implement yet.

---

## Current State

System now has:
- Read-only scan layer (`sandbox-scan`)
- Descriptive layer (`sandbox-describe`)
- Conservative proposal layer (`sandbox-propose`)
- Fixture-backed verification (`npm run verify`)
- Manual testing protocol (`.consync/artifacts/04_manual-test-protocol.md`)
- Supporting artifacts:
  - work-log
  - feature-map

System is:
- Deterministic
- Read-only
- Testable (fixtures + manual loop)

---

## Phase Shift

We are moving from:
→ Building foundation

To:
→ Validating behavior against real-world patterns

---

## Immediate Next Work Areas

### 1. Run Manual Test Loops (PRIMARY)

Goal:
- Validate proposal behavior against real folders

Actions:
- Run protocol on:
  - controlled mess folders
  - early creative session folders

Output:
- PASS / WEAK PASS / FAIL classifications
- Notes on behavior patterns

Constraint:
- No code changes during initial runs

---

### 2. Identify Pattern Gaps

Goal:
- Detect where `sandbox-propose` fails or is weak

Look for:
- Over-grouping
- Missed obvious groupings
- Poor restraint
- Noise in output

Output:
- Small, clear pattern observations (not solutions yet)

---

### 3. Promote Strong Cases to Fixtures

Goal:
- Expand deterministic test coverage

Trigger:
- Clear PASS cases

Actions:
- Copy folder → `sandbox/fixtures/`
- Add to `verify.js`

Constraint:
- Only promote high-signal cases

---

### 4. Define First Proposal Improvements (NOT IMPLEMENTED)

Goal:
- Prepare next feature packet

Based on:
- Repeated FAIL / WEAK PASS patterns

Output:
- Small, scoped improvement ideas
- Must preserve:
  - determinism
  - restraint
  - simplicity

---

## Non-Goals (Important)

Do NOT:
- Add automation
- Expand command surface
- Introduce AI/interpretation layer
- Over-engineer proposal logic

---

## Guiding Principle

Every change must:
→ Improve obviousness
→ Maintain restraint
→ Stay deterministic

---

## Next Action Trigger

After 2–5 manual test runs:

→ Summarize patterns  
→ Define next small packet  
→ Then implement

Until then:
→ Stay in observation mode