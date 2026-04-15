# Package Plan

SEQUENCE GOAL:

Define the remaining small process artifacts needed to run sequential multi-package work from repo files alone.

SEQUENCE STATUS:

ACTIVE

CURRENT CURSOR:

1

DEFAULT RUN WINDOW:

3 packages maximum before pause and review.

ADVANCE GATES:

- Resume state must be `CLEAN`.
- Latest `handoff.md` must close the previous package as `PASS`.
- Required human verification for the previous package must be complete.
- No unresolved repair or failure blocker may remain.
- Package-specific dependencies and declared stop gates must be satisfied.

PLANNED PACKAGES:

1. `define_minimal_package_plan_format`
   - Status: READY
   - Depends on: `define_minimal_sequential_multi_package_protocol`
   - Stop gate: pause after this package to review the durable orchestration format.

REPAIR HANDLING:

- If a repair package interrupts the sequence, record the repair package name beside the blocked planned package and do not advance the cursor until repair closes `PASS` and repo state returns to `CLEAN`.

UPDATE RULE:

- Update this file only when package order, dependency gates, stop gates, cursor position, or repair state changes.