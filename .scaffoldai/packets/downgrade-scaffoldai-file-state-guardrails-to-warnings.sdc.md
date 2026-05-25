# SDC — Downgrade ScaffoldAI File State Guardrails To Warnings

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI operator surface, Makefile lifecycle commands, status/close/start guardrails

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Simplify ScaffoldAI by changing most file state and verification freshness guardrails from hard blockers into visible warnings, so the system supports human-directed work instead of fighting the operator.

BACKGROUND:
ScaffoldAI is intended to manage work at the simplest useful level:
- show current status
- show whether work is active
- make next-action visible
- let Copilot/Codex do the work
- run tests
- write/read handoff
- close work when the human says it is done

Recent lifecycle behavior has become too strict. Dirty git state, missing runtime files, expired verification evidence, and lifecycle artifact changes can block normal operation even when they should only inform the human. This creates complexity and interrupts flow.

The desired principle is:
ScaffoldAI reports risk; the human decides.

TASKS:
1. Audit current hard blockers in ScaffoldAI lifecycle/status/close/start paths.

Identify where the system hard-blocks on:
- dirty git workspace
- unstaged files
- lifecycle artifact changes
- missing gitignored runtime files
- expired verification evidence
- stale verify evidence
- runtime ownership/session state

2. Reclassify non-corrupting conditions as warnings.

These should warn, not block:
- dirty git workspace
- unstaged files
- lifecycle artifact changes
- missing optional runtime files
- expired/stale verification evidence
- mounted-but-not-started ambiguity
- missing active runtime/session files when next-action exists

3. Keep hard blockers only for conditions that would corrupt the simple workflow.

Hard blockers should be limited to cases such as:
- invalid SDC cannot become next-action
- cannot start new work while next-action/active work exists
- cannot close when no next-action/active work exists
- cannot close when handoff is missing, unless explicit cancel/abandon path is used
- cannot overwrite active next-action without explicit cancel/close

4. Preserve visibility.

Warnings must still be clear and visible in command output. Do not hide risks. Reword output from BLOCKED/REFUSED to WARNING/CAUTION where the human may proceed.

5. Clarify operator philosophy in help/status text.

Update human-facing text to reflect:
- ScaffoldAI is a visibility and coordination layer, not an enforcement engine
- warnings inform the human
- only workflow-corrupting actions are hard-blocked

6. Keep Makefile as the normal operator surface.

The intended daily commands remain:
- make scaffold-status
- make scaffold-start
- make verify-full
- make scaffold-close

Existing lower-level commands may remain as compatibility/internal commands.

7. Do not expand MCP authority.

MCP submit remains inbox-only. MCP read/status tools remain observation tools. Do not add autonomous execution, activation, closeout, cleanup, or commit authority to MCP.

8. Update tests.

Adjust tests so conditions that are now warnings no longer fail command flows. Add or update tests confirming true hard blockers still block corrupting workflow transitions.

VERIFY:
Run:
- make verify-scaffold
- make verify-full

OUTPUT:
Return:
1. files changed
2. list of guardrails changed from blockers to warnings
3. list of remaining hard blockers
4. updated operator behavior for status/start/close
5. test updates made
6. verification result
7. confirmation MCP authority did not expand

CONSTRAINTS:
- no ScaffoldAI architecture rewrite
- no new lifecycle machine
- no future-placeholder workflow expansion
- no autonomous execution
- no MCP activation authority
- no MCP closeout authority
- no MCP commit authority
- preserve next-action/handoff as the center of the workflow
- human-controlled execution only
- human-controlled commits only
- keep output concise and operator-focused
