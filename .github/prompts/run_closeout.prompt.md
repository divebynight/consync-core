# run_closeout.prompt.md

Authoritative workflow note:

- `.consync/` is the source of truth for Consync closeout behavior.
- Use `.consync/.agents/skills/closeout-agent.md` as the authoritative closeout workflow.
- Treat this file as a GitHub/Copilot adapter only.

Read the current handoff state:

.consync/state/handoff.md

Read the authoritative workflow at:

.consync/.agents/skills/closeout-agent.md

---

## Objective

Finalize the most recent Work Packet using the existing handoff.

---

## Behavior

- Use handoff.md as the source of truth
- Apply the closeout rules from `.consync/.agents/skills/closeout-agent.md`
- Do not modify source files
- Do not re-run tests
- Do not introduce new work

---

## Output

Write full result to:

.consync/state/handoff.md

Overwrite the file completely.

The final handoff in `.consync/state/handoff.md` must include these sections:
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

Wrote closeout to .consync/state/handoff.md

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
