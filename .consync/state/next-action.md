MODE: CONTINUE

CONTEXT: EMBED_INTEGRITY_AGENT_IN_LOOP

TYPE: PROCESS
PACKAGE: add_integrity_agent_step_to_execution_pattern

OBJECTIVE

Introduce a standard, optional step in next_action packages that runs the integrity agent using the reusable prompt.

This makes the agent part of the execution pattern without automating it yet.

---

NON-GOALS

- Do not automate agent execution
- Do not modify agent behavior
- Do not introduce orchestration logic
- Do not require the agent for every package
- Do not change stream structure

---

REQUIRED OUTCOME

Update process guidance to include a standard optional step:

"Run integrity agent using .consync/prompts/run_integrity_agent.md"

This should:

- appear in next_action structure as a recognizable step
- reference the reusable prompt file
- clarify that it happens after verification

---

WHERE TO UPDATE

Add a small section in:

.consync/docs/integrity-agent-loop.md

and optionally:

.consync/docs/stream-operating-model.md

---

CONTENT REQUIREMENTS

Define:

1. STANDARD STEP

Example:

- After verification, optionally run integrity agent:
  - copy prompt from .consync/prompts/run_integrity_agent.md
  - fill TYPE and PACKAGE
  - run with consync-integrity-agent

2. POSITION IN FLOW

Explicitly state:

implementation → tests → verify → integrity agent → handoff → commit

3. OPTIONAL NATURE

Clarify:

- not required for every package
- recommended for:
  - feature changes
  - test changes
  - behavior changes

4. FUTURE NOTE

State:

- this step may become automated later
- current version is manual but standardized

---

ACCEPTANCE CRITERIA

1. Docs clearly define integrity agent as a standard optional step
2. Step references reusable prompt file
3. Placement in flow is explicit
4. Process remains lightweight and manual
5. No unrelated changes introduced

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: add_integrity_agent_step_to_execution_pattern

STATUS

PASS or FAIL

SUMMARY

Explain how the integrity agent is now embedded into the execution pattern.

FILES MODIFIED

List updated docs.

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- step is clearly defined
- references prompt file
- fits naturally into workflow
- no added complexity

VERIFICATION NOTES

Manual inspection.

---

FINAL INSTRUCTION

Be conservative. This is a small integration step, not automation.