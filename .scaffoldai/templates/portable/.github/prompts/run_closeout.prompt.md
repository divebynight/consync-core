# run_closeout.prompt.md

Read the current handoff state:

.consync/state/handoff.md

Finalize the most recent Work Packet using the existing handoff.

---

## Behavior

- Use `.consync/state/handoff.md` as the source of truth
- Do not modify source files
- Do not re-run tests unless explicitly requested
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