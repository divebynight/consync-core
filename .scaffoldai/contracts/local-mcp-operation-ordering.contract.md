# Local MCP Operation Ordering Contract

Status: Active guardrail reference for local operator MCP only.

Scope:
- Local stdio MCP server in src/scaffoldai/mcp/server.js
- No HTTPS MCP expansion
- No remote authority expansion

## Exposed Tool Inventory and Execution Class

1. scaffoldai_status: READ_ONLY
2. scaffoldai_preflight: READ_ONLY
3. scaffoldai_question: READ_ONLY
4. scaffoldai_verify_recommend: READ_ONLY
5. scaffoldai_closeout_readiness: READ_ONLY
6. scaffoldai_completion_status: READ_ONLY
7. scaffoldai_verify_run: LOCAL_VERIFY_RUNNER
8. scaffoldai_signal: LOCAL_SIGNAL_APPEND_ONLY
9. scaffoldai_submit_sdc_candidate: LOCAL_CANDIDATE_INBOX_WRITE_ONLY
10. scaffoldai_memory_write: LOCAL_SHARED_MEMORY_APPEND_ONLY
11. scaffoldai_memory_read: READ_ONLY

## Strict Ordering Model

1. Candidate proposal is append/write bounded:
- Tool: scaffoldai_submit_sdc_candidate
- Preconditions: canonical SDC markdown, content argument only, 32 KB max, safe filename, inbox present
- Allowed writes: .scaffoldai/inbox/*.sdc.md only
- Forbidden transitions: no intake, no activate, no claim, no execute, no closeout, no cleanup, no commit
- Duplicate behavior: deterministic rejection on duplicate filename or duplicate packet identity

2. Completion signaling is non-authoritative append-only:
- Tool: scaffoldai_signal
- Preconditions: bounded schema, allowed signal_type, rate limit windows, 1 KB record cap
- Allowed writes: .scaffoldai/runtime/mcp/signals.jsonl only
- Forbidden transitions: no state mutation, no lifecycle authority grants
- Duplicate behavior: duplicate window submissions are rejected by deterministic rate limit

3. Shared-memory messaging is append-only and non-authoritative:
- Tool: scaffoldai_memory_write
- Preconditions: from/to/message required, bounded lengths, known fields only
- Allowed writes: .scaffoldai/runtime/mcp/shared-memory.jsonl only
- Forbidden transitions: no packet or bridge mutation, no lifecycle authority grants
- Duplicate behavior: duplicate calls append additional records by design; does not mutate lifecycle state

4. Verify execution is bounded local runner:
- Tool: scaffoldai_verify_run
- Preconditions: allowlisted command only, bounded timeout
- Allowed effects: local subprocess execution of allowlisted verify command
- Forbidden transitions: no packet activation/claim/cleanup/closeout, no git mutation authority
- Duplicate behavior: re-running repeats verification only; no lifecycle mutation

## Cleanup and Closeout Safety Boundary

Closeout and cleanup are separate primitives.

- Closeout evidence is required before cleanup removes consumed inbox candidate artifacts.
- Cleanup preserves durable packet and append-only surfaces.
- Cleanup is idempotent on rerun and does not broaden deletion scope.

## Rejection Diagnostics Minimum

For non-read-only tools, reject paths should provide deterministic status and reason fields plus categorized rejection metadata where applicable (for example error_category, guard_errors, validation_errors).

## Prohibited Authority

All local MCP tools are prohibited from:
- git commit
- git push
- git branch/switch/checkout mutation workflows
- remote transport authority expansion
- broad directory cleanup operations
