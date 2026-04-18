# Agent Routing Policy

This is the current working guideline for deciding when to run agent checks in the package loop.

## Purpose

Routing guidance exists to:

- reduce unnecessary ceremony
- keep agent use consistent
- focus checks where they add the most value

This is guidance, not a hard rule.

## Run The Integrity Agent

`consync-integrity-agent` is most useful when a package:

- changes features or behavior
- adds or changes tests
- affects user-facing output
- may cause code, tests, docs, or state to drift

## Run The Process Agent

`consync-process-agent` is most useful when a package:

- is a process package
- changes stream, state, or process docs
- touches `handoff.md`, `next-action.md`, stream status, or loop docs
- is likely to create formatting or alignment drift

## Run Both Agents

Run both agents when a package:

- is larger than usual
- changes a multi-step workflow
- affects both product behavior and process behavior
- would benefit from extra redundancy before handoff

## Run Neither Agent

Usually skip both agents when a package is:

- a tiny typo-only fix
- a trivial low-risk edit
- an extremely narrow change with obvious verification

## Human Override

Use judgment.

- the user may run either agent whenever extra confidence is helpful
- using more checks is reasonable when mentally fatigued, sick, or otherwise more error-prone
- if the package feels ambiguous, a small extra check is usually better than guessing

## Future Note

Routing may later be embedded into SDC or lightweight automation.

For now, it stays manual, lightweight, and judgment-based.