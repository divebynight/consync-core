# HTTPS Operator Submit-Only Contract

Status: ACTIVE CONTRACT

Scope:
- Observer HTTPS MCP surface: src/scaffoldai/mcp-readonly/http.js
- Operator HTTPS MCP surface: src/scaffoldai/mcp-operator/http.js

## Surface Separation

1. Observer HTTPS MCP is readonly-only.
- Allowed tools: scaffoldai_identity, scaffoldai_status, scaffoldai_packet_visibility, scaffoldai_pending_questions, scaffoldai_completion_status
- Forbidden tools: scaffoldai_submit_sdc_candidate and all lifecycle-mutating tools

2. Operator HTTPS MCP v1 is readonly + bounded submit-only.
- Allowed tools: observer readonly tool set plus scaffoldai_submit_sdc_candidate
- Forbidden tools: closeout, cleanup, claim, activation, execution, memory_write, verify_run, and any git/commit authority

## Submit Authority Boundaries

scaffoldai_submit_sdc_candidate on operator HTTPS must preserve local hardened behavior:
- 32 KB max content size
- content argument only (no path submission)
- write boundary: .scaffoldai/inbox/ only
- no intake
- no accept
- no activate
- no claim
- no execute
- no closeout
- no cleanup
- no commit
- no active runtime mutation
- no next-action mutation

## Filesystem and Lifecycle Constraints

- No operator HTTPS tool may write outside declared scope.
- No operator HTTPS tool may broaden lifecycle authority.
- No operator HTTPS tool may mutate git state.
- Candidate submission remains non-authoritative proposal creation only.
