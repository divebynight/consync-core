TYPE: PROCESS
PACKAGE: apply_integrity_trigger_model_to_live_loop_commands_and_closeout

INTEGRITY TRIGGER

- level: `heavy`
- why: this package changes live-loop governance guidance and the package template that future operators will use during execution
- preflight checks:
   - `npm run check:state-preflight`
- postflight checks:
   - `npm run check:state-postflight`
- extra review required:
   - confirm the updated loop guidance keeps ordinary feature work fast
   - confirm the updated template and contracts do not imply every `process` package is automatically `heavy`
   - confirm the process silo remains the highest-governance zone in the operator-facing guidance

GOAL

Wire the defined integrity trigger model into the practical Consync loop so operators can tell, during real package work, which validation level applies and which checks to run before and after execution.

WHY

Consync now has:
- state contracts
- global and stream-local integrity checks
- artifact roles
- validation tiers
- an integrity trigger model

What is still missing is practical loop integration.

Right now the trigger model exists as policy, but the live loop does not yet clearly tell the operator:
- which trigger level applies to the current package
- which checks to run before execution
- which checks to run before accepting closeout
- when heavier process/governance validation is required

This package should connect the defined trigger model to ordinary operation without introducing orchestration bloat.

SCOPE

Keep this package small and operational.

Expected outcome:
- the live loop explicitly identifies the integrity trigger level for the current package
- operators can tell which checks to run during preflight and postflight
- closeout expectations reflect the selected trigger level
- the runbook and/or loop docs make this easy to follow in practice
- no heavy workflow engine is introduced

Do not:
- build a new scheduler or orchestrator
- redesign the package loop
- add repo-wide validation beyond the checks already implemented
- create file permissions or security controls
- mix this with UI work

WORK INSTRUCTIONS

1. Inspect the current live loop surfaces and determine the smallest practical integration points.

   Prioritize the artifacts/operators already used during normal work, such as:
   - `.consync/state/next-action.md`
   - `.consync/state/handoff.md`
   - runbook / loop docs
   - existing command surfaces
   - closeout expectations

2. Apply the trigger model to the live loop in a simple way.

   At minimum, the system should make it clear for a package:
   - which trigger level applies (`light`, `elevated`, or `heavy`)
   - what preflight checks should run
   - what postflight checks should run
   - what extra human review is expected, if any

3. Add a lightweight operator-facing mechanism for trigger selection and visibility.

   This may be one or more of:
   - an explicit trigger-level section in `next-action.md`
   - a small command/help surface that maps trigger level to required checks
   - a closeout note in `handoff.md`
   - a minimal runbook addition describing how trigger level should be used during execution

   Prefer the smallest mechanism that makes the loop clearer in practice.

4. Make sure the integration reflects the intended model:

   - `light`
     - ordinary UI/session/feature work
     - run standard preflight/postflight integrity checks

   - `elevated`
     - packages touching `state` or `control`
     - run standard checks plus stronger focused review of changed surfaces

   - `heavy`
     - packages touching `governance` or process-silo surfaces
     - run standard checks plus stronger human/process review before accepting closeout

5. If useful, update the package template or current loop guidance so future packages naturally include or imply a trigger level.

6. Keep the implementation human-usable.
   The operator should not need to reconstruct trigger rules manually from several docs.

7. If command help or output is updated, keep it concise.
   The goal is:
   - easy to understand
   - easy to run
   - hard to misuse

8. Update only the smallest necessary docs so the system’s real operational surface reflects the trigger model.

CONTENT REQUIREMENTS

The applied loop behavior should clearly answer:

- Where does the trigger level show up during live work?
- How does the operator know what to run before execution?
- How does the operator know what to run before closeout?
- What additional expectations apply to elevated or heavy packages?
- How does the system stay lightweight for ordinary feature work?

It should also make clear that:

- trigger levels guide validation intensity, not bureaucracy
- ordinary feature work should still feel fast
- heavier process/governance work should be explicit and deliberate
- the process silo remains the highest-governance zone

CONSTRAINTS

- keep the integration small
- do not build a workflow engine
- do not require a full action-plan system
- do not widen current integrity checks beyond their intended scope
- avoid forcing heavy validation onto ordinary feature work
- avoid spreading trigger logic across too many files

VERIFICATION

1. Confirm the live loop now exposes the trigger level in a practical operator-facing way.
2. Confirm an operator can tell which checks to run for a `light` package.
3. Confirm an operator can tell what extra expectations apply for `elevated` and `heavy` packages.
4. Confirm the updated guidance stays concise and does not feel like bureaucracy.
5. Confirm the implementation does not require reading multiple deep docs just to execute one package.
6. If commands or templates were updated, verify they are accurate and consistent with the trigger model.

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

`resume_electron_ui_stream_with_integrity_aware_loop`

and describe it as the stream-switch package that returns the live loop to `electron_ui` while preserving the new role-aware trigger model so ordinary UI work resumes under `light` validation by default.