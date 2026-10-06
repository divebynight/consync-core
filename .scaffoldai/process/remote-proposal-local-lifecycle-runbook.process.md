# Remote Proposal / Local Lifecycle Runbook

## Purpose

This runbook documents the current operator pattern for the bounded remote proposal flow and the local/manual lifecycle that follows it.

Use it when you need to answer four questions quickly:

1. What can a remote operator propose?
2. What must remain local and manual?
3. Which commands are the ergonomic human operator surface?
4. Which existing tests already cover the HTTPS SDC submit boundary?

This is a process document, not a contract. It explains the operating shape after the remote-proposal/local-lifecycle boundary was enforced.

## Authority Boundary

### Observer HTTPS Surface

The observer HTTPS MCP surface is read-only.

It may expose inspection tools such as status, visibility, and pending-question views, but it must not submit candidates and must not mutate lifecycle or git state.

### Operator HTTPS Surface

The operator HTTPS MCP surface authenticates Cloudflare Access assertions and
currently authorizes only the five metadata observation tools.

Candidate submission and both planning aliases remain registered but denied,
as do executor status/result retrieval. It must not intake, activate, claim, perform
writable execution, verify-run, close out, cleanup, commit, or mutate next-action.

Local JWT verification is implemented; this alone does not prove production
Cloudflare + ChatGPT integration. Start the production operator only in a
separately approved configuration/test window. Do not expose the legacy observer
HTTP implementation instead: it does not gain the operator's authentication.

### Local authentication configuration

Required startup environment values (placeholders only; do not store real values
or credentials in Git):

```text
SCAFFOLDAI_ACCESS_ISSUER=https://<team-name>.cloudflareaccess.com
SCAFFOLDAI_ACCESS_AUD=<dedicated lowercase 64-hex application AUD>
SCAFFOLDAI_ACCESS_SUBJECTS=["<approved Access user sub>"]
```

The allowlist supports 1-16 unique subjects, each assigned only metadata:read.
There is no configurable production grant for execution or other future
capabilities. Invalid/missing configuration throws before the listener starts.
Changing the allowlist requires an explicitly approved local reconfiguration.

The configured team endpoint supplies cached JWKS. Verification pins RS256,
issuer, audience, app-token type, approved human subject and token times.
No unsigned identity header, cookie, session ID, candidate attribution, or
caller-provided approval substitutes for the assertion.

All /mcp requests and /health require authentication. Authenticated sessions bind
to issuer + subject; another approved subject cannot reuse them. Credentials are
not forwarded into SDK handler context. Capabilities are checked at invocation,
including inherited read-only handlers; tool discovery is not authorization.

Missing/invalid/expired assertions return 401. Unknown subjects and session
mismatches return 403. Denied tools return a structured MCP error. Raw assertions
and upstream verification errors are never returned or logged.

Future remote job creation requires trusted owner metadata before spawning.
Remote reads require matching ownership; ownerless historical artifacts stay
local-only and are not adopted automatically. No production principal can start
or read executor jobs in this rollout. Local stdio/CLI behavior remains separate.

Cloudflare still must authenticate OAuth clients/users, enforce Access policy,
map opaque OAuth tokens to signed assertions, and handle revocation. Offline JWT
verification cannot immediately detect a revoked but unexpired assertion.
No local OAuth server or discovery endpoint is implemented.

### Temporary action-discovery diagnostics

The HTTP operator temporarily emits `[MCP diagnostic]` JSON records to stderr
for the first 128 HTTP requests per server instance, at most five records per
request (640 total). The counter saturates; later requests continue normally
without diagnostic records. No disk log, credentials, or configuration switch
is added. Startup and fixed maintenance messages remain separate.

Records contain only server-generated timestamps/request numbers, allowlisted
HTTP methods/routes, assertion presence, authentication outcome/fixed reason,
allowlisted MCP method class, session presence/found/owner booleans, and HTTP
status/completion/fixed protocol-error category. Unknown routes and method names
become `other`; query strings, bodies, tool arguments, identifiers, claim values,
credentials and upstream exception text are never emitted. Subject match is
reported only after cryptographic verification and a local allowlist comparison;
its absence does not mean a mismatch.

Authentication failures retain generic client errors. Local reason codes are
`missing_assertion`, `issuer_mismatch`, `audience_mismatch`, `signature_failure`,
`jwks_failure`, `expired`, `not_yet_valid`, `invalid_token_type`,
`unapproved_subject`, or `other_auth_failure`. Key resolution failures, including
an unknown key ID, are `jwks_failure`; no key ID is logged.

Protocol classification happens after authentication and JSON parsing, before
SDK dispatch: `initialize`, `notifications/initialized`, `tools/list`, or `other`.
Session lookup describes an existing session before any new initialization.
Response completion means Node finished writing, not proof that ChatGPT accepted
the response. A disconnect before headers has no status field. HTTP errors
without a more specific local category are `http_rejected`; JSON-RPC response
bodies are not inspected, so HTTP 200 alone does not prove semantic success.
Authentication may settle after a disconnect and keeps the same request number.

Use one manually approved ChatGPT discovery retry, then inspect local records.
No records means only that no request was captured: it does not establish a
particular edge failure, especially if the 128-request budget was exhausted.
Removal of this temporary instrumentation is a separate approved code change.
Diagnostics do not grant tools, relax authentication, or modify workspace state.

For the separately approved identity-binding test, `auth.js` also emits one
`[MCP identity]` record per verifier lifetime, after all cryptographic,
application-token and human-token checks pass and before subject approval.
It contains only `intended_email_match` and `same_assertion_subject` booleans.
The first compares the exact validated email's UTF-8 SHA-256 fingerprint with
the pinned intended-identity fingerprint, without case folding or trimming.
The second confirms the subject used by the unchanged allowlist check comes
from that same verified payload. A matching email never approves a subject.
The fingerprint override exists only in the verifier's synthetic-test dependency
seam; production has no environment/configuration override. The fingerprint
avoids plaintext identity in source; it is not encryption or anonymization.

This one-shot record is additional to the 640-record HTTP diagnostic budget.
Invalid tokens do not consume it; the first fully verified application assertion
does, even if its email does not match. Missing output is not a false comparison.
Use one approved Safari navigation and correlate the existing request/auth/HTTP
records with this observation; unrelated concurrent traffic makes attribution
uncertain. The record retains no email, subject or assertion for later approval.
Both booleans must be true before claiming identity binding, and changing the
allowlist still requires a separate approval.

### One-shot subject capture

To learn the verified Access `sub` for an explicitly approved allowlist change,
the operator may be armed for a single launch with
`SCAFFOLDAI_ACCESS_SUBJECT_CAPTURE=1` in the process environment only. Never add
it to the auth configuration file. Unset or empty leaves behavior unchanged; any
other value refuses startup. When armed, startup emits
`[MCP subject-capture] {"armed":true}`.

Capture shares the `[MCP identity]` one-shot: it is evaluated only for the first
assertion that passes every cryptographic, application-token and human-token
check. If `intended_email_match` is true it emits
`[MCP subject-capture] {"captured":true,"sub":"<verified sub>"}`; otherwise
`{"captured":false}` and nothing further is revealed for that operator lifetime.
Invalid assertions do not consume it. Email never approves a subject.

Capture does not enroll the subject, write any file, change the allowlist,
capabilities or HTTP responses. An unlisted subject still receives 403. Stop the
operator after capture, update `SCAFFOLDAI_ACCESS_SUBJECTS` only with explicit
approval, validate configuration, and restart without the arming variable.

### Local hardening limits

The operator entry point binds only to `127.0.0.1` (default port 3133). A
non-loopback HOST override is rejected. Cloudflare routing/authentication is
configured separately and was not changed by this hardening.

| Resource | Bound |
| --- | --- |
| HTTP request body | 256 KiB; oversized body returns 413 |
| Body collection deadline | 15 seconds; timeout returns 408 |
| MCP sessions | 16; excess initialization returns 503 |
| Session idle lifetime | 15 minutes; clients must reinitialize after expiry |
| Concurrent application requests, including authentication and health | 32; excess returns 503 |
| Concurrent MCP SSE streams, including authenticated bootstrap | 8 |
| SSE connection lifetime | Shorter of 60 seconds and assertion validity; reauthenticate on reconnect |
| HTTP sockets | 64; additional sockets are rejected |
| Access assertion | 8192 characters maximum; RS256 verification required |
| JWKS retrieval | 3 seconds, 64 KiB, no redirects |
| JWKS refresh/cache | Coalesced refresh; 30-second cooldown including failures; 10-minute key cache |
| Inbox entries | 100; further submissions refused, no automatic deletion |
| Concurrent planning executors | One per repository, across existing entry points |
| Retained executor artifact entries | 100; refuse new jobs rather than delete evidence |
| Output capture | 8,000-character tail per stream; more than 1 MiB per stream triggers termination |
| JSON artifact reads | 128 KiB; larger artifacts are refused |

The retained local executor flow uses scaffoldai_executor_plan_start, then
scaffoldai_executor_plan_status and scaffoldai_executor_plan_result with the
returned UUIDv4. These tools are denied over HTTP in the initial rollout.
Historical non-UUID test labels are no longer accepted as job identifiers.

The legacy scaffoldai_executor_plan adapter retains its artifact-backed async
implementation and admission/retention limits, behind the invocation guard.
It cannot execute under the initial remote policy.
POST requests return JSON responses rather than opening additional SSE streams.
GET SSE/bootstrap streams retain the stream-count and connection-lifetime limits.

scaffoldai_executor_plan_cleanup is not exposed through HTTP. Trusted local
cleanup remains explicit: it preserves running/uncertain jobs and never infers
cancellation from elapsed time. Matching terminal status/result evidence is
required for removal. No historical artifacts are automatically pruned.

The admission lock is .scaffoldai/runtime/executor-plans/.executor.lock.
After a crash or uncertain termination, stop and inspect local process/evidence
state. Do not delete a lock simply because its timestamp is old, or retry by
creating another operator. Local recovery needs human confirmation that the
owned executor is no longer running; there is no remote unlock/cancel tool.

Timeouts, excessive output, and orderly operator shutdown terminate the owned
async executor, escalating after two seconds. POSIX execution uses a separate
process group; Windows and the trusted-local legacy synchronous path have only
child-level termination. Escaped groups and hostile local filesystem races are
not sandboxed. If termination is not confirmed, status remains running with an
explicit error and admission remains locked.

HTTP responses omit executor PIDs/absolute repository-root fields, replace known
repository-path prefixes, and avoid returning raw runner exceptions. Local
diagnostics retain detail. Planning output and readonly project observations
may still contain confidential material: this is not a comprehensive redactor.

Regression commands:

```sh
npm run test:scaffoldai:security
npm run test:executor:plan:async
node src/test/unit-scaffoldai-mcp-executor-plan.js
npm run test:mcp:operator:http
```

Security tests use generated local signing keys, the real JOSE verifier with
mocked JWKS retrieval, isolated artifacts, and disposable loopback servers on
ephemeral ports. No production entry point, real token, or Cloudflare request is
needed. The process-group test launches only harmless Node fixtures, not Copilot.

### Local Lifecycle Surface

Local/manual lifecycle commands own the full lifecycle after a candidate exists in `.scaffoldai/inbox/`.

Only local commands may perform intake, activation, claim, verification, close-feature, cleanup, and idle recovery.

## Remote Proposal / Local Lifecycle Flow

Historical flow below is retained for context. Step 1 is disabled by the current
metadata-only HTTP policy; authentication does not re-enable it.

1. A remote operator submits a canonical SDC candidate through the HTTPS operator submit-only surface.
2. The candidate lands only in `.scaffoldai/inbox/` and does not mutate runtime or lifecycle state.
3. A human operator runs local intake and activation when the candidate is ready.
4. Local verification runs against the active packet and persists canonical verification evidence.
5. Close-feature reads packet-bound verification evidence and fails closed when evidence is missing, stale, failed, or bound to a different packet.
6. Cleanup runs only after successful closeout and remains narrow and idempotent.
7. A final status check confirms the workspace has returned to a clean idle state with no active packet.

## Canonical SDC Candidate Expectations

A candidate that enters through the HTTPS submit boundary should be:

- packet-shaped and intake-compatible
- explicit about `MODE`, `EXECUTION SURFACE`, `APPROVAL`, `GOAL`, `TASKS`, `VERIFY`, `OUTPUT`, and `CONSTRAINTS`
- bounded to a single proposal, not a request for autonomous execution
- free of path-based submission tricks or broad filesystem intent
- safe to reject deterministically when duplicate, pending, or malformed

The submit surface is proposal creation only. It is not a lifecycle engine.

## Makefile Operator Workflow

The Makefile is the ergonomic human operator surface over existing npm and CLI primitives.

Primary targets:

- `make scaffold-status` — show current ScaffoldAI status
- `make scaffold-start` — intake + activate the latest intake-compatible candidate
- `make verify-scaffold` — run `npm run verify:scaffoldai`
- `make scaffold-close` — run the gated close-feature flow

Support targets that remain useful when working manually:

- `make scaffold-intake` — intake the latest intake-compatible candidate
- `make scaffold-activate` — activate the latest accepted packet

These targets are wrappers only. They do not add authority, weaken gates, or replace the underlying lifecycle primitives.

## Process / Product Boundary

ScaffoldAI is the process and orchestration harness.

Consync is the product being built inside that harness.

Boundary rules:

- `.scaffoldai/` holds process state, process docs, and harness artifacts
- `.consync/` holds product-facing docs and product metadata
- `src/` and the desktop runtime implement Consync behavior
- process packets should not collapse product and process concerns into one active lifecycle context after the boundary is enforced

If a packet needs both process and product work, it should be explicit about that boundary and keep the process docs separate from product changes.

## HTTPS SDC Submit Coverage Checklist

Submission mechanics remain covered locally. HTTP tests now prove authenticated
submission denial rather than successful remote submission.

| Checklist item | Coverage evidence | Status |
|---|---|---|
| Valid local candidate submit | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js` | Covered |
| Invalid SDC rejection | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js` | Covered |
| Autonomous wording rejection | `src/test/unit-scaffoldai-packet-intake.js` and the shared intake validator used by submit | Covered |
| Duplicate / pending / collision rejection | `src/test/validate-remote-submit-duplicate-and-pending-guards.js` | Covered |
| Submit path does not mutate active runtime | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate next-action state | `src/test/unit-scaffoldai-mcp-submit-sdc-candidate.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate lifecycle state | `src/test/validate-remote-submit-duplicate-and-pending-guards.js` | Covered |
| Authenticated remote submission and planning are denied | `src/test/mcp-operator-auth-security.js`, `src/test/mcp-operator-http-e2e.js` | Covered |
| Submit path does not mutate git | Existing submit tests assert bounded inbox-only writes and no archive mutation | Covered |
| Observer surface cannot submit | `src/test/mcp-readonly-chatgpt-compatibility.js`, `src/test/mcp-readonly-http-e2e.js`, `src/test/mcp-readonly-stdio-e2e.js` | Covered |
| Operator surface cannot lifecycle-mutate | `src/test/mcp-operator-http-e2e.js` | Covered |
| Close-feature requires packet-bound verify evidence | `src/test/unit-scaffoldai-lifecycle-wrappers.js`, `src/test/unit-scaffoldai-lifecycle-simulation.js` | Covered |
| Stale, failed, or missing verification evidence fails closed | `src/test/unit-scaffoldai-lifecycle-wrappers.js`, `src/test/unit-scaffoldai-closeout.js` | Covered |

## Discoverability

Start here when you need the operator pattern:

- `.scaffoldai/process/runbook.process.md`
- `.scaffoldai/README.md`
- `README.md`
- `.scaffoldai/contracts/https-operator-submit-only.contract.md`

For packet execution and lifecycle details, continue with the closeout and verification docs linked from the main runbook.
