# SDC — Add Local Stdio MCP Verify Runner

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI local MCP verification surface

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Move verification execution behind a bounded local stdio MCP tool so Copilot can verify through ScaffoldAI instead of running raw terminal commands directly.

BACKGROUND:
Current loop:
- human creates/intakes/activates packet through CLI
- Copilot claims and executes work
- Copilot currently runs verification through normal terminal access
- Copilot emits packet completion handshake
- ChatGPT observes completion/readiness over readonly HTTPS MCP
- human runs CLI closeout

The next hardening step is to make verification MCP-mediated on the trusted local stdio surface.

TASKS:
1. Add local stdio MCP verify tool.

Suggested tool:
- `scaffoldai_verify_run`

2. Tool behavior:
- runs only allowlisted verification commands
- default command should be the current ScaffoldAI verify command:
  - `npm run verify:scaffoldai`
- no arbitrary shell strings
- no user-supplied command execution
- timeout enforced
- output bounded/truncated
- returns structured result

3. Suggested output:
- command
- status: passed | failed | error | timeout
- exit_code
- duration_ms
- stdout_tail
- stderr_tail
- timestamp
- execution_class: LOCAL_VERIFY_RUNNER

4. Authority constraints:
- local stdio MCP only
- do not expose verify runner on HTTPS readonly MCP
- do not add arbitrary shell execution
- do not mutate authoritative state
- do not commit, stage, push, or closeout
- do not modify packets

5. Completion handshake integration:
- either document that Copilot should call `scaffoldai_verify_run` before `packet_completed`
- or optionally include verify result fields in the recommended `packet_completed` signal flow

6. Update docs/contracts:
- local stdio MCP may run bounded verification
- HTTPS MCP remains readonly
- verify runner is not a general shell
- human/CLI remains closeout authority

7. Add tests:
- verify runner executes allowlisted verify command
- unknown command rejected
- output is bounded
- timeout behavior covered if practical
- HTTPS readonly tool list does not include verify runner
- stdio tool list includes verify runner
- no authoritative write authority added
- verify remains green

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. new local MCP verify tool
3. allowed command model
4. output structure
5. timeout/bounding behavior
6. verification result
7. confirmation HTTPS MCP remains readonly and no arbitrary shell was added

CONSTRAINTS:
- local stdio MCP only
- no HTTPS write or execution tool
- no arbitrary shell
- no autonomous execution
- no packet mutation
- no closeout authority
- no Consync product/runtime behavior changes
- no commits
