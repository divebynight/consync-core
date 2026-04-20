TYPE: PROCESS
PACKAGE: create_runbook_and_snapshot_bootstrap_docs

GOAL

Create two local Consync docs that act as the portable bootstrap layer for new AI conversations:

- `.consync/docs/runbook.md`
- `.consync/state/snapshot.md`

These docs should make it easier to rehydrate system behavior and current state into a new ChatGPT or Copilot conversation with less drift and less inconsistency.

WHY

The current Consync repo already contains strong distributed process documentation, but there is not yet a single lightweight bootstrap pair that answers:

1. How should the system be operated?
2. What is the current live state right now?

Without that bootstrap layer, new AI conversations can behave inconsistently depending on how much context is manually reintroduced. The goal of this package is not to replace existing docs, but to create a thin entrypoint and state snapshot that can be copied into future conversations and eventually exposed through MCP or other tooling.

SCOPE

Create the two docs locally in the project folder and keep them intentionally thin, practical, and connective.

Expected outcome:
- a new `.consync/docs/runbook.md` exists
- a new `.consync/state/snapshot.md` exists
- the runbook defines core operating rules and decision logic without duplicating all existing process docs
- the snapshot summarizes the current live state in a compact, reusable format
- both docs are suitable for pasting into a new AI conversation as bootstrap context

Do not:
- rewrite the entire existing doc system
- duplicate large amounts of content from existing docs
- introduce heavy automation in this package
- redesign the stream model
- add verification tooling yet

WORK INSTRUCTIONS

1. Inspect the existing `.consync/docs` and `.consync/state` structure so the new files fit naturally into the current system.

2. Create `.consync/docs/runbook.md` as a thin operating guide.
   It should be a practical decision-layer and entrypoint, not a giant spec.

   Include sections such as:

   - Purpose
   - How to start a session
   - Core operating loop
   - Active stream rule
   - Open vs closed system rule
   - Stream switching rule
   - Package selection rule
   - State reconciliation rule
   - How to use this runbook with AI tools
   - Pointers to deeper docs

3. The runbook should explicitly include the rule we discussed:

   - If the system is closed, any stream may be chosen intentionally.
   - If the system is open, the active stream must be continued until it is completed, paused cleanly, or formally switched.
   - If state is inconsistent or misleading, reconciliation takes priority over feature execution.

4. Create `.consync/state/snapshot.md` as a compact live-state artifact.
   It should be easy to skim and easy to paste into a new AI conversation.

   Include sections such as:

   - System status
   - Active stream
   - Previous stream or paused stream(s), if useful
   - Current package
   - Current goal/focus
   - Current loop state
   - Known tensions or pending decisions
   - Next likely package(s)
   - Bootstrap note for new AI conversations

5. Populate the snapshot using the current known state of the repo and current direction.
   It should reflect the current UI-stream reality rather than a generic template.

6. Keep both docs human-readable, direct, and compact. They should feel like practical operating artifacts, not policy theater.

7. If there is an appropriate existing doc that should lightly reference the runbook, add at most one small pointer. Do not let this package expand into a broad doc refactor.

CONTENT GUIDANCE

For `runbook.md`, optimize for:
- consistency across conversations
- portability
- decision clarity
- minimal duplication

For `snapshot.md`, optimize for:
- current truth
- easy pasteability
- fast re-entry after interruption
- compatibility with ChatGPT and Copilot bootstrap use

SUGGESTED CONTENT SHAPE

`runbook.md` should roughly answer:
- What do I read first?
- What do I do next?
- When do I stay in the current stream?
- When can I switch?
- What do I do if reality and docs disagree?

`snapshot.md` should roughly answer:
- What stream is live?
- What package is live?
- What are we trying to do right now?
- What should the next AI assistant know immediately?

CONSTRAINTS

- Keep both docs small and useful
- Do not create a giant meta-framework
- Do not add code-based doc verification in this package
- Do not stall the active UI stream with a broad process rewrite
- This package is about bootstrap clarity, not full process formalization

VERIFICATION

After creating the docs:

1. Confirm both files exist in the correct locations.
2. Read each file once end-to-end and confirm:
   - the runbook provides actionable operating rules
   - the snapshot reflects current repo reality
   - neither doc is overly long or redundant
3. Confirm the snapshot is suitable to paste into a new AI conversation with minimal editing.
4. If you add any pointer from an existing doc, keep it small and verify it is accurate.

HANDOFF REQUIREMENTS

Write the handoff to the appropriate live `handoff.md` using the project’s standard structure.

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

For `NEXT SUGGESTED PACKAGE`, recommend a narrow follow-up that either:
- lightly links the runbook from one existing system doc, or
- adds deterministic documentation integrity checks,
but only after the current active stream situation is reconciled intentionally.