MODE: CONTINUE

CONTEXT: AGENT_ROUTING_POLICY

TYPE: PROCESS
PACKAGE: define_agent_routing_policy

OBJECTIVE

Define a small, practical routing policy for when to run:
- consync-integrity-agent
- consync-process-agent
- both agents
- neither

This package should reduce unnecessary overhead and make agent use more consistent.

NON-GOALS

- Do not create new agents
- Do not automate routing
- Do not change agent behavior
- Do not rewrite the package loop
- Do not introduce orchestration logic
- Do not build a large decision framework

REQUIRED OUTCOME

Create one small process-facing document under `.consync/docs/` that defines when each agent should be used.

The document should cover these areas:

1. PURPOSE

Explain that agent routing exists to:
- reduce unnecessary ceremony
- keep agent use consistent
- focus checks where they add the most value

2. INTEGRITY AGENT

Define that integrity agent is most useful for:
- feature changes
- test changes
- user-facing behavior changes
- packages where code/tests/docs may drift

3. PROCESS AGENT

Define that process agent is most useful for:
- process packages
- stream/state/doc changes
- packages touching handoff, next_action, stream status, or loop docs
- situations where formatting or alignment drift is likely

4. BOTH AGENTS

Define when both are recommended, such as:
- larger packages
- multi-step workflow changes
- packages affecting both behavior and process
- times when extra redundancy is useful

5. NEITHER AGENT

Define when neither is usually needed, such as:
- tiny typo-only fixes
- trivial low-risk edits
- extremely narrow changes with obvious verification

6. HUMAN OVERRIDE

State clearly:
- this is guidance, not a hard rule
- the user may run an agent whenever extra confidence is helpful
- when mentally fatigued or sick, using more checks is reasonable

7. FUTURE NOTE

Add a short note:
- routing may later be embedded into SDC or lightweight automation
- current version is manual and judgment-based

DOCUMENT PLACEMENT

Create a clearly named doc under `.consync/docs/`, such as:

- agent-routing-policy.md

COHERENCE UPDATES

Make only light updates if helpful:
- add a pointer from `current-system.md`
- optionally add a pointer from `integrity-agent-loop.md`
- optionally add a pointer from `agent-introduction-strategy.md`

Do not do broad rewrites.

STYLE

- keep it short
- keep it practical
- avoid abstract language
- write as a working guideline, not a theory doc

ACCEPTANCE CRITERIA

1. A small doc exists defining when to run which agent
2. It clearly distinguishes integrity, process, both, and neither
3. It keeps the process lightweight
4. It leaves room for human judgment
5. Supporting updates remain light

HANDOFF FORMAT

TYPE: PROCESS
PACKAGE: define_agent_routing_policy

STATUS

PASS or FAIL

SUMMARY

Explain what routing policy was added and how it reduces overhead.

FILES CREATED

List the new doc.

FILES MODIFIED

List any light pointer updates.

COMMANDS TO RUN

- git status --short

HUMAN VERIFICATION

Confirm:
- doc exists
- guidance is practical
- it reduces ambiguity without adding complexity

VERIFICATION NOTES

Manual inspection.

NOTES

Mention any decisions made to keep the policy lightweight and non-prescriptive.

FINAL INSTRUCTION

Be conservative. This should reduce friction, not add framework.