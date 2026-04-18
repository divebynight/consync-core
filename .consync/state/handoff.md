TYPE: PROCESS
PACKAGE: create_consync_process_agent

STATUS

PASS

SUMMARY

Created the second repo-local custom Copilot agent for Consync: `consync-process-agent`.

The new agent is a report-only process-alignment checker that inspects package identity consistency, next_action and handoff alignment, foreground stream and stream-status consistency, handoff hygiene, and scope or verification drift across the package loop. Its prompt explicitly forbids file mutation, orchestration behavior, and reasoning narration, while keeping a concise structured `PASS | WARNING | FAIL` output format.

Kept the agent minimal and safe: one file, no supporting framework, no execution logic, and no changes to streams or process flow.

FILES CREATED

- `.github/agents/consync-process.agent.md` — defines the repo-local process-alignment checker agent with report-only scope and a fixed structured output format.

FILES MODIFIED

- `.consync/state/handoff.md` — records this process package result in the live handoff location.

COMMANDS TO RUN

- `cd /Users/markhughes/Projects/consync-core && git status --short`

HUMAN VERIFICATION

1. Confirm `.github/agents/consync-process.agent.md` exists.
2. Open the file and confirm the frontmatter, role, task sections, output format, and non-mutation rules are correct.
3. Reload Copilot agent list or restart the IDE.
4. Confirm `consync-process-agent` appears in the agent picker.
5. Select it and verify it responds as a report-only process checker. If it suggests editing files or acting as an orchestrator, treat that as a failure.

VERIFICATION NOTES

- Verification was manual and inspection-based; no automated test or execution path exists for agent-picker registration in this package.
- Confirmed the requested agent file now exists at `.github/agents/consync-process.agent.md` and contains the specified report-only process-alignment prompt.
- Validated that the prompt covers package identity, loop alignment, foreground-stream consistency, handoff hygiene, and scope or verification consistency.
- Validated that the prompt explicitly forbids file modification, orchestration behavior, and reasoning narration.

NOTES

- Kept scope minimal by creating exactly one repo-local agent file and no supporting framework.
- Did not add any automation, stream changes, or mutation instructions, because this agent is intended to inspect and report only.