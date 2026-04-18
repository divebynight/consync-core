# Integrity And Process Agent In Package Loop

This is the current working rule for using `consync-integrity-agent` and `consync-process-agent` in the package loop.

## Purpose

The integrity agent is a report-only checker that helps assess package integrity after implementation and verification.

The process agent is a report-only checker that helps assess package-loop and process alignment before final handoff.

## When To Run Them

Use the integrity agent when a package:

- adds or changes tests
- alters user-facing behavior
- may cause docs, code, and state to drift

It is not required for every tiny doc-only package.

Use the process agent when a package:

- changes process guidance
- affects a multi-step workflow
- touches docs, streams, or handoff structure

It is also optional, but recommended in those cases.

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
- before process review, final confidence, and next-step planning

Standard optional step:

- After verification, optionally run the integrity agent:
	- copy the prompt from `.consync/prompts/run_integrity_agent.md`
	- fill in `TYPE` and `PACKAGE`
	- run it with `consync-integrity-agent`

- After the integrity step, optionally run the process agent:
	- use `consync-process-agent`
	- append the result to `handoff.md`
	- place it under a clear section:

	`PROCESS CHECK`

### Executing the Integrity Step in SDC

SDCs may include an instruction to run the integrity agent.

When that happens, Copilot should:

- use `.consync/prompts/run_integrity_agent.md`
- execute it with `consync-integrity-agent`
- append the result to `handoff.md`

Append the result under a clear section:

`INTEGRITY CHECK`

The appended output should remain structured as:

- `STATUS: PASS | WARNING | FAIL`
- `FINDINGS`
- `RISKS`
- `SUGGESTED IMPROVEMENTS`

Current flow is:

implementation → tests → verify → integrity agent → process agent → handoff → commit

### Executing the Process Step in SDC

SDCs may also include an instruction to run the process agent.

When that happens, Copilot should:

- execute it with `consync-process-agent`
- append the result to `handoff.md`

Append the result under a clear section:

`PROCESS CHECK`

The appended output should remain structured as:

- `STATUS: PASS | WARNING | FAIL`
- `FINDINGS`
- `RISKS`
- `SUGGESTED IMPROVEMENTS`

## Handling Results

- `PASS` — package may proceed
- `WARNING` — decide whether to tighten now or note it for later
- `FAIL` — inspect before advancing

## Future Note

These are currently manual steps. They may later be embedded into the package loop or automated, but not yet.

Use `.consync/prompts/run_integrity_agent.md` when you want a reusable prompt template for running the integrity agent consistently.

Both checks remain optional.

The integrity step is recommended for feature changes, test changes, and user-facing behavior changes.

The process step is recommended for process changes, multi-step workflows, and packages touching docs or streams.

These steps may become more automated later, but the current version stays explicit, reviewable, and human-reviewed.