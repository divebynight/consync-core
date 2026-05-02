# Run Integrity Agent

Copy this prompt into Copilot Chat, fill in `TYPE` and `PACKAGE`, and run it with `consync-integrity-agent` selected.

Evaluate the integrity of the most recent package:

TYPE: <TYPE>
PACKAGE: <PACKAGE>

Your task:

1. Identify what files were changed and what behavior or system surface they affect.
2. Evaluate whether tests sufficiently cover the changed behavior.
3. Identify gaps in test coverage or edge cases.
4. Check whether docs, stream state, and handoff accurately reflect current repo reality.
5. Identify any process integrity issues, including scope creep, missing verification, or unexpected file changes.

Return:

STATUS: PASS | WARNING | FAIL

FINDINGS:
- bullet list of observations

RISKS:
- potential failure points

SUGGESTED IMPROVEMENTS:
- concrete next steps