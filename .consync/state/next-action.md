TYPE: PROCESS
PACKAGE: define_doc_integrity_layer_and_enforcement_points

GOAL

Define the first narrow documentation integrity layer for Consync so the repo has a clear answer for which docs and state files are governed, what integrity means, when checks should run, and which prompt or agent surfaces own enforcement.

WHY

The process stream is now the active owner again because documentation and state clarity became a system risk. Before any automated checks or enforcement helpers are introduced, the governed surface and the enforcement model need to be defined explicitly and narrowly.

Without that definition, future checks or agent behavior would be premature and likely inconsistent.

SCOPE

This package is definition-only.

Expected outcome:
- one small process doc defines the governed documentation/state surface
- that doc defines what integrity means for the governed files
- that doc defines when integrity checks should run
- that doc defines which prompt and agent surfaces should own enforcement responsibilities
- the result is specific enough to guide later implementation packages without starting them yet

Do not:
- implement automated documentation checks yet
- create a new documentation-integrity agent yet
- refactor the whole process documentation set
- switch streams again in this package
- mix this with UI feature work

WORK INSTRUCTIONS

1. Inspect the existing runbook, snapshot, active-stream rules, agent-routing docs, and any current process docs that already imply integrity expectations.

2. Create one focused doc that answers:
   - which docs/state files are governed first
   - what counts as integrity for each part of that governed surface
   - when checks should run in the package loop
   - which surfaces own enforcement responsibility:
     - human operator
     - prompt instructions
     - optional process/integrity agents

3. Keep the integrity layer minimal and practical.
   It should define the first enforcement points, not a giant future framework.

4. Make sure the result aligns with the current runbook/bootstrap direction and the single live-loop model.

5. Update snapshot or other state/re-entry artifacts only if needed to keep the new process phase easy to resume.

CONTENT REQUIREMENTS

The doc should make clear:
- which files are in the first governed surface
- which integrity failures matter most
- when the operator should check integrity manually
- when prompts should enforce integrity expectations automatically
- where optional agents fit, if used at all

CONSTRAINTS

- Keep the package narrow and definitional
- No code-based enforcement yet
- No new agent implementation yet
- No broad doc rewrite
- Avoid unnecessary churn outside the governed-surface definition

VERIFICATION

Perform focused verification by reading the new integrity-layer doc end to end and checking that:
1. the governed surface is explicit
2. integrity expectations are concrete
3. enforcement timing is stated
4. owner surfaces are assigned clearly
5. the package stays definition-only and does not silently implement checks

HANDOFF REQUIREMENTS

Write the handoff to the live `handoff.md` using the project’s standard structure.

Include:
- TYPE
- PACKAGE
- STATUS
- SUMMARY
- FILES CREATED
- FILES MODIFIED
- VERIFICATION
- MANUAL VERIFICATION
- NEXT SUGGESTED PACKAGE

For `NEXT SUGGESTED PACKAGE`, recommend a narrow follow-up that implements one deterministic integrity check over the newly defined governed surface without broadening into a full enforcement system.