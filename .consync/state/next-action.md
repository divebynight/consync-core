MODE: CONTINUE

CONTEXT: INTEGRITY_AGENT_PROMPT_STANDARDIZATION

TYPE: PROCESS
PACKAGE: add_reusable_integrity_agent_prompt

OBJECTIVE

Create a reusable, repo-local prompt template for running the consync-integrity-agent.

This removes the need to manually reconstruct prompts and makes agent usage consistent and repeatable.

---

NON-GOALS

- Do not modify agent behavior
- Do not automate execution
- Do not create new agents
- Do not change stream structure
- Do not introduce orchestration logic

---

REQUIRED OUTCOME

Create a new file:

.consync/prompts/run_integrity_agent.md

---

CONTENT REQUIREMENTS

The prompt should:

- instruct the agent to evaluate the most recent package
- reference TYPE + PACKAGE
- guide it through:
  - change surface
  - test coverage
  - behavioral risk
  - doc/state alignment
  - process integrity
- enforce structured output:
  - STATUS
  - FINDINGS
  - RISKS
  - SUGGESTED IMPROVEMENTS

---

PROMPT CONTENT

Write a clean, reusable version of the prompt you’ve been using, but:

- remove package-specific details
- keep placeholders like:
  - TYPE: <TYPE>
  - PACKAGE: <PACKAGE>

---

USAGE NOTE

Include a short note at the top explaining:

- copy prompt into Copilot Chat
- fill in TYPE and PACKAGE
- run with consync-integrity-agent selected

---

COHERENCE UPDATES

Optional:
- add pointer in integrity-agent-loop.md

Do not modify other docs.

---

ACCEPTANCE CRITERIA

1. Prompt file exists and is readable
2. Prompt is reusable and generic
3. Output format is clearly defined
4. Removes need to rewrite prompts manually
5. Keeps process simple and lightweight

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: add_reusable_integrity_agent_prompt

STATUS

PASS or FAIL

SUMMARY

Explain what was added and how it reduces friction.

FILES CREATED

List prompt file.

FILES MODIFIED

List any pointer updates.

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- prompt is usable
- easy to copy and run
- no missing instructions

VERIFICATION NOTES

Manual inspection.

---

FINAL INSTRUCTION

Be conservative. This improves usability, not system complexity.