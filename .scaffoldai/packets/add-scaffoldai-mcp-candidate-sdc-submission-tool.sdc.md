# SDC — Add ScaffoldAI MCP Candidate SDC Submission Tool

MODE: PROCESS_REFACTOR
EXECUTION SURFACE: ScaffoldAI MCP tool surface, candidate SDC inbox submission, intake validation reuse, bounded write authority, and fixture-isolated MCP tests

APPROVAL:
  execute: PENDING
  commit: PENDING

GOAL:
Add a bounded MCP tool that allows agents to submit candidate SDC packets into `.scaffoldai/inbox/` without activating, claiming, executing, committing, or cleaning up work.

The goal is to reduce manual packet-authoring friction while preserving the ScaffoldAI authority model.

BACKGROUND:
ScaffoldAI has recently hardened:
- canonical SDC packet schema
- packet intake validation
- lifecycle transition contracts
- forbidden transition tests
- cleanup safety preconditions
- active packet replacement guards
- packet identity coherence

The current manual workflow is:
- user and ChatGPT plan work
- ChatGPT generates SDC text
- user manually saves SDC into `.scaffoldai/inbox/`
- user runs packet intake
- user activates accepted packet
- Copilot claims and executes
- user verifies, commits, closes out, and cleans up

The next low-risk authority expansion is:
- MCP candidate submission only

This tool must write only candidate packet files to the inbox and must never activate or execute them.

TASKS:
1. Review current MCP tool authority model.

Review:
- ScaffoldAI MCP tool registration
- readonly MCP tools
- MCP boundary/reference contracts
- packet intake validator
- canonical SDC template/contract
- packet identity coherence contract
- existing MCP readonly tests

Confirm current MCP tools remain readonly except for the new explicitly bounded candidate-submission tool.

2. Define candidate submission authority.

Define the new authority class as candidate submission only.

The tool may:
- accept SDC packet content
- optionally accept a suggested filename or label
- write a `.sdc.md` candidate into `.scaffoldai/inbox/`
- run or reuse validation in candidate/intake-compatible mode
- return candidate path, validation result, normalized packet identity if available, and next-safe-action

The tool must not:
- activate packets
- claim packets
- execute work
- emit completion signals
- close out work
- clean workspace
- commit changes
- write outside `.scaffoldai/inbox/`
- overwrite existing files silently
- bypass intake validation

3. Implement MCP submission tool.

Add a tool such as:
- `scaffoldai_submit_sdc_candidate`

Inputs should be minimal and explicit, likely:
- `content`
- optional `suggestedFileName`
- optional `submittedBy`

Behavior:
- validate content is non-empty
- ensure content appears to be an SDC packet
- derive or sanitize filename safely if no filename is provided
- enforce `.sdc.md` suffix
- prevent path traversal
- prevent overwrite unless an explicit safe behavior already exists
- write only to `.scaffoldai/inbox/`
- run validation or dry-run intake if supported
- return structured result

4. Preserve intake and activation boundaries.

Ensure submitted candidates still require normal intake.

The tool response should clearly state:
- candidate submitted
- validation status if checked
- not accepted unless intake has accepted it
- not active
- not claimed
- next safe command for human/operator

Do not convert candidate submission into activation.

5. Add tests for bounded write behavior.

Add fixture-isolated tests covering:
- valid SDC candidate writes to inbox
- invalid/empty content rejected
- filename sanitization
- path traversal rejection
- overwrite prevention
- write outside inbox impossible
- submitted candidate does not activate packet
- submitted candidate does not claim packet
- submitted candidate does not mutate active runtime state
- readonly MCP tools remain non-mutating
- validation result is reported consistently

6. Update MCP boundary documentation.

Document:
- candidate-submission authority
- how it differs from readonly observation
- why it is not execution authority
- required human/operator follow-up
- relationship to inbox/intake/activation lifecycle

Suggested locations:
- `.scaffoldai/contracts/`
- `.scaffoldai/reference/`
- MCP boundary docs
- tool README if present

7. Update visibility or status notes if useful.

If appropriate, ensure candidate submission output aligns with existing packet identity vocabulary:
- source filename
- candidate path
- packet title
- normalized slug
- validation status
- next-safe-action

Do not introduce full packet UID or lineage migration in this packet.

8. Recommend next hardening packet.

Recommend the next packet after this work.

Likely candidates include:
- stable packet UID and lineage
- activation aliases and latest-accepted activation
- safe_idle formalization
- property-based lifecycle simulation
- MCP candidate submission hardening
- prompt intake compiler/planner

VERIFY:
Run:
- `npm run verify:scaffoldai`

OUTPUT:
Return:
1. files changed
2. MCP candidate submission tool summary
3. authority boundaries enforced
4. validation/intake behavior summary
5. tests added or updated
6. documentation updated
7. remaining MCP submission risks
8. recommended next hardening packet
9. verification result

CONSTRAINTS:
- candidate submission only
- no packet activation
- no packet claiming
- no packet execution
- no completion signaling
- no closeout authority
- no cleanup authority
- no commit authority
- no write outside `.scaffoldai/inbox/`
- no silent overwrite of candidate files
- no weakening lifecycle authority boundaries
- no Consync product/runtime modification
- no deletion of durable packet artifacts
- no deletion of append-only logs
- no property-based/randomized testing in this packet
- human-controlled commits only
