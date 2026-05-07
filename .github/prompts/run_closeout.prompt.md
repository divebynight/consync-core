# run_closeout.prompt.md

Authoritative workflow note:

- `.scaffoldai/state/` and `.scaffoldai/streams/` are the BRIDGE source of truth for live execution state.
- `.scaffoldai/` is the authoritative ScaffoldAI process/harness layer.
- The Closeout agent is bound to `.scaffoldai/skills/closeout-agent.md` as its current prompt/process execution surface.
- Treat this file as a GitHub/Copilot adapter only.

Read the current handoff state:

.scaffoldai/state/handoff.md

Read the authoritative Closeout agent workflow at:

.scaffoldai/skills/closeout-agent.md

---

## Objective

Finalize the most recent Work Packet using the existing handoff.

---

## Behavior

- Use handoff.md as the source of truth
- Apply the closeout rules from `.scaffoldai/skills/closeout-agent.md`
- Do not modify source files
- Do not re-run tests
- Do not introduce new work

---

## Output

Write full result to:

.scaffoldai/state/handoff.md

Overwrite the file completely.

The final handoff in `.scaffoldai/state/handoff.md` must include these sections:
- Status
- Summary
- Files Created
- Files Modified
- Commands to Run
- Human Verification
- Verification Notes

---

## Output Behavior

Do NOT print the full response in chat.

Only reply with:

Wrote closeout to .scaffoldai/state/handoff.md

---

## Output Discipline

- concise
- no code blocks
- no file dumps
- summary only

Human Verification requirements:
- include step-by-step manual checks
- include real commands the user can run
- cover both success and failure cases when relevant

Verification Notes requirements:
- state what was actually tested
- state the observed outcomes
- mention important edge cases that were validated
