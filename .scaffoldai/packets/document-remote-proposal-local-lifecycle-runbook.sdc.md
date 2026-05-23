# SDC — Document Remote Proposal Local Lifecycle Runbook

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI documentation, runbook, and verification coverage audit

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Create a clear ScaffoldAI runbook and final coverage checkpoint for the completed HTTPS MCP SDC submit phase.

This packet is documentation and verification-audit work only. It should not add new MCP authority, lifecycle authority, execution authority, cleanup authority, or git authority.

BACKGROUND:
The system now supports a bounded remote proposal flow where ChatGPT can submit intake-compatible SDC candidates through the HTTPS operator MCP. Local/manual lifecycle commands still own intake, activation, verification, commit, closeout, cleanup, and idle recovery.

The phase also added operator convenience wrappers, Makefile-facing workflow commands, packet-bound verification evidence, and verification-gated close-feature behavior.

This work happened on `feature/diagram-function-reorg`. That is acceptable, but the phase boundary should be documented before returning to the larger reorg/refactor.

TASKS:
1. Add a Remote Proposal Local Lifecycle runbook.

Document:
- purpose of the runbook
- observer HTTPS surface versus operator HTTPS surface
- submit-only remote proposal boundary
- local/manual lifecycle boundary
- canonical SDC candidate expectations
- local intake/start workflow
- verification workflow
- commit workflow
- close-feature workflow
- cleanup and idle confirmation workflow

2. Document the Makefile as the human operator surface.

Include the intended operator workflow commands:
- `make scaffold-status`
- `make scaffold-start`
- `make verify-scaffold`
- `make scaffold-close`

Clarify that Makefile targets are ergonomic wrappers over npm/node/CLI primitives and do not expand authority.

3. Document the process/product boundary.

Capture the rule that ScaffoldAI process work and Consync product work should not be mixed in one active lifecycle context after the reorg boundary is enforced.

Clarify:
- ScaffoldAI is the process/orchestration platform
- Consync is the product
- `.scaffoldai/` is process state
- `.consync/` is product state

4. Add or update a coverage checklist for HTTPS SDC submit.

Confirm tests or documented verification cover:
- valid candidate submit
- invalid SDC rejection
- autonomous wording rejection
- duplicate/pending/collision rejection
- submit path does not mutate active runtime
- submit path does not mutate next-action state
- submit path does not mutate lifecycle state
- submit path does not mutate git
- observer surface cannot submit
- operator surface cannot lifecycle-mutate
- close-feature requires packet-bound verify evidence
- stale, failed, or missing verification evidence fails closed

5. Improve documentation discoverability.

Link the runbook from the relevant ScaffoldAI README or documentation index.

6. Add lightweight tests only if clear coverage gaps are found.

Do not over-expand implementation. Prefer documentation of already-covered tests when coverage exists.

VERIFY:
Run:
- `npm run verify:scaffoldai`

Also verify or document evidence for:
- runbook exists and is linked
- Makefile operator surface is documented
- authority model is documented
- process/product boundary is documented
- coverage checklist is satisfied or explicit gaps are listed
- no authority expansion occurred
- no lifecycle primitive weakening occurred

OUTPUT:
Return:
1. files changed
2. runbook location
3. documented operator workflow
4. documented authority boundaries
5. coverage checklist status
6. tests added or confirmed
7. verification result
8. remaining risks/gaps

CONSTRAINTS:
- no MCP lifecycle authority expansion
- no remote execution authority
- no remote cleanup authority
- no git authority
- no autonomous execution behavior
- no weakening of lifecycle primitives
- no bypass of verification requirements
- no bypass of cleanup requirements
- preserve deterministic lifecycle ordering
- preserve packet identity coherence
- preserve fail-closed behavior
- preserve human-controlled commits
- preserve Consync and ScaffoldAI separation
