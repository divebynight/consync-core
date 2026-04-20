# Next-Action And Handoff Automation Contract

This is the current working contract for the `.consync/state/next-action.md` ↔ `.consync/state/handoff.md` loop.

It exists so future helpers can validate and support the loop without changing its judgment points.

## Current Loop Audit

Current working pattern:

1. A single package is written into `next-action.md`.
2. The package is executed through the existing prompt-driven workflow.
3. A structured handoff is written to `handoff.md`.
4. The handoff is reviewed.
5. A next package may be drafted and written back into `next-action.md`.

Deterministic parts of the loop:

- `next-action.md` holds one active package at a time
- `handoff.md` is overwritten for the current package closeout
- package identity is carried by `TYPE` and `PACKAGE`
- handoff must include the required closeout sections
- verification notes should describe what actually ran

Judgment-based parts of the loop:

- package scope and wording
- whether a package truly passes or fails
- whether warnings are acceptable for appended checks
- whether integrity agent or process agent should run
- what the next recommended package should be

## Required Next-Action Structure

`next-action.md` must include:

- `TYPE: <FEATURE|PROCESS|...>`
- `PACKAGE: <package_name>`
- one operator-facing trigger section such as `INTEGRITY TRIGGER`
- one clear goal section such as `GOAL` or `OBJECTIVE`
- explicit task instructions such as `DO`, `REQUIRED OUTCOME`, or equivalent
- explicit constraints or non-goals
- verification expectations

The trigger section must make it easy to see:

- which trigger level applies: `light`, `elevated`, or `heavy`
- what preflight check should run
- what postflight check should run
- what extra review is required, if any

`next-action.md` may also include optional fields such as:

- `MODE`
- `CONTEXT`
- `WHY`
- `NON-GOALS`
- `OUTPUT`
- `FINAL INSTRUCTION`

Automation should treat these optional fields as helpful but not required.

## Required Handoff Structure

`handoff.md` must include:

- `TYPE: <same as next-action>`
- `PACKAGE: <same as next-action>`
- `STATUS`
- `SUMMARY`
- `FILES CREATED`
- `FILES MODIFIED`
- `COMMANDS TO RUN`
- `HUMAN VERIFICATION`
- `VERIFICATION NOTES`

Package-specific sections may be added when needed, such as:

- `INTEGRITY TRIGGER APPLIED`
- `CURRENT LOOP AUDIT`
- `CONTRACT DECISIONS`
- `AUDIT OF CURRENT UI TEST SETUP`
- `CURRENT INPUT-EDIT CONTRACT`
- `CURRENT ERROR-STATE CONTRACT`
- `NEXT RECOMMENDED PACKAGE`

## Package Closeout Criteria

The minimum criteria for a valid package closeout are:

- `TYPE` and `PACKAGE` match between `next-action.md` and `handoff.md`
- `STATUS` is explicitly set for the package closeout
- required handoff sections are present
- the closeout reflects the trigger-guided verification expectations used during execution
- files created and modified are listed, even when one list is `none`
- commands to run are concrete
- human verification is step-by-step and usable by a person
- verification notes describe what was actually checked and what was observed

`NEXT RECOMMENDED PACKAGE` belongs at the end of the handoff when there is a clear follow-up worth capturing.

## Automation Boundaries

An automation helper may:

- read `next-action.md`
- validate that required sections exist
- validate that `TYPE` and `PACKAGE` match between files
- check whether required handoff sections are present
- draft a handoff shell with empty sections
- surface mismatches or missing fields
- propose a draft next package for review

An automation helper must not:

- mark a package `PASS` or `FAIL` without real execution context
- invent verification results
- rewrite package intent beyond formatting or validation support
- choose the next package autonomously without review
- skip human or model judgment where the loop still depends on it

## Validation Checklist

Use this checklist before treating the loop as automation-ready:

- `next-action.md` contains one package with `TYPE` and `PACKAGE`
- `next-action.md` exposes one trigger level with clear preflight and postflight expectations
- `next-action.md` includes actionable instructions and verification expectations
- `handoff.md` repeats the same `TYPE` and `PACKAGE`
- `handoff.md` includes all required closeout sections
- `handoff.md` states what was actually verified
- any `NEXT RECOMMENDED PACKAGE` appears as the final section
- any helper only validates or drafts and does not silently advance the loop

## Follow-Up Automation Packages

Useful follow-up packages include:

- automatically validate handoff structure
- draft `next-action.md` from the latest handoff for review
- support stream-aware package advancement
- validate appended `INTEGRITY CHECK` and `PROCESS CHECK` blocks when present

## Future Note

This contract is intentionally small.

It should support helper scripts, skills, or MCP tools later without turning the current package loop into a framework.