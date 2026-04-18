MODE: CONTINUE

CONTEXT: EMBED_PROCESS_AGENT_IN_LOOP

TYPE: PROCESS
PACKAGE: add_process_agent_step_to_execution_pattern

OBJECTIVE

Introduce a standard optional step in the package loop to run consync-process-agent after the integrity step.

This mirrors the integrity agent integration and ensures process alignment is checked before final handoff.

---

NON-GOALS

- Do not automate execution
- Do not require process agent for every package
- Do not change agent behavior
- Do not introduce orchestration logic

---

REQUIRED OUTCOME

Update process guidance to include:

"Run process agent and append output to handoff under PROCESS CHECK"

---

WHERE TO UPDATE

.consync/docs/integrity-agent-loop.md  
(or wherever the loop is currently defined)

---

CONTENT REQUIREMENTS

1. DEFINE NEW STEP

After integrity agent:

- optionally run process agent
- use consync-process-agent
- append output to handoff.md under:

PROCESS CHECK

---

2. DEFINE ORDER

Explicitly document:

implementation → tests → verify → integrity agent → process agent → handoff → commit

---

3. OUTPUT FORMAT

Require structured output:

STATUS  
FINDINGS  
RISKS  
SUGGESTED IMPROVEMENTS  

---

4. OPTIONAL NATURE

Clarify:

- not required for every package
- recommended for:
  - process changes
  - multi-step workflows
  - packages touching docs or streams

---

5. FUTURE NOTE

State:

- this step may be automated later
- current version is manual but standardized

---

ACCEPTANCE CRITERIA

1. Docs define process agent as a standard optional step
2. Step is placed after integrity agent
3. Output location (PROCESS CHECK) is clearly defined
4. Process remains simple and manual
5. No unrelated changes introduced

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: add_process_agent_step_to_execution_pattern

STATUS

PASS or FAIL

SUMMARY

Explain how process agent is now embedded into the loop.

FILES MODIFIED

List updated docs.

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- step is clear
- output placement is clear
- workflow remains readable

---

FINAL INSTRUCTION

Be conservative. Extend the loop, don’t complicate it.