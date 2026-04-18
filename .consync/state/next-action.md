MODE: CONTINUE

CONTEXT: TIGHTEN_INTEGRITY_AGENT_OUTPUT

TYPE: PROCESS
PACKAGE: refine_integrity_agent_output_format

OBJECTIVE

Reduce verbosity and improve signal quality of consync-integrity-agent output while preserving its usefulness.

---

NON-GOALS

- Do not change agent scope
- Do not change evaluation logic
- Do not add new responsibilities
- Do not introduce automation

---

REQUIRED OUTCOME

Update the agent prompt in:

.github/agents/consync-integrity.agent.md

---

CHANGES

1. REMOVE THINKING/PROCESS NARRATION

Agent should NOT:
- describe what it is doing
- mention commands it ran
- narrate inspection steps

---

2. TIGHTEN OUTPUT

Each section should be:

STATUS:
- single line

FINDINGS:
- concise bullets (no paragraphs)

RISKS:
- short, concrete risks

SUGGESTED IMPROVEMENTS:
- actionable, minimal

---

3. ADD RULE

Add explicit instruction:

"Do not include reasoning steps or narration. Only output final structured results."

---

4. KEEP BEHAVIOR

Do NOT:
- reduce accuracy
- remove useful insights
- simplify logic

Only reduce noise.

---

ACCEPTANCE CRITERIA

1. Agent output is shorter and more direct
2. No "I am inspecting..." style narration
3. Output remains structured and useful
4. No loss of important signal

---

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: refine_integrity_agent_output_format

STATUS

PASS or FAIL

SUMMARY

Explain how output was tightened.

FILES MODIFIED

- .github/agents/consync-integrity.agent.md

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- output is cleaner
- no narration
- still useful

---

FINAL INSTRUCTION

Be conservative. Improve clarity, not behavior.