# SDC — Add One-Step ScaffoldAI Workspace Cleanup Command

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI housekeeping orchestration

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add a single high-level ScaffoldAI workspace cleanup command that orchestrates transient intake cleanup and runtime-state cleanup into one safe developer workflow.

BACKGROUND:
Current cleanup flow requires multiple manual housekeeping calls:
- `clean-intake-artifacts`
- `reset-runtime-state`

The commands are working correctly, but the operational workflow should now be consolidated into a single bounded cleanup entrypoint.

The system should:
- clean transient intake artifacts
- reset transient runtime state
- preserve accepted packets
- preserve append-only logs/history
- preserve contracts
- preserve implementation artifacts

TASKS:
1. Add unified cleanup command.

Suggested command:
- `scaffoldai housekeeping clean-workspace`

2. Unified cleanup behavior.

The command should orchestrate:
- intake artifact cleanup
- runtime-state reset

Equivalent flow:
- clean-intake-artifacts
- reset-runtime-state

3. Preserve durable artifacts.

Must preserve:
- `.scaffoldai/packets/`
- append-only logs
- MCP runtime history/signals
- contracts
- implementation files

4. Cleanup scope.

Should clean/reset:
- transient intake metadata
- consumed inbox candidate files
- transient runtime state
- next-action surfaces
- snapshot surfaces
- active runtime state

5. Reporting behavior.

Return structured summary:
- intake artifacts cleaned
- runtime state reset
- packets preserved
- logs preserved
- touched files
- skipped durable files
- final recommended next-safe-action

6. Safety constraints.

The command must not:
- delete accepted packets
- delete append-only logs
- delete contracts
- delete implementation files
- run verification automatically
- perform closeout
- create version-control history
- mutate MCP readonly authority

7. Update docs/contracts.

Clarify:
- unified cleanup workflow
- transient vs durable lifecycle
- expected end-of-session workflow
- developer hygiene guidance
- version-control history remains human-controlled

8. Add tests.

Include:
- clean-workspace orchestration
- packets preserved
- append-only logs preserved
- intake artifacts removed
- runtime state reset
- verify remains green

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. unified cleanup command
3. orchestration behavior
4. preserved durable artifacts
5. cleaned transient artifacts
6. verification result
7. confirmation no authority expansion occurred

CONSTRAINTS:
- no MCP write authority
- no autonomous cleanup
- no deletion of accepted packets
- no deletion of append-only logs
- no closeout authority changes
- no Consync runtime/product changes
- version-control history remains human-controlled
