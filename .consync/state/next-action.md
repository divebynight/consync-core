MODE: CONTINUE

CONTEXT: FULL_LOOP_WITH_INTEGRITY

TYPE: PROCESS
PACKAGE: execute_full_package_with_integrity_step

OBJECTIVE

Run one complete package using the updated workflow that includes the integrity agent as part of the loop.

This validates that:
- the agent step works inside SDC
- output lands correctly in handoff.md
- the workflow remains clear and manageable

---

NON-GOALS

- Do not introduce new system structure
- Do not expand agent behavior
- Do not automate beyond defined process
- Do not create a large feature

---

TASK

Choose a small, safe package, such as:

- minor test cleanup
- small doc alignment
- minor UI consistency tweak

Keep scope minimal.

---

REQUIRED STEPS

1. Execute package normally
2. Run tests and verification
3. Run integrity agent using:
   .consync/prompts/run_integrity_agent.md
4. Append output to handoff.md under:

   INTEGRITY CHECK

5. Complete handoff

---

ACCEPTANCE CRITERIA

1. Package completes successfully
2. Integrity agent runs as part of the loop
3. Agent output appears in handoff.md
4. Output follows structured format
5. Workflow remains readable and not cumbersome

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: execute_full_package_with_integrity_step

STATUS

PASS or FAIL

SUMMARY

Explain how the full loop worked with the integrity step included.

FILES MODIFIED

List changes.

COMMANDS TO RUN

- npm run verify

HUMAN VERIFICATION

Confirm:
- integrity output exists in handoff
- workflow feels smooth
- no confusion introduced

---

FINAL INSTRUCTION

Be conservative. This is a validation run, not a feature push.