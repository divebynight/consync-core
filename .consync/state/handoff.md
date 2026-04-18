TYPE: PROCESS
PACKAGE: add_process_agent_step_to_execution_pattern

STATUS

PASS

SUMMARY

Extended the package-loop guidance so the process agent is now documented as a standard optional step after the integrity step.

The loop doc now states that `consync-process-agent` may be run after `consync-integrity-agent`, and that its structured output should be appended to `handoff.md` under `PROCESS CHECK`. The documented order is now implementation → tests → verify → integrity agent → process agent → handoff → commit.

The workflow remains manual and simple. The process-agent step is optional, but recommended for process changes, multi-step workflows, and packages that touch docs or streams.

FILES CREATED

- none

FILES MODIFIED

- `.consync/docs/integrity-agent-loop.md` — adds the optional process-agent step after the integrity step, defines `PROCESS CHECK` placement, and updates the standard loop order.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Open `.consync/docs/integrity-agent-loop.md` and confirm the loop now includes an optional process-agent step after the integrity step.
2. Confirm the documented order reads: implementation → tests → verify → integrity agent → process agent → handoff → commit.
3. Confirm the doc explicitly says process-agent output should be appended to `handoff.md` under `PROCESS CHECK`.
4. Confirm the process-agent step is described as optional, with recommendations for process changes, multi-step workflows, and packages touching docs or streams.
5. If the new step is unclear, placed in the wrong order, or makes the loop feel automated or overcomplicated, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test exists for package-loop documentation changes.
- Confirmed the loop doc now places the optional process-agent step after the integrity step and before final handoff.
- Confirmed the output location is explicitly named as `PROCESS CHECK` and the required structured output remains `STATUS`, `FINDINGS`, `RISKS`, and `SUGGESTED IMPROVEMENTS`.
- Validated the change stayed narrow: one loop doc update only, with no agent behavior, orchestration logic, or unrelated process changes introduced.

NOTES

- Kept the change limited to extending the documented manual loop rather than adding new automation.
- Mirrored the integrity-step pattern so the process-agent step fits the existing workflow instead of introducing a separate path.

NOTES

- Kept this change limited to output quality so it improves signal without changing logic.
- The main scope guard was to remove noise, not to reduce accuracy or alter the agent’s evaluation role.