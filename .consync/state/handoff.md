TYPE: PROCESS
PACKAGE: define_next_action_handoff_automation_contract

STATUS

PASS

SUMMARY

Defined a minimal automation contract for the `next-action.md` ↔ `handoff.md` loop so future helpers can validate and support the current workflow without changing its judgment points.

The new contract document separates deterministic structure from human or model judgment, defines the required shape of both files, sets minimum package-closeout criteria, places `NEXT RECOMMENDED PACKAGE` at the end of handoff when used, and limits automation helpers to validation and drafting support rather than autonomous advancement.

Added one light pointer from the system overview and used an embedded validation checklist as the small validation surface for this package.

CURRENT LOOP AUDIT

Current loop behavior in repo practice:

- `next-action.md` carries one active package at a time
- the package is executed through the prompt-driven workflow
- `handoff.md` is overwritten for the current closeout
- `TYPE` and `PACKAGE` carry package identity across the loop
- verification notes record what was actually run or inspected

Current deterministic areas:

- single active package in `next-action.md`
- overwritten `handoff.md` per package
- required handoff closeout sections
- package identity matching between `next-action.md` and `handoff.md`

Current judgment-dependent areas:

- package wording and scope
- package PASS or FAIL decision
- when optional integrity or process checks should run
- whether a suggested next package is worth recording

CONTRACT DECISIONS

- Required `next-action.md` contract: `TYPE`, `PACKAGE`, one goal section, actionable instructions, constraints or non-goals, and verification expectations.
- Required `handoff.md` contract: `TYPE`, `PACKAGE`, `STATUS`, `SUMMARY`, `FILES CREATED`, `FILES MODIFIED`, `COMMANDS TO RUN`, `HUMAN VERIFICATION`, and `VERIFICATION NOTES`.
- `NEXT RECOMMENDED PACKAGE` belongs at the end of handoff when there is a clear follow-up.
- Automation helpers may validate structure, compare identity fields, draft shells, and surface mismatches.
- Automation helpers must not invent execution results, mark status without real context, or autonomously choose the next package.

FILES CREATED

- `.consync/docs/next-action-handoff-automation-contract.md` — defines the minimal structure, closeout criteria, automation boundaries, and embedded validation checklist for the live next-action/handoff loop.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a light pointer to the next-action/handoff automation contract doc.
- `.consync/state/handoff.md` — records this feature package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short .consync`
- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Open `.consync/docs/next-action-handoff-automation-contract.md` and confirm it defines required structure for both `next-action.md` and `handoff.md` without redesigning the loop.
2. Confirm the contract distinguishes deterministic parts of the loop from judgment-based parts.
3. Confirm the contract places `NEXT RECOMMENDED PACKAGE` at the end of handoff when used.
4. Confirm the automation-boundary section allows validation and drafting support but forbids autonomous PASS/FAIL decisions or invented results.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short .consync` and confirm the new contract doc and the light pointer update are the only process-doc changes. If the doc broadens into a larger framework or contradicts the current loop, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based.
- Confirmed the new contract doc matches the current live loop: one package in `next-action.md`, one overwritten `handoff.md`, shared `TYPE` and `PACKAGE`, and required closeout sections.
- Confirmed the embedded validation checklist provides a small validation surface without adding scripts or automation logic.
- Confirmed the only supporting change outside the new doc is a light pointer in `current-system.md`, with no contradictory process rewrites introduced.

NEXT RECOMMENDED PACKAGE

- Add a tiny checker or script that validates required `handoff.md` sections and `TYPE`/`PACKAGE` matching automatically, using this contract as the source of truth.