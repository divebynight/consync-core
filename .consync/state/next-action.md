MODE: CONTINUE

CONTEXT: INTEGRITY_AGENT_LOOP_INTEGRATION

TYPE: PROCESS
PACKAGE: define_integrity_agent_in_package_loop

OBJECTIVE

Define the minimal process for using the repo-local `consync-integrity-agent` as part of the package loop.

This package should make the current workflow less ad hoc by defining:
- when the integrity agent should be run
- what input it should use
- what output it should produce
- where that output should live in the process
- when it is optional vs expected

This is a process-integration step, not an automation step.

NON-GOALS

- Do not automate agent execution
- Do not create new agents
- Do not change stream structure
- Do not rewrite the full package loop
- Do not add orchestration code
- Do not force the integrity agent into every package regardless of value

REQUIRED OUTCOME

Create one small process-facing document under `.consync/docs/` that defines how the integrity agent participates in the package loop.

The doc should cover these areas:

1. PURPOSE
Define the integrity agent as a report-only checker that helps assess package integrity after implementation and verification.

2. WHEN TO RUN IT
Define practical guidance for when the integrity agent should be used.
Examples:
- packages that add or change tests
- packages that alter user-facing behavior
- packages where docs, code, and state may drift
- not required for every tiny doc-only package

3. INPUTS
Define the typical inputs:
- package handoff
- changed files
- relevant stream snapshot/handoff
- recent verification results

4. OUTPUT
Define the expected output shape:
- STATUS: PASS | WARNING | FAIL
- FINDINGS
- RISKS
- SUGGESTED IMPROVEMENTS

5. PLACE IN LOOP
Define where it fits in the current process:
- after implementation
- after tests/verification
- before final confidence/next-step planning

6. HANDLING RESULTS
Define the lightweight rule:
- PASS → package may proceed
- WARNING → decide whether to tighten now or note for later
- FAIL → inspect before advancing

7. FUTURE NOTE
Add a short note that this is currently a manual step but may later be embedded into the execution loop or automated.

DOCUMENT PLACEMENT

Create a clearly named doc under `.consync/docs/`, such as:

- integrity-agent-loop.md

Keep it near the other process docs.

COHERENCE UPDATES

Make only light updates if helpful:
- add a pointer from `current-system.md`
- optionally add a small note in `agent-introduction-strategy.md`

Do not do broad rewrites.

STYLE

- keep it short
- keep it practical
- avoid hype language
- write as a working rule, not a future architecture doc

ACCEPTANCE CRITERIA

1. A small doc exists defining how the integrity agent fits into the package loop.
2. It clearly defines when to run the agent and what output to expect.
3. It places the agent after verification and before final advancement.
4. It remains manual/process-facing rather than automated.
5. Supporting updates remain light.

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: define_integrity_agent_in_package_loop

STATUS

PASS or FAIL

SUMMARY

Explain how the integrity agent is now defined within the package loop.

FILES CREATED

List the new doc.

FILES MODIFIED

List any light pointer updates.

COMMANDS TO RUN

Provide simple inspection commands.

HUMAN VERIFICATION

Confirm:
- doc exists
- guidance is practical
- it clearly fits into the current loop
- no unnecessary complexity was added

VERIFICATION NOTES

State manual inspection.

NOTES

Mention any decisions made to keep this process step lightweight and manual for now.

FINAL INSTRUCTION

Be conservative. This package should clarify the workflow, not automate it.