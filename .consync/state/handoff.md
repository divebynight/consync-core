TYPE: PROCESS
PACKAGE: add_integrity_agent_step_to_execution_pattern

STATUS

PASS

SUMMARY

Embedded the integrity agent into the documented execution pattern as a standard optional step that happens after verification.

The updated loop doc now explains the exact manual step: copy the reusable prompt from `.consync/prompts/run_integrity_agent.md`, fill in `TYPE` and `PACKAGE`, and run it with `consync-integrity-agent`. It also makes the current flow explicit as `implementation -> tests -> verify -> integrity agent -> handoff -> commit`, while preserving the step as optional and recommending it mainly for feature, test, and behavior changes. A small note was added in the stream operating model so the step fits naturally into the broader process language.

No automation, agent behavior changes, stream changes, or orchestration logic were added.

FILES CREATED

- none

FILES MODIFIED

- `.consync/docs/integrity-agent-loop.md` — adds the standard optional integrity-agent step, its explicit placement in the flow, and when it is recommended.
- `.consync/docs/stream-operating-model.md` — adds a small note that the manual loop may include an integrity-agent step after verification when extra confidence is useful.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-operating-model.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md` and confirm the standard optional step is clearly defined.
2. Confirm the loop doc explicitly references `.consync/prompts/run_integrity_agent.md` and places the step after verification.
3. Confirm the flow reads clearly as `implementation -> tests -> verify -> integrity agent -> handoff -> commit`.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/stream-operating-model.md` and confirm the supporting note fits naturally without broadening the doc.
5. Confirm the step remains optional and lightweight rather than mandatory or automated.
6. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case that this package only updates the expected docs and the live handoff. If wider repo changes appear, treat them as unrelated existing work unless they conflict with these files.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated execution path was added because this package only standardizes a manual process step.
- Confirmed the loop doc now includes the integrity-agent step, its prompt reference, and its explicit placement after verification.
- Confirmed the supporting stream-operating-model update remains small and does not turn the step into a required part of every package.
- Validated that the process remains manual, optional, and recommended mainly for feature, test, and behavior changes.

NOTES

- Kept this integration step intentionally lightweight so it standardizes the workflow without turning the integrity agent into an automated gate.
- The main scope guard was to define a recognizable optional step, not to require the agent for every package or change the execution system.