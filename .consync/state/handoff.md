TYPE: PROCESS
PACKAGE: enable_integrity_agent_execution_within_sdc

STATUS

PASS

SUMMARY

Defined how SDCs may trigger the integrity agent as part of the documented package workflow without introducing automation.

The updated loop doc now explains that an SDC may instruct Copilot to run `consync-integrity-agent` using `.consync/prompts/run_integrity_agent.md` and append the result to `handoff.md` under a clear `INTEGRITY CHECK` section. It keeps the step optional, places it after verification, preserves the structured `STATUS / FINDINGS / RISKS / SUGGESTED IMPROVEMENTS` output, and makes clear that the process remains explicit and human-reviewed.

No automation framework, agent behavior change, stream change, or orchestration logic was added.

FILES CREATED

- none

FILES MODIFIED

- `.consync/docs/integrity-agent-loop.md` — adds the SDC-triggered integrity step, the handoff append rule, the required `INTEGRITY CHECK` section, and the structured output expectation.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md` and confirm the `Executing the Integrity Step in SDC` section exists.
2. Confirm the doc explicitly says SDCs may instruct Copilot to run the integrity agent using `.consync/prompts/run_integrity_agent.md`.
3. Confirm it explicitly says the result should be appended to `handoff.md` under `INTEGRITY CHECK`.
4. Confirm the structured output remains `STATUS / FINDINGS / RISKS / SUGGESTED IMPROVEMENTS` and that the step is still described as optional and human-reviewed.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case that this package only updates the loop doc and the live handoff. If wider repo changes appear, treat them as unrelated existing work unless they conflict with these files.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated execution path was added because this package only defines how SDC may trigger a manual-but-standardized agent step.
- Confirmed the loop doc now defines the SDC-triggered integrity step, the reusable prompt input, and the `handoff.md` append destination.
- Confirmed the required `INTEGRITY CHECK` section and structured output shape are explicit.
- Validated that the step remains optional, human-reviewed, and free of orchestration or automation behavior.

NOTES

- Kept this friction reduction explicit and reviewable by documenting how SDC may invoke the agent without turning it into background automation.
- The main scope guard was to define output placement and prompt reuse, not to change agent behavior or automate package advancement.