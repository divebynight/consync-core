MODE: CONTINUE

CONTEXT: AGENT_INTRODUCTION_STRATEGY

TYPE: PROCESS
PACKAGE: capture_agent_introduction_strategy

OBJECTIVE

Capture the current strategy for introducing agents into Consync in a small, durable, process-facing document.

This should preserve:
- when agents should be introduced
- what kinds of tasks are appropriate early
- what to avoid
- initial candidate agent roles

This is not an implementation package. It is a reference capture.

---

NON-GOALS

- Do not create actual agents
- Do not modify stream structure
- Do not introduce orchestration logic
- Do not add automation
- Do not create a large or abstract document
- Do not turn this into a full system design

---

REQUIRED OUTCOME

Create one small document under:

.consync/docs/agent-introduction-strategy.md

The document should cover these areas:

---

1. PRINCIPLE

Define the core idea:

Agents should be introduced when:
- tasks are repeatable
- success is easy to verify
- blast radius is small

Include the rule:

Agents should compete on execution speed, not on guessing reality.

---

2. MATURITY STAGES

Define a simple progression:

Stage 1 — Human-run simulation  
Stage 2 — Agent drafts, human approves  
Stage 3 — Agent executes in isolated lanes  
Stage 4 — Background/parallel agents (later)

Keep this short and practical.

---

3. GOOD EARLY AGENT TASKS

List practical, low-risk uses:

- test generation and expansion
- doc cleanup and linking
- stream snapshot summarization
- handoff condensation
- integrity checks (docs vs code vs state)
- fixture and verification checks

---

4. TASKS TO AVOID EARLY

List high-risk areas:

- process model changes
- orchestration decisions
- multi-stream coordination
- anything relying on implicit human context

---

5. FIRST CANDIDATE AGENTS

Define a few narrow roles:

- consync-test-agent
- consync-integrity-agent
- consync-docs-agent

Include a short description of each.

---

6. INTEGRITY AGENT IDEA

Capture the concept:

An agent that checks:
- docs vs repo reality
- test coverage vs changed surface
- broken references
- missing verification steps

Make clear:
- it reports first
- does not enforce or mutate yet

---

7. RELATIONSHIP TO STREAMS

Add a short note:

Streams define boundaries.  
Tests define truth.  
Agents operate inside those boundaries.

---

DOCUMENT PLACEMENT

Place under `.consync/docs/` alongside other process docs.

---

COHERENCE UPDATES

Optional:
- add a light pointer from `current-system.md` if appropriate

Do not rewrite existing docs.

---

STYLE

- keep it short
- keep it practical
- avoid hype language
- avoid over-architecting
- write as a working guideline, not a vision doc

---

ACCEPTANCE CRITERIA

1. Document exists and is easy to find.
2. It clearly defines when and how to introduce agents.
3. It lists realistic early use cases.
4. It avoids turning into a full system design.
5. It feels aligned with current Consync philosophy.

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: capture_agent_introduction_strategy

STATUS

PASS or FAIL

SUMMARY

Explain what was captured and why.

FILES CREATED

List the new doc.

FILES MODIFIED

List any small pointer updates.

COMMANDS TO RUN

Provide simple inspection commands.

HUMAN VERIFICATION

Confirm:
- doc exists
- content matches intent
- stays small and practical

VERIFICATION NOTES

State manual inspection.

NOTES

Mention any decisions to keep scope minimal.

---

FINAL INSTRUCTION

Be conservative. This is a capture step, not a system build step.