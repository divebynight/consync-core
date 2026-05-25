# SDC — Apply Copilot Runner Capability Boundaries To ScaffoldAI

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI operator surface, MCP coordination layer, Copilot CLI runner wrappers

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Apply the executor capability-boundary model proven in the external POC to ScaffoldAI, so planning/discussion and working execution are separated by runner permissions instead of prompt wording or lifecycle over-enforcement.

BACKGROUND:
The external scaffoldai-executor-poc demonstrated that Copilot CLI can be invoked with different capability boundaries:

DISCUSS / PLAN runner:
- uses plan mode
- denies write tools
- denies shell tools
- can inspect and answer
- cannot modify files

WORK runner:
- runs in a controlled working directory or sandbox
- allows write tools
- can execute approved next-action work
- can remain restricted from dangerous shell access

This changes the ScaffoldAI direction. ScaffoldAI no longer needs to simulate safety through excessive git-state policing or complex lifecycle inference. It should become a simple artifact protocol plus explicit phase-specific runner wrappers.

TASKS:
1. Document the new ScaffoldAI capability model.

Define the core principle:
Mode is not a prompt. Mode is the runner capability boundary.

Document:
- COORDINATOR proposes/reviews through MCP
- OPERATOR approves critical transitions through CLI
- EXECUTOR runs through bounded runner wrappers
- DISCUSS runner is read-only/no-shell
- WORK runner is writable only in the approved work surface

2. Add minimal ScaffoldAI runner wrapper commands.

Add or stub commands for:
- make scaffold-discuss
- make scaffold-work

These commands should be thin wrappers only.

For this packet, scaffold-discuss should be implemented first if possible:
- read an approved discussion/question artifact if one exists, or print a clear message if missing
- invoke Copilot CLI in plan/read-only mode
- deny write tools
- deny shell tools
- disable builtin MCPs unless explicitly needed
- write output to a bounded discussion/answer or handoff-style artifact
- never modify source files

scaffold-work may be a documented/stubbed wrapper if full implementation would require more design.

3. Keep next-action/handoff as the core workflow.

Do not replace the simple loop:
proposal.sdc -> next-action -> handoff -> history

Do not add a large new lifecycle system.

4. Make discussion non-executable.

Discussion artifacts may be read by a read-only runner, but they are not executable contracts.
Only approved next-action authorizes work execution.

5. Update operator help text.

The help output should make the distinction visible:
- scaffold-discuss: read-only planning/question runner
- scaffold-work: execute approved next-action through bounded runner

6. Preserve MCP authority boundaries.

MCP may submit/read artifacts and observe state.
MCP must not gain autonomous activation, closeout, commit, or unrestricted execution authority in this packet.

7. Keep implementation minimal.

Prefer:
- small wrapper script or npm script
- Makefile alias
- concise documentation
- tests for command presence / safety expectations where practical

Avoid:
- new lifecycle machine
- broad refactor
- hidden orchestration
- automatic unattended coding beyond approved next-action

VERIFY:
Run:
- make verify-scaffold
- make verify-full

OUTPUT:
Return:
1. files changed
2. final terminology for DISCUSS runner and WORK runner
3. implemented command behavior
4. any stubbed/deferred behavior
5. confirmation scaffold-discuss cannot write source files
6. confirmation MCP authority did not expand
7. verification result

CONSTRAINTS:
- no architecture rewrite
- no autonomous execution without approved next-action
- no MCP activation authority
- no MCP closeout authority
- no MCP commit authority
- no source writes from discussion mode
- no shell access from discussion mode
- keep next-action and handoff as the primary workflow artifacts
- human-controlled commits only
- keep output concise and operator-focused
