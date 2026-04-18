TYPE: PROCESS
PACKAGE: capture_agent_introduction_strategy

STATUS

PASS

SUMMARY

Captured the current strategy for introducing agents into Consync in one small process-facing document under `.consync/docs/`.

The new doc defines when agents should be introduced, a short maturity progression, practical early agent tasks, high-risk tasks to avoid, narrow first candidate agent roles, the initial integrity-agent idea, and how agents relate to streams and tests. Supporting updates stayed light: one pointer was added in `current-system.md` so the new reference is easy to find.

No agents, orchestration logic, stream changes, or automation behavior were added.

FILES CREATED

- `.consync/docs/agent-introduction-strategy.md` — captures when agents should be introduced, what they should handle early, what to avoid, and the first candidate roles.

FILES MODIFIED

- `.consync/docs/current-system.md` — adds a short pointer to the new agent introduction strategy doc in the current process-doc list.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/agent-introduction-strategy.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '60,95p' .consync/docs/current-system.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/agent-introduction-strategy.md` and confirm the doc exists.
2. Confirm it stays small and practical while covering the principle, maturity stages, good early tasks, tasks to avoid, first candidate agents, the integrity-agent idea, and the relationship to streams.
3. Confirm the strategy fits current Consync constraints: agents are introduced only when tasks are repeatable, verification is easy, and blast radius is small.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '60,95p' .consync/docs/current-system.md` and confirm the new agent-strategy pointer appears alongside the other process-doc references.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case that this package only adds the new strategy doc, the light pointer update, and the updated handoff. If wider repo changes appear, treat them as unrelated existing work unless they conflict with these files.

VERIFICATION NOTES

- Verification was manual and inspection-based; no code execution or automated test run was necessary for this doc-only process package.
- Confirmed the new doc sits cleanly beside the existing stream/process references under `.consync/docs/`.
- Validated that the doc stays practical by centering repeatable, verifiable, low-blast-radius work and by explicitly avoiding process-model changes, orchestration decisions, and implicit-context tasks.
- Validated that the integrity-agent idea is report-first only and does not imply new enforcement or mutation behavior.

NOTES

- Kept the strategy intentionally small and process-facing so it captures current agent introduction rules without turning into a system design document.
- The main scope guard was to describe where agents fit later without changing any current stream, execution, or orchestration behavior now.