MODE: CONTINUE

CONTEXT: SEMI_AUTOMATED_INTEGRITY_STEP

TYPE: PROCESS
PACKAGE: enable_integrity_agent_execution_within_sdc

OBJECTIVE

Enable Copilot to execute the integrity agent as part of the SDC workflow instead of requiring manual prompting.

This step reduces friction while keeping the process explicit and reviewable.

---

NON-GOALS

- Do not fully automate agent execution
- Do not remove human review
- Do not introduce orchestration logic
- Do not change agent behavior

---

REQUIRED OUTCOME

Update process instructions so that SDCs can include:

"Run integrity agent using .consync/prompts/run_integrity_agent.md and append output to handoff"

---

IMPLEMENTATION

1. Update process guidance (likely integrity-agent-loop.md):

Add a section:

### Executing the Integrity Step in SDC

Define that:

- SDCs may include an instruction to run the integrity agent
- Copilot should:
  - use the reusable prompt
  - execute with consync-integrity-agent
  - append results to handoff.md

---

2. Define expected behavior:

- agent output is appended under a clear section in handoff:
  "INTEGRITY CHECK"

- output must remain structured:
  STATUS / FINDINGS / RISKS / SUGGESTED IMPROVEMENTS

---

3. Keep it optional:

- not required for every package
- recommended for:
  - feature work
  - test changes
  - behavior changes

---

ACCEPTANCE CRITERIA

1. Docs define how SDC can trigger integrity agent execution
2. Output destination (handoff) is clearly defined
3. Process remains human-reviewed
4. No automation framework introduced

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: enable_integrity_agent_execution_within_sdc

STATUS

PASS or FAIL

SUMMARY

Explain how integrity agent execution is now possible within SDC.

FILES MODIFIED

List updated docs.

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- instructions are clear
- integration feels natural
- no complexity added

---

FINAL INSTRUCTION

Be conservative. This is controlled friction reduction, not automation.