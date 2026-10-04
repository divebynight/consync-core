# HTTPS Operator Bounded Capability Contract

Status: ACTIVE CONTRACT

Scope:
- Observer HTTPS MCP surface: src/scaffoldai/mcp-readonly/http.js
- Operator HTTPS MCP surface: src/scaffoldai/mcp-operator/http.js

## Surface Separation

1. Observer HTTPS MCP is readonly-only.
- Allowed tools: scaffoldai_identity, scaffoldai_status, scaffoldai_packet_visibility, scaffoldai_pending_questions, scaffoldai_completion_status
- Forbidden tools: scaffoldai_submit_sdc_candidate and all lifecycle-mutating tools

2. Operator HTTPS MCP exposes readonly observation, bounded candidate submission,
   and the existing read-only planning executor.
- Additional allowed tools: scaffoldai_submit_sdc_candidate,
  scaffoldai_executor_plan, scaffoldai_executor_plan_start,
  scaffoldai_executor_plan_status, scaffoldai_executor_plan_result.
- Forbidden tools: cleanup (including scaffoldai_executor_plan_cleanup),
  closeout, claim, activation, writable execution, memory_write, verify_run,
  next-action mutation, and any git/commit authority.
- The legacy scaffoldai_executor_plan call waits for the same bounded async job
  used by scaffoldai_executor_plan_start; it must not block the HTTP event loop.

## Authentication Status

Caller authentication and principal-based authorization are NOT implemented.
These capability/resource limits do not make the public endpoint secure.
Keep the operator stopped when not actively needed.

Future principal verification belongs before HTTP admission/session creation in
src/scaffoldai/mcp-operator/http.js. Per-tool and job-owner authorization belongs
at tool dispatch in src/scaffoldai/mcp-operator/index.js and the shared helpers.
MCP session IDs, candidate submittedBy text, and packet approval text are not
authenticated identities or grants. No permissive placeholder verifier exists.

## Submit Authority Boundaries

scaffoldai_submit_sdc_candidate on operator HTTPS must preserve local hardened behavior:
- 32 KB max content size
- 100 inbox entries maximum; refuse further submission without deleting anything
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
- Executor identifiers must be canonical server-generated UUIDv4 strings.
- Artifact access rejects path traversal, symlinked directory components,
  symlinked/hard-linked artifact files, and oversized JSON artifacts.
- A repository-local exclusive admission lock permits one planning executor.
  Once an async child starts, release requires confirmed exit and successful
  finalization. Pre-spawn failures can release admission without a child.
  Crashes/uncertain termination require local inspection; never auto-clear locks.
- At 100 retained artifact entries, new executor admission is refused.
  Evidence is not automatically deleted.
- Local cleanup may remove only eligible terminal jobs with valid identity,
  matching status/result evidence, and ordinary, recognized artifact files.
  Running or uncertain jobs are preserved;
  age alone cannot establish cancellation.
- Child permissions remain --plan, --disable-builtin-mcps, --deny-tool=write,
  --deny-tool=shell(*), with shell:false and no remote prompt/root/command input.
- Timeout/shutdown/output overflow requests SIGTERM, then SIGKILL after two
  seconds. POSIX async jobs use their own process group. Unconfirmed termination
  keeps running state and locks admission instead of reporting cancellation.
- This is not an OS sandbox against a hostile local account, escaping process
  groups, or arbitrary readable data. Windows/local legacy synchronous execution
  does not provide POSIX group termination.
