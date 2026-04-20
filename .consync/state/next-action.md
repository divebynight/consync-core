TYPE: PROCESS
PACKAGE: define_doc_integrity_layer_and_enforcement_points

GOAL

Define the first formal documentation and state integrity layer for Consync so the system can answer a small set of canonical state questions consistently and so future agents/checks know exactly what they are responsible for enforcing.

WHY

The system has grown beyond a single linear loop. With multiple streams, stream switching, paused local state, global ownership markers, bootstrap docs, and live state artifacts, it is no longer acceptable to infer current truth manually by reading scattered markdown files.

Consync now needs an explicit integrity definition layer that answers:

- Is the system open or closed?
- Which stream is currently active?
- Which package is currently active?
- Which files are canonical for live truth?
- Which files are supporting, local, historical, or reference-only?
- When should integrity be checked?
- Which agent or check surface owns that enforcement?

This package should define the rules and surfaces before any automated validation is implemented.

SCOPE

Keep this package definition-focused.

Expected outcome:
- one new doc defines the documentation/state integrity layer
- governed artifact classes are explicitly named
- canonical live-state questions are explicitly defined
- canonical source-of-truth files for those answers are explicitly defined
- enforcement timing is explicitly defined
- agent/check ownership is explicitly defined at a high level
- the current system docs gain only small pointers if needed

Do not:
- implement automated doc checks yet
- create the new doc-integrity agent yet
- refactor the whole documentation corpus
- rewrite every state file into a new format
- redesign the stream model again in this package

WORK INSTRUCTIONS

1. Inspect the current `.consync` structure and identify the main artifact families already in use.

2. Create one new process doc, preferably at:

   `.consync/docs/doc-integrity-layer.md`

   This doc should define the first formal integrity model for documentation and state artifacts.

3. In that doc, define a small artifact classification system so markdown files are not treated as one undifferentiated class.

   At minimum, define and describe these classes:

   - state artifacts
   - contracts
   - runbooks
   - policies
   - history records
   - reference docs

4. Explicitly define the canonical live-state questions the system must always be able to answer without ambiguity.

   At minimum:

   - Is the system open or closed?
   - What is the active stream?
   - What is the previous stream, if relevant?
   - What streams are paused?
   - What is the active package?
   - What is the current live-loop owner?
   - Is the live loop reconciled or in tension?
   - What is the next safe action?

5. For each canonical question, define the intended source-of-truth artifact or artifact order.

   Be explicit about which files are canonical vs supporting.

   Example shape:
   - primary source
   - supporting confirmation source
   - non-canonical supporting context
   - historical only

6. Define “system open” vs “system closed” as a formal state concept.

   Include rules such as:
   - when the system is considered open
   - when the system is considered closed
   - what actions are allowed in each state
   - what reconciliation means if state surfaces disagree

7. Define enforcement points.

   At minimum, specify when integrity checks should happen:
   - before executing a new package
   - after package completion before closeout is accepted
   - after stream switches
   - when bootstrap docs are refreshed
   - before resuming a paused stream after a long gap

8. Define agent/check ownership at a high level.

   You do not need to implement the agents yet, but define the roles clearly. For example:
   - process agent checks loop/state/ownership alignment
   - integrity agent checks system trust and drift-sensitive surfaces
   - future doc-integrity agent or verification surface checks format, governed files, and consistency across canonical state artifacts

9. Keep the model simple and operational.
   The goal is not a giant taxonomy. The goal is to make the system easier to explain and safer to continue.

10. Add at most small pointers from one or two existing docs if needed, such as:
   - `runbook.md`
   - `current-system.md`

   Keep those pointers minimal.

CONTENT REQUIREMENTS

The new integrity-layer doc should clearly answer:

- What counts as a governed artifact?
- Which artifacts define current truth?
- Which artifacts are supporting only?
- Which questions must always have a deterministic answer?
- When must integrity be checked?
- Who owns those checks?
- What should happen when files disagree?

It should also explicitly state that:

- users and AI should not need to manually infer live state from scattered markdown
- the system should converge toward deterministic state readability
- historical/reference docs must not override live state artifacts

CONSTRAINTS

- Keep the doc practical and short enough to use
- Avoid inventing unnecessary categories
- Avoid large-scale rewrites of existing docs in this package
- Do not implement validators yet
- Do not mix this package with UI work
- Do not hide current ambiguities; define how they should be resolved

VERIFICATION

After writing the doc:

1. Read it end to end and confirm it makes the system easier to explain, not harder.
2. Confirm it clearly distinguishes canonical state artifacts from supporting or historical markdown.
3. Confirm it defines open vs closed state in a usable way.
4. Confirm it defines the canonical live-state questions explicitly.
5. Confirm it defines enforcement timing and agent ownership clearly enough that a follow-up package can build actual checks from it.
6. If you add pointers from existing docs, keep them minimal and verify they are accurate.

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

For `NEXT SUGGESTED PACKAGE`, recommend:

`define_canonical_state_contracts_for_open_closed_stream_and_package`

and describe it as the next narrow package that turns the integrity-layer model into explicit contracts for the core live state artifacts before any automated checks are added.