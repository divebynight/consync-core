TYPE: PROCESS
PACKAGE: create_consync_integrity_agent

STATUS

PASS

SUMMARY

Created the first repo-local custom Copilot agent for Consync: `consync-integrity-agent`.

The new agent is a report-only integrity checker that inspects change surface, test coverage, behavioral risk, doc and stream-state alignment, and process integrity after a package completes. Its prompt explicitly forbids file mutation and orchestration behavior, and defines a simple `PASS | WARNING | FAIL` report format.

Kept the agent minimal and safe: one file, no supporting framework, no execution logic, and no changes to streams or process flow.

FILES CREATED

- `.github/agents/consync-integrity.agent.md` — defines the first repo-local integrity checker agent with report-only scope and a fixed output format.

FILES MODIFIED

- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`
- `cd /Users/markhughes/Projects/consync-core && sed -n '1,220p' .github/agents/consync-integrity.agent.md`

HUMAN VERIFICATION

1. Confirm `.github/agents/consync-integrity.agent.md` exists.
2. Open the file and confirm the frontmatter, role, task sections, output format, and non-mutation rules match the requested structure.
3. Reload the Copilot agent list or restart the IDE.
4. Confirm `consync-integrity-agent` appears in the agent picker dropdown.
5. Select it and verify the success case that it responds to a prompt as a report-only checker. If it suggests editing files or acting as an orchestrator, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test or execution path exists for agent-picker registration in this package.
- Confirmed the requested agent file now exists at `.github/agents/consync-integrity.agent.md` and contains the specified report-only integrity-checker prompt.
- Validated that the prompt explicitly forbids code modification and orchestration behavior.
- The agent picker appearance step remains a manual IDE verification task, because this package only creates the repo-local agent file.

NOTES

- Kept scope minimal by creating exactly one repo-local agent file and no supporting framework.
- Did not add any automation, stream changes, or mutation instructions, because this first agent is intended to inspect and report only.