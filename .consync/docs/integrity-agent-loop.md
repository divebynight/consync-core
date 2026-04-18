# Integrity Agent In Package Loop

This is the current working rule for using `consync-integrity-agent` in the package loop.

## Purpose

The integrity agent is a report-only checker that helps assess package integrity after implementation and verification.

## When To Run It

Use the integrity agent when a package:

- adds or changes tests
- alters user-facing behavior
- may cause docs, code, and state to drift

It is not required for every tiny doc-only package.

## Inputs

Typical inputs are:

- package handoff
- changed files
- relevant stream snapshot or handoff
- recent verification results

## Output

Expected output is:

- `STATUS: PASS | WARNING | FAIL`
- `FINDINGS`
- `RISKS`
- `SUGGESTED IMPROVEMENTS`

## Place In Loop

The integrity agent fits:

- after implementation
- after tests or verification
- before final confidence and next-step planning

## Handling Results

- `PASS` — package may proceed
- `WARNING` — decide whether to tighten now or note it for later
- `FAIL` — inspect before advancing

## Future Note

This is currently a manual step. It may later be embedded into the package loop or automated, but not yet.