# run_closeout.prompt.md

Read the current handoff state:

state/handoff.md

Execute the closeout process defined in:

.github/prompts/complete_work_packet.prompt.md

---

## Objective

Finalize the most recent Work Packet using the existing handoff.

---

## Behavior

- Use handoff.md as the source of truth
- Apply the closeout rules from complete_work_packet.prompt.md
- Do not modify source files
- Do not re-run tests
- Do not introduce new work

---

## Output

Write full result to:

state/handoff.md

Overwrite the file completely.

---

## Output Behavior

Do NOT print the full response in chat.

Only reply with:

Wrote closeout to state/handoff.md

---

## Output Discipline

- concise
- no code blocks
- no file dumps
- summary only
