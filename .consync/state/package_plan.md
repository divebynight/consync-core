# Package Plan

SEQUENCE GOAL:

Define the remaining small process artifacts needed to run sequential multi-package work from repo files alone.

SEQUENCE STATUS:

ACTIVE

CURRENT CURSOR:

2

NEXT PACKAGE:

`define_manual_sequence_advancement_procedure`

DEFAULT RUN WINDOW:

3 packages maximum before pause and review.

PLAN OWNER:

The active operator updates this file during package closeout.

UPDATE TRIGGERS:

- Update this file when package order changes.
- Update this file when the current cursor moves.
- Update this file when a package changes status.
- Update this file when dependency gates, stop gates, or repair state changes.

ADVANCE GATES:

- Resume state must be `CLEAN`.
- Latest `handoff.md` must close the previous package as `PASS`.
- Required human verification for the previous package must be complete.
- No unresolved repair or failure blocker may remain.
- Package-specific dependencies and declared stop gates must be satisfied.

PAUSE CONDITIONS:

- Pause on `FAIL`.
- Pause when required human verification is incomplete.
- Pause when repo state is not reconciled.
- Pause when a repair package is required.
- Pause when the run window limit is reached.
- Pause when a package-specific stop gate says to stop.

PLANNED PACKAGES:

1. `define_minimal_package_plan_format`
   - Status: PASS
   - Depends on: `define_minimal_sequential_multi_package_protocol`
   - Stop gate: none
   - Human verification: complete before cursor advances
   - Notes: package plan format is now defined in this file.

2. `define_manual_sequence_advancement_procedure`
   - Status: READY
   - Depends on: `define_minimal_package_plan_format`
   - Stop gate: pause after this package to review the manual advancement checklist.
   - Human verification: required
   - Notes: should define how the operator selects, runs, and advances the next package from repo files alone.

REPAIR HANDLING:

- If a repair package interrupts the sequence, add a short note under the blocked planned package with the repair package name and set sequence status to `PAUSED_REPAIR`.
- Do not advance the cursor while repair is active.
- After the repair package closes `PASS` and repo state returns to `CLEAN`, restore sequence status to `ACTIVE` and keep the cursor on the first blocked planned package.

FAIL UPDATE RULE:

- If a planned package closes `FAIL`, set that package status to `FAIL`, set sequence status to `PAUSED_FAIL`, and do not point `NEXT PACKAGE` at a new normal package until a repair or human decision is recorded.

PASS UPDATE RULE:

- If a planned package closes `PASS`, mark it `PASS`, move the cursor to the next eligible package, and update `NEXT PACKAGE` only if all advance gates are satisfied.

FORMAT RULE:

- Keep this file as a small operator-readable status document, not a backlog, tracker, or workflow engine.