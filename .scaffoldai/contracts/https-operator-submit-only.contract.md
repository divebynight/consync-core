# HTTPS Operator Bounded Capability Contract

Status: ACTIVE CONTRACT

Scope:
- Observer HTTPS MCP surface: src/scaffoldai/mcp-readonly/http.js
- Operator HTTPS MCP surface: src/scaffoldai/mcp-operator/http.js

## Surface Separation

1. Observer HTTPS MCP is readonly-only.
- Allowed tools: scaffoldai_identity, scaffoldai_status, scaffoldai_packet_visibility, scaffoldai_pending_questions, scaffoldai_completion_status
- Forbidden tools: scaffoldai_submit_sdc_candidate and all lifecycle-mutating tools

2. Operator HTTPS MCP requires a verified human Access principal. The initial
   remote grant is metadata:read only, allowing the five observation tools above.
- Registered but remotely denied tools: scaffoldai_submit_sdc_candidate,
  scaffoldai_executor_plan, scaffoldai_executor_plan_start,
  scaffoldai_executor_plan_status, scaffoldai_executor_plan_result.
- Forbidden tools: cleanup (including scaffoldai_executor_plan_cleanup),
  closeout, claim, activation, writable execution, memory_write, verify_run,
  next-action mutation, and any git/commit authority.
- Both planning aliases remain denied. Their existing asynchronous implementation
  is retained for a separately approved future authorization change.

## Authentication Status

The operator implements local Access assertion verification and explicit
principal-based authorization. Cloudflare policy, OAuth discovery, user linking,
opaque-token handling, and public end-to-end authentication are NOT verified by
local fixture tests. Do not declare the public endpoint secure or start it
outside a separately approved configuration/test window.

Production startup requires SCAFFOLDAI_ACCESS_ISSUER (exact HTTPS Cloudflare team
issuer), SCAFFOLDAI_ACCESS_AUD (dedicated lowercase 64-hex application AUD), and
SCAFFOLDAI_ACCESS_SUBJECTS (JSON array of 1-16 unique approved user subjects).
Missing/invalid configuration fails before listening. No real identifiers belong
in Git. There is no authentication-disable flag or environment capability grant.

The verifier pins RS256, issuer, audience, application-token type and approved
human subject; validates exp, iat and nbf; and rejects service-token identities.
JWKS uses only the configured team /cdn-cgi/access/certs endpoint, with a 3-second
retrieval deadline, 64 KiB body limit, 30-second refresh cooldown including
failures, coalesced requests, and a 10-minute key cache. Redirects are rejected.
Assertions are limited to 8192 characters. Verification errors never echo tokens.

Authentication is inside the HTTP resource budget and precedes body processing,
session creation, and SDK dispatch. Disconnecting does not free admission while
verification remains pending. /health and sessionless SSE also require identity.
Sessions bind to issuer + subject; each request reauthenticates. Streams end at
assertion expiry or their existing lifetime limit, whichever comes first.
Credential headers are removed before SDK dispatch. Request-scoped principals
contain no raw assertions.

Invocation guards cover operator AND inherited read-only handlers. The local
capabilities are metadata:read, executor:read, candidate:submit and
executor:plan:start, but the production verifier grants only metadata:read.
All ten registered tools may be discovered after authentication; discovering a
tool does not authorize invoking it. Cleanup stays unregistered on HTTP.

Future remote executor requests persist only verified owner issuer + subject in
request.json before spawn. Remote status/results require that owner; historical
ownerless jobs stay local-only. Caller arguments cannot assign ownership.
Authentication is not task approval; enabling planning needs separate bounded
work authorization, not merely another OAuth login.

MCP session IDs, candidate submittedBy text, and packet approval text are not
authenticated identities or grants. No permissive placeholder verifier exists.
Missing/invalid/expired assertions return 401; unapproved subjects and session
owner mismatches return 403. Tool permission failures are structured MCP denials;
job ownership failures are generic inaccessible/not-found results.

The separate legacy observer HTTP entry point and trusted local stdio/CLI
surfaces are not upgraded into authenticated remote endpoints by this change.
Do not expose the legacy observer as a substitute or bypass.

## Submit Authority Boundaries

Remote submission is denied in this rollout. The retained local submission
implementation, and any future authorized exposure, must preserve:
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
