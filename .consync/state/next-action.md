TYPE: PROCESS
PACKAGE: define_handoff_delivery_bridge_and_automation_path

GOAL

Define a reliable handoff-delivery bridge between the local Consync repo and ChatGPT so the system no longer depends on inconsistent manual copy/paste behavior or partially working Google Drive handoff patterns.

WHY

The core loop, integrity checks, stream model, and trigger-aware process are now strong enough to support normal work. The current weak point is delivery of live handoff context into ChatGPT.

Right now:
- the repo may be in a coherent state locally
- the handoff may exist truthfully in `.consync/state/handoff.md`
- but getting that state into ChatGPT still depends too heavily on manual transfer and inconsistent external tooling behavior

This creates drift risk at exactly the bridge point where the human operator must rehydrate the system for the next conversation.

The next step should not be “build the full automation immediately.” It should define:
- what the bridge is responsible for
- what artifact(s) it should deliver
- what “successful delivery” means
- what fallback paths are acceptable
- what automation path should be pursued next

SCOPE

Keep this package definition-focused and practical.

Expected outcome:
- one new doc defines the handoff-delivery bridge
- the bridge distinguishes local source-of-truth from external delivery mechanisms
- acceptable delivery modes are defined
- success/failure conditions are defined
- the likely automation path is named clearly
- the model avoids overcommitting to Google Drive as the only bridge

Do not:
- implement the automation yet
- build a full MCP server in this package
- redesign the core loop again
- add broad new process complexity
- assume Google Drive will be the permanent solution

WORK INSTRUCTIONS

1. Create a new doc, preferably at:

   `.consync/docs/handoff-delivery-bridge.md`

2. In that doc, define the handoff-delivery problem clearly.

   At minimum, distinguish between:
   - local truth
     - what exists in the repo and is authoritative
   - delivery bridge
     - how that truth is transferred into ChatGPT or another AI session
   - downstream assistant state
     - what the receiving AI must know to continue correctly

3. Define the core source-of-truth principle.

   Make explicit that:
   - `.consync/state/handoff.md` remains the local authoritative closeout artifact
   - any bridge mechanism is a transport layer, not the source of truth
   - external mirrors or uploads must not become the canonical state by accident

4. Define acceptable delivery modes.

   At minimum, include categories such as:
   - manual copy/paste
   - local generated export or bundle
   - uploaded file handoff
   - synced cloud document/file mirror
   - future MCP or direct tool-based delivery

5. Define the strengths, weaknesses, and risk profile of each mode.
   Keep it practical.
   Include the current Google Drive frustration honestly as an example of partial bridge reliability.

6. Define what “successful handoff delivery” means.

   At minimum:
   - the receiving AI can identify the current package or last completed package
   - the receiving AI can identify active stream and current system state
   - the receiving AI can continue without reconstructing truth manually from many files
   - the delivery path does not silently fork or mutate the source of truth

7. Define bridge failure modes.

   Examples:
   - stale uploaded copy
   - partial upload/mirror failure
   - missing stream context
   - multiple conflicting copies
   - handoff delivered without snapshot/runbook context when needed
   - human forced to summarize manually from memory

8. Define the preferred near-term automation path.

   This should likely include:
   - generating a small exportable handoff bundle or conversation-bootstrap payload locally
   - keeping local repo artifacts canonical
   - avoiding dependency on a flaky cloud mirror as the only transport
   - leaving room for future direct delivery through MCP or similar tooling

9. Define the minimal bundle needed for reliable delivery.

   Decide what should travel together, such as:
   - latest handoff
   - current snapshot
   - maybe runbook pointer or compact bootstrap metadata
   Keep it small and operational.

10. Add one or two small pointers from relevant docs if useful, such as:
   - `runbook.md`
   - `snapshot.md`
   - process/operator docs

   Keep pointers minimal.

CONTENT REQUIREMENTS

The new bridge doc should clearly answer:

- What is the authoritative local handoff artifact?
- What is the delivery bridge responsible for?
- What counts as a successful handoff into ChatGPT?
- What delivery modes exist today?
- What are the failure modes?
- What is the preferred near-term automation path?
- Why should transport remain separate from source of truth?

It should also explicitly state that:

- delivery reliability is now a first-class process concern
- a flaky transport layer can reintroduce drift even when local state is clean
- the goal is to reduce human rehydration burden without duplicating authority across systems

CONSTRAINTS

- keep the model compact
- no implementation in this package
- do not treat Google Drive as required infrastructure
- do not blur source-of-truth and transport concerns
- avoid introducing a heavy integration architecture too early

VERIFICATION

1. Read the new bridge doc end to end and confirm it makes the delivery problem easier to explain.
2. Confirm the doc clearly separates local truth from transport.
3. Confirm the acceptable delivery modes are practical and not overdesigned.
4. Confirm the bridge failure modes match the real pain you are seeing.
5. Confirm the preferred near-term automation path is realistic and does not depend on unreliable infrastructure.
6. If any pointers are added, confirm they are minimal and accurate.

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

`define_exportable_handoff_bundle_for_ai_rehydration`

and describe it as the next narrow process package that defines the exact minimal artifact bundle and output shape to generate locally for reliable delivery into ChatGPT before building any actual automation.