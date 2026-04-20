TYPE: PROCESS
PACKAGE: scope_integrity_check_triggers_by_artifact_role_and_stream

GOAL

Define when light versus heavy integrity checks should run based on artifact role, stream type, and whether process/governance surfaces were touched, so Consync can apply strong validation where risk is highest without burdening ordinary feature work.

WHY

The system now has:
- core state contracts
- preflight and postflight integrity checks
- stream-local integrity checks
- an artifact-role model
- validation tiers by role

What is still missing is trigger logic.

Without trigger rules, the system cannot answer:
- when the lightweight checks are enough
- when heavier process-oriented validation should run
- whether stream type changes baseline expectations
- whether touching governance/process/state surfaces should escalate validation

Consync should not validate everything equally on every package. It should use role-aware, stream-aware trigger rules so validation intensity follows operational risk.

SCOPE

Keep this package definition-focused.

Expected outcome:
- one new doc defines integrity-check trigger rules
- the trigger model distinguishes light and heavy checks
- the trigger model uses artifact role and stream type
- the trigger model explicitly treats process/governance work as higher-risk than ordinary UI/session work
- the trigger model stays small enough to apply during real operation

Do not:
- implement new validators in this package
- redesign the existing check commands
- create a scheduler or workflow engine
- introduce file permissions or security controls
- classify every file in the repo exhaustively
- mix this with UI work

WORK INSTRUCTIONS

1. Create a new doc, preferably at:

   `.consync/docs/integrity-trigger-model.md`

2. In that doc, define the purpose of trigger scoping:
   - not all packages need the same validation depth
   - validation should scale with risk
   - process/governance changes should trigger stronger checks than ordinary feature work

3. Define at least three trigger levels.
   Keep them simple and operational.

   Suggested shape:
   - `light`
     - basic smoke/contract checks over the current live loop
   - `elevated`
     - light checks plus stronger review of touched state/control surfaces
   - `heavy`
     - full process-silo validation expectations, especially when governance/process artifacts are touched

4. Define what should trigger each level.

   At minimum, specify rules based on:

   - artifact role touched
     - `state`
     - `control`
     - `governance`
     - `reference`
     - `history`

   - stream type
     - `process`
     - `electron_ui`
     - other future streams

   - package character
     - ordinary feature work
     - stream switch
     - governance/process-model change
     - bootstrap/re-entry change
     - integrity-check change

5. Make explicit that:
   - ordinary UI/session feature work should usually run light checks
   - packages that touch `state` or `control` may require elevated checks
   - packages that touch `governance` or process-silo surfaces should default to heavy checks
   - process stream packages are not automatically heavy, but they are more likely to cross into heavy territory
   - touching governance/process surfaces from a non-process stream should be unusual and should escalate validation expectations

6. Define what each trigger level should require.

   For example:

   - `light`
     - run current preflight/postflight checks
     - confirm no obvious contradictions
     - accept narrow closeout

   - `elevated`
     - run current checks
     - verify touched artifacts are in expected zones of influence
     - confirm no unintended cross-role drift

   - `heavy`
     - run current checks
     - perform focused human review of governance/process/state implications
     - confirm role/contract alignment
     - confirm process silo truth remains coherent after the change

7. Add a small decision table or matrix that makes trigger selection easy.
   Keep it compact and human-usable.

8. Add a short section on override behavior.

   For example:
   - if a package appears light but actually modifies governance/state/process artifacts, treat it as elevated or heavy
   - if state contradiction is found, reconciliation takes priority over normal trigger selection
   - if uncertainty is high, prefer the stronger trigger level

9. Add one or two minimal pointers from existing governance docs if useful, such as:
   - `artifact-role-model.md`
   - `runbook.md`
   - `doc-integrity-layer.md`

   Keep the pointers small.

CONTENT REQUIREMENTS

The trigger-model doc should clearly answer:

- What validation levels exist?
- What causes a package to run at each level?
- How do artifact role and stream type affect validation expectations?
- Why is process/governance work treated more carefully?
- Why should ordinary feature work remain lighter?
- What happens when a package crosses expected boundaries?

It should also state explicitly that:

- validation intensity should follow risk, not file format
- the process silo is the highest-governance zone
- non-process streams should not casually rewrite governance/process surfaces
- trigger rules are meant to preserve flow, not create bureaucracy

CONSTRAINTS

- keep the model compact
- no implementation of new commands in this package
- no broad refactor of existing checks
- no file-permission or “security theater” language
- no repo-wide classification migration
- avoid making every package feel heavy

VERIFICATION

1. Read the new trigger-model doc end to end and confirm it is easy to explain and easy to use.
2. Confirm the three validation levels are distinct and practical.
3. Confirm ordinary UI/session work remains light by default.
4. Confirm process/governance/state-touching work escalates validation appropriately.
5. Confirm the model does not imply that every process-stream package is automatically heavy.
6. If pointers were added, confirm they are minimal and accurate.

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

`apply_integrity_trigger_model_to_live_loop_commands_and_closeout`

and describe it as the next narrow package that wires the defined trigger levels into the practical loop, so operators know which checks to run during ordinary feature work versus process/governance changes.