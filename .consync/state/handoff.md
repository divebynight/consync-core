TYPE: PROCESS
PACKAGE: define_integrity_agent_in_package_loop

STATUS

PASS

SUMMARY

Defined the minimal manual process for using `consync-integrity-agent` inside the package loop.

The new doc explains the integrity agent's purpose, when it is worth running, what inputs it should use, the expected output shape, where it fits in the current loop, how to handle `PASS | WARNING | FAIL`, and that this remains a manual step for now. Supporting updates stayed light: one pointer in `current-system.md` and one short note in the agent introduction strategy doc.

No automation, agent execution logic, stream changes, or package-loop rewrites were added.

FILES CREATED

- `.consync/docs/integrity-agent-loop.md` — defines how the report-only integrity agent fits into the current manual package loop.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a short pointer to the integrity-agent loop doc alongside the other process references.
- `.consync/docs/agent-introduction-strategy.md` — adds a short note pointing to the package-loop integration doc for the integrity agent.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '60,100p' .consync/docs/current-system.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '35,70p' .consync/docs/agent-introduction-strategy.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md` and confirm the doc exists.
2. Confirm the guidance is practical: it should clearly define purpose, when to run the agent, expected inputs and outputs, where it fits in the loop, and how to handle `PASS | WARNING | FAIL`.
3. Confirm the doc clearly places the integrity agent after implementation and verification, and before final confidence or next-step planning.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '60,100p' .consync/docs/current-system.md` and `sed -n '35,70p' .consync/docs/agent-introduction-strategy.md` and confirm the supporting updates are small and coherent.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case that this package only adds the new loop doc, the two light doc pointers, and the updated handoff. If wider repo changes appear, treat them as unrelated existing work unless they conflict with these files.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated execution path was added because this package defines a manual process step, not automation.
- Confirmed the new doc is easy to find under `.consync/docs/` and stays aligned with the earlier agent introduction strategy.
- Validated that the integrity agent is positioned after implementation and verification, and before final advancement decisions.
- Validated that the process remains explicitly manual for now and does not imply forced agent use on every package.

NOTES

- Kept the process step intentionally lightweight and manual so it clarifies the workflow without turning the integrity agent into an automated gate.
- The main scope guard was to define where the agent fits in the current loop without changing streams, orchestration, or package execution behavior.