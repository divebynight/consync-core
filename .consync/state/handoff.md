TYPE: PROCESS
PACKAGE: add_reusable_integrity_agent_prompt

STATUS

PASS

SUMMARY

Added a reusable, repo-local prompt template for running `consync-integrity-agent` without rebuilding the prompt by hand each time.

The new prompt is generic, keeps `TYPE` and `PACKAGE` as placeholders, guides the agent through change surface, test coverage, behavioral risk, doc and state alignment, and process integrity, and enforces the expected structured output. One light pointer was added in the integrity-agent loop doc so the template is easy to discover.

No agent behavior, automation, stream structure, or orchestration logic was changed.

FILES CREATED

- `.consync/prompts/run_integrity_agent.md` — provides a reusable prompt template for running `consync-integrity-agent` against the most recent package.

FILES MODIFIED

- `.consync/docs/integrity-agent-loop.md` — adds a short note pointing to the reusable integrity-agent prompt template.
- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/prompts/run_integrity_agent.md`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md`

HUMAN VERIFICATION

1. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/prompts/run_integrity_agent.md` and confirm the prompt file exists.
2. Confirm the prompt is reusable: it should include the usage note, `TYPE: <TYPE>`, `PACKAGE: <PACKAGE>`, the five evaluation areas, and the structured `STATUS / FINDINGS / RISKS / SUGGESTED IMPROVEMENTS` output.
3. Confirm the prompt is easy to copy into Copilot Chat without missing instructions or package-specific residue.
4. Run `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .consync/docs/integrity-agent-loop.md` and confirm the new note points to the reusable prompt template.
5. Run `cd /Users/markhughes/Projects/consync-core && git status --short` and confirm the success case that this package only adds the reusable prompt, the light pointer update, and the updated handoff. If wider repo changes appear, treat them as unrelated existing work unless they conflict with these files.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated execution path was added because this package only creates a reusable prompt template.
- Confirmed the new prompt file exists under `.consync/prompts/` and is generic rather than tied to a single package.
- Validated that the prompt preserves the same evaluation areas and structured output used in recent integrity-agent runs.
- Validated that the supporting update stays light and only improves discoverability from the integrity-agent loop doc.

NOTES

- Kept the prompt intentionally small and reusable so it removes friction without adding a prompt framework or changing agent behavior.
- The main scope guard was to standardize the manual prompt shape, not to automate integrity-agent execution.