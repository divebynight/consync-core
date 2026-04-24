Authoritative workflow note:

- `.consync/` is the source of truth for Consync execution workflow.
- Use `.consync/state/*` and `.consync/docs/runbook.md` as authoritative.
- Treat this file as a GitHub/Copilot adapter only.

Read the file at:

.consync/state/next-action.md

Execute it exactly as written.

Follow all constraints in the document.

Output behavior:
- Write the full result to: .consync/state/handoff.md
- Overwrite the file completely

Do NOT print the full response in chat.

Only reply with:
Wrote full handoff to .consync/state/handoff.md

## Handoff Output Rules

Every handoff MUST include these sections:
- Status
- Summary
- Files Created
- Files Modified
- Commands to Run
- Human Verification
- Verification Notes

Do NOT include full file contents.

Instead:
- list created files
- list modified files
- summarize each change in 1–2 lines

Human Verification requirements:
- include step-by-step manual checks
- include real commands the user can run
- cover both success and failure cases when relevant

Verification Notes requirements:
- state what was actually tested
- state the observed outcomes
- mention important edge cases that were validated

Keep output concise and readable.
